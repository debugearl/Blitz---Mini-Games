// --- GLOBAL VARIABLES --- //
let move_speed;
let pipe_gap;
let grativy;

// Adjust settings for small screens (1080px and below) to keep gameplay stable
if (window.innerWidth <= 1080) {
    move_speed = 1.7; 
    pipe_gap = 40;
    grativy = 0.19;
} else {
    move_speed = 3; 
    pipe_gap = 35; 
    grativy = 0.2; 
}

let bird = document.querySelector('.bird');
let img = document.getElementById('bird-1');

// --- AUDIO SETUP ---
let sound_point = new Audio('../sounds/flap-tap_sound-effects/point_flap-tap.mp3');
let sound_die = new Audio('../sounds/flap-tap_sound-effects/die_flap-tap.mp3');
let sound_flap = new Audio('../sounds/flap-tap_sound-effects/flap_flap-tap.mp3');
let music_bg = new Audio('../sounds/flap-tap_sound-effects/bgm_flap-tap.mp3');
music_bg.loop = true; 
music_bg.volume = 0.3; 

// CHECK SAVED MUTE STATE
let isMuted = localStorage.getItem("flap_muted") === "true";

// Apply the saved mute setting immediately
if(isMuted) {
    music_bg.muted = true;
    sound_point.muted = true;
    sound_die.muted = true;
    sound_flap.muted = true;
}

// Score
let highScore = localStorage.getItem("flap_best") || 0;
document.getElementById("high-score-value").textContent = highScore;
let score_val = document.querySelector('.score_val');

// Coordinates
let bird_props = bird.getBoundingClientRect();
let background = document.querySelector('.background').getBoundingClientRect();

// Game State & Physics Variables
let game_state = 'Start';
let previous_game_state = null; 
let bird_dy = 0;
let pipe_seperation = 0;

// UI Elements
let pause_btn = document.getElementById('pause-btn');
let pause_menu = document.getElementById('pause-menu');
let resume_btn = document.getElementById('resume-btn');
let home_btn = document.getElementById('menu-btn');
let start_screen = document.getElementById('start-screen');
let soundBtn = document.getElementById('sound-btn');

// Initial Setup
img.style.display = 'none';

// --- MENU MUSIC LOGIC ---
let music_started = false;
function startMenuMusic() {
    if (game_state === 'Start' && !music_started) {
        music_bg.play().then(() => {
            music_started = true;
        }).catch(error => {
            console.log("Music waiting for interaction...");
        });
    }
}
document.addEventListener('click', startMenuMusic);
document.addEventListener('keydown', startMenuMusic);
document.addEventListener('mousemove', startMenuMusic);


// --- CENTRALIZED START FUNCTION ---
function startGame() {
    document.querySelectorAll('.pipe_sprite').forEach((e) => {
        e.remove();
    });

    start_screen.style.display = 'none';
    img.style.display = 'block';
    bird.style.top = '40vh';
    game_state = 'Play';
    score_val.innerHTML = '0';
    
    bird_dy = 0;
    pipe_seperation = 0;
    
    music_bg.pause();
    music_bg.currentTime = 0;
    
    play();
}

// --- EVENT LISTENERS ---

// 1. Start Game (Spacebar)
document.addEventListener('keydown', (e) => {
    if(e.key == ' ' && game_state == 'Start'){
        e.preventDefault(); 
        startGame(); // Call the function
    }
});

// 1. Start Game (Mouse Click)
document.addEventListener('mousedown', (e) => {

    if(e.target.id === 'sound-btn') return;

    if(game_state == 'Start'){
        startGame(); 
    }
});

// 2. Pause Button
pause_btn.addEventListener('click', () => {
    if(game_state == 'Play' || game_state == 'Start'){
        previous_game_state = game_state;
        game_state = 'Pause';
        pause_menu.style.display = 'flex';
        pause_btn.style.display = 'none';
    }
});
pause_btn.addEventListener('mousedown', (e) => { e.stopPropagation(); });

// 3. Resume Button
resume_btn.addEventListener('click', () => {
    if(game_state == 'Pause'){
        game_state = previous_game_state;
        pause_menu.style.display = 'none';
        pause_btn.style.display = 'block';

        if(game_state == 'Start') music_bg.play();

        if(game_state == 'Play'){
            requestAnimationFrame(move);
            requestAnimationFrame(apply_gravity);
            requestAnimationFrame(create_pipe);
        }
    }
});

// 4. Home Button
home_btn.addEventListener('click', () => {
    transitionToPage("index.html");
});

// 5. Bird Controls
function jump() {
    if(game_state != 'Play') return;
    img.src = '../images/flap-tap_images/bird2_flap-tap.png';
    bird_dy = -7.6;
    sound_flap.currentTime = 0;
    sound_flap.play();
}

document.addEventListener('keydown', (e) => {
    if((e.key == 'ArrowUp' || e.key == ' ') && game_state == 'Play'){
        jump();
    }
});

document.addEventListener('keyup', (e) => {
    if((e.key == 'ArrowUp' || e.key == ' ') && game_state == 'Play'){
        img.src = '../images/flap-tap_images/bird_flap-tap.png';
    }
});

document.addEventListener('mousedown', () => {
    if(game_state == 'Play') jump();
});

document.addEventListener('mouseup', () => {
    if(game_state == 'Play') img.src = '../images/flap-tap_images/bird_flap-tap.png';
});


