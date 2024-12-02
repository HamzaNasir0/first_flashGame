// Rocket Crash Game Variables
let profit = 0;
let totalBalance = 0;
let multiplier = 0.0; // Start multiplier from 0
let isPlaying = false;
let crashMultiplier;
let multiplierInterval;
let betAmount = 0;
let pastCrashes = []; // Array to store past crash points
let isWatchingOnly = false; // Flag to track "watch only" mode

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
const balanceDisplay = document.getElementById("total-balance");

// Function to format money
function formatMoney(amount) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
}

// Load user profile from localStorage
let userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
let currentUserIndex = localStorage.getItem("currentUserIndex");
let currentUserProfile = userProfiles[currentUserIndex];

if (currentUserProfile) {
    // Parse the values to make sure they are numbers
    profit = parseFloat(currentUserProfile.totalProfit) || 0;
    totalBalance = parseFloat(currentUserProfile.totalBalance) || 0;
    updateProfitDisplay();
    updateBalanceDisplay();
} else {
    profit = 0; // If no user profile is found, initialize profit to 0
    totalBalance = 0; // If no user profile is found, initialize balance to 0
    updateProfitDisplay();
    updateBalanceDisplay();
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
            fill: true, // Enable the fill beneath the line
            backgroundColor: 'rgba(255, 215, 0, 0.3)' // Gold color with transparency for the filled area
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
            }
        }
    }
});

// Place Bet Button Event Listener
placeBetButton.addEventListener("click", () => {
    if (isPlaying) return;

    betAmount = parseFloat(betAmountInput.value);
    if (isNaN(betAmount) || betAmount <= 0) {
        alert("Please enter a valid bet amount!");
        return;
    }

    if (betAmount > totalBalance) {
        alert("You cannot bet more than your current balance!");
        return;
    }

    // Deduct bet amount from balance
    totalBalance -= betAmount;
    updateBalanceDisplay();
    saveUserData(); // Save the new balance

    crashPointDisplay.textContent = ""; // Clear the previous crash point
    isWatchingOnly = false; // Reset watch-only mode
    startGame();
});

// Watch Only Button Event Listener
watchOnlyButton.addEventListener("click", () => {
    if (isPlaying) return;

    betAmount = 0; // No bet when watching
    crashPointDisplay.textContent = ""; // Clear the previous crash point
    isWatchingOnly = true; // Set to watch-only mode
    startGame();
});

// Start Game Function
function startGame() {
    isPlaying = true;
    multiplier = 0.0; // Start from 0
    crashMultiplier = generateCrashMultiplier(); // Generate a balanced crash multiplier
    cashOutButton.disabled = isWatchingOnly; // Cash out button only enabled if betting
    placeBetButton.disabled = true;
    skipToCrashButton.disabled = !isWatchingOnly; // Enable skip button if watch-only mode
    watchOnlyButton.disabled = true;
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
    let scaledValue = Math.pow(randomValue, 5) * 50; // Increased exponent and adjusted scaling
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

    let winnings = (betAmount * multiplier).toFixed(2);
    totalBalance += parseFloat(winnings);
    profit += parseFloat(winnings) - betAmount; // Profit is winnings minus bet amount
    currentUserProfile.totalProfit = profit;
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
    balanceDisplay.textContent = `Total Balance: ${formatMoney(totalBalance)}`;
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
    currentUserProfile.totalBalance = totalBalance;
    currentUserProfile.totalProfit = profit;
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
