// Game variables
let currMoleTile;
let currPlantTile;
let score = 0;
let gameOver = false;
let timeLeft = 40;
let timerInterval;
let isPaused = false;
let isMuted = false;

window.onload = function() {
    // Back button redirects to main menu
    document.getElementById("backBtn").onclick = () => {
        transitionToPage("index.html");
    }

    // Check saved mute setting
    isMuted = localStorage.getItem("muted") === "1";

    // Display correct sound icon
    document.getElementById("sound-btn").innerText = isMuted ? "🔇" : "🔊";

    // Apply mute settings to all audio
    document.getElementById("hitSound").muted = isMuted;
    document.getElementById("boomSound").muted = isMuted;
    document.getElementById("bgMusicMenu").muted = isMuted;
    document.getElementById("bgMusicInGame").muted = isMuted;
    
    // Set menu bg music volume
    let menuMusic = document.getElementById("bgMusicMenu");
    menuMusic.volume = 0.5;

    // Start menu music on first user interaction
    menuMusic.play().catch(() => {
    document.addEventListener("pointerdown", startMenuMusic);
    });

    const startMenuMusic = () => {
        if (!isMuted) {
            menuMusic.play().catch(e => console.log("Menu music failed to play:", e));
        }

        document.removeEventListener("pointerdown", startMenuMusic); 
    };
    document.addEventListener("pointerdown", startMenuMusic);
    
    // Update best score display | localStorage.removeItem("bestScore"); = reset high score)
    updateBestScoreDisplay();
    
    // Button functions
    document.getElementById("startBtn").addEventListener("click", startGame);
    document.getElementById("playAgainBtn").addEventListener("click", () => {
        document.getElementById("gameOverScreen").style.display = "none";
        startGame();
    });
    document.getElementById("menuBtn").addEventListener("click", backToMenu);
    document.getElementById("pauseBtn").addEventListener("click", pauseGame);
    document.getElementById("resumeBtn").addEventListener("click", resumeGame);
    document.getElementById("pauseMenuBtn").addEventListener("click", backToMenu);

    // Sound toggle button
    const soundBtn = document.getElementById("sound-btn");
    soundBtn.addEventListener("click", () => {
        
        // Toggle mute state
        isMuted = !isMuted;
        soundBtn.innerText = isMuted ? "🔇" : "🔊";

        // Update audio mute status
        document.getElementById("hitSound").muted = isMuted;
        document.getElementById("boomSound").muted = isMuted;

        const menuMusic = document.getElementById("bgMusicMenu");
        const gameMusic = document.getElementById("bgMusicInGame");

        menuMusic.muted = isMuted;
        gameMusic.muted = isMuted;

        // Manage audio playback based on mute state
        if (isMuted) {
            menuMusic.pause();
            gameMusic.pause();
        } else {
            if (!gameOver && document.getElementById("board").style.display === "flex") {
                gameMusic.play().catch(e => console.log("Game music failed to play on unmute:", e));  
            } else {
                menuMusic.play().catch(e => console.log("Menu music failed to play on unmute:", e)); 
            }
    }
    // Save mute preference
    localStorage.setItem("muted", isMuted ? "1" : "0"); 
    });
}

// Update best score displayed on UI
function updateBestScoreDisplay() {
    let best = localStorage.getItem("bestScore") || 0;
    document.getElementById("bestScoreDisplay").innerText = "Best: " + best;
}

