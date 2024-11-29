// Variables for the game
let dealerHand = [];
let playerHand = [];
let profit = 0;
let currentBet = 0; // Track the current bet for this round
let dealerHiddenCard; // Store the hidden dealer card
let wins = 0;
let losses = 0;
let totalBets = 0;
const profitDisplay = document.getElementById("total-profit");

// Elements
const dealerCards = document.getElementById("dealer-cards");
const dealerTotalValue = document.getElementById("dealer-total-value");
const playerCards = document.getElementById("player-cards");
const playerTotalValue = document.getElementById("player-total-value");
const resultDisplay = document.getElementById("result");
const hitButton = document.getElementById("hit-button");
const standButton = document.getElementById("stand-button");
const restartButton = document.getElementById("restart-button");

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
        wins = parseInt(currentUserProfile.totalWins) || 0;
        losses = parseInt(currentUserProfile.totalLosses) || 0;
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
    bettingArea.innerHTML = `Betting Area: Drop Your Bets Here!`;
    
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
        losses += 1;
        updateProfit(-currentBet);
        updateStatisticsDisplay();
        updateUserProfile();
        disableButtons();
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
        updateProfit(currentBet);
    } else if (dealerValue > playerValue) {
        announceWinner("dealer");
        losses += 1;
        updateProfit(-currentBet);
    } else {
        announceWinner("tie");
    }

    updateStatisticsDisplay();
    updateUserProfile();
    disableButtons();
});

// Restart functionality
restartButton.addEventListener("click", function () {
    startGame();
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

// Update profit and display it
function updateProfit(amount) {
    profit += amount;
    totalBets += Math.abs(amount);
    updateStatisticsDisplay();
    localStorage.setItem("profit", profit);
}

function updateStatisticsDisplay() {
    profitDisplay.textContent = `Total Profit: £${profit}`;
    document.getElementById("total-wins").textContent = `Total Wins: ${wins}`;
    document.getElementById("total-losses").textContent = `Total Losses: ${losses}`;
    document.getElementById("total-bets").textContent = `Total Bets Placed: £${totalBets}`;
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

// Add event listeners for each chip
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('dragstart', dragStart);
});

// Add drag and drop event listeners to the betting area
bettingArea.addEventListener('dragover', dragOver);
bettingArea.addEventListener('drop', drop);
bettingArea.addEventListener('dragleave', dragLeave);

// Drag start event for chips
function dragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.id);
    setTimeout(() => {
        event.target.style.opacity = '0.5'; // Reduce opacity while dragging
    }, 0);
}

// Drag over event for betting area
function dragOver(event) {
    event.preventDefault(); // Necessary to allow a drop
    bettingArea.classList.add('drag-over');
}

// Drop event for betting area
function drop(event) {
    event.preventDefault();
    const chipId = event.dataTransfer.getData('text');
    const chipElement = document.getElementById(chipId);
    
    // Increase the current bet amount based on the chip value
    const betValue = parseInt(chipElement.getAttribute('data-value'));
    currentBet += betValue;

    // Display updated bet amount
    bettingArea.innerHTML = `Betting Area: £${currentBet}`;
    bettingArea.classList.remove('drag-over');

    // Reset the chip's opacity after drop
    chipElement.style.opacity = '1';
}

// Drag leave event for betting area
function dragLeave(event) {
    bettingArea.classList.remove('drag-over');
}

// Update the user's profile statistics in localStorage
function updateUserProfile() {
    const userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
    const userIndex = localStorage.getItem("currentUserIndex");

    if (userIndex !== null && userIndex >= 0 && userIndex < userProfiles.length) {
        userProfiles[userIndex].totalProfit = profit.toFixed(2);
        userProfiles[userIndex].totalBets = totalBets.toFixed(2);
        userProfiles[userIndex].totalWins = wins;
        userProfiles[userIndex].totalLosses = losses;

        localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
    }
}
