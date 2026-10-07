// AUTO-GENERATED & MAINTAINABLE ILLUSTRATION MANIFEST
// Generated from authoritative recursive disk scan of public/images/works/Illustrations/
// DO NOT delete images. Run "npm run sync:manifest" to refresh after adding files.

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
 * Derives a readable, title-cased title from an image filename.
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

/**
 * Authoritative gallery manifest mapping exactly the 3 categories directly to verified on-disk files.
 */
export const illustrationGallery: IllustrationGallery = {
  "paintings": [
    {
      "id": "paintings-black-gwen-webp",
      "src": "/images/works/Illustrations/Paintings/black gwen.webp",
      "title": "Black Gwen",
      "category": "Paintings",
      "width": 2100,
      "height": 2100
    },
    {
      "id": "paintings-finish-bobby-webp",
      "src": "/images/works/Illustrations/Paintings/finish-bobby.webp",
      "title": "Finish Bobby",
      "category": "Paintings",
      "width": 2100,
      "height": 2100
    },
    {
      "id": "paintings-finish-webp",
      "src": "/images/works/Illustrations/Paintings/finish.webp",
      "title": "Finish",
      "category": "Paintings",
      "width": 2108,
      "height": 1109
    },
    {
      "id": "paintings-finish3-webp",
      "src": "/images/works/Illustrations/Paintings/finish3.webp",
      "title": "Finish3",
      "category": "Paintings",
      "width": 2100,
      "height": 2100
    },
    {
      "id": "paintings-img-0928-webp",
      "src": "/images/works/Illustrations/Paintings/IMG_0928.webp",
      "title": "IMG 0928",
      "category": "Paintings",
      "width": 1010,
      "height": 1010
    },
    {
      "id": "paintings-img-1128-webp",
      "src": "/images/works/Illustrations/Paintings/IMG_1128.webp",
      "title": "IMG 1128",
      "category": "Paintings",
      "width": 1615,
      "height": 1615
    },
    {
      "id": "paintings-img-1532-webp",
      "src": "/images/works/Illustrations/Paintings/IMG_1532.webp",
      "title": "IMG 1532",
      "category": "Paintings",
      "width": 2100,
      "height": 2500
    },
    {
      "id": "paintings-img-1536-webp",
      "src": "/images/works/Illustrations/Paintings/IMG_1536.webp",
      "title": "IMG 1536",
      "category": "Paintings",
      "width": 2100,
      "height": 2500
    },
    {
      "id": "paintings-img-1547-webp",
      "src": "/images/works/Illustrations/Paintings/IMG_1547.webp",
      "title": "IMG 1547",
      "category": "Paintings",
      "width": 2100,
      "height": 2500
    },
    {
      "id": "paintings-img-1635-webp",
      "src": "/images/works/Illustrations/Paintings/IMG_1635.webp",
      "title": "IMG 1635",
      "category": "Paintings",
      "width": 1062,
      "height": 1062
    },
    {
      "id": "paintings-img-1913-webp",
      "src": "/images/works/Illustrations/Paintings/IMG_1913.webp",
      "title": "IMG 1913",
      "category": "Paintings",
      "width": 1649,
      "height": 1649
    },
    {
      "id": "paintings-img-2591-webp",
      "src": "/images/works/Illustrations/Paintings/IMG_2591.webp",
      "title": "IMG 2591",
      "category": "Paintings",
      "width": 1694,
      "height": 1694
    },
    {
      "id": "paintings-img-2596-webp",
      "src": "/images/works/Illustrations/Paintings/IMG_2596.webp",
      "title": "IMG 2596",
      "category": "Paintings",
      "width": 957,
      "height": 1140
    },
    {
      "id": "paintings-img-2597-webp",
      "src": "/images/works/Illustrations/Paintings/IMG_2597.webp",
      "title": "IMG 2597",
      "category": "Paintings",
      "width": 1182,
      "height": 1407
    },
    {
      "id": "paintings-img-2602-webp",
      "src": "/images/works/Illustrations/Paintings/IMG_2602.webp",
      "title": "IMG 2602",
      "category": "Paintings",
      "width": 1332,
      "height": 1586
    },
    {
      "id": "paintings-solara-webp",
      "src": "/images/works/Illustrations/Paintings/SOLARA.webp",
      "title": "Solara",
      "category": "Paintings",
      "width": 3240,
      "height": 1822
    },
    {
      "id": "paintings-tobi-john-img-20210410-222600-webp",
      "src": "/images/works/Illustrations/Paintings/tobi-john-img-20210410-222600.webp",
      "title": "Tobi John IMG 20210410 222600",
      "category": "Paintings",
      "width": 937,
      "height": 1124
    },
    {
      "id": "paintings-untitled-artwork-10--webp",
      "src": "/images/works/Illustrations/Paintings/Untitled_Artwork(10).webp",
      "title": "Untitled Artwork(10)",
      "category": "Paintings",
      "width": 1446,
      "height": 1446
    },
    {
      "id": "paintings-untitled-artwork-13--webp",
      "src": "/images/works/Illustrations/Paintings/Untitled_Artwork(13).webp",
      "title": "Untitled Artwork(13)",
      "category": "Paintings",
      "width": 1380,
      "height": 1642
    },
    {
      "id": "paintings-untitled-artwork-4--webp",
      "src": "/images/works/Illustrations/Paintings/Untitled_Artwork(4).webp",
      "title": "Untitled Artwork(4)",
      "category": "Paintings",
      "width": 1253,
      "height": 1253
    },
    {
      "id": "paintings-untitled-artwork-5--webp",
      "src": "/images/works/Illustrations/Paintings/Untitled_Artwork(5).webp",
      "title": "Untitled Artwork(5)",
      "category": "Paintings",
      "width": 2296,
      "height": 2296
    },
    {
      "id": "paintings-untitled-artwork-8--webp",
      "src": "/images/works/Illustrations/Paintings/Untitled_Artwork(8).webp",
      "title": "Untitled Artwork(8)",
      "category": "Paintings",
      "width": 4000,
      "height": 2250
    },
    {
      "id": "paintings-untitled-artwork-9--webp",
      "src": "/images/works/Illustrations/Paintings/Untitled_Artwork(9).webp",
      "title": "Untitled Artwork(9)",
      "category": "Paintings",
      "width": 1888,
      "height": 1888
    },
    {
      "id": "paintings-untitled-17-webp",
      "src": "/images/works/Illustrations/Paintings/Untitled-17.webp",
      "title": "Untitled 17",
      "category": "Paintings",
      "width": 1257,
      "height": 1257
    },
    {
      "id": "paintings-untitled-2-2-webp",
      "src": "/images/works/Illustrations/Paintings/Untitled-2=2.webp",
      "title": "Untitled 2=2",
      "category": "Paintings",
      "width": 2100,
      "height": 2100
    },
    {
      "id": "paintings-untitled-20-webp",
      "src": "/images/works/Illustrations/Paintings/Untitled-20.webp",
      "title": "Untitled 20",
      "category": "Paintings",
      "width": 2100,
      "height": 2100
    },
    {
      "id": "paintings-untitled-22---final-webp",
      "src": "/images/works/Illustrations/Paintings/Untitled-22 - final.webp",
      "title": "Untitled 22 Final",
      "category": "Paintings",
      "width": 3678,
      "height": 2802
    },
    {
      "id": "paintings-untitled-32-webp",
      "src": "/images/works/Illustrations/Paintings/Untitled-32.webp",
      "title": "Untitled 32",
      "category": "Paintings",
      "width": 1487,
      "height": 1770
    },
    {
      "id": "paintings-untitled-35-webp",
      "src": "/images/works/Illustrations/Paintings/Untitled-35.webp",
      "title": "Untitled 35",
      "category": "Paintings",
      "width": 1076,
      "height": 1281
    },
    {
      "id": "paintings-untitled-36-webp",
      "src": "/images/works/Illustrations/Paintings/Untitled-36.webp",
      "title": "Untitled 36",
      "category": "Paintings",
      "width": 1070,
      "height": 1274
    },
    {
      "id": "paintings-untitled-37-webp",
      "src": "/images/works/Illustrations/Paintings/Untitled-37.webp",
      "title": "Untitled 37",
      "category": "Paintings",
      "width": 1073,
      "height": 1278
    }
  ],
  "sketches": [
    {
      "id": "sketches-consumed-webp",
      "src": "/images/works/Illustrations/Sketches/consumed.webp",
      "title": "Consumed",
      "category": "Sketches",
      "width": 2100,
      "height": 2685
    },
    {
      "id": "sketches-expressionss2-webp",
      "src": "/images/works/Illustrations/Sketches/expressionss2.webp",
      "title": "Expressionss2",
      "category": "Sketches",
      "width": 3000,
      "height": 2000
    },
    {
      "id": "sketches-finish-webp",
      "src": "/images/works/Illustrations/Sketches/finish.webp",
      "title": "Finish",
      "category": "Sketches",
      "width": 3000,
      "height": 3000
    },
    {
      "id": "sketches-img-0007-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_0007.webp",
      "title": "IMG 0007",
      "category": "Sketches",
      "width": 2500,
      "height": 2500
    },
    {
      "id": "sketches-img-0610-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_0610.webp",
      "title": "IMG 0610",
      "category": "Sketches",
      "width": 860,
      "height": 860
    },
    {
      "id": "sketches-img-0677-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_0677.webp",
      "title": "IMG 0677",
      "category": "Sketches",
      "width": 813,
      "height": 813
    },
    {
      "id": "sketches-img-0839-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_0839.webp",
      "title": "IMG 0839",
      "category": "Sketches",
      "width": 2681,
      "height": 2681
    },
    {
      "id": "sketches-img-0855-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_0855.webp",
      "title": "IMG 0855",
      "category": "Sketches",
      "width": 906,
      "height": 906
    },
    {
      "id": "sketches-img-1105-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1105.webp",
      "title": "IMG 1105",
      "category": "Sketches",
      "width": 2100,
      "height": 2500
    },
    {
      "id": "sketches-img-1106-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1106.webp",
      "title": "IMG 1106",
      "category": "Sketches",
      "width": 1900,
      "height": 1900
    },
    {
      "id": "sketches-img-1108-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1108.webp",
      "title": "IMG 1108",
      "category": "Sketches",
      "width": 1731,
      "height": 1731
    },
    {
      "id": "sketches-img-1112-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1112.webp",
      "title": "IMG 1112",
      "category": "Sketches",
      "width": 1748,
      "height": 1748
    },
    {
      "id": "sketches-img-1114-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1114.webp",
      "title": "IMG 1114",
      "category": "Sketches",
      "width": 2067,
      "height": 2067
    },
    {
      "id": "sketches-img-1118-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1118.webp",
      "title": "IMG 1118",
      "category": "Sketches",
      "width": 1492,
      "height": 1492
    },
    {
      "id": "sketches-img-1143-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1143.webp",
      "title": "IMG 1143",
      "category": "Sketches",
      "width": 1350,
      "height": 1350
    },
    {
      "id": "sketches-img-1319-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1319.webp",
      "title": "IMG 1319",
      "category": "Sketches",
      "width": 2100,
      "height": 2500
    },
    {
      "id": "sketches-img-1324-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1324.webp",
      "title": "IMG 1324",
      "category": "Sketches",
      "width": 2100,
      "height": 2500
    },
    {
      "id": "sketches-img-1357-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1357.webp",
      "title": "IMG 1357",
      "category": "Sketches",
      "width": 1720,
      "height": 1720
    },
    {
      "id": "sketches-img-1374-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1374.webp",
      "title": "IMG 1374",
      "category": "Sketches",
      "width": 1051,
      "height": 1051
    },
    {
      "id": "sketches-img-1382-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1382.webp",
      "title": "IMG 1382",
      "category": "Sketches",
      "width": 940,
      "height": 940
    },
    {
      "id": "sketches-img-1412-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1412.webp",
      "title": "IMG 1412",
      "category": "Sketches",
      "width": 997,
      "height": 997
    },
    {
      "id": "sketches-img-1415-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1415.webp",
      "title": "IMG 1415",
      "category": "Sketches",
      "width": 890,
      "height": 890
    },
    {
      "id": "sketches-img-1420-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1420.webp",
      "title": "IMG 1420",
      "category": "Sketches",
      "width": 929,
      "height": 929
    },
    {
      "id": "sketches-img-1422-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1422.webp",
      "title": "IMG 1422",
      "category": "Sketches",
      "width": 1002,
      "height": 1002
    },
    {
      "id": "sketches-img-1428-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1428.webp",
      "title": "IMG 1428",
      "category": "Sketches",
      "width": 968,
      "height": 968
    },
    {
      "id": "sketches-img-1431-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1431.webp",
      "title": "IMG 1431",
      "category": "Sketches",
      "width": 969,
      "height": 969
    },
    {
      "id": "sketches-img-1436-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1436.webp",
      "title": "IMG 1436",
      "category": "Sketches",
      "width": 985,
      "height": 985
    },
    {
      "id": "sketches-img-1445-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1445.webp",
      "title": "IMG 1445",
      "category": "Sketches",
      "width": 1065,
      "height": 1065
    },
    {
      "id": "sketches-img-1454-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1454.webp",
      "title": "IMG 1454",
      "category": "Sketches",
      "width": 999,
      "height": 999
    },
    {
      "id": "sketches-img-1460-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1460.webp",
      "title": "IMG 1460",
      "category": "Sketches",
      "width": 783,
      "height": 783
    },
    {
      "id": "sketches-img-1488-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1488.webp",
      "title": "IMG 1488",
      "category": "Sketches",
      "width": 1170,
      "height": 1170
    },
    {
      "id": "sketches-img-1493-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1493.webp",
      "title": "IMG 1493",
      "category": "Sketches",
      "width": 1139,
      "height": 1139
    },
    {
      "id": "sketches-img-1500-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1500.webp",
      "title": "IMG 1500",
      "category": "Sketches",
      "width": 1140,
      "height": 1140
    },
    {
      "id": "sketches-img-1517-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1517.webp",
      "title": "IMG 1517",
      "category": "Sketches",
      "width": 1190,
      "height": 1190
    },
    {
      "id": "sketches-img-1523-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1523.webp",
      "title": "IMG 1523",
      "category": "Sketches",
      "width": 1574,
      "height": 1574
    },
    {
      "id": "sketches-img-1525-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1525.webp",
      "title": "IMG 1525",
      "category": "Sketches",
      "width": 1424,
      "height": 1424
    },
    {
      "id": "sketches-img-1526-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1526.webp",
      "title": "IMG 1526",
      "category": "Sketches",
      "width": 1736,
      "height": 1736
    },
    {
      "id": "sketches-img-1544-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1544.webp",
      "title": "IMG 1544",
      "category": "Sketches",
      "width": 2100,
      "height": 2500
    },
    {
      "id": "sketches-img-1576-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1576.webp",
      "title": "IMG 1576",
      "category": "Sketches",
      "width": 1173,
      "height": 1173
    },
    {
      "id": "sketches-img-1887-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_1887.webp",
      "title": "IMG 1887",
      "category": "Sketches",
      "width": 5000,
      "height": 5000
    },
    {
      "id": "sketches-img-2265-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_2265.webp",
      "title": "IMG 2265",
      "category": "Sketches",
      "width": 798,
      "height": 950
    },
    {
      "id": "sketches-img-2380-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_2380.webp",
      "title": "IMG 2380",
      "category": "Sketches",
      "width": 1065,
      "height": 1065
    },
    {
      "id": "sketches-img-2592-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_2592.webp",
      "title": "IMG 2592",
      "category": "Sketches",
      "width": 1531,
      "height": 1531
    },
    {
      "id": "sketches-img-2593-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_2593.webp",
      "title": "IMG 2593",
      "category": "Sketches",
      "width": 2073,
      "height": 2073
    },
    {
      "id": "sketches-img-2594-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_2594.webp",
      "title": "IMG 2594",
      "category": "Sketches",
      "width": 1335,
      "height": 1335
    },
    {
      "id": "sketches-img-2595-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_2595.webp",
      "title": "IMG 2595",
      "category": "Sketches",
      "width": 1708,
      "height": 1708
    },
    {
      "id": "sketches-img-2598-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_2598.webp",
      "title": "IMG 2598",
      "category": "Sketches",
      "width": 1117,
      "height": 1117
    },
    {
      "id": "sketches-img-2600-webp",
      "src": "/images/works/Illustrations/Sketches/IMG_2600.webp",
      "title": "IMG 2600",
      "category": "Sketches",
      "width": 1195,
      "height": 1195
    },
    {
      "id": "sketches-levi-webp",
      "src": "/images/works/Illustrations/Sketches/Levi.webp",
      "title": "Levi",
      "category": "Sketches",
      "width": 1184,
      "height": 1184
    },
    {
      "id": "sketches-lulu-finish-webp",
      "src": "/images/works/Illustrations/Sketches/lulu_finish.webp",
      "title": "Lulu Finish",
      "category": "Sketches",
      "width": 1895,
      "height": 1895
    },
    {
      "id": "sketches-sketch001-webp",
      "src": "/images/works/Illustrations/Sketches/SKETCH001.webp",
      "title": "Sketch001",
      "category": "Sketches",
      "width": 2100,
      "height": 2100
    },
    {
      "id": "sketches-sketch002-webp",
      "src": "/images/works/Illustrations/Sketches/SKETCH002.webp",
      "title": "Sketch002",
      "category": "Sketches",
      "width": 2100,
      "height": 2100
    },
    {
      "id": "sketches-untitled--webp",
      "src": "/images/works/Illustrations/Sketches/UNTITLED_.webp",
      "title": "Untitled",
      "category": "Sketches",
      "width": 1130,
      "height": 1130
    },
    {
      "id": "sketches-untitled-artwork-1-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled_Artwork 1.webp",
      "title": "Untitled Artwork 1",
      "category": "Sketches",
      "width": 1216,
      "height": 1216
    },
    {
      "id": "sketches-untitled-artwork-3-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled_Artwork 3.webp",
      "title": "Untitled Artwork 3",
      "category": "Sketches",
      "width": 1468,
      "height": 1468
    },
    {
      "id": "sketches-untitled-artwork-1--webp",
      "src": "/images/works/Illustrations/Sketches/Untitled_Artwork(1).webp",
      "title": "Untitled Artwork(1)",
      "category": "Sketches",
      "width": 2240,
      "height": 2240
    },
    {
      "id": "sketches-untitled-artwork-15--webp",
      "src": "/images/works/Illustrations/Sketches/Untitled_Artwork(15).webp",
      "title": "Untitled Artwork(15)",
      "category": "Sketches",
      "width": 2133,
      "height": 2133
    },
    {
      "id": "sketches-untitled-artwork-17--webp",
      "src": "/images/works/Illustrations/Sketches/Untitled_Artwork(17).webp",
      "title": "Untitled Artwork(17)",
      "category": "Sketches",
      "width": 3000,
      "height": 3000
    },
    {
      "id": "sketches-untitled-artwork-7--webp",
      "src": "/images/works/Illustrations/Sketches/Untitled_Artwork(7).webp",
      "title": "Untitled Artwork(7)",
      "category": "Sketches",
      "width": 864,
      "height": 864
    },
    {
      "id": "sketches-untitled-11-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-11.webp",
      "title": "Untitled 11",
      "category": "Sketches",
      "width": 2100,
      "height": 2100
    },
    {
      "id": "sketches-untitled-12-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-12.webp",
      "title": "Untitled 12",
      "category": "Sketches",
      "width": 1850,
      "height": 1850
    },
    {
      "id": "sketches-untitled-13-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-13.webp",
      "title": "Untitled 13",
      "category": "Sketches",
      "width": 2100,
      "height": 2100
    },
    {
      "id": "sketches-untitled-14-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-14.webp",
      "title": "Untitled 14",
      "category": "Sketches",
      "width": 1704,
      "height": 1704
    },
    {
      "id": "sketches-untitled-15-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-15.webp",
      "title": "Untitled 15",
      "category": "Sketches",
      "width": 1221,
      "height": 1221
    },
    {
      "id": "sketches-untitled-16-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-16.webp",
      "title": "Untitled 16",
      "category": "Sketches",
      "width": 1411,
      "height": 1411
    },
    {
      "id": "sketches-untitled-18-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-18.webp",
      "title": "Untitled 18",
      "category": "Sketches",
      "width": 2100,
      "height": 2100
    },
    {
      "id": "sketches-untitled-19-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-19.webp",
      "title": "Untitled 19",
      "category": "Sketches",
      "width": 2100,
      "height": 2100
    },
    {
      "id": "sketches-untitled-24-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-24.webp",
      "title": "Untitled 24",
      "category": "Sketches",
      "width": 1671,
      "height": 1989
    },
    {
      "id": "sketches-untitled-28-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-28.webp",
      "title": "Untitled 28",
      "category": "Sketches",
      "width": 762,
      "height": 908
    },
    {
      "id": "sketches-untitled-30-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-30.webp",
      "title": "Untitled 30",
      "category": "Sketches",
      "width": 967,
      "height": 1151
    },
    {
      "id": "sketches-untitled-31-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-31.webp",
      "title": "Untitled 31",
      "category": "Sketches",
      "width": 2100,
      "height": 2500
    },
    {
      "id": "sketches-untitled-33-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-33.webp",
      "title": "Untitled 33",
      "category": "Sketches",
      "width": 3000,
      "height": 2500
    },
    {
      "id": "sketches-untitled-34-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-34.webp",
      "title": "Untitled 34",
      "category": "Sketches",
      "width": 1560,
      "height": 1857
    },
    {
      "id": "sketches-untitled-39-sketch-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-39-sketch.webp",
      "title": "Untitled 39 Sketch",
      "category": "Sketches",
      "width": 2100,
      "height": 2500
    },
    {
      "id": "sketches-untitled-39-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-39.webp",
      "title": "Untitled 39",
      "category": "Sketches",
      "width": 1792,
      "height": 2133
    },
    {
      "id": "sketches-untitled-40-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-40.webp",
      "title": "Untitled 40",
      "category": "Sketches",
      "width": 1938,
      "height": 2308
    },
    {
      "id": "sketches-untitled-9-webp",
      "src": "/images/works/Illustrations/Sketches/Untitled-9.webp",
      "title": "Untitled 9",
      "category": "Sketches",
      "width": 2100,
      "height": 2100
    }
  ],
  "studies": [
    {
      "id": "studies-cabin-webp",
      "src": "/images/works/Illustrations/Studies/Cabin.webp",
      "title": "Cabin",
      "category": "Studies",
      "width": 1452,
      "height": 1452
    },
    {
      "id": "studies-car-gt3rs-webp",
      "src": "/images/works/Illustrations/Studies/car-gt3rs.webp",
      "title": "Car Gt3rs",
      "category": "Studies",
      "width": 1961,
      "height": 1961
    },
    {
      "id": "studies-church-webp",
      "src": "/images/works/Illustrations/Studies/Church.webp",
      "title": "Church",
      "category": "Studies",
      "width": 1596,
      "height": 1596
    },
    {
      "id": "studies-img-1161-webp",
      "src": "/images/works/Illustrations/Studies/IMG_1161.webp",
      "title": "IMG 1161",
      "category": "Studies",
      "width": 2061,
      "height": 2061
    },
    {
      "id": "studies-img-1168-webp",
      "src": "/images/works/Illustrations/Studies/IMG_1168.webp",
      "title": "IMG 1168",
      "category": "Studies",
      "width": 1867,
      "height": 1867
    },
    {
      "id": "studies-img-1176-webp",
      "src": "/images/works/Illustrations/Studies/IMG_1176.webp",
      "title": "IMG 1176",
      "category": "Studies",
      "width": 1944,
      "height": 1944
    },
    {
      "id": "studies-img-1188-webp",
      "src": "/images/works/Illustrations/Studies/IMG_1188.webp",
      "title": "IMG 1188",
      "category": "Studies",
      "width": 1665,
      "height": 1665
    },
    {
      "id": "studies-img-1195-webp",
      "src": "/images/works/Illustrations/Studies/IMG_1195.webp",
      "title": "IMG 1195",
      "category": "Studies",
      "width": 1795,
      "height": 1795
    },
    {
      "id": "studies-img-1203-webp",
      "src": "/images/works/Illustrations/Studies/IMG_1203.webp",
      "title": "IMG 1203",
      "category": "Studies",
      "width": 1722,
      "height": 1722
    },
    {
      "id": "studies-img-1209-webp",
      "src": "/images/works/Illustrations/Studies/IMG_1209.webp",
      "title": "IMG 1209",
      "category": "Studies",
      "width": 2741,
      "height": 2741
    },
    {
      "id": "studies-img-1214-webp",
      "src": "/images/works/Illustrations/Studies/IMG_1214.webp",
      "title": "IMG 1214",
      "category": "Studies",
      "width": 3000,
      "height": 3000
    },
    {
      "id": "studies-img-1223-webp",
      "src": "/images/works/Illustrations/Studies/IMG_1223.webp",
      "title": "IMG 1223",
      "category": "Studies",
      "width": 3000,
      "height": 3000
    },
    {
      "id": "studies-img-1239-webp",
      "src": "/images/works/Illustrations/Studies/IMG_1239.webp",
      "title": "IMG 1239",
      "category": "Studies",
      "width": 3000,
      "height": 3000
    },
    {
      "id": "studies-img-1317-webp",
      "src": "/images/works/Illustrations/Studies/IMG_1317.webp",
      "title": "IMG 1317",
      "category": "Studies",
      "width": 1681,
      "height": 1681
    },
    {
      "id": "studies-img-1328-webp",
      "src": "/images/works/Illustrations/Studies/IMG_1328.webp",
      "title": "IMG 1328",
      "category": "Studies",
      "width": 1223,
      "height": 1223
    },
    {
      "id": "studies-img-1343-webp",
      "src": "/images/works/Illustrations/Studies/IMG_1343.webp",
      "title": "IMG 1343",
      "category": "Studies",
      "width": 1584,
      "height": 1584
    },
    {
      "id": "studies-img-1539-webp",
      "src": "/images/works/Illustrations/Studies/IMG_1539.webp",
      "title": "IMG 1539",
      "category": "Studies",
      "width": 1514,
      "height": 1514
    },
    {
      "id": "studies-iso-house-webp",
      "src": "/images/works/Illustrations/Studies/Iso-house.webp",
      "title": "Iso House",
      "category": "Studies",
      "width": 1889,
      "height": 1889
    },
    {
      "id": "studies-untitled-artwork-2-webp",
      "src": "/images/works/Illustrations/Studies/Untitled_Artwork 2.webp",
      "title": "Untitled Artwork 2",
      "category": "Studies",
      "width": 3000,
      "height": 3000
    }
  ]
}

