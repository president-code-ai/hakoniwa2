import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import './style.css';

const $ = (id) => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#ffffff');
const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, .06, 150);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (error) {
  $('error').hidden = false;
  $('loading').classList.add('done');
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.32;
$('world').appendChild(renderer.domElement);
renderer.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); $('error').hidden = false; });
renderer.domElement.addEventListener('webglcontextrestored', () => { location.reload(); });
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = .07;
controls.minDistance = 10;
controls.maxDistance = 110;
controls.minPolarAngle = .15;
controls.maxPolarAngle = Math.PI / 2 - .045;
controls.enablePan = false;
controls.autoRotateSpeed = .38;

scene.add(new THREE.HemisphereLight('#fff7df', '#b2bbb0', 2.4));
const sunlight = new THREE.DirectionalLight('#fff3d9', 3.5);
sunlight.position.set(-8, 17, 12);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);
Object.assign(sunlight.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 45 });
sunlight.shadow.normalBias = .035;
sunlight.shadow.bias = -.0002;
sunlight.shadow.radius = 4;
scene.add(sunlight);
const fill = new THREE.DirectionalLight('#d7e6ed', 1.4);
fill.position.set(8, 7, -9);
scene.add(fill);

const mats = new Map();
function material(color, metalness = 0, roughness = .68) {
  const key = `${color}:${metalness}:${roughness}`;
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, metalness, roughness }));
  return mats.get(key);
}
const cream = material('#e5d8b5'), darkwood = material('#5e3d2a'), wood = material('#986d47');
const red = material('#ab382b'), green = material('#436554'), brass = material('#b79b53', .65, .35);
const chrome = material('#c8cfca', .72, .23), dark = material('#292f2c');
const skin = material('#dba37b'), hair = material('#302b27');
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const sphereGeo = new THREE.SphereGeometry(1, 12, 8);
function mesh(geometry, mat, parent, x=0, y=0, z=0) {
  const object = new THREE.Mesh(geometry, mat);
  object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true;
  parent.add(object); return object;
}
function box(parent, x, y, z, w, h, d, mat, radius=0) {
  if (radius) return mesh(new RoundedBoxGeometry(w,h,d,2,radius),mat,parent,x,y,z);
  const object = mesh(unitBox,mat,parent,x,y,z); object.scale.set(w,h,d); return object;
}
function ball(parent,x,y,z,r,mat) { const o=mesh(sphereGeo,mat,parent,x,y,z); o.scale.setScalar(r);return o; }
function cylinder(parent,x,y,z,r,h,mat,r2=r) { return mesh(new THREE.CylinderGeometry(r,r2,h,20),mat,parent,x,y,z); }
function rod(parent,from,to,r,mat) {
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),delta=b.clone().sub(a);
  const o=cylinder(parent,...a.clone().add(b).multiplyScalar(.5).toArray(),r,delta.length(),mat);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()); return o;
}
function torus(parent,x,y,z,r,tube,mat) { return mesh(new THREE.TorusGeometry(r,tube,6,40),mat,parent,x,y,z); }
function group(parent,x=0,y=0,z=0,ry=0) { const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;parent.add(g);return g; }
function textPlane(parent, text, x,y,z,w,h, {bg='#efe3ba', color='#a33429', size=75, font='serif', border=false}={}) {
  const canvas=document.createElement('canvas'); canvas.width=1024;canvas.height=Math.round(1024*h/w);
  const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);
  if(border){ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(12,12,canvas.width-24,canvas.height-24);}
  ctx.fillStyle=color;ctx.font=`bold ${size}px "Yu Mincho", ${font}`;ctx.textAlign='center';ctx.textBaseline='middle';
  const lines=text.split('\n');lines.forEach((line,i)=>ctx.fillText(line,512,canvas.height/2+(i-(lines.length-1)/2)*size*1.3,970));
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.MeshStandardMaterial({map:texture,roughness:.8,side:THREE.DoubleSide});
  return mesh(new THREE.PlaneGeometry(w,h),mat,parent,x,y,z);
}

