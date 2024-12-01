// Emoji Scratch Card Game

// Define available emojis with associated values
const emojiSlots = [
  { emoji: "🍎", value: 100 },  // Apple
  { emoji: "🍌", value: 200 },  // Banana
  { emoji: "🍇", value: 300 },  // Grapes
  { emoji: "🍒", value: 500 },  // Cherry
  { emoji: "🍍", value: 1000 }, // Pineapple
  { emoji: "🍓", value: 1500 }, // Strawberry
  { emoji: "🍑", value: 2000 }, // Peach
  { emoji: "🍉", value: 5000 }  // Watermelon
];

// Grid configuration
const gridSize = 3; // 3x3 grid
const emojiGrid = document.getElementById("emojiGrid");
const coin = document.getElementById("coin");
const playButton = document.getElementById("playButton");

// Game state variables
let grid = []; // To store emoji values for winning logic
let scratched = []; // To track scratched cells
let revealedCount = 0; // Track how many cells have been revealed
let hasWon = false; // To ensure win is only triggered once
let currentUserProfile = null; // Current user profile

// Retrieve the user profile and update balance display
const initializeUserProfile = () => {
  const userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
  const userIndex = parseInt(localStorage.getItem("currentUserIndex"), 10);

  if (!isNaN(userIndex) && userProfiles[userIndex]) {
    currentUserProfile = userProfiles[userIndex];
    updateUserBalanceDisplay();
  } else {
    alert("User not found. Redirecting to login.");
    window.location.href = "user-auth.html"; // Redirect to login if user not found
  }
};

// Update user balance display
const updateUserBalanceDisplay = () => {
  const balanceElement = document.querySelector(".navbar__balance");
  balanceElement.textContent = `Balance: £${currentUserProfile.totalBalance.toFixed(2)}`;
};

// Deduct cost to play and validate if the user has enough balance
const deductPlayCost = (cost) => {
  if (currentUserProfile.totalBalance >= cost) {
    currentUserProfile.totalBalance -= cost;
    saveUserProfile();
    updateUserBalanceDisplay();
    return true;
  } else {
    alert("Insufficient balance to play.");
    return false;
  }
};

// Save the updated user profile back to localStorage
const saveUserProfile = () => {
  const userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
  const userIndex = parseInt(localStorage.getItem("currentUserIndex"), 10);

  if (!isNaN(userIndex) && userProfiles[userIndex]) {
    userProfiles[userIndex] = currentUserProfile;
    localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
  }
};

// Move the coin to follow the mouse or touch
const moveCoin = (event) => {
  event.preventDefault(); // Prevents touch from scrolling when interacting with the game
  const clientX = event.clientX || (event.touches && event.touches[0].clientX);
  const clientY = event.clientY || (event.touches && event.touches[0].clientY);

  if (clientX !== undefined && clientY !== undefined) {
    coin.style.left = `${clientX}px`;
    coin.style.top = `${clientY}px`;
  }
};

window.addEventListener("mousemove", moveCoin, { passive: false });
window.addEventListener("touchmove", moveCoin, { passive: false });

// Function to display a non-blocking win message
const displayWinMessage = () => {
  const message = document.createElement("div");
  message.id = "winMessage";
  message.innerHTML = "You Win! 🎉";

  document.body.appendChild(message);

  // Automatically remove the message after 3 seconds
  setTimeout(() => {
    message.remove();
  }, 3000);
};

// Function to display a non-blocking "No Match" message
const displayNoMatchMessage = () => {
  const message = document.createElement("div");
  message.id = "noMatchMessage";
  message.innerHTML = "No Match! Try Again.";

  document.body.appendChild(message);

  // Automatically remove the message after 3 seconds
  setTimeout(() => {
    message.remove();
  }, 3000);
};

// Function to check for a win
const checkWin = () => {
  // Define all possible winning combinations
  const winningCombinations = [
    // Rows
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    // Columns
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    // Diagonals
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]],
  ];

  for (let combo of winningCombinations) {
    const [a, b, c] = combo;
    const emojiA = grid[a[0]][a[1]].emoji;
    const emojiB = grid[b[0]][b[1]].emoji;
    const emojiC = grid[c[0]][c[1]].emoji;
    const scratchedA = scratched[a[0]][a[1]];
    const scratchedB = scratched[b[0]][b[1]];
    const scratchedC = scratched[c[0]][c[1]];

    if (
      emojiA === emojiB &&
      emojiB === emojiC &&
      emojiA !== null &&
      scratchedA &&
      scratchedB &&
      scratchedC
    ) {
      console.log(`Win detected on cells: ${JSON.stringify(combo)}`);
      return true; // Winning combination found and all cells scratched
    }
  }

  return false; // No valid winning combination found
};

