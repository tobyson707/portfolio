// AUTHORITATIVE WORKS GALLERY MANIFEST
// Synchronized with user illustration categories: Paintings (51), Sketches (87), Studies (19)

export type IllustrationCategory = 'Paintings' | 'Sketches' | 'Studies'

export interface IllustrationImage {
  id: string
  src: string
  title: string
  category: IllustrationCategory
  width?: number
  height?: number
}

export interface IllustrationGallery {
  paintings: IllustrationImage[]
  sketches: IllustrationImage[]
  studies: IllustrationImage[]
}

/**
 * Derives a clean, title-cased title from an image filename.
 */
export function deriveTitleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, '')
  const words = base.replace(/[-_]+/g, ' ').trim().split(/\s+/)
  return words
    .map((word) => {
      if (/^\d+$/.test(word)) return word
      if (/^img$/i.test(word)) return 'IMG'
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

const paintingsList: string[] = [
  'Untitled-7-j.webp',
  'Untitled-20.webp',
  'finish3.webp',
  'finish-bobby.webp',
  'IMG_1532.webp',
  'IMG_2591.webp',
  'IMG_2596.webp',
  'IMG_2597.webp',
  'IMG_2602.webp',
  'IMG_1547.webp',
  'SOLARA.webp',
  'Untitled_Artwork(5).webp',
  'Untitled_Artwork(18).webp',
  'Untitled-22 - final.webp',
  'Untitled-32.webp',
  'finish.webp',
  'IMG_0518.webp',
  'IMG_1913.webp',
  'IMG_1921.webp',
  'Untitled_Artwork(9).webp',
  'Untitled_Artwork(13).webp',
  'Untitled-17.webp',
  'IMG_1128.webp',
  'IMG_1635.webp',
  'IMG_1676.webp',
  'tobi-john-img-20210410-222600.webp',
  'Untitled_Artwork(4).webp',
  'Untitled_Artwork(10).webp',
  'Untitled-29.webp',
  'Untitled-35.webp',
  'Untitled-36.webp',
  'Untitled-37.webp',
  'IMG_0928.webp',
  'IMG_1679.webp',
  'IMG_0061.webp',
  'IMG_1152.webp',
  'IMG_1536.webp',
  'IMG_2092.webp',
  'IMG_0053.webp',
  'IMG_0901.webp',
  'IMG_2099.webp',
  'Untitled_Artwork(8).webp',
  'IMG_0073.webp',
  'IMG_3344.webp',
  'IMG_2044.webp',
  'IMG_2110.webp',
  'IMG_1637.webp',
  'IMG_1597.webp',
  'black gwen.webp',
  'Untitled-2=2.webp',
  'Untitled-3.webp'
]

const sketchesList: string[] = [
  'IMG_2380.webp',
  'IMG_2592.webp',
  'IMG_2593.webp',
  'IMG_2594.webp',
  'IMG_2595.webp',
  'IMG_2598.webp',
  'IMG_2600.webp',
  'IMG_0007.webp',
  'IMG_0839.webp',
  'lulu_finish.webp',
  'Untitled-12 - Copy.webp',
  'Untitled-40.webp',
  'IMG_1114.webp',
  'Untitled_Artwork(1).webp',
  'Untitled_Artwork(15).webp',
  'Untitled-12.webp',
  'Untitled-14.webp',
  'Untitled-24.webp',
  'Untitled-26-copy.webp',
  'Untitled-34.webp',
  'Untitled-39.webp',
  'IMG_1106.webp',
  'IMG_1108.webp',
  'IMG_1112.webp',
  'IMG_1357.webp',
  'IMG_1526.webp',
  'Untitled-15.webp',
  'Untitled-16.webp',
  'ABUJA.webp',
  'IMG_1118.webp',
  'IMG_1143.webp',
  'IMG_1517.webp',
  'IMG_1523.webp',
  'IMG_1525.webp',
  'IMG_1576.webp',
  'Untitled_Artwork 1.webp',
  'Untitled_Artwork 3.webp',
  'Untitled_Artwork(12).webp',
  'Untitled-30.webp',
  'IMG_0610.webp',
  'IMG_0855.webp',
  'IMG_1374.webp',
  'IMG_1382.webp',
  'IMG_1422.webp',
  'IMG_1428.webp',
  'IMG_1431.webp',
  'IMG_1436.webp',
  'IMG_1445.webp',
  'IMG_1454.webp',
  'IMG_1488.webp',
  'IMG_1493.webp',
  'IMG_1500.webp',
  'UNTITLED_.webp',
  'Untitled_Artwork(7).webp',
  'Untitled-28.webp',
  'IMG_0677.webp',
  'IMG_1412.webp',
  'IMG_1415.webp',
  'IMG_1420.webp',
  'IMG_1447.webp',
  'IMG_1460.webp',
  'Levi.webp',
  'IMG_1544.webp',
  'IMG_0271.webp',
  'IMG_2807.webp',
  'Untitled-39-sketch.webp',
  'Untitled_Artwork(17).webp',
  'IMG_1887.webp',
  'Untitled-31.webp',
  'expressionss2.webp',
  'IMG_1105.webp',
  'Untitled-33.webp',
  'Untitled-18-sketch.webp',
  'lulu.webp',
  'SKETCH001.webp',
  'Untitled-11.webp',
  'Untitled-18.webp',
  'Untitled-34-flat.webp',
  'Untitled-9.webp',
  'Untitled-13.webp',
  'Untitled-19.webp',
  'Untitled-25.webp',
  'consumed.webp',
  'IMG_1319.webp',
  'IMG_1324.webp',
  'SKETCH002.webp',
  'IMG_2265.webp'
]

const studiesList: string[] = [
  'car-gt3rs.webp',
  'IMG_1209.webp',
  'IMG_1161.webp',
  'IMG_1168.webp',
  'IMG_1176.webp',
  'IMG_1188.webp',
  'IMG_1195.webp',
  'IMG_1203.webp',
  'IMG_1317.webp',
  'Iso-house.webp',
  'Cabin.webp',
  'Church.webp',
  'IMG_1328.webp',
  'IMG_1343.webp',
  'IMG_1539.webp',
  'IMG_1214.webp',
  'IMG_1239.webp',
  'IMG_1223.webp',
  'Untitled_Artwork 2.webp'
]

export const illustrationGallery: IllustrationGallery = {
  paintings: paintingsList.map((filename) => ({
    id: `paintings-${filename.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
    src: `/images/works/Illustrations/Paintings/${filename}`,
    title: deriveTitleFromFilename(filename),
    category: 'Paintings' as IllustrationCategory,
    width: 2048,
    height: 2048,
  })),
  sketches: sketchesList.map((filename) => ({
    id: `sketches-${filename.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
    src: `/images/works/Illustrations/Sketches/${filename}`,
    title: deriveTitleFromFilename(filename),
    category: 'Sketches' as IllustrationCategory,
    width: 2048,
    height: 2048,
  })),
  studies: studiesList.map((filename) => ({
    id: `studies-${filename.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
    src: `/images/works/Illustrations/Studies/${filename}`,
    title: deriveTitleFromFilename(filename),
    category: 'Studies' as IllustrationCategory,
    width: 2048,
    height: 2048,
  })),
}

export const allIllustrationImages: IllustrationImage[] = [
  ...illustrationGallery.paintings,
  ...illustrationGallery.sketches,
  ...illustrationGallery.studies,
]

export function getCategoryImages(categoryOrSlug: string): IllustrationImage[] {
  const norm = categoryOrSlug.toLowerCase().trim()
  if (norm === 'paintings' || norm === 'painting') return illustrationGallery.paintings
  if (norm === 'sketches' || norm === 'sketch') return illustrationGallery.sketches
  if (norm === 'studies' || norm === 'study') return illustrationGallery.studies
  if (
    norm === 'all' ||
    norm === 'all works' ||
    norm === 'all illustrations' ||
    norm === 'all-works' ||
    norm === 'illustrations' ||
    norm === 'illustration'
  ) {
    return allIllustrationImages
  }
  return []
}

export function reportMissingImage(src: string, category: string): void {
  console.warn(
    `[Asset Integrity Notice] Image at "${src}" in category "${category}" was queried.`
  )
}