const shop=group(scene,0,.15,0);
// Floating miniature plinth and an isolated, white shadow surface.
box(shop,0,-.42,0,15.5,.76,12.1,material('#c5ba9e'),.18);
box(shop,0,-.09,0,15.65,.18,12.25,cream,.06);
box(shop,0,-.66,0,15.1,.1,11.75,darkwood,.03);
const shadow=mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.075}),scene,0,-1.35,0);
shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
const tileMaterials=['#839180','#899884','#7b8977','#93a18c'].map(c=>material(c));
for(let style=0;style<4;style++) {
  const tiles=[];
  for(let ix=0;ix<20;ix++)for(let iz=0;iz<15;iz++)if((ix*7+iz*3)%4===style)tiles.push([-7.22+ix*.76,.027,-5.54+iz*.76]);
  const batch=new THREE.InstancedMesh(unitBox,tileMaterials[style],tiles.length), transform=new THREE.Object3D();
  transform.scale.set(.749,.06,.749);
  tiles.forEach((position,i)=>{transform.position.set(...position);transform.updateMatrix();batch.setMatrixAt(i,transform.matrix);});
  batch.receiveShadow=true;shop.add(batch);
}
// Two retained walls leave the whole interior open from the main angle.
box(shop,0,1.72,-5.76,15.3,3.45,.19,material('#ddd5b8'));
box(shop,-7.52,1.72,0,.19,3.45,11.55,material('#ddd5b8'));
box(shop,0,.61,-5.63,15.2,1.22,.1,wood);
box(shop,-7.4,.61,0,.1,1.22,11.55,wood);
for(let i=0;i<25;i++)box(shop,-7.25+i*.6,.61,-5.555,.023,1.18,.025,darkwood);
for(let i=0;i<19;i++)box(shop,-7.32,.61,-5.5+i*.6,.025,1.18,.025,darkwood);
box(shop,0,1.25,-5.52,15.25,.1,.15,darkwood);
box(shop,-7.31,1.25,0,.15,.1,11.55,darkwood);
box(shop,0,3.46,-5.73,15.4,.13,.32,green);
box(shop,-7.48,3.46,0,.32,.13,11.65,green);
box(shop,7.48,.22,0,.15,.43,11.6,cream);
box(shop,7.48,.46,0,.22,.07,11.65,wood);

// Window into the white outside, with an opaque frosted upper pane.
for(let i=0;i<3;i++) {
  const panel=group(shop,-7.27,2.45,-3.8+i*2.45,Math.PI/2);
  box(panel,0,0,0,1.82,1.08,.1,wood);
  box(panel,0,0,.062,1.65,.9,.04,material('#becfc3',.1,.35));
  box(panel,0,0,.11,.04,1,.05,cream);
  box(panel,0,0,.11,1.75,.04,.05,cream);
}
textPlane(shop,'いらっしゃいませ',-.6,2.93,-5.61,4.25,.4,{size:75,color:'#486557'});
textPlane(shop,'本日 新装開店',-5.95,2.42,-5.60,1.14,1.43,{size:120,border:true});
textPlane(shop,'出 玉\n大放出',4.6,2.56,-5.60,.85,1.18,{size:135,border:true});
textPlane(shop,'楽しく遊んで、ほどよく。',.4,2.40,-5.60,3.3,.28,{size:61,color:'#686956'});

// Landmark storefront, striped awning and period lettering.
const front=group(shop,-4.58,0,5.12);
box(front,0,.22,0,5.0,.44,1.12,material('#c8c0aa'),.05);
box(front,-2.22,1.70,0,.22,3.4,.24,green);
box(front,2.22,1.70,0,.22,3.4,.24,green);
box(front,0,3.17,0,4.9,.88,.32,red,.06);
textPlane(front,'ニューハコニワ',0,3.2,.174,4.6,.67,{bg:'#a62d25',color:'#f7e7b6',size:127});
  textPlane(front,'パ チ ン コ',0,3.78,.06,3.4,.4,{bg:'#ece0b8',color:'#a9382c',size:82});
