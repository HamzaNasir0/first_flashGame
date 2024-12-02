// Rocket Crash Game Variables
let profit = 0;
let totalBalance = 0;
let multiplier = 1.0; // Start multiplier from 1
let isPlaying = false;
let crashMultiplier;
let multiplierInterval;
let betAmount = 0;
let pastCrashes = []; // Array to store past crash points
let isWatchingOnly = false; // Flag to track "watch only" mode
let highestCashOutMultiplier = 0; // Variable to track the highest cash out multiplier
let highestCashOutBet = 0; // Variable to track the highest cash out bet amount
let highestCashOutProfit = 0; // Variable to track the highest cash out profit

const multiplierDisplay = document.getElementById("multiplier");
const resultDisplay = document.getElementById("result");
const placeBetButton = document.getElementById("place-bet-button");
const cashOutButton = document.getElementById("cash-out-button");
const skipToCrashButton = document.getElementById("skip-to-crash-button");
const watchOnlyButton = document.getElementById("watch-only-button");
const betAmountInput = document.getElementById("bet-amount");
const profitDisplay = document.getElementById("rocket-profit");
const crashPointDisplay = document.getElementById("crash-point");
const pastCrashList = document.getElementById("past-crash-list");
const graphCanvas = document.getElementById("multiplier-graph");
const balanceDisplay = document.getElementById("current-balance");
const highestCashOutDisplay = document.getElementById("highest-cash-out");

const bet100Button = document.getElementById("bet-100-button");
const bet500Button = document.getElementById("bet-500-button");
const bet1000Button = document.getElementById("bet-1000-button");
const errorMessageDisplay = document.getElementById("error-message");
const betHalfBalanceButton = document.getElementById("bet-half-balance-button");

// Function to format money
function formatMoney(amount) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
}

// Load user profile from localStorage
let userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
let currentUserIndex = parseInt(localStorage.getItem("currentUserIndex"), 10);
console.log(`Current User Index: ${currentUserIndex}`); // Debug
let currentUserProfile = userProfiles[currentUserIndex];
console.log(`Current User Profile: ${JSON.stringify(currentUserProfile)}`); // Debug

if (currentUserProfile) {
    // Parse the values to make sure they are numbers
    profit = parseFloat(currentUserProfile.totalProfit) || 0;
    totalBalance = parseFloat(currentUserProfile.totalBalance) || 0;
    highestCashOutBet = parseFloat(currentUserProfile.highestCashOutBet) || 0;
    highestCashOutProfit = parseFloat(currentUserProfile.highestCashOutProfit) || 0;
    highestCashOutMultiplier = parseFloat(currentUserProfile.highestCashOutMultiplier) || 0;
    updateProfitDisplay();
    updateBalanceDisplay();
    updateHighestCashOutDisplay();
} else {
    console.error("No user profile found for the current index."); // Debug
    profit = 0; // If no user profile is found, initialize profit to 0
    totalBalance = 0; // If no user profile is found, initialize balance to 0
    highestCashOutBet = 0; // If no user profile is found, initialize highest cash out bet to 0
    highestCashOutProfit = 0; // If no user profile is found, initialize highest cash out profit to 0
    highestCashOutMultiplier = 0; // If no user profile is found, initialize highest cash out multiplier to 0
    updateProfitDisplay();
    updateBalanceDisplay();
    updateHighestCashOutDisplay();
}

// Initialize Chart.js for the graph
const ctx = graphCanvas.getContext("2d");
let chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Multiplier Growth',
            data: [],
            borderColor: 'rgba(255, 215, 0, 0.8)', // Gold color for the line
            borderWidth: 2,
            pointRadius: 0,
            fill: false // Disable the fill beneath the line
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: {
                    color: "rgba(255, 255, 255, 0.1)"
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: "rgba(255, 255, 255, 0.1)"
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            annotation: {
                annotations: {
                    arrow: {
                        type: 'line',
                        mode: 'vertical',
                        scaleID: 'x',
                        value: 0, // Initial value, will be updated dynamically
                        borderColor: 'red',
                        borderWidth: 2,
                        label: {
                            enabled: true,
                            content: 'Crash Point',
                            position: 'start'
                        },
                        endValue: 1, // Add end value for arrow
                        arrowHeads: {
                            end: {
                                enabled: true,
                                fill: true
                            }
                        }
                    }
                }
            }
        }
    }
});