// Start the game: initialize board, reset variables, start timer
function startGame() {

    document.getElementById("backBtn").classList.add("hidden");
    
    document.getElementById("bgMusicMenu").pause();
    document.getElementById("bgMusicInGame").currentTime = 0;
    if (!isMuted) document.getElementById("bgMusicInGame").play();

    updateBestScoreDisplay();

    const board = document.getElementById("board");
    board.innerHTML = "";
    board.style.display = "flex";
    
    // Show gameplay UI
    document.getElementById("pauseBtn").style.display = "block";
    document.getElementById("mole-text").style.display = "none";
    document.getElementById("instructions").style.display = "none";
    document.getElementById("startBtn").style.display = "none";
    document.getElementById("mole-text2").style.display = "block";
    document.getElementById("score").style.display = "block";
    document.getElementById("timer").style.display = "block";

    document.body.classList.add("game-cursor");

    // Change background
    const bgDiv = document.querySelector(".background");
    bgDiv.style.backgroundImage = 'url("../images/whack-a-mole-images/whac-a-mole-bg4.png")';
    bgDiv.style.backgroundRepeat = 'no-repeat';
    bgDiv.style.backgroundPosition = 'center';
    bgDiv.style.backgroundSize = 'cover';

    // Reset game values
    score = 0;
    timeLeft = 40;
    gameOver = false;
    isPaused = false;

    document.getElementById("score").innerText = "Current Score: " + score;
    document.getElementById("timer").innerText = "Time left: " + timeLeft + "s";

    setupBoard();
    startTimer();
    spawnMole();
    spawnPlant();
}

// Create a 3x3 board tiles and add click listeners
function setupBoard() {
    const board = document.getElementById("board");
    for (let i = 0; i < 9; i++) {
        let tile = document.createElement("div");
        tile.id = i.toString();
        tile.addEventListener("click", selectTile);
        board.appendChild(tile);
    }
}

// Return a random tile index (0-8)
function getRandomTile() {
    return Math.floor(Math.random() * 9).toString();
}

// Place mole in a random tile
function setMole() {
    if (gameOver) return;

    if (currMoleTile) currMoleTile.innerHTML = "";

    let mole = document.createElement("img");
    mole.src = "../images/whack-a-mole-images/mole2.png";

    let num = getRandomTile();
    if (currPlantTile && currPlantTile.id === num) return;

    currMoleTile = document.getElementById(num);
    currMoleTile.appendChild(mole);
}

// Place bomb in a random tile
function setPlant() {
    if (gameOver) return;

    if (currPlantTile) currPlantTile.innerHTML = "";

    let plant = document.createElement("img");
    plant.src = "../images/whack-a-mole-images/bomb2.png";

    let num = getRandomTile();
    if (currMoleTile && currMoleTile.id === num) return;

    currPlantTile = document.getElementById(num);
    currPlantTile.appendChild(plant);
}

// Handle clicks on tiles
function selectTile() {
    if (gameOver || isPaused) return;

    let hitSound = document.getElementById("hitSound")
    let boomSound = document.getElementById("boomSound")

    if (this === currMoleTile) {
        hitSound.currentTime = 0;
        hitSound.play();
        score += 10;
        document.getElementById("score").innerText = "Current Score: " + score;
        currMoleTile.innerHTML = "";
        currMoleTile = null;
    } else if (this === currPlantTile) {
        boomSound.currentTime = 0;
        boomSound.play();
        endGame();
    }
}

// Remove all moles and bombs from board
function clearBoard() {
    document.querySelectorAll("#board div").forEach(tile => tile.innerHTML = "");
}

// Mole spawning loop
function spawnMole() {
    if (gameOver || isPaused) return;
    setMole();
    setTimeout(spawnMole, getMoleSpeed());
}

// Bomb spawning loop
function spawnPlant() {
    if (gameOver || isPaused) return;
    setPlant();
    setTimeout(spawnPlant, getPlantSpeed());
}

// Determine mole speed based on time left
function getMoleSpeed() {
    if (timeLeft <= 10) return 550;
    if (timeLeft <= 20) return 700;
    return 1000;
}

// Determine bomb speed based on time left
function getPlantSpeed() {
    if (timeLeft <= 10) return 550;
    if (timeLeft <= 20) return 700;
    return 1000;
}

// Start countdown timer
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameOver || isPaused) return;

        timeLeft--;
        const timerEl = document.getElementById("timer");
        timerEl.innerText = "Time left: " + timeLeft + "s";

        if (timeLeft > 25) timerEl.style.color = "#ffffff";
        else if (timeLeft > 10) timerEl.style.color = "#ffcc66";
        else timerEl.style.color = "red";

        if (timeLeft <= 0) {
            boomSound.play();
            endGame();
        }
    }, 1000);
}

