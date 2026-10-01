import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import type { Work, Category, WorkGroupItem, MediaItem, SiteContentData } from './contentStore'
import { useContentStore, normalizeStatsData } from './contentStore'

let activeUnsubscribes: Unsubscribe[] = []
let isSyncInitialized = false

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string
  operationType: OperationType
  path: string | null
  authInfo: {
    userId?: string | null
    email?: string | null
    emailVerified?: boolean | null
    isAnonymous?: boolean | null
    tenantId?: string | null
    providerInfo?: {
      providerId?: string | null
      email?: string | null
    }[]
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo))
  throw new Error(JSON.stringify(errInfo))
}

/**
 * Remove undefined values to ensure Firestore writes succeed cleanly
 */
function cleanPayload<T extends Record<string, any>>(obj: T): T {
  const result: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = cleanPayload(value)
      } else {
        result[key] = value
      }
    }
  }
  return result
}

/**
 * Collect all data from Firebase Firestore
 */
export async function collectDataFromFirebase(): Promise<{
  worksCount: number
  categoriesCount: number
  workGroupsCount: number
  mediaCount: number
  siteConfigLoaded: boolean
}> {
  try {
    const isUserAdmin = Boolean(auth.currentUser)

    // 1. Collect site sections
    const siteSnap = await getDocs(collection(db, 'site'))
    const siteDataPartial: Partial<SiteContentData> = {}
    siteSnap.forEach((docSnap) => {
      const id = docSnap.id as keyof SiteContentData
      if (id === 'stats') {
        siteDataPartial.stats = normalizeStatsData(docSnap.data())
      } else if (['hero', 'about', 'resume', 'contact', 'social', 'worksConfig'].includes(id)) {
        siteDataPartial[id] = docSnap.data() as any
      }
    })

    // 2. Collect works
    let worksList: Work[] = []
    try {
      const worksRef = collection(db, 'works')
      const worksQuery = isUserAdmin
        ? worksRef
        : query(worksRef, where('status', '==', 'published'))
      const worksSnap = await getDocs(worksQuery)
      worksList = worksSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Work))
    } catch (e) {
      console.warn('[Firestore] Could not fetch works collection:', e)
    }

    // 3. Collect categories
    let categoriesList: Category[] = []
    try {
      const catRef = collection(db, 'categories')
      const catQuery = isUserAdmin
        ? catRef
        : query(catRef, where('status', 'in', ['active', 'published']))
      const catSnap = await getDocs(catQuery)
      categoriesList = catSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Category))
    } catch (e) {
      console.warn('[Firestore] Could not fetch categories collection:', e)
    }

    // 4. Collect workGroups
    let workGroupsList: WorkGroupItem[] = []
    try {
      const wgRef = collection(db, 'workGroups')
      const wgSnap = await getDocs(wgRef)
      workGroupsList = wgSnap.docs.map((d) => ({ ...d.data(), id: d.id } as WorkGroupItem))
    } catch (e) {
      console.warn('[Firestore] Could not fetch workGroups collection:', e)
    }

    // 5. Collect media (publicly readable for display and cover resolution)
    let mediaList: MediaItem[] = []
    try {
      const mediaSnap = await getDocs(collection(db, 'media'))
      mediaList = mediaSnap.docs.map((d) => ({ ...d.data(), id: d.id } as MediaItem))
    } catch (e) {
      console.warn('[Firestore] Could not fetch media collection:', e)
    }

    // Update store state if collections have data
    const store = useContentStore.getState()

    useContentStore.setState({
      works: worksList.sort((a, b) => a.order - b.order),
      categories: categoriesList.sort((a, b) => a.order - b.order),
      workGroups: workGroupsList.sort((a, b) => a.order - b.order),
      media: mediaList,
    })
    if (Object.keys(siteDataPartial).length > 0) {
      useContentStore.setState({
        site: {
          ...store.site,
          ...siteDataPartial,
        },
      })
    }

    useContentStore.setState({
      isFirebaseConnected: true,
      lastSyncError: null,
      syncStatusMessage: `Collected from Firebase (${worksList.length} works, ${categoriesList.length} categories, ${workGroupsList.length} groups)`,
    })

    return {
      worksCount: worksList.length,
      categoriesCount: categoriesList.length,
      workGroupsCount: workGroupsList.length,
      mediaCount: mediaList.length,
      siteConfigLoaded: Object.keys(siteDataPartial).length > 0,
    }
  } catch (error: any) {
    console.error('[Firestore] Error collecting data:', error)
    useContentStore.setState({
      lastSyncError: error.message || 'Error collecting from Firebase',
      syncStatusMessage: 'Firebase collection failed',
    })
    if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.GET, 'site')
    }
    throw error
  }
}

/**
 * Seed Firestore with initial portfolio data if currently empty
 */