const STORAGE_KEY = 'tobi_xp_illustrations_order_v1'

/**
 * Fisher-Yates array shuffle.
 */
function shuffleArray<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

/**
 * Retrieves or initializes a persistent shuffled order for a specific category.
 * Stored in localStorage so it is shuffled once on first visit and stays fixed across sessions.
 */
function getPersistentlyOrderedList(
  categoryKey: 'paintings' | 'sketches' | 'studies',
  sourceList: IllustrationImage[]
): IllustrationImage[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return sourceList
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    let state: Record<string, string[]> = {}
    if (raw) {
      try {
        state = JSON.parse(raw)
      } catch {
        state = {}
      }
    }

    const savedIds = state[categoryKey]
    const currentIdMap = new Map(sourceList.map((img) => [img.id, img]))

    // If we have a saved list of IDs for this category and it contains items
    if (Array.isArray(savedIds) && savedIds.length > 0) {
      const ordered: IllustrationImage[] = []
      const seenIds = new Set<string>()

      for (const id of savedIds) {
        const item = currentIdMap.get(id)
        if (item) {
          ordered.push(item)
          seenIds.add(id)
        }
      }

      // Append any newly added images that weren't in the saved order
      for (const item of sourceList) {
        if (!seenIds.has(item.id)) {
          ordered.push(item)
        }
      }

      if (ordered.length > 0) {
        return ordered
      }
    }

    // First time initialization: shuffle once and persist
    const shuffled = shuffleArray(sourceList)
    state[categoryKey] = shuffled.map((img) => img.id)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return shuffled
  } catch (err) {
    console.warn('[Gallery] Failed to read/write persistent order from localStorage:', err)
    return sourceList
  }
}

