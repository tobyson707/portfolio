/**
 * STURVS ASSET MANIFEST — TOBI XP
 * Authoritative, extensible asset definitions for the STURVS interactive creative canvas.
 * Contains deterministic positions, dimensions, natural rotations, metadata, descriptions,
 * and high-clarity exhibition assets sourced directly from /assets/.
 */

export interface SturvsStackImage {
  src: string
  title?: string
  caption?: string
  aspectRatio?: string
}

export interface SturvsArtwork {
  id: string
  title: string
  src: string
  category: 'Concept' | 'Study' | 'Experiment' | 'Character' | 'Visual System' | '3D' | 'Sketch'
  typeLabel?: string
  description?: string
  year?: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  aspectRatio: string
  stackImages?: SturvsStackImage[]
  cta?: {
    label: string
    url?: string
    action?: string
  }
}

export const STURVS_CANVAS_CONFIG = {
  width: 5740,
  height: 3040,
  initialCenter: { x: 2870, y: 1520 },
  minZoom: 0.25,
  maxZoom: 2.4,
  defaultZoomDesktop: 0.65,
  defaultZoomTablet: 0.52,
  defaultZoomMobile: 0.38,
}

export const STURVS_TILE_CONFIG = {
  periodWidth: 5740,
  periodHeight: 3040,
  columns: 7,
  rows: 4,
  columnSpacing: 820,
  rowSpacing: 760,
}

/**
 * Deterministic spatial layout of the 28 creative assets for STURVS exhibition.
 * Arranged in a spacious 7x4 matrix preserving natural aspect ratios
 * and generous whitespace between artworks.
 */
