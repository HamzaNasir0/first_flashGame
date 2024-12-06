document.addEventListener('DOMContentLoaded', () => {
    // Update game elements
    const playButton = document.querySelector('.btn-primary.play');
    const nextStageButton = document.querySelector('.btn-success.next-stage');
    const cashOutButton = document.querySelector('.btn-warning.cash-out');
    const gameMessage = document.querySelector('.game-message');
    const cards = Array.from(document.querySelectorAll('.card'));
    const gameDiv = document.querySelector('.game');
    const listDiv = document.querySelector('.list');
    const balanceDisplay = document.getElementById('balance-display');
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;
    
    // Enhanced Game settings
    const gameCost = 100;
    const initialGuesses = 8;
    const stageMultipliers = [0.25, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5];
    let currentStage = 0;  // Starting at stage 1 (index 0)
    let guessesLeft = initialGuesses;
    let canGuess = false;
    let totalWinnings = 0;
    let jokerBonus = 0;

    // User Profile Management
    let userProfiles = JSON.parse(localStorage.getItem('userProfiles')) || [];
    let userIndex = parseInt(localStorage.getItem('currentUserIndex'), 10);

    // Validate User Index
    if (isNaN(userIndex) || userIndex < 0 || userIndex >= userProfiles.length) {
        alert('Invalid user. Please log in again.');
        window.location.href = 'user-auth.html';
        return;
    }

    let currentUserProfile = userProfiles[userIndex];

    // Initialize user properties
    currentUserProfile = {
        ...currentUserProfile,
        totalProfit: parseFloat(currentUserProfile.totalProfit) || 0,
        totalLosses: parseFloat(currentUserProfile.totalLosses) || 0,
        totalBalance: parseFloat(currentUserProfile.totalBalance) || 0,
        totalBets: parseFloat(currentUserProfile.totalBets) || 0,
        totalWins: parseInt(currentUserProfile.totalWins, 10) || 0,
        username: currentUserProfile.username || `User ${userIndex + 1}`
    };

    // Helper Functions
    const shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const playAgainButton = document.createElement('button');
    playAgainButton.classList.add('btn', 'btn-primary', 'play-again');
    playAgainButton.textContent = 'Play Again';
    playAgainButton.style.display = 'none';
    document.querySelector('.btn-container').appendChild(playAgainButton);

    const showGameMessage = (message, showNextStage = false, showCashOut = false, showPlayAgain = false) => {
        gameMessage.textContent = message;
        nextStageButton.style.display = showNextStage ? 'block' : 'none';
        cashOutButton.style.display = showCashOut ? 'block' : 'none';
        playAgainButton.style.display = showPlayAgain ? 'block' : 'none';
        playButton.style.display = 'none';
    };

    const updateUserStats = () => {
        balanceDisplay.innerHTML = `<span class="stat-label">Current Balance:</span> <span class="balance-amount">£${currentUserProfile.totalBalance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>`;
    };

    const saveUserProfile = () => {
        userProfiles[userIndex] = currentUserProfile;
        localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
    };

    const updateGameStats = () => {
        const currentMultiplier = stageMultipliers[currentStage];
        const potentialWin = gameCost * currentMultiplier;
        balanceDisplay.innerHTML = 
            `<span class="stat-label">Stage:</span> <span class="stage-num">${currentStage + 1}</span> | ` +
            `<span class="stat-label">Guesses:</span> <span class="guesses">${guessesLeft}</span> | ` +
            `<span class="stat-label">Multiplier:</span> <span class="multiplier">${currentMultiplier}x</span> | ` +
            `<span class="stat-label">Current Pot:</span> <span class="pot">£${potentialWin.toFixed(2)}</span>`;
    };

    const resetGame = () => {
        guessesLeft = initialGuesses;
        currentStage = 0;
        totalWinnings = 0;
        jokerBonus = 0;
        canGuess = false;
        gameMessage.textContent = '';
        updateUserStats(); // Show balance at the start
        cards.forEach(card => {
            card.classList.remove('flipped', 'wrong', 'visible');
            listDiv.appendChild(card);
        });
        playButton.style.display = 'block';
        nextStageButton.style.display = 'none';
        cashOutButton.style.display = 'none';
        playAgainButton.style.display = 'none';
        navbar.classList.remove('navbar-hidden');
    };

    const reshuffleCards = () => {
        const shuffledCards = shuffle(cards);
        canGuess = false;
        // Reset all card states before reshuffling
        shuffledCards.forEach(card => {
            card.classList.remove('flipped', 'wrong', 'visible');
            listDiv.appendChild(card); // First move all cards back to the list
        });
        
        // Then start the animation sequence
        shuffledCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add(`ani${index}`, 'visible');
                gameDiv.appendChild(card);
                if (index === shuffledCards.length - 1) {
                    setTimeout(() => canGuess = true, 150);
                }
            }, index * 150);
        });
    };

    // Event Listeners
    playButton.addEventListener('click', () => {
        if (currentUserProfile.totalBalance < gameCost) {
            alert('Insufficient balance to play the game.');
            return;
        }

        currentUserProfile.totalBalance -= gameCost;
        currentUserProfile.totalBets += gameCost;
        saveUserProfile();
        updateGameStats();

        // Move all cards to gameDiv and shuffle them
        cards.forEach(card => {
            card.classList.remove('flipped', 'wrong', 'visible', 'joker');
            if (card.dataset.card === 'joker') {
                card.classList.add('joker');
            }
        });
        reshuffleCards();
        
        playButton.style.display = 'none';
        navbar.classList.add('navbar-hidden');
    });

    cards.forEach(card => {
        card.addEventListener('click', () => {
            if (canGuess && guessesLeft > 0 && !card.classList.contains('flipped')) {
                card.classList.add('flipped');
                if (card.dataset.card === 'joker') {
                    canGuess = false; // Prevent further guesses
                    // Modified jackpot logic
                    const isJackpot = currentStage === 0 && guessesLeft === initialGuesses;
                    const multiplier = isJackpot ? 1.5 : stageMultipliers[currentStage];
                    const winAmount = gameCost * multiplier;
                    currentUserProfile.totalWins += 1;
                    totalWinnings += winAmount; // Track total winnings
                    if (isJackpot) {
                        jokerBonus = winAmount;
                    }
                    saveUserProfile();
                    updateUserStats();
                    
                    const message = isJackpot
                        ? `JACKPOT! First try! You win £${winAmount}!`
                        : `You found the Joker at stage ${currentStage + 1}! You win £${winAmount}!`;
                    
                    showGameMessage(message, true, true);
                } else {
                    card.classList.add('wrong');
                    guessesLeft--;
                    updateGameStats(); // Replace guessesCount.textContent with updateGameStats
                    
                    if (guessesLeft === 0) {
                        canGuess = false; // Prevent further guesses
                        const summaryMessage = `No more guesses left! You reached stage ${currentStage + 1}.`;
                        showGameMessage(summaryMessage, false, false, true);
                    }
                }
            }
        });
    });

    // Modified next stage handler - removed guesses reset
    nextStageButton.addEventListener('click', () => {
        currentStage = Math.min(currentStage + 1, stageMultipliers.length - 1);
        gameMessage.textContent = '';
        nextStageButton.style.display = 'none';
        cashOutButton.style.display = 'none';
        updateGameStats(); // Update the display
        reshuffleCards();
    });

    cashOutButton.addEventListener('click', () => {
        currentUserProfile.totalBalance += totalWinnings; // Add total winnings to balance
        saveUserProfile();
        updateUserStats();
        
        const summaryMessage = jokerBonus > 0
            ? `Congratulations! You cashed out with £${totalWinnings.toFixed(2)} including £${jokerBonus.toFixed(2)} Joker bonus! You reached stage ${currentStage + 1}.`
            : `Congratulations! You cashed out with £${totalWinnings.toFixed(2)}! You reached stage ${currentStage + 1}.`;
        showGameMessage(summaryMessage, false, false, true);
    });

    playAgainButton.addEventListener('click', () => {
        resetGame();
    });

    // Hide navbar on scroll down, show on scroll up
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop) {
            navbar.classList.add('navbar-hidden');
        } else {
            navbar.classList.remove('navbar-hidden');
        }
        lastScrollTop = scrollTop;
    });

    // Initialize game state
    updateUserStats(); // Show balance at the start
});
