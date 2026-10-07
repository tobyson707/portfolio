/**
 * DESIGNS DATA & MANIFEST — TOBI XP
 * Rich project definitions, high-resolution previews, simulation specs, and sturvs canvas items.
 */

export interface DesignPreviewItem {
  id: string
  title: string
  subtitle?: string
  category: 'Branding' | 'Product' | 'Simulation' | 'Sturv'
  description?: string
  tags?: string[]
  image: string
  aspectRatio?: string
  details?: string[]
  meta?: string
  width?: number
  height?: number
}

export interface BrandingProject {
  id: string
  title: string
  tagline: string
  category: string
  client: string
  year: string
  deliverables: string[]
  description: string
  palette: string[]
  images: Array<{
    id: string
    title: string
    caption: string
    image: string
    aspectRatio?: string
  }>
}

export interface SimulationProject {
  id: string
  title: string
  subject: string
  equation?: string
  description: string
  specs: string[]
  tags: string[]
  previews: Array<{
    id: string
    title: string
    caption: string
    image: string
    aspectRatio?: string
  }>
}

export interface ProductProject {
  id: string
  title: string
  subtitle: string
  category: string
  role: string
  timeline: string
  overview: string
  features: string[]
  techStack: string[]
  metrics?: Array<{ label: string; value: string }>
  previews: Array<{
    id: string
    title: string
    caption: string
    image: string
    aspectRatio?: string
  }>
}

export interface SturvCanvasItem {
  id: string
  title: string
  category: string
  tags: string[]
  notes: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  image: string
  badge?: string
}

// ---------------------------------------------------------------------------
// SVG Asset Generators (Razor-sharp, themed vector illustrations & diagrams)
// ---------------------------------------------------------------------------

function createSvgDataUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`
}

export const DESIGN_GRAPHICS = {
  // BRANDING ASSETS
  tbxpBrand1: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0E0F12"/>
          <stop offset="100%" stop-color="#181A20"/>
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#F15723"/>
          <stop offset="100%" stop-color="#FF7849"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <g stroke="rgba(255,255,255,0.06)" stroke-width="1">
        <line x1="0" y1="150" x2="800" y2="150"/>
        <line x1="0" y1="300" x2="800" y2="300"/>
        <line x1="0" y1="450" x2="800" y2="450"/>
        <line x1="200" y1="0" x2="200" y2="600"/>
        <line x1="400" y1="0" x2="400" y2="600"/>
        <line x1="600" y1="0" x2="600" y2="600"/>
      </g>
      <!-- Center Emblem -->
      <circle cx="400" cy="270" r="140" fill="none" stroke="rgba(241,87,35,0.2)" stroke-width="1.5" stroke-dasharray="6 6"/>
      <circle cx="400" cy="270" r="110" fill="#121318" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>
      <path d="M340 220 L460 220 L460 250 L415 250 L415 330 L385 330 L385 250 L340 250 Z" fill="url(#accent)"/>
      <path d="M430 270 L480 340 L450 340 L415 290 L430 270 Z" fill="#FFFFFF"/>
      <text x="400" y="450" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="24" font-weight="700" letter-spacing="8" text-anchor="middle">TBXP IDENTITY</text>
      <text x="400" y="480" fill="rgba(255,255,255,0.45)" font-family="system-ui, sans-serif" font-size="12" letter-spacing="4" text-anchor="middle">VISUAL SYSTEM &amp; GEOMETRIC MONOGRAM</text>
    </svg>
  `),

  tbxpBrand2: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <rect width="100%" height="100%" fill="#141519"/>
      <rect x="80" y="80" width="640" height="440" rx="16" fill="#1B1D24" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <rect x="120" y="130" width="120" height="80" rx="8" fill="#F15723"/>
      <text x="135" y="178" fill="#FFF" font-family="monospace" font-size="12" font-weight="bold">#F15723</text>
      <rect x="260" y="130" width="120" height="80" rx="8" fill="#0D0D0F"/>
      <text x="275" y="178" fill="#FFF" font-family="monospace" font-size="12" font-weight="bold">#0D0D0F</text>
      <rect x="400" y="130" width="120" height="80" rx="8" fill="#F5F3EF"/>
      <text x="415" y="178" fill="#000" font-family="monospace" font-size="12" font-weight="bold">#F5F3EF</text>
      <rect x="540" y="130" width="120" height="80" rx="8" fill="#24262F"/>
      <text x="555" y="178" fill="#FFF" font-family="monospace" font-size="12" font-weight="bold">#24262F</text>
      <text x="120" y="270" fill="#FFF" font-family="system-ui, sans-serif" font-size="20" font-weight="700" letter-spacing="2">TYPOGRAPHY SPECIMEN</text>
      <text x="120" y="320" fill="rgba(255,255,255,0.9)" font-family="system-ui, sans-serif" font-size="36" font-weight="800" letter-spacing="-0.02em">THE QUICK BROWN FOX JUMPS</text>
      <text x="120" y="365" fill="#F15723" font-family="system-ui, sans-serif" font-size="28" font-weight="400" letter-spacing="0.05em">A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</text>
      <text x="120" y="415" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="14" line-height="1.6">Designed for high-contrast digital displays and minimal physical print executions.</text>
    </svg>
  `),

  zooopBrand: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <rect width="100%" height="100%" fill="#0A0B0E"/>
      <circle cx="400" cy="240" r="120" fill="#F15723" opacity="0.12"/>
      <!-- Zooop Mascot Graphic -->
      <path d="M320 280 C320 180 480 180 480 280 C480 340 320 340 320 280 Z" fill="#16181F" stroke="#F15723" stroke-width="4"/>
      <circle cx="365" cy="250" r="16" fill="#FFF"/>
      <circle cx="370" cy="250" r="8" fill="#0A0B0E"/>
      <circle cx="435" cy="250" r="16" fill="#FFF"/>
      <circle cx="440" cy="250" r="8" fill="#0A0B0E"/>
      <path d="M380 290 Q400 315 420 290" stroke="#F15723" stroke-width="4" stroke-linecap="round" fill="none"/>
      <text x="400" y="420" fill="#FFF" font-family="system-ui, sans-serif" font-size="44" font-weight="900" letter-spacing="12" text-anchor="middle">ZOOOP</text>
      <text x="400" y="460" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="13" letter-spacing="4" text-anchor="middle">CREATIVE STUDIO &amp; PLAYFUL IDENTITY</text>
    </svg>
  `),

  mivaBrand: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <rect width="100%" height="100%" fill="#0D0E12"/>
      <g transform="translate(260, 120)">
        <polygon points="140,0 280,80 280,240 140,320 0,240 0,80" fill="#14161E" stroke="#2A2E3D" stroke-width="2"/>
        <polygon points="140,40 240,100 240,220 140,280 40,220 40,100" fill="none" stroke="#F15723" stroke-width="2.5" stroke-dasharray="10 5"/>
        <path d="M90 200 L90 120 L140 160 L190 120 L190 200" fill="none" stroke="#FFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <text x="400" y="490" fill="#FFF" font-family="system-ui, sans-serif" font-size="28" font-weight="800" letter-spacing="6" text-anchor="middle">MIVA LEARNING STUDIO</text>
      <text x="400" y="525" fill="rgba(255,255,255,0.45)" font-family="system-ui, sans-serif" font-size="12" letter-spacing="3" text-anchor="middle">ACADEMIC TECH &amp; MODULAR SYMBOLS</text>
    </svg>
  `),

  solaraBrand: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <rect width="100%" height="100%" fill="#111216"/>
      <circle cx="400" cy="240" r="100" fill="none" stroke="#F15723" stroke-width="2"/>
      <circle cx="400" cy="240" r="70" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
      <circle cx="400" cy="240" r="40" fill="#F15723"/>
      <g stroke="rgba(255,255,255,0.3)" stroke-width="1.5">
        <line x1="400" y1="100" x2="400" y2="125"/>
        <line x1="400" y1="355" x2="400" y2="380"/>
        <line x1="260" y1="240" x2="285" y2="240"/>
        <line x1="515" y1="240" x2="540" y2="240"/>
      </g>
      <text x="400" y="450" fill="#FFF" font-family="serif" font-size="34" font-weight="400" letter-spacing="10" text-anchor="middle">S O L A R A</text>
      <text x="400" y="485" fill="rgba(255,255,255,0.4)" font-family="system-ui, sans-serif" font-size="11" letter-spacing="4" text-anchor="middle">CREATIVE COLLECTIVE &amp; EDITORIAL</text>
    </svg>
  `),

  noirMarks: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <rect width="100%" height="100%" fill="#0C0D10"/>
      <g transform="translate(100, 80)">
        <!-- Grid of 6 glyphs -->
        <rect x="0" y="0" width="160" height="160" rx="12" fill="#161820" stroke="rgba(255,255,255,0.08)"/>
        <polygon points="80,35 125,120 35,120" fill="none" stroke="#F15723" stroke-width="4"/>

        <rect x="220" y="0" width="160" height="160" rx="12" fill="#161820" stroke="rgba(255,255,255,0.08)"/>
        <circle cx="300" cy="80" r="45" fill="none" stroke="#FFF" stroke-width="4"/>
        <line x1="265" y1="80" x2="335" y2="80" stroke="#F15723" stroke-width="3"/>

        <rect x="440" y="0" width="160" height="160" rx="12" fill="#161820" stroke="rgba(255,255,255,0.08)"/>
        <path d="M485 50 L555 50 L485 110 L555 110" fill="none" stroke="#FFF" stroke-width="4"/>

        <rect x="0" y="200" width="160" height="160" rx="12" fill="#161820" stroke="rgba(255,255,255,0.08)"/>
        <circle cx="80" cy="280" r="40" fill="#F15723" opacity="0.8"/>
        <circle cx="95" cy="280" r="30" fill="#161820"/>

        <rect x="220" y="200" width="160" height="160" rx="12" fill="#161820" stroke="rgba(255,255,255,0.08)"/>
        <rect x="260" y="240" width="80" height="80" fill="none" stroke="#FFF" stroke-width="4" transform="rotate(45 300 280)"/>

        <rect x="440" y="200" width="160" height="160" rx="12" fill="#161820" stroke="rgba(255,255,255,0.08)"/>
        <path d="M490 310 L520 240 L550 310 Z" fill="none" stroke="#F15723" stroke-width="3"/>
        <circle cx="520" cy="275" r="8" fill="#FFF"/>
      </g>
      <text x="400" y="520" fill="#FFF" font-family="system-ui, sans-serif" font-size="18" font-weight="700" letter-spacing="4" text-anchor="middle">NOIR LOGOMARKS &amp; BESPOKE GLYPHS</text>
    </svg>
  `),

  // PRODUCT DESIGN PREVIEWS
  mivaTestLab1: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560" width="900" height="560">
      <rect width="100%" height="100%" fill="#0E1015"/>
      <!-- App Header -->
      <rect x="40" y="30" width="820" height="50" rx="8" fill="#161820" stroke="rgba(255,255,255,0.08)"/>
      <circle cx="70" cy="55" r="6" fill="#F15723"/>
      <circle cx="90" cy="55" r="6" fill="#555"/>
      <circle cx="110" cy="55" r="6" fill="#555"/>
      <text x="140" y="60" fill="#FFF" font-family="system-ui, sans-serif" font-size="13" font-weight="700">MIVA TestLab — Adaptive Examination Suite</text>
      <!-- Main Content Layout -->
      <!-- Left Sidebar: Question Navigator -->
      <rect x="40" y="95" width="220" height="430" rx="8" fill="#14161E" stroke="rgba(255,255,255,0.06)"/>
      <text x="60" y="130" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="11" font-weight="600" letter-spacing="1">QUESTION MATRIX</text>
      <g transform="translate(60, 150)">
        <!-- Question Grid -->
        <rect x="0" y="0" width="34" height="34" rx="6" fill="#F15723"/>
        <text x="17" y="22" fill="#FFF" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">01</text>
        <rect x="44" y="0" width="34" height="34" rx="6" fill="#202430"/>
        <text x="61" y="22" fill="#FFF" font-family="system-ui, sans-serif" font-size="12" text-anchor="middle">02</text>
        <rect x="88" y="0" width="34" height="34" rx="6" fill="#202430"/>
        <text x="105" y="22" fill="#FFF" font-family="system-ui, sans-serif" font-size="12" text-anchor="middle">03</text>
        <rect x="132" y="0" width="34" height="34" rx="6" fill="#202430"/>
        <text x="149" y="22" fill="#FFF" font-family="system-ui, sans-serif" font-size="12" text-anchor="middle">04</text>
      </g>
      <!-- Center Main: Question Body -->
      <rect x="275" y="95" width="585" height="430" rx="8" fill="#181A22" stroke="rgba(255,255,255,0.06)"/>
      <text x="310" y="145" fill="#F15723" font-family="system-ui, sans-serif" font-size="11" font-weight="700" letter-spacing="2">QUESTION 01 / 40 · WAVE OPTICS</text>
      <text x="310" y="185" fill="#FFF" font-family="system-ui, sans-serif" font-size="18" font-weight="600">Calculate the angular fringe width β for monochromatic light (λ = 589nm):</text>
      <!-- Formula Box -->
      <rect x="310" y="210" width="515" height="70" rx="8" fill="#0E1015" stroke="rgba(241,87,35,0.3)"/>
      <text x="330" y="252" fill="#FFF" font-family="monospace" font-size="16">β = (λ · D) / d  |  where D = 1.5m, d = 0.25mm</text>
      <!-- Options -->
      <rect x="310" y="300" width="515" height="44" rx="6" fill="#222530"/>
      <text x="330" y="328" fill="#FFF" font-family="system-ui, sans-serif" font-size="13">A. 3.534 × 10⁻³ m</text>
      <rect x="310" y="355" width="515" height="44" rx="6" fill="#262B3A" stroke="#F15723" stroke-width="1.5"/>
      <text x="330" y="383" fill="#FFF" font-family="system-ui, sans-serif" font-size="13" font-weight="600">B. 3.534 mm  (Selected Answer)</text>
      <rect x="310" y="410" width="515" height="44" rx="6" fill="#222530"/>
      <text x="330" y="438" fill="#FFF" font-family="system-ui, sans-serif" font-size="13">C. 2.148 × 10⁻⁴ m</text>
      <!-- Action Buttons -->
      <rect x="710" y="470" width="115" height="38" rx="6" fill="#F15723"/>
      <text x="767" y="494" fill="#FFF" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">NEXT &gt;</text>
    </svg>
  `),

  mivaTestLab2: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560" width="900" height="560">
      <rect width="100%" height="100%" fill="#0D0F14"/>
      <text x="60" y="70" fill="#FFF" font-family="system-ui, sans-serif" font-size="22" font-weight="700">Real-Time Telemetry &amp; Performance Breakdown</text>
      <text x="60" y="98" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="13">Candidate Diagnostic Matrix · Overall Score: 94.2% (Top 1%)</text>
      <!-- Metric Cards -->
      <rect x="60" y="130" width="240" height="120" rx="10" fill="#161822" stroke="rgba(255,255,255,0.06)"/>
      <text x="85" y="165" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="12">SPEED ACCURACY RATIO</text>
      <text x="85" y="210" fill="#F15723" font-family="system-ui, sans-serif" font-size="32" font-weight="800">1.84s / Q</text>
      <rect x="330" y="130" width="240" height="120" rx="10" fill="#161822" stroke="rgba(255,255,255,0.06)"/>
      <text x="355" y="165" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="12">ACCURACY INDEX</text>
      <text x="355" y="210" fill="#FFF" font-family="system-ui, sans-serif" font-size="32" font-weight="800">97.5%</text>
      <rect x="600" y="130" width="240" height="120" rx="10" fill="#161822" stroke="rgba(255,255,255,0.06)"/>
      <text x="625" y="165" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="12">CONFIDENCE SCORE</text>
      <text x="625" y="210" fill="#4ADE80" font-family="system-ui, sans-serif" font-size="32" font-weight="800">HIGH</text>
      <!-- Telemetry Graph Chart -->
      <rect x="60" y="280" width="780" height="230" rx="10" fill="#13151D" stroke="rgba(255,255,255,0.06)"/>
      <path d="M100 450 Q200 410 300 370 T500 330 T700 310 T800 300" fill="none" stroke="#F15723" stroke-width="3"/>
      <path d="M100 450 Q200 410 300 370 T500 330 T700 310 T800 300 L800 470 L100 470 Z" fill="rgba(241,87,35,0.08)"/>
      <text x="90" y="315" fill="#FFF" font-family="system-ui, sans-serif" font-size="13" font-weight="600">Adaptive Difficulty Progression</text>
    </svg>
  `),

  tobixpPortfolio1: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560" width="900" height="560">
      <rect width="100%" height="100%" fill="#08090C"/>
      <!-- 3D Scene Viewport -->
      <circle cx="450" cy="240" r="160" fill="none" stroke="rgba(241,87,35,0.25)" stroke-width="2"/>
      <polygon points="450,110 570,290 330,290" fill="#151722" stroke="#F15723" stroke-width="2"/>
      <circle cx="450" cy="230" r="30" fill="#F15723"/>
      <text x="450" y="440" fill="#FFF" font-family="system-ui, sans-serif" font-size="28" font-weight="800" letter-spacing="6" text-anchor="middle">TOBI XP 3D PORTFOLIO</text>
      <text x="450" y="475" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="13" letter-spacing="3" text-anchor="middle">THREE.JS / WEBGL / CUSTOM SHADERS / SPATIAL AUDIO</text>
    </svg>
  `),

  tobixpPortfolio2: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 560" width="900" height="560">
      <rect width="100%" height="100%" fill="#0F1117"/>
      <rect x="60" y="60" width="360" height="440" rx="12" fill="#181B26" stroke="rgba(255,255,255,0.08)"/>
      <text x="90" y="110" fill="#F15723" font-family="monospace" font-size="14" font-weight="bold">01</text>
      <text x="90" y="145" fill="#FFF" font-family="system-ui, sans-serif" font-size="24" font-weight="bold">ILLUSTRATIONS</text>
      <text x="90" y="175" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="12">51 PAINTINGS · 55 SKETCHES · 19 STUDIES</text>
      <rect x="460" y="60" width="360" height="440" rx="12" fill="#181B26" stroke="#F15723" stroke-width="1.5"/>
      <text x="490" y="110" fill="#F15723" font-family="monospace" font-size="14" font-weight="bold">02</text>
      <text x="490" y="145" fill="#FFF" font-family="system-ui, sans-serif" font-size="24" font-weight="bold">DESIGNS</text>
      <text x="490" y="175" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif" font-size="12">BRANDING · PRODUCT DESIGN · STURVS</text>
      <text x="450" y="530" fill="rgba(255,255,255,0.4)" font-family="system-ui, sans-serif" font-size="12" letter-spacing="2" text-anchor="middle">HORIZONTAL SCROLL EXHIBITION ARCHITECTURE</text>
    </svg>
  `),

  // SIMULATION 1: WAVE OPTICS & INTERFERENCE
  simWave1: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <rect width="100%" height="100%" fill="#0A0D14"/>
      <text x="40" y="50" fill="#F15723" font-family="monospace" font-size="11" letter-spacing="2">SIM 01 · WAVE OPTICS</text>
      <text x="40" y="80" fill="#FFF" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Young's Double-Slit Overview &amp; Slit Geometry</text>
      <!-- Optical Bench Diagram -->
      <line x1="80" y1="260" x2="720" y2="260" stroke="rgba(255,255,255,0.15)" stroke-dasharray="4 4"/>
      <!-- Source Light -->
      <circle cx="120" cy="260" r="14" fill="#F15723"/>
      <!-- Double Slit Barrier -->
      <rect x="280" y="120" width="8" height="110" fill="#333"/>
      <rect x="280" y="245" width="8" height="30" fill="#333"/>
      <rect x="280" y="290" width="8" height="110" fill="#333"/>
      <!-- Waves -->
      <path d="M290 238 C350 200, 420 180, 680 160" fill="none" stroke="#F15723" stroke-width="1.5" opacity="0.7"/>
      <path d="M290 282 C350 300, 420 320, 680 340" fill="none" stroke="#F15723" stroke-width="1.5" opacity="0.7"/>
      <!-- Detection Screen -->
      <rect x="680" y="120" width="10" height="280" fill="#1C202C" stroke="rgba(255,255,255,0.2)"/>
      <text x="40" y="450" fill="rgba(255,255,255,0.6)" font-family="system-ui, sans-serif" font-size="12">Real-time parameters: Slit Separation d = 0.22mm · Distance D = 1.2m · λ = 632.8nm</text>
    </svg>
  `),

  simWave2: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <rect width="100%" height="100%" fill="#07090E"/>
      <text x="40" y="50" fill="#F15723" font-family="monospace" font-size="11" letter-spacing="2">SIM 01 · PATTERN FIELD</text>
      <text x="40" y="80" fill="#FFF" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Diffraction Fringe Intensity Heatmap</text>
      <!-- Interference Bands -->
      <g transform="translate(60, 130)">
        <rect x="0" y="0" width="680" height="240" rx="8" fill="#0E121B"/>
        <!-- Fringes -->
        <rect x="330" y="10" width="20" height="220" fill="#F15723" opacity="0.95"/>
        <rect x="270" y="20" width="16" height="200" fill="#F15723" opacity="0.75"/>
        <rect x="394" y="20" width="16" height="200" fill="#F15723" opacity="0.75"/>
        <rect x="215" y="40" width="12" height="160" fill="#F15723" opacity="0.45"/>
        <rect x="453" y="40" width="12" height="160" fill="#F15723" opacity="0.45"/>
        <rect x="165" y="60" width="10" height="120" fill="#F15723" opacity="0.2"/>
        <rect x="505" y="60" width="10" height="120" fill="#F15723" opacity="0.2"/>
      </g>
      <text x="400" y="430" fill="rgba(255,255,255,0.7)" font-family="system-ui, sans-serif" font-size="13" text-anchor="middle">Central Maxima (m=0) &amp; Higher-Order Interference Bright Fringes</text>
    </svg>
  `),

  simWave3: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <rect width="100%" height="100%" fill="#0B0E15"/>
      <text x="40" y="50" fill="#F15723" font-family="monospace" font-size="11" letter-spacing="2">SIM 01 · WAVEFORM ANALYSIS</text>
      <text x="40" y="80" fill="#FFF" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Phase Intensity Profile I(θ) = I₀ cos²(β) [sin(α)/α]²</text>
      <g transform="translate(60, 130)">
        <line x1="0" y1="200" x2="680" y2="200" stroke="#444"/>
        <line x1="340" y1="20" x2="340" y2="220" stroke="#444" stroke-dasharray="2 2"/>
        <path d="M40 200 Q150 195 220 180 T290 140 T340 30 T390 140 T460 180 T640 200" fill="none" stroke="#F15723" stroke-width="3"/>
      </g>
      <text x="40" y="440" fill="rgba(255,255,255,0.6)" font-family="monospace" font-size="12">Peak Intensity I_max = 4.00 W/m² · Slit Phase Shift Δφ = 0.00 rad</text>
    </svg>
  `),

  // SIMULATION 2: ORBITAL MECHANICS & GRAVITATIONAL SLINGSHOT
  simOrbit1: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <rect width="100%" height="100%" fill="#080A10"/>
      <text x="40" y="50" fill="#F15723" font-family="monospace" font-size="11" letter-spacing="2">SIM 02 · ORBITAL MECHANICS</text>
      <text x="40" y="80" fill="#FFF" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Multi-Body Gravitational Potential Well &amp; Planetary Gravity</text>
      <!-- Central Star -->
      <circle cx="360" cy="270" r="32" fill="#F15723"/>
      <circle cx="360" cy="270" r="50" fill="none" stroke="rgba(241,87,35,0.3)" stroke-width="1.5"/>
      <!-- Planet -->
      <circle cx="580" cy="220" r="16" fill="#3B82F6"/>
      <ellipse cx="360" cy="270" rx="230" ry="110" fill="none" stroke="rgba(255,255,255,0.15)" stroke-dasharray="4 4"/>
      <!-- Slingshot Probe Path -->
      <path d="M120 440 Q 480 380 560 250 T 700 80" fill="none" stroke="#F15723" stroke-width="2.5"/>
      <text x="40" y="450" fill="rgba(255,255,255,0.6)" font-family="system-ui, sans-serif" font-size="12">N-Body Numerical Integrator (Euler-Verlet) · Energy Conservation ΔE/E &lt; 10⁻⁶</text>
    </svg>
  `),

  simOrbit2: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <rect width="100%" height="100%" fill="#080A10"/>
      <text x="40" y="50" fill="#F15723" font-family="monospace" font-size="11" letter-spacing="2">SIM 02 · DELTA-V VECTORING</text>
      <text x="40" y="80" fill="#FFF" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Orbital Insertion &amp; Hyperbolic Trajectory Assist</text>
      <!-- Planet Close up -->
      <circle cx="400" cy="260" r="70" fill="#1E293B" stroke="#3B82F6" stroke-width="3"/>
      <!-- Trajectory -->
      <path d="M160 400 C320 370 380 340 370 200 C360 120 480 90 640 100" fill="none" stroke="#F15723" stroke-width="3"/>
      <!-- Vector arrows -->
      <line x1="370" y1="200" x2="430" y2="170" stroke="#FFF" stroke-width="2"/>
      <polygon points="430,170 422,170 426,176" fill="#FFF"/>
      <text x="440" y="170" fill="#FFF" font-family="monospace" font-size="12">Δv = +2.4 km/s</text>
      <text x="40" y="450" fill="rgba(255,255,255,0.6)" font-family="system-ui, sans-serif" font-size="12">Gravity Assist Velocity Boost · Exit Hyperbolic Anomaly e = 1.42</text>
    </svg>
  `),

  simOrbit3: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <rect width="100%" height="100%" fill="#080A10"/>
      <text x="40" y="50" fill="#F15723" font-family="monospace" font-size="11" letter-spacing="2">SIM 02 · FLIGHT TELEMETRY</text>
      <text x="40" y="80" fill="#FFF" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Real-Time Orbital Telemetry &amp; Specific Energy</text>
      <g transform="translate(60, 130)">
        <rect x="0" y="0" width="680" height="220" rx="8" fill="#11141E"/>
        <path d="M20 180 Q200 170 350 110 T500 40 T660 30" fill="none" stroke="#F15723" stroke-width="2.5"/>
        <path d="M20 60 Q200 70 350 120 T500 170 T660 180" fill="none" stroke="#3B82F6" stroke-width="2" stroke-dasharray="4 4"/>
      </g>
      <text x="90" y="380" fill="#F15723" font-family="system-ui, sans-serif" font-size="12">■ Kinetic Energy Ek</text>
      <text x="260" y="380" fill="#3B82F6" font-family="system-ui, sans-serif" font-size="12">■ Potential Energy Ep</text>
      <text x="40" y="440" fill="rgba(255,255,255,0.6)" font-family="monospace" font-size="12">Apoapsis: 42,164 km · Periapsis: 350 km · Eccentricity: 0.729</text>
    </svg>
  `),

  // SIMULATION 3: NEURAL SYNAPSE & ACTION POTENTIAL
  simNeuro1: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <rect width="100%" height="100%" fill="#0B0D14"/>
      <text x="40" y="50" fill="#F15723" font-family="monospace" font-size="11" letter-spacing="2">SIM 03 · NEURAL SYNAPSE</text>
      <text x="40" y="80" fill="#FFF" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Synaptic Cleft &amp; Neurotransmitter Vesicle Exocytosis</text>
      <!-- Pre-synaptic terminal -->
      <path d="M120 120 C240 120 380 200 480 200 C580 200 700 120 700 120" fill="none" stroke="#F15723" stroke-width="3"/>
      <!-- Vesicles -->
      <circle cx="340" cy="160" r="10" fill="#F15723"/>
      <circle cx="380" cy="170" r="10" fill="#F15723"/>
      <circle cx="440" cy="180" r="10" fill="#F15723"/>
      <!-- Neurotransmitters floating -->
      <circle cx="360" cy="240" r="4" fill="#FFF"/>
      <circle cx="420" cy="235" r="4" fill="#FFF"/>
      <circle cx="480" cy="250" r="4" fill="#FFF"/>
      <!-- Post-synaptic membrane -->
      <path d="M120 320 C240 320 380 280 480 280 C580 280 700 320 700 320" fill="none" stroke="#3B82F6" stroke-width="3"/>
      <text x="40" y="450" fill="rgba(255,255,255,0.6)" font-family="system-ui, sans-serif" font-size="12">Calcium Ca²⁺ Influx triggers Acetylcholine (ACh) Exocytosis across 20nm Synaptic Cleft</text>
    </svg>
  `),

  simNeuro2: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <rect width="100%" height="100%" fill="#0B0D14"/>
      <text x="40" y="50" fill="#F15723" font-family="monospace" font-size="11" letter-spacing="2">SIM 03 · ION CHANNEL GATE</text>
      <text x="40" y="80" fill="#FFF" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Voltage-Gated Sodium (Na⁺) &amp; Potassium (K⁺) Gating</text>
      <!-- Membrane Bilayer -->
      <rect x="60" y="200" width="680" height="40" fill="#1A1F2C"/>
      <!-- Na+ Channel -->
      <rect x="260" y="180" width="60" height="80" rx="8" fill="#F15723"/>
      <text x="290" y="225" fill="#FFF" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">Na⁺</text>
      <!-- K+ Channel -->
      <rect x="480" y="180" width="60" height="80" rx="8" fill="#3B82F6"/>
      <text x="510" y="225" fill="#FFF" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">K⁺</text>
      <text x="40" y="440" fill="rgba(255,255,255,0.6)" font-family="system-ui, sans-serif" font-size="12">Hodgkin-Huxley Ion Conductance (gNa, gK) · Equilibrium Potentials: E_Na = +55mV, E_K = -90mV</text>
    </svg>
  `),

  simNeuro3: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <rect width="100%" height="100%" fill="#0B0D14"/>
      <text x="40" y="50" fill="#F15723" font-family="monospace" font-size="11" letter-spacing="2">SIM 03 · ACTION POTENTIAL</text>
      <text x="40" y="80" fill="#FFF" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Action Potential Membrane Depolarization Spike Curve</text>
      <g transform="translate(80, 130)">
        <line x1="0" y1="180" x2="640" y2="180" stroke="#333"/>
        <line x1="0" y1="140" x2="640" y2="140" stroke="#444" stroke-dasharray="3 3"/>
        <text x="650" y="145" fill="rgba(255,255,255,0.5)" font-family="monospace" font-size="10">-55mV Threshold</text>
        <path d="M40 180 L160 180 Q200 170 240 140 L300 20 L350 200 L420 210 L520 180 L600 180" fill="none" stroke="#F15723" stroke-width="3"/>
      </g>
      <text x="40" y="440" fill="rgba(255,255,255,0.6)" font-family="monospace" font-size="12">Resting: -70mV ➔ Peak: +35mV ➔ Hyperpolarization: -85mV (Refractory Period 1.2ms)</text>
    </svg>
  `),

  // SIMULATION 4: QUANTUM LOGIC & BLOCH SPHERE
  simQuantum1: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <rect width="100%" height="100%" fill="#08090E"/>
      <text x="40" y="50" fill="#F15723" font-family="monospace" font-size="11" letter-spacing="2">SIM 04 · BLOCH SPHERE</text>
      <text x="40" y="80" fill="#FFF" font-family="system-ui, sans-serif" font-size="18" font-weight="700">3D Qubit State Vector |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩</text>
      <!-- 3D Sphere Wireframe -->
      <g transform="translate(400, 260)">
        <circle cx="0" cy="0" r="120" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
        <ellipse cx="0" cy="0" rx="120" ry="40" fill="none" stroke="rgba(255,255,255,0.12)" stroke-dasharray="3 3"/>
        <line x1="0" y1="-140" x2="0" y2="140" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
        <text x="5" y="-145" fill="#FFF" font-family="monospace" font-size="12">|0⟩</text>
        <text x="5" y="155" fill="#FFF" font-family="monospace" font-size="12">|1⟩</text>
        <!-- State vector -->
        <line x1="0" y1="0" x2="70" y2="-80" stroke="#F15723" stroke-width="3"/>
        <circle cx="70" cy="-80" r="5" fill="#F15723"/>
      </g>
      <text x="40" y="450" fill="rgba(255,255,255,0.6)" font-family="system-ui, sans-serif" font-size="12">Superposition Angles: Polar θ = π/3, Azimuthal φ = π/4</text>
    </svg>
  `),

  simQuantum2: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <rect width="100%" height="100%" fill="#08090E"/>
      <text x="40" y="50" fill="#F15723" font-family="monospace" font-size="11" letter-spacing="2">SIM 04 · QUANTUM CIRCUITS</text>
      <text x="40" y="80" fill="#FFF" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Quantum Logic Pipeline &amp; Entanglement Bell State Generator</text>
      <!-- Circuit Wires -->
      <g transform="translate(80, 160)">
        <text x="0" y="25" fill="#FFF" font-family="monospace" font-size="14">q₀ |0⟩</text>
        <line x1="60" y1="20" x2="620" y2="20" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
        <text x="0" y="105" fill="#FFF" font-family="monospace" font-size="14">q₁ |0⟩</text>
        <line x1="60" y1="100" x2="620" y2="100" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
        <!-- Hadamard Gate -->
        <rect x="140" y="0" width="40" height="40" rx="6" fill="#F15723"/>
        <text x="160" y="25" fill="#FFF" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">H</text>
        <!-- CNOT Gate -->
        <circle cx="280" cy="20" r="6" fill="#FFF"/>
        <line x1="280" y1="20" x2="280" y2="100" stroke="#FFF" stroke-width="2"/>
        <circle cx="280" cy="100" r="14" fill="none" stroke="#FFF" stroke-width="2"/>
        <line x1="280" y1="88" x2="280" y2="112" stroke="#FFF" stroke-width="2"/>
        <line x1="268" y1="100" x2="292" y2="100" stroke="#FFF" stroke-width="2"/>
        <!-- Measurement Box -->
        <rect x="440" y="0" width="40" height="40" rx="6" fill="#2A2E3D"/>
        <rect x="440" y="80" width="40" height="40" rx="6" fill="#2A2E3D"/>
      </g>
      <text x="40" y="440" fill="rgba(255,255,255,0.6)" font-family="system-ui, sans-serif" font-size="12">Generates Bell State |Φ⁺⟩ = (|00⟩ + |11⟩) / √2 with 100% Quantum Fidelity</text>
    </svg>
  `),

  simQuantum3: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
      <rect width="100%" height="100%" fill="#08090E"/>
      <text x="40" y="50" fill="#F15723" font-family="monospace" font-size="11" letter-spacing="2">SIM 04 · PROBABILITY DENSITY</text>
      <text x="40" y="80" fill="#FFF" font-family="system-ui, sans-serif" font-size="18" font-weight="700">Measurement Probability Superposition Collapse</text>
      <g transform="translate(100, 150)">
        <rect x="0" y="20" width="120" height="160" rx="6" fill="#F15723"/>
        <text x="60" y="10" fill="#FFF" font-family="monospace" font-size="13" text-anchor="middle">50.0% |00⟩</text>
        <rect x="180" y="180" width="120" height="0" rx="6" fill="#333"/>
        <text x="240" y="170" fill="rgba(255,255,255,0.4)" font-family="monospace" font-size="13" text-anchor="middle">0.0% |01⟩</text>
        <rect x="360" y="180" width="120" height="0" rx="6" fill="#333"/>
        <text x="420" y="170" fill="rgba(255,255,255,0.4)" font-family="monospace" font-size="13" text-anchor="middle">0.0% |10⟩</text>
        <rect x="540" y="20" width="120" height="160" rx="6" fill="#F15723"/>
        <text x="600" y="10" fill="#FFF" font-family="monospace" font-size="13" text-anchor="middle">50.0% |11⟩</text>
      </g>
      <text x="40" y="440" fill="rgba(255,255,255,0.6)" font-family="system-ui, sans-serif" font-size="12">1024 Simulated Measurement Shots · Zero Cross-Talk Error</text>
    </svg>
  `),
}

// ---------------------------------------------------------------------------
// BRANDING PROJECTS LIST
// ---------------------------------------------------------------------------
export const BRANDING_PROJECTS: BrandingProject[] = [
  {
    id: 'tbx-identity',
    title: 'TBXP Brand Identity System',
    tagline: 'Futuristic Minimalist Monogram & Design Language',
    category: 'Visual System',
    client: 'TBXP Studio',
    year: '2026',
    deliverables: ['Monogram', 'Grid System', 'Typography Guidelines', 'Dark UI Kit'],
    description:
      'A bespoke visual identity forged from pure geometry and cinematic minimalism. Built for high-contrast digital interfaces, spatial 3D environments, and physical apparel.',
    palette: ['#0E0F12', '#F15723', '#F5F3EF', '#24262F'],
    images: [
      {
        id: 'tbx-1',
        title: 'Geometric Monogram Construction',
        caption: 'Vector precision grid alignment for TBXP brand mark.',
        image: DESIGN_GRAPHICS.tbxpBrand1,
      },
      {
        id: 'tbx-2',
        title: 'Brand Palette & Typography Specimen',
        caption: 'High-contrast typography system designed for dark and light mode rendering.',
        image: DESIGN_GRAPHICS.tbxpBrand2,
      },
    ],
  },
  {
    id: 'zooop-studio',
    title: 'Zooop Creative Studio',
    tagline: 'Dynamic Character-Driven Creative Identity',
    category: 'Mascot & Identity',
    client: 'Zooop Creative',
    year: '2025',
    deliverables: ['Character Logo', 'Sticker System', 'Stationery', 'Social Kit'],
    description:
      'A playful, expressive identity featuring an iconic character silhouette and bold neon-tinged accents that bridges playful illustration with polished studio branding.',
    palette: ['#0A0B0E', '#F15723', '#FFFFFF', '#16181F'],
    images: [
      {
        id: 'zooop-1',
        title: 'Character Mascot Emblem',
        caption: 'Signature playful character mark and dynamic wordmark.',
        image: DESIGN_GRAPHICS.zooopBrand,
      },
    ],
  },
  {
    id: 'miva-brand',
    title: 'MIVA Learning Studio',
    tagline: 'Academic Tech Architecture & Modular Glyphs',
    category: 'Brand Architecture',
    client: 'MIVA University',
    year: '2025',
    deliverables: ['Hexagonal Symbolics', 'Color Theory', 'Digital Guidelines'],
    description:
      'A modern academic brand system combining structured hexagonal geometric symbolism with clean modern typography for next-generation educational technologies.',
    palette: ['#0D0E12', '#F15723', '#2A2E3D', '#FFFFFF'],
    images: [
      {
        id: 'miva-1',
        title: 'Modular Hexagonal Brand Symbol',
        caption: 'Modular academic emblem representing synthesis of science and design.',
        image: DESIGN_GRAPHICS.mivaBrand,
      },
    ],
  },
  {
    id: 'solara-creative',
    title: 'Solara Creative Collective',
    tagline: 'Editorial Luxury & Solar Aesthetics',
    category: 'Editorial Identity',
    client: 'Solara Collective',
    year: '2024',
    deliverables: ['Wordmark', 'Embossed Marks', 'Editorial Layouts'],
    description:
      'Warm ambient gradients, astronomical coordinates, and refined serif typography created for a curated creative art and design publication.',
    palette: ['#111216', '#F15723', '#E2DCD5', '#454955'],
    images: [
      {
        id: 'solara-1',
        title: 'Solar Emblem & Serif Wordmark',
        caption: 'Minimalist luxury aesthetic with astronomical ring system.',
        image: DESIGN_GRAPHICS.solaraBrand,
      },
    ],
  },
  {
    id: 'noir-marks',
    title: 'Noir Monograms & Custom Glyphs',
    tagline: 'Curated Suite of Bespoke Vector Insignias',
    category: 'Logo Marks',
    client: 'Various / Experimental',
    year: '2024 – 2026',
    deliverables: ['12 Vector Marks', 'Monograms', 'Abstract Glyphs'],
    description:
      'An ongoing exploratory collection of minimal vector symbols, monogram glyphs, and high-impact abstract marks for modern digital applications.',
    palette: ['#0C0D10', '#F15723', '#FFFFFF', '#161820'],
    images: [
      {
        id: 'noir-1',
        title: 'Vector Logomarks Matrix',
        caption: 'Explorations in geometric reduction, balance, and spatial contrast.',
        image: DESIGN_GRAPHICS.noirMarks,
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// PRODUCT DESIGN PROJECTS LIST (With 2–3 previews for simulations!)
// ---------------------------------------------------------------------------
export const PRODUCT_PROJECTS: ProductProject[] = [
  {
    id: 'miva-testlab',
    title: 'MIVA TestLab',
    subtitle: 'Adaptive STEM Assessment & Interactive Examination Platform',
    category: 'Digital Product & EdTech',
    role: 'Lead Product Designer & Design Engineer',
    timeline: '2024 – Present',
    overview:
      'A next-generation adaptive examination and interactive simulation engine engineered for university-level STEM curriculums. Built with real-time performance telemetry, distraction-free focus modes, and dynamic LaTeX formula rendering.',
    features: [
      'Distraction-free examination interface with zero cognitive clutter',
      'Dynamic question matrices with multi-step adaptive grading',
      'Real-time diagnostic telemetry and candidate speed-accuracy analysis',
      'Seamless support for embedded interactive 2D/3D physics simulations',
    ],
    techStack: ['Figma', 'React', 'TypeScript', 'Tailwind CSS', 'KaTeX', 'Web Audio API'],
    metrics: [
      { label: 'Active University Users', value: '12,000+' },
      { label: 'Simulations Executed', value: '180,000+' },
      { label: 'Avg Session Speedup', value: '42%' },
    ],
    previews: [
      {
        id: 'testlab-prev-1',
        title: 'Exam Runner & Question Matrix',
        caption: 'Focused assessment runner with real-time formula rendering and step navigation.',
        image: DESIGN_GRAPHICS.mivaTestLab1,
      },
      {
        id: 'testlab-prev-2',
        title: 'Real-Time Diagnostic Telemetry',
        caption: 'Live performance metrics, difficulty adaptation curve, and speed telemetry.',
        image: DESIGN_GRAPHICS.mivaTestLab2,
      },
    ],
  },
  {
    id: 'tobixp-portfolio',
    title: 'TOBI XP 3D Portfolio',
    subtitle: 'Cinematic WebGL Personal Experience & Spatial Design',
    category: 'Interactive Web & 3D',
    role: 'Creative Developer & UI/UX Designer',
    timeline: '2025 – 2026',
    overview:
      'An award-winning personal web experience featuring custom real-time Three.js 3D character interactions, GLSL shaders, directional spatial audio, fluid horizontal scroll exhibition storytelling, and pure typography hierarchy.',
    features: [
      'Interactive 3D character with physics-based mouse tracking and lighting response',
      'Pinned vertical-to-horizontal fluid exhibition gallery transition',
      'Synchronous zero-flash Dark/Light theme switching engine',
      'Ambient 8-bar electronic beat synthesis with interactive sound controls',
    ],
    techStack: ['Three.js', 'React', 'WebGL', 'Framer Motion', 'TypeScript', 'Tailwind CSS'],
    metrics: [
      { label: 'Lighthouse Performance', value: '99/100' },
      { label: 'Global Frame Rate', value: '60 FPS' },
      { label: 'Bundle Footprint', value: 'Ultra-Lean' },
    ],
    previews: [
      {
        id: 'portfolio-prev-1',
        title: '3D Scene Character Viewport',
        caption: 'Three.js character rig with realtime lighting and directional shaders.',
        image: DESIGN_GRAPHICS.tobixpPortfolio1,
      },
      {
        id: 'portfolio-prev-2',
        title: 'Horizontal Works Exhibition',
        caption: 'Fluid horizontal scroll gallery translating vertical scroll velocity into smooth pan.',
        image: DESIGN_GRAPHICS.tobixpPortfolio2,
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// SELECTED INTERACTIVE LEARNING SIMULATIONS (2–3 image previews each!)
// ---------------------------------------------------------------------------
export const SIMULATION_PROJECTS: SimulationProject[] = [
  {
    id: 'sim-wave-optics',
    title: 'Wave Optics & Double-Slit Simulator',
    subject: 'Physics · Wave Phenomena & Interference',
    equation: 'I(θ) = I₀ · cos²(π·d·sinθ / λ) · [sin(π·a·sinθ / λ) / (π·a·sinθ / λ)]²',
    description:
      'An interactive wave simulation modeling Young’s double-slit experiment, diffraction envelope harmonics, wavelength frequency tuning (380nm–750nm), and phase shift dynamics.',
    specs: [
      'Interactive wavelength slider from ultraviolet to deep infrared',
      'Real-time Slit width (a) & separation (d) optical adjustment',
      'Live mathematical waveform graph rendering intensity cross-section',
    ],
    tags: ['Wave Optics', 'Diffraction', 'Interference', 'Physics Engine'],
    previews: [
      {
        id: 'wave-prev-1',
        title: 'Optical Bench & Slit Geometry Overview',
        caption: 'Double-slit barrier setup with real-time beam propagation and slit geometry.',
        image: DESIGN_GRAPHICS.simWave1,
      },
      {
        id: 'wave-prev-2',
        title: 'Diffraction Fringe Pattern Field',
        caption: 'Interference pattern heatmap with central and higher-order maxima fringes.',
        image: DESIGN_GRAPHICS.simWave2,
      },
      {
        id: 'wave-prev-3',
        title: 'Mathematical Waveform & Phase Intensity Curve',
        caption: 'Real-time intensity profile chart I(θ) computed via Fourier optics.',
        image: DESIGN_GRAPHICS.simWave3,
      },
    ],
  },
  {
    id: 'sim-orbital-mechanics',
    title: 'Orbital Mechanics & Gravitational Slingshot',
    subject: 'Astrophysics · N-Body Gravitation & Celestial Trajectories',
    equation: 'd²r/dt² = -G · Σ [ Mᵢ · (r - rᵢ) / |r - rᵢ|³ ]',
    description:
      'An astrophysics simulator calculating n-body gravitational potential fields, planetary orbital insertion vectors, and gravity-assist slingshots.',
    specs: [
      'Euler-Verlet numerical integration with sub-millisecond precision',
      'Interactive delta-V thruster vectoring with hyperbolic escape calculations',
      'Real-time kinetic, potential, and total mechanical energy telemetry graphs',
    ],
    tags: ['Astrophysics', 'N-Body Gravity', 'Orbital Mechanics', 'Trajectory Calc'],
    previews: [
      {
        id: 'orbit-prev-1',
        title: 'Multi-Body Gravitational Field & Orbit Vectors',
        caption: 'Planetary gravitational potential well with real-time planetary orbits.',
        image: DESIGN_GRAPHICS.simOrbit1,
      },
      {
        id: 'orbit-prev-2',
        title: 'Orbital Insertion & Delta-V Thrust Vectoring',
        caption: 'Hyperbolic slingshot maneuver providing gravity-assist velocity boost.',
        image: DESIGN_GRAPHICS.simOrbit2,
      },
      {
        id: 'orbit-prev-3',
        title: 'Real-Time Flight Telemetry & Specific Energy',
        caption: 'Dynamic energy conservation graphs plotting apoapsis, periapsis, and speed.',
        image: DESIGN_GRAPHICS.simOrbit3,
      },
    ],
  },
  {
    id: 'sim-neural-synapse',
    title: 'Neural Synapse & Action Potential Engine',
    subject: 'Neurobiology · Biophysical Ion Dynamics',
    equation: 'C_m · (dV/dt) = -g_Na·m³h·(V - E_Na) - g_K·n⁴·(V - E_K) - g_L·(V - E_L) + I_ext',
    description:
      'A biophysical simulation of synaptic transmission, neurotransmitter vesicle exocytosis, voltage-gated ion channels (Na+/K+ pump), and action potential depolarization.',
    specs: [
      'Hodgkin-Huxley mathematical differential equation solver',
      'Patch-clamp voltage stimulation with adjustable millivolt pulses',
      'Ion concentration gradient tracking with refractory period timing',
    ],
    tags: ['Neurobiology', 'Action Potential', 'Ion Channels', 'Hodgkin-Huxley'],
    previews: [
      {
        id: 'neuro-prev-1',
        title: 'Synaptic Cleft & Vesicle Fusion Exocytosis',
        caption: 'Neurotransmitter release across 20nm synaptic junction into receptor gates.',
        image: DESIGN_GRAPHICS.simNeuro1,
      },
      {
        id: 'neuro-prev-2',
        title: 'Voltage-Gated Ion Channel Patch Clamp',
        caption: 'Selective gating dynamics of voltage-dependent Na+ and K+ channels.',
        image: DESIGN_GRAPHICS.simNeuro2,
      },
      {
        id: 'neuro-prev-3',
        title: 'Action Potential Depolarization Curve',
        caption: 'Real-time action potential spike graph from -70mV resting to +35mV peak.',
        image: DESIGN_GRAPHICS.simNeuro3,
      },
    ],
  },
  {
    id: 'sim-quantum-logic',
    title: 'Quantum Logic Gate & Bloch Sphere',
    subject: 'Quantum Information · Qubit Superposition & Entanglement',
    equation: '|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)·sin(θ/2)|1⟩',
    description:
      'A visual quantum computing state simulator rendering unitary logic gate matrix transformations on a 3D Bloch sphere, Bell state entanglement, and measurement collapses.',
    specs: [
      'Interactive 3D Bloch sphere vector rotations (H, X, Y, Z, Phase, CNOT)',
      'Multi-qubit circuit drag-and-drop pipeline editor',
      'Statistical measurement histogram with 1024-shot probability collapse',
    ],
    tags: ['Quantum Computing', 'Bloch Sphere', 'Qubit Superposition', 'Bell States'],
    previews: [
      {
        id: 'quantum-prev-1',
        title: '3D Bloch Sphere Qubit State Vector',
        caption: 'State vector |ψ⟩ positioning on Bloch sphere with polar and azimuthal angles.',
        image: DESIGN_GRAPHICS.simQuantum1,
      },
      {
        id: 'quantum-prev-2',
        title: 'Quantum Logic Circuit Pipeline',
        caption: 'Hadamard and CNOT gate sequence generating maximally entangled Bell states.',
        image: DESIGN_GRAPHICS.simQuantum2,
      },
      {
        id: 'quantum-prev-3',
        title: 'Measurement Superposition Collapse Histogram',
        caption: 'Statistical shot distribution showing 50/50 quantum state collapse probabilities.',
        image: DESIGN_GRAPHICS.simQuantum3,
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// STURVS (FREEFORM CANVAS ARTIFACTS)
// ---------------------------------------------------------------------------
export const STURVS_ITEMS: SturvCanvasItem[] = [
  {
    id: 'sturv-1',
    title: 'COOKING FOREVER — Kinetic Poster',
    category: 'Kinetic Typography',
    tags: ['Typography', 'Poster', 'After Effects'],
    notes: 'Experimental typographic layout exploring high-impact editorial weights and bold orange accents.',
    x: 420,
    y: 360,
    width: 320,
    height: 420,
    rotation: -2.5,
    badge: 'EXPERIMENT 01',
    image: DESIGN_GRAPHICS.tbxpBrand1,
  },
  {
    id: 'sturv-2',
    title: 'MIVA TestLab Micro-Interaction',
    category: 'UI/UX Experiment',
    tags: ['Product Design', 'Figma', 'Prototyping'],
    notes: 'Quick-response formula solver interaction prototype built for high-stakes test runners.',
    x: 840,
    y: 280,
    width: 360,
    height: 280,
    rotation: 1.8,
    badge: 'PROTOTYPE',
    image: DESIGN_GRAPHICS.mivaTestLab1,
  },
  {
    id: 'sturv-3',
    title: 'Bloch Sphere 3D Wireframe',
    category: '3D & Science',
    tags: ['Quantum', 'WebGL', 'Three.js'],
    notes: 'Vector representation of complex state vectors on a unit sphere.',
    x: 1300,
    y: 320,
    width: 340,
    height: 340,
    rotation: -1.2,
    badge: '3D STUDY',
    image: DESIGN_GRAPHICS.simQuantum1,
  },
  {
    id: 'sturv-4',
    title: 'Zooop Neon Sticker Pack',
    category: 'Brand Collateral',
    tags: ['Illustration', 'Branding', 'Vector'],
    notes: 'Custom character sticker assets designed for physical laptop decals and digital reactions.',
    x: 520,
    y: 860,
    width: 300,
    height: 300,
    rotation: 3.2,
    badge: 'STICKER SET',
    image: DESIGN_GRAPHICS.zooopBrand,
  },
  {
    id: 'sturv-5',
    title: 'Wave Optics Interference Fringe',
    category: 'Computational Art',
    tags: ['Simulation', 'Math', 'Physics'],
    notes: 'Fourier optics wave harmonics calculated in real time across a 2D scalar field.',
    x: 920,
    y: 680,
    width: 380,
    height: 260,
    rotation: -3.0,
    badge: 'MATH ART',
    image: DESIGN_GRAPHICS.simWave2,
  },
  {
    id: 'sturv-6',
    title: 'Noir Monogram Explorations',
    category: 'Graphic Identity',
    tags: ['Logomark', 'Vector', 'Minimalism'],
    notes: 'Studies in optical weight reduction and geometric balance for vector lettermarks.',
    x: 1380,
    y: 740,
    width: 320,
    height: 320,
    rotation: 2.1,
    badge: 'IDENTITY',
    image: DESIGN_GRAPHICS.noirMarks,
  },
  {
    id: 'sturv-7',
    title: '3D Portfolio Scene Lighting Rig',
    category: 'Creative Tech',
    tags: ['Three.js', 'GLSL', 'Lighting'],
    notes: 'Multi-point directional lighting setup with soft shadow occlusion and orange rim highlights.',
    x: 460,
    y: 1260,
    width: 380,
    height: 280,
    rotation: -1.8,
    badge: 'SHADER LAB',
    image: DESIGN_GRAPHICS.tobixpPortfolio1,
  },
  {
    id: 'sturv-8',
    title: 'Solara Astronomical Typography',
    category: 'Editorial Design',
    tags: ['Typography', 'Editorial', 'Print'],
    notes: 'Curated editorial spread pairing Cormorant Upright with modern geometric sans-serif.',
    x: 940,
    y: 1040,
    width: 340,
    height: 380,
    rotation: 2.5,
    badge: 'EDITORIAL',
    image: DESIGN_GRAPHICS.solaraBrand,
  },
  {
    id: 'sturv-9',
    title: 'Gravitational Slingshot Vector Map',
    category: 'Physics Diagram',
    tags: ['Astrophysics', 'Diagram', 'Delta-V'],
    notes: 'Visual proof of orbital mechanics momentum transfer in three-body celestial systems.',
    x: 1360,
    y: 1140,
    width: 360,
    height: 280,
    rotation: -2.0,
    badge: 'DIAGRAM',
    image: DESIGN_GRAPHICS.simOrbit2,
  },
  {
    id: 'sturv-10',
    title: 'Synaptic Vesicle Patch Clamp Data',
    category: 'Biophysics Concept',
    tags: ['Neurobiology', 'Telemetry', 'Charts'],
    notes: 'Real-time voltage clamp measurements of neurotransmitter exocytosis across the cleft.',
    x: 1800,
    y: 440,
    width: 350,
    height: 290,
    rotation: 1.5,
    badge: 'BIOLOGY',
    image: DESIGN_GRAPHICS.simNeuro3,
  },
  {
    id: 'sturv-11',
    title: 'TBXP Design System Tokens',
    category: 'Design Engineering',
    tags: ['Design System', 'Tokens', 'Tailwind'],
    notes: 'Full dark/light token hierarchy with CSS variable bindings for micro-interactions.',
    x: 1840,
    y: 840,
    width: 360,
    height: 320,
    rotation: -1.6,
    badge: 'SYSTEM',
    image: DESIGN_GRAPHICS.tbxpBrand2,
  },
  {
    id: 'sturv-12',
    title: 'MIVA Diagnostic Matrix Heatmap',
    category: 'Data Visualization',
    tags: ['Analytics', 'Telemetry', 'UI'],
    notes: 'Multi-tier difficulty progression telemetry for adaptive testing sessions.',
    x: 1820,
    y: 1240,
    width: 360,
    height: 280,
    rotation: 2.8,
    badge: 'ANALYTICS',
    image: DESIGN_GRAPHICS.mivaTestLab2,
  },
]
