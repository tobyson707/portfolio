// Interaction-flow checks for the Works section at one viewport.
// Usage: node flows.cjs <width> <height> <mobile 1|0>
const { chromium, devices } = require('playwright')
const W = +process.argv[2], H = +process.argv[3], MOBILE = process.argv[4] === '1'
const BASE = 'http://localhost:3000/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); }

;(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
  const ctx = await browser.newContext(
    MOBILE ? { ...devices['iPhone 13'], viewport: { width: W, height: H } } : { viewport: { width: W, height: H } }
  )
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
  const bad = []
  page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()) })

  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => !document.querySelector('.loading-screen'), null, { timeout: 90000 })
  await page.evaluate(() => {
    window.__marker = 1
    window.__draws = 0
    const c = document.querySelector('.scene-bg canvas')
    const gl = c && (c.getContext('webgl2') || c.getContext('webgl'))
    if (gl) for (const fn of ['drawElements', 'drawArrays']) { const o = gl[fn].bind(gl); gl[fn] = (...a) => { window.__draws++; return o(...a) } }
  })
  const draws = () => page.evaluate(async () => { const d = window.__draws; await new Promise((r) => setTimeout(r, 600)); return window.__draws - d })
  const state = () => page.evaluate(() => ({
    marker: window.__marker === 1,
    overflow: document.body.style.overflow,
    scrollY: Math.round(scrollY),
    detailOpen: Boolean(document.querySelector('.wk-detail, .sturvs-canvas-overlay')),
    nested: Boolean(document.querySelector('.wk-viewer-root, .product-detail-modal-root, .sturvs-artwork-viewer')),
    navVisible: Boolean(document.querySelector('.nav-trigger-wrapper')),
    variantImgs: [...document.querySelectorAll('img')].filter((i) => i.currentSrc.includes('/_responsive/')).length,
    brokenImgs: [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map((i) => i.getAttribute('src')),
  }))
  // Scroll so the given option is inside the horizontally-translated track, then tap/click it
  const openOption = async (selector, nth = 0) => {
    await page.evaluate(({ selector, nth }) => {
      const el = document.querySelectorAll(selector)[nth]
      const gallery = document.querySelector('.wk-gallery')
      const card = el.closest('.wk-card')
      window.scrollTo(0, gallery.getBoundingClientRect().top + scrollY + Math.max(0, card.offsetLeft - 20))
    }, { selector, nth })
    await sleep(700)
    const loc = page.locator(selector).nth(nth)
    if (MOBILE) await loc.tap({ timeout: 5000 })
    else await loc.click({ timeout: 5000 })
    await sleep(1400)
  }
  const optionSel = '.wk-card-cover, .wk-cat-btn'
  const n = await page.locator(optionSel).count()
  check('option count > 0', n > 0, `${n} options`)
  const idle = await draws()
  check('3D scene renders when idle', idle > 0, `${idle} draws/600ms`)

  // 1) Every option opens, renders without broken images, and closes cleanly
  for (let i = 0; i < n; i++) {
    const label = await page.locator(optionSel).nth(i).getAttribute('aria-label')
    await openOption(optionSel, i)
    let s = await state()
    check(`open[${label}] opens detail, no reload`, s.detailOpen && s.marker, JSON.stringify({ overflow: s.overflow, nav: s.navVisible }))
    check(`open[${label}] no broken images`, s.brokenImgs.length === 0, s.brokenImgs.slice(0, 3).join(', '))
    if (MOBILE) {
      const d = await draws()
      check(`open[${label}] WebGL paused behind overlay (mobile)`, d === 0, `${d} draws`)
    }
    await page.keyboard.press('Escape')
    await sleep(800)
    s = await state()
    if (s.detailOpen) { await page.locator('.wk-detail-close, .sturvs-return-btn').first().click({ force: true }); await sleep(800); s = await state() }
    check(`close[${label}] restores page`, !s.detailOpen && s.overflow === '' && s.navVisible && s.marker, JSON.stringify(s))
  }
  const resumed = await draws()
  check('3D scene resumes after closing', resumed > 0, `${resumed} draws/600ms`)

  // 2) Repeated rapid selection of different projects
  for (let r = 0; r < 3; r++) {
    for (const i of [1, 2, 3]) {
      await openOption(optionSel, i)
      await page.keyboard.press('Escape')
      await sleep(500)
    }
  }
  let s = await state()
  check('repeated selection (9 open/close cycles) stays stable', s.marker && !s.detailOpen && s.overflow === '', JSON.stringify(s))

  // 3) Back gesture closes the detail and keeps the Works scroll position
  await openOption(optionSel, 1)
  const yBefore = (await state()).scrollY
  await page.goBack()
  await sleep(1000)
  s = await state()
  check('back gesture closes detail without reload', !s.detailOpen && s.marker, JSON.stringify(s))
  check('back gesture keeps scroll position (no jump to top)', Math.abs(s.scrollY - yBefore) < 5, `before ${yBefore} after ${s.scrollY}`)

  // 4) Nested overlay: image viewer inside a gallery. Closing it keeps the gallery's modal lock.
  await openOption(optionSel, 1)
  await page.locator('.wk-masonry-tile').first().click()
  await sleep(900)
  s = await state()
  check('image viewer opens', s.nested, '')
  await page.keyboard.press('Escape')
  await sleep(800)
  s = await state()
  check('Escape closes only the image viewer', !s.nested && s.detailOpen, JSON.stringify(s))
  check('gallery keeps modal lock after nested close (nav hidden, scroll locked)', !s.navVisible && s.overflow === 'hidden', JSON.stringify(s))
  await page.keyboard.press('Escape')
  await sleep(800)

  // 5) Nested Product Design project: Escape closes the project, not the whole category
  const prodIdx = await page.evaluate((sel) => [...document.querySelectorAll(sel)].findIndex((e) => /PRODUCT/i.test(e.getAttribute('aria-label') || '')), optionSel)
  if (prodIdx >= 0) {
    await openOption(optionSel, prodIdx)
    await page.locator('.product-catalogue-card').first().click()
    await sleep(1000)
    await page.keyboard.press('Escape')
    await sleep(800)
    s = await state()
    check('Escape on product project keeps Product Design open', !s.nested && s.detailOpen, JSON.stringify(s))
    await page.keyboard.press('Escape')
    await sleep(800)
  }

  // 6) Navigation between sections still works after all of the above
  // (the site uses html { scroll-behavior: smooth }, so request instant scrolls for deterministic reads)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await sleep(300)
  const resumeTop = await page.evaluate(() => { document.getElementById('resume').scrollIntoView({ behavior: 'instant' }); return Math.round(document.getElementById('resume').getBoundingClientRect().top) })
  await sleep(300)
  s = await state()
  check('page scrolls between sections afterwards', s.scrollY > 0 && Math.abs(resumeTop) < 3 && s.overflow === '', `scrollY ${s.scrollY}, resume top ${resumeTop}`)

  check('no JS errors', errors.length === 0, errors.slice(0, 5).join(' | '))
  check('no failed requests', bad.length === 0, bad.slice(0, 5).join(' | '))
  const failed = results.filter((r) => !r.ok)
  console.log(`[${W}x${H} ${MOBILE ? 'mobile-emulated' : 'desktop'}] ${results.length - failed.length}/${results.length} checks passed`)
  for (const r of failed) console.log('  FAIL', r.name, '::', r.detail)
  await browser.close()
})().catch((e) => { console.error(`[${W}x${H}] FLOW SCRIPT ERROR`, e.message); process.exit(1) })
