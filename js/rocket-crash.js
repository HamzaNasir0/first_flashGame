document.addEventListener('DOMContentLoaded', () => {
    // Rocket Crash Game Variables
    let multiplier = 1.0; // Start multiplier from 1
    let isPlaying = false;
    let crashMultiplier;
    let multiplierInterval;
    let pastCrashes = []; // Array to store past crash points
    let totalProfit = 0;
    let totalLost = 0;
    let totalBet = 0;
    let highestCrash = 0;

    // Retrieve user profiles and current user index
    const userProfiles = JSON.parse(localStorage.getItem('userProfiles')) || [];
    const userIndex = parseInt(localStorage.getItem('currentUserIndex'), 10);

    // Validate user index
    if (isNaN(userIndex) || userIndex < 0 || userIndex >= userProfiles.length) {
        showModal('Invalid user. Please log in again.');
        window.location.href = 'user-auth.html'; // Redirect to login page
        return;
    }

    // Get current user profile
    let currentUserProfile = userProfiles[userIndex];

    const betInput = document.getElementById('bet-amount');
    const bet100Button = document.getElementById('bet-100-button');
    const bet1000Button = document.getElementById('bet-1000-button');
    const placeBetButton = document.getElementById('place-bet-button');
    const cashOutButton = document.getElementById('cash-out-button');
    const watchOnlyButton = document.getElementById('watch-only-button');
    const balanceDisplay = document.getElementById('current-balance');

    const multiplierDisplay = document.getElementById("multiplier");
    const pastCrashList = document.getElementById("past-crash-list");
    const graphCanvas = document.getElementById("multiplier-graph");
    const returnButton = document.getElementById('return-button');

    const gameStatsButton = document.getElementById('game-stats-button');
    const gameStats = document.getElementById('game-stats');
    const totalProfitDisplay = document.getElementById('total-profit');
    const totalLostDisplay = document.getElementById('total-lost');
    const totalBetDisplay = document.getElementById('total-bet');
    const highestCrashDisplay = document.getElementById('highest-crash');
    const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    const messageModalBody = document.getElementById('messageModalBody');

    const navbar = document.querySelector('.navbar-glass');
    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
        if (!navbar) return; // Add null check
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop) {
            navbar.style.top = '-80px'; // Adjust based on navbar height
        } else {
            navbar.style.top = '0';
        }
        lastScrollTop = scrollTop;
    });

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
            maintainAspectRatio: false, // Ensure the chart maintains aspect ratio
            scales: {
                x: {
                    grid: {
                        color: "rgba(255, 255, 255, 0.05)"
                    },
                    ticks: {
                        color: "rgba(255, 255, 255, 0.5)",
                        stepSize: 2, // Set x-axis step size to 2
                        callback: function(value, index, values) {
                            return value % 2 === 0 ? value : ''; // Show label every 2 seconds
                        }
                    }
                },
                y: {
                    min: 1, // Ensure y-axis starts at 1
                    grid: {
                        color: "rgba(255, 255, 255, 0.05)"
                    },
                    ticks: {
                        color: "rgba(255, 255, 255, 0.5)",
                        stepSize: 0.2, // Set y-axis step size to 0.2
                        callback: function(value) {
                            return value.toFixed(1); // Format y-axis labels to one decimal place
                        }
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

    // Add new event listeners after chart initialization
    bet1000Button.addEventListener('click', () => {
        betInput.value = currentUserProfile.totalBalance;
    });

    gameStatsButton.addEventListener('click', () => {
        gameStats.classList.toggle('d-none');
        updateStatsDisplay();
    });

    function updateStatsDisplay() {
        totalProfitDisplay.textContent = `£${totalProfit.toFixed(2)}`;
        totalLostDisplay.textContent = `£${totalLost.toFixed(2)}`;
        totalBetDisplay.textContent = `£${totalBet.toFixed(2)}`;
        highestCrashDisplay.textContent = `${highestCrash.toFixed(2)}x`;
    }

    // Update watchOnlyButton event listener to handle both watch-only and skip-to-crash functionality
    watchOnlyButton.addEventListener('click', () => {
        if (isPlaying) {
            clearInterval(multiplierInterval);
            multiplier = crashMultiplier;
            updateMultiplierDisplay();
            endGame(false, true);
        } else {
            hideAllControls();
            watchOnlyButton.textContent = 'Skip to Crash';
            watchOnlyButton.classList.remove('secondary');
            watchOnlyButton.classList.add('primary');
            watchOnlyButton.style.display = 'block';
            returnButton.classList.remove('d-none');
            returnButton.disabled = true; // Disable the return button when the rocket is in play
            gameStatsButton.style.display = 'none';
            startGame(true); // Pass true to indicate watch-only mode
        }
    });

    // Add event listener for returnButton
    returnButton.addEventListener('click', () => {
        showAllControls();
        returnButton.classList.add('d-none');
        gameStatsButton.style.display = 'block';
    });

    function hideAllControls() {
        betInput.style.display = 'none';
        bet100Button.style.display = 'none';
        bet1000Button.style.display = 'none';
        placeBetButton.style.display = 'none';
        watchOnlyButton.style.display = 'none';
        gameStatsButton.style.display = 'none';
        if (navbar) navbar.style.top = '-80px'; // Add null check
    }

    function showAllControls() {
        betInput.style.display = 'block';
        bet100Button.style.display = 'block';
        bet1000Button.style.display = 'block';
        placeBetButton.style.display = 'block';
        watchOnlyButton.style.display = 'block';
        watchOnlyButton.textContent = 'Watch Only';
        watchOnlyButton.classList.remove('primary');
        watchOnlyButton.classList.add('secondary');
        cashOutButton.classList.add('d-none');
        gameStatsButton.style.display = 'block';
        returnButton.disabled = false; // Enable the return button when the rocket is not in play
        if (navbar) navbar.style.top = '0'; // Add null check
    }

    // Update place bet listener
    placeBetButton.addEventListener('click', () => {
        const betAmount = parseFloat(betInput.value);
        if (!betAmount || betAmount <= 0 || betAmount > currentUserProfile.totalBalance) {
            showModal('Invalid bet amount');
            return;
        }
        currentUserProfile.totalBalance -= betAmount;
        totalBet += betAmount;
        updateBalance();
        hideAllControls();
        cashOutButton.classList.remove('d-none');
        gameStats.classList.add('d-none'); // Hide game stats when the game starts
        startGame(false); // Pass false to indicate betting mode
    });

    // Update cash out listener to calculate and pass the current profit
    cashOutButton.addEventListener('click', () => {
        const betAmount = parseFloat(betInput.value);
        const winnings = betAmount * multiplier;
        currentUserProfile.totalBalance += winnings;
        const currentProfit = winnings - betAmount;
        totalProfit += currentProfit;
        updateBalance();
        endGame(true, false, currentProfit); // Pass true for cashedOut, false for isWatchOnly, and currentProfit
        showAllControls();
    });

    // Start Game Function
    function startGame(isWatchOnly) {
        isPlaying = true;
        multiplier = 1.0; // Initialize multiplier to 1
        crashMultiplier = parseFloat(generateCrashMultiplier().toFixed(2)); // Generate and round crash multiplier

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
            if (time % 2 === 0) {
                chart.data.labels.push(time.toFixed(0)); // Add label every 2 seconds
            } else {
                chart.data.labels.push(''); // Add empty label for other intervals
            }
            chart.data.datasets[0].data.push(multiplier.toFixed(2));
            chart.update();

            // Check if rocket crashes
            if (multiplier >= crashMultiplier) {
                endGame(false, isWatchOnly); // End the game with a regular crash
            }
        }, 300); // Increase interval duration to make growth smoother (every 300ms)
    }

    // Function to Generate Balanced Crash Multiplier
    function generateCrashMultiplier() {
        let randomValue = Math.random();
        let scaledValue = 1 + Math.pow(randomValue, 5) * 49; // Ensure scaledValue is between 1 and 50
        return scaledValue;
    }

    // End Game Function
    function endGame(cashedOut, isWatchOnly, profit = 0) {
        clearInterval(multiplierInterval);
        isPlaying = false;

        const betAmount = parseFloat(betInput.value);
        
        // Clear bet input
        betInput.value = '';

        if (!cashedOut) {
            totalLost += betAmount; // Track money lost only if not cashed out
            // Update user profile with loss
            currentUserProfile.totalLosses = (currentUserProfile.totalLosses || 0) + betAmount;
        } else {
            // Update user profile with profit
            currentUserProfile.totalProfits = (currentUserProfile.totalProfits || 0) + profit;
        }

        // Update total games played
        currentUserProfile.totalGames = (currentUserProfile.totalGames || 0) + 1;

        // Save updated profile to localStorage
        userProfiles[userIndex] = currentUserProfile;
        localStorage.setItem('userProfiles', JSON.stringify(userProfiles));

        // Rest of existing endGame code...
        if (cashedOut) {
            multiplierDisplay.style.color = "green";
            multiplierDisplay.innerHTML = `You cashed out at x${multiplier.toFixed(2)}!<br>Profit Made: £${profit.toFixed(2)}`;
        } else if (multiplier <= 1.0) { // Handle crash at x1.00
            multiplierDisplay.style.color = "red";
            multiplierDisplay.textContent = `The rocket crashed instantly at x${crashMultiplier.toFixed(2)}!`;
        } else { // Handle regular crash
            multiplierDisplay.style.color = "red";
            multiplierDisplay.textContent = `The rocket crashed at x${multiplier.toFixed(2)}!`;
        }

        if (multiplier > highestCrash) {
            highestCrash = multiplier;
        }

        updatePastCrashes(crashMultiplier);
        if (!isWatchOnly) {
            showAllControls();
        } else {
            watchOnlyButton.style.display = 'block';
            watchOnlyButton.textContent = 'Watch Only';
            watchOnlyButton.classList.remove('primary');
            watchOnlyButton.classList.add('secondary');
            returnButton.disabled = false; // Enable the return button when the game ends
        }
    }

    // Update Multiplier Display Function
    function updateMultiplierDisplay() {
        multiplierDisplay.textContent = `${multiplier.toFixed(2)}x`;
    }

    // Update Past Crashes Function
    function updatePastCrashes(crashMultiplier) {
        pastCrashes.unshift(crashMultiplier);
        if (pastCrashes.length > 5) { // Keep only the last 5 crashes
            pastCrashes.pop();
        }
        pastCrashList.innerHTML = pastCrashes.map((crash, index) => {
            const crashValue = `x${crash.toFixed(2)}`;
            let crashClass = 'highlight-blue'; // Default to blue
            if (crash >= 10) {
                crashClass = 'highlight-green';
            } else if (crash < 2) {
                crashClass = 'highlight-red';
            }
            const separator = index < pastCrashes.length - 1 ? ' - ' : ''; // Add missing ':' and false condition
            return `<span class="${crashClass}">${crashValue}</span>${separator}`;
        }).join("");
    }

    // Add new function to update balance display
    function updateBalance() {
        // Ensure totalBalance is a number before formatting
        currentUserProfile.totalBalance = parseFloat(currentUserProfile.totalBalance) || 0;
        balanceDisplay.innerHTML = `Current Balance: <span class="money">£${currentUserProfile.totalBalance.toFixed(2)}</span>`;
        userProfiles[userIndex].totalBalance = currentUserProfile.totalBalance;
        localStorage.setItem('userProfiles', JSON.stringify(userProfiles)); // Save balance to local storage
    }

    // Function to show modal with a message
    function showModal(message) {
        messageModalBody.textContent = message;
        messageModal.show();
    }

    // Initial balance update
    updateBalance();

    // Update bet input event listener near the start of the file
    betInput.addEventListener('input', function() {
        // Remove non-numeric characters except decimal point
        this.value = this.value.replace(/[^\d.]/g, '');
        
        // Ensure only one decimal point
        if ((this.value.match(/\./g) || []).length > 1) {
            this.value = this.value.slice(0, -1);
        }
        
        // Limit to 2 decimal places
        if (this.value.includes('.')) {
            let parts = this.value.split('.');
            if (parts[1].length > 2) {
                this.value = parseFloat(this.value).toFixed(2);
            }
        }
        
        // Ensure value doesn't exceed balance
        if (parseFloat(this.value) > currentUserProfile.totalBalance) {
            this.value = currentUserProfile.totalBalance;
        }
    });

    // Keep this version near the end of the file
    bet100Button.addEventListener('click', () => {
        const currentValue = parseFloat(betInput.value) || 0;
        const newAmount = Math.min(currentUserProfile.totalBalance, currentValue + 100);
        betInput.value = newAmount.toFixed(2);
    });

    // ...existing code handling game logic...

    // ...existing code...

    // In the updateUserProfile function, ensure numerical values are stored as numbers
    function updateUserProfile() {
        userProfiles[userIndex].totalProfit = parseFloat(totalProfit.toFixed(2));
        userProfiles[userIndex].totalBalance = parseFloat(totalBalance.toFixed(2));
        userProfiles[userIndex].totalWins = totalWins;
        userProfiles[userIndex].totalLosses = parseFloat(totalLost.toFixed(2));
        userProfiles[userIndex].totalBets = parseFloat(totalBet.toFixed(2));

        localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
        updateUserStatsDisplay();
    }

    // After placing a bet
    function placeBet(amount) {
        currentUserProfile.totalBalance -= amount;
        currentUserProfile.totalBets += amount;
        updateBalance(userIndex, -amount); // Deduct bet
        updateUserProfile();
    }

    // After winning
    function handleWin(amount) {
        currentUserProfile.totalBalance += amount;
        currentUserProfile.totalProfit += (amount - currentBet);
        updateBalance(userIndex, amount); // Add winnings
        updateProfit(userIndex, amount - currentBet); // Update profit
        updateUserProfile();
    }

    // After losing
    function handleLoss(amount) {
        currentUserProfile.totalProfit -= amount;
        updateProfit(userIndex, -amount); // Update profit
        updateUserProfile();
    }

});