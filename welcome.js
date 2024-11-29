document.addEventListener("DOMContentLoaded", () => {
    const usernameDisplay = document.getElementById("username");
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

    // Load and display user's statistics
    document.getElementById("total-bets").textContent = currentUserProfile.totalBets || 0;
    document.getElementById("total-wins").textContent = currentUserProfile.totalWins || 0;
    document.getElementById("total-losses").textContent = currentUserProfile.totalLosses || 0;
    document.getElementById("total-profit").textContent = currentUserProfile.totalProfit || 0;

    // Handle Game Selection
    document.getElementById("blackjack-game").addEventListener("click", () => {
        window.location.href = `blackjack.html?userIndex=${userIndex}`; // Updated to blackjack.html
    });

    document.getElementById("poker-game").addEventListener("click", () => {
        window.location.href = `poker.html?userIndex=${userIndex}`;
    });

    document.getElementById("slots-game").addEventListener("click", () => {
        window.location.href = `slots.html?userIndex=${userIndex}`;
    });

    document.getElementById("rocket-crash-game").addEventListener("click", () => {
        window.location.href = `rocket-crash.html?userIndex=${userIndex}`;
    });

    // Logout button event listener
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("currentUserIndex"); // Remove current user from LocalStorage
        alert("Logged out successfully.");
        window.location.href = "user-auth.html"; // Redirect to login page
    });
});