box(front,0,3.8,-.04,3.54,.51,.17,cream,.05);
for(let i=0;i<14;i++) {
  const a=box(front,-2.28+i*.351,2.64,.35,.351,.075,1.05,i%2?cream:red);
  a.rotation.x=.12;
  box(front,-2.28+i*.351,2.51,.85,.35,.2,.065,i%2?cream:red);
}
for(let i=0;i<2;i++) {
  const door=group(front,-1.03+i*2.06,1.36,0);
  box(door,0,0,0,1.94,2.27,.045,material('#bfd0bf',.1,.35));
  [-.95,.95].forEach(x=>box(door,x,0,.04,.045,2.3,.08,chrome));
  box(door,0,1.12,.04,1.94,.05,.08,chrome);
  box(door,0,-1.12,.04,1.94,.05,.08,chrome);
  box(door,0,-.38,.08,1.94,.05,.06,chrome);
  box(door,i?-.67:.67,-.12,.12,.04,.35,.055,chrome);
  textPlane(door,'営業中',0,.23,.07,.73,.33,{bg:'#efe3bd',size:105});
}

const machines=[], seated=[], walkers=[], fans=[];
const bulbGeo=new THREE.SphereGeometry(.033,8,5);
const pinGeo=new THREE.SphereGeometry(.012,5,4);
function makeMachine(x,z,angle,index,occupied) {
  const g=group(shop,x,0,z,angle), frame=index%3===0?red:index%3===1?green:material('#b28237');
  box(g,0,.48,0,.96,.89,.66,darkwood,.035);
  box(g,0,1.5,0,.96,1.35,.65,frame,.055);
  box(g,0,1.54,.335,.85,1.18,.04,chrome,.035);
  box(g,0,1.57,.37,.76,1.08,.045,cream,.065);
  const board=mesh(new THREE.CircleGeometry(.367,48),material('#ebdfb5'),g,0,1.66,.401);
  torus(g,0,1.66,.41,.37,.022,chrome);
  torus(g,0,1.66,.425,.335,.008,brass);
  const pins=new THREE.InstancedMesh(pinGeo,chrome,54);let p=0;const dummy=new THREE.Object3D();
  for(let row=0;row<6;row++)for(let col=0;col<9;col++) {
    const px=(col-4)*.069+(row%2)*.02,py=(row-2.5)*.09;
    dummy.position.set(px,1.65+py,.447);dummy.updateMatrix();pins.setMatrixAt(p++,dummy.matrix);
  }
  g.add(pins);
  const displayCanvas=document.createElement('canvas');displayCanvas.width=192;displayCanvas.height=96;
  const displayTexture=new THREE.CanvasTexture(displayCanvas);displayTexture.colorSpace=THREE.SRGBColorSpace;
  const displayMat=new THREE.MeshBasicMaterial({map:displayTexture});
  box(g,0,1.64,.459,.35,.195,.04,dark,.013);
  mesh(new THREE.PlaneGeometry(.305,.148),displayMat,g,0,1.65,.485);
  const wingL=box(g,-.17,1.40,.465,.13,.025,.035,red);wingL.rotation.z=.3;
  const wingR=box(g,.17,1.40,.465,.13,.025,.035,red);wingR.rotation.z=-.3;
  box(g,0,1.28,.43,.12,.07,.06,brass);
  box(g,0,1.00,.48,.79,.12,.29,frame,.025);
  box(g,0,1.07,.49,.65,.055,.21,dark,.01);
  box(g,0,.88,.42,.71,.09,.19,chrome,.02);
  const handle=cylinder(g,.3,.85,.51,.069,.07,dark);handle.rotation.x=Math.PI/2;
  ball(g,.3,.85,.562,.035,chrome);
  textPlane(g,String(index+1).padStart(2,'0'),0,2.25,.34,.28,.13,{bg:'#344d40',color:'#f9e6ac',size:155});
  box(g,0,2.25,.16,.9,.20,.34,wood,.025);
  const glow=new THREE.MeshStandardMaterial({color:'#fbd782',emissive:'#ffa934',emissiveIntensity:.1,roughness:.3});
  const bulbs=new THREE.InstancedMesh(bulbGeo,glow,22);
  for(let j=0;j<22;j++) {const a=j/22*Math.PI*2;dummy.position.set(Math.sin(a)*.395,1.64+Math.cos(a)*.49,.427);dummy.updateMatrix();bulbs.setMatrixAt(j,dummy.matrix);}
  g.add(bulbs);
  const balls=[];
  for(let j=0;j<5;j++)balls.push(ball(g,0,1.8,.465,.018,chrome));
  if(occupied) {
    for(let j=0;j<9;j++)ball(g,(j%5-2)*.085,1.11,.47+Math.floor(j/5)*.06,.025,chrome);
  }
  // Red upholstered stools on chrome stems.
  cylinder(g,0,.10,1.00,.27,.06,chrome);
  cylinder(g,0,.37,1.00,.055,.53,chrome);
  cylinder(g,0,.64,1.00,.27,.14,red);
  torus(g,0,.44,1,.20,.022,chrome).rotation.x=Math.PI/2;
  const m={g,index,occupied,glow,balls,displayCanvas,displayTexture,wingL,wingR,lastFrame:-1};machines.push(m);
  if(occupied)seated.push(makePerson(g,0,0,1.05,Math.PI,true,index));
  return m;
}

