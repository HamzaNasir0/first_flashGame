document.addEventListener("DOMContentLoaded", () => {
  // Main game logic

  // Define variables and functions necessary for the game
  // For example:
  const emojiSlots = [
    { emoji: "🍎", value: 25 },  // Apple
    { emoji: "🍌", value: 50 },  // Banana
    { emoji: "🍇", value: 75 },  // Grapes
    { emoji: "🍒", value: 125 },  // Cherry
    { emoji: "🍍", value: 250 }, // Pineapple
    { emoji: "🍓", value: 375 }, // Strawberry
    { emoji: "🍑", value: 500 }, // Peach
    { emoji: "🍉", value: 1000 }  // Watermelon
  ];

  const gridSize = 3;
  let grid = [];
  let scratched = [];

  const emojiGrid = document.getElementById("emojiGrid");
  const playButton = document.getElementById("playButton");
  const buttonsContainer = document.querySelector(".scratch-win__buttons");

  // Modal elements
  const winModal = document.getElementById("win-modal");
  const winMessage = document.getElementById("win-message");
  const playAgainButton = document.getElementById("play-again-button");
  const cancelButton = document.getElementById("cancel-button");
  const detailsModal = document.getElementById("details-modal");
  const closeDetailsButton = document.getElementById("close-details-modal");
  const emojiDetailsList = document.getElementById("emoji-details-list");
  const balanceDisplay = document.querySelector(".balance-display");

  // Create no match modal elements
  const noMatchModal = document.createElement("div");
  noMatchModal.id = "no-match-modal";
  noMatchModal.classList.add("modal");
  noMatchModal.style.display = "none";

  const noMatchMessage = document.createElement("div");
  noMatchMessage.id = "no-match-message";
  noMatchMessage.classList.add("modal-content");
  noMatchMessage.innerHTML = "No Match! Better luck next time.";

  const noMatchPlayAgainButton = document.createElement("button");
  noMatchPlayAgainButton.id = "no-match-play-again-button";
  noMatchPlayAgainButton.style.marginRight = "10px";
  noMatchPlayAgainButton.textContent = "Play Again";

  const noMatchCancelButton = document.createElement("button");
  noMatchCancelButton.id = "no-match-cancel-button";
  noMatchCancelButton.style.marginLeft = "10px";
  noMatchCancelButton.textContent = "Cancel";

  const noMatchButtonContainer = document.createElement("div");
  noMatchButtonContainer.classList.add("button-container");
  noMatchButtonContainer.style.marginTop = "20px";
  noMatchButtonContainer.style.textAlign = "center";
  noMatchButtonContainer.appendChild(noMatchPlayAgainButton);
  noMatchButtonContainer.appendChild(noMatchCancelButton);

  noMatchMessage.appendChild(noMatchButtonContainer);
  noMatchModal.appendChild(noMatchMessage);
  document.body.appendChild(noMatchModal);

  // Ensure currentUserProfile is defined
  let currentUserProfile = {};

  // Initialize user profile
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

  // Update balance display
  const updateUserBalanceDisplay = () => {
    if (!balanceDisplay) {
      console.error("Balance element not found in the DOM.");
      return;
    }
    balanceDisplay.textContent = `Balance: ${formatMoney(currentUserProfile.totalBalance)}`;
  };

  // Format money as currency
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
  };

  // Deduct play cost and validate balance
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

  // Save user profile to localStorage
  const saveUserProfile = () => {
    const userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
    const userIndex = parseInt(localStorage.getItem("currentUserIndex"), 10);

    if (!isNaN(userIndex) && userProfiles[userIndex]) {
      userProfiles[userIndex] = currentUserProfile;
      localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
    } else {
      console.error("Error: Unable to save user profile. User not found.");
    }
  };

  const initializeGrid = () => {
    // Function to initialize the game grid
    emojiGrid.innerHTML = ""; // Clear the previous grid
    grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
    scratched = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

    // Introduce a 30% chance of having a winning configuration
    const shouldHaveWinningCombination = Math.random() < 0.3;

    if (shouldHaveWinningCombination) {
      // Generate a winning combination
      const predefinedEmoji = emojiSlots[Math.floor(Math.random() * emojiSlots.length)];

      const winType = Math.floor(Math.random() * 3); // 0: row, 1: column, 2: diagonal

      if (winType === 0) {
        const winRow = Math.floor(Math.random() * gridSize);
        for (let col = 0; col < gridSize; col++) {
          grid[winRow][col] = predefinedEmoji;
        }
      } else if (winType === 1) {
        const winCol = Math.floor(Math.random() * gridSize);
        for (let row = 0; row < gridSize; row++) {
          grid[row][winCol] = predefinedEmoji;
        }
      } else {
        for (let i = 0; i < gridSize; i++) {
          grid[i][i] = predefinedEmoji;
        }
      }
    }

    // Fill the rest of the grid with random emojis
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (grid[row][col] === null) {
          grid[row][col] = emojiSlots[Math.floor(Math.random() * emojiSlots.length)];
        }
        const cell = createCell(row, col);
        emojiGrid.appendChild(cell);
      }
    }
  };

  const createCell = (row, col) => {
    // Function to create a cell in the grid
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
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
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

    const scratch = (event) => {
      if (!gameInProgress || hasWon) return;

      event.preventDefault();
      
      const pointer = event.touches ? event.touches[0] : event;
      const canvas = event.currentTarget;
      if (!canvas) return;
      
      const ctx = canvas.getContext("2d");
      
      // Clear the entire canvas
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Get cell and reveal immediately
      const cell = canvas.parentElement;
      const cellRow = parseInt(cell.dataset.row);
      const cellCol = parseInt(cell.dataset.col);
      
      if (!scratched[cellRow][cellCol]) {
        scratched[cellRow][cellCol] = true;
        revealedCount++;
        canvas.remove();
        
        // Check for win/loss immediately
        const amountWon = checkWin();
        if (amountWon > 0) {
          hasWon = true;
          currentUserProfile.totalBalance += amountWon;
          saveUserProfile();
          updateUserBalanceDisplay();
          displayWinMessage(amountWon);
          gameInProgress = false;
        } else if (revealedCount >= gridSize * gridSize) {
          displayNoMatchMessage();
          gameInProgress = false;
        }
      }
    };

    const calculateTransparency = (ctx) => {
      const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height).data;
      let transparentPixels = 0;

      for (let i = 3; i < imageData.length; i += 4) {
        if (imageData[i] === 0) transparentPixels++;
      }

      return transparentPixels / (ctx.canvas.width * ctx.canvas.height);
    };

    let isScratching = false;

    const startScratch = (event) => {
      event.preventDefault();
      isScratching = true;
      scratch(event);
    };

    const stopScratch = () => {
      isScratching = false;
    };

    const scratchHandler = (event) => {
      if (!isScratching) return;
      scratch(event);
    };

    // Update event listeners for better mobile support
    canvas.addEventListener("mousedown", scratch, { passive: false });
    canvas.addEventListener("touchstart", scratch, { passive: false });

    // Add document-level touch end listener
    document.addEventListener("touchend", stopScratch);
    document.addEventListener("touchcancel", stopScratch);

    // Add data attributes to track cell position
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.fullyScratched = false;

    return cell;
  };

  const checkWin = () => {
    // Function to check for a winning combination
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
        const winningEmoji = emojiSlots.find((slot) => slot.emoji === emojiA);
        const amountWon = winningEmoji ? winningEmoji.value : 0;
        return amountWon; // Return the winning amount
      }
    }

    return 0; // No valid winning combination found
  };

  const checkGameStatus = () => {
    if (!gameInProgress) return;

    const amountWon = checkWin();
    if (amountWon > 0 && !hasWonPopupShown) {
      hasWonPopupShown = true;
      hasWon = true;
      currentUserProfile.totalBalance += amountWon;
      saveUserProfile();
      updateUserBalanceDisplay();
      displayWinMessage(amountWon);
      gameInProgress = false;
    } else if (revealedCount >= gridSize * gridSize) {
      displayNoMatchMessage();
      gameInProgress = false;
    }
  };

  // Add resultDisplay element reference
  const resultDisplay = document.getElementById("resultDisplay");

  // Update displayWinMessage function
  const displayWinMessage = (amountWon) => {
    resultDisplay.style.display = 'block'; // Ensure visibility
    resultDisplay.innerHTML = `
      <div style="font-size: 1.2em; margin-bottom: 10px;">
        Congratulations! You won ${formatMoney(amountWon)}!
      </div>
      <button class="restart-button" onclick="location.reload()">Play Again</button>
    `;
    resultDisplay.className = 'result-display show win';
  };

  // Update displayNoMatchMessage function
  const displayNoMatchMessage = () => {
    resultDisplay.style.display = 'block'; // Ensure visibility
    resultDisplay.innerHTML = `
      <div style="font-size: 1.2em; margin-bottom: 10px;">
        No Match! Better luck next time.
      </div>
      <button class="restart-button" onclick="location.reload()">Play Again</button>
    `;
    resultDisplay.className = 'result-display show lose';
  };

  // Update resetGame function
  const resetGame = () => {
    grid = [];
    scratched = [];
    hasWon = false;
    hasWonPopupShown = false;
    revealedCount = 0;
    gameInProgress = true;
    resultDisplay.className = 'result-display'; // Reset result display
    resultDisplay.textContent = ''; // Clear previous result
    initializeGrid();
  };

  playButton.addEventListener("click", () => {
    if (gameInProgress) return;

    const playCost = 100;
    if (deductPlayCost(playCost)) {
      playButton.style.display = 'none';
      resetGame();
    }
  });

  playAgainButton.addEventListener("click", () => {
    winModal.style.display = "none";
    gameInProgress = false;
    playButton.style.display = 'block';
  });

  cancelButton.addEventListener("click", () => {
    winModal.style.display = "none";
    gameInProgress = false;
    playButton.style.display = 'block';
  });

  noMatchPlayAgainButton.addEventListener("click", () => {
    noMatchModal.style.display = "none";
    gameInProgress = false;
    playButton.style.display = 'block';
  });

  noMatchCancelButton.addEventListener("click", () => {
    noMatchModal.style.display = "none";
    gameInProgress = false;
    playButton.style.display = 'block';
  });

  initializeUserProfile();
  updateUserBalanceDisplay();
  gameInProgress = false; // Ensure game is not in progress on load
  initializeGrid();

  // Ensure there are no JavaScript errors affecting the page rendering
  console.log('Scratch & Win page loaded successfully');
});

// Add these variable declarations at the beginning of your script
let hasWon = false;
let hasWonPopupShown = false;
let revealedCount = 0;
let gameInProgress = false;

// When a bet is placed or game starts
function startGame() {
    const betAmount = getBetAmount(); // Implement this function to get the bet amount
    currentUserProfile.totalBalance -= betAmount;
    currentUserProfile.totalBets += betAmount;
    updateBalance(userIndex, -betAmount); // Deduct bet
    updateUserProfile();
    
    // ...existing game start logic...
}

// When the player wins
function handleWin(reward) {
    currentUserProfile.totalBalance += reward;
    currentUserProfile.totalProfit += (reward - currentBet);
    updateBalance(userIndex, reward); // Add winnings
    updateProfit(userIndex, reward - currentBet); // Update profit
    updateUserProfile();
    
    // ...existing win logic...
}

// When the player loses
function handleLoss() {
    currentUserProfile.totalProfit -= currentBet;
    updateProfit(userIndex, -currentBet); // Update profit
    updateUserProfile();
    
    // ...existing loss logic...
}

// Ensure these functions are called appropriately within game events