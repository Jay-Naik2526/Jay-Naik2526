// Generates every visual in the README as a self-hosted SVG, in the deep-sea style of jaynaik's portfolio.
// Nothing here depends on a third-party image server, so nothing can fail to load.
//
//   node scripts/build.mjs                 build everything
//   node scripts/build.mjs --only=plankton refresh just the contribution grid (what the nightly workflow runs)
//
// The contribution grid needs the GitHub CLI (`gh auth login`) or, in Actions, GH_TOKEN.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const LOGIN = process.env.GH_LOGIN ?? 'Jay-Naik2526'
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7)
const out = new URL('../assets/', import.meta.url)
mkdirSync(out, { recursive: true })
const save = (name, svg) => { writeFileSync(new URL(name, out), svg); console.log('wrote', name, `${(svg.length / 1024).toFixed(1)} KB`) }
const want = (k) => !only || only === k

/* ---------------------------------------------------------------- shared bits */
const SANS = "'SF Pro Display','Helvetica Neue',Helvetica,Arial,sans-serif"
const MONO = "'SF Mono','JetBrains Mono',Menlo,Consolas,'DejaVu Sans Mono',monospace"
const SERIF = "'Instrument Serif',Georgia,'Times New Roman',serif"
const GLOW = '#7cf3ff'
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const rnd = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647) }
const wrap = (text, max) => { const out = []; let line = ''; for (const w of text.split(' ')) { if ((line + ' ' + w).trim().length > max) { out.push(line); line = w } else line = (line + ' ' + w).trim() } if (line) out.push(line); return out }

function bubbles(n, W, H, seed, { fill = 'rgba(255,255,255,.06)', stroke = 'rgba(255,255,255,.45)' } = {}) {
  const r = rnd(seed)
  return Array.from({ length: n }, () => {
    const x = Math.round(r() * W), rad = (1.5 + r() * r() * 7).toFixed(1), dur = (7 + r() * 9).toFixed(1), begin = -(r() * 14).toFixed(1), sway = (4 + r() * 10).toFixed(0)
    return `<circle cx="${x}" cy="${H + 20}" r="${rad}" fill="${fill}" stroke="${stroke}" stroke-width=".8"><animate attributeName="cy" from="${H + 20}" to="-20" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/><animate attributeName="cx" values="${x};${+x + +sway};${x - sway};${x}" dur="${(dur * 0.6).toFixed(1)}s" repeatCount="indefinite"/></circle>`
  }).join('')
}

function jelly(x, y, s, hue, dur, begin) {
  const c = `hsl(${hue} 100% 70%)`, c2 = `hsl(${hue} 100% 60%)`
  const tent = (dx, a, b) => `<path d="M${dx} 4 Q${dx + a} 40 ${dx - a / 2} 80" fill="none" stroke="${c}" stroke-opacity=".5" stroke-width="1.4" stroke-linecap="round"><animate attributeName="d" dur="${(3 + Math.abs(a) / 6).toFixed(1)}s" repeatCount="indefinite" values="M${dx} 4 Q${dx + a} 40 ${dx - a / 2} 80;M${dx} 4 Q${dx + b} 40 ${dx - b / 2} 80;M${dx} 4 Q${dx + a} 40 ${dx - a / 2} 80"/></path>`
  return `<g><animateTransform attributeName="transform" type="translate" values="${x} ${y};${x + 24} ${y - 50};${x - 10} ${y - 10};${x} ${y}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/><g transform="scale(${s})">
    ${[-26, -13, 0, 13, 26].map((d, i) => tent(d, i % 2 ? 14 : -14, i % 2 ? -12 : 12)).join('')}
    <g><animateTransform attributeName="transform" type="scale" values="1 1;1.1 .9;1 1" dur="2.8s" repeatCount="indefinite"/>
      <path d="M-42 4C-42 -48 42 -48 42 4C30 12 -30 12 -42 4Z" fill="url(#jf${hue})" stroke="${c}" stroke-opacity=".7" stroke-width="1.2"/>
      <path d="M-30 2Q-22 -30 0 -36M30 2Q22 -30 0 -36M-12 4Q-8 -26 0 -34M12 4Q8 -26 0 -34" fill="none" stroke="${c}" stroke-opacity=".35" stroke-width="1"/>
    </g></g></g>
  <defs><radialGradient id="jf${hue}" cx="50%" cy="25%" r="75%"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c2}" stop-opacity=".08"/></radialGradient></defs>`
}