function makePerson(parent,x,y,z,angle,isSeated,index,staff=false) {
  const g=group(parent,x,y,z,angle);
  const shirt=material(staff?'#e8d8b4':['#596d76','#b2a581','#967964','#a6b7a1','#d2bca0','#695b67','#758779'][index%7]);
  const trousers=material(index%2?'#464d4d':'#6f6758');
  const torso=group(g,0,isSeated?.88:1.01,0);
  box(torso,0,.13,0,.36,.43,.24,shirt,.075);
  box(torso,0,.35,.035,.2,.05,.13,cream,.01);
  cylinder(torso,0,.41,0,.07,.1,skin);
  const head=group(torso,0,.58,0);
  const face=ball(head,0,0,0,.154,skin);face.scale.y*=1.14;
  const cap=ball(head,0,.087,-.025,.148,hair);cap.scale.y*=.63;
  box(head,0,.063,-.119,.24,.16,.06,hair,.025);
  ball(head,0,-.005,.143,.035,skin);
  for(const side of [-1,1]) {
    ball(head,side*.15,-.008,0,.038,skin);
    ball(head,side*.057,.037,.139,.010,dark);
  }
  if(index%3===0) {
    for(const side of [-1,1])torus(head,side*.067,.035,.154,.041,.008,dark);
    rod(head,[-.025,.038,.161],[.025,.038,.161],.006,dark);
  }
  if(staff) {
    box(torso,0,.06,.137,.28,.28,.03,red,.018);
    box(torso,.085,.2,.15,.07,.04,.015,cream);
  }
  const arms=[];
  for(const side of [-1,1]) {
    const arm=group(torso,side*.215,.25,0);
    rod(arm,[0,0,0],[side*.025,-.20,isSeated?.13:0],.065,shirt);
    rod(arm,[side*.025,-.20,isSeated?.13:0],[side*.018,isSeated?-.12:-.39,isSeated?.36:.025],.05,skin);
    ball(arm,side*.018,isSeated?-.12:-.39,isSeated?.36:.025,.054,skin);arms.push(arm);
  }
  const legs=[];
  for(const side of [-1,1]) {
    const leg=group(g,side*.10,isSeated?.74:.83,0);
    if(isSeated) {
      rod(leg,[0,0,0],[0,-.12,.3],.087,trousers);
      rod(leg,[0,-.12,.3],[0,-.53,.32],.068,trousers);
      box(leg,0,-.55,.38,.15,.12,.28,dark,.03);
    } else {
      rod(leg,[0,0,0],[0,-.66,0],.077,trousers);
      box(leg,0,-.73,.055,.16,.14,.27,dark,.03);
    }
    legs.push(leg);
  }
  return {g,torso,head,arms,legs,index,isSeated,staff,name:isSeated?['常連の田中さん','仕事帰りの佐藤さん','近所の山本さん','一息つく鈴木さん','黙々と打つ高橋さん','休日の中村さん'][index%6]:staff?'巡回する店員さん':'台を探すお客さん'};
}

