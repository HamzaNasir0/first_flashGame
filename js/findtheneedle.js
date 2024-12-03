document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isExpanded);
    });

    // Play and Reset Logic
    const playButton = document.querySelector('.play');
    const detailsButton = document.querySelector('.details'); // Details button
    const modalActionButton = document.querySelector('.modal-action-button'); // General action button in modal
    const cards = Array.from(document.querySelectorAll('.card')); // Convert NodeList to Array
    const gameDiv = document.querySelector('.game');
    const listDiv = document.querySelector('.list'); // Reference to the list container
    const guessesCount = document.getElementById('guesses-count');
    const modal = document.getElementById('game-modal');
    const modalMessage = document.getElementById('modal-message');
    const closeButton = document.querySelector('.close-button');
    const balanceDisplay = document.getElementById('balance-display'); // Balance display element
    const detailsModal = document.getElementById('details-modal');
    const closeDetailsButton = document.querySelector('.close-details-button');
    const gameCost = 100; // Cost of the game
    const initialGuesses = 8; // Initial number of guesses
    let guessesLeft = initialGuesses;
    let canGuess = false; // Flag to control guessing
    let stage = 0; // Stage of the game

    // User Profile Variables
    let userProfiles = JSON.parse(localStorage.getItem('userProfiles')) || [];
    let userIndex = parseInt(localStorage.getItem('currentUserIndex'), 10);

    // Validate User Index
    if (isNaN(userIndex) || userIndex < 0 || userIndex >= userProfiles.length) {
        alert('Invalid user. Please log in again.');
        window.location.href = 'user-auth.html'; // Redirect to login page
    }

    let currentUserProfile = userProfiles[userIndex];

    // Initialize Missing Properties
    currentUserProfile.totalProfit = parseFloat(currentUserProfile.totalProfit) || 0;
    currentUserProfile.totalLosses = parseFloat(currentUserProfile.totalLosses) || 0;
    currentUserProfile.totalBalance = parseFloat(currentUserProfile.totalBalance) || 0;
    currentUserProfile.totalBets = parseFloat(currentUserProfile.totalBets) || 0;
    currentUserProfile.totalWins = parseInt(currentUserProfile.totalWins, 10) || 0;
    currentUserProfile.username = currentUserProfile.username || `User ${userIndex + 1}`; // Assign default username if not set

    saveUserProfile(); // Save any initialized properties

    // Update User Stats in DOM
    updateUserStats();

    // Shuffle function
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function showModal(message, actionText) {
        modalMessage.textContent = message;
        modalActionButton.textContent = actionText;
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    function resetGame() {
        guessesLeft = initialGuesses;
        guessesCount.textContent = guessesLeft;
        canGuess = false; // Disable guessing
        stage = 0; // Reset stage
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.remove(`ani${index}`, 'flipped', 'visible', 'wrong'); // Remove animation, flipped, visible, and wrong classes
                listDiv.appendChild(card); // Move cards back to the list
            }, index * 150);
        });
    }

    function updateUserStats() {
        balanceDisplay.textContent = `Balance: £${currentUserProfile.totalBalance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
    }

    function saveUserProfile() {
        userProfiles[userIndex] = currentUserProfile;
        localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
    }

    closeButton.addEventListener('click', closeModal);
    modalActionButton.addEventListener('click', () => {
        closeModal();
        if (guessesLeft === 0) {
            resetGame(); // Reset the game if no guesses left
        } else {
            // Move to the next stage
            stage++;
        }
    });

    detailsButton.addEventListener('click', () => {
        detailsModal.style.display = 'block';
    });

    closeDetailsButton.addEventListener('click', () => {
        detailsModal.style.display = 'none';
    });

    playButton.addEventListener('click', () => {
        if (currentUserProfile.totalBalance < gameCost) {
            alert('Insufficient balance to play the game.');
            return;
        }

        currentUserProfile.totalBalance -= gameCost;
        currentUserProfile.totalBets += gameCost;
        saveUserProfile();
        updateUserStats();

        const shuffledCards = shuffle(cards); // Shuffle the cards
        canGuess = false; // Disable guessing until cards are in place
        shuffledCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add(`ani${index}`, 'visible'); // Add animation and visible classes
                gameDiv.appendChild(card); // Move cards to the game div
                if (index === shuffledCards.length - 1) {
                    setTimeout(() => {
                        canGuess = true; // Enable guessing after all cards are in place
                    }, 150); // Delay to ensure the last card animation completes
                }
            }, index * 150);
        });
    });

    cards.forEach(card => {
        card.addEventListener('click', () => {
            if (canGuess && guessesLeft > 0 && !card.classList.contains('flipped')) {
                card.classList.add('flipped'); // Add flipped class to reveal the card
                if (card.dataset.card === 'joker') {
                    const winAmount = gameCost * (0.5 + stage); // Calculate win amount based on stage
                    currentUserProfile.totalWins += 1;
                    currentUserProfile.totalBalance += winAmount;
                    saveUserProfile();
                    updateUserStats();
                    showModal(`You found the Joker! You win £${winAmount}!`, 'Carry On');
                } else {
                    card.classList.add('wrong'); // Add wrong class to show the cross image
                    guessesLeft--;
                    guessesCount.textContent = guessesLeft;
                    if (guessesLeft === 0) {
                        showModal('No more guesses left!', 'Reset');
                    }
                }
            }
        });
    });

    // Ensure the modal is hidden by default
    modal.style.display = 'none';
    detailsModal.style.display = 'none';
});
