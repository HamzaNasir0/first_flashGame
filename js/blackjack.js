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
const winSound = new Audio('sounds/win-sound.mp3');
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