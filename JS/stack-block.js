window.focus();

// --- Game Variables ---
let camera, scene, renderer;
let world;
let lastTime;
let stack;
let overhangs;
const boxHeight = 1;
const originalBoxSize = 3;
let autopilot;
let gameEnded;
let robotPrecision;
let isPaused = false;

// --- Best Score ---
let bestStackScore = localStorage.getItem('bestScore_StackBlock') || 0;

// localStorage.setItem('bestScore_StackBlock', 0); // Reset best score

// --- DOM Elements ---
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('bestScore');
const instructionsElement = document.getElementById('instructions');
const resultElement = document.getElementById('gameOver');
const pauseBtn = document.getElementById('pauseBtn');
const pauseMenu = document.getElementById('pauseMenu');
const resumeBtn = document.getElementById('resumeBtn');
const restartBtn = document.getElementById('restartBtn');
const mainMenuBtn = document.getElementById('mainMenuBtn');
const gameOverRestart = document.getElementById('gameOverRestart');
const gameOverMainMenu = document.getElementById('gameOverMainMenu');
const soundBtn = document.getElementById('sound-btn');
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');

// --- Initialize best score display ---
if (bestScoreElement) bestScoreElement.innerText = `Best Score: ${bestStackScore}`;

// --- Mute / Audio control ---
let isMuted = false;

// --- Hide HUD initially ---
if (scoreElement) scoreElement.style.display = 'none';
if (bestScoreElement) bestScoreElement.style.display = 'none';
if (pauseBtn) pauseBtn.style.display = 'none';
if (backBtn) backBtn.style.display = 'block';

// --- Audio ---
const sounds = {
  place: new Audio('sounds/Stack-Block/place_stack-block.mp3'),
  click: new Audio('sounds/Stack-Block/click_stack-block.mp3'),
  miss: new Audio('sounds/Stack-Block/gameover_stack-block.mp3'),
  bgm: new Audio('sounds/Stack-Block/bgm_stack-block.mp3')
};
sounds.bgm.loop = true;
sounds.bgm.volume = 0.5;

function playSound(name) {
  if (sounds[name] && !isMuted) {
    sounds[name].currentTime = 0;
    sounds[name].play().catch(() => {});
  }
}

// --- Unlock audio ---
function unlockAudio() {
  Object.values(sounds).forEach(s => {
    s.play().then(() => {
      if (s !== sounds.bgm) { s.pause(); s.currentTime = 0; }
    }).catch(() => {});
  });

  if (!isMuted && sounds.bgm.paused) {
    sounds.bgm.play().catch(() => {});
  }
}
document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("touchstart", unlockAudio, { once: true });

// --- Initialize Mute Button Image ---
function updateSoundButton() {
  if (!soundBtn) return;
  soundBtn.innerHTML = '';
  const img = document.createElement('img');
  img.src = isMuted ? '../images/Stack-Block_Image/mute_stack-block.png' : '../images/Stack-Block_Image/unmute_stack-block.png';
  img.className = isMuted ? 'muted' : 'unmuted';
  soundBtn.appendChild(img);
}

updateSoundButton();

// --- Robot precision ---
function setRobotPrecision() { robotPrecision = Math.random() * 1.5; }

// --- Initialize Game ---
function init() {
  try {
    autopilot = true;
    gameEnded = false;
    lastTime = 0;
    stack = [];
    overhangs = [];
    setRobotPrecision();

    world = new CANNON.World();
    world.gravity.set(0, -10, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 40;

    const aspect = window.innerWidth / window.innerHeight;
    const width = 10;
    const height = width / aspect;

    camera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 0, 100);
    camera.position.set(4,4,4);
    camera.lookAt(0,0,0);

    scene = new THREE.Scene();

    addLayer(0,0,originalBoxSize,originalBoxSize);
    addLayer(-10,0,originalBoxSize,originalBoxSize,'x');

    const ambientLight = new THREE.AmbientLight(0xffffff,0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff,0.6);
    dirLight.position.set(10,20,0);
    scene.add(dirLight);

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animation);
    document.getElementById('gameContainer')?.appendChild(renderer.domElement);

  } catch (err) {
    console.error("Game initialization failed:", err);
  }
}
// --- Start Game ---
function startGame() {
  isPaused = false;
  lastTime = 0;
  autopilot = false;
  gameEnded = false;
  stack = [];
  overhangs = [];
  setRobotPrecision();

  if (instructionsElement) instructionsElement.style.display = 'none';
  if (resultElement) resultElement.style.display = 'none';
  if (pauseMenu) pauseMenu.style.display = 'none';
  if (pauseBtn) pauseBtn.style.display = 'block';
  if (scoreElement) scoreElement.style.display = 'block';
  if (bestScoreElement) bestScoreElement.style.display = 'block';
  if (backBtn) backBtn.style.display = 'none';

  if (scoreElement) scoreElement.innerText = 0;

  if (world) while (world.bodies.length) world.removeBody(world.bodies[0]);
  if (scene) scene.children.filter(c => c.type === 'Mesh').forEach(m => scene.remove(m));

  addLayer(0,0,originalBoxSize,originalBoxSize);
  addLayer(-10,0,originalBoxSize,originalBoxSize,'x');

  camera.position.set(4,4,4);
  camera.lookAt(0,0,0);

  if (!isMuted && sounds.bgm.paused) {
    sounds.bgm.play().catch(()=>{});
  }
}

