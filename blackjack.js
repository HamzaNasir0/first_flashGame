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
const profitDisplay = document.getElementById("total-profit");
const balanceDisplay = document.getElementById("total-balance"); // Display total balance

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

// Initialize the game
function startGame() {
    deck = createDeck();
    dealerHand = [];
    playerHand = [];
    dealerHiddenCard = null;
    resultDisplay.textContent = "";
    enableButtons();
    currentBet = 0; // Reset the current bet at the beginning of each round
    bettingArea.innerHTML = `Betting Area: Place Your Bets!`;
    gameInProgress = true; // Game is now in progress
    
    // Deal cards with delay
    dealInitialCards();
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

// Deal initial cards with delay
function dealInitialCards() {
    setTimeout(() => {
        playerHand.push(drawCard());
        displayHands();
    }, 500);

    setTimeout(() => {
        dealerHand.push(drawCard());
        displayHands();
    }, 1000);

    setTimeout(() => {
        playerHand.push(drawCard());
        displayHands();
    }, 1500);

    setTimeout(() => {
        dealerHiddenCard = drawCard(); // Second card for the dealer, kept hidden
        dealerHand.push(dealerHiddenCard);
        displayHands();
    }, 2000);
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
    // Display dealer's hand
    if (showDealerFull) {
        dealerCards.innerHTML = dealerHand.map(card => `<img class="card" src="img/${card.suit}${card.value}.png" alt="${card.value} of ${card.suit}">`).join(" ");
        dealerTotalValue.textContent = `Dealer's Total: ${calculateHandValue(dealerHand)}`;
    } else {
        if (dealerHand.length > 0) {
            dealerCards.innerHTML = `<img class="card" src="img/${dealerHand[0].suit}${dealerHand[0].value}.png" alt="${dealerHand[0].value} of ${dealerHand[0].suit}">`;
            if (dealerHand.length > 1) {
                dealerCards.innerHTML += `<img class="card" src="img/hidden.png" alt="Hidden Card">`; // One card face-up, one card face-down
            }
            dealerTotalValue.textContent = `Dealer's Total: ${calculateHandValue([dealerHand[0]])}`;
        }
    }

    // Display player's hand
    playerCards.innerHTML = playerHand.map(card => `<img class="card" src="img/${card.suit}${card.value}.png" alt="${card.value} of ${card.suit}">`).join(" ");
    playerTotalValue.textContent = `Your Total: ${calculateHandValue(playerHand)}`;
}

// Function to open modal with a specific message
function openModal(message) {
    modalMessage.textContent = message;
    modal.style.display = "flex";
}

// Function to close modal
closeModalButton.addEventListener("click", () => {
    modal.style.display = "none";
});

// Close the modal when clicking outside of it
window.addEventListener("click", (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
});

// Hit functionality
hitButton.addEventListener("click", function () {
    if (currentBet === 0) {
        openModal("Please place a bet before hitting!");
        return;
    }

    playerHand.push(drawCard());
    displayHands();
    if (calculateHandValue(playerHand) > 21) {
        announceWinner("dealer");
        losses += currentBet;
        updateBalance(-currentBet);
        updateStatisticsDisplay();
        updateUserProfile();
        disableButtons();
        gameInProgress = false; // Game ends after player busts
    }
});

// Stand functionality
standButton.addEventListener("click", function () {
    if (currentBet === 0) {
        openModal("Please place a bet before standing!");
        return;
    }

    let dealerValue = calculateHandValue(dealerHand);
    let playerValue = calculateHandValue(playerHand);

    // Reveal dealer's hidden card
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
        totalBalance += currentBet; // Player gets their bet back in case of a tie
    }

    updateStatisticsDisplay();
    updateUserProfile();
    disableButtons();
    gameInProgress = false; // Game ends after player stands
});

// Restart functionality
restartButton.addEventListener("click", function () {
    // Refund the bet only if the game is still in progress
    if (gameInProgress && currentBet > 0) {
        totalBalance += currentBet; // Refund the bet
        currentBet = 0; // Reset the current bet after refund
    }

    updateStatisticsDisplay(); // Update to show the correct balance after refund (if applicable)
    startGame(); // Restart the game
});

// Announce winner and play sound effects
function announceWinner(winner) {
    if (winner === "player") {
        resultDisplay.style.color = "lightgreen";
        resultDisplay.textContent = "You win!";
        winSound.play();
    } else if (winner === "dealer") {
        resultDisplay.style.color = "red";
        resultDisplay.textContent = "Dealer wins! You lose.";
        loseSound.play();
    } else {
        resultDisplay.style.color = "yellow";
        resultDisplay.textContent = "It's a tie!";
    }
}

// Update profit and balance
function updateBalance(amount) {
    totalBalance += amount;
    if (totalBalance < 0) {
        totalBalance = 0; // Prevent balance from going below zero
    }

    if (amount > 0) {
        profit += (amount - currentBet); // Only count winnings as profit
    }
    updateStatisticsDisplay();
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

function enableButtons() {
    hitButton.disabled = false;
    standButton.disabled = false;
}

// Betting area element
const bettingArea = document.getElementById("chips");

// Replace drag and drop with tap functionality
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const betValue = parseInt(chip.getAttribute('data-value'));

        // Ensure user cannot bet more than they have
        if (currentBet + betValue > totalBalance) {
            openModal("You don't have enough balance to place this bet.");
            return;
        }

        currentBet += betValue;

        // Deduct the bet amount from total balance
        totalBalance -= betValue;

        // Ensure total balance is not negative
        if (totalBalance < 0) {
            totalBalance = 0;
        }

        // Display updated bet amount and balance
        bettingArea.innerHTML = `Betting Area: £${currentBet}`;
        updateStatisticsDisplay();
    });
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
