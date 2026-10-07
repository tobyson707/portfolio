import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const outputDir = path.resolve('public/videos/product-design');
const tempDir = path.resolve('tmp_video_frames');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const WIDTH = 1280;
const HEIGHT = 800;
const TOTAL_FRAMES = 90; // 3 seconds @ 30fps

function cleanTemp() {
  const files = fs.readdirSync(tempDir);
  for (const f of files) {
    fs.unlinkSync(path.join(tempDir, f));
  }
}

// -------------------------------------------------------------
// 1. MIVA TestLab: Dynamic Wave Optics & Interactive Assessment
// -------------------------------------------------------------
function generateMivaFrames() {
  cleanTemp();
  console.log('Generating MIVA TestLab frames...');
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const progress = i / TOTAL_FRAMES;
    const t = progress * Math.PI * 2;

    // Generate dynamic wave interference lines
    let wavePaths = '';
    for (let w = 0; w < 7; w++) {
      const freq = 0.015 + w * 0.003;
      const amp = 35 + Math.sin(t + w) * 15;
      const yBase = 460 + w * 28;
      let d = `M 140 ${yBase}`;
      for (let x = 140; x <= 800; x += 15) {
        const y = yBase + Math.sin(x * freq + t * 2 + w * 0.8) * amp * Math.sin((x - 140) / 660 * Math.PI);
        d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      const opacity = (0.25 + (w / 7) * 0.65).toFixed(2);
      wavePaths += `<path d="${d}" fill="none" stroke="#F15723" stroke-width="2.5" stroke-opacity="${opacity}" stroke-linecap="round" />`;
    }

    const radarAngle = (progress * 360).toFixed(1);
    const pulseRadius = (40 + Math.sin(t) * 12).toFixed(1);
    const scoreVal = (94 + Math.sin(t) * 4).toFixed(1);
    const telemetryStep = Math.floor(progress * 12) + 1;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0E1015"/>
          <stop offset="100%" stop-color="#07080A"/>
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#F15723"/>
          <stop offset="100%" stop-color="#FF8A00"/>
        </linearGradient>
      </defs>

      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
      
      <!-- Subtle Grid Background -->
      <g stroke="rgba(255,255,255,0.04)" stroke-width="1">
        ${Array.from({ length: 17 }, (_, k) => `<line x1="${k * 80}" y1="0" x2="${k * 80}" y2="${HEIGHT}" />`).join('')}
        ${Array.from({ length: 11 }, (_, k) => `<line x1="0" y1="${k * 80}" x2="${WIDTH}" y2="${k * 80}" />`).join('')}
      </g>

      <!-- App Header Bar -->
      <rect x="60" y="50" width="1160" height="64" rx="8" fill="#141720" stroke="rgba(255,255,255,0.08)"/>
      <circle cx="95" cy="82" r="7" fill="#F15723"/>
      <text x="118" y="87" fill="#FFFFFF" font-family="sans-serif" font-size="15" font-weight="700" letter-spacing="1">MIVA TESTLAB · STEM SIMULATION EXAM</text>
      <rect x="880" y="68" width="130" height="28" rx="14" fill="rgba(241,87,35,0.15)" stroke="#F15723" stroke-width="1"/>
      <text x="945" y="86" fill="#F15723" font-family="sans-serif" font-size="11" font-weight="700" text-anchor="middle">LIVE SESSION</text>
      <text x="1120" y="87" fill="rgba(255,255,255,0.6)" font-family="monospace" font-size="14" text-anchor="middle">01:42:${String(Math.floor(60 - progress * 60)).padStart(2, '0')}</text>

      <!-- Left Main Visual Simulator Pane -->
      <rect x="60" y="134" width="780" height="616" rx="12" fill="#101218" stroke="rgba(255,255,255,0.08)"/>
      <text x="100" y="180" fill="#F15723" font-family="monospace" font-size="12" font-weight="700" letter-spacing="2">EXPERIMENT 04: DOUBLE-SLIT WAVE DIFFRACTION</text>
      <text x="100" y="210" fill="#FFFFFF" font-family="sans-serif" font-size="22" font-weight="700">λ = 632.8 nm (He-Ne Laser Interference Pattern)</text>
      
      <!-- Slit barriers -->
      <rect x="140" y="250" width="18" height="120" rx="3" fill="#202430"/>
      <rect x="140" y="410" width="18" height="60" rx="3" fill="#202430"/>
      <rect x="140" y="510" width="18" height="180" rx="3" fill="#202430"/>

      <!-- Wave Propagation -->
      ${wavePaths}

      <!-- Dynamic Formula Card inside Pane -->
      <rect x="490" y="250" width="310" height="110" rx="8" fill="rgba(20,24,34,0.9)" stroke="rgba(255,255,255,0.12)"/>
      <text x="515" y="280" fill="#FF8A00" font-family="monospace" font-size="12" font-weight="700">INTERFERENCE EQUATION</text>
      <text x="515" y="315" fill="#FFFFFF" font-family="sans-serif" font-size="18" font-weight="700">y_m = (m · λ · L) / d</text>
      <text x="515" y="342" fill="rgba(255,255,255,0.5)" font-family="sans-serif" font-size="12">Fringe Spacing Δy: 4.82 mm ± 0.02</text>

      <!-- Right Telemetry & Matrix Sidebar -->
      <rect x="860" y="134" width="360" height="616" rx="12" fill="#101218" stroke="rgba(255,255,255,0.08)"/>
      <text x="890" y="180" fill="#F15723" font-family="monospace" font-size="12" font-weight="700" letter-spacing="2">DIAGNOSTIC TELEMETRY</text>
      
      <!-- Live Radar Circle -->
      <g transform="translate(1040, 290)">
        <circle r="70" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>
        <circle r="45" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
        <circle r="${pulseRadius}" fill="rgba(241,87,35,0.06)" stroke="#F15723" stroke-width="1.5"/>
        <line x1="0" y1="0" x2="${Math.cos(radarAngle * Math.PI / 180) * 70}" y2="${Math.sin(radarAngle * Math.PI / 180) * 70}" stroke="#FF8A00" stroke-width="2"/>
        <circle cx="0" cy="0" r="4" fill="#F15723"/>
      </g>
      <text x="1040" y="390" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="700" text-anchor="middle">ACCURACY INDEX: ${scoreVal}%</text>

      <!-- Matrix Questions Grid -->
      <text x="890" y="440" fill="rgba(255,255,255,0.6)" font-family="monospace" font-size="11" font-weight="700" letter-spacing="1">QUESTION MATRIX (STEP ${telemetryStep}/12)</text>
      <g transform="translate(890, 460)">
        ${Array.from({ length: 12 }, (_, q) => {
          const row = Math.floor(q / 4);
          const col = q % 4;
          const isDone = q < telemetryStep;
          const isCurr = q === telemetryStep - 1;
          const bgCol = isCurr ? '#F15723' : isDone ? 'rgba(241,87,35,0.25)' : '#181C26';
          const strokeCol = isCurr ? '#FFA040' : isDone ? '#F15723' : 'rgba(255,255,255,0.1)';
          const textCol = isCurr ? '#FFFFFF' : isDone ? '#FFA040' : 'rgba(255,255,255,0.4)';
          return `
            <rect x="${col * 74}" y="${row * 60}" width="64" height="48" rx="6" fill="${bgCol}" stroke="${strokeCol}" stroke-width="1.5"/>
            <text x="${col * 74 + 32}" y="${row * 60 + 30}" fill="${textCol}" font-family="monospace" font-size="13" font-weight="700" text-anchor="middle">${String(q + 1).padStart(2, '0')}</text>
          `;
        }).join('')}
      </g>

      <!-- Bottom Status Pill -->
      <rect x="890" y="664" width="300" height="48" rx="8" fill="url(#accentGrad)"/>
      <text x="1040" y="694" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="700" letter-spacing="1" text-anchor="middle">VERIFY SIMULATION STEP →</text>
    </svg>`;

    const svgFile = path.join(tempDir, `frame_${String(i).padStart(3, '0')}.svg`);
    fs.writeFileSync(svgFile, svg);
  }

  const outFile = path.join(outputDir, 'miva-testlab.mp4');
  execSync(`ffmpeg -y -framerate 30 -i "${tempDir}/frame_%03d.svg" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 -movflags +faststart -crf 19 "${outFile}"`);
  console.log('MIVA TestLab MP4 generated:', outFile);
}

// -------------------------------------------------------------
// 2. TOBI XP: Cinematic 3D WebGL Portfolio & Spatial Scene
// -------------------------------------------------------------
function generateTobiXpFrames() {
  cleanTemp();
  console.log('Generating TOBI XP frames...');
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const progress = i / TOTAL_FRAMES;
    const t = progress * Math.PI * 2;

    const angleY = t;
    const angleX = Math.sin(t) * 0.35;

    // 3D Polyhedral Monogram wireframe nodes projection
    const nodes = [
      [-120, -120, -120], [120, -120, -120], [120, 120, -120], [-120, 120, -120],
      [-120, -120, 120], [120, -120, 120], [120, 120, 120], [-120, 120, 120],
      [0, -170, 0], [0, 170, 0], [-170, 0, 0], [170, 0, 0],
    ];

    const edges = [
      [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7],
      [8,0],[8,1],[8,4],[8,5],[9,2],[9,3],[9,6],[9,7],[10,0],[10,3],[10,4],[10,7],
      [11,1],[11,2],[11,5],[11,6],
    ];

    // Project nodes
    const projected = nodes.map(([x, y, z]) => {
      let x1 = x * Math.cos(angleY) + z * Math.sin(angleY);
      let z1 = -x * Math.sin(angleY) + z * Math.cos(angleY);
      let y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
      let z2 = y * Math.sin(angleX) + z1 * Math.cos(angleX);
      const scale = 400 / (400 + z2);
      return [640 + x1 * scale * 1.5, 410 + y2 * scale * 1.5, z2];
    });

    let wireLines = '';
    for (const [p1, p2] of edges) {
      const [x1, y1, z1] = projected[p1];
      const [x2, y2, z2] = projected[p2];
      const avgZ = (z1 + z2) / 2;
      const op = Math.max(0.15, Math.min(0.9, (avgZ + 180) / 360)).toFixed(2);
      wireLines += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#F15723" stroke-width="2" stroke-opacity="${op}" />`;
    }

    let wireNodes = '';
    for (const [nx, ny, nz] of projected) {
      const nodeOp = Math.max(0.2, (nz + 180) / 360).toFixed(2);
      wireNodes += `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="4.5" fill="#FFFFFF" fill-opacity="${nodeOp}" stroke="#F15723" stroke-width="1.5" />`;
    }

    // Floating particles
    let particles = '';
    for (let p = 0; p < 24; p++) {
      const px = (640 + Math.sin(t + p * 0.7) * (260 + p * 12)).toFixed(1);
      const py = (410 + Math.cos(t * 1.3 + p * 0.9) * (160 + p * 8)).toFixed(1);
      const pr = (1.5 + Math.sin(t * 2 + p) * 1).toFixed(1);
      particles += `<circle cx="${px}" cy="${py}" r="${pr}" fill="#FF8A00" opacity="0.6"/>`;
    }

    const marqueeOffset = (progress * -400).toFixed(1);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
      <defs>
        <radialGradient id="tobiGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(241,87,35,0.22)"/>
          <stop offset="60%" stop-color="rgba(241,87,35,0.04)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
      </defs>

      <rect width="${WIDTH}" height="${HEIGHT}" fill="#0A0B0E"/>

      <!-- Ambient Core Glow -->
      <circle cx="640" cy="410" r="380" fill="url(#tobiGlow)"/>

      <!-- Top Branding Navigation Bar -->
      <g transform="translate(60, 50)">
        <text x="0" y="30" fill="#FFFFFF" font-family="sans-serif" font-size="18" font-weight="900" letter-spacing="2">TOBI XP</text>
        <text x="130" y="30" fill="rgba(255,255,255,0.4)" font-family="monospace" font-size="12" letter-spacing="1">/ THREE.JS · WEBGL ENGINE</text>
        <rect x="990" y="8" width="170" height="32" rx="16" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
        <circle cx="1012" cy="24" r="5" fill="#00E676"/>
        <text x="1028" y="29" fill="#FFFFFF" font-family="sans-serif" font-size="11" font-weight="700">60 FPS REALTIME</text>
      </g>

      <!-- Background Animated Coordinates & Display Info -->
      <text x="640" y="160" fill="rgba(255,255,255,0.06)" font-family="sans-serif" font-size="96" font-weight="900" text-anchor="middle" letter-spacing="12">EXPERIENCE</text>
      <text x="120" y="410" fill="rgba(255,255,255,0.35)" font-family="monospace" font-size="11" letter-spacing="2">ROT_Y: ${(angleY * 180 / Math.PI % 360).toFixed(1)}°<tspan x="120" dy="20">ROT_X: ${(angleX * 180 / Math.PI).toFixed(1)}°</tspan><tspan x="120" dy="20">VERTICES: 12</tspan><tspan x="120" dy="20">SHADERS: GLSL PBR</tspan></text>

      <text x="1160" y="410" fill="rgba(255,255,255,0.35)" font-family="monospace" font-size="11" letter-spacing="2" text-anchor="end">DRAW CALLS: 1<tspan x="1160" dy="20">GEOMETRY: POLYHEDRON</tspan><tspan x="1160" dy="20">DPR: 2.0 RETINA</tspan><tspan x="1160" dy="20">AUDIO: SPATIAL 3D</tspan></text>

      <!-- Particles -->
      ${particles}

      <!-- 3D Wireframe Sculpture -->
      ${wireLines}
      ${wireNodes}

      <!-- Bottom Fluid Marquee Strip -->
      <rect x="0" y="730" width="${WIDTH}" height="70" fill="#0D0E14" stroke="rgba(255,255,255,0.06)"/>
      <g transform="translate(${marqueeOffset}, 772)">
        ${Array.from({ length: 8 }, (_, m) => `
          <text x="${m * 320}" y="0" fill="#F15723" font-family="sans-serif" font-size="13" font-weight="800" letter-spacing="3">CRAFTING DIGITAL EXPERIENCES ·</text>
        `).join('')}
      </g>
    </svg>`;

    const svgFile = path.join(tempDir, `frame_${String(i).padStart(3, '0')}.svg`);
    fs.writeFileSync(svgFile, svg);
  }

  const outFile = path.join(outputDir, 'tobi-xp.mp4');
  execSync(`ffmpeg -y -framerate 30 -i "${tempDir}/frame_%03d.svg" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 -movflags +faststart -crf 19 "${outFile}"`);
  console.log('TOBI XP MP4 generated:', outFile);
}

// -------------------------------------------------------------
// 3. The Horizon Command: Orbital Telemetry & Kinematics Deck
// -------------------------------------------------------------
function generateHorizonFrames() {
  cleanTemp();
  console.log('Generating Horizon Command frames...');
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const progress = i / TOTAL_FRAMES;
    const t = progress * Math.PI * 2;

    const shipAngle = t;
    const shipR_X = 320;
    const shipR_Y = 160;
    const shipX = 540 + Math.cos(shipAngle) * shipR_X;
    const shipY = 430 + Math.sin(shipAngle) * shipR_Y;

    const ship2Angle = t * 1.6 + 1.2;
    const ship2X = 540 + Math.cos(ship2Angle) * 190;
    const ship2Y = 430 + Math.sin(ship2Angle) * 95;

    const velocityVal = (7.82 + Math.cos(shipAngle) * 1.2).toFixed(2);
    const altVal = (418 + Math.sin(shipAngle) * 45).toFixed(1);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
      <defs>
        <radialGradient id="planetGrad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#283244"/>
          <stop offset="70%" stop-color="#121620"/>
          <stop offset="100%" stop-color="#080A0E"/>
        </radialGradient>
      </defs>

      <rect width="${WIDTH}" height="${HEIGHT}" fill="#08090C"/>

      <!-- Gravitational Potential Contour Rings -->
      <g stroke="rgba(0, 229, 255, 0.07)" stroke-width="1" fill="none">
        ${[80, 140, 210, 290, 380, 480].map(r => `<ellipse cx="540" cy="430" rx="${r * 1.6}" ry="${r * 0.8}" />`).join('')}
      </g>

      <!-- Tactical Deck Header -->
      <rect x="50" y="40" width="1180" height="60" rx="6" fill="#10131A" stroke="rgba(255,255,255,0.08)"/>
      <text x="80" y="76" fill="#00E5FF" font-family="monospace" font-size="13" font-weight="700" letter-spacing="2">HORIZON COMMAND · ORBITAL TELEMETRY SUITE</text>
      <rect x="1000" y="54" width="200" height="32" rx="4" fill="rgba(0, 229, 255, 0.12)" stroke="#00E5FF" stroke-width="1"/>
      <text x="1100" y="74" fill="#00E5FF" font-family="monospace" font-size="12" font-weight="700" text-anchor="middle">TRAJECTORY LOCKED</text>

      <!-- Central Planetary Body -->
      <circle cx="540" cy="430" r="70" fill="url(#planetGrad)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
      <circle cx="540" cy="430" r="74" fill="none" stroke="#00E5FF" stroke-width="1" opacity="0.4"/>

      <!-- Elliptical Orbits -->
      <ellipse cx="540" cy="430" rx="${shipR_X}" ry="${shipR_Y}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" stroke-dasharray="6,4"/>
      <ellipse cx="540" cy="430" rx="190" ry="95" fill="none" stroke="rgba(241,87,35,0.3)" stroke-width="1.2"/>

      <!-- Primary Spacecraft Vector -->
      <circle cx="${shipX.toFixed(1)}" cy="${shipY.toFixed(1)}" r="7" fill="#00E5FF"/>
      <line x1="${shipX.toFixed(1)}" y1="${shipY.toFixed(1)}" x2="${(shipX - Math.sin(shipAngle) * 50).toFixed(1)}" y2="${(shipY + Math.cos(shipAngle) * 25).toFixed(1)}" stroke="#00E5FF" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="${shipX.toFixed(1)}" cy="${shipY.toFixed(1)}" r="16" fill="none" stroke="#00E5FF" stroke-width="1" opacity="0.6"/>

      <!-- Secondary Relay Craft -->
      <circle cx="${ship2X.toFixed(1)}" cy="${ship2Y.toFixed(1)}" r="5" fill="#F15723"/>

      <!-- Left Telemetry Readings Block -->
      <rect x="50" y="120" width="280" height="630" rx="8" fill="#10131A" stroke="rgba(255,255,255,0.08)"/>
      <text x="75" y="160" fill="#00E5FF" font-family="monospace" font-size="11" font-weight="700" letter-spacing="1">VELOCITY GRADIENT</text>
      <text x="75" y="198" fill="#FFFFFF" font-family="sans-serif" font-size="28" font-weight="800">${velocityVal} <tspan font-size="14" fill="rgba(255,255,255,0.5)">km/s</tspan></text>

      <text x="75" y="260" fill="#00E5FF" font-family="monospace" font-size="11" font-weight="700" letter-spacing="1">PERIAPSIS ALTITUDE</text>
      <text x="75" y="298" fill="#FFFFFF" font-family="sans-serif" font-size="28" font-weight="800">${altVal} <tspan font-size="14" fill="rgba(255,255,255,0.5)">km</tspan></text>

      <text x="75" y="360" fill="#00E5FF" font-family="monospace" font-size="11" font-weight="700" letter-spacing="1">DELTA-V BURNS</text>
      <text x="75" y="398" fill="#F15723" font-family="sans-serif" font-size="28" font-weight="800">+842 <tspan font-size="14" fill="rgba(255,255,255,0.5)">m/s</tspan></text>

      <line x1="75" y1="440" x2="305" y2="440" stroke="rgba(255,255,255,0.08)"/>

      <!-- Right Graph Monitor -->
      <rect x="950" y="120" width="280" height="630" rx="8" fill="#10131A" stroke="rgba(255,255,255,0.08)"/>
      <text x="975" y="160" fill="#00E5FF" font-family="monospace" font-size="11" font-weight="700" letter-spacing="1">SPECIFIC ENERGY MATRIX</text>

      <!-- Animated Waveform Trace on Monitor -->
      <path d="M 975 260 Q 1030 ${210 + Math.sin(t) * 30} 1090 260 T 1205 260" fill="none" stroke="#00E5FF" stroke-width="2.5"/>
      <text x="975" y="310" fill="rgba(255,255,255,0.6)" font-family="monospace" font-size="11">TOTAL ENERGY: -29.4 MJ/kg</text>
      <text x="975" y="335" fill="rgba(255,255,255,0.6)" font-family="monospace" font-size="11">ECCENTRICITY: e = 0.042</text>
      <text x="975" y="360" fill="rgba(255,255,255,0.6)" font-family="monospace" font-size="11">INCLINATION: i = 28.5°</text>

      <rect x="975" y="400" width="230" height="280" rx="6" fill="#0A0C10" stroke="rgba(255,255,255,0.06)"/>
      <text x="995" y="435" fill="#F15723" font-family="monospace" font-size="11" font-weight="700">THRUSTER KINEMATICS</text>
      <line x1="995" y1="520" x2="1185" y2="520" stroke="rgba(255,255,255,0.1)"/>
      <circle cx="${(1090 + Math.cos(t) * 60).toFixed(1)}" cy="520" r="8" fill="#F15723"/>
      <text x="995" y="580" fill="#FFFFFF" font-family="monospace" font-size="12">GIMBAL PITCH: ${(Math.sin(t) * 12).toFixed(1)}°</text>
      <text x="995" y="610" fill="#FFFFFF" font-family="monospace" font-size="12">GIMBAL YAW: ${(Math.cos(t) * 8).toFixed(1)}°</text>
      <text x="995" y="640" fill="#00E5FF" font-family="monospace" font-size="12">STATUS: NOMINAL</text>
    </svg>`;

    const svgFile = path.join(tempDir, `frame_${String(i).padStart(3, '0')}.svg`);
    fs.writeFileSync(svgFile, svg);
  }

  const outFile = path.join(outputDir, 'horizon-command.mp4');
  execSync(`ffmpeg -y -framerate 30 -i "${tempDir}/frame_%03d.svg" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 -movflags +faststart -crf 19 "${outFile}"`);
  console.log('Horizon Command MP4 generated:', outFile);
}

