import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x101014)
scene.fog = new THREE.Fog(0x101014, 8, 18)

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100)
camera.position.set(0, 1.6, 5.5)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.minDistance = 3
controls.maxDistance = 10

scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x1a1a22, 1.2))
const key = new THREE.DirectionalLight(0xffffff, 2.2)
key.position.set(3, 5, 4)
scene.add(key)

// grid floor
const grid = new THREE.GridHelper(20, 20, 0x2a4a6a, 0x1a2436)
scene.add(grid)

// main object: icosahedron with glowing wireframe shell
const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.1, 0),
  new THREE.MeshStandardMaterial({ color: 0x2e86de, roughness: 0.35, metalness: 0.55, flatShading: true }),
)
const shell = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.35, 1),
  new THREE.MeshBasicMaterial({ color: 0x9fe8ff, wireframe: true, transparent: true, opacity: 0.35 }),
)
const obj = new THREE.Group()
obj.add(core, shell)
scene.add(obj)

// orbiting satellites
const sats = new THREE.Group()
for (let i = 0; i < 6; i++) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.18, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xffd479, roughness: 0.5 }),
  )
  m.userData.angle = (i / 6) * Math.PI * 2
  sats.add(m)
}
scene.add(sats)

const hud = document.getElementById('hud')
let frames = 0
let fps = 0
let lastFpsAt = performance.now()

renderer.setAnimationLoop(() => {
  const t = performance.now() / 1000

  obj.rotation.y = t * 0.5
  obj.rotation.x = Math.sin(t * 0.4) * 0.25
  shell.rotation.y = -t * 0.3

  for (const m of sats.children) {
    const a = m.userData.angle + t * 0.6
    m.position.set(Math.cos(a) * 2.4, Math.sin(a * 2) * 0.5, Math.sin(a) * 2.4)
    m.rotation.set(a, a * 1.3, 0)
  }

  controls.update()
  renderer.render(scene, camera)

  frames++
  if (t * 1000 - lastFpsAt >= 500) {
    fps = Math.round((frames * 1000) / (t * 1000 - lastFpsAt))
    frames = 0
    lastFpsAt = t * 1000
  }
  hud.textContent =
    `three.js r${THREE.REVISION} · ${renderer.capabilities.isWebGL2 ? 'WebGL2' : 'WebGL1'}\n` +
    `tris ${renderer.info.render.triangles} · calls ${renderer.info.render.calls} · ${fps} fps\n` +
    `拖动旋转 · 滚轮缩放`
})

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})
