// Global flag to prevent multiple calculations without resetting
let alreadyCalculated = false;

// Initialize the page
window.onload = function () {
  document.getElementById("calculate").addEventListener("click", calculateLove);
  document.getElementById("back-btn").addEventListener("click", showConfirmBox);

  document.getElementById("no-btn").addEventListener("click", hideConfirmBox);
  document.getElementById("yes-btn").addEventListener("click", goBackToMenu);

  document.getElementById("kilig-music").volume = 0.5;
  document.getElementById("sad-music").volume = 0.5;
};

function showConfirmBox() {
  let box = document.getElementById("confirm-box");
  box.style.visibility = "visible";
  box.style.opacity = "1";
}

function hideConfirmBox() {
  let box = document.getElementById("confirm-box");
  box.style.opacity = "0";
  setTimeout(() => {
    box.style.visibility = "hidden";
  }, 300);
}

function goBackToMenu() {
  transitionToPage("index.html");
}

// Function to play the kilig music
function playKiligMusic() {
  let music = document.getElementById("kilig-music");
  music.currentTime = 0; // Reset to start
  music.play();
}

// Function to play the sad music
function playSadMusic() {
  let music = document.getElementById("sad-music");
  music.currentTime = 0; // Reset to start
  music.play();
}

// Function to spawn animated heart emojis on the screen for positive results
function spawnHearts() {
  for (let i = 0; i < 12; i++) {
    let heart = document.createElement("div");
    heart.classList.add("heart");
    heart.innerText = "❤";

    // Random horizontal position within the content box
    heart.style.left = Math.random() * 80 + 10 + "%";
    heart.style.bottom = "20px";

    document.body.appendChild(heart);

    // Remove the heart after animation (2 seconds)
    setTimeout(() => {
      heart.remove();
    }, 2000);
  }
}

// Function to spawn animated broken heart emojis on the screen for negative results
function spawnBrokenHearts() {
  for (let i = 0; i < 12; i++) {
    let heart = document.createElement("div");
    heart.classList.add("heart");
    heart.innerText = "💔";

    // Random horizontal position within the content box
    heart.style.left = Math.random() * 80 + 10 + "%";
    heart.style.bottom = "20px";

    document.body.appendChild(heart);

    // Remove the heart after animation (2 seconds)
    setTimeout(() => {
      heart.remove();
    }, 2000);
  }
}

// Main function to calculate love percentage, validate inputs, display results, and trigger effects
function calculateLove() {
  if (alreadyCalculated) return;

  let yourNameInput = document.getElementById("your-name");
  let crushNameInput = document.getElementById("crush-name");

  let yourName = yourNameInput.value.trim();
  let crushName = crushNameInput.value.trim();

  // Remove previous error styles
  yourNameInput.classList.remove("error");
  crushNameInput.classList.remove("error");

  // Validation #1: Check if both names are provided
  if (yourName === "" || crushName === "") {
    if (yourName === "") yourNameInput.classList.add("error");
    if (crushName === "") crushNameInput.classList.add("error");
    alert("Please fill out both names.");
    return;
  }

  // Validation #2: Check that names contain ONLY letters and spaces
  const namePattern = /^[A-Za-z\s]+$/;
  let hasError = false;

  if (!namePattern.test(yourName)) {
    yourNameInput.classList.add("error");
    hasError = true;
  }

  if (!namePattern.test(crushName)) {
    crushNameInput.classList.add("error");
    hasError = true;
  }

  if (hasError) {
    alert(
      "Names should only contain letters and spaces (no numbers or symbols)."
    );
    return;
  }
  
  // Generate a random percentage (0-100)
  let percentage = Math.floor(Math.random() * 101);

  // Display the result message and percentage
  document.getElementById("result-message").innerText =
    yourName + " and " + crushName + "'s chance of love:";
  document.getElementById("result-percentage").innerText = percentage + "%";

  // Based on percentage, play music, spawn hearts, and set comment
  if (percentage >= 50) {
    playKiligMusic();
    spawnHearts();
    document.getElementById("result-comment").innerText =
      "It's a sign! Baka kayo pala talaga? 💕";
  } else {
    playSadMusic();
    spawnBrokenHearts();
    document.getElementById("result-comment").innerText =
      "Awts, 'wag na ipilit kung hindi talaga pwede 💔";
  }

  alreadyCalculated = true; // Set flag to prevent further calculations

  createResetButton(); // Add reset button after calculation
}

// Function to create and append a reset button to clear the form and results
function createResetButton() {
  if (document.getElementById("reset-btn")) return; // Avoid duplicate buttons

  let resetBtn = document.createElement("button");
  resetBtn.id = "reset-btn";
  resetBtn.innerText = "Try New Pair";

  // Reset function: Clear inputs, results, stop music, and remove the button
  resetBtn.onclick = function () {
    document.getElementById("your-name").value = "";
    document.getElementById("crush-name").value = "";
    document.getElementById("result-message").innerText = "";
    document.getElementById("result-percentage").innerText = "";
    alreadyCalculated = false; // Reset flag

    // Stop and reset both music tracks
    let kiligMusic = document.getElementById("kilig-music");
    let sadMusic = document.getElementById("sad-music");

    kiligMusic.pause();
    kiligMusic.currentTime = 0;

    sadMusic.pause();
    sadMusic.currentTime = 0;

    document.getElementById("result-comment").innerText = "";

    resetBtn.remove(); // Remove the reset button itself
  };

  document.getElementById("content-box").appendChild(resetBtn);
}

// Transition to another page 
function transitionToPage(href) {
    const overlay = document.querySelector('.fade-overlay');
    overlay.classList.add("active");

    setTimeout(() => {
        window.location.href = href;
    }, 300);
}