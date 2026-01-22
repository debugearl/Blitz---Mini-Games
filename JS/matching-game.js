// Set up game variables
document.addEventListener("DOMContentLoaded", () => {

  const grid = document.querySelector("#game-board");
  const startButton = document.getElementById("start-game");
  const timerDisplay = document.getElementById("timer");
  const bestTimeDisplay = document.getElementById("best-time");

  // Critical DOM check
  if (!grid || !startButton || !timerDisplay || !bestTimeDisplay) {
    console.error("Critical DOM elements missing. Game cannot start.");
    return;
  }

  // BACKGROUND MUSIC
  const bgMusic = new Audio("sounds/matching_game/bg_music.mp3");
  bgMusic.loop = true;
  bgMusic.volume = 0.4;

  // BACKGROUND MUSIC AUTOPLAY 
  bgMusic.play().catch(() => {
    console.warn("Autoplay blocked — waiting for first user interaction.");
    document.addEventListener(
      "pointerdown",
      () => bgMusic.play().catch(() => {}),
      { once: true }
    );
  });

  // SOUND BUTTON
  const soundBtn = document.getElementById("sound-btn");
  let isMuted = false;

  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      isMuted = !isMuted;
      bgMusic.muted = isMuted;
      soundBtn.textContent = isMuted ? "🔇" : "🔊";
    });
  }

  let cardsChosen = [];
  let cardsChosenId = [];
  let cardsWon = [];
  let timeElapsed = 0;
  let timerInterval;
  let preventClick = false;
  const maxTime = 30;

  // Card images
  const cardArray = [
    { name: "card1", img: "images/matching-game_images/card1.jpg" },
    { name: "card1", img: "images/matching-game_images/card1.jpg" },
    { name: "card2", img: "images/matching-game_images/card2.jpg" },
    { name: "card2", img: "images/matching-game_images/card2.jpg" },
    { name: "card3", img: "images/matching-game_images/card3.jpg" },
    { name: "card3", img: "images/matching-game_images/card3.jpg" },
    { name: "card4", img: "images/matching-game_images/card4.jpg" },
    { name: "card4", img: "images/matching-game_images/card4.jpg" },
    { name: "card5", img: "images/matching-game_images/card5.jpg" },
    { name: "card5", img: "images/matching-game_images/card5.jpg" },
    { name: "card6", img: "images/matching-game_images/card6.jpg" },
    { name: "card6", img: "images/matching-game_images/card6.jpg" }
  ];

  // Load best time safely
  let bestTime = null;
  try {
    bestTime = localStorage.getItem("bestTime");
  } catch {
    console.warn("LocalStorage unavailable.");
  }

  if (bestTime) bestTimeDisplay.textContent = `Best Time: ${bestTime} seconds`;

  // Shuffle
  function shuffle(array) {
    array.sort(() => 0.5 - Math.random());
  }

  // Create board
  function createBoard() {
    shuffle(cardArray);

    grid.innerHTML = "";
    cardsWon = [];
    cardsChosen = [];
    cardsChosenId = [];
    preventClick = false;

    clearInterval(timerInterval);
    timeElapsed = 0;
    timerDisplay.textContent = `Time: 0s`;

    timerInterval = setInterval(() => {
      if (!isPaused) {
        timeElapsed++;
        timerDisplay.textContent = `Time: ${timeElapsed}s`;

        if (timeElapsed >= maxTime) {
          clearInterval(timerInterval);
          endGame(false);
        }
      }
    }, 1000);

    for (let i = 0; i < cardArray.length; i++) {
      const card = document.createElement("img");
      card.setAttribute("src", "images/matching-game_images/blank.png");
      card.setAttribute("data-id", i);

      // Image fallback (essential)
      card.onerror = () => {
        card.setAttribute("src", "images/fallback.png");
      };

      card.addEventListener("click", flipCard);
      card.addEventListener("touchstart", flipCard);
      grid.appendChild(card);
    }
  }

  // Flip a card
  function flipCard(e) {
    e.preventDefault();
    if (isPaused || preventClick) return;

    const cardId = this.getAttribute("data-id");
    if (!cardId || cardsChosenId.includes(cardId)) return;

    cardsChosen.push(cardArray[cardId].name);
    cardsChosenId.push(cardId);
    this.setAttribute("src", cardArray[cardId].img);

    if (cardsChosen.length === 2) {
      preventClick = true;
      setTimeout(checkForMatch, 500);
    }
  }

  // Check match
  function checkForMatch() {
    const cards = document.querySelectorAll("#game-board img");
    const [firstCardId, secondCardId] = cardsChosenId;

    if (!cards[firstCardId] || !cards[secondCardId]) {
      cardsChosen = [];
      cardsChosenId = [];
      preventClick = false;
      return;
    }

    if (cardsChosen[0] === cardsChosen[1] && firstCardId !== secondCardId) {
      cards[firstCardId].style.visibility = "hidden";
      cards[secondCardId].style.visibility = "hidden";
      cardsWon.push(cardsChosen);
    } else {
      cards[firstCardId].setAttribute("src", "images/matching-game_images/blank.png");
      cards[secondCardId].setAttribute("src", "images/matching-game_images/blank.png");
    }

    cardsChosen = [];
    cardsChosenId = [];
    preventClick = false;

    if (cardsWon.length === cardArray.length / 2) {
      clearInterval(timerInterval);
      updateBestTime(timeElapsed);
      showAlert(`🎉 Great job! You found all cards in ${timeElapsed} seconds!`, "win");
    }
  }

  // End game
  function endGame(won) {
    bgMusic.pause();
    bgMusic.currentTime = 0;

    clearInterval(timerInterval);
    grid.innerHTML = "";

    if (won) {
      updateBestTime(timeElapsed);
      showAlert(`🎉 You won in ${timeElapsed} seconds!`, "win");
    } else {
      showAlert("⏰ Time’s up! Try again!", "lose");
    }
  }

  // Update best time (localStorage protected)
  function updateBestTime(timeTaken) {
    if (!bestTime || timeTaken < bestTime) {
      bestTime = timeTaken;
      try {
        localStorage.setItem("bestTime", bestTime);
      } catch {}
      bestTimeDisplay.textContent = `Best Time: ${bestTime} seconds`;
    }
  }

  // Show custom alert (kept minimal safety checks)
  function showAlert(message, type) {
    const alertBox = document.getElementById("customAlert");
    const alertTitle = alertBox?.querySelector("h2");
    const alertMessage = document.getElementById("alertMessage");

    if (!alertBox || !alertTitle || !alertMessage) return;

    alertTitle.textContent = type === "win" ? "🎉 Congratulations! 🎉" : "💀 Game Over 💀";
    alertMessage.textContent = message;

    alertBox.classList.remove("win-alert", "lose-alert");
    alertBox.classList.add(type === "win" ? "win-alert" : "lose-alert");

    alertBox.style.display = "flex";
  }

  window.closeAlert = function () {
    const alertBox = document.getElementById("customAlert");
    if (alertBox) alertBox.style.display = "none";
  };

  // Start
  startButton.addEventListener("click", () => {
    bgMusic.play().catch(() => {});
    createBoard();
  });

  // Play Again
  const playAgainBtn = document.getElementById("play-again-btn");
  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", () => {
      closeAlert();
      createBoard();
    });
  }

  // Back to Menu
  const backMenuBtn = document.getElementById("back-menu-btn");
  if (backMenuBtn) {
    backMenuBtn.addEventListener("click", () => transitionToPage("index.html"));
  }
});

// Pause system
let isPaused = false;

const pauseBtn = document.getElementById("pause-btn");
const pauseMenu = document.getElementById("pause-menu");
const resumeBtn = document.getElementById("resume-btn");
const backToMenuBtn = document.getElementById("menu-btn");

if (pauseBtn && pauseMenu && resumeBtn && backToMenuBtn) {
  pauseBtn.addEventListener("click", () => {
    isPaused = true;
    pauseMenu.style.display = "flex";
  });

  resumeBtn.addEventListener("click", () => {
    isPaused = false;
    pauseMenu.style.display = "none";
  });

  backToMenuBtn.addEventListener("click", () => transitionToPage("index.html"));
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