// Pause the game
function pauseGame() {
    
    document.getElementById("backBtn").classList.add("hidden");
    
    if (gameOver || isPaused) return;

    isPaused = true;
    document.getElementById("bgMusicInGame").pause();
    
    document.getElementById("pauseOverlay").style.display = "block";
    document.getElementById("pauseScreen").style.display = "block";
    
    document.body.classList.remove("default-cursor");
    document.getElementById("pauseBtn").style.display = "none";
}

// Resume the game
function resumeGame() {
    document.getElementById("backBtn").classList.add("hidden");

    if (!isMuted) document.getElementById("bgMusicInGame").play();

    document.getElementById("pauseBtn").style.display = "block";
    if (gameOver || !isPaused) return;

    isPaused = false;
    document.getElementById("bgMusicMenu").pause();
    document.getElementById("pauseOverlay").style.display = "none";
    document.getElementById("pauseScreen").style.display = "none";

    document.body.classList.remove("default-cursor");
    document.body.classList.add("game-cursor");

    spawnMole();
    spawnPlant();
}

/// End the game
function endGame() {
    document.getElementById("backBtn").classList.add("hidden");
    document.getElementById("bgMusicInGame").pause();

    gameOver = true;

    clearBoard();

    document.body.classList.remove("game-cursor");

    showGameOverScreen();
    hideGameUI();
    updateBestScoreDisplay();
}

// Hide main game UI elements
function hideGameUI() {
    document.getElementById("board").style.display = "none";
    document.getElementById("score").style.display = "none";
    document.getElementById("timer").style.display = "none";
    document.getElementById("mole-text2").style.display = "none";
    document.getElementById("pauseBtn").style.display = "none";
}

// Show game over UI best score
function showGameOverScreen() {
    document.getElementById("gameOverScreen").style.display = "flex";
    document.getElementById("finalScore").innerText = "Score: " + score;

    // Retrieve saved best score
    let best = localStorage.getItem("bestScore") || 0;
    
    // Save new best score if higher
    if (score > best) {
        best = score;
        localStorage.setItem("bestScore", best);
    }

    // Update best score text
    document.getElementById("bestScore").innerText = "Best Score: " + best;

    // Ensure the screen becomes visible
    document.getElementById("gameOverScreen").style.display = "block";
}

// Sound button event listener
document.getElementById("sound-btn").addEventListener("click", toggleSound);

// Go back to main menu
function backToMenu() {

    // Stop in-game music and timer
    document.getElementById("bgMusicInGame").pause();
    clearInterval(timerInterval);

    gameOver = true; 

    clearBoard(); 

    // Hide all in-game screens and UI components
    document.getElementById("board").style.display = "none";
    document.getElementById("pauseOverlay").style.display = "none";
    document.getElementById("pauseScreen").style.display = "none";
    document.getElementById("pauseBtn").style.display = "none";
    document.getElementById("score").style.display = "none";
    document.getElementById("timer").style.display = "none";
    document.getElementById("mole-text2").style.display = "none";
    document.getElementById("gameOverScreen").style.display = "none";

    // Re-enable back button
    document.getElementById("backBtn").classList.remove("hidden");
    
    // Restore default cursor
    document.body.classList.remove("game-cursor");
 
    // Show main menu UI
    document.getElementById("mole-text").style.display = "block";
    document.getElementById("instructions").style.display = "block";
    document.getElementById("startBtn").style.display = "block";
    document.body.classList.add("default-cursor"); 
    
    // Restart menu music if not muted
    const menuMusic = document.getElementById("bgMusicMenu");
    if (!isMuted) {
        menuMusic.currentTime = 0; 
        menuMusic.play().catch(e => console.log("Menu music failed to play:", e));
    }

    // Reset background to menu theme
    const bgDiv = document.querySelector(".background");
    bgDiv.style.backgroundImage = 'url("../images/whack-a-mole-images/whac-a-mole-bg2.png")'; 
    bgDiv.style.backgroundRepeat = 'no-repeat';
    bgDiv.style.backgroundPosition = 'center';
    bgDiv.style.backgroundSize = 'cover';
}

// Page transition (safe fallback)
function transitionToPage(href) {
  const overlay = document.querySelector(".fade-overlay");

  if (!overlay) {
    window.location.href = href;
    return;
  }

  overlay.classList.add("active");
  setTimeout(() => (window.location.href = href), 350);
}