export async function seedFirestoreIfEmpty(): Promise<boolean> {
  try {
    const store = useContentStore.getState()
    const worksSnap = await getDocs(collection(db, 'works'))

    // If works collection already has data, do not overwrite
    if (!worksSnap.empty) {
      return false
    }

    console.log('[Firestore] Database is empty. Seeding initial portfolio content to Firebase...')

    // 1. Seed categories
    for (const cat of store.categories) {
      await setDoc(doc(db, 'categories', cat.id), cleanPayload(cat))
    }

    // 2. Seed workGroups
    for (const group of store.workGroups) {
      await setDoc(doc(db, 'workGroups', group.id), cleanPayload(group))
    }

    // 3. Seed works
    for (const work of store.works) {
      await setDoc(doc(db, 'works', work.id), cleanPayload(work))
    }

    // 4. Seed media
    for (const item of store.media) {
      await setDoc(doc(db, 'media', item.id), cleanPayload(item))
    }

    // 5. Seed site sections
    await setDoc(doc(db, 'site', 'hero'), cleanPayload(store.site.hero))
    await setDoc(doc(db, 'site', 'about'), cleanPayload(store.site.about))
    await setDoc(doc(db, 'site', 'resume'), cleanPayload(store.site.resume))
    await setDoc(doc(db, 'site', 'stats'), cleanPayload(store.site.stats))
    await setDoc(doc(db, 'site', 'contact'), cleanPayload(store.site.contact))
    await setDoc(doc(db, 'site', 'social'), cleanPayload(store.site.social))
    if (store.site.worksConfig) {
      await setDoc(doc(db, 'site', 'worksConfig'), cleanPayload(store.site.worksConfig))
    }

    console.log('[Firestore] Successfully seeded initial content into Firestore!')
    useContentStore.setState({
      isFirebaseConnected: true,
      syncStatusMessage: 'Firebase initialized with portfolio content',
    })
    return true
  } catch (error) {
    console.error('[Firestore] Seeding skipped or encountered error:', error)
    return false
  }
}

/**
 * Setup Realtime Listeners to Firestore collections
 */
export function startFirestoreRealtimeSync(): () => void {
  // Clear any existing subscriptions
  stopFirestoreRealtimeSync()

  const isUserAdmin = Boolean(auth.currentUser)

  try {
    // 1. Site sections listener
    const unsubSite = onSnapshot(
      collection(db, 'site'),
      (snapshot) => {
        const siteDataPartial: Partial<SiteContentData> = {}
        snapshot.forEach((docSnap) => {
          const id = docSnap.id as keyof SiteContentData
          if (id === 'stats') {
            siteDataPartial.stats = normalizeStatsData(docSnap.data())
          } else if (['hero', 'about', 'resume', 'contact', 'social', 'worksConfig'].includes(id)) {
            siteDataPartial[id] = docSnap.data() as any
          }
        })
        if (Object.keys(siteDataPartial).length > 0) {
          useContentStore.setState((s) => ({
            site: { ...s.site, ...siteDataPartial },
            isFirebaseConnected: true,
          }))
        }
      },
      (error) => {
        console.warn('[Firestore] Site listener error:', error.message)
      }
    )
    activeUnsubscribes.push(unsubSite)

    // 2. Works collection listener
    const worksRef = collection(db, 'works')
    const worksQuery = isUserAdmin
      ? worksRef
      : query(worksRef, where('status', '==', 'published'))

    const unsubWorks = onSnapshot(
      worksQuery,
      (snapshot) => {
        const works = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Work))
        useContentStore.setState({
          works: works.sort((a, b) => a.order - b.order),
          isFirebaseConnected: true,
        })
      },
      (error) => {
        console.warn('[Firestore] Works listener error:', error.message)
      }
    )
    activeUnsubscribes.push(unsubWorks)

    // 3. Categories collection listener
    const catRef = collection(db, 'categories')
    const catQuery = isUserAdmin
      ? catRef
      : query(catRef, where('status', 'in', ['active', 'published']))

    const unsubCats = onSnapshot(
      catQuery,
      (snapshot) => {
        const categories = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Category))
        useContentStore.setState({
          categories: categories.sort((a, b) => a.order - b.order),
          isFirebaseConnected: true,
        })
      },
      (error) => {
        console.warn('[Firestore] Categories listener error:', error.message)
      }
    )
    activeUnsubscribes.push(unsubCats)

    // 4. WorkGroups collection listener
    const unsubGroups = onSnapshot(
      collection(db, 'workGroups'),
      (snapshot) => {
        const groups = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as WorkGroupItem))
        useContentStore.setState({
          workGroups: groups.sort((a, b) => a.order - b.order),
          isFirebaseConnected: true,
        })
      },
      (error) => {
        console.warn('[Firestore] WorkGroups listener error:', error.message)
      }
    )
    activeUnsubscribes.push(unsubGroups)

    // 5. Media collection listener (publicly readable, keep state fresh across all clients)
    const unsubMedia = onSnapshot(
      collection(db, 'media'),
      (snapshot) => {
        const media = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as MediaItem))
        useContentStore.setState({ media, isFirebaseConnected: true })
      },
      (error) => {
        console.warn('[Firestore] Media listener error:', error.message)
      }
    )
    activeUnsubscribes.push(unsubMedia)
  } catch (err) {
    console.warn('[Firestore] Could not attach realtime listeners:', err)
  }

  return stopFirestoreRealtimeSync
}

