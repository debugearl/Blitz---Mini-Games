// --- CONFIGURATION ---

// Duck State
let ducks = [];
let duckCount = 1;
let duckImageNames = ["../images/duckhunt/duck-left.gif", "../images/duckhunt/duck-right.gif"];

// Physics Settings
let duckWidth = 96, duckHeight = 93;
let duckVelocityX = 6, duckVelocityY = 6;
let gameWidth = window.innerWidth, gameHeight = window.innerHeight * 0.9; 

// Game Stats
let score = 0;
let highScore = localStorage.getItem("duckhunt_best") || 0;
let GAME_DURATION = 30; 
let timeLeft = GAME_DURATION;

// Game Flags
let isGameRunning = false;
let isPaused = false;
let isMuted = false;

// Timers
let moveTimer, spawnTimer, countdownTimer, quackTimer, flapTimer;

// --- AUDIO ASSETS ---
let sound_shot = new Audio("sounds/duckhunt/duck-shot.mp3");
let sound_dog = new Audio("sounds/duckhunt/dog-score.mp3"); 
let sound_quack = new Audio("sounds/duckhunt/duck-quack.mp3"); 
let sound_flap = new Audio("sounds/duckhunt/duck-flap.mp3");   
let music_bg = new Audio("sounds/duckhunt/bgmusic.mp3");       
music_bg.loop = true;
music_bg.volume = 0.3;

// --- DOM ELEMENTS ---
let startScreen, pauseMenu, gameOverScreen, scoreEl, highScoreEl, timeEl, pauseBtn, soundBtn, resumeBtn, restartBtn;

// --- INITIALIZATION ---
window.onload = function() {
    // Bind Elements
    startScreen = document.getElementById('start-screen');
    pauseMenu = document.getElementById('pause-menu');
    gameOverScreen = document.getElementById('game-over-screen');
    scoreEl = document.getElementById('score');
    highScoreEl = document.getElementById('high-score-value');
    timeEl = document.getElementById('time-left');
    pauseBtn = document.getElementById('pause-btn');
    soundBtn = document.getElementById('sound-btn');
    resumeBtn = document.getElementById('resume-btn');
    restartBtn = document.getElementById('restart-btn');

    // Display Initial Stats
    if (highScoreEl) highScoreEl.textContent = highScore;
    if (timeEl) timeEl.textContent = timeLeft;
    
    // Set Dimensions
    updateDimensions();

    // Event Listeners
    if (startScreen) startScreen.addEventListener('click', startGame);
    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
    if (resumeBtn) resumeBtn.addEventListener('click', togglePause);
    if (restartBtn) restartBtn.addEventListener('click', restartToTitle);
    if (soundBtn) soundBtn.addEventListener('click', toggleMute);
    
    // Resize Listener
    window.onresize = updateDimensions;
    console.log("Ready.");
};

// --- HELPER FUNCTIONS ---

// Update Screen Size
function updateDimensions() {
    gameWidth = window.innerWidth;
    gameHeight = window.innerHeight * 0.9;
    
    if (window.innerWidth < 600) {
        duckWidth = 80; duckHeight = 78;
        duckVelocityX = 4; duckVelocityY = 4;
    } else {
        duckWidth = 96; duckHeight = 93;
        duckVelocityX = 6; duckVelocityY = 6;
    }
}

// --- GAME STATE MANAGEMENT ---

// Start Game
function startGame() {
    if (isGameRunning) return;
    
    // Reset Stats
    isGameRunning = true;
    score = 0;
    scoreEl.innerHTML = "0";
    timeLeft = GAME_DURATION;
    timeEl.innerHTML = timeLeft;
    timeEl.style.color = "white"; 

    // Show Pause Button
    if (pauseBtn) pauseBtn.style.display = 'block';
    
    // Enable Crosshair
    document.body.classList.add('game-cursor');

    // Hide Menus
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    // Play Music
    if (!isMuted) music_bg.play().catch(e => {});

    // Start Loops
    clearTimers();
    spawnTimer = setTimeout(addDucks, 500); 
    moveTimer = setInterval(moveDucks, 1000/60);
    countdownTimer = setInterval(updateTimer, 1000);
    quackTimer = setInterval(playRandomQuack, 1200); 
    flapTimer = setInterval(playRandomFlap, 400);    
}

