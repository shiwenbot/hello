import * as THREE from 'three'

const STORAGE_KEY = 'zsiga-sunlight-collection-v1'
const ASSET_BASE = import.meta.env.BASE_URL
const characterImage = (number) => `${ASSET_BASE}assets/characters/zsiga-${String(number).padStart(2, '0')}.jpg`

const characters = [
  { id: 'moss', name: '恶作剧', image: characterImage(1), color: '#657455', accent: '#d5b861', line: '苔藓把清晨的秘密交给了你', accessory: 'leaf' },
  { id: 'berry', name: '出击', image: characterImage(2), color: '#b84943', accent: '#f1c8a9', line: '甜甜的心事，今天也没有迟到', accessory: 'berry' },
  { id: 'cloud', name: '失衡', image: characterImage(3), color: '#9ea8a0', accent: '#efe6cd', line: '云朵兜住了一小片温柔', accessory: 'cloud' },
  { id: 'honey', name: '答案', image: characterImage(4), color: '#d4a845', accent: '#6b5639', line: '把金色的好运分你一半', accessory: 'sun' },
  { id: 'fern', name: '加速', image: characterImage(5), color: '#415d4e', accent: '#b9c78f', line: '一片新叶，正朝着你生长', accessory: 'sprout' },
  { id: 'rose', name: '选择', image: characterImage(6), color: '#c76e72', accent: '#f2d7bf', line: '晚霞偷偷染红了脸颊', accessory: 'bow' },
  { id: 'pond', name: '心思', image: characterImage(7), color: '#5f8581', accent: '#e7cf88', line: '风吹过池塘，也吹来想念', accessory: 'drop' },
  { id: 'acorn', name: '玩伴', image: characterImage(8), color: '#796245', accent: '#d9a85d', line: '小小勇气，会长成一片森林', accessory: 'acorn' },
  { id: 'starlight', name: '在日光下', image: characterImage(9), color: '#687286', accent: '#f1d992', line: '今晚的星星只负责闪耀', accessory: 'star' },
  { id: 'petal', name: '诱饵', image: characterImage(10), color: '#d08d83', accent: '#f4e1cb', line: '花瓣记得每次温柔的靠近', accessory: 'flower' },
  { id: 'meadow', name: '长发', image: characterImage(11), color: '#8b9a69', accent: '#e4c66c', line: '走慢一点，日光正在等你', accessory: 'daisy' },
  { id: 'moon', name: '独处', image: characterImage(12), color: '#555b68', accent: '#e8d59d', line: '月光会替我，照亮你的归途', accessory: 'moon' },
]

const els = {
  grid: document.querySelector('#cardGrid'),
  count: document.querySelector('#progressCount'),
  bar: document.querySelector('#progressBar'),
  hint: document.querySelector('#hint'),
  footer: document.querySelector('#footerMessage'),
  reveal: document.querySelector('#revealOverlay'),
  revealCard: document.querySelector('#revealCard'),
  revealFront: document.querySelector('#revealFront'),
  revealKicker: document.querySelector('#revealKicker'),
  revealName: document.querySelector('#revealName'),
  revealLine: document.querySelector('#revealLine'),
  collect: document.querySelector('#collectButton'),
  revealClose: document.querySelector('#revealClose'),
  letter: document.querySelector('#letterOverlay'),
  letterClose: document.querySelector('#letterClose'),
  menuButton: document.querySelector('#menuButton'),
  menu: document.querySelector('#menuPopover'),
  openLetter: document.querySelector('#openLetter'),
  resetButton: document.querySelector('#resetButton'),
  confirm: document.querySelector('#confirmOverlay'),
  cancelReset: document.querySelector('#cancelReset'),
  confirmReset: document.querySelector('#confirmReset'),
  live: document.querySelector('#liveRegion'),
  sunlight: document.querySelector('#sunlight'),
}