// Function to show error message
function showError(message) {
    errorMessageDisplay.textContent = message;
    errorMessageDisplay.style.display = "block";
    setTimeout(() => {
        errorMessageDisplay.style.display = "none";
    }, 3000); // Hide after 3 seconds
}

// Place Bet Button Event Listener
placeBetButton.addEventListener("click", () => {
    if (isPlaying) return;

    if (placeBetButton.textContent === "Play Again") {
        resetGame();
        return;
    }

    console.log(`Current Balance before bet: ${totalBalance}`); // Debug

    betAmount = parseFloat(betAmountInput.value);
    if (isNaN(betAmount) || betAmount <= 0) {
        showError("Please enter a valid bet amount!");
        return;
    }

    if (betAmount > totalBalance) {
        showError("You cannot bet more than your current balance!");
        return;
    }

    // Deduct bet amount from balance
    totalBalance -= betAmount;
    updateBalanceDisplay();
    saveUserData(); // Save the new balance

    crashPointDisplay.textContent = ""; // Clear the previous crash point
    isWatchingOnly = false; // Reset watch-only mode
    startGame();

    placeBetButton.textContent = "Play Again"; // Change button text to "Play Again"
});

// Function to Reset Game
function resetGame() {
    betAmountInput.value = ''; // Clear the bet amount input field
    placeBetButton.textContent = "Place Bet"; // Reset button text to "Place Bet"
    resultDisplay.textContent = ''; // Clear result display
    crashPointDisplay.textContent = ''; // Clear crash point display
    // Re-enable all buttons
    betHalfBalanceButton.disabled = false;
    bet100Button.disabled = false;
    bet500Button.disabled = false;
    bet1000Button.disabled = false;
    placeBetButton.disabled = false;
    watchOnlyButton.disabled = false;
    skipToCrashButton.disabled = true;
    cashOutButton.disabled = true;
}

// Watch Only Button Event Listener
watchOnlyButton.addEventListener("click", () => {
    if (isPlaying) return;

    betAmount = 0; // No bet when watching
    crashPointDisplay.textContent = ""; // Clear the previous crash point
    isWatchingOnly = true; // Set to watch-only mode
    startGame();
});

// Event Listeners for Bet Buttons
bet100Button.addEventListener("click", () => {
    let newBetAmount = (parseFloat(betAmountInput.value) || 0) + 100;
    betAmountInput.value = newBetAmount > totalBalance ? totalBalance : newBetAmount;
});

bet500Button.addEventListener("click", () => {
    let newBetAmount = (parseFloat(betAmountInput.value) || 0) + 500;
    betAmountInput.value = newBetAmount > totalBalance ? totalBalance : newBetAmount;
});

bet1000Button.addEventListener("click", () => {
    let newBetAmount = (parseFloat(betAmountInput.value) || 0) + 1000;
    betAmountInput.value = newBetAmount > totalBalance ? totalBalance : newBetAmount;
});

// Event Listener for Bet Half Balance Button
betHalfBalanceButton.addEventListener("click", () => {
    betAmountInput.value = (totalBalance / 2).toFixed(2);
});

// Start Game Function
function startGame() {
    isPlaying = true;
    multiplier = 1.0; // Initialize multiplier to 1
    crashMultiplier = parseFloat(generateCrashMultiplier().toFixed(2)); // Generate and round crash multiplier
    cashOutButton.disabled = isWatchingOnly; // Cash out button only enabled if betting
    placeBetButton.disabled = true;
    skipToCrashButton.disabled = !isWatchingOnly; // Enable skip button if watch-only mode
    watchOnlyButton.disabled = true;
    betHalfBalanceButton.disabled = true; // Disable Bet Half Balance button
    bet100Button.disabled = true; // Disable Bet £100 button
    bet500Button.disabled = true; // Disable Bet £500 button
    bet1000Button.disabled = true; // Disable Bet £1000 button
    resultDisplay.textContent = "";

    // Reset Chart Data
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.update();

    let time = 0;

    // Set Interval for a slower increase
    multiplierInterval = setInterval(() => {
        multiplier += 0.05; // Slower increment to make higher multipliers harder to reach
        updateMultiplierDisplay();

        // Update Chart Data
        time += 0.1; // Increment time for x-axis
        chart.data.labels.push(time.toFixed(1));
        chart.data.datasets[0].data.push(multiplier.toFixed(2));
        chart.update();

        // Check if rocket crashes
        if (multiplier >= crashMultiplier) {
            endGame(false); // End the game with a regular crash
        }
    }, 300); // Increase interval duration to make growth smoother (every 300ms)
}