// Function to create a cell in the grid
const createCell = (row, col) => {
  const cell = document.createElement("div");
  cell.classList.add("scratch-win__cell");

  const emoji = document.createElement("div");
  emoji.classList.add("scratch-win__emoji");

  // Assign the emoji from the grid array
  let cellEmoji = grid[row][col].emoji;
  emoji.textContent = cellEmoji;

  cell.appendChild(emoji);

  const canvas = document.createElement("canvas");
  canvas.classList.add("scratch-win__foreground");
  canvas.width = 300; // Increased for better resolution on high-density screens
  canvas.height = 300;
  cell.appendChild(canvas);

  // Adjust canvas for high-DPI screens
  const ctx = canvas.getContext("2d");
  const scale = window.devicePixelRatio || 1;
  canvas.width = 100 * scale;
  canvas.height = 100 * scale;
  ctx.scale(scale, scale);

  // Create gradient overlay
  const gradient = ctx.createLinearGradient(0, 0, 100, 100);
  gradient.addColorStop(0, "#d4af37");
  gradient.addColorStop(1, "#a67c00");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 100, 100);

  let fullyScratched = false; // Prevent multiple counting for revealedCount

  // Function to calculate transparency percentage
  const calculateTransparency = () => {
    const imageData = ctx.getImageData(0, 0, 100, 100).data;
    const alphaValues = Array.from(imageData).filter(
      (value, index) => index % 4 === 3 && value === 0
    );
    return alphaValues.length / (100 * 100);
  };

  // Scratch handler
  const scratch = (event) => {
    if (hasWon) return; // Prevent further scratching after win

    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);

    if (clientX === undefined || clientY === undefined) return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Determine scratch radius based on input type
    const isTouchEvent = event.type.includes("touch");
    const scratchRadius = isTouchEvent ? 20 : 10; // Larger radius for touch

    // Scratch the area
    ctx.clearRect(x - scratchRadius, y - scratchRadius, scratchRadius * 2, scratchRadius * 2);

    // Throttle transparency calculation to optimize performance
    scratch.scratchCount = (scratch.scratchCount || 0) + 1;
    const SCRATCH_THRESHOLD = 10; // Calculate transparency after every 10 scratches

    if (scratch.scratchCount % SCRATCH_THRESHOLD === 0) {
      const transparency = calculateTransparency();

      // Increased threshold to 60%
      if (!fullyScratched && transparency > 0.6) {
        fullyScratched = true; // Mark cell as scratched
        revealedCount++;

        canvas.remove(); // Remove the canvas to reveal the emoji
        cell.classList.add("scratch-win--scratched");

        // Update scratched state
        scratched[row][col] = true;

        console.log(`Cell [${row + 1}][${col + 1}] scratched. Revealed Count: ${revealedCount}`);

        // Check for win immediately after scratching a cell
        if (checkWin()) {
          hasWon = true; // Prevent further scratching
          displayWinMessage(); // Show non-blocking win message

          // Trigger confetti animation
          if (typeof confetti === 'function') {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 }
            });
          }

          // Optionally, add the confetti--active class for additional effects
          document.getElementById("confetti").classList.add("confetti--active");
        } else if (revealedCount === gridSize * gridSize) {
          // If all cells are scratched and no win
          displayNoMatchMessage();
        }
      }
    }
  };

  // Event handling for scratching
  let isScratching = false;

  const startScratch = (event) => {
    event.preventDefault(); // Prevents touch scrolling
    isScratching = true;
    scratch(event);
  };

  const stopScratch = (event) => {
    isScratching = false;
  };

  const scratchHandler = (event) => {
    if (!isScratching) return;
    scratch(event);
  };

  // Add event listeners
  canvas.addEventListener("mousedown", startScratch);
  canvas.addEventListener("touchstart", startScratch);
  window.addEventListener("mouseup", stopScratch);
  window.addEventListener("touchend", stopScratch);
  canvas.addEventListener("mousemove", scratchHandler);
  canvas.addEventListener("touchmove", scratchHandler);

  return cell;
};

// Function to initialize the grid with at least one winning combination
const initializeGrid = () => {
  // Initialize grid as a 3x3 array filled with null
  grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
  scratched = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  // Select a predefined emoji for the winning combination
  const predefinedEmoji = emojiSlots[Math.floor(Math.random() * emojiSlots.length)];

  // Randomly decide where to place the winning combination
  const winType = Math.floor(Math.random() * 3); // 0: row, 1: column, 2: diagonal

  if (winType === 0) { // Row
    const winRow = Math.floor(Math.random() * gridSize);
    for (let col = 0; col < gridSize; col++) {
      grid[winRow][col] = predefinedEmoji;
    }
    console.log(`Predefined winning combination on row ${winRow + 1}`);
  } else if (winType === 1) { // Column
    const winCol = Math.floor(Math.random() * gridSize);
    for (let row = 0; row < gridSize; row++) {
      grid[row][winCol] = predefinedEmoji;
    }
    console.log(`Predefined winning combination on column ${winCol + 1}`);
  } else { // Diagonal
    for (let i = 0; i < gridSize; i++) {
      grid[i][i] = predefinedEmoji;
    }
    console.log("Predefined winning combination on top-left to bottom-right diagonal");
  }

  // Create cells with the predefined winning combination and random emojis
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // If the cell is already set for a winning combination, use that emoji
      // Otherwise, assign a random emoji
      if (grid[row][col] === null) {
        grid[row][col] = emojiSlots[Math.floor(Math.random() * emojiSlots.length)];
      }
      const cell = createCell(row, col);
      emojiGrid.appendChild(cell);
    }
  }

  console.log("Initial Grid:", grid);
  console.log("Initial Scratched State:", scratched);
};

// Function to reset the game
const resetGame = () => {
  // Clear the grid
  emojiGrid.innerHTML = "";
  grid = [];
  scratched = [];
  revealedCount = 0;
  hasWon = false;

  // Remove confetti
  document.getElementById("confetti").classList.remove("confetti--active");

  // Remove any existing messages
  const existingWinMessage = document.getElementById("winMessage");
  if (existingWinMessage) existingWinMessage.remove();

  const existingNoMatchMessage = document.getElementById("noMatchMessage");
  if (existingNoMatchMessage) existingNoMatchMessage.remove();

  // Reinitialize the grid
  initializeGrid();
};

// Function to handle play button click
playButton.addEventListener("click", () => {
  const playCost = 5; // Define the cost to play

  if (deductPlayCost(playCost)) {
    resetGame();
  }
});

// Initialize the game
initializeUserProfile();
initializeGrid();