startBtn?.addEventListener("click", startGame);
startBtn?.addEventListener("touchstart", startGame);

// --- Show Main Menu ---
function showMainMenu() {
  if (resultElement) resultElement.style.display = 'none';
  if (pauseMenu) pauseMenu.style.display = 'none';
  if (scoreElement) scoreElement.style.display = 'none';
  if (bestScoreElement) bestScoreElement.style.display = 'none';
  
  if (instructionsElement) instructionsElement.style.display = 'flex';
  if (backBtn) backBtn.style.display = 'block';
  if (pauseBtn) pauseBtn.style.display = 'none';

  gameEnded = true;

  if (world) while (world.bodies.length) world.removeBody(world.bodies[0]);
  if (scene) scene.children.filter(c => c.type === 'Mesh').forEach(m => scene.remove(m));
  stack = [];
  overhangs = [];
}

// --- Transition to another page ---
function transitionToPage(href) {
  try {
    const overlay = document.querySelector('.fade-overlay');
    overlay?.classList.add('active');
    setTimeout(() => { window.location.href = href; }, 200);
  } catch (err) {
    console.error("Page transition failed:", err);
  }
}

backBtn?.addEventListener('click', () => transitionToPage("index.html"));

// --- Layers & Blocks ---
function addLayer(x,z,width,depth,direction){
  const y = boxHeight*stack.length;
  const layer = generateBox(x,y,z,width,depth,false);
  layer.direction = direction;
  stack.push(layer);
}
function addOverhang(x,z,width,depth){
  const y = boxHeight*(stack.length-1);
  const overhang = generateBox(x,y,z,width,depth,true);
  overhangs.push(overhang);
}
function generateBox(x,y,z,width,depth,falls){
  const geometry = new THREE.BoxGeometry(width,boxHeight,depth);
  const color = new THREE.Color(`hsl(${30 + stack.length*4}, 100%, 50%)`);
  const material = new THREE.MeshLambertMaterial({color});
  const mesh = new THREE.Mesh(geometry,material);
  mesh.position.set(x,y,z);
  scene.add(mesh);

  const shape = new CANNON.Box(new CANNON.Vec3(width/2,boxHeight/2,depth/2));
  let mass = falls ? 5 : 0;
  mass *= width/originalBoxSize;
  mass *= depth/originalBoxSize;
  const body = new CANNON.Body({mass,shape});
  body.position.set(x,y,z);
  world.addBody(body);

  return {threejs:mesh,cannonjs:body,width,depth};
}

// --- Cut & Split ---
function cutBox(topLayer, overlap, size, delta) {
  const direction = topLayer.direction;
  const newWidth = direction === 'x' ? overlap : topLayer.width;
  const newDepth = direction === 'z' ? overlap : topLayer.depth;

  topLayer.width = newWidth;
  topLayer.depth = newDepth;

  topLayer.threejs.scale[direction] = overlap / size;
  topLayer.threejs.position[direction] -= delta / 2;

  topLayer.cannonjs.shapes = [];
  const shape = new CANNON.Box(new CANNON.Vec3(newWidth/2, boxHeight/2, newDepth/2));
  topLayer.cannonjs.addShape(shape);
}

// --- Score Update ---
function updateScore() {
  const successfullyStacked = stack.length - 1;
  const currentScore = Math.max(0, successfullyStacked);
  if (scoreElement) scoreElement.innerText = currentScore;

  if (currentScore > bestStackScore) {
    bestStackScore = currentScore;
    if (bestScoreElement) bestScoreElement.innerText = `Best Score: ${bestStackScore}`;
    localStorage.setItem('bestScore_StackBlock', bestStackScore);
  }
  return currentScore;
}

// --- Split / Missed Logic ---
function splitBlockandAddNextOneIfOverLaps() {
  if (gameEnded || stack.length < 2) return;

  const topLayer = stack[stack.length - 1];
  const prev = stack[stack.length - 2];
  const dir = topLayer.direction;
  const size = dir === 'x' ? topLayer.width : topLayer.depth;
  const delta = topLayer.threejs.position[dir] - prev.threejs.position[dir];
  const overhangSize = Math.abs(delta);
  const overlap = size - overhangSize;

  if (overlap > 0) {
    cutBox(topLayer, overlap, size, delta);
    playSound('place');

    const shift = (overlap/2 + overhangSize/2) * Math.sign(delta);
    const overX = dir === 'x' ? topLayer.threejs.position.x + shift : topLayer.threejs.position.x;
    const overZ = dir === 'z' ? topLayer.threejs.position.z + shift : topLayer.threejs.position.z;
    const overW = dir === 'x' ? size - overlap : topLayer.width;
    const overD = dir === 'z' ? size - overlap : topLayer.depth;

    addOverhang(overX, overZ, overW, overD);
    updateScore();

    const nextX = dir === 'x' ? topLayer.threejs.position.x : -10;
    const nextZ = dir === 'z' ? topLayer.threejs.position.z : -10;
    const nextDir = dir === 'x' ? 'z' : 'x';

    addLayer(nextX, nextZ, topLayer.width, topLayer.depth, nextDir);

  } else {
    missedTheSpot();
  }
}