// Play Again (Global)
window.playAgain = function() {
    gameOverScreen.style.display = 'none';
    isGameRunning = false; 
    startGame();
}

// Restart to Title Screen
function restartToTitle() {
    isGameRunning = false;
    isPaused = false;
    clearTimers();
    
    // Reset UI
    document.body.classList.remove('game-cursor');
    music_bg.pause();
    music_bg.currentTime = 0;

    // Remove Ducks
    ducks.forEach(d => {
        if (d.image && document.body.contains(d.image)) document.body.removeChild(d.image);
    });
    ducks = [];

    // Reset Buttons/Screens
    if (pauseBtn) pauseBtn.style.display = 'none';
    pauseMenu.style.display = 'none';
    startScreen.style.display = 'flex';
}

// End Game
function finishGame() {
    isGameRunning = false;
    clearTimers();
    document.body.classList.remove('game-cursor');
    if(!isMuted) music_bg.pause();

    // Clear Screen
    ducks.forEach(d => {
        if (d.image && document.body.contains(d.image)) document.body.removeChild(d.image);
    });
    ducks = [];

    // Trigger Dog
    addDog();
}

// Timer Logic
function updateTimer() {
    if (isPaused) return;
    timeLeft--;
    timeEl.innerHTML = timeLeft;
    timeEl.style.color = (timeLeft <= 5) ? "red" : "white";
    if (timeLeft <= 0) finishGame();
}

// Clear All Loops
function clearTimers() {
    clearInterval(moveTimer);
    clearInterval(countdownTimer);
    clearInterval(quackTimer);
    clearInterval(flapTimer);
    clearTimeout(spawnTimer);
}

// --- INTERACTION LOGIC ---

// Toggle Pause
function togglePause() {
    isPaused = !isPaused;

    if (isPaused) {
        // Pause State
        pauseMenu.style.display = 'flex';
        document.body.classList.remove('game-cursor');
        clearTimers();
        if(!isMuted) music_bg.pause();
    } else {
        // Resume State
        pauseMenu.style.display = 'none';
        if (isGameRunning) {
            document.body.classList.add('game-cursor');
            moveTimer = setInterval(moveDucks, 1000/60);
            countdownTimer = setInterval(updateTimer, 1000);
            quackTimer = setInterval(playRandomQuack, 1200);
            flapTimer = setInterval(playRandomFlap, 400);
            if (ducks.length === 0) addDucks(); 
            if(!isMuted) music_bg.play();
        }
    }
}

// Toggle Mute
function toggleMute() {
    isMuted = !isMuted;
    soundBtn.innerHTML = isMuted ? "🔇" : "🔊";
    
    // Mute All
    let allAudio = [music_bg, sound_shot, sound_dog, sound_quack, sound_flap];
    allAudio.forEach(a => a.muted = isMuted);
    
    // Resume Music if needed
    if (!isMuted && isGameRunning && !isPaused) music_bg.play();
    soundBtn.blur(); 
}

// Show Game Over
function showScoreboard() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("duckhunt_best", highScore);
        highScoreEl.textContent = highScore;
    }
    document.getElementById('final-score').innerText = score;
    document.getElementById('final-best').innerText = highScore;
    gameOverScreen.style.display = 'flex';
}

// --- GAME ENTITIES ---