for(let row=0;row<3;row++) {
  const z=[-4.65,-.75,.05][row], angle=row===1?Math.PI:0;
  for(let col=0;col<6;col++)makeMachine(-5.6+col*1.28,z,angle,row*6+col,!([2,7,10,15].includes(row*6+col)));
  box(shop,-2.4,.79,z+(row===1?-.43:.43),7.7,.095,.23,wood);
}
// Tray stacks, ashtrays and a floor bin give the rows a lived-in scale.
for(const [x,z] of [[-6.35,-3.65],[2.05,-4.55],[1.95,.12],[-6.4,.2]]) {
  for(let i=0;i<3;i++) {
    box(shop,x,.17+i*.14,z,.43,.13,.58,red,.025);
    box(shop,x,.245+i*.14,z,.33,.02,.46,material('#be8745'));
  }
}

// Prize counter and shelves, including entirely geometric boxes and bottles.
const counter=group(shop,5.2,0,-3.6);
box(counter,0,.65,.5,3.4,1.3,.95,wood,.035);
box(counter,0,1.34,.5,3.62,.14,1.12,cream,.035);
box(counter,0,.77,1,3.10,.71,.04,material('#c0c6a8',.15,.24));
for(const x of [-1.52,-.5,.5,1.52])box(counter,x,.77,1.04,.035,.78,.055,brass);
box(counter,0,.35,1.04,3.2,.055,.07,brass);
textPlane(counter,'景 品 交 換',0,1.05,1.05,1.7,.27,{bg:'#d8d1ad',color:'#6b4730',size:104});
box(counter,0,1.74,-1.76,3.6,2.7,.35,darkwood);
for(let level=0;level<3;level++) {
  box(counter,0,.8+level*.77,-1.5,3.57,.08,.65,wood);
  for(let j=0;j<9;j++) {
    const color=['#ccb96f','#739680','#b76346','#e5dabb'][j%4];
    box(counter,-1.49+j*.37,1.02+level*.77,-1.50,.26,.36+(j%2)*.08,.26,material(color),.012);
    textPlane(counter,j%2?'珈琲':'菓子',-1.49+j*.37,1.05+level*.77,-1.356,.2,.14,{bg:color,color:'#f6ebca',size:95});
  }
}
textPlane(shop,'景品コーナー',5.2,3.16,-5.36,2.6,.37,{size:96,bg:'#436252',color:'#efe3b7'});
box(counter,.91,1.60,.46,.54,.43,.45,material('#b4b6a1'),.025);
box(counter,.91,1.78,.7,.43,.17,.04,dark);
textPlane(counter,'000',.91,1.78,.726,.32,.10,{bg:'#25352b',color:'#b1d58b',size:150});
const cashier=makePerson(shop,4.45,0,-4.43,0,false,20,true);cashier.name='景品カウンターの店員さん';

// Right-hand rest corner: vending machine, bench, plant and rotary telephone.
const vendor=group(shop,6.50,0,.25,-Math.PI/2);
box(vendor,0,1.02,0,1.13,2.03,.68,red,.045);
textPlane(vendor,'冷たい お飲みもの',0,1.82,.353,.99,.23,{bg:'#eee5c8',color:'#b7392a',size:69});
box(vendor,0,1.32,.36,.94,.62,.04,cream,.02);
for(let i=0;i<4;i++) {
  cylinder(vendor,-.32+i*.21,1.30,.43,.059,.24,material(['#ad392e','#d6bb6b','#6e9580','#b6653a'][i]));
  ball(vendor,-.32+i*.21,1.05,.4,.035,dark);
}
box(vendor,0,.49,.37,.74,.23,.055,dark,.02);
box(vendor,.39,.86,.383,.07,.17,.03,chrome);
textPlane(vendor,'100 円',-.1,.79,.383,.38,.13,{bg:'#a63529',color:'#f6e9c6',size:97});
box(shop,6.48,.57,3.55,.76,.18,2.40,red,.06);
box(shop,6.90,.98,3.55,.13,.85,2.42,red,.05);
for(const z of [2.65,4.45])box(shop,6.48,.3,z,.5,.6,.09,darkwood);
const plant=group(shop,6.5,0,5.23);
cylinder(plant,0,.26,0,.28,.5,material('#ab704c'),.2);
cylinder(plant,0,.51,0,.25,.03,darkwood);
for(let i=0;i<11;i++) {
  const a=i*2.4,h=.65+(i%4)*.17;
  rod(plant,[0,.5,0],[Math.sin(a)*.32,h,Math.cos(a)*.32],.013,green);
  const leaf=ball(plant,Math.sin(a)*.31,h,Math.cos(a)*.31,.18,material(i%2?'#64855a':'#436d48'));
  leaf.scale.set(.11,.32,.065);leaf.rotation.z=-Math.sin(a)*.7;leaf.rotation.y=a;
}