function missedTheSpot() {
  const topLayer = stack[stack.length-1];
  if (!topLayer) return;

  addOverhang(topLayer.threejs.position.x, topLayer.threejs.position.z, topLayer.width, topLayer.depth);
  world.removeBody(topLayer.cannonjs);
  scene.remove(topLayer.threejs);

  playSound('miss');
  gameEnded = true;
  if (pauseBtn) pauseBtn.style.display = 'none';

  if (!autopilot) {
    const finalScore = updateScore(); 
    const finalScoreElement = document.getElementById('finalScore');
    if (finalScoreElement) finalScoreElement.innerText = finalScore;

    const bestScoreGameOverElement = document.getElementById('bestScoreGameOver');
    if (bestScoreGameOverElement) bestScoreGameOverElement.innerText = bestStackScore;

    if (resultElement) resultElement.style.display = 'flex';
  }
}

// --- Event Handlers ---
function blockPlacementHandler(e) {
  if (!stack.length) return; 
  if (e.target.closest('button')) return; 
  if (isPaused || gameEnded) return; 
  splitBlockandAddNextOneIfOverLaps();
}

window.addEventListener("pointerdown", blockPlacementHandler);
window.addEventListener("keydown", e => {
  if (e.key === " ") { e.preventDefault(); blockPlacementHandler(e); }
});

// --- Pause Menu ---
pauseBtn?.addEventListener('click', () => {
  playSound('click');
  isPaused = true;
  if (pauseMenu) pauseMenu.style.display = 'flex';
  if (scoreElement) scoreElement.style.display = 'none';
  if (bestScoreElement) bestScoreElement.style.display = 'none';
});
resumeBtn?.addEventListener('click', () => {
  playSound('click');
  isPaused = false;
  if (pauseMenu) pauseMenu.style.display = 'none';
  if (scoreElement) scoreElement.style.display = 'block';
  if (bestScoreElement) bestScoreElement.style.display = 'block';
});
restartBtn?.addEventListener('click', () => {
  playSound('click');
  isPaused=false;
  if (pauseMenu) pauseMenu.style.display='none';
  startGame();
});
mainMenuBtn?.addEventListener('click', () => { playSound('click'); showMainMenu(); });

// --- Game Over Buttons ---
gameOverRestart?.addEventListener('click', () => { playSound('click'); startGame(); });
gameOverMainMenu?.addEventListener('click', () => { playSound('click'); showMainMenu(); });

// --- Mute / Unmute Button ---
soundBtn?.addEventListener('click', () => {
  isMuted = !isMuted;
  updateSoundButton();
  Object.values(sounds).forEach(s => s.volume = isMuted ? 0 : (s === sounds.bgm ? 0.3 : 1));
});

// --- Animation ---
function animation(time) {
  try {
    if (isPaused) { renderer.render(scene, camera); lastTime = time; return; }

    if (lastTime) {
      const delta = time - lastTime;
      const speed = 0.006;

      if (stack.length >= 2) {
        const top = stack[stack.length-1];
        const prev = stack[stack.length-2];
        const canMove = !gameEnded && (!autopilot || (autopilot && top.threejs.position[top.direction] < prev.threejs.position[top.direction]+robotPrecision));
        if (canMove) {
          top.threejs.position[top.direction] += speed*delta;
          top.cannonjs.position[top.direction] += speed*delta;
          if (top.threejs.position[top.direction] > 10) missedTheSpot();
        } else if (autopilot) {
          splitBlockandAddNextOneIfOverLaps();
          setRobotPrecision();
        }
      }

      if (camera.position.y < boxHeight*(stack.length-1)+4) camera.position.y += speed*delta;

      updatephysics(delta);
      renderer.render(scene, camera);

    } else renderer.render(scene, camera);

    lastTime = time;

  } catch (err) {
    console.error("Animation loop error:", err);
  }
}

function updatephysics(delta) {
  try {
    world.step(delta/1000);
    overhangs.forEach(o => {
      o.threejs.position.copy(o.cannonjs.position);
      o.threejs.quaternion.copy(o.cannonjs.quaternion);
    });
  } catch (err) {
    console.error("Physics update error:", err);
  }
}

// --- Window Resize ---
window.addEventListener('resize', () => {
  const aspect = window.innerWidth / window.innerHeight;
  const width = 10;
  const height = width / aspect;
  camera.left = -width / 2;
  camera.right = width / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
});

// --- Initialize ---
init();