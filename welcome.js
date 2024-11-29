document.addEventListener("DOMContentLoaded", () => {
    const usernameDisplay = document.getElementById("username");
    const totalBetsDisplay = document.getElementById("total-bets");
    const totalWinsDisplay = document.getElementById("total-wins");
    const totalLossesDisplay = document.getElementById("total-losses");
    const totalBalanceDisplay = document.getElementById("total-balance");
    const totalProfitDisplay = document.getElementById("total-profit");
    const logoutButton = document.getElementById("logout-button");

    // Load profiles and get current user index
    const userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];
    const userIndex = localStorage.getItem("currentUserIndex");

    // Validate the user index
    if (userIndex === null || userIndex < 0 || userIndex >= userProfiles.length) {
        alert("Invalid user. Please log in again.");
        window.location.href = "user-auth.html"; // Redirect to login page
        return;
    }

    // Get current user's profile
    const currentUserProfile = userProfiles[userIndex];
    usernameDisplay.textContent = currentUserProfile.username;

    // **Assign a Random Starting Balance if Not Already Assigned**
    if (currentUserProfile.startingBalance === undefined || currentUserProfile.startingBalance === null) {
        const startingBalances = [100, 500, 1000];
        const randomIndex = Math.floor(Math.random() * startingBalances.length);
        const randomBalance = startingBalances[randomIndex];

        currentUserProfile.startingBalance = randomBalance;
        currentUserProfile.totalBalance = parseFloat(randomBalance.toFixed(2));
        currentUserProfile.totalProfit = 0.0;
        currentUserProfile.totalBets = 0.0;
        currentUserProfile.totalWins = 0;
        currentUserProfile.totalLosses = 0.0;
        currentUserProfile.totalGames = 0;

        // Save updated profile
        userProfiles[userIndex] = currentUserProfile;
        localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
    }

    // Parse values to ensure numeric types
    currentUserProfile.totalBets = parseFloat(currentUserProfile.totalBets) || 0.0;
    currentUserProfile.totalWins = parseInt(currentUserProfile.totalWins) || 0;
    currentUserProfile.totalLosses = parseFloat(currentUserProfile.totalLosses) || 0.0;
    currentUserProfile.totalBalance = parseFloat(currentUserProfile.totalBalance) || 0.0;
    currentUserProfile.totalProfit = parseFloat(currentUserProfile.totalProfit) || 0.0;

    // Display user's statistics
    if (totalBetsDisplay) totalBetsDisplay.textContent = `${currentUserProfile.totalBets.toFixed(2)}`;
    if (totalWinsDisplay) totalWinsDisplay.textContent = currentUserProfile.totalWins;
    if (totalLossesDisplay) totalLossesDisplay.textContent = `£${currentUserProfile.totalLosses.toFixed(2)}`;
    if (totalBalanceDisplay) totalBalanceDisplay.textContent = `£${currentUserProfile.totalBalance.toFixed(2)}`;
    if (totalProfitDisplay) totalProfitDisplay.textContent = `£${currentUserProfile.totalProfit.toFixed(2)}`;

    // Logout button event listener
    logoutButton.addEventListener("click", () => {
        document.getElementById('logout-modal').style.display = 'flex';
    });

    // Handle logout confirmation modal
    document.getElementById('close-logout-modal').addEventListener('click', () => {
        document.getElementById('logout-modal').style.display = 'none';
    });

    document.getElementById('cancel-logout-button').addEventListener('click', () => {
        document.getElementById('logout-modal').style.display = 'none';
    });

    document.getElementById('confirm-logout-button').addEventListener('click', () => {
        localStorage.removeItem('userProfiles');
        localStorage.removeItem('currentUserIndex');
        window.location.href = 'user-auth.html';
    });

    // Function to validate if the user has enough balance
    function canPlaceBet(amount) {
        if (currentUserProfile.totalBalance >= amount) {
            return true;
        } else {
            openBalanceModal("You don't have enough balance to place this bet. Please top up or adjust your bet.");
            return false;
        }
    }

    // Function to open the insufficient balance modal
    function openBalanceModal(message) {
        const balanceModal = document.getElementById('balance-modal');
        const balanceModalMessage = document.getElementById('balance-modal-message');
        
        balanceModalMessage.textContent = message;
        balanceModal.style.display = 'flex';
    }

    // Close insufficient balance modal
    document.getElementById('close-balance-modal').addEventListener('click', () => {
        document.getElementById('balance-modal').style.display = 'none';
    });

    document.getElementById('balance-ok-button').addEventListener('click', () => {
        document.getElementById('balance-modal').style.display = 'none';
    });

    // Handle Game Selection
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default navigation
            const gameId = event.currentTarget.id;

            // Define the bet required to play each game (assuming a default bet of 10)
            const requiredBet = 10;

            if (canPlaceBet(requiredBet)) {
                if (gameId === 'blackjack-game') {
                    window.location.href = `blackjack.html?userIndex=${userIndex}`;
                } else if (gameId === 'rocket-crash-game') {
                    window.location.href = `rocket-crash.html?userIndex=${userIndex}`;
                }
            }
        });
    });
});
