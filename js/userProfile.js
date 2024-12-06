// Shared User Profile Functions

function getCurrentUserProfile() {
    let userProfiles = JSON.parse(localStorage.getItem('userProfiles')) || [];
    let userIndex = parseInt(localStorage.getItem('currentUserIndex'), 10);
    if (isNaN(userIndex) || userIndex < 0 || userIndex >= userProfiles.length) {
        console.error('Invalid user index.');
        return null;
    }
    return userProfiles[userIndex];
}

function saveUserProfile(currentUserProfile) {
    let userProfiles = JSON.parse(localStorage.getItem('userProfiles')) || [];
    let userIndex = parseInt(localStorage.getItem('currentUserIndex'), 10);
    if (isNaN(userIndex) || userIndex < 0 || userIndex >= userProfiles.length) {
        console.error('Invalid user index.');
        return;
    }
    userProfiles[userIndex] = currentUserProfile;
    localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
}

// Add functions to update balance and profit
function updateBalance(amount) {
    let userProfiles = JSON.parse(localStorage.getItem('userProfiles')) || [];
    let userIndex = parseInt(localStorage.getItem('currentUserIndex'), 10);
    
    if (userIndex >= 0 && userIndex < userProfiles.length) {
        let profile = userProfiles[userIndex];
        profile.currentBalance = Number(profile.currentBalance || 0) + amount;
        
        // Update related stats
        if (amount > 0) {
            profile.totalWins = Number(profile.totalWins || 0) + 1;
            profile.totalProfit = Math.max(0, (Number(profile.totalProfit || 0) + amount));
        } else {
            profile.totalLosses = Number(profile.totalLosses || 0) + Math.abs(amount);
        }
        
        localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
        triggerProfileUpdate();
        return profile;
    }
    return null;
}

function triggerProfileUpdate() {
    const event = new CustomEvent('userProfileUpdated', {
        detail: getCurrentUserProfile()
    });
    window.dispatchEvent(event);
}

// Add this new function for wheel rewards
function processWheelReward(amount) {
    if (!amount || isNaN(amount)) return null;
    return updateBalance(amount);
}

function updateProfit(userIndex, amount) {
    // amount can be positive (profit) or negative (loss)
    let userProfiles = JSON.parse(localStorage.getItem('userProfiles')) || [];
    if (userIndex >= 0 && userIndex < userProfiles.length) {
        userProfiles[userIndex].totalProfit += amount;
        localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
    }
}

function updateUserStats() {
    // This function can trigger an event or directly update the UI
    // depending on your implementation in welcome.js
    const event = new Event('userProfileUpdated');
    window.dispatchEvent(event);
}

// Example usage:
// updateBalance(userIndex, -betAmount); // To deduct a bet
// updateBalance(userIndex, winAmount);  // To add winnings
// updateProfit(userIndex, profitAmount); // To update total profit