const wave = (y, amp, color, dur, W = 1200, period = 300, begin = 0) => {
  let d = `M0 ${y}`
  for (let x = 0; x < W + period * 2; x += period) d += ` q${period / 4} ${-amp} ${period / 2} 0 t${period / 2} 0`
  d += ` V0 H0Z`
  return `<path d="${d}" fill="${color}"><animateTransform attributeName="transform" type="translate" from="0 0" to="${-period} 0" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></path>`
}

/* ---------------------------------------------------------------- header */
function header() {
  const W = 1200, H = 340
  const ticks = Array.from({ length: 13 }, (_, i) => `<line x1="1138" x2="1146" y1="${50 + i * 20}" y2="${50 + i * 20}" stroke="rgba(226,248,252,.35)"/>`).join('')
  const rays = [[180, 0.16, 9], [420, 0.12, 12], [700, 0.18, 10], [980, 0.12, 13]].map(([x, o, d], i) => `<polygon points="${x},0 ${x + 90},0 ${x + 330},${H} ${x + 150},${H}" fill="url(#ray)" opacity="${o}"><animate attributeName="opacity" values="${o};${o * 2.2};${o}" dur="${d}s" begin="${-i * 2}s" repeatCount="indefinite"/></polygon>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Jay Naik — Coding Club President, full-stack developer, IoT and 3D web">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c6f8f"/><stop offset=".38" stop-color="#0c3b66"/><stop offset=".78" stop-color="#04182c"/><stop offset="1" stop-color="#02101f"/></linearGradient>
  <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bff6ff" stop-opacity=".9"/><stop offset="1" stop-color="#bff6ff" stop-opacity="0"/></linearGradient>
  <filter id="glow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="soft"><feGaussianBlur stdDeviation="2.2"/></filter>
  <clipPath id="clip"><rect width="${W}" height="${H}" rx="26"/></clipPath>
</defs>
<g clip-path="url(#clip)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${rays}
  ${wave(34, 9, 'rgba(190,246,255,.10)', 11)}
  ${wave(24, 7, 'rgba(190,246,255,.10)', 17, W, 240)}
  <g opacity=".9">${jelly(930, 220, 1.35, 188, 16, 0)}${jelly(1040, 150, 0.8, 285, 13, -4)}${jelly(820, 80, 0.55, 165, 11, -7)}</g>
  ${bubbles(22, W, H, 7)}
  <g filter="url(#glow)">
    <text x="64" y="206" font-family="${SANS}" font-size="132" font-weight="200" letter-spacing="-5" fill="#e2f8fc">JAY NAIK</text>
  </g>
  <text x="68" y="254" font-family="${MONO}" font-size="16" letter-spacing="5.5" fill="${GLOW}">CODING CLUB PRESIDENT  ·  FULL-STACK  ·  IOT  ·  3D WEB</text>
  <g font-family="${MONO}" font-size="12" letter-spacing="3.5" fill="rgba(226,248,252,.72)">
    <circle cx="70" cy="62" r="4.5" fill="#2fe38b"><animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.45;1" dur="2s" repeatCount="indefinite"/></circle>
    <text x="86" y="66">SURFACE · 0 M · NAVSARI, INDIA</text>
  </g>
  <g><line x1="1146" x2="1146" y1="50" y2="290" stroke="rgba(226,248,252,.35)"/>${ticks}
    <circle cx="1146" r="6" fill="#e2f8fc"><animate attributeName="cy" values="50;290;50" dur="22s" repeatCount="indefinite"/></circle>
    <text x="1180" y="46" text-anchor="end" font-family="${MONO}" font-size="10" letter-spacing="3" fill="rgba(226,248,252,.55)">DEPTH</text></g>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="26" fill="none" stroke="rgba(124,243,255,.28)"/>
</svg>`
}

/* ---------------------------------------------------------------- rotating role line */
function roles() {
  const items = ['Coding Club President', 'Full-stack developer', 'IoT builder · ESP32 + MQTT', '3D web · Three.js', 'Hackathon team lead', 'Open to internships']
  const N = items.length, dur = N * 2.6
  const slot = (k) => { const a = k / N, b = (k + 1) / N, f = 0.025; return k === 0 ? `0;0;${f};${b - f};${b};1` : `0;${a};${a + f};${b - f};${b};1` }
  const kt = (k) => { const a = k / N, b = (k + 1) / N, f = 0.025; return k === 0 ? `0;0.0001;${f};${(b - f).toFixed(4)};${b.toFixed(4)};1` : `0;${a.toFixed(4)};${(a + f).toFixed(4)};${(b - f).toFixed(4)};${b.toFixed(4)};1` }
  void slot
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="64" viewBox="0 0 1200 64" role="img" aria-label="Currently: ${items.map(esc).join(', ')}">
  <text x="548" y="40" text-anchor="end" font-family="${MONO}" font-size="12" letter-spacing="4" fill="rgba(226,248,252,.55)">CURRENTLY</text>
  ${items.map((t, k) => `<text x="572" y="43" font-family="${SERIF}" font-style="italic" font-size="34" fill="#e2f8fc" opacity="0">${esc(t)}<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="${kt(k)}" dur="${dur}s" repeatCount="indefinite" calcMode="linear"/></text>`).join('\n  ')}
</svg>`
}

/* ---------------------------------------------------------------- sonar radar of the stack */
function sonar() {
  const groups = [
    ['Languages', ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'SQL']],
    ['Frontend', ['React', 'Next.js', 'Three.js', 'Tailwind', 'Vite']],
    ['Backend', ['Node.js', 'Express', 'FastAPI', 'Flask', 'Socket.IO']],
    ['Data', ['MongoDB', 'Oracle SQL', 'MS SQL']],
    ['IoT', ['ESP32', 'MQTT', 'Blynk', 'ThingSpeak']],
    ['Craft', ['Git', 'Vercel', 'Playwright', 'RAG']],
  ]
  const W = 1200, H = 560, CX = 300, CY = 285, R = 235, PERIOD = 9
  const blips = []
  groups.forEach(([, items], gi) => items.forEach((label, k) => {
    const a = ((gi / groups.length) * 360 + (k / items.length) * (360 / groups.length) * 0.9 + 7) % 360
    const r = R * (0.28 + ((k * 0.37 + gi * 0.21) % 0.64))
    blips.push({ label, gi, a, x: CX + Math.cos((a * Math.PI) / 180) * r, y: CY + Math.sin((a * Math.PI) / 180) * r })
  }))
  const hue = (gi) => 170 + gi * 28
  const rings = [1, 2, 3, 4].map((i) => `<circle cx="${CX}" cy="${CY}" r="${(R * i) / 4}" fill="none" stroke="rgba(124,243,255,.16)"/>`).join('')
  const spokes = groups.map((_, i) => { const a = (i / groups.length) * Math.PI * 2; return `<line x1="${CX}" y1="${CY}" x2="${(CX + Math.cos(a) * R).toFixed(1)}" y2="${(CY + Math.sin(a) * R).toFixed(1)}" stroke="rgba(124,243,255,.13)"/>` }).join('')
  const dots = blips.map((b) => {
    const t0 = ((b.a / 360) * PERIOD).toFixed(2), left = b.x < CX
    const pulse = `<animate attributeName="opacity" values="1;.28;.28" keyTimes="0;.3;1" dur="${PERIOD}s" begin="${t0}s" repeatCount="indefinite"/>`
    return `<g opacity=".28">${pulse}<circle cx="${b.x.toFixed(1)}" cy="${b.y.toFixed(1)}" r="11" fill="hsl(${hue(b.gi)} 100% 65%)" opacity=".25" filter="url(#soft)"/><circle cx="${b.x.toFixed(1)}" cy="${b.y.toFixed(1)}" r="3.6" fill="hsl(${hue(b.gi)} 100% 72%)"/><text x="${(b.x + (left ? -10 : 10)).toFixed(1)}" y="${(b.y + 4).toFixed(1)}" text-anchor="${left ? 'end' : 'start'}" font-family="${MONO}" font-size="11" fill="#e2f8fc">${esc(b.label)}</text></g>`
  }).join('')
  const legend = groups.map(([name, items], gi) => {
    const y = 120 + gi * 68
    return `<g><circle cx="640" cy="${y - 4}" r="5" fill="hsl(${hue(gi)} 100% 70%)"/><text x="658" y="${y}" font-family="${MONO}" font-size="12" letter-spacing="3.5" fill="rgba(226,248,252,.6)">${name.toUpperCase()}</text><text x="640" y="${y + 28}" font-family="${SANS}" font-size="20" font-weight="300" fill="#e2f8fc">${esc(items.join('  ·  '))}</text><line x1="640" x2="1150" y1="${y + 44}" y2="${y + 44}" stroke="rgba(226,248,252,.12)"/></g>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="My stack as a sonar: ${groups.map(([n, i]) => n + ': ' + i.join(', ')).join('. ')}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#062a49"/><stop offset="1" stop-color="#02101f"/></linearGradient>
  <radialGradient id="disc" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7cf3ff" stop-opacity=".07"/><stop offset="1" stop-color="#02101f" stop-opacity=".6"/></radialGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7cf3ff" stop-opacity="0"/><stop offset="1" stop-color="#7cf3ff" stop-opacity=".42"/></linearGradient>
  <filter id="soft"><feGaussianBlur stdDeviation="3.6"/></filter>
  <clipPath id="clip"><rect width="${W}" height="${H}" rx="26"/></clipPath>
</defs>
<g clip-path="url(#clip)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${bubbles(14, W, H, 21, { stroke: 'rgba(255,255,255,.25)' })}
  <text x="640" y="62" font-family="${MONO}" font-size="12" letter-spacing="5" fill="${GLOW}">175 M · ECHO-LOCATION</text>
  <text x="638" y="98" font-family="${SERIF}" font-style="italic" font-size="44" fill="#e2f8fc">Ping <tspan font-family="${SANS}" font-style="normal" font-weight="200">the stack</tspan></text>
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#disc)" stroke="rgba(124,243,255,.3)"/>
  ${rings}${spokes}
  <g><animateTransform attributeName="transform" type="rotate" from="0 ${CX} ${CY}" to="360 ${CX} ${CY}" dur="${PERIOD}s" repeatCount="indefinite"/>
    <path d="M${CX} ${CY} L${CX + R} ${CY} A${R} ${R} 0 0 0 ${(CX + R * Math.cos(-0.9)).toFixed(1)} ${(CY + R * Math.sin(-0.9)).toFixed(1)} Z" fill="url(#beam)"/>
    <line x1="${CX}" y1="${CY}" x2="${CX + R}" y2="${CY}" stroke="rgba(190,255,255,.9)" stroke-width="1.5"/></g>
  ${dots}
  <circle cx="${CX}" cy="${CY}" r="3.5" fill="#bfffff"/>
  ${legend}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="26" fill="none" stroke="rgba(124,243,255,.25)"/>
</svg>`
}

/* ---------------------------------------------------------------- plankton count (contribution grid) */
function getContributions() {
  const q = `query { user(login: "${LOGIN}") { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }`
  const LV = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 }
  try {
    const j = JSON.parse(execFileSync('gh', ['api', 'graphql', '-f', `query=${q}`], { encoding: 'utf8' }))
    const cal = j.data.user.contributionsCollection.contributionCalendar
    return cal.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, count: d.contributionCount, level: LV[d.contributionLevel] ?? 0 }))
  } catch (e) {
    const cache = new URL('../assets/.contributions.json', import.meta.url)
    if (existsSync(cache)) { console.warn('gh unavailable, using cached contributions'); return JSON.parse(readFileSync(cache, 'utf8')) }
    throw e
  }
}

function plankton() {
  const days = getContributions()
  writeFileSync(new URL('.contributions.json', out), JSON.stringify(days))
  let total = 0, active = 0, best = 0, bestDay = null, streak = 0, longest = 0
  days.forEach((d) => { total += d.count; if (d.count) { active++; streak++; longest = Math.max(longest, streak) } else streak = 0; if (d.count > best) { best = d.count; bestDay = d } })
  let cur = 0
  for (let i = days.length - 1; i >= 0; i--) { if (days[i].count) cur++; else if (i === days.length - 1) continue; else break }
  const first = new Date(days[0].date + 'T00:00:00').getDay()
  const all = [...Array.from({ length: first }, () => null), ...days]
  const weeks = Math.ceil(all.length / 7)
  const CELL = 15, GAP = 3, STEP = CELL + GAP, LEFT = 38, W = 1200
  const gx = Math.round((W - (LEFT + weeks * STEP)) / 2), TOP = 214, H = 392
  const COLORS = ['rgba(255,255,255,.075)', '#0d5a63', '#13a6b3', '#4fe0e6', '#c9fffb']
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  let lastM = -1, ml = []
  for (let c = 0; c < weeks; c++) { const d = all.slice(c * 7, c * 7 + 7).find(Boolean); if (!d) continue; const m = new Date(d.date + 'T00:00:00').getMonth(); if (m !== lastM) { if (ml.length && c - ml[ml.length - 1].c < 3) ml.pop(); ml.push({ m, c }); lastM = m } }
  const cells = { 0: [], 1: [], 2: [], 3: [], 4: [] }
  all.forEach((d, i) => {
    if (!d) return
    const c = Math.floor(i / 7), r = i % 7
    cells[d.level].push(`<rect class="c" x="${gx + LEFT + c * STEP}" y="${TOP + r * STEP}" width="${CELL}" height="${CELL}" rx="4" style="animation-delay:${Math.min(c * 16, 1100)}ms"><title>${d.count} contribution${d.count === 1 ? '' : 's'} · ${d.date}</title></rect>`)
  })
  const tile = (x, label, big, sub) => `<g transform="translate(${x} 74)"><rect width="262" height="96" rx="18" fill="rgba(255,255,255,.04)" stroke="rgba(226,248,252,.16)"/><text x="22" y="30" font-family="${MONO}" font-size="11" letter-spacing="3.5" fill="rgba(226,248,252,.6)">${label}</text><text x="22" y="68" font-family="${SANS}" font-size="38" font-weight="200" letter-spacing="-1.5" fill="${GLOW}" filter="url(#glow)">${big}</text><text x="22" y="86" font-family="${SANS}" font-size="12" fill="rgba(226,248,252,.6)">${sub}</text></g>`
  const synced = new Date().toISOString().slice(0, 10)
  const tiles = [
    tile(48, 'CONTRIBUTIONS', total.toLocaleString(), 'in the last year'),
    tile(334, 'ACTIVE DAYS', active, 'days with commits'),
    tile(620, 'LONGEST STREAK', `${longest}<tspan font-size="16" fill="#e2f8fc" font-weight="300"> days</tspan>`, cur ? `${cur} running now` : 'consecutive activity'),
    tile(906, 'BEST DAY', best, bestDay ? new Date(bestDay.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'),
  ].join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${total} GitHub contributions in the last year across ${active} days; longest streak ${longest} days">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#062a49"/><stop offset="1" stop-color="#02101f"/></linearGradient>
  <filter id="glow" x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <clipPath id="clip"><rect width="${W}" height="${H}" rx="26"/></clipPath>
</defs>
<style>
  .c{transform-box:fill-box;transform-origin:center;animation:pop .8s cubic-bezier(.22,1,.36,1) both}
  @keyframes pop{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:scale(1)}}
  .g4{animation:glim 3.6s ease-in-out infinite}
  @keyframes glim{50%{filter:brightness(1.35)}}
</style>
<g clip-path="url(#clip)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${bubbles(12, W, H, 33, { stroke: 'rgba(255,255,255,.22)' })}
  <text x="48" y="48" font-family="${MONO}" font-size="12" letter-spacing="5" fill="${GLOW}">190 M · OPEN SIGNAL</text>
  <text x="1152" y="48" text-anchor="end" font-family="${MONO}" font-size="12" letter-spacing="3" fill="rgba(226,248,252,.6)">@${LOGIN}</text>
  ${tiles}
  <g font-family="${MONO}" font-size="10" letter-spacing="2" fill="rgba(226,248,252,.6)">
    ${ml.map((o) => `<text x="${gx + LEFT + o.c * STEP}" y="${TOP - 10}">${MONTHS[o.m]}</text>`).join('')}
    <text x="${gx}" y="${TOP + STEP + 11}">MON</text><text x="${gx}" y="${TOP + 3 * STEP + 11}">WED</text><text x="${gx}" y="${TOP + 5 * STEP + 11}">FRI</text>
  </g>
  <g fill="${COLORS[0]}">${cells[0].join('')}</g>
  <g fill="${COLORS[1]}">${cells[1].join('')}</g>
  <g fill="${COLORS[2]}">${cells[2].join('')}</g>
  <g fill="${COLORS[3]}" filter="url(#glow)">${cells[3].join('')}</g>
  <g fill="${COLORS[4]}" filter="url(#glow)" class="g4">${cells[4].join('')}</g>
  <g font-family="${MONO}" font-size="10" letter-spacing="2" fill="rgba(226,248,252,.55)">
    <text x="48" y="${H - 22}">${total.toLocaleString()} CONTRIBUTIONS · LAST 12 MONTHS · SYNCED ${synced}</text>
    <text x="${W - 48 - 162}" y="${H - 22}" text-anchor="end">LESS</text>
    ${[0, 1, 2, 3, 4].map((l, i) => `<rect x="${W - 48 - 150 + i * 20}" y="${H - 33}" width="13" height="13" rx="3.5" fill="${COLORS[l]}"/>`).join('')}
    <text x="${W - 48}" y="${H - 22}" text-anchor="end">MORE</text>
  </g>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="26" fill="none" stroke="rgba(124,243,255,.25)"/>
</svg>`
}

/* ---------------------------------------------------------------- project cards */
const projects = [
  { id: 'coding-club', depth: '−38 M', tag: 'PRESIDENT · NMIMS MPSTME', title: 'The Coding Club', blurb: 'The club platform I lead. A 3D scroll-driven landing plus an editorial inner site: events, a live in-browser code judge, a real-time leaderboard, CTF and an admin panel.', chips: ['React 19', 'Three.js', 'Express', 'Socket.IO'], hue: 225, thumb: 'codingclub', cta: 'LIVE SITE' },
  { id: 'kupakosh', depth: '−49 M', tag: 'SMART INDIA HACKATHON 2026', title: 'Kupakosh', alt: 'कूपकोश', blurb: 'Others search your PDFs. Kupakosh remembers. Well-memory for Oil India engineers, drawn as each well’s recorded formation column. I led the team.', chips: ['Python', 'Next.js', 'RAG', 'Team lead'], hue: 28, cta: 'REPOSITORY' },
  { id: 'niyamkosh', depth: '−60 M', tag: 'SMART INDIA HACKATHON 2026', title: 'NiyamKosh', alt: 'नियमकोश', blurb: 'Describe what you are buying, get the right Indian Standard. Retrieval that never invents a standard, in 11 Indian languages.', stat: '27,687 standards · 4,917 tenders · 0 invented', chips: ['FastAPI', 'MiniLM + BM25', 'Cross-encoder'], hue: 190, cta: 'REPOSITORY' },
  { id: 'or-studio', depth: '−71 M', tag: 'OPEN SOURCE · WORKS OFFLINE', title: 'OR/Studio', blurb: 'A free in-browser Operations Research workbench and a modern replacement for TORA. Exact fractions, every tableau explained, tutor mode.', stat: '174 tests passing', chips: ['React 19', 'TypeScript', 'Vite 6', 'Tailwind 4'], hue: 78, cta: 'REPOSITORY' },
  { id: 'studysync', depth: '−82 M', tag: 'LIVE · USED BY REAL STUDENTS', title: 'StudySync', blurb: 'Your semester, mapped. SAP attendance automation, a marks hub with a what-if goal calculator, AI study tools and a faculty mentor system.', chips: ['React 19', 'Node.js', 'MongoDB', 'Playwright'], hue: 18, thumb: 'studysync', cta: 'LIVE SITE' },
  { id: 'ambiora', depth: '−93 M', tag: 'TECHNICAL LEAD · 500+ VISITORS', title: 'Ambiora Techfest', blurb: 'The official techfest site. Sole developer, live for two days, 500+ visitors, zero downtime.', chips: ['React', 'Tailwind', 'Vercel'], hue: 265, thumb: 'ambiora', cta: 'LIVE SITE' },
  { id: 'fireguard', depth: '−104 M', tag: 'DAIOT', title: 'FireGuard', blurb: 'Smart fire evacuation. ESP32 sensors, Dijkstra pathfinding, real-time MQTT alerts and a WebSocket dashboard.', chips: ['Python', 'Flask', 'ESP32', 'MQTT'], hue: 12, thumb: 'fireguard', cta: 'REPOSITORY' },
  { id: 'w8', depth: '−115 M', tag: 'REACT + TYPESCRIPT', title: 'W8 Fitness', blurb: 'Gym management with separate client, admin and trainer portals. Three roles, one product.', chips: ['React', 'TypeScript', 'Tailwind'], hue: 150, thumb: 'w8fitness', cta: 'LIVE SITE' },
]

function card(p) {
  const W = 800, H = 440
  const acc = `hsl(${p.hue} 90% 66%)`, dark = `hsl(${p.hue} 55% 9%)`, mid = `hsl(${p.hue} 60% 16%)`
  const lines = wrap(p.blurb, 36).slice(0, 6)
  const tsize = p.title.length > 15 ? 36 : p.title.length > 11 ? 42 : 48
  let img = ''
  const tp = new URL(`../assets/thumbs/${p.thumb}.webp`, import.meta.url)
  if (p.thumb && existsSync(tp)) img = `<image href="data:image/webp;base64,${readFileSync(tp).toString('base64')}" x="438" y="74" width="322" height="214" preserveAspectRatio="xMidYMin slice" clip-path="url(#tc)"/>`
  else img = `<g clip-path="url(#tc)"><rect x="438" y="74" width="322" height="214" fill="url(#pg)"/><path d="M438 140h322M438 200h322M498 74v214M580 74v214M662 74v214" stroke="rgba(255,255,255,.07)"/><text x="458" y="262" font-family="${SANS}" font-size="${p.title.length > 10 ? 36 : 44}" font-weight="200" letter-spacing="-1.5" fill="#fff">${esc(p.title)}</text>${p.alt ? `<text x="460" y="280" font-family="${SANS}" font-size="13" fill="rgba(255,255,255,.65)">${esc(p.alt)}</text>` : ''}</g>`
  let cx = 40
  const chips = p.chips.slice(0, 4).map((c) => { const w = Math.round(c.length * 7.4 + 26); const g = `<g transform="translate(${cx} 372)"><rect width="${w}" height="30" rx="15" fill="rgba(255,255,255,.07)" stroke="rgba(226,248,252,.2)"/><text x="${w / 2}" y="20" text-anchor="middle" font-family="${SANS}" font-size="12.5" fill="#e2f8fc">${esc(c)}</text></g>`; cx += w + 8; return g }).join('')
  const ctaW = p.cta === 'LIVE SITE' ? 150 : 158
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.title)}: ${esc(p.blurb)}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mid}"/><stop offset="1" stop-color="#02101f"/></linearGradient>
  <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${p.hue} 80% 52%)"/><stop offset=".55" stop-color="hsl(${p.hue} 70% 22%)"/><stop offset="1" stop-color="${dark}"/></linearGradient>
  <filter id="glow" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <clipPath id="c"><rect width="${W}" height="${H}" rx="28"/></clipPath>
  <clipPath id="tc"><rect x="438" y="74" width="322" height="214" rx="16"/></clipPath>
</defs>
<g clip-path="url(#c)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="700" cy="60" r="190" fill="${acc}" opacity=".07"/>
  ${bubbles(8, W, H, p.hue + 3, { stroke: 'rgba(255,255,255,.28)' })}
  <text x="40" y="54" font-family="${MONO}" font-size="12" letter-spacing="3.5" fill="${acc}">${esc(p.depth)}  ·  ${esc(p.tag)}</text>
  <text x="40" y="${64 + tsize}" font-family="${SANS}" font-size="${tsize}" font-weight="200" letter-spacing="-1.6" fill="#e2f8fc" filter="url(#glow)">${esc(p.title)}</text>
  ${lines.map((l, i) => `<text x="40" y="${158 + tsize - 36 + i * 25}" font-family="${SANS}" font-size="16.5" fill="rgba(226,248,252,.78)">${esc(l)}</text>`).join('')}
  ${p.stat ? `<text x="40" y="344" font-family="${MONO}" font-size="12" letter-spacing="1.5" fill="${acc}">${esc(p.stat)}</text>` : ''}
  ${chips}
  <rect x="436" y="72" width="326" height="218" rx="18" fill="none" stroke="${acc}" stroke-opacity=".55" stroke-width="1.5"/>
  ${img}
  <g transform="translate(${760 - ctaW} 370)"><rect width="${ctaW}" height="36" rx="18" fill="${acc}"/><text x="${ctaW / 2}" y="23" text-anchor="middle" font-family="${MONO}" font-size="12" font-weight="600" letter-spacing="2.5" fill="#02101f">${p.cta} ↗</text></g>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="28" fill="none" stroke="${acc}" stroke-opacity=".3"/>
</svg>`
}

/* ---------------------------------------------------------------- footer */
function footer() {
  const W = 1200, H = 170
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Jay Naik, see you at the seabed">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04182c"/><stop offset="1" stop-color="#00050f"/></linearGradient>
<filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<clipPath id="clip"><rect width="${W}" height="${H}" rx="26"/></clipPath></defs>
<g clip-path="url(#clip)"><rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${wave(30, 8, 'rgba(124,243,255,.10)', 13)}${wave(20, 6, 'rgba(124,243,255,.08)', 19, W, 220)}
  ${bubbles(14, W, H, 5, { stroke: 'rgba(124,243,255,.4)' })}
  <text x="600" y="92" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-size="40" fill="${GLOW}" filter="url(#glow)">see you at the seabed.</text>
  <text x="600" y="132" text-anchor="middle" font-family="${MONO}" font-size="11" letter-spacing="4" fill="rgba(226,248,252,.55)">BUILT ON A SPRING, NOT A TIMELINE · JAY NAIK</text>
</g></svg>`
}

if (want('header')) save('header.svg', header())
if (want('roles')) save('roles.svg', roles())
if (want('sonar')) save('sonar.svg', sonar())
if (want('plankton')) save('plankton.svg', plankton())
if (want('cards')) projects.forEach((p) => save(`card-${p.id}.svg`, card(p)))
if (want('footer')) save('footer.svg', footer())
