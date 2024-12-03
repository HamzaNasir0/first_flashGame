document.addEventListener("DOMContentLoaded", () => {
  // Define available emojis with associated values
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

  // Grid configuration
  const gridSize = 3; // 3x3 grid
  const emojiGrid = document.getElementById("emojiGrid");
  const coin = document.getElementById("coin");
  const playButton = document.getElementById("playButton");
  const detailsButton = document.getElementById("detailsButton");
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

  // Game state variables
  let grid = []; // To store emoji values for winning logic
  let scratched = []; // To track scratched cells
  let revealedCount = 0; // Track how many cells have been revealed
  let hasWon = false; // To ensure win is only triggered once
  let hasWonPopupShown = false; // Track if win popup has been shown
  let gameInProgress = false; // Track if a game is currently in progress

  // Function to display a non-blocking win message
  const displayWinMessage = (amountWon) => {
    winMessage.innerHTML = `You won <strong>${formatMoney(amountWon)}</strong>! Would you like to play again?`;
    winModal.style.display = "flex";
    currentUserProfile.totalBalance += amountWon; // Update balance on win
    saveUserProfile();
    updateUserBalanceDisplay();
  };

  // Function to display a non-blocking "No Match" message as a modal
  const displayNoMatchMessage = () => {
    noMatchModal.style.display = "flex";
    // Deduct play cost on no match
    currentUserProfile.totalBalance -= 100;
    saveUserProfile();
    updateUserBalanceDisplay();
  };

  // Function to check for a win
  const checkWin = () => {
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
    if (!balanceDisplay) {
      console.error("Balance element not found in the DOM."); // Debug log
      return;
    }
    balanceDisplay.textContent = `Balance: ${formatMoney(currentUserProfile.totalBalance)}`;
  };

  // Function to format money as currency
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
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
    } else {
      console.error("Error: Unable to save user profile. User not found."); // Debug log
    }
  };

  // Function to move the coin to follow the mouse or touch
  const moveCoin = (event) => {
    event.preventDefault(); // Prevents touch from scrolling when interacting with the game

    // Get the coordinates from mouse or touch events
    const clientX = event.clientX || (event.touches && event.touches[0].clientX);
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);

    if (clientX !== undefined && clientY !== undefined) {
      // Set the position of the coin element
      coin.style.left = `${clientX - (coin.offsetWidth / 2) + window.scrollX}px`;
      coin.style.top = `${clientY - (coin.offsetHeight / 2) + window.scrollY}px`;
    }
  };

  // Event listeners for mouse and touch movements
  window.addEventListener("mousemove", moveCoin);
  window.addEventListener("touchmove", moveCoin, { passive: false });

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

    // Scratch handler
    const scratch = (event) => {
      if (!gameInProgress) {
        console.log("Game is not in progress. Cannot scratch."); // Debug log
        return; // Prevent scratching if the game is not in progress
      }

      if (hasWon) return; // Prevent further scratching after win

      const rect = canvas.getBoundingClientRect();
      const clientX = event.clientX || (event.touches && event.touches[0].clientX);
      const clientY = event.clientY || (event.touches && event.touches[0].clientY);

      if (clientX === undefined || clientY === undefined) return;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const scratchRadius = 15; // Scratch radius
      ctx.globalCompositeOperation = 'destination-out'; // Makes scratched areas transparent
      ctx.beginPath();
      ctx.arc(x, y, scratchRadius, 0, 2 * Math.PI);
      ctx.fill();

      const transparency = calculateTransparency(ctx);
      if (transparency > 0.5 && !fullyScratched) { // Fully reveal after 50% scratched
        fullyScratched = true;
        revealedCount++;
        canvas.remove(); // Remove the canvas to reveal the emoji
        cell.classList.add("scratch-win--scratched");
        scratched[row][col] = true;

        const amountWon = checkWin();
        if (amountWon > 0 && !hasWonPopupShown) {
          hasWonPopupShown = true;
          hasWon = true;
          currentUserProfile.totalBalance += amountWon; // Add the winning amount to the balance
          saveUserProfile(); // Save the updated balance
          updateUserBalanceDisplay(); // Update the balance display in the UI
          displayWinMessage(amountWon);
          gameInProgress = false; // End the game
        } else if (revealedCount === gridSize * gridSize) {
          displayNoMatchMessage();
          gameInProgress = false; // End the game
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

    canvas.addEventListener("mousedown", startScratch);
    canvas.addEventListener("touchstart", startScratch, { passive: false });
    window.addEventListener("mouseup", stopScratch);
    window.addEventListener("touchend", stopScratch, { passive: false });
    canvas.addEventListener("mousemove", scratchHandler);
    canvas.addEventListener("touchmove", scratchHandler);

    return cell;
  };

  // Function to initialize the grid with at least one winning combination
// Function to initialize the grid with a lower chance of having a winning combination
const initializeGrid = () => {
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


  // Function to reset the game
  const resetGame = () => {
    grid = [];
    scratched = [];
    revealedCount = 0;
    hasWon = false;
    hasPaid = false;
    initializeGrid();
  };

  // Function to handle play button click
  playButton.addEventListener("click", () => {
    if (gameInProgress) return; // Prevent starting a new game if one is in progress

    const playCost = 100;
    if (deductPlayCost(playCost)) {
      playButton.style.display = 'none'; // Hide the play button once the game starts
      detailsButton.style.display = 'none'; // Hide the details button once the game starts
      hasPaid = true; // Mark that the user has paid to play
      gameInProgress = true; // Mark that a game is in progress
      resetGame(); // Reset the game and generate a new grid
    }
  });

  // Event listeners for modal buttons
  playAgainButton.addEventListener("click", () => {
    if (gameInProgress) return; // Prevent play again if a game is in progress
    winModal.style.display = "none";
    hasPaid = false; // Reset payment status for a new game
    playButton.style.display = 'none'; // Hide play button during game reset
    detailsButton.style.display = 'none'; // Hide details button during game reset
    const playCost = 100;
    if (deductPlayCost(playCost)) {
      resetGame(); // Reset the game
      gameInProgress = true; // Mark that a game is in progress
      hasWonPopupShown = false; // Allow for a new game popup
    }
  });

  cancelButton.addEventListener("click", () => {
    winModal.style.display = "none";
    hasWonPopupShown = false; // Allow for a new game popup
    playButton.style.display = 'block'; // Show the play button
    detailsButton.style.display = 'block'; // Show the details button
    gameInProgress = false; // End the game
  });

  // Event listener for no match play again button
  noMatchPlayAgainButton.addEventListener("click", () => {
    if (gameInProgress) return; // Prevent play again if a game is in progress
    noMatchModal.style.display = "none";
    hasPaid = false; // Reset payment status for a new game
    playButton.style.display = 'none'; // Hide play button during game reset
    detailsButton.style.display = 'none'; // Hide details button during game reset
    const playCost = 100;
    if (deductPlayCost(playCost)) {
      resetGame(); // Reset the game
      gameInProgress = true; // Mark that a game is in progress
      hasWonPopupShown = false; // Allow for a new game popup
    }
  });

  // Event listener for no match cancel button
  noMatchCancelButton.addEventListener("click", () => {
    noMatchModal.style.display = "none";
    playButton.style.display = 'block'; // Show the play button
    detailsButton.style.display = 'block'; // Show the details button
    gameInProgress = false; // End the game
  });

  // Function to show details modal
  const showDetailsModal = () => {
    emojiDetailsList.innerHTML = emojiSlots.map(slot => `<li>${slot.emoji}: ${formatMoney(slot.value)}</li>`).join('');
    detailsModal.style.display = "flex";
  };

  // Event listener for details button
  detailsButton.addEventListener("click", showDetailsModal);

  // Event listener for closing details modal
  closeDetailsButton.addEventListener("click", () => {
    detailsModal.style.display = "none";
  });

  // Initialize the game
  initializeUserProfile();
  updateUserBalanceDisplay();
  initializeGrid();
});