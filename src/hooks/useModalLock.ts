import { useEffect } from 'react'
import { useStore } from '../store'

/**
 * Holds the global modal lock (isModalOpen + body scroll lock) while `active` is true.
 * Ref-counted in the store, so a nested overlay closing never re-enables page chrome,
 * page scrolling or the 3D render loop while its parent overlay is still open.
 */
export function useModalLock(active = true) {
  useEffect(() => {
    if (!active) return
    return useStore.getState().acquireModalLock()
  }, [active])
}
