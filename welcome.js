document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu');

    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenu.classList.toggle('open'); // Animates the hamburger icon
        });
    }

    // Sound Toggle Button
    const soundToggleButton = document.getElementById('sound-toggle');
    const soundIcon = document.getElementById('sound-icon'); // Icon element
    const audioElement = document.getElementById('background-music'); // Audio element

    if (!audioElement) {
        console.error("Audio element not found. Make sure the audio element exists in the DOM.");
        return;
    }

    // Start the audio in muted state
    audioElement.muted = true;
    let isMuted = true; // Tracks if the sound is muted

    // Add event listener to toggle sound
    soundToggleButton.addEventListener('click', () => {
        if (isMuted) {
            // Unmute the audio and update icon
            audioElement.muted = false;
            soundIcon.classList.replace('fa-volume-mute', 'fa-volume-up');
        } else {
            // Mute the audio and update icon
            audioElement.muted = true;
            soundIcon.classList.replace('fa-volume-up', 'fa-volume-mute');
        }

        isMuted = !isMuted; // Toggle the mute state
    });
});


    // DOM Elements for User Stats
    const usernameDisplay = document.getElementById('username');
    const totalBetsDisplay = document.getElementById('total-bets');
    const totalWinsDisplay = document.getElementById('total-wins');
    const totalLossesDisplay = document.getElementById('total-losses');
    const totalBalanceDisplay = document.getElementById('total-balance');
    const totalProfitDisplay = document.getElementById('total-profit');

    // Spin the Wheel Elements
    const spinButton = document.getElementById('spin-button');
    const wheelCanvas = document.getElementById('wheelCanvas');
    const ctx = wheelCanvas.getContext('2d');

    // Reward Modal Elements
    const rewardModal = document.getElementById('reward-modal');
    const rewardMessage = document.getElementById('reward-message');
    const closeRewardModalButton = document.getElementById('close-reward-modal');
    const rewardOkButton = document.getElementById('reward-ok-button');

    // Logout Modal Elements
    const logoutButton = document.getElementById('logout-button');
    const logoutModal = document.getElementById('logout-modal');
    const closeLogoutModalButton = document.getElementById('close-logout-modal');
    const cancelLogoutButton = document.getElementById('cancel-logout-button');
    const confirmLogoutButton = document.getElementById('confirm-logout-button');

    // Game Buttons
    const blackjackGameButton = document.getElementById('blackjack-game');
    const rocketCrashGameButton = document.getElementById('rocket-crash-game');

    // Carousel Pagination Elements
    const carousel = document.querySelector('.carousel');
    const pagination = document.getElementById('carousel-pagination');
    const gameCards = document.querySelectorAll('.game-card');

    // Audio Elements
    const winSound = new Audio('sounds/win-sound.mp3');
    const loseSound = new Audio('sounds/lose-sound.mp3');

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
    currentUserProfile.totalBalance = parseFloat(currentUserProfile.totalBalance) || 500;
    currentUserProfile.totalBets = parseFloat(currentUserProfile.totalBets) || 0;
    currentUserProfile.totalWins = parseInt(currentUserProfile.totalWins, 10) || 0;
    currentUserProfile.username = currentUserProfile.username || `User ${userIndex + 1}`; // Assign default username if not set

    saveUserProfile(); // Save any initialized properties

    // Update User Stats in DOM
    updateUserStats();

    // Spin Limitation Setup
    const currentDate = new Date().toLocaleDateString();
    let spinData = JSON.parse(localStorage.getItem('spinData')) || {};

    if (!spinData[currentUserProfile.username] || spinData[currentUserProfile.username].date !== currentDate) {
        spinData[currentUserProfile.username] = { count: 0, date: currentDate };
        localStorage.setItem('spinData', JSON.stringify(spinData));
    }

    updateSpinButton();

    // Wheel Setup
    const segments = ["£1000", "£0", "£0", "£20", "£50", "£100", "£0", "£10", "£0", "£30", "£0", "£50", "£20", "£0", "£10", "£0"];
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FF33A8", "#33FFF3", "#F3FF33", "#FF8C33", "#FFA500", "#00CED1", "#9400D3", "#FFD700", "#7B68EE", "#48D1CC", "#FF4500", "#8A2BE2"];
    const numSegments = segments.length;
    const anglePerSegment = (2 * Math.PI) / numSegments;
    let currentAngle = 0;
    let isSpinning = false;

    function drawWheel() {
        ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);
        const centerX = wheelCanvas.width / 2;
        const centerY = wheelCanvas.height / 2;
        const outerRadius = Math.min(centerX, centerY) - 10;

        for (let i = 0; i < numSegments; i++) {
            const startAngle = currentAngle + i * anglePerSegment;
            const endAngle = startAngle + anglePerSegment;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle, false);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + anglePerSegment / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "#000000";
            ctx.font = 'bold 14px Arial';
            ctx.fillText(segments[i], outerRadius - 10, 0);
            ctx.restore();
        }

        // Draw the pointer
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY - (outerRadius + 20));
        ctx.lineTo(centerX + 10, centerY - (outerRadius + 20));
        ctx.lineTo(centerX, centerY - (outerRadius - 10));
        ctx.closePath();
        ctx.fill();
    }

    function spinWheel() {
        if (isSpinning || spinData[currentUserProfile.username].count >= 3) {
            alert('You have no spins left for today.');
            return;
        }
    
        isSpinning = true;
        spinData[currentUserProfile.username].count += 1;
        localStorage.setItem('spinData', JSON.stringify(spinData));
        updateSpinButton();
    
        const spinAngleStart = Math.random() * 5 + 5; // Slower initial spin
        let spinTime = 0;
        const spinTimeTotal = Math.random() * 5000 + 6000; // Longer spin time
    
        function rotateWheel() {
            spinTime += 20; // Slower updates for smoother spin
            if (spinTime >= spinTimeTotal) {
                stopRotateWheel();
                return;
            }
            const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
            currentAngle += (spinAngle * Math.PI / 180);
            currentAngle %= (2 * Math.PI);
            drawWheel();
            requestAnimationFrame(rotateWheel);
        }
    
        rotateWheel();
    }
    
    function easeOut(t, b, c, d) {
        t /= d;
        t--;
        return c * (t * t * t * t + 1) + b; // Smoother deceleration
    }    

    function stopRotateWheel() {
        isSpinning = false;
        const degrees = currentAngle * 180 / Math.PI + 90;
        const arcd = anglePerSegment * 180 / Math.PI;
        const index = Math.floor((360 - (degrees % 360)) / arcd) % numSegments;

        const rewardText = segments[index];
        const rewardAmount = parseInt(rewardText.replace('£', '')) || 0;

        if (rewardAmount > 0) {
            currentUserProfile.totalBalance += rewardAmount;
            currentUserProfile.totalProfit += rewardAmount;
            winSound.play();
            rewardMessage.textContent = `Congratulations! You have won £${rewardAmount}!`;
        } else {
            // Optionally, track losses if applicable
            // currentUserProfile.totalLosses += 0; // No loss as user didn't lose anything
            loseSound.play();
            rewardMessage.textContent = "Better luck next time!";
        }

        saveUserProfile();
        updateUserStats();

        rewardModal.style.display = 'flex';
    }

    function easeOut(t, b, c, d) {
        t /= d;
        t--;
        return c * (t * t * t + 1) + b;
    }

    function updateSpinButton() {
        const spinsLeft = 3 - spinData[currentUserProfile.username].count;
        spinButton.disabled = spinsLeft <= 0;
        spinButton.textContent = spinsLeft <= 0 ? "No Spins Left Today" : `Spin the Wheel (${spinsLeft} spins left)`;
    }

    // Utility Functions
    function updateUserStats() {
        usernameDisplay.textContent = currentUserProfile.username;
        totalBetsDisplay.textContent = `£${currentUserProfile.totalBets.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
        totalWinsDisplay.textContent = `${currentUserProfile.totalWins}`;
        totalLossesDisplay.textContent = `£${currentUserProfile.totalLosses.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
        totalBalanceDisplay.textContent = `£${currentUserProfile.totalBalance.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
        totalProfitDisplay.textContent = `£${currentUserProfile.totalProfit.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
    }

    function saveUserProfile() {
        userProfiles[userIndex] = currentUserProfile;
        localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
    }

    // Initial Wheel Draw
    drawWheel();

    // Event Listeners for Spin Wheel
    spinButton.addEventListener('click', spinWheel);
    closeRewardModalButton.addEventListener('click', () => {
        rewardModal.style.display = 'none';
    });
    rewardOkButton.addEventListener('click', () => {
        rewardModal.style.display = 'none';
    });

    // Handle Logout
    logoutButton.addEventListener('click', () => {
        logoutModal.style.display = 'flex';
    });

    closeLogoutModalButton.addEventListener('click', () => {
        logoutModal.style.display = 'none';
    });

    cancelLogoutButton.addEventListener('click', () => {
        logoutModal.style.display = 'none';
    });

    confirmLogoutButton.addEventListener('click', () => {
        // Remove user data
        localStorage.removeItem('userProfiles');
        localStorage.removeItem('currentUserIndex');
        localStorage.removeItem('spinData');
        // Redirect to login page
        window.location.href = 'user-auth.html';
    });

    // Handle Game Buttons
    blackjackGameButton.addEventListener('click', () => {
        window.location.href = 'blackjack.html';
    });

    rocketCrashGameButton.addEventListener('click', () => {
        window.location.href = 'rocket-crash.html';
    });

    // Add Pagination Dots
    gameCards.forEach((card, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active'); // Set first dot as active
        pagination.appendChild(dot);
    });

    const dots = document.querySelectorAll('.carousel-pagination .dot');

    // Function to Update Active Dot Based on Scroll Position
    function updateActiveDot() {
        const carouselScrollLeft = carousel.scrollLeft;
        const carouselWidth = carousel.clientWidth;
        const cardWidth = gameCards[0].clientWidth + parseInt(getComputedStyle(gameCards[0]).marginRight);
        const index = Math.round(carouselScrollLeft / (cardWidth));

        dots.forEach(dot => dot.classList.remove('active'));
        if (dots[index]) dots[index].classList.add('active');
    }

    // Event Listener for Carousel Scroll
    carousel.addEventListener('scroll', debounce(updateActiveDot, 100));

    // Debounce Function to Optimize Scroll Event Handling
    function debounce(func, delay) {
        let timeout;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // Click Event for Dots to Navigate to Specific Slide
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            carousel.scrollTo({
                left: index * (gameCards[0].clientWidth + 20), // 20px is the gap
                behavior: 'smooth'
            });
        });
    });

    // Highlight Active Game Card Based on Scroll
    function highlightActiveCard() {
        const activeIndex = Math.round(carousel.scrollLeft / (gameCards[0].clientWidth + 20));

        gameCards.forEach((card, index) => {
            if (index === activeIndex) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });

        // Update Pagination Dots
        dots.forEach(dot => dot.classList.remove('active'));
        if (dots[activeIndex]) dots[activeIndex].classList.add('active');
    }

    // Event Listener for Carousel Scroll to Highlight Active Card
    carousel.addEventListener('scroll', debounce(highlightActiveCard, 100));

    // Keyboard Navigation (Optional)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            carousel.scrollBy({ left: carousel.clientWidth + 20, behavior: 'smooth' });
        } else if (e.key === 'ArrowLeft') {
            carousel.scrollBy({ left: -(carousel.clientWidth + 20), behavior: 'smooth' });
        }
    });

    // Initial Highlight
    highlightActiveCard();

    // Listen for changes in localStorage to update stats in real-time
    window.addEventListener('storage', (event) => {
        if (event.key === 'userProfiles' || event.key === 'currentUserIndex') {
            // Reload user profile
            userProfiles = JSON.parse(localStorage.getItem('userProfiles')) || [];
            userIndex = parseInt(localStorage.getItem('currentUserIndex'), 10);

            if (isNaN(userIndex) || userIndex < 0 || userIndex >= userProfiles.length) {
                alert('Invalid user. Please log in again.');
                window.location.href = 'user-auth.html'; // Redirect to login page
                return;
            }

            currentUserProfile = userProfiles[userIndex];

            // Initialize Missing Properties
            currentUserProfile.totalProfit = parseFloat(currentUserProfile.totalProfit) || 0;
            currentUserProfile.totalLosses = parseFloat(currentUserProfile.totalLosses) || 0;
            currentUserProfile.totalBalance = parseFloat(currentUserProfile.totalBalance) || 500;
            currentUserProfile.totalBets = parseFloat(currentUserProfile.totalBets) || 0;
            currentUserProfile.totalWins = parseInt(currentUserProfile.totalWins, 10) || 0;
            currentUserProfile.username = currentUserProfile.username || `User ${userIndex + 1}`;

            saveUserProfile();
            updateUserStats();
            updateSpinButton();
            drawWheel();
        }
    });
