import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// Respect reduced motion
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0c10);

// Desert haze (lightweight fog)
scene.fog = new THREE.Fog(0x0b0c10, 18, 65);

const camera = new THREE.PerspectiveCamera(42, innerWidth/innerHeight, 0.1, 220);
camera.position.set(16, 11.5, 19);
camera.lookAt(0, 2.2, 0);

const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// ---------- Lights ----------
const key = new THREE.DirectionalLight(0xfff1d6, 1.05); // warm desert key
key.position.set(12, 18, 10);
scene.add(key);

const fill = new THREE.DirectionalLight(0x8bd0ff, 0.18); // cool fill
fill.position.set(-14, 10, -12);
scene.add(fill);

const amb = new THREE.AmbientLight(0xffffff, 0.22);
scene.add(amb);

// ---------- Materials ----------
const M = (hex) => new THREE.MeshStandardMaterial({
  color: hex, roughness: 1.0, metalness: 0.03, flatShading: true
});

const matSkyBand  = M(0x14121a);
const matLand     = M(0x2f2a2a);
const matClay     = M(0x5a4034);
const matDust     = M(0x6a5444);
const matAmber    = M(0xd6a04c);
const matFence    = M(0x8a8f9b);
const matStucco   = M(0xe7dfcf);
const matSand     = M(0xd9c6a8);
const matConcrete = M(0xcfc7bb);
const matTeal     = M(0x4bb9b4);

// Dust material: warm pale sand
const matDustPuff = M(0xd9c6a8);

// Construction grid material (subtle warm gray)
const matGrid = new THREE.LineBasicMaterial({ color: 0x6f6a64 });

const clamp01 = (x)=>Math.max(0,Math.min(1,x));
const smooth  = (t)=>t*t*(3-2*t);
const lerp    = (a,b,t)=>a+(b-a)*t;
const phaseT  = (t,s,e)=>clamp01((t-s)/(e-s));

// ---------- Backdrop wall ----------
const wallGeo = new THREE.PlaneGeometry(60, 28, 6, 3);
wallGeo.rotateY(Math.PI);
const wall = new THREE.Mesh(wallGeo, matSkyBand);
wall.position.set(0, 10, -26);
scene.add(wall);

// ---------- Ground (morphs into facets) ----------
const groundGeo = new THREE.PlaneGeometry(28, 28, 10, 10);
groundGeo.rotateX(-Math.PI/2);

const pos = groundGeo.attributes.position;
const base = new Float32Array(pos.array.length);
const target = new Float32Array(pos.array.length);
base.set(pos.array);
target.set(pos.array);

for (let i=0;i<pos.array.length;i+=3){
  const x = pos.array[i+0];
  const z = pos.array[i+2];

  const calm =
    0.12*Math.sin(x*0.45) +
    0.10*Math.cos(z*0.55) +
    0.06*Math.sin((x+z)*0.28);

  const raw =
    0.9*Math.sin(x*0.70) +
    0.8*Math.cos(z*0.62) +
    0.5*Math.sin((x-z)*0.34);

  const terraced = Math.round(raw*2.0)/2.0;
  const build = terraced*0.32;

  base[i+1] = calm;
  target[i+1] = build;
}

const ground = new THREE.Mesh(groundGeo, matLand);
scene.add(ground);

const pad = new THREE.Mesh(new THREE.BoxGeometry(11, 0.25, 8.5), matClay);
pad.position.set(0, 0.12, 0);
scene.add(pad);

const pad2 = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.18, 7.4), matDust);
pad2.position.set(0, 0.22, 0);
scene.add(pad2);

// ---------- Construction grid (thin lines, fades in during build) ----------
const grid = new THREE.Group();
scene.add(grid);

const gridW = 10.2, gridD = 7.8;
const gridStep = 0.6;

function addLine(x1, z1, x2, z2) {
  const geom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(x1, 0.26, z1),
    new THREE.Vector3(x2, 0.26, z2)
  ]);
  const line = new THREE.Line(geom, matGrid);
  grid.add(line);
}

for (let z = -gridD/2; z <= gridD/2 + 1e-6; z += gridStep) {
  addLine(-gridW/2, z, gridW/2, z);
}
for (let x = -gridW/2; x <= gridW/2 + 1e-6; x += gridStep) {
  addLine(x, -gridD/2, x, gridD/2);
}

grid.scale.setScalar(0.001);

// ---------- Construction props ----------
const props = new THREE.Group();
scene.add(props);
props.scale.setScalar(0.001);

const coneGeo = new THREE.ConeGeometry(0.23, 0.55, 5, 1);
for (let i=0;i<10;i++){
  const c = new THREE.Mesh(coneGeo, matAmber);
  c.position.set(lerp(-4.8,4.8,Math.random()), 0.3, lerp(-3.4,3.4,Math.random()));
  c.rotation.y = Math.random()*Math.PI;
  props.add(c);
}

const fence = new THREE.Group();
const fenceGeo = new THREE.BoxGeometry(1.25, 0.62, 0.22);
const ringX = 7.0, ringZ = 5.6;