// -------------------------------------------------------------
// 4. The Crimson Casefile: Biophysical Neural Matrix
// -------------------------------------------------------------
function generateCrimsonFrames() {
  cleanTemp();
  console.log('Generating Crimson Casefile frames...');
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const progress = i / TOTAL_FRAMES;
    const t = progress * Math.PI * 2;

    // Action potential spike curve calculation
    let spikePath = 'M 100 480';
    for (let x = 100; x <= 620; x += 8) {
      const normX = (x - 100) / 520;
      let val = -70; // resting potential mV
      // Gaussian action potential spike
      const spikeCenter = (progress * 1.4 - 0.2);
      const dist = normX - spikeCenter;
      if (Math.abs(dist) < 0.18) {
        val += Math.exp(-Math.pow(dist / 0.05, 2)) * 105; // peak at +35mV
        val -= Math.exp(-Math.pow((dist - 0.08) / 0.04, 2)) * 18; // hyperpolarization undershoot
      }
      const y = 480 - (val + 70) * 2.8;
      spikePath += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }

    // Synaptic Vesicles exocytosis animation
    let vesicles = '';
    for (let v = 0; v < 16; v++) {
      const vProg = (progress + v / 16) % 1.0;
      const vx = (800 + (v % 4) * 65 + Math.sin(t + v) * 12).toFixed(1);
      const vy = (240 + vProg * 260).toFixed(1);
      const vr = (8 + Math.sin(t * 2 + v) * 2).toFixed(1);
      const op = (1 - vProg * 0.7).toFixed(2);
      vesicles += `<circle cx="${vx}" cy="${vy}" r="${vr}" fill="#E53935" opacity="${op}"/>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
      <defs>
        <linearGradient id="crimsonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#180C0E"/>
          <stop offset="100%" stop-color="#0A0607"/>
        </linearGradient>
      </defs>

      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#crimsonGrad)"/>

      <!-- Dossier Header -->
      <rect x="50" y="40" width="1180" height="64" rx="6" fill="#201014" stroke="rgba(229,57,53,0.3)"/>
      <text x="80" y="78" fill="#E53935" font-family="monospace" font-size="14" font-weight="700" letter-spacing="2">THE CRIMSON CASEFILE · NEURO-BIOPHYSICAL DOSSIER</text>
      <rect x="1000" y="56" width="200" height="32" rx="4" fill="rgba(229,57,53,0.18)" stroke="#E53935" stroke-width="1"/>
      <text x="1100" y="76" fill="#E53935" font-family="monospace" font-size="12" font-weight="700" text-anchor="middle">PATCH-CLAMP ACTIVE</text>

      <!-- Left Action Potential Oscilloscope -->
      <rect x="50" y="128" width="620" height="622" rx="10" fill="#12080A" stroke="rgba(229,57,53,0.2)"/>
      <text x="80" y="170" fill="#E53935" font-family="monospace" font-size="12" font-weight="700" letter-spacing="1">MEMBRANE VOLTAGE OSCILLOSCOPE (mV / ms)</text>
      
      <!-- Oscilloscope grid -->
      <g stroke="rgba(229,57,53,0.08)" stroke-width="1">
        ${[220, 300, 380, 460, 540, 620].map(y => `<line x1="80" y1="${y}" x2="640" y2="${y}"/>`).join('')}
        ${[160, 240, 320, 400, 480, 560].map(x => `<line x1="${x}" y1="190" x2="${x}" y2="670"/>`).join('')}
      </g>

      <text x="640" y="225" fill="#E53935" font-family="monospace" font-size="11" text-anchor="end">+40 mV</text>
      <text x="640" y="385" fill="rgba(255,255,255,0.4)" font-family="monospace" font-size="11" text-anchor="end">0 mV</text>
      <text x="640" y="485" fill="rgba(255,255,255,0.4)" font-family="monospace" font-size="11" text-anchor="end">-70 mV (Resting)</text>

      <!-- Active Action Potential Trace -->
      <path d="${spikePath}" fill="none" stroke="#E53935" stroke-width="3" stroke-linecap="round"/>

      <!-- Right Synaptic Junction Schematic -->
      <rect x="690" y="128" width="540" height="622" rx="10" fill="#12080A" stroke="rgba(229,57,53,0.2)"/>
      <text x="720" y="170" fill="#E53935" font-family="monospace" font-size="12" font-weight="700" letter-spacing="1">20nm SYNAPTIC CLEFT &amp; EXOCYTOSIS</text>

      <!-- Presynaptic & Postsynaptic membranes -->
      <path d="M 720 220 C 850 200 1070 200 1200 220" fill="none" stroke="#FFA726" stroke-width="6"/>
      <path d="M 720 520 C 850 540 1070 540 1200 520" fill="none" stroke="#42A5F5" stroke-width="6"/>

      <!-- Vesicles floating down -->
      ${vesicles}

      <!-- Bottom Diagnostics Telemetry -->
      <rect x="720" y="580" width="480" height="130" rx="8" fill="#1E0B0E" stroke="rgba(229,57,53,0.25)"/>
      <text x="750" y="615" fill="#E53935" font-family="monospace" font-size="12" font-weight="700">ION CONDUCTANCE TELEMETRY</text>
      <text x="750" y="650" fill="#FFFFFF" font-family="monospace" font-size="13">g_Na+ PEAK: 120 mS/cm² (Rapid Influx)</text>
      <text x="750" y="680" fill="#FFFFFF" font-family="monospace" font-size="13">g_K+ DELAYED: 36 mS/cm² (Repolarization)</text>
    </svg>`;

    const svgFile = path.join(tempDir, `frame_${String(i).padStart(3, '0')}.svg`);
    fs.writeFileSync(svgFile, svg);
  }

  const outFile = path.join(outputDir, 'crimson-casefile.mp4');
  execSync(`ffmpeg -y -framerate 30 -i "${tempDir}/frame_%03d.svg" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 -movflags +faststart -crf 19 "${outFile}"`);
  console.log('Crimson Casefile MP4 generated:', outFile);
}

async function main() {
  generateMivaFrames();
  generateTobiXpFrames();
  generateHorizonFrames();
  generateCrimsonFrames();
  cleanTemp();
  fs.rmdirSync(tempDir);
  console.log('All 4 Product Design MP4 videos generated successfully!');
}

main().catch(err => {
  console.error('Error generating videos:', err);
  process.exit(1);
});
