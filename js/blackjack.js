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

let totalBalance = 500; // Default starting balance
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
const winSound = new Audio('sounds/win-sound.mp3');
const loseSound = new Audio('sounds/lose-sound.mp3');

// Initialize the game
function initializeGame() {
    loadUserProfile();
    resetGameState();
    setupMobileMenu();
    updateStatisticsDisplay();
    clearCardDisplay();
}

// Setup Event Listeners
function setupEventListeners() {
    // Betting Chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', handleChipClick);
    });

    // Play Button
    playButton.addEventListener("click", startGame);

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

// Handle Mobile Menu Toggle
function setupMobileMenu() {
    mobileMenu.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenu.classList.toggle('open'); // Animates the hamburger icon
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

// Start the Game
function startGame() {
    if (currentBet === 0) {
        openModal("Please place a bet before playing!");
        return;
    }
    dealInitialCards();
    updateUIState();
}

// Deal Initial Cards
function dealInitialCards() {
    resetHands();
    playerHand.push(drawCard(), drawCard());
    dealerHand.push(drawCard());
    dealerHiddenCard = drawCard();
    displayHands();
    gameInProgress = true;
}

// Reset Hands
function resetHands() {
    dealerHand = [];
    playerHand = [];
    dealerHiddenCard = null;
}

// Display Hands
function displayHands(showDealerFull = false) {
    // Dealer's Cards
    dealerCards.innerHTML = dealerHand.map(card => createCardHTML(card)).join('');
    if (!showDealerFull) {
        dealerCards.innerHTML += `<img class="card" src="img/hidden.png" alt="Hidden Card">`;
        dealerTotalValue.textContent = "Dealer's Total: ?";
    } else {
        dealerTotalValue.textContent = `Dealer's Total: ${calculateHandValue(dealerHand)}`;
    }

    // Player's Cards
    playerCards.innerHTML = playerHand.map(card => createCardHTML(card)).join('');
    playerTotalValue.textContent = `Your Total: ${calculateHandValue(playerHand)}`;
}

// Create Card HTML
function createCardHTML(card) {
    return `<img class="card" src="img/${card.suit}${card.value}.png" alt="${getCardName(card)}">`;
}

// Calculate Hand Value
function calculateHandValue(hand) {
    let total = 0;
    let aces = 0;

    hand.forEach(card => {
        if (card.value === "01") {
            aces++;
            total += 11; // Count Ace as 11 initially
        } else if (["11", "12", "13"].includes(card.value)) {
            total += 10; // Face cards count as 10
        } else {
            total += parseInt(card.value);
        }
    });

    // Adjust Aces if total exceeds 21
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }

    return total;
}

// Check if Player Busts
function checkPlayerBust() {
    if (calculateHandValue(playerHand) > 21) {
        announceWinner("dealer");
    }
}

// Dealer's Turn
function dealerTurn() {
    displayHands(true);
    while (calculateHandValue(dealerHand) < 17) {
        dealerHand.push(drawCard());
        displayHands(true);
    }
    determineWinner();
}

// Determine Winner
function determineWinner() {
    const playerTotal = calculateHandValue(playerHand);
    const dealerTotal = calculateHandValue(dealerHand);

    if (dealerTotal > 21 || playerTotal > dealerTotal) {
        announceWinner("player");
    } else if (playerTotal < dealerTotal) {
        announceWinner("dealer");
    } else {
        announceWinner("tie");
    }
}

// Announce Winner
function announceWinner(winner) {
    gameInProgress = false;

    if (winner === "player") {
        resultDisplay.textContent = "You Win!";
        totalProfit += currentBet;
        totalBalance += currentBet * 2;
        totalWins++;
        winSound.play();
    } else if (winner === "dealer") {
        resultDisplay.textContent = "Dealer Wins!";
        totalLosses += currentBet;
        loseSound.play();
    } else {
        resultDisplay.textContent = "It's a Tie!";
        totalBalance += currentBet; // Refund bet
    }

    updateStatisticsDisplay();
    resetCurrentBet();
    updateUIState();
}

// Reset Current Bet
function resetCurrentBet() {
    currentBet = 0;
    bettingArea.innerHTML = "Betting Area: Place Your Bets!";
}

// Update UI State
function updateUIState() {
    hitButton.style.display = gameInProgress ? "block" : "none";
    standButton.style.display = gameInProgress ? "block" : "none";
    playButton.style.display = currentBet > 0 && !gameInProgress ? "block" : "none";
    restartButton.style.display = !gameInProgress ? "block" : "none";
}

// Reset Game State
function resetGameState() {
    deck = createDeck();
    shuffleDeck(deck);
    resetHands();
    clearCardDisplay();
    updateStatisticsDisplay();
    gameInProgress = false;
    resetCurrentBet();
    updateUIState();
}

// Shuffle the Deck
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Create a Deck of Cards
function createDeck() {
    const suits = ["c", "d", "h", "s"];
    const values = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13"];
    return suits.flatMap(suit => values.map(value => ({ suit, value })));
}

function clearCardDisplay() {
    dealerCards.innerHTML = "";
    dealerTotalValue.textContent = "Dealer's Total: ?";
    playerCards.innerHTML = "";
    playerTotalValue.textContent = "Your Total: ?";
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

// Open Modal with Message
function openModal(message) {
    modalMessage.textContent = message;
    modal.style.display = "flex";
}

// Load User Profile from localStorage
function loadUserProfile() {
    const userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
    const userIndex = parseInt(localStorage.getItem("currentUserIndex"));

    if (!isNaN(userIndex) && userProfiles[userIndex]) {
        const currentUserProfile = userProfiles[userIndex];
        totalProfit = parseFloat(currentUserProfile.totalProfit) || 0;
        totalBalance = parseFloat(currentUserProfile.totalBalance) || 500;
        totalWins = parseInt(currentUserProfile.totalWins) || 0;
        totalLosses = parseFloat(currentUserProfile.totalLosses) || 0;
        totalBets = parseFloat(currentUserProfile.totalBets) || 0;
    } else {
        saveDefaultUserProfile(userProfiles);
    }
    updateStatisticsDisplay();
}

// Save Default User Profile
function saveDefaultUserProfile(userProfiles) {
    const defaultUser = {
        totalProfit: "0.00",
        totalBalance: "500.00",
        totalWins: "0",
        totalLosses: "0.00",
        totalBets: "0.00"
    };
    userProfiles.push(defaultUser);
    localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
    localStorage.setItem("currentUserIndex", 0);
}

// Update User Profile in localStorage
function updateUserProfile() {
    const userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
    const userIndex = parseInt(localStorage.getItem("currentUserIndex"));

    if (!isNaN(userIndex) && userProfiles[userIndex]) {
        const currentUserProfile = userProfiles[userIndex];
        currentUserProfile.totalProfit = totalProfit.toFixed(2);
        currentUserProfile.totalBalance = totalBalance.toFixed(2);
        currentUserProfile.totalWins = totalWins;
        currentUserProfile.totalLosses = totalLosses.toFixed(2);
        currentUserProfile.totalBets = totalBets.toFixed(2);

        localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
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

// Restart the Game
function restartGame() {
    if (gameInProgress) {
        openModal("Game is in progress. Please finish the current game first.");
        return;
    }

    resetCurrentBet();
    resetGameState();
    clearCardDisplay();
    updateStatisticsDisplay();
    playButton.style.display = "none";
    restartButton.style.display = "none";
    chipsSection.style.display = "block";
}

// Debugging Helper (Optional)
// Uncomment to clear localStorage for testing
/*
function resetLocalStorage() {
    localStorage.removeItem("userProfiles");
    localStorage.removeItem("currentUserIndex");
    console.log("LocalStorage has been reset.");
}
resetLocalStorage();
*/