for (let x=-ringX; x<=ringX; x+=1.3){
  const a = new THREE.Mesh(fenceGeo, matFence); a.position.set(x,0.32,-ringZ); fence.add(a);
  const b = new THREE.Mesh(fenceGeo, matFence); b.position.set(x,0.32, ringZ); fence.add(b);
}
for (let z=-ringZ; z<=ringZ; z+=1.3){
  const a = new THREE.Mesh(fenceGeo, matFence); a.position.set(-ringX,0.32,z); a.rotation.y=Math.PI/2; fence.add(a);
  const b = new THREE.Mesh(fenceGeo, matFence); b.position.set( ringX,0.32,z); b.rotation.y=Math.PI/2; fence.add(b);
}
props.add(fence);

// Minimal crane silhouette
const crane = new THREE.Group();
const mast = new THREE.Mesh(new THREE.BoxGeometry(0.35, 6.8, 0.35), matFence);
mast.position.set(-6.2, 3.4, -3.8);
const boom = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.25, 0.25), matFence);
boom.position.set(-2.9, 6.7, -3.8);
crane.add(mast, boom);
crane.rotation.y = 0.18;
props.add(crane);

// ---------- Dust puffs (low-poly shards) ----------
const dustSystem = new THREE.Group();
scene.add(dustSystem);

const dustGeo = new THREE.TetrahedronGeometry(0.14, 0);
const dustPuffs = [];

function spawnDust(origin, timeNow, count=18){
  for (let i=0;i<count;i++){
    const m = new THREE.Mesh(dustGeo, matDustPuff);
    m.position.copy(origin);
    m.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    m.scale.setScalar(lerp(0.8, 1.4, Math.random()));

    const v = new THREE.Vector3(
      lerp(-1.0, 1.0, Math.random()),
      lerp(0.9, 1.8, Math.random()),
      lerp(-1.0, 1.0, Math.random())
    ).multiplyScalar(0.55);

    dustSystem.add(m);
    dustPuffs.push({ mesh: m, start: timeNow, dur: 1.6 + Math.random()*0.4, origin: origin.clone(), v });
  }
}

function updateDust(timeNow){
  for (let i=dustPuffs.length-1; i>=0; i--){
    const p = dustPuffs[i];
    const age = timeNow - p.start;
    const t = age / p.dur;

    if (t >= 1){
      dustSystem.remove(p.mesh);
      dustPuffs.splice(i,1);
      continue;
    }

    const tt = smooth(t);
    p.mesh.position.set(
      p.origin.x + p.v.x * tt,
      p.origin.y + p.v.y * tt - 0.35 * tt * tt,
      p.origin.z + p.v.z * tt
    );

    const s = lerp(1.0, 0.001, tt);
    p.mesh.scale.setScalar(s);
    p.mesh.rotation.x += 0.05;
    p.mesh.rotation.y += 0.06;
  }
}

// ---------- Buildings ----------
const buildings = new THREE.Group();
scene.add(buildings);

function makeDesertBuilding({x,z,w,d,h, matMain, matAccent, matGlass}){
  const g = new THREE.Group();
  g.position.set(x,0,z);

  const core = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), matMain);
  core.position.y = 0.5;
  g.add(core);

  const terraces = [];
  const tCount = 3;
  for (let i=0;i<tCount;i++){
    const tw = w*(0.92 - i*0.12);
    const td = d*(0.90 - i*0.10);
    const th = 0.22;
    const t = new THREE.Mesh(new THREE.BoxGeometry(tw, th, td), matAccent);
    t.position.set(0, 0.35 + i*(h/(tCount+1)), 0);
    t.userData.startY = -1.2 - i*0.4;
    terraces.push(t);
    g.add(t);
  }

  const fins = [];
  const finCount = Math.max(4, Math.floor(w*2));
  for (let i=0;i<finCount;i++){
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.14), matAccent);
    fin.position.set(-w*0.46 + i*(w/(finCount-1)), 0.8, d*0.52);
    fin.userData.startZ = d*1.3;
    fins.push(fin);
    g.add(fin);
  }

  const glass = new THREE.Mesh(new THREE.BoxGeometry(w*0.55, 0.8, 0.08), matGlass);
  glass.position.set(0, 0.9, d*0.52);
  glass.userData.startZ = d*1.5;
  g.add(glass);

  // Shade awnings (desert-modern signature)
  const awnings = [];
  const awnCount = 3;
  for (let i = 0; i < awnCount; i++) {
    const aw = new THREE.Mesh(
      new THREE.BoxGeometry(w * (0.62 - i*0.10), 0.10, 0.55),
      matAccent
    );
    aw.position.set(0, 0.75 + i * 0.55, d * 0.62);
    aw.userData.startZ = d * 1.55;
    awnings.push(aw);
    g.add(aw);
  }

  g.userData = { core, terraces, fins, glass, awnings, h };
  g.scale.set(1, 0.001, 1);
  return g;
}

