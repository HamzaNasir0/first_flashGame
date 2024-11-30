document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu');

    mobileMenu.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // DOM Elements
    const usernameDisplay = document.getElementById('username');
    const totalBalanceDisplay = document.getElementById('total-balance');
    const spinButton = document.getElementById('spin-button');
    const logoutButton = document.getElementById('logout-button');
    const blackjackGameButton = document.getElementById('blackjack-game');
    const rocketCrashGameButton = document.getElementById('rocket-crash-game');
    const wheelCanvas = document.getElementById('wheelCanvas');
    const ctx = wheelCanvas.getContext('2d');

    // Reward Modal Elements
    const rewardModal = document.getElementById('reward-modal');
    const rewardMessage = document.getElementById('reward-message');
    const closeRewardModalButton = document.getElementById('close-reward-modal');
    const rewardOkButton = document.getElementById('reward-ok-button');

    // Load profiles and get current user index
    const userProfiles = JSON.parse(localStorage.getItem('userProfiles')) || [];
    const userIndex = parseInt(localStorage.getItem('currentUserIndex'), 10);

    if (isNaN(userIndex) || userIndex < 0 || userIndex >= userProfiles.length) {
        alert('Invalid user. Please log in again.');
        window.location.href = 'user-auth.html';
        return;
    }

    const currentUserProfile = userProfiles[userIndex];

    // Assign a fixed starting balance of £500 if not already assigned
    if (!currentUserProfile.startingBalanceAssigned) {
        currentUserProfile.totalBalance = 500;
        currentUserProfile.startingBalanceAssigned = true;
        saveUserProfile();
    }

    currentUserProfile.totalBalance = parseFloat(currentUserProfile.totalBalance) || 0;

    usernameDisplay.textContent = currentUserProfile.username;
    totalBalanceDisplay.textContent = `£${currentUserProfile.totalBalance.toFixed(2)}`;

    // Spin Limitation Setup
    const currentDate = new Date().toLocaleDateString();
    let spinData = JSON.parse(localStorage.getItem('spinData')) || {};

    if (!spinData[currentUserProfile.username] || spinData[currentUserProfile.username].date !== currentDate) {
        spinData[currentUserProfile.username] = { count: 0, date: currentDate };
        localStorage.setItem('spinData', JSON.stringify(spinData));
    }

    updateSpinButton();

    const segments = ["£1000", "£0", "£0", "£20", "£50", "£100", "£0", "£10", "£0", "£30", "£0", "£50", "£20", "£0", "£10", "£0"];
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FF33A8", "#33FFF3", "#F3FF33", "#FF8C33", "#FFA500", "#00CED1", "#9400D3", "#FFD700", "#7B68EE", "#48D1CC", "#FF4500", "#8A2BE2"];
    const numSegments = segments.length;
    const anglePerSegment = (2 * Math.PI) / numSegments;
    let currentAngle = 0;
    let isSpinning = false;
    let spinTimeout = null;
    let spinAngleStart = 0;
    let spinTime = 0;
    let spinTimeTotal = 0;

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

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + anglePerSegment / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "#000000";
            ctx.font = 'bold 14px Arial';
            ctx.fillText(segments[i], outerRadius - 10, 0);
            ctx.restore();
        }

        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY - (outerRadius + 20));
        ctx.lineTo(centerX + 10, centerY - (outerRadius + 20));
        ctx.lineTo(centerX, centerY - (outerRadius - 10));
        ctx.closePath();
        ctx.fill();
    }

    function spin() {
        if (isSpinning || spinData[currentUserProfile.username].count >= 3) {
            alert('You have no spins left for today.');
            return;
        }

        isSpinning = true;
        spinData[currentUserProfile.username].count += 1;
        localStorage.setItem('spinData', JSON.stringify(spinData));

        updateSpinButton();

        spinAngleStart = Math.random() * 10 + 10;
        spinTime = 0;
        spinTimeTotal = Math.random() * 3000 + 4000;
        rotateWheel();
    }

    function rotateWheel() {
        spinTime += 30;
        if (spinTime >= spinTimeTotal) {
            stopRotateWheel();
            return;
        }
        const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
        currentAngle += (spinAngle * Math.PI / 180);
        currentAngle %= (2 * Math.PI);
        drawWheel();
        spinTimeout = setTimeout(rotateWheel, 30);
    }

    function stopRotateWheel() {
        clearTimeout(spinTimeout);
        isSpinning = false;
        const degrees = currentAngle * 180 / Math.PI + 90;
        const arcd = anglePerSegment * 180 / Math.PI;
        const index = Math.floor((360 - (degrees % 360)) / arcd) % numSegments;

        const rewardText = segments[index];
        const rewardAmount = parseInt(rewardText.replace('£', '')) || 0;

        currentUserProfile.totalBalance = parseFloat(currentUserProfile.totalBalance) + rewardAmount;
        totalBalanceDisplay.textContent = `£${currentUserProfile.totalBalance.toFixed(2)}`;

        saveUserProfile();

        // Update modal with reward information
        if (rewardAmount === 0) {
            rewardMessage.textContent = "Better luck next time!";
        } else {
            rewardMessage.textContent = `Congratulations! You have won ${rewardText}!`;
        }
        rewardModal.style.display = 'flex';
    }

    function easeOut(t, b, c, d) {
        t /= d;
        t--;
        return c * (t * t * t + 1) + b;
    }

    function saveUserProfile() {
        userProfiles[userIndex] = currentUserProfile;
        localStorage.setItem('userProfiles', JSON.stringify(userProfiles));
    }

    function updateSpinButton() {
        const spinsLeft = 3 - spinData[currentUserProfile.username].count;
        if (spinsLeft <= 0) {
            spinButton.disabled = true;
            spinButton.textContent = "No Spins Left Today";
        } else {
            spinButton.disabled = false;
            spinButton.textContent = `Spin the Wheel (${spinsLeft} spins left)`;
        }
    }

    drawWheel();
    updateSpinButton();

    spinButton.addEventListener('click', spin);

    closeRewardModalButton.addEventListener('click', () => {
        rewardModal.style.display = 'none';
    });

    rewardOkButton.addEventListener('click', () => {
        rewardModal.style.display = 'none';
    });

    logoutButton.addEventListener('click', () => {
        document.getElementById('logout-modal').style.display = 'flex';
    });

    document.getElementById('close-logout-modal').addEventListener('click', () => {
        document.getElementById('logout-modal').style.display = 'none';
    });

    document.getElementById('cancel-logout-button').addEventListener('click', () => {
        document.getElementById('logout-modal').style.display = 'none';
    });

    document.getElementById('confirm-logout-button').addEventListener('click', () => {
        localStorage.removeItem('userProfiles');
        localStorage.removeItem('currentUserIndex');
        localStorage.removeItem('spinData');
        window.location.href = 'user-auth.html';
    });

    blackjackGameButton.addEventListener('click', () => {
        window.location.href = 'blackjack.html';
    });

    rocketCrashGameButton.addEventListener('click', () => {
        window.location.href = 'rocket-crash.html';
    });
});