export function stopFirestoreRealtimeSync() {
  activeUnsubscribes.forEach((unsub) => unsub())
  activeUnsubscribes = []
}

/**
 * Write operations to Firestore
 */
export async function syncWorkToFirestore(work: Work): Promise<void> {
  try {
    await setDoc(doc(db, 'works', work.id), cleanPayload(work))
  } catch (error) {
    console.error('[Firestore] Error saving work:', error)
  }
}

export async function deleteWorkFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'works', id))
  } catch (error) {
    console.error('[Firestore] Error deleting work:', error)
  }
}

export async function syncCategoryToFirestore(category: Category): Promise<void> {
  try {
    await setDoc(doc(db, 'categories', category.id), cleanPayload(category))
  } catch (error) {
    console.error('[Firestore] Error saving category:', error)
  }
}

export async function deleteCategoryFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'categories', id))
  } catch (error) {
    console.error('[Firestore] Error deleting category:', error)
  }
}

export async function syncWorkGroupToFirestore(group: WorkGroupItem): Promise<void> {
  try {
    await setDoc(doc(db, 'workGroups', group.id), cleanPayload(group))
  } catch (error) {
    console.error('[Firestore] Error saving workGroup:', error)
  }
}

export async function deleteWorkGroupFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'workGroups', id))
  } catch (error) {
    console.error('[Firestore] Error deleting workGroup:', error)
  }
}

export async function syncMediaToFirestore(media: MediaItem): Promise<void> {
  try {
    await setDoc(doc(db, 'media', media.id), cleanPayload(media))
  } catch (error) {
    console.error('[Firestore] Error saving media:', error)
    handleFirestoreError(error, OperationType.WRITE, `media/${media.id}`)
  }
}

export async function deleteMediaFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'media', id))
  } catch (error) {
    console.error('[Firestore] Error deleting media:', error)
    handleFirestoreError(error, OperationType.DELETE, `media/${id}`)
  }
}

export async function syncSiteSectionToFirestore(
  section: keyof SiteContentData,
  data: any
): Promise<void> {
  try {
    await setDoc(doc(db, 'site', section), cleanPayload(data), { merge: true })
  } catch (error) {
    console.error('[Firestore] Error saving site section:', error)
  }
}

/**
 * Push all local store state to Firestore (full sync/publish)
 */
export async function pushAllToFirestore(): Promise<void> {
  const store = useContentStore.getState()
  useContentStore.setState({ isSyncing: true, syncStatusMessage: 'Pushing to Firebase...' })

  try {
    // Categories
    for (const cat of store.categories) {
      await setDoc(doc(db, 'categories', cat.id), cleanPayload(cat))
    }
    // WorkGroups
    for (const group of store.workGroups) {
      await setDoc(doc(db, 'workGroups', group.id), cleanPayload(group))
    }
    // Works
    for (const work of store.works) {
      await setDoc(doc(db, 'works', work.id), cleanPayload(work))
    }
    // Media
    for (const item of store.media) {
      await setDoc(doc(db, 'media', item.id), cleanPayload(item))
    }
    // Site
    await setDoc(doc(db, 'site', 'hero'), cleanPayload(store.site.hero))
    await setDoc(doc(db, 'site', 'about'), cleanPayload(store.site.about))
    await setDoc(doc(db, 'site', 'resume'), cleanPayload(store.site.resume))
    await setDoc(doc(db, 'site', 'stats'), cleanPayload(store.site.stats))
    await setDoc(doc(db, 'site', 'contact'), cleanPayload(store.site.contact))
    await setDoc(doc(db, 'site', 'social'), cleanPayload(store.site.social))
    if (store.site.worksConfig) {
      await setDoc(doc(db, 'site', 'worksConfig'), cleanPayload(store.site.worksConfig))
    }

    useContentStore.setState({
      isSyncing: false,
      isFirebaseConnected: true,
      lastSyncError: null,
      syncStatusMessage: 'All data successfully pushed to Firebase',
    })
  } catch (error: any) {
    console.error('[Firestore] Push all error:', error)
    useContentStore.setState({
      isSyncing: false,
      lastSyncError: error.message || 'Push failed',
      syncStatusMessage: 'Failed to push to Firebase',
    })
    throw error
  }
}

/**
 * Auto-initialize Firestore sync on client boot
 */
export function initializeFirestoreSync() {
  if (typeof window === 'undefined') return
  if (isSyncInitialized) return
  isSyncInitialized = true

  // Initial collect
  collectDataFromFirebase().catch((err) => {
    console.log('[Firestore] Initial collect message:', err.message || err)
  })

  // Start real-time sync
  startFirestoreRealtimeSync()

  // Re-sync on auth change (e.g. admin login / logout)
  try {
    auth.onAuthStateChanged(() => {
      startFirestoreRealtimeSync()
    })
  } catch {
    // Ignore in SSR
  }
}
