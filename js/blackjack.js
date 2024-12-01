// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupEventListeners();
});

// Game State Variables
let deck = [];
let dealerHand = [];
let playerHand = [];
let dealerHiddenCard = null;

let totalBalance = 0;
let totalProfit = 0;
let currentBet = 0;
let totalWins = 0;
let totalLosses = 0;
let totalBets = 0;

let gameInProgress = false;

// HTML Elements
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.getElementById('nav-menu');
const dealerCards = document.getElementById("dealer-cards");
const dealerTotalValue = document.getElementById("dealer-total-value");
const playerCards = document.getElementById("player-cards");
const playerTotalValue = document.getElementById("player-total-value");
const resultDisplay = document.getElementById("result");
const hitButton = document.getElementById("hit-button");
const standButton = document.getElementById("stand-button");
const restartButton = document.getElementById("restart-button");
const playButton = document.getElementById("play-button");
const profitDisplay = document.getElementById("total-profit");
const balanceDisplay = document.getElementById("total-balance");
const bettingArea = document.getElementById("chips");
const chipsSection = document.getElementById("chips-area");

// Modal Elements
const modal = document.getElementById("modal");
const closeModalButton = document.getElementById("close-modal");
const modalMessage = document.getElementById("modal-message");

// Audio Elements
const winSound = new Audio('sounds/win-sound.wav');
const loseSound = new Audio('sounds/lose-sound.mp3');

// Initialize the game
function initializeGame() {
    // Initialize user profile
    loadUserProfile();

    // Initialize UI
    updateStatisticsDisplay();
    clearCardDisplay();
    resetGameState();

    // Initialize Mobile Menu Toggle
    mobileMenu.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenu.classList.toggle('open'); // Animates the hamburger icon
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Betting Chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', handleChipClick);
    });

    // Play Button
    playButton.addEventListener("click", () => {
        if (currentBet === 0) {
            openModal("Please place a bet before playing!");
            return;
        }
        dealInitialCards();
    });

    // Hit Button
    hitButton.addEventListener("click", () => {
        if (gameInProgress) {
            playerHand.push(drawCard());
            displayHands();
            checkPlayerBust();
        }
    });

    // Stand Button
    standButton.addEventListener("click", () => {
        if (gameInProgress) {
            dealerTurn();
        }
    });

    // Restart Button
    restartButton.addEventListener("click", restartGame);

    // Modal Close
    closeModalButton.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });
}