// Function to Generate Balanced Crash Multiplier
function generateCrashMultiplier() {
    let randomValue = Math.random();
    let scaledValue = 1 + Math.pow(randomValue, 5) * 49; // Ensure scaledValue is between 1 and 50
    return scaledValue;
}

// Cash Out Button Event Listener
cashOutButton.addEventListener("click", () => {
    if (!isPlaying || isWatchingOnly) return;

    clearInterval(multiplierInterval);
    isPlaying = false;
    cashOutButton.disabled = true;
    placeBetButton.disabled = false;
    watchOnlyButton.disabled = false;
    skipToCrashButton.disabled = true;
    betHalfBalanceButton.disabled = false; // Enable Bet Half Balance button
    bet100Button.disabled = false; // Enable Bet £100 button
    bet500Button.disabled = false; // Enable Bet £500 button
    bet1000Button.disabled = false; // Enable Bet £1000 button

    let winnings = parseFloat((betAmount * multiplier).toFixed(2)); // Round winnings
    console.log(`Winnings: ${winnings}`); // Debug
    totalBalance += winnings;
    console.log(`Total Balance after cash out: ${totalBalance}`); // Debug
    let profitFromBet = parseFloat((winnings - betAmount).toFixed(2)); // Round profit
    console.log(`Profit from Bet: ${profitFromBet}`); // Debug
    profit += profitFromBet; // Update total profit
    console.log(`Total Profit: ${profit}`); // Debug
    currentUserProfile.totalProfit = profit;

    // Update highest cash out if current profit from bet is greater
    if (profitFromBet > highestCashOutProfit) {
        highestCashOutBet = betAmount;
        highestCashOutProfit = profitFromBet; // Correctly set the profit made from the bet
        highestCashOutMultiplier = parseFloat(multiplier.toFixed(2)); // Round multiplier
        currentUserProfile.highestCashOutBet = highestCashOutBet;
        currentUserProfile.highestCashOutProfit = highestCashOutProfit;
        currentUserProfile.highestCashOutMultiplier = highestCashOutMultiplier;
        console.log(`New Highest Cash Out: Bet ${highestCashOutBet}, Profit ${highestCashOutProfit}, Multiplier ${highestCashOutMultiplier}`); // Debug
        updateHighestCashOutDisplay();
    }

    updateProfitDisplay();
    updateBalanceDisplay();
    saveUserData();

    resultDisplay.style.color = "lightgreen";
    resultDisplay.textContent = `You cashed out at x${multiplier.toFixed(2)} and won ${formatMoney(winnings)}!`;

    // Update Stats
    updateUserStats(betAmount, parseFloat(winnings));
    crashPointDisplay.textContent = `The rocket would have crashed at x${crashMultiplier.toFixed(2)}.`;
    updatePastCrashes(crashMultiplier);
});

// End Game Function
function endGame(instantCrash) {
    clearInterval(multiplierInterval);
    isPlaying = false;
    cashOutButton.disabled = true;
    placeBetButton.disabled = false;
    skipToCrashButton.disabled = true;
    watchOnlyButton.disabled = false;
    betHalfBalanceButton.disabled = false; // Enable Bet Half Balance button
    bet100Button.disabled = false; // Enable Bet £100 button
    bet500Button.disabled = false; // Enable Bet £500 button
    bet1000Button.disabled = false; // Enable Bet £1000 button

    betAmountInput.value = ''; // Clear the bet amount input field
    console.log("Bet amount input field cleared"); // Debug

    if (instantCrash) {
        resultDisplay.style.color = "red";
        resultDisplay.textContent = `The rocket crashed instantly at x${crashMultiplier.toFixed(2)}!`;
    } else {
        resultDisplay.style.color = "red";
        resultDisplay.textContent = `The rocket crashed at x${multiplier.toFixed(2)}!`;
    }

    if (!isWatchingOnly) {
        profit -= betAmount;
        updateProfitDisplay();
        currentUserProfile.totalProfit = profit;

        // Properly track losses
        currentUserProfile.totalLosses += betAmount; 
        console.log("Total Losses Updated: ", currentUserProfile.totalLosses); // Debug

        updateUserStats(betAmount, 0); // Update with loss
        saveUserData(); // Ensure losses are saved
    }

    updatePastCrashes(crashMultiplier);
}