// Wall clock and two rotating electric fans.
const clock=group(shop,2.65,2.82,-5.56);
const clockFace=cylinder(clock,0,0,0,.31,.075,cream);clockFace.rotation.x=Math.PI/2;
torus(clock,0,0,.05,.31,.025,darkwood);
for(let i=0;i<12;i++) {const a=i/12*Math.PI*2;ball(clock,Math.sin(a)*.255,Math.cos(a)*.255,.053,.014,dark);}
rod(clock,[0,0,.062],[-.13,.11,.062],.012,dark);
rod(clock,[0,0,.063],[.17,.10,.063],.008,dark);
const second=rod(clock,[0,-.04,.067],[0,.23,.067],.004,red);
for(const x of [-3.9,.9]) {
  const fan=group(shop,x,2.83,-5.33);
  box(fan,0,-.15,-.05,.17,.42,.15,material('#76877a'),.03);
  const spin=group(fan,0,0,.16);
  for(let i=0;i<3;i++) {
    const blade=box(spin,0,.12,0,.11,.30,.035,material('#94ad9d'),.04);blade.rotation.z=i*Math.PI*2/3;blade.position.set(Math.sin(-i*Math.PI*2/3)*.13,Math.cos(i*Math.PI*2/3)*.13,0);
  }
  for(const r of [.13,.23,.31])torus(fan,0,0,.21,r,.007,chrome);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;rod(fan,[0,0,.23],[Math.sin(a)*.31,Math.cos(a)*.31,.23],.005,chrome);}
  ball(fan,0,0,.24,.047,cream);fans.push(spin);
}

const routes=[
  [[2.65,2.85],[2.65,-2.65],[-6.52,-2.65],[-6.52,2.85]],
  [[3.9,3.9],[-1.3,3.9],[-1.3,2.7],[3.9,2.7]]
];
for(let i=0;i<2;i++) {
  const p=makePerson(shop,0,0,0,0,false,21+i,i===0);p.route=routes[i];walkers.push(p);
}
const persons=[...seated.slice(0,4),walkers[0],...seated.slice(4,8),cashier,walkers[1],...seated.slice(8)];
$('live-count').textContent=`${machines.length} 台 · ${seated.length} 人が遊戯中`;