export const STURVS_ARTWORKS: SturvsArtwork[] = [
  {
    "id": "sturv-1-webp",
    "title": "Visual 1",
    "src": "/assets/1.webp",
    "category": "Concept",
    "typeLabel": "WIDESCREEN ENVIRONMENT",
    "description": "Cinematic widescreen spatial environment exploring dynamic lighting and atmospheric depth.",
    "year": "2024",
    "x": 170,
    "y": 245,
    "width": 480,
    "height": 270,
    "rotation": 0,
    "aspectRatio": "1920 / 1080"
  },
  {
    "id": "sturv-a4-7-webp",
    "title": "A4 · 07",
    "src": "/assets/A4 - 7.webp",
    "category": "Study",
    "typeLabel": "EDITORIAL POSTER SYSTEM",
    "description": "Monochrome typographic study on vertical proportion, grid balance, and structural hierarchy.",
    "year": "2024",
    "x": 248,
    "y": 910,
    "width": 325,
    "height": 460,
    "rotation": 0,
    "aspectRatio": "2380 / 3368"
  },
  {
    "id": "sturv-asset-2-4x-webp",
    "title": "Asset 2",
    "src": "/assets/Asset 2@4x.webp",
    "category": "Experiment",
    "typeLabel": "MINIMALIST ICON",
    "description": "Geometric identity emblem focusing on crisp vectors and reductionist mark making.",
    "year": "2024",
    "x": 210,
    "y": 1700,
    "width": 400,
    "height": 400,
    "rotation": 0,
    "aspectRatio": "1 / 1"
  },
  {
    "id": "sturv-frame-427321707-webp",
    "title": "Frame 427321707",
    "src": "/assets/Frame 427321707.webp",
    "category": "Visual System",
    "typeLabel": "PANORAMIC ARTIFACT",
    "description": "Cinematic horizontal artifact constructed for widescreen display and visual immersion.",
    "year": "2024",
    "x": 170,
    "y": 2552,
    "width": 480,
    "height": 216,
    "rotation": 0,
    "aspectRatio": "1444 / 649"
  },
  {
    "id": "sturv-a4-10-webp",
    "title": "A4 · 10",
    "src": "/assets/A4 - 10.webp",
    "category": "Study",
    "typeLabel": "VERTICAL COMPOSITION",
    "description": "Structural print layout testing editorial rhythm, dense typographic layers, and negative space.",
    "year": "2024",
    "x": 1068,
    "y": 150,
    "width": 325,
    "height": 460,
    "rotation": 0,
    "aspectRatio": "2380 / 3368"
  },
  {
    "id": "sturv-bedroom-webp",
    "title": "Bedroom",
    "src": "/assets/bedroom.webp",
    "category": "Concept",
    "typeLabel": "INTERIOR COMPOSITION",
    "description": "Atmospheric square environmental study investigating warmth, shadows, and lived-in spatial emotion.",
    "year": "2025",
    "x": 1030,
    "y": 940,
    "width": 400,
    "height": 400,
    "rotation": 0,
    "aspectRatio": "1 / 1"
  },
  {
    "id": "sturv-frame-6-webp",
    "title": "Frame 6",
    "src": "/assets/Frame 6.webp",
    "category": "Experiment",
    "typeLabel": "MONUMENTAL MATRIX",
    "description": "High-resolution graphic study testing micro-detailing, repetition, and optical balance.",
    "year": "2024",
    "x": 1030,
    "y": 1700,
    "width": 400,
    "height": 400,
    "rotation": 0,
    "aspectRatio": "1 / 1"
  },
  {
    "id": "sturv-twitter-post-1-webp",
    "title": "Twitter Post 1",
    "src": "/assets/Twitter post - 1.webp",
    "category": "Visual System",
    "typeLabel": "SOCIAL BROADCAST SYSTEM",
    "description": "Editorial digital publication design engineered for social distribution and visual cadence.",
    "year": "2024",
    "x": 990,
    "y": 2516,
    "width": 480,
    "height": 289,
    "rotation": 0,
    "aspectRatio": "5468 / 3288"
  },
  {
    "id": "sturv-8-webp",
    "title": "Visual 8",
    "src": "/assets/8.webp",
    "category": "Concept",
    "typeLabel": "ENVIRONMENTAL HORIZON",
    "description": "Landscape composition capturing spatial perspective, textured gradients, and ambient calm.",
    "year": "2024",
    "x": 1810,
    "y": 245,
    "width": 480,
    "height": 270,
    "rotation": 0,
    "aspectRatio": "1920 / 1080"
  },
  {
    "id": "sturv-artboard-1-3x-webp",
    "title": "Artboard 1",
    "src": "/assets/Artboard 1@3x.webp",
    "category": "Study",
    "typeLabel": "PORTRAIT ARTIFACT",
    "description": "High-density editorial artboard exploring vertical flow and modern digital print craft.",
    "year": "2024",
    "x": 1887,
    "y": 910,
    "width": 326,
    "height": 460,
    "rotation": 0,
    "aspectRatio": "1457 / 2059"
  },
  {
    "id": "sturv-group-633285-webp",
    "title": "Group 633285",
    "src": "/assets/Group 633285.webp",
    "category": "Experiment",
    "typeLabel": "ICONIC EMBLEM",
    "description": "Square emblem exploration analyzing compact visual forms, silhouette clarity, and iconic identity.",
    "year": "2024",
    "x": 1850,
    "y": 1700,
    "width": 400,
    "height": 400,
    "rotation": 0,
    "aspectRatio": "1 / 1"
  },
  {
    "id": "sturv-strange-webp",
    "title": "Strange",
    "src": "/assets/STRANGE.webp",
    "category": "Concept",
    "typeLabel": "SURREAL EXPLORATION",
    "description": "Square expressive piece capturing surreal energy, unconventional textures, and tactile contrast.",
    "year": "2025",
    "x": 1850,
    "y": 2460,
    "width": 400,
    "height": 400,
    "rotation": 0,
    "aspectRatio": "1 / 1"
  },
  {
    "id": "sturv-a4-11-webp",
    "title": "A4 · 11",
    "src": "/assets/A4 - 11.webp",
    "category": "Study",
    "typeLabel": "PRINT MANIFESTO",
    "description": "Vertical editorial document exploring sharp typographic contrast and Swiss grid discipline.",
    "year": "2024",
    "x": 2708,
    "y": 150,
    "width": 325,
    "height": 460,
    "rotation": 0,
    "aspectRatio": "2380 / 3368"
  },
  {
    "id": "sturv-frame-101-webp",
    "title": "Frame 101",
    "src": "/assets/Frame 101.webp",
    "category": "Visual System",
    "typeLabel": "VISUAL SYSTEM · FRAME",
    "description": "Editorial design frame exploring spatial structure, typographic balance, and geometric minimalism.",
    "year": "2024",
    "x": 2650,
    "y": 953,
    "width": 440,
    "height": 375,
    "rotation": 0,
    "aspectRatio": "1180 / 1005"
  },
  {
    "id": "sturv-frame-88-webp",
    "title": "Frame 88",
    "src": "/assets/Frame 88.webp",
    "category": "Concept",
    "typeLabel": "CREATIVE COMPOSITION",
    "description": "Detailed graphic creation investigating multi-scale texture, visual cadence, and dark theme polish.",
    "year": "2024",
    "x": 2670,
    "y": 1700,
    "width": 400,
    "height": 400,
    "rotation": 0,
    "aspectRatio": "4426 / 4429"
  },
  {
    "id": "sturv-a4-8-webp",
    "title": "A4 · 08",
    "src": "/assets/A4 - 8.webp",
    "category": "Study",
    "typeLabel": "EDITORIAL SHEET",
    "description": "Experimental layout analyzing editorial pacing, vertical flow, and balanced typographic hierarchy.",
    "year": "2024",
    "x": 2708,
    "y": 2430,
    "width": 325,
    "height": 460,
    "rotation": 0,
    "aspectRatio": "2380 / 3368"
  },
  {
    "id": "sturv-artboard-1-copy-webp",
    "title": "Artboard 1 (Alt)",
    "src": "/assets/Artboard 1-copy.webp",
    "category": "Study",
    "typeLabel": "COMPOSITIONAL LAYOUT",
    "description": "Horizontal artboard variation testing spatial rhythm, asymmetric weighting, and restrained color.",
    "year": "2024",
    "x": 3470,
    "y": 204,
    "width": 440,
    "height": 352,
    "rotation": 0,
    "aspectRatio": "2030 / 1624"
  },
  {
    "id": "sturv-a4-13-webp",
    "title": "A4 · 13",
    "src": "/assets/A4 - 13.webp",
    "category": "Study",
    "typeLabel": "TYPOGRAPHIC FORM",
    "description": "Editorial layout probing type-as-form interactions, whitespace tension, and structural columns.",
    "year": "2024",
    "x": 3528,
    "y": 910,
    "width": 325,
    "height": 460,
    "rotation": 0,
    "aspectRatio": "2380 / 3368"
  },
  {
    "id": "sturv-frame-4-webp",
    "title": "Frame 4",
    "src": "/assets/Frame 4.webp",
    "category": "Study",
    "typeLabel": "COMPOSITIONAL STUDY",
    "description": "Focused square proportion study balancing dark visual tone, negative space, and atmospheric gradients.",
    "year": "2024",
    "x": 3490,
    "y": 1700,
    "width": 400,
    "height": 400,
    "rotation": 0,
    "aspectRatio": "1 / 1"
  },
  {
    "id": "sturv-god-is-good-poster-webp",
    "title": "God is Good Poster",
    "src": "/assets/God is good poster.webp",
    "category": "Concept",
    "typeLabel": "EXPRESSIVE POSTER",
    "description": "Faith-inspired vertical poster composition celebrating expressive typography and bold visual spirit.",
    "year": "2024",
    "x": 3528,
    "y": 2430,
    "width": 325,
    "height": 460,
    "rotation": 0,
    "aspectRatio": "907 / 1284"
  },
  {
    "id": "sturv-asset-6-4x-webp",
    "title": "Asset 6",
    "src": "/assets/Asset 6@4x.webp",
    "category": "Experiment",
    "typeLabel": "DYNAMIC STUDY",
    "description": "Vertical graphic experiment examining geometric movement, directional tension, and sharp silhouettes.",
    "year": "2024",
    "x": 4347,
    "y": 165,
    "width": 327,
    "height": 430,
    "rotation": 0,
    "aspectRatio": "3483 / 4581"
  },
  {
    "id": "sturv-frame-104-webp",
    "title": "Frame 104",
    "src": "/assets/Frame 104.webp",
    "category": "Visual System",
    "typeLabel": "INTERFACE COMPONENT",
    "description": "Digital layout study exploring modular framing, structured padding, and tactile surface finishes.",
    "year": "2024",
    "x": 4290,
    "y": 953,
    "width": 440,
    "height": 375,
    "rotation": 0,
    "aspectRatio": "1193 / 1017"
  },
  {
    "id": "sturv-frame-427321705-webp",
    "title": "Frame 427321705",
    "src": "/assets/Frame 427321705.webp",
    "category": "Experiment",
    "typeLabel": "GRAPHIC STUDY",
    "description": "Square format graphic study balancing stark contrast, structured geometry, and understated modern craft.",
    "year": "2024",
    "x": 4310,
    "y": 1700,
    "width": 400,
    "height": 400,
    "rotation": 0,
    "aspectRatio": "1 / 1"
  },
  {
    "id": "sturv-a4-9-webp",
    "title": "A4 · 09",
    "src": "/assets/A4 - 9.webp",
    "category": "Study",
    "typeLabel": "PRINT ARCHIVE",
    "description": "Vertical format study balancing deep contrast, structural grid alignments, and quiet elegance.",
    "year": "2024",
    "x": 4348,
    "y": 2430,
    "width": 325,
    "height": 460,
    "rotation": 0,
    "aspectRatio": "2380 / 3368"
  },
  {
    "id": "sturv-asset-9-4x-webp",
    "title": "Asset 9",
    "src": "/assets/Asset 9@4x.webp",
    "category": "Experiment",
    "typeLabel": "HIGH-RESOLUTION TEXTURE",
    "description": "Monumental graphic canvas testing complex surface details, organic textures, and microscopic fidelity.",
    "year": "2024",
    "x": 5130,
    "y": 193,
    "width": 400,
    "height": 375,
    "rotation": 0,
    "aspectRatio": "8610 / 8075"
  },
  {
    "id": "sturv-a4-14-webp",
    "title": "A4 · 14",
    "src": "/assets/A4 - 14.webp",
    "category": "Study",
    "typeLabel": "EXPERIMENTAL GRID",
    "description": "Vertical editorial document exploring radical margins, column breaks, and minimalist restraint.",
    "year": "2024",
    "x": 5168,
    "y": 910,
    "width": 325,
    "height": 460,
    "rotation": 0,
    "aspectRatio": "2380 / 3368"
  },
  {
    "id": "sturv-group-633286-webp",
    "title": "Group 633286",
    "src": "/assets/Group 633286.webp",
    "category": "Experiment",
    "typeLabel": "IDENTITY MARK",
    "description": "Refined graphic exploration examining structural symmetry, visual rhythm, and minimalist identity.",
    "year": "2024",
    "x": 5130,
    "y": 1700,
    "width": 400,
    "height": 400,
    "rotation": 0,
    "aspectRatio": "1 / 1"
  },
  {
    "id": "sturv-untitled-1-webp",
    "title": "Untitled 1",
    "src": "/assets/Untitled 1.webp",
    "category": "Concept",
    "typeLabel": "UNRESTRICTED VISION",
    "description": "Unconventional portrait piece blending digital manipulation, atmospheric grain, and raw emotional resonance.",
    "year": "2025",
    "x": 5150,
    "y": 2445,
    "width": 361,
    "height": 430,
    "rotation": 0,
    "aspectRatio": "2101 / 2500"
  }
]