// Spawn Ducks
function addDucks() {
    if (isPaused || !isGameRunning) return;
    ducks = [];
    duckCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < duckCount; i++) {
        let duckImage = document.createElement("img");
        duckImage.src = duckImageNames[Math.floor(Math.random() * 2)];
        duckImage.width = duckWidth;
        duckImage.height = duckHeight;
        duckImage.draggable = false;
        duckImage.style.position = "absolute";
        
        // Shoot Handler
        function handleShoot(e) {
            e.stopPropagation();
            if (e.type === 'touchstart') e.preventDefault(); 
            if (isPaused) return;

            if (!isMuted) sound_shot.cloneNode().play();
            score++;
            scoreEl.innerHTML = score;

            if (document.body.contains(duckImage)) document.body.removeChild(duckImage);
            ducks = ducks.filter(d => d.image !== duckImage);

            if (ducks.length == 0) setTimeout(addDucks, 200); 
        }

        // Attach Events
        duckImage.addEventListener('touchstart', handleShoot, {passive: false});
        duckImage.addEventListener('mousedown', handleShoot);
        document.body.appendChild(duckImage);

        // Calculate Position
        let safeMaxX = Math.max(0, gameWidth - duckWidth);
        let safeMaxY = Math.max(0, gameHeight - duckHeight);

        let duck = {
            image: duckImage,
            x: Math.floor(Math.random() * safeMaxX),
            y: Math.floor(Math.random() * safeMaxY),
            width: duckWidth, height: duckHeight,
            velocityX: duckVelocityX, velocityY: duckVelocityY
        };

        // Direction Logic
        if (Math.random() > 0.5) {
            duck.velocityX = -duckVelocityX;
            duck.image.src = duckImageNames[0]; 
        } else {
            duck.image.src = duckImageNames[1]; 
        }
        ducks.push(duck);
    }
}

// Move Ducks
function moveDucks() {
    if (isPaused) return;
    for (let i = 0; i < ducks.length; i++) {
        let duck = ducks[i];
        
        // X Movement & Bounce
        duck.x += duck.velocityX;
        if (duck.x < 0 || duck.x + duck.width > gameWidth) {
            duck.x = Math.max(0, Math.min(duck.x, gameWidth - duck.width));
            duck.velocityX *= -1;
            duck.image.src = duck.velocityX < 0 ? duckImageNames[0] : duckImageNames[1];
        }

        // Y Movement & Bounce
        duck.y += duck.velocityY;
        if (duck.y < 0 || duck.y + duck.height > gameHeight) {
            duck.y = Math.max(0, Math.min(duck.y, gameHeight - duck.height));
            duck.velocityY *= -1;
        }

        // Update DOM
        duck.image.style.left = duck.x + "px";
        duck.image.style.top = duck.y + "px";
    }
}

// Dog Animation
function addDog() {
    let dogImage = document.createElement("img");
    dogImage.src = "../images/duckhunt/dog-duck2.png"; 
    dogImage.width = 250; dogImage.height = 225;
    dogImage.style.position = "fixed";
    dogImage.style.bottom = "-225px"; 
    dogImage.style.left = "50%";
    dogImage.style.transform = "translateX(-50%)";
    dogImage.style.zIndex = "15"; 
    dogImage.style.transition = "bottom 0.5s ease-out";
    
    document.body.appendChild(dogImage);
    if (!isMuted) { sound_dog.currentTime = 0; sound_dog.play(); }

    // Animate Up
    setTimeout(() => { dogImage.style.bottom = "0px"; }, 100);

    // Animate Down & End
    setTimeout(function() {
        if (document.body.contains(dogImage)) {
            dogImage.style.bottom = "-225px"; 
            setTimeout(() => {
                if (document.body.contains(dogImage)) document.body.removeChild(dogImage);
                showScoreboard();
            }, 500);
        }
    }, 3000); 
}

// --- AMBIENT SOUNDS ---
function playRandomQuack() {
    if (!isPaused && !isMuted && ducks.length > 0 && Math.random() > 0.3) {
        let q = sound_quack.cloneNode(); q.volume = 0.4; q.play().catch(e=>{});
    }
}
function playRandomFlap() {
    if (!isPaused && !isMuted && ducks.length > 0) {
        let f = sound_flap.cloneNode(); f.volume = 0.15; f.play().catch(e=>{});
    }
}