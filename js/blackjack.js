// Game State Variables
let deck = [];
let dealerHand = [];
let playerHand = [];
let dealerHiddenCard = null;
let gameInProgress = false;

// Player Statistics
let totalBalance = 0;
let totalProfit = 0;
let currentBet = 0;
let totalWins = 0;
let totalLosses = 0;
let totalBets = 0;

// DOM Elements
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
const modal = document.getElementById("modal");
const closeModalButton = document.getElementById("close-modal");
const modalMessage = document.getElementById("modal-message");
const gameContainer = document.querySelector('.blackjack-game');
const clearBetButton = document.getElementById("clear-bet-button");
const totalProfitDisplay = document.getElementById("total-profit");
const totalLostDisplay = document.getElementById("total-losses");
const totalBetDisplay = document.getElementById("total-bets");
const highestCrashDisplay = document.getElementById("highest-crash");

// Utility Functions
function toggleButtonVisibility(buttonIds, action) {
    buttonIds.forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            button.classList[action]('d-none');
            button.setAttribute('aria-pressed', action === 'remove' ? 'true' : 'false');
        }
    });
}

// Initialize Game
document.addEventListener('DOMContentLoaded', () => {
    console.log('Blackjack page loaded successfully');
    initializeGame();
    setupEventListeners();
    
    // Declare and initialize currentUserProfile before any usage
    let currentUserProfile = getCurrentUserProfile();
});

function initializeGame() {
    deck = createDeck();
    loadUserProfile();
    updateStatisticsDisplay();
    clearCardDisplay();
    resetGameState();
    
    // Hide all game control buttons initially except clear bet
    playButton.classList.add('d-none');
    hitButton.classList.add('d-none');
    standButton.classList.add('d-none');
    restartButton.classList.add('d-none'); // Ensure restart button is hidden at start
    
    bettingArea.classList.remove('d-none');
    chipsSection.classList.remove('d-none');
    
    resultDisplay.textContent = '';

    gameInProgress = false;
    modal.style.display = "none";
    clearBetButton.classList.remove('d-none');
    updateUI();
}

function setupEventListeners() {
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', handleChipClick);
    });

    playButton.addEventListener("click", () => {
        if (currentBet === 0) {
            openModal("Please place a bet before playing!");
            return;
        }
        dealInitialCards();
    });

    hitButton.addEventListener("click", () => {
        if (gameInProgress) {
            playerHand.push(drawCard());
            displayHands();
            checkPlayerBust();
        } else {
            openModal("Game is not in progress. Please start a new game.");
        }
    });

    standButton.addEventListener("click", () => {
        if (gameInProgress) {
            dealerTurn();
        } else {
            openModal("Game is not in progress. Please start a new game.");
        }
    });

    restartButton.addEventListener("click", restartGame);

    closeModalButton.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });

    clearBetButton.addEventListener("click", () => {
        if (gameInProgress) {
            openModal("Cannot clear bet during a game");
            return;
        }
        if (currentBet > 0) {
            updateBalanceDisplay(currentBet, true); // Return bet to balance
            currentBet = 0;
            bettingArea.innerHTML = "Betting Area: Place Your Bets!";
            playButton.classList.add('d-none');
            updateUI();
        }
    });
}