// In-memory cache of the persistently shuffled categories for fast synchronous access
let cachedShuffledGallery: IllustrationGallery | null = null

export function getShuffledGallery(): IllustrationGallery {
  if (cachedShuffledGallery) return cachedShuffledGallery

  cachedShuffledGallery = {
    paintings: getPersistentlyOrderedList('paintings', illustrationGallery.paintings),
    sketches: getPersistentlyOrderedList('sketches', illustrationGallery.sketches),
    studies: getPersistentlyOrderedList('studies', illustrationGallery.studies),
  }

  return cachedShuffledGallery
}

/**
 * Complete list of all illustration images across all 3 categories (Paintings, Sketches, Studies).
 */
export const allIllustrationImages: IllustrationImage[] = [
  ...illustrationGallery.paintings,
  ...illustrationGallery.sketches,
  ...illustrationGallery.studies,
]

/**
 * Helper to retrieve gallery images for a category name or slug with persistent fixed shuffle order.
 */
export function getCategoryImages(categoryOrSlug: string): IllustrationImage[] {
  const gallery = getShuffledGallery()
  const norm = categoryOrSlug.toLowerCase().trim()
  if (norm === 'paintings' || norm === 'painting') return gallery.paintings
  if (norm === 'sketches' || norm === 'sketch') return gallery.sketches
  if (norm === 'studies' || norm === 'study') return gallery.studies
  if (
    norm === 'all' ||
    norm === 'all works' ||
    norm === 'all illustrations' ||
    norm === 'all-works' ||
    norm === 'illustrations' ||
    norm === 'illustration'
  ) {
    return [
      ...gallery.paintings,
      ...gallery.sketches,
      ...gallery.studies,
    ]
  }
  return []
}

/**
 * Asset Preservation & Integrity Safeguard:
 * Ensures entries are preserved rather than silently dropped if temporarily unreachable.
 */
export function reportMissingImage(src: string, category: string): void {
  console.warn(
    `[Asset Integrity Notice] Image at "${src}" in category "${category}" was queried but may be temporarily unreachable. Manifest entry is preserved. Do not delete.`
  )
}
