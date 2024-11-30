// Variables for the game
let dealerHand = [];
let playerHand = [];
let profit = 0; // Tracks the total profit (net gains/losses)
let totalBalance = 0; // Tracks the current balance for placing bets
let currentBet = 0; // Track the current bet for this round
let dealerHiddenCard; // Store the hidden dealer card
let wins = 0;
let losses = 0;
let totalBets = 0;
let gameInProgress = false; // New flag to track if a game is in progress

// Elements
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

// Load win and lose sounds
const winSound = new Audio('sounds/win-sound.wav');
const loseSound = new Audio('sounds/lose-sound.mp3');

// Deck initialization
let deck = [];

// Load profit, wins, losses, and totalBets from localStorage on page load
document.addEventListener("DOMContentLoaded", () => {
    const userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
    const userIndex = localStorage.getItem("currentUserIndex");

    if (userIndex !== null && userIndex >= 0 && userIndex < userProfiles.length) {
        const currentUserProfile = userProfiles[userIndex];
        profit = parseFloat(currentUserProfile.totalProfit) || 0;
        totalBalance = parseFloat(currentUserProfile.totalBalance) || 0;
        wins = parseInt(currentUserProfile.totalWins) || 0;
        losses = parseFloat(currentUserProfile.totalLosses) || 0;
        totalBets = parseFloat(currentUserProfile.totalBets) || 0;
    }

    updateStatisticsDisplay();
    startGame();
});

// Function to show a modal with a message
function openModal(message) {
    modalMessage.textContent = message;
    modal.style.display = "flex";
}

// Close modal functionality
closeModalButton.addEventListener("click", () => {
    modal.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
});

// Initialize the game
function startGame() {
    deck = createDeck();
    dealerHand = [];
    playerHand = [];
    dealerHiddenCard = null;
    resultDisplay.textContent = "";
    enableButtons(false); // Disable Hit and Stand buttons at the start
    currentBet = 0; // Reset the current bet at the beginning of each round
    bettingArea.innerHTML = `Betting Area: Place Your Bets!`;
    gameInProgress = false; // Game is only in progress once bet is placed and cards are dealt

    // Clear the card display at the start of the game
    clearCardDisplay();

    // Display betting area and hide play, hit, stand buttons initially
    playButton.style.display = "none";
    hitButton.style.display = "none";
    standButton.style.display = "none";
    restartButton.style.display = "block";
    chipsSection.style.display = "block";
}

// Function to create a deck of cards
function createDeck() {
    const suits = ["c", "d", "h", "s"]; // Clubs, Diamonds, Hearts, Spades
    const values = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13"];
    let deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ value, suit });
        }
    }
    return deck;
}

// Function to draw a card from the deck
function drawCard() {
    const cardIndex = Math.floor(Math.random() * deck.length);
    const card = deck[cardIndex];
    deck.splice(cardIndex, 1);
    return card;
}

// Deal initial cards after clicking "Play"
function dealInitialCards() {
    playerHand.push(drawCard());
    playerHand.push(drawCard());
    dealerHand.push(drawCard());
    dealerHiddenCard = drawCard(); // Second card for the dealer, kept hidden
    dealerHand.push(dealerHiddenCard);

    displayHands();
    enableButtons(true); // Enable Hit and Stand buttons now that cards are dealt
    gameInProgress = true; // Game is now in progress

    // Hide betting area and play button once game starts
    playButton.style.display = "none";
    chipsSection.style.display = "none";
    restartButton.style.display = "none";

    // Show hit and stand buttons
    hitButton.style.display = "block";
    standButton.style.display = "block";
}

// Calculate hand value
function calculateHandValue(hand) {
    let value = 0;
    let aceCount = 0;
    for (let card of hand) {
        let cardValue = parseInt(card.value);
        if (cardValue >= 11) {
            value += 10; // J, Q, K are worth 10
        } else if (cardValue === 1) {
            aceCount += 1;
            value += 11; // Temporarily add 11 for Aces
        } else {
            value += cardValue; // Number cards (2-10)
        }
    }
    while (value > 21 && aceCount > 0) {
        value -= 10;
        aceCount -= 1;
    }
    return value;
}

// Display hands and their values using card images
function displayHands(showDealerFull = false) {
    dealerCards.style.display = "block";
    playerCards.style.display = "block";

    // Display dealer's hand
    if (showDealerFull) {
        dealerCards.innerHTML = dealerHand.map(card => `<img class="card" src="img/${card.suit}${card.value}.png" alt="${card.value} of ${card.suit}">`).join(" ");
        dealerTotalValue.textContent = `Dealer's Total: ${calculateHandValue(dealerHand)}`;
    } else {
        if (dealerHand.length > 0) {
            dealerCards.innerHTML = `<img class="card" src="img/${dealerHand[0].suit}${dealerHand[0].value}.png" alt="${dealerHand[0].value} of ${dealerHand[0].suit}">`;
            dealerCards.innerHTML += `<img class="card" src="img/hidden.png" alt="Hidden Card">`;
            dealerTotalValue.textContent = `Dealer's Total: ?`;
        }
    }

    playerCards.innerHTML = playerHand.map(card => `<img class="card" src="img/${card.suit}${card.value}.png" alt="${card.value} of ${card.suit}">`).join(" ");
    playerTotalValue.textContent = `Your Total: ${calculateHandValue(playerHand)}`;
}

// Function to clear card display
function clearCardDisplay() {
    dealerCards.innerHTML = ""; // Remove dealer cards
    playerCards.innerHTML = ""; // Remove player cards
    dealerTotalValue.textContent = "Dealer's Total: ?";
    playerTotalValue.textContent = "Your Total: ?";
}