let state = loadState()
let activeCard = null
let revealTimer = null
let revealFrame = null

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved?.version === 1 && saved.assignments && typeof saved.assignments === 'object') {
      const valid = Object.entries(saved.assignments).filter(([slot, id]) => Number(slot) >= 0 && Number(slot) < 12 && characters.some((item) => item.id === id))
      const unique = new Map()
      for (const [slot, id] of valid) if (![...unique.values()].includes(id)) unique.set(slot, id)
      return { version: 1, assignments: Object.fromEntries(unique), letterSeen: Boolean(saved.letterSeen) }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
  return { version: 1, assignments: {}, letterSeen: false }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function makeCharacter(item, compact = false) {
  const figure = document.createElement('div')
  figure.className = `character-figure ${compact ? 'compact' : ''}`
  figure.style.setProperty('--tone', item.color)
  figure.style.setProperty('--accent', item.accent)
  figure.dataset.accessory = item.accessory
  const placeholderMarkup = `
    <div class="figure-shadow"></div>
    <div class="figure-ears"><i></i><i></i></div>
    <div class="figure-head">
      <div class="figure-mark"></div>
      <div class="figure-eyes"><i></i><i></i></div>
      <div class="figure-nose"></div>
      <div class="figure-cheeks"><i></i><i></i></div>
    </div>
    <div class="figure-body"><div class="figure-emblem"></div></div>
    <div class="figure-feet"><i></i><i></i></div>`
  if (item.image) {
    figure.classList.add('has-photo')
    figure.innerHTML = `<img src="${item.image}" alt="" />`
    const img = figure.querySelector('img')
    img.addEventListener('error', () => {
      figure.classList.remove('has-photo')
      figure.innerHTML = placeholderMarkup
    }, { once: true })
    return figure
  }
  figure.innerHTML = placeholderMarkup
  return figure
}

function renderGrid() {
  els.grid.replaceChildren()
  for (let slot = 0; slot < 12; slot += 1) {
    const id = state.assignments[slot]
    const item = characters.find((character) => character.id === id)
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `collection-card card-${slot + 1}${item ? ' is-open' : ''}`
    button.dataset.slot = slot
    button.style.setProperty('--tilt', `${[-1.2, 0.8, -0.5, 1, -0.7, 0.5][slot % 6]}deg`)
    button.setAttribute('aria-label', item ? `查看${item.name}` : `开启第 ${slot + 1} 张卡片`)
    if (item) {
      const face = document.createElement('div')
      face.className = 'mini-face'
      face.style.setProperty('--card-tint', item.color)
      face.append(makeCharacter(item, true))
      face.insertAdjacentHTML('beforeend', `<span>${item.name}</span>`)
      button.append(face)
    } else {
      button.innerHTML = `<div class="card-back"><span class="card-number">${String(slot + 1).padStart(2, '0')}</span><div class="card-sun"></div><strong>Z</strong><small>SUNLIGHT</small></div>`
    }
    button.addEventListener('click', () => openCard(slot))
    els.grid.append(button)
  }
  updateProgress()
}

function updateProgress() {
  const count = Object.keys(state.assignments).length
  els.count.textContent = count
  els.bar.style.width = `${(count / 12) * 100}%`
  els.openLetter.hidden = count < 12
  if (count === 12) {
    els.hint.textContent = '十二束日光，已经全部抵达'
    els.footer.textContent = '完整收藏已点亮 · 七夕快乐'
  } else if (count > 0) {
    els.hint.textContent = `还差 ${12 - count} 张，拼成完整的日光收藏`
    els.footer.textContent = '点按已开启的卡片，可以再次查看'
  } else {
    els.hint.textContent = '选一张心动的卡，迎接今日份日光'
    els.footer.textContent = '未开启的卡片里，藏着不同的相遇'
  }
}

function randomUnowned() {
  const owned = new Set(Object.values(state.assignments))
  const pool = characters.filter((item) => !owned.has(item.id))
  return pool[Math.floor(Math.random() * pool.length)]
}

function openCard(slot) {
  if (els.reveal.classList.contains('is-visible')) return
  const existing = state.assignments[slot]
  const item = characters.find((character) => character.id === existing) || randomUnowned()
  if (!item) return

  const isNew = !existing
  if (isNew) {
    state.assignments[slot] = item.id
    saveState()
  }
  activeCard = { slot, item, isNew }
  prepareReveal(activeCard)
  els.revealCard.classList.toggle('replay', !isNew)
  els.reveal.classList.add('is-visible')
  els.reveal.setAttribute('aria-hidden', 'false')
  document.body.classList.add('modal-open')

  // Commit the face-down state before starting the transition. Without this
  // layout read, a reused hidden overlay can skip straight to the front face.
  void els.revealCard.offsetWidth
  els.reveal.classList.remove('is-resetting')
  cancelAnimationFrame(revealFrame)
  revealFrame = requestAnimationFrame(() => {
    els.reveal.classList.add('is-revealing')
    revealFrame = null
  })

  clearTimeout(revealTimer)
  const delay = matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : isNew ? 2100 : 1050
  revealTimer = setTimeout(() => finishReveal(activeCard), delay)
}

function prepareReveal({ item, isNew }) {
  els.reveal.classList.add('is-resetting')
  els.revealFront.replaceChildren(makeCharacter(item))
  els.revealFront.style.setProperty('--card-tint', item.color)
  els.revealKicker.textContent = isNew ? '日光正在显影' : '再次遇见这束日光'
  els.revealName.textContent = item.name
  els.revealLine.textContent = item.line
  els.collect.textContent = isNew ? '收入收藏册' : '返回收藏册'
  els.collect.disabled = true
  els.revealClose.disabled = true
  els.reveal.classList.remove('is-revealing', 'is-revealed')
}

function finishReveal({ item, isNew }) {
  els.reveal.classList.add('is-revealed')
  els.collect.disabled = false
  els.revealClose.disabled = false
  els.live.textContent = `${isNew ? '发现新的收藏：' : ''}${item.name}，${item.line}`
}

function closeReveal() {
  if (!els.reveal.classList.contains('is-revealed')) return
  const completedNow = activeCard?.isNew && Object.keys(state.assignments).length === 12 && !state.letterSeen
  clearTimeout(revealTimer)
  revealTimer = null
  cancelAnimationFrame(revealFrame)
  revealFrame = null
  els.reveal.classList.remove('is-visible', 'is-revealing', 'is-revealed')
  els.reveal.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('modal-open')
  renderGrid()
  activeCard = null
  if (completedNow) setTimeout(openLetter, 420)
}

function openLetter() {
  state.letterSeen = true
  saveState()
  els.letter.classList.add('is-visible')
  els.letter.setAttribute('aria-hidden', 'false')
  document.body.classList.add('modal-open')
}

function closeLetter() {
  els.letter.classList.remove('is-visible')
  els.letter.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('modal-open')
}

function showConfirm() {
  els.menu.hidden = true
  els.confirm.classList.add('is-visible')
  els.confirm.setAttribute('aria-hidden', 'false')
  document.body.classList.add('modal-open')
}

function hideConfirm() {
  els.confirm.classList.remove('is-visible')
  els.confirm.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('modal-open')
}

function resetCollection() {
  state = { version: 1, assignments: {}, letterSeen: false }
  saveState()
  hideConfirm()
  renderGrid()
  els.live.textContent = '收藏进度已清空'
}

els.collect.addEventListener('click', closeReveal)
els.revealClose.addEventListener('click', closeReveal)
els.letterClose.addEventListener('click', closeLetter)
els.openLetter.addEventListener('click', () => { els.menu.hidden = true; openLetter() })
els.menuButton.addEventListener('click', (event) => {
  event.stopPropagation()
  els.menu.hidden = !els.menu.hidden
})
els.resetButton.addEventListener('click', showConfirm)
els.cancelReset.addEventListener('click', hideConfirm)
els.confirmReset.addEventListener('click', resetCollection)
document.addEventListener('click', (event) => {
  if (!els.menu.hidden && !els.menu.contains(event.target)) els.menu.hidden = true
})
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return
  if (els.confirm.classList.contains('is-visible')) hideConfirm()
  else if (els.letter.classList.contains('is-visible')) closeLetter()
  else if (els.reveal.classList.contains('is-revealed')) closeReveal()
})

function initSunlight() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' })
  } catch {
    document.documentElement.classList.add('no-webgl')
    return
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.className = 'sunlight-canvas'
  els.sunlight.append(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
  camera.position.z = 2
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { time: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `varying vec2 vUv; uniform float time;
        void main(){
          vec2 p=vUv-vec2(.82,.9); float d=length(p);
          float sun=smoothstep(.72,0.,d)*.11;
          float ray=max(0.,cos(atan(p.y,p.x)*7.+time*.08))*smoothstep(.9,.05,d)*.025;
          gl_FragColor=vec4(1.,.78,.38,sun+ray);
        }`,
    }),
  )
  scene.add(glow)

  const count = reduced ? 18 : innerWidth < 520 ? 42 : 68
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = Math.random() * 2 - 1
    positions[i * 3 + 1] = Math.random() * 2 - 1
    sizes[i] = Math.random() * 2.5 + 1
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  const particles = new THREE.Points(geometry, new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float size; varying float alpha; void main(){alpha=size/3.5;gl_PointSize=size;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying float alpha; void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d)*alpha*.28;gl_FragColor=vec4(1.,.86,.55,a);}',
  }))
  scene.add(particles)

  const resize = () => renderer.setSize(innerWidth, innerHeight, false)
  resize()
  addEventListener('resize', resize)
  const clock = new THREE.Clock()
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime()
    glow.material.uniforms.time.value = reduced ? 0 : t
    particles.rotation.z = reduced ? 0 : t * 0.008
    particles.position.y = reduced ? 0 : Math.sin(t * 0.12) * 0.025
    renderer.render(scene, camera)
  })
}

renderGrid()
initSunlight()