const b1 = makeDesertBuilding({ x:-4.6, z:-0.8, w:3.0, d:2.4, h:7.2,  matMain: matStucco,   matAccent: matSand,     matGlass: matTeal });
const b2 = makeDesertBuilding({ x: 0.2, z: 1.3, w:3.6, d:2.6, h:8.4,  matMain: matConcrete, matAccent: matSand,     matGlass: matTeal });
const b3 = makeDesertBuilding({ x: 4.5, z:-0.4, w:3.1, d:2.5, h:12.0, matMain: matStucco,   matAccent: matConcrete, matGlass: matTeal });

buildings.add(b1,b2,b3);

function updateBuilding(b, bt){
  b.scale.y = lerp(0.001, 1.0, bt);

  for (let i=0;i<b.userData.terraces.length;i++){
    const t = b.userData.terraces[i];
    const pt = smooth(clamp01((bt - i*0.10)/0.55));
    t.position.y = lerp(t.userData.startY, 0.55 + i*(b.userData.h/(b.userData.terraces.length+1)), pt);
  }

  const ft = smooth(clamp01((bt - 0.18)/0.6));
  const depth = (b.userData.core.geometry.parameters.depth ?? 2.4);
  for (const f of b.userData.fins){
    f.position.z = lerp(f.userData.startZ, depth*0.52, ft);
  }
  b.userData.glass.position.z = lerp(b.userData.glass.userData.startZ, depth*0.52, ft);

  // Awnings slide in slightly after fins/glass
  const at = smooth(clamp01((bt - 0.28) / 0.55));
  if (b.userData.awnings) {
    for (const aw of b.userData.awnings) {
      aw.position.z = lerp(aw.userData.startZ, depth * 0.62, at);
    }
  }

  const settle = bt > 0.92 ? Math.sin((bt-0.92)*24)*0.02 : 0;
  b.scale.y *= (1.0 + settle);
}

// ---------- Timeline ----------
const DURATION = 18.0;
const clock = new THREE.Clock();

let fired = { b1:false, b2:false, b3:false, start:false };
function resetFired(){ fired = { b1:false, b2:false, b3:false, start:false }; }

function animate(){
  const e = clock.getElapsedTime();
  const t = reduceMotion ? 0 : (e % DURATION);

  if (!reduceMotion && t < 0.05 && !fired.start){
    fired.start = true;
    resetFired();
    fired.start = true;
  }

  // Camera drift
  if (!reduceMotion){
    camera.position.x = 16 + Math.sin(e*0.14)*0.8;
    camera.position.z = 19 + Math.cos(e*0.11)*0.8;
    camera.position.y = 11.5 + Math.sin(e*0.09)*0.25;
  }
  camera.lookAt(0, 2.3, 0);

  // Sun shift + fog breath
  if (!reduceMotion){
    const sunPhase = smooth(phaseT(t, 5.0, 15.0));
    key.position.x = lerp(12, 16, sunPhase);
    key.position.z = lerp(10, 6, sunPhase);
    key.intensity  = lerp(1.02, 1.12, sunPhase);
    fill.intensity = lerp(0.20, 0.14, sunPhase);

    scene.fog.near = lerp(18, 16, sunPhase);
    scene.fog.far  = lerp(65, 58, sunPhase);
  }

  // Ground morph
  const landMorph = smooth(phaseT(t, 4.8, 8.8));
  for (let i=0;i<pos.array.length;i+=3){
    pos.array[i+1] = lerp(base[i+1], target[i+1], landMorph);
  }
  pos.needsUpdate = true;
  groundGeo.computeVertexNormals();

  // Props in
  const propsIn = smooth(phaseT(t, 5.3, 7.6));
  props.scale.setScalar(lerp(0.001, 1.0, propsIn));
  crane.rotation.y = lerp(0.18, 0.32, propsIn);

  // Grid in/out (construction window)
  const gridIn = smooth(phaseT(t, 6.0, 8.5));
  const gridOut = smooth(phaseT(t, 14.8, 16.8));
  const gridS = lerp(0.001, 1.0, gridIn) * lerp(1.0, 0.001, gridOut);
  grid.scale.setScalar(gridS);

  // Buildings rise (staggered)
  const b1t = smooth(phaseT(t, 9.0, 13.2));
  const b2t = smooth(phaseT(t, 9.8, 14.2));
  const b3t = smooth(phaseT(t, 10.8, 16.7));
  updateBuilding(b1, b1t);
  updateBuilding(b2, b2t);
  updateBuilding(b3, b3t);

  // Dust when each building finishes
  if (!reduceMotion){
    if (!fired.b1 && b1t > 0.96){ fired.b1 = true; spawnDust(new THREE.Vector3(-4.6, 0.25, -0.8), t, 22); }
    if (!fired.b2 && b2t > 0.96){ fired.b2 = true; spawnDust(new THREE.Vector3( 0.2, 0.25,  1.3), t, 24); }
    if (!fired.b3 && b3t > 0.96){ fired.b3 = true; spawnDust(new THREE.Vector3( 4.5, 0.25, -0.4), t, 26); }
  }

  // Props out near end so final looks "complete"
  const propsOut = smooth(phaseT(t, 15.8, 18.0));
  props.scale.setScalar(lerp(props.scale.x, 0.001, propsOut));

  updateDust(t);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

addEventListener("resize", ()=>{
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