// Card Management Functions
function createDeck() {
    const suits = ["c", "d", "h", "s"];
    const values = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13"];
    let newDeck = [];

    for (let suit of suits) {
        for (let value of values) {
            newDeck.push({ value, suit });
        }
    }

    return shuffleDeck(newDeck);
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function drawCard() {
    if (deck.length === 0) {
        deck = createDeck();
    }
    return deck.pop();
}

// Game Logic Functions
function calculateHandValue(hand) {
    let value = 0;
    let aceCount = 0;

    for (const card of hand) {
        if (card.value === '01') {
            aceCount += 1;
            value += 11;
        } else if (['11', '12', '13'].includes(card.value)) {
            value += 10;
        } else {
            value += parseInt(card.value);
        }
    }

    while (value > 21 && aceCount > 0) {
        value -= 10;
        aceCount -= 1;
    }

    return value;
}

function checkPlayerBust() {
    const playerTotal = calculateHandValue(playerHand);
    playerTotalValue.textContent = `Player hand total: ${playerTotal}`;

    if (playerTotal > 21) {
        announceWinner("dealer");
    } else if (playerTotal === 21) {
        standButton.click(); // Automatically stand if player hits 21
    }
}

function dealerTurn() {
    displayHands(true);
    let dealerTotal = calculateHandValue(dealerHand);

    while (dealerTotal < 17) {
        dealerHand.push(drawCard());
        dealerTotal = calculateHandValue(dealerHand);
        displayHands(true);
    }

    determineWinner();
}

function determineWinner() {
    const playerTotal = calculateHandValue(playerHand);
    const dealerTotal = calculateHandValue(dealerHand);

    let winner;
    if (dealerTotal > 21) {
        winner = "player";
    } else if (playerTotal > dealerTotal) {
        winner = "player";
    } else if (playerTotal < dealerTotal) {
        winner = "dealer";
    } else {
        winner = "push";
    }

    announceWinner(winner);
}

// UI Update Functions
function updateUI() {
    if (gameInProgress) {
        clearBetButton.classList.add('d-none');
        toggleButtonVisibility(['play-button', 'restart-button'], 'add');
        toggleButtonVisibility(['hit-button', 'stand-button'], 'remove');
        toggleButtonVisibility(['toggle-stats-button'], 'add');
    } else {
        clearBetButton.classList[currentBet > 0 ? 'remove' : 'add']('d-none');
        toggleButtonVisibility(['play-button'], currentBet > 0 ? 'remove' : 'add');
        toggleButtonVisibility(['hit-button', 'stand-button'], 'add');
        // Only show restart button after a game has been completed
        restartButton.classList.add('d-none');
        toggleButtonVisibility(['toggle-stats-button'], 'remove');
    }

    document.querySelectorAll('.chip').forEach(chip => {
        const value = chip.getAttribute('data-value') === 'all' ? totalBalance : parseInt(chip.getAttribute('data-value'));
        if (value > totalBalance) {
            chip.classList.add('disabled');
            chip.setAttribute('disabled', 'true');
            chip.setAttribute('aria-disabled', 'true');
        } else {
            chip.classList.remove('disabled');
            chip.removeAttribute('disabled');
            chip.setAttribute('aria-disabled', 'false');
        }
    });
}

function displayHands(showDealerFull = false) {
    if (showDealerFull) {
        dealerCards.innerHTML = dealerHand.map(card => `<span class="card">${getCardName(card)}</span>`).join(" ");
        dealerTotalValue.textContent = `Dealer hand total: ${calculateHandValue(dealerHand)}`;
    } else {
        if (dealerHand.length > 0) {
            dealerCards.innerHTML = `<span class="card">${getCardName(dealerHand[0])}</span>`;
            dealerCards.innerHTML += `<span class="card"><img src="./img/hidden.png" alt="Hidden card" class="card-img"></span>`;
            dealerTotalValue.textContent = `Dealer hand total: ${calculateHandValue([dealerHand[0]])}`;
        }
    }

    playerCards.innerHTML = playerHand.map(card => `<span class="card">${getCardName(card)}</span>`).join(" ");
    playerTotalValue.textContent = `Player hand total: ${calculateHandValue(playerHand)}`;

    chipsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateBalanceDisplay(amount, isAddition) {
    const balanceElement = document.getElementById("total-balance");
    // balanceElement.classList.remove('balance-update');
    // void balanceElement.offsetWidth; // Trigger reflow to restart animation

    if (isAddition) {
        totalBalance += amount;
    } else {
        totalBalance -= amount;
    }

    // balanceElement.classList.add('balance-update');
    balanceElement.textContent = `£${totalBalance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
}

function updateStatisticsDisplay() {
    profitDisplay.textContent = `Total Profit: £${totalProfit.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
    balanceDisplay.textContent = `£${totalBalance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
    document.getElementById("total-wins").textContent = `Games won: ${totalWins}`;
    document.getElementById("total-losses").textContent = `Total Losses: £${totalLosses.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
    document.getElementById("total-bets").textContent = `Total Bets Placed: £${totalBets.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
}

// Event Handler Functions
function handleChipClick() {
    if (gameInProgress) {
        openModal("Cannot place bets during a game");
        return;
    }

    let betValue;
    if (this.getAttribute('data-value') === 'all') {
        betValue = totalBalance;
    } else {
        betValue = parseInt(this.getAttribute('data-value')) || 0;
    }

    if (!canPlaceBet(betValue)) return;

    // Ensure placeBet is called only once
    if (currentBet + betValue <= totalBalance) {
        placeBet(betValue);
        updateUI();
    }
}

// When a bet is placed
function placeBet(value) {
    currentBet += value;
    updateBalance(userIndex, -value); // Deduct bet from balance
    currentUserProfile.totalBets += value;
    saveUserProfile();
    
    console.log(`Before Bet - Balance: £${totalBalance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`);
    console.log(`Bet Placed: £${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`);
    
    updateBalanceDisplay(value, false);
    totalBets += value;
    
    updateStatisticsDisplay();
    updateUserProfile();
    
    bettingArea.innerHTML = `Current Bet: £${currentBet.toLocaleString('en-GB', { 
        minimumFractionDigits: 2 
    })}`;
    
    playButton.classList.remove('d-none');
    restartButton.classList.add('d-none'); // Ensure restart stays hidden after placing bet
    document.querySelector('.navbar').classList.add('navbar-hidden'); // Hide navbar when betting
}

// User Profile Management
function loadUserProfile() {
    let userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
    let userIndex = parseInt(localStorage.getItem("currentUserIndex"));

    if (isNaN(userIndex) || userIndex < 0 || userIndex >= userProfiles.length) {
        userIndex = 0;
        localStorage.setItem("currentUserIndex", userIndex);
    }

    // Initialize default profile if no profiles exist
    if (userProfiles.length === 0) {
        const defaultProfile = {
            totalProfit: "0.00",
            totalBalance: "1000.00", // Starting balance
            totalWins: 0,
            totalLosses: "0.00",
            totalBets: "0.00"
        };
        userProfiles.push(defaultProfile);
        localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
    }

    const currentUserProfile = userProfiles[userIndex];
    totalProfit = parseFloat(currentUserProfile.totalProfit) || 0;

    totalBalance = parseFloat(currentUserProfile.totalBalance);
    if (isNaN(totalBalance)) {
        totalBalance = 0;
    }
}

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
        updateStatisticsDisplay();
    } else {
        console.error("Invalid user index. Cannot update user profile.");
    }
}

// Modal Management
function openModal(message) {
    modalMessage.textContent = message;
    modal.style.display = "flex";
    
    if (message === "You have run out of balance! Please restart the game.") {
        modal.classList.add("out-of-balance");
    } else {
        modal.classList.remove("out-of-balance");
    }
}

// Scroll Management
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop) {
        navbar.style.top = '-76px';
    } else {
        navbar.style.top = '0';
    }
    lastScrollTop = scrollTop;
});

function dealInitialCards() {
    if (currentBet === 0) {
        openModal("Please place a bet before playing!");
        return;
    }

    dealerHand = [];
    playerHand = [];
    dealerHiddenCard = null;

    bettingArea.classList.add('d-none');
    chipsSection.classList.add('d-none');
    document.querySelector('.chips-wrapper').classList.add('d-none');

    gameContainer.classList.add('game-started');

    playerHand.push(drawCard());
    playerHand.push(drawCard());
    dealerHand.push(drawCard());
    dealerHiddenCard = drawCard();
    dealerHand.push(dealerHiddenCard);

    displayHands();

    if (calculateHandValue(playerHand) === 21) {
        resultDisplay.textContent = "Blackjack! You Win!";
        totalWins += 1;
        totalProfit += currentBet * 1.5; // Blackjack pays 1.5 times the bet
        updateBalanceDisplay(currentBet * 2.5, true); // Add winnings to balance
        updateStatisticsDisplay();
        updateUserProfile();
        gameInProgress = false;
        currentBet = 0;

        // Hide all other buttons
        playButton.classList.add('d-none');
        hitButton.classList.add('d-none');
        standButton.classList.add('d-none');
        clearBetButton.classList.add('d-none');
        document.getElementById('toggle-stats-button').classList.add('d-none');

        // Show restart button
        restartButton.classList.remove('d-none');
        return;
    }

    hitButton.classList.remove('d-none');
    standButton.classList.remove('d-none');

    playButton.classList.add('d-none');
    restartButton.classList.add('d-none');

    document.getElementById('toggle-stats-button').classList.add('d-none');

    gameInProgress = true;
    clearBetButton.classList.add('d-none'); // Hide when game starts
    document.querySelector('.navbar').classList.add('navbar-hidden'); // Hide navbar during game
}

function getCardName(card) {
    const suitMap = {
        "c": "Clubs",
        "d": "Diamonds",
        "h": "Hearts",
        "s": "Spades"
    };
    const valueMap = {
        "01": "Ace",
        "11": "Jack",
        "12": "Queen",
        "13": "King"
    };
    const value = valueMap[card.value] || card.value;
    const suit = suitMap[card.suit];
    const imagePath = `img/${card.suit}${card.value}.png`;
    return `<span class="card"><img src="${imagePath}" alt="${value} of ${suit}" class="card-img"></span>`;
}

// When the player wins
function announceWinner(winner) {
    if (winner === 'player') {
        const winAmount = currentBet * 2;
        currentUserProfile.totalBalance += winAmount;
        currentUserProfile.totalProfit += (winAmount - currentBet);
        updateBalance(userIndex, winAmount); // Add winnings
        updateProfit(userIndex, winAmount - currentBet); // Update profit
    } else if (winner === 'dealer') {
        currentUserProfile.totalProfit -= currentBet;
        updateProfit(userIndex, -currentBet); // Update profit
    } else {
        currentUserProfile.totalBalance += currentBet; // Return bet
        updateBalance(userIndex, currentBet);
    }
    saveUserProfile();
    
    if (winner === 'player') {
        resultDisplay.textContent = "You Win!";
        totalWins += 1;
        totalProfit += currentBet;
        updateBalanceDisplay(currentBet * 2, true); // Add winnings to balance
        console.log(`Result: Player Wins`);
    } else if (winner === 'dealer') {
        resultDisplay.textContent = "Dealer Wins!";
        totalLosses += currentBet;
        totalProfit -= currentBet;
        console.log(`Result: Dealer Wins`);
    } else {
        resultDisplay.textContent = "It's a Tie!";
        updateBalanceDisplay(currentBet, true); // Return the bet to the player
        console.log(`Result: It's a Tie`);
    }

    console.log(`After Game - Balance: £${totalBalance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`);

    currentBet = 0;
    updateStatisticsDisplay();
    updateUserProfile();
    gameInProgress = false;

    playButton.classList.add('d-none');
    hitButton.classList.add('d-none');
    standButton.classList.add('d-none');
    restartButton.classList.remove('d-none');
    document.getElementById('toggle-stats-button').classList.add('d-none');
    clearBetButton.classList.add('d-none'); // Hide after game ends
}

function restartGame() {
    if (gameInProgress) {
        openModal("Game is in progress. Please finish the current game first.");
        return;
    }

    resetGameState();
    clearCardDisplay();
    updateStatisticsDisplay();

    // Reset betting area text
    bettingArea.innerHTML = "Betting Area: Place Your Bets!";
    
    // Only show betting area and chips section
    chipsSection.classList.remove('d-none');
    bettingArea.classList.remove('d-none');
    document.querySelector('.chips-wrapper').classList.remove('d-none');

    // Hide ALL game control buttons including clear bet
    playButton.classList.add('d-none');
    hitButton.classList.add('d-none');
    standButton.classList.add('d-none');
    restartButton.classList.add('d-none');
    clearBetButton.classList.add('d-none');

    gameContainer.classList.remove('game-started');
    document.querySelector('.navbar').classList.remove('navbar-hidden'); // Show navbar on restart
}

function resetGameState() {
    dealerHand = [];
    playerHand = [];
    dealerHiddenCard = null;
    deck = createDeck();
    resultDisplay.textContent = "";
    gameInProgress = false;
}

function clearCardDisplay() {
    dealerCards.innerHTML = "";
    dealerTotalValue.textContent = "Dealer hand total: ?";
    playerCards.innerHTML = "";
    playerTotalValue.textContent = "Player hand total: ?";
}

// Import userProfile functions
/* Assuming you're using ES6 modules, otherwise include <script src="userProfile.js"></script> in your HTML */

// Retrieve current user profile
let currentUserProfile;

currentUserProfile = getCurrentUserProfile();

// After determining the game outcome (win/lose)
function handleGameOutcome(result, amount) {
    let currentUserProfile = getCurrentUserProfile();
    
    if (result === 'win') {
        currentUserProfile.currentBalance += amount;
        currentUserProfile.totalProfit += amount;
        currentUserProfile.totalWins += 1;
    } else if (result === 'lose') {
        currentUserProfile.currentBalance -= amount;
        currentUserProfile.totalLosses += amount;
    }

    currentUserProfile.totalBets += amount;
    saveUserProfile();

    // Update the display if necessary
    updateUserStats(); // Ensure this function is available or emit an event to update the display
}

let userProfiles = JSON.parse(localStorage.getItem('userProfiles')) || [];
let userIndex = parseInt(localStorage.getItem('currentUserIndex'), 10);
currentUserProfile = userProfiles[userIndex];

function updateBalance(amount) {
    if (!currentUserProfile) return;
    currentUserProfile.currentBalance += amount;
    currentUserProfile.totalProfit += amount;
    saveUserProfile(currentUserProfile);
    updateUserStatsDisplay(); // Rename if necessary
}

function saveUserProfile() {
    userProfiles[userIndex] = currentUserProfile;
    localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
}

function updateUserStatsDisplay() {
    // Update the DOM elements related to user stats
    totalProfitDisplay.textContent = `£${currentUserProfile.totalProfit.toFixed(2)}`;
    totalLostDisplay.textContent = `£${currentUserProfile.totalLosses.toFixed(2)}`;
    totalBetDisplay.textContent = `£${currentUserProfile.totalBets.toFixed(2)}`;
    // Ensure 'highestCrash' is defined or remove if not applicable
    // highestCrashDisplay.textContent = `${currentUserProfile.highestCrash.toFixed(2)}x`;
}

// Example: On win

// Example: On loss

function getCurrentUserProfile() {
    // Implement logic to retrieve the current user profile
    const profiles = JSON.parse(localStorage.getItem('userProfiles')) || [];
    const index = parseInt(localStorage.getItem('currentUserIndex'), 10);
    if (!isNaN(index) && index >= 0 && index < profiles.length) {
        return profiles[index];
    }
    return {};
}

function canPlaceBet(value) {
    if (isNaN(value) || value <= 0) {
        openModal("Invalid bet amount");
        return false;
    }
    if (value > totalBalance) {
        openModal("Insufficient balance");
        return false;
    }
    return true;
}