// Handle Chip Click
function handleChipClick() {
    if (gameInProgress) {
        openModal("Cannot place bets while game is in progress.");
        return;
    }

    const betValue = this.getAttribute('data-value') === 'all' ? totalBalance : parseInt(this.getAttribute('data-value'));

    if (isNaN(betValue) || betValue <= 0) {
        openModal("Invalid bet amount.");
        return;
    }

    if (betValue > totalBalance) {
        openModal("You don't have enough balance to place this bet.");
        return;
    }

    currentBet += betValue;
    totalBalance -= betValue;
    totalBets += betValue;

    updateStatisticsDisplay();
    bettingArea.innerHTML = `Betting Area: £${currentBet.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
    playButton.style.display = "block"; // Show play button once bet is placed
}

// Load User Profile from localStorage
function loadUserProfile() {
    let userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
    let userIndex = parseInt(localStorage.getItem("currentUserIndex"));

    // If no user is set, initialize the first user
    if (isNaN(userIndex) || userIndex < 0 || userIndex >= userProfiles.length) {
        // Create a default user profile
        const defaultUser = {
            totalProfit: "0.00",
            totalBalance: "500.00",
            totalWins: "0",
            totalLosses: "0.00",
            totalBets: "0.00"
        };
        userProfiles.push(defaultUser);
        userIndex = 0;
        localStorage.setItem("currentUserIndex", userIndex);
        localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
        console.log("Initialized default user profile.");
    }

    const currentUserProfile = userProfiles[userIndex];
    totalProfit = parseFloat(currentUserProfile.totalProfit) || 0;
    totalBalance = parseFloat(currentUserProfile.totalBalance) || 500; // Default to 500 if not set
    totalWins = parseInt(currentUserProfile.totalWins) || 0;
    totalLosses = parseFloat(currentUserProfile.totalLosses) || 0;
    totalBets = parseFloat(currentUserProfile.totalBets) || 0;

    console.log(`Loaded user profile:`, currentUserProfile);
}

// Update User Profile in localStorage
function updateUserProfile() {
    const userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
    const userIndex = parseInt(localStorage.getItem("currentUserIndex"));

    console.log(`Updating user profile for userIndex: ${userIndex}`);

    if (!isNaN(userIndex) && userIndex >= 0 && userIndex < userProfiles.length) {
        userProfiles[userIndex].totalProfit = totalProfit.toFixed(2); // Save profit
        userProfiles[userIndex].totalBalance = totalBalance.toFixed(2); // Save balance
        userProfiles[userIndex].totalWins = totalWins; // Save wins
        userProfiles[userIndex].totalLosses = totalLosses.toFixed(2); // Save losses
        userProfiles[userIndex].totalBets = totalBets.toFixed(2); // Save bets

        localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
        console.log(`User profile updated:`, userProfiles[userIndex]);
    } else {
        console.error("Invalid userIndex. Cannot update user profile.");
    }
}

// Update Statistics Display
function updateStatisticsDisplay() {
    profitDisplay.textContent = `Total Profit: £${totalProfit.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
    balanceDisplay.textContent = `£${totalBalance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
    document.getElementById("total-wins").textContent = `Total Wins: ${totalWins}`;
    document.getElementById("total-losses").textContent = `Total Losses: £${totalLosses.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
    document.getElementById("total-bets").textContent = `Total Bets Placed: £${totalBets.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
}

// Create a Deck of Cards
function createDeck() {
    const suits = ["c", "d", "h", "s"]; // Clubs, Diamonds, Hearts, Spades
    const values = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13"];
    let newDeck = [];

    for (let suit of suits) {
        for (let value of values) {
            newDeck.push({ value, suit });
        }
    }

    return shuffleDeck(newDeck);
}

// Shuffle the Deck
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Draw a Card from the Deck
function drawCard() {
    if (deck.length === 0) {
        deck = createDeck(); // Recreate deck if empty
    }
    return deck.pop();
}

// Deal Initial Cards
function dealInitialCards() {
    if (currentBet === 0) {
        openModal("Please place a bet before playing!");
        return;
    }

    // Reset Hands
    dealerHand = [];
    playerHand = [];
    dealerHiddenCard = null;

    // Deal Cards
    playerHand.push(drawCard());
    playerHand.push(drawCard());
    dealerHand.push(drawCard());
    dealerHiddenCard = drawCard();
    dealerHand.push(dealerHiddenCard);

    // Display Hands
    displayHands();

    // Update UI
    gameInProgress = true;
    playButton.style.display = "none";
    chipsSection.style.display = "none";
    restartButton.style.display = "none";
    hitButton.style.display = "block";
    standButton.style.display = "block";
}

// Display Hands
function displayHands(showDealerFull = false) {
    // Display Dealer's Cards
    if (showDealerFull) {
        dealerCards.innerHTML = dealerHand.map(card => `<img class="card" src="img/${card.suit}${card.value}.png" alt="${getCardName(card)}">`).join(" ");
        dealerTotalValue.textContent = `Dealer's Total: ${calculateHandValue(dealerHand)}`;
    } else {
        if (dealerHand.length > 0) {
            dealerCards.innerHTML = `<img class="card" src="img/${dealerHand[0].suit}${dealerHand[0].value}.png" alt="${getCardName(dealerHand[0])}">`;
            dealerCards.innerHTML += `<img class="card" src="img/hidden.png" alt="Hidden Card">`;
            dealerTotalValue.textContent = `Dealer's Total: ?`;
        }
    }

    // Display Player's Cards
    playerCards.innerHTML = playerHand.map(card => `<img class="card" src="img/${card.suit}${card.value}.png" alt="${getCardName(card)}">`).join(" ");
    playerTotalValue.textContent = `Your Total: ${calculateHandValue(playerHand)}`;
}

// Get Card Name for Accessibility
function getCardName(card) {
    const valueMap = {
        "01": "Ace",
        "11": "Jack",
        "12": "Queen",
        "13": "King"
    };
    const value = valueMap[card.value] || card.value;
    const suitMap = {
        "c": "Clubs",
        "d": "Diamonds",
        "h": "Hearts",
        "s": "Spades"
    };
    return `${value} of ${suitMap[card.suit]}`;
}

// Calculate Hand Value
function calculateHandValue(hand) {
    let value = 0;
    let aceCount = 0;

    for (let card of hand) {
        let cardValue = parseInt(card.value);
        if (cardValue >= 11 && cardValue <= 13) {
            value += 10; // Face cards
        } else if (cardValue === 1) {
            aceCount += 1;
            value += 11; // Ace initially counted as 11
        } else {
            value += cardValue; // Number cards
        }
    }

    // Adjust for Aces if value > 21
    while (value > 21 && aceCount > 0) {
        value -= 10;
        aceCount -= 1;
    }

    return value;
}

// Check if Player Busts
function checkPlayerBust() {
    const playerTotal = calculateHandValue(playerHand);
    playerTotalValue.textContent = `Your Total: ${playerTotal}`;

    if (playerTotal > 21) {
        announceWinner("dealer");
    }
}

// Dealer's Turn
function dealerTurn() {
    displayHands(true); // Show all dealer cards
    let dealerTotal = calculateHandValue(dealerHand);

    // Dealer hits until total is at least 17
    while (dealerTotal < 17) {
        dealerHand.push(drawCard());
        dealerTotal = calculateHandValue(dealerHand);
        displayHands(true);
    }

    // Determine Winner
    determineWinner();
}

// Determine Winner
function determineWinner() {
    const playerTotal = calculateHandValue(playerHand);
    const dealerTotal = calculateHandValue(dealerHand);

    if (dealerTotal > 21) {
        // Dealer busts, player wins
        announceWinner("player");
    } else if (playerTotal > dealerTotal) {
        // Player has higher total
        announceWinner("player");
    } else if (dealerTotal > playerTotal) {
        // Dealer has higher total
        announceWinner("dealer");
    } else {
        // Tie
        announceWinner("tie");
    }
}

// Announce Winner
function announceWinner(winner) {
    gameInProgress = false;

    if (winner === "player") {
        resultDisplay.style.color = "lightgreen";
        resultDisplay.textContent = "You win!";
        winSound.play();

        totalWins += 1;
        totalProfit += currentBet;
        totalBalance += currentBet * 2; // Player gets their bet back plus winnings
    } else if (winner === "dealer") {
        resultDisplay.style.color = "red";
        resultDisplay.textContent = "Dealer wins!";
        loseSound.play();

        totalLosses += currentBet;
        // Player already lost the bet when placing it
    } else if (winner === "tie") {
        resultDisplay.style.color = "yellow";
        resultDisplay.textContent = "It's a tie!";
        totalBalance += currentBet; // Refund the bet
    }

    // Update Statistics
    updateStatisticsDisplay();
    updateUserProfile();

    // Reset Current Bet
    currentBet = 0;
    bettingArea.innerHTML = `Betting Area: Place Your Bets!`;

    // Update UI
    hitButton.style.display = "none";
    standButton.style.display = "none";
    restartButton.style.display = "block";
    chipsSection.style.display = "block";
    playButton.style.display = "none"; // Hide play button until a new bet is placed

    // Check if player is out of balance
    if (totalBalance <= 0) {
        openModal("You have run out of balance! Please restart the game.");
    }
}

// Restart Game
function restartGame() {
    if (gameInProgress) {
        openModal("Game is in progress. Please finish the current game first.");
        return;
    }

    // Refund the current bet if any
    if (currentBet > 0) {
        totalBalance += currentBet;
        currentBet = 0;
        bettingArea.innerHTML = `Betting Area: Place Your Bets!`;
        updateStatisticsDisplay();
        updateUserProfile();
    }

    // Reset Game State
    resetGameState();
    clearCardDisplay();
    updateStatisticsDisplay();
    playButton.style.display = "none";
    restartButton.style.display = "none";
    chipsSection.style.display = "block";
}

// Reset Game State
function resetGameState() {
    dealerHand = [];
    playerHand = [];
    dealerHiddenCard = null;
    deck = createDeck();
    resultDisplay.textContent = "";
    gameInProgress = false;
    hitButton.style.display = "none";
    standButton.style.display = "none";
    playButton.style.display = "none";
    restartButton.style.display = "block";
}

// Clear Card Displays
function clearCardDisplay() {
    dealerCards.innerHTML = "";
    dealerTotalValue.textContent = "Dealer's Total: ?";
    playerCards.innerHTML = "";
    playerTotalValue.textContent = "Your Total: ?";
}

// Open Modal with Message
function openModal(message) {
    modalMessage.textContent = message;
    modal.style.display = "flex";
}

// Update User Profile in localStorage
function updateUserProfile() {
    const userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
    const userIndex = parseInt(localStorage.getItem("currentUserIndex"));

    if (!isNaN(userIndex) && userIndex >= 0 && userIndex < userProfiles.length) {
        userProfiles[userIndex].totalProfit = totalProfit.toFixed(2);
        userProfiles[userIndex].totalBalance = totalBalance.toFixed(2);
        userProfiles[userIndex].totalWins = totalWins;
        userProfiles[userIndex].totalLosses = totalLosses.toFixed(2);
        userProfiles[userIndex].totalBets = totalBets.toFixed(2);

        localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
    } else {
        console.error("Invalid user index. Cannot update user profile.");
    }
}

// Reset Local Storage (For Debugging Purposes)
// Uncomment the following lines to reset localStorage
/*
function resetLocalStorage() {
    localStorage.removeItem("userProfiles");
    localStorage.removeItem("currentUserIndex");
    console.log("LocalStorage has been reset.");
}
resetLocalStorage();
*/
