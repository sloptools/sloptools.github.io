// theme: system → light → dark, remembered in this browser only.
const button = document.getElementById('theme')
const root = document.documentElement
const themes = ['system', 'light', 'dark']
const show = () => (button.textContent = 'theme: ' + (root.dataset.theme || 'system'))

button.onclick = () => {
  const next = themes[(themes.indexOf(root.dataset.theme || 'system') + 1) % themes.length]
  if (next === 'system') delete root.dataset.theme
  else root.dataset.theme = next
  try {
    next === 'system' ? localStorage.removeItem('theme') : localStorage.setItem('theme', next)
  } catch {}
  show()
}
show()
