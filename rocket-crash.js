// Rocket Crash Game Variables
let profit = 0;
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

// Load user profile from localStorage
let userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
let currentUserIndex = localStorage.getItem("currentUserIndex");
let currentUserProfile = userProfiles[currentUserIndex];

if (currentUserProfile) {
    // Parse the value to make sure it's a number
    profit = parseFloat(currentUserProfile.totalProfit) || 0; 
    updateProfitDisplay();
} else {
    profit = 0; // If no user profile is found, initialize profit to 0
    updateProfitDisplay();
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
    console.log("Start game function called"); // Debug log
    isPlaying = true;
    multiplier = 0.0; // Start from 0
    crashMultiplier = generateCrashMultiplier(); // Generate a balanced crash multiplier
    console.log("Crash multiplier generated:", crashMultiplier);
    cashOutButton.disabled = isWatchingOnly; // Cash out button only enabled if betting
    placeBetButton.disabled = true;
    skipToCrashButton.disabled = !isWatchingOnly; // Enable skip button if watch-only mode
    watchOnlyButton.disabled = true;
    resultDisplay.textContent = "";

    // Check if the rocket crashes instantly
    if (crashMultiplier <= 0.1) {
        console.log("Rocket crashed instantly at:", crashMultiplier);
        endGame(true); // Trigger an instant crash
        return;
    }

    // Reset Chart Data
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.update();

    let time = 0;

    // Set Interval for a slower increase
    multiplierInterval = setInterval(() => {
        multiplier += 0.1; // Increase the multiplier by 0.1 each time
        console.log("Current multiplier:", multiplier);
        updateMultiplierDisplay();

        // Update Chart Data
        time += 0.1; // Increment time for x-axis
        chart.data.labels.push(time.toFixed(1));
        chart.data.datasets[0].data.push(multiplier.toFixed(2));
        chart.update();

        // Check if rocket crashes
        if (multiplier >= crashMultiplier) {
            console.log("Rocket crashed at multiplier:", multiplier);
            endGame(false); // End the game with a regular crash
        }
    }, 300); // Increase interval duration to make growth smoother (every 300ms)
}

// Function to Generate Balanced Crash Multiplier
function generateCrashMultiplier() {
    let randomValue = Math.random();
    let scaledValue = Math.pow(randomValue, 3) * 500; // Use exponential scaling to favor lower numbers
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
    profit += parseFloat(winnings);
    currentUserProfile.totalProfit = profit;

    resultDisplay.style.color = "lightgreen";
    resultDisplay.textContent = `You cashed out at x${multiplier.toFixed(2)} and won £${winnings}!`;
    updateProfitDisplay();

    // Update Stats
    updateUserStats(betAmount, parseFloat(winnings));
    saveUserData();
    crashPointDisplay.textContent = `The rocket would have crashed at x${crashMultiplier.toFixed(2)}.`;
    updatePastCrashes(crashMultiplier);
});

// Skip to Crash Button Event Listener
skipToCrashButton.addEventListener("click", () => {
    if (!isPlaying || betAmount > 0) return; // Only skip if no bet is placed

    clearInterval(multiplierInterval);
    endGame(false); // Directly call endGame with a regular crash
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
        updateUserStats(betAmount, 0); // Update with loss
        saveUserData();
    }
    
    updatePastCrashes(crashMultiplier);
}

// Update Multiplier Display Function
function updateMultiplierDisplay() {
    console.log("Updating multiplier display:", multiplier.toFixed(2));
    multiplierDisplay.textContent = `${multiplier.toFixed(2)}x`;
}

// Update Profit Display Function
function updateProfitDisplay() {
    // Ensure profit is a number before calling toFixed()
    if (typeof profit === "number" && !isNaN(profit)) {
        profitDisplay.textContent = `Total Profit: £${profit.toFixed(2)}`;
    } else {
        profitDisplay.textContent = `Total Profit: £0.00`;
    }
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

    // If the user lost money, increment the loss count
    if (win === 0) {
        currentUserProfile.totalLosses = (currentUserProfile.totalLosses || 0) + bet;
    }
}

// Function to Save User Data
function saveUserData() {
    userProfiles[currentUserIndex] = currentUserProfile;
    localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
}

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