// Hit functionality
hitButton.addEventListener("click", function () {
    if (gameInProgress) {
        playerHand.push(drawCard());
        displayHands();

        if (calculateHandValue(playerHand) > 21) {
            announceWinner("dealer");
            losses += currentBet;
            updateBalance(-currentBet);
            updateStatisticsDisplay();
            updateUserProfile();
            disableButtons();
            restartButton.style.display = "block";
            hitButton.style.display = "none";
            standButton.style.display = "none";
            gameInProgress = false;
        }
    }
});

// Stand functionality
standButton.addEventListener("click", function () {
    if (gameInProgress) {
        let dealerValue = calculateHandValue(dealerHand);
        let playerValue = calculateHandValue(playerHand);

        displayHands(true);

        while (dealerValue < 17) {
            dealerHand.push(drawCard());
            dealerValue = calculateHandValue(dealerHand);
            displayHands(true);
        }

        if (dealerValue > 21 || playerValue > dealerValue) {
            announceWinner("player");
            wins += 1;
            updateBalance(currentBet * 2);
        } else if (dealerValue > playerValue) {
            announceWinner("dealer");
            losses += currentBet;
            updateBalance(-currentBet);
        } else {
            announceWinner("tie");
            updateBalance(currentBet);
        }

        updateStatisticsDisplay();
        updateUserProfile();
        disableButtons();

        // Hide Hit and Stand buttons and show Restart button
        hitButton.style.display = "none";
        standButton.style.display = "none";
        restartButton.style.display = "block";

        gameInProgress = false;
    }
});

// Restart button functionality
restartButton.addEventListener("click", function () {
    startGame();
});

// Announce winner and play sound effects
function announceWinner(winner) {
    let profitChange = 0; // Track profit changes based on the outcome

    if (winner === "player") {
        resultDisplay.style.color = "lightgreen";
        resultDisplay.textContent = "You win!";
        winSound.play();

        profitChange = currentBet; // Profit is equal to the bet amount on a win
        wins += 1;
        updateBalance(currentBet * 2); // Player gets their bet back plus winnings

    } else if (winner === "dealer") {
        resultDisplay.style.color = "red";
        if (calculateHandValue(playerHand) > 21) {
            resultDisplay.textContent = "You bust! Dealer wins.";
        } else {
            resultDisplay.textContent = "Dealer wins!";
        }
        loseSound.play();

        profitChange = -currentBet; // Player loses their bet
        losses += currentBet;
        updateBalance(-currentBet); // Deduct the bet from the balance

    } else {
        resultDisplay.style.color = "yellow";
        resultDisplay.textContent = "It's a tie!";
        profitChange = 0; // No profit change in case of a tie
        updateBalance(currentBet); // Player gets their bet back
    }

    // Update profit
    profit += profitChange;

    // Update statistics and display
    updateStatisticsDisplay();
    updateUserProfile();
    disableButtons();

    // Show restart button
    restartButton.style.display = "block";

    gameInProgress = false; // Game ends after this
}

// Update profit and balance
function updateBalance(amount) {
    totalBalance += amount;
    totalBalance = Math.max(0, parseFloat(totalBalance.toFixed(2))); // Prevent negative balance

    // Update statistics and user profile
    updateStatisticsDisplay();
    updateUserProfile();
}

// Update statistics display
function updateStatisticsDisplay() {
    profitDisplay.textContent = `Total Profit: £${profit.toFixed(2)}`;
    balanceDisplay.textContent = `Total Balance: £${totalBalance.toFixed(2)}`;
    document.getElementById("total-wins").textContent = `Total Wins: ${wins}`;
    document.getElementById("total-losses").textContent = `Total Losses: £${losses.toFixed(2)}`;
    document.getElementById("total-bets").textContent = `Total Bets Placed: £${totalBets.toFixed(2)}`;
}

// Enable/Disable buttons
function disableButtons() {
    hitButton.disabled = true;
    standButton.disabled = true;
}

function enableButtons(enableHitStand = false) {
    hitButton.disabled = !enableHitStand;
    standButton.disabled = !enableHitStand;
}

// Betting area functionality
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const betValue = chip.getAttribute('data-value') === 'all' ? totalBalance : parseInt(chip.getAttribute('data-value'));

        if (betValue > totalBalance) {
            openModal("You don't have enough balance to place this bet.");
            return;
        }

        currentBet += betValue;
        totalBalance -= betValue;

        bettingArea.innerHTML = `Betting Area: £${currentBet}`;
        updateStatisticsDisplay();

        playButton.style.display = "block"; // Show play button once bet is placed
    });
});

// Play button functionality
playButton.addEventListener("click", function () {
    if (currentBet === 0) {
        openModal("Please place a bet before playing!");
        return;
    }
    dealInitialCards(); // Start dealing cards
    playButton.style.display = "none"; // Hide play button once the game starts
});

// Update the user's profile statistics in localStorage
function updateUserProfile() {
    const userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
    const userIndex = localStorage.getItem("currentUserIndex");

    if (userIndex !== null && userIndex >= 0 && userIndex < userProfiles.length) {
        userProfiles[userIndex].totalProfit = profit.toFixed(2);
        userProfiles[userIndex].totalBalance = totalBalance.toFixed(2);
        userProfiles[userIndex].totalWins = wins;
        userProfiles[userIndex].totalLosses = losses.toFixed(2);
        userProfiles[userIndex].totalBets = totalBets.toFixed(2);

        localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
    }
}