// Update Multiplier Display Function
function updateMultiplierDisplay() {
    multiplierDisplay.textContent = `${multiplier.toFixed(2)}x`;
}

// Update Profit and Balance Display Functions
function updateProfitDisplay() {
    profitDisplay.textContent = `Total Profit: ${formatMoney(profit)}`;
}

function updateBalanceDisplay() {
    balanceDisplay.textContent = `Current Balance: ${formatMoney(totalBalance)}`;
}

// Update Highest Cash Out Display Function
function updateHighestCashOutDisplay() {
    highestCashOutDisplay.textContent = `Highest Cash Out: Bet ${formatMoney(highestCashOutBet)}, Profit ${formatMoney(highestCashOutProfit)}, at x${highestCashOutMultiplier.toFixed(2)}`;
}

// Update Past Crashes Function
function updatePastCrashes(crashMultiplier) {
    pastCrashes.unshift(`x${crashMultiplier.toFixed(2)}`);
    if (pastCrashes.length > 3) {
        pastCrashes.pop(); // Keep only the last 3 crashes
    }
    pastCrashList.textContent = pastCrashes.join("   ");
}

// Function to Update User Stats
function updateUserStats(bet, win) {
    currentUserProfile.totalBets = (currentUserProfile.totalBets || 0) + bet;
    currentUserProfile.totalWins = (currentUserProfile.totalWins || 0) + win;
    currentUserProfile.totalGames = (currentUserProfile.totalGames || 0) + 1;

    // Update the amount lost if the user lost money
    if (win === 0) {
        currentUserProfile.totalLosses = (currentUserProfile.totalLosses || 0) + bet; // Increment by bet amount lost
    }
}

// Function to Save User Data
function saveUserData() {
    console.log("Saving User Data..."); // Debug
    console.log(`Total Balance: ${totalBalance}`); // Debug
    console.log(`Total Profit: ${profit}`); // Debug
    console.log(`Highest Cash Out Bet: ${highestCashOutBet}`); // Debug
    console.log(`Highest Cash Out Profit: ${highestCashOutProfit}`); // Debug
    console.log(`Highest Cash Out Multiplier: ${highestCashOutMultiplier}`); // Debug

    if (!currentUserProfile) {
        console.error("Cannot save data: currentUserProfile is undefined."); // Debug
        return;
    }

    currentUserProfile.totalBalance = parseFloat(totalBalance.toFixed(2));
    currentUserProfile.totalProfit = parseFloat(profit.toFixed(2));
    currentUserProfile.highestCashOutBet = parseFloat(highestCashOutBet.toFixed(2));
    currentUserProfile.highestCashOutProfit = parseFloat(highestCashOutProfit.toFixed(2));
    currentUserProfile.highestCashOutMultiplier = parseFloat(highestCashOutMultiplier.toFixed(2));
    userProfiles[currentUserIndex] = currentUserProfile;
    localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
}

skipToCrashButton.addEventListener("click", () => {
    if (!isPlaying || !isWatchingOnly) return;

    clearInterval(multiplierInterval); // Immediately stop the multiplier growth
    multiplier = crashMultiplier;     // Set the multiplier to crash point
    updateMultiplierDisplay();        // Update the display
    endGame(false);                   // Call the endGame logic
});

document.addEventListener("DOMContentLoaded", () => {
    const navToggle = document.getElementById("mobile-menu");
    const navMenu = document.getElementById("nav-menu");

    navToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
    });

    // Close the mobile menu when a link is clicked
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("active");
        });
    });
});