// --- SOUND TOGGLE LOGIC ---
if (isMuted) {
    soundBtn.innerHTML = "🔇";
} else {
    soundBtn.innerHTML = "🔊";
}

soundBtn.addEventListener('click', () => {
    isMuted = !isMuted; 
    localStorage.setItem("flap_muted", isMuted);

    if (isMuted) {
        soundBtn.innerHTML = "🔇";
        music_bg.muted = true;
        sound_point.muted = true;
        sound_die.muted = true;
        sound_flap.muted = true;
    } else {
        soundBtn.innerHTML = "🔊";
        music_bg.muted = false;
        sound_point.muted = false;
        sound_die.muted = false;
        sound_flap.muted = false;
        if (game_state === 'Start') {
             music_bg.play().catch(e => console.log("Interaction needed"));
        }
    }
    soundBtn.blur(); 
});
soundBtn.addEventListener('mousedown', (e) => { e.stopPropagation(); });


// --- GAME LOOP ---
function play(){
    requestAnimationFrame(move);
    requestAnimationFrame(apply_gravity);
    requestAnimationFrame(create_pipe);
}

function move(){
    if(game_state != 'Play') return;

    let pipe_sprite = document.querySelectorAll('.pipe_sprite');
    pipe_sprite.forEach((element) => {
        let pipe_sprite_props = element.getBoundingClientRect();
        bird_props = bird.getBoundingClientRect();

        if(pipe_sprite_props.right <= 0){
            element.remove();
        }else{
            if(bird_props.left < pipe_sprite_props.left + pipe_sprite_props.width && 
               bird_props.left + bird_props.width > pipe_sprite_props.left && 
               bird_props.top < pipe_sprite_props.top + pipe_sprite_props.height && 
               bird_props.top + bird_props.height > pipe_sprite_props.top){
                showGameOver();
                return;
            }else{
                if(pipe_sprite_props.right < bird_props.left && 
                   pipe_sprite_props.right + move_speed >= bird_props.left && 
                   element.increase_score == '1'){
                    score_val.innerHTML = Number(score_val.innerHTML) + 1;
                    sound_point.currentTime = 0;
                    sound_point.play();
                }
                element.style.left = pipe_sprite_props.left - move_speed + 'px';
            }
        }
    });
    requestAnimationFrame(move);
}

function apply_gravity(){
    if(game_state != 'Play') return;
    bird_dy = bird_dy + grativy;

    if(bird_props.top <= 0 || bird_props.bottom >= background.bottom){
        showGameOver();
        return;
    }
    bird.style.top = bird_props.top + bird_dy + 'px';
    bird_props = bird.getBoundingClientRect();
    requestAnimationFrame(apply_gravity);
}

function create_pipe(){
    if(game_state != 'Play') return;

    if(pipe_seperation > 200){
        pipe_seperation = 0;
        let pipe_posi = Math.floor(Math.random() * 43) + 8;
        let pipe_sprite_inv = document.createElement('div');
        pipe_sprite_inv.className = 'pipe_sprite top_pipe';
        pipe_sprite_inv.style.top = pipe_posi - 70 + 'vh';
        pipe_sprite_inv.style.left = '100vw';
        document.body.appendChild(pipe_sprite_inv);
        let pipe_sprite = document.createElement('div');
        pipe_sprite.className = 'pipe_sprite';
        pipe_sprite.style.top = pipe_posi + pipe_gap + 'vh';
        pipe_sprite.style.left = '100vw';
        pipe_sprite.increase_score = '1';
        document.body.appendChild(pipe_sprite);
    }
    pipe_seperation++;
    requestAnimationFrame(create_pipe);
}

// --- GAME OVER LOGIC ---
function showGameOver() {
    game_state = 'End';
    music_bg.pause(); 
    
    let currentScore = Number(score_val.innerHTML);
    if (currentScore > highScore) {
        highScore = currentScore;
        localStorage.setItem("flap_best", highScore);
        document.getElementById("high-score-value").textContent = highScore;
    }

    start_screen.style.display = 'flex'; 
    
    start_screen.innerHTML = `
        <div class="game-over-box messageStyle">
            <h2 class="game-over-title">Game Over</h2>
            <div class="score-text">
                <p>Score: ${currentScore}</p>
                <p>Best Score: ${highScore}</p>
            </div>
            <div class="game-over-btns">
                <button id="again-btn">Play Again</button>
                <button id="menu-gameover-btn">Back to Arcade</button>
            </div>
        </div>
    `;

    img.style.display = 'none';
    pause_btn.style.display = "none";
    soundBtn.style.display = "none";

    if(!isMuted) {
        sound_die.play();
    }

    document.getElementById("again-btn").onclick = () => window.location.reload();
    document.getElementById("menu-gameover-btn").onclick = () => transitionToPage("index.html");
}

// Page transition function
function transitionToPage(href) {
  try {
    const overlay = document.querySelector(".fade-overlay");
    if (!overlay) {
      console.error("Fade overlay element missing!");
      window.location.href = href; 
      return;
    }

    overlay.classList.add("active");
    console.log("Transition started to:", href);

    setTimeout(() => {
      window.location.href = href;
    }, 350);
  } catch (err) {
    console.error("Error during page transition:", err);
    window.location.href = href;
  }
}