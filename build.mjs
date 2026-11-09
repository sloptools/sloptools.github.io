// Builds the site into _site/: a landing page plus each tool's docs, rendered
// from the markdown in its repo's docs/. Everything is served from the site
// itself, so a visit makes no request to anyone else.
//
//   node build.mjs              repos next to this one (../pasteup, ../texxer)
//   REPOS=repos node build.mjs  repos somewhere else

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { marked } from 'marked'

const repos = process.env.REPOS ?? '..'
const out = '_site'

const tools = {
  pasteup: {
    banner: ' █▀█ ▄▀█ █▀ ▀█▀ █▀▀ █ █ █▀█\n █▀▀ █▀█ ▄█  █  ██▄ █▄█ █▀▀',
    motto: 'cut · paste · crunch',
    kind: 'image editor',
    blurb:
      "A small image editor for crunchy retro textures. Cut pieces from photos, lay them onto a model's UVs, paint and crunch them down to a palette, and watch it live in Blender.",
    features: [
      ['cut', 'drop photos into the ref space and cut pieces out; four-corner cuts come out straightened'],
      ['paste', 'lay pieces onto UV islands, move, scale, turn and clip them to an island'],
      ['paint', 'texel-exact brush, fill, gradients, shapes, layers with masks, grunge and adjustments'],
      ['crunch', 'Quake, Quake 2, Lospec or computed palettes, Bayer dither, PS1 15-bit color'],
      ['blender', "one texture per material, written into the material's own images; strokes come back"],
    ],
    // pasteup's docs draw its pixel icons with :name:
    icons: 'frontend/src/lib/Icon.svelte',
  },
  texxer: {
    banner: ' ▀█▀ █▀▀ ▀▄▀ ▀▄▀ █▀▀ █▀█\n  █  ██▄ █ █ █ █ ██▄ █▀▄',
    motto: 'paint · mask · crunch',
    kind: 'model painter',
    blurb:
      'A small model painter for crunchy retro textures. Stack layers on a GLB model, let baked masks put the wear and grime where it belongs, crunch it down to a palette, and send it to Blender or Godot.',
    features: [
      ['layers', 'colors limited by masks, in folders, with ready material and dirt stacks'],
      ['masks', 'ao, edges, cavity, drips and gradients, baked once from the geometry'],
      ['stamps', 'shapes, decals, text and photo snippets, projected live, mirrored if you like'],
      ['crunch', 'supersampled, baked light, median-cut or Quake palette, optional dither'],
      ['godot', 'a game view with nearest mipmaps; export into the GLB in place'],
    ],
  },
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const num = (i) => String(i + 1).padStart(2, '0')
const github = (name) => `https://github.com/sloptools/${name}`
const downloads = [
  ['macOS', 'mac.zip'],
  ['windows', 'windows.zip'],
  ['linux', 'linux.tar.gz'],
]
const download = (name, file) => `${github(name)}/releases/latest/download/${name}-${file}`

function write(path, html) {
  mkdirSync(join(out, path, '..'), { recursive: true })
  writeFileSync(join(out, path), html)
}

// --- reading the repos ---------------------------------------------------

function docs(name) {
  const dir = join(repos, name, 'docs')
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => {
      const md = readFileSync(join(dir, f), 'utf8')
      const id = f.replace(/^\d+-|\.md$/g, '')
      return { id, title: md.match(/^# (.+)$/m)?.[1] ?? id, md }
    })
}

// Icon names and paths, read from the app's own Icon.svelte.
function icons(name) {
  const src = tools[name].icons
  if (!src) return {}
  const map = {}
  for (const [, key, d] of readFileSync(join(repos, name, src), 'utf8').matchAll(/^\s*'?([a-z][a-z ]*?)'?: '(M[^']+)'/gm)) map[key] = d
  return map
}

const pixel = (d) =>
  `<svg class="icon" width="16.5" height="16.5" viewBox="0 0 11 11" shape-rendering="crispEdges" aria-hidden="true"><path d="${d}" fill="currentColor" fill-rule="evenodd"/></svg>`

function render(md, name, iconMap) {
  return marked
    .parse(md)
    .replace(/src="img\/([^"]+)"/g, (_, file) => `src="/${name}/img/${file}" loading="lazy"`)
    .replace(/:([a-z][a-z ]*?):/g, (all, key) => (iconMap[key] ? pixel(iconMap[key]) : all))
}

// --- templates -----------------------------------------------------------

const shell = ({ title, description, on, body }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/PermanentMarker-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
<script>try{const t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch{}</script>
</head>
<body>
<header class="bar">
  <a class="logo" href="/">sloptools</a>
  <nav>
    ${Object.keys(tools)
      .map((n) => `<a href="/${n}/"${n === on ? ' class="on"' : ''}>${n}</a>`)
      .join('\n    ')}
    <a href="https://github.com/sloptools">github ↗</a>
  </nav>
</header>
${body}
<footer class="foot">
  <button class="text" id="theme" type="button">theme: system</button>
</footer>
<script src="/theme.js"></script>
</body>
</html>
`

function card(name, i) {
  const t = tools[name]
  return `
<section class="tool" id="${name}">
  <div class="tool-text">
    <p class="caps index"><span>${num(i)}</span> / ${t.kind}</p>
    <div class="title">
      <img src="/img/${name}.png" alt="" width="56" height="56">
      <h2>${name}</h2>
    </div>
    <p class="motto"><span aria-hidden="true">▓▓▒▒░░</span> ${t.motto}</p>
    <p class="blurb">${t.blurb}</p>
    <dl class="features">
      ${t.features.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('\n      ')}
    </dl>
    <div class="actions">
      <a class="button primary" href="/${name}/">read the docs →</a>
      <a class="button" href="${github(name)}">github ↗</a>
    </div>
    <div class="downloads">
      <span class="caps">download</span>
      ${downloads.map(([os, file]) => `<a href="${download(name, file)}">${os}</a>`).join('\n      ')}
    </div>
  </div>
  <a class="shot" href="/${name}/" aria-label="${name} docs">
    <img src="/${name}/img/overview.png" alt="${name}, the app window" loading="lazy">
  </a>
</section>`
}

function home() {
  return shell({
    title: 'sloptools',
    description: 'pasteup and texxer: small tools for crunchy retro textures, PS1 and Quake style.',
    body: `<main>
<section class="hero">
  <p class="kicker">// small tools for crunchy textures</p>
  <h1 class="brand">sloptools</h1>
  <p class="lede">Small tools for pixel textures, the way the PS1 intended. Cut photos up, paint on models, crunch it all down to a palette. Anti-aliasing not included.</p>
</section>
${Object.keys(tools).map(card).join('\n')}
<section class="shared">
  <div>
    <p class="caps">build it yourself</p>
    <p>Both are Go and Svelte on <a href="https://wails.io">Wails</a> v2; <code>make</code> fetches Wails when it's missing.</p>
  </div>
  <pre><code><span class="prompt">$</span> git clone https://github.com/sloptools/texxer
<span class="prompt">$</span> cd texxer &amp;&amp; make dev     <span class="faint"># app window + localhost:34115</span>
<span class="prompt">$</span> make install             <span class="faint"># into /Applications</span></code></pre>
</section>
</main>`,
  })
}

function docPage(name, pages, at, iconMap) {
  const page = pages[at]
  const prev = pages[at - 1]
  const next = pages[at + 1]
  const href = (p) => `/${name}/${p.id}/`
  return shell({
    title: `${page.title} · ${name} · sloptools`,
    description: `${name} docs: ${page.title}`,
    on: name,
    body: `<main class="docs">
<aside class="side">
  <pre class="banner" aria-hidden="true">${tools[name].banner}</pre>
  <p class="motto"><span aria-hidden="true">▓▓▒▒░░</span> ${tools[name].motto}</p>
  <p class="caps">docs</p>
  <nav>
    ${pages.map((p, i) => `<a href="${href(p)}"${i === at ? ' class="on" aria-current="page"' : ''}><span class="num">${num(i)}</span>${esc(p.title)}</a>`).join('\n    ')}
  </nav>
  <a class="source" href="${github(name)}/blob/main/docs/">source ↗</a>
</aside>
<article class="doc">
  <p class="caps crumb">${name} <span>/</span> ${num(at)}</p>
  ${render(page.md, name, iconMap)}
  <div class="pager">
    ${prev ? `<a href="${href(prev)}"><span class="caps">← prev</span>${esc(prev.title)}</a>` : '<span></span>'}
    ${next ? `<a class="next" href="${href(next)}"><span class="caps">next →</span>${esc(next.title)}</a>` : ''}
  </div>
</article>
</main>`,
  })
}

// --- build ---------------------------------------------------------------

rmSync(out, { recursive: true, force: true })
cpSync('src', out, { recursive: true })
write('index.html', home())

for (const name of Object.keys(tools)) {
  const pages = docs(name)
  const iconMap = icons(name)
  const img = join(repos, name, 'docs', 'img')
  if (existsSync(img)) cpSync(img, join(out, name, 'img'), { recursive: true })
  pages.forEach((p, i) => write(`${name}/${p.id}/index.html`, docPage(name, pages, i, iconMap)))
  write(`${name}/index.html`, docPage(name, pages, 0, iconMap).replace('<head>', `<head>\n<link rel="canonical" href="/${name}/${pages[0].id}/">`))
  console.log(`${name}: ${pages.length} pages, ${Object.keys(iconMap).length} icons`)
}