let simTime=0, paused=false, viewIndex=-1, transition=null, lastTick=performance.now(), lookYaw=0,lookPitch=0;
const overviewTarget=new THREE.Vector3(0,.8,0);
const worldPoint=new THREE.Vector3(), eyePoint=new THREE.Vector3(), lookPoint=new THREE.Vector3();
function overviewPosition() { const scale=Math.max(1,1.25/(innerWidth/innerHeight));return new THREE.Vector3(17*scale,16.5*scale,22*scale); }
camera.position.copy(overviewPosition());controls.target.copy(overviewTarget);controls.update();
function startTransition() {transition={start:performance.now(),position:camera.position.clone(),target:controls.target.clone()};}
function setOverview() {
  viewIndex=-1;startTransition();controls.enabled=false;lookYaw=0;lookPitch=0;
  document.body.classList.remove('person-view');$('overview').classList.add('selected');$('person').classList.remove('selected');
  $('view-kicker').textContent='DIORAMA VIEW';$('view-title').textContent='いつもの風景';$('view-description').textContent='小さな店の、大きなにぎわい。';
  $('person').querySelector('span:nth-child(2)').textContent='人の目線へ';
  $('gesture-hint').innerHTML='ドラッグで回転 <span>·</span> スクロールで拡大 <span>·</span> V で目線切替';
}
function nextPerson() {
  viewIndex=(viewIndex+1)%persons.length;lookYaw=0;lookPitch=0;startTransition();controls.enabled=false;
  controls.autoRotate=false;$('rotate').setAttribute('aria-pressed','false');
  document.body.classList.add('person-view');$('overview').classList.remove('selected');$('person').classList.add('selected');
  $('person').querySelector('span:nth-child(2)').textContent='次の人の目線';
  $('view-kicker').textContent=`PERSON VIEW ${String(viewIndex+1).padStart(2,'0')} / ${persons.length}`;
  $('view-title').textContent=persons[viewIndex].name;
  $('view-description').textContent=persons[viewIndex].isSeated?'銀玉の行方を、もう一度。':'今日も店内はにぎやかです。';
  $('gesture-hint').innerHTML='ドラッグで見回す <span>·</span> V で次の人 <span>·</span> Esc で箱庭へ';
}
function togglePause(){paused=!paused;$('pause').setAttribute('aria-pressed',String(paused));$('pause-icon').textContent=paused?'▷':'Ⅱ';$('pause-text').textContent=paused?'再生':'一時停止';}
$('overview').addEventListener('click',setOverview);$('person').addEventListener('click',nextPerson);$('pause').addEventListener('click',togglePause);
$('rotate').addEventListener('click',()=>{if(viewIndex!==-1)setOverview();controls.autoRotate=!controls.autoRotate;$('rotate').setAttribute('aria-pressed',String(controls.autoRotate));});
addEventListener('keydown',e=>{if(e.target.closest('input,textarea,[contenteditable="true"]')||e.repeat)return;if(e.code==='KeyV')nextPerson();if(e.code==='Escape')setOverview();if(e.code==='Space'&&!e.target.closest('button')){e.preventDefault();togglePause();}});
let drag=null;
renderer.domElement.addEventListener('pointerdown',e=>{if(viewIndex<0)return;drag={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||viewIndex<0)return;lookYaw=THREE.MathUtils.clamp(lookYaw-(e.clientX-drag.x)*.005,-1.8,1.8);lookPitch=THREE.MathUtils.clamp(lookPitch+(e.clientY-drag.y)*.004,-.75,.75);drag={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',()=>drag=null);renderer.domElement.addEventListener('pointercancel',()=>drag=null);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;renderer.setSize(innerWidth,innerHeight);camera.updateProjectionMatrix();if(viewIndex<0)setOverview();});

function updateDisplay(m,time){
  const frame=Math.floor(time*7);if(m.lastFrame===frame)return;m.lastFrame=frame;
  const ctx=m.displayCanvas.getContext('2d');const phase=(time+m.index*1.7)%16,jackpot=phase>12.6;
  ctx.fillStyle=m.occupied?(jackpot?'#c6361f':'#182e29'):'#27312b';ctx.fillRect(0,0,192,96);
  ctx.font='bold 53px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle=m.occupied?'#ffe4a0':'#707d62';
  const digits=m.occupied?(jackpot?'7 7 7':`${(frame+m.index)%10} ${(frame*3+m.index)%10} ${(frame*7+2)%10}`):'• • •';
  ctx.fillText(digits,96,48);ctx.fillStyle='#cbb274';ctx.fillRect(8,80,jackpot?176:((frame*7)%176),3);
  m.displayTexture.needsUpdate=true;
}
function updateWalking(p,t){
  const route=p.route,lengths=route.map((v,i)=>Math.hypot(v[0]-route[(i+1)%route.length][0],v[1]-route[(i+1)%route.length][1]));
  const total=lengths.reduce((a,b)=>a+b,0);let d=(t*.48+p.index*.7)%total,idx=0;
  while(d>lengths[idx]){d-=lengths[idx];idx++;}
  const a=route[idx],b=route[(idx+1)%route.length],u=d/lengths[idx];
  p.g.position.set(THREE.MathUtils.lerp(a[0],b[0],u),Math.sin(t*6)*.014,THREE.MathUtils.lerp(a[1],b[1],u));
  const desired=Math.atan2(b[0]-a[0],b[1]-a[1]);
  p.g.rotation.y+=Math.atan2(Math.sin(desired-p.g.rotation.y),Math.cos(desired-p.g.rotation.y))*.09;
  p.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(t*6+i*Math.PI)*.32);
  p.arms.forEach((arm,i)=>arm.rotation.x=Math.sin(t*6+i*Math.PI+Math.PI)*.24);
}
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min((now-lastTick)/1000,.05);lastTick=now;if(!paused)simTime+=dt;
  const t=simTime;
  for(const m of machines){
    const phase=(t+m.index*1.7)%16,jackpot=phase>12.6;
    m.glow.emissiveIntensity=m.occupied?(jackpot?1.7+Math.sin(t*17)*1.1:.35+Math.sin(t*4+m.index)*.25):.015;
    m.balls.forEach((b,j)=>{b.visible=m.occupied;if(m.occupied){const u=(t*1.05+j*.21+m.index*.17)%1;b.position.x=Math.sin(u*24+j*2)*(.26-u*.12);b.position.y=1.95-u*.62;}});
    m.wingL.rotation.z=m.occupied?Math.sin(t*5)*.22+.25:.25;m.wingR.rotation.z=-m.wingL.rotation.z;
    updateDisplay(m,t);
  }
  for(const p of seated){p.torso.rotation.x=Math.sin(t*1.2+p.index)*.025;p.head.rotation.y=Math.sin(t*.7+p.index)*.09;p.arms[1].rotation.z=Math.sin(t*5+p.index)*.035;}
  if(!paused)for(const p of walkers)updateWalking(p,t);
  cashier.head.rotation.y=Math.sin(t*.7)*.25;cashier.arms[0].rotation.x=Math.sin(t*1.8)*.18;
  fans.forEach(f=>f.rotation.z=-t*9);second.rotation.z=-t*Math.PI/30;
  scene.updateMatrixWorld(true);
  if(viewIndex>=0){
    const p=persons[viewIndex];p.head.getWorldPosition(eyePoint);
    const orientation=p.g.getWorldQuaternion(new THREE.Quaternion());
    const forward=new THREE.Vector3(0,0,-.08).applyQuaternion(orientation);eyePoint.add(forward);eyePoint.y+=.10;
    const direction=new THREE.Vector3(Math.sin(lookYaw)*Math.cos(lookPitch),-Math.sin(lookPitch)+(p.isSeated?.06:-.04),Math.cos(lookYaw)*Math.cos(lookPitch)).applyQuaternion(orientation);
    lookPoint.copy(eyePoint).addScaledVector(direction,2);
  } else {eyePoint.copy(overviewPosition());lookPoint.copy(overviewTarget);}
  if(transition){
    const u=Math.min((now-transition.start)/1100,1),ease=u*u*(3-2*u);
    camera.position.lerpVectors(transition.position,eyePoint,ease);controls.target.lerpVectors(transition.target,lookPoint,ease);
    camera.fov=THREE.MathUtils.lerp(camera.fov,viewIndex<0?36:82,.12);camera.updateProjectionMatrix();camera.lookAt(controls.target);
    if(u===1){transition=null;controls.enabled=viewIndex<0;}
  }else if(viewIndex>=0){camera.position.copy(eyePoint);controls.target.copy(lookPoint);camera.lookAt(lookPoint);}
  else controls.update(dt);
  // Hide only the observed person's head so the camera cannot clip into its own face.
  persons.forEach((p,i)=>p.head.visible=i!==viewIndex);
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
$('loading').classList.add('done');
// Read-only diagnostics used by the browser smoke checks.
window.hakoniwa={get state(){return {ready:true,time:simTime,paused,viewIndex,people:persons.length,machines:machines.length,occupied:seated.length,camera:camera.position.toArray(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,walking:walkers.map(p=>p.g.position.toArray())};}};
