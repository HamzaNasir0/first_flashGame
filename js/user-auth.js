document.addEventListener("DOMContentLoaded", () => {
    const registerButton = document.getElementById("register-button");
    const loginButton = document.getElementById("login-button");
    const guestButton = document.getElementById("guest-button");
    const switchToRegister = document.getElementById("switch-to-register");
    const switchToLogin = document.getElementById("switch-to-login");
    const flipContainer = document.querySelector(".flip-container");

    const loginMessage = document.getElementById("login-message");
    const registerMessage = document.getElementById("register-message");

    // Load existing user profiles from LocalStorage
    let userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];

    // Flip to Register Card
    switchToRegister.addEventListener("click", () => {
        flipContainer.classList.add("active");
        hideMessage(registerMessage); // Hide any lingering messages in Register
        hideMessage(loginMessage); // Clear Login message just in case
    });

    // Flip to Login Card
    switchToLogin.addEventListener("click", () => {
        flipContainer.classList.remove("active");
        hideMessage(loginMessage); // Hide any lingering messages in Login
        hideMessage(registerMessage); // Clear Register message just in case
    });

    // Register Button Event Listener
    registerButton.addEventListener("click", () => {
        const username = document.getElementById("register-username").value.trim();
        const password = document.getElementById("register-password").value.trim();

        hideMessage(registerMessage); // Clear any previous messages

        if (!username || !password) {
            showMessage(registerMessage, "Please fill in both fields!", "error");
            return;
        }

        if (userProfiles.some(profile => profile.username === username)) {
            showMessage(registerMessage, "Username is already taken!", "error");
            return;
        }

        const newUserProfile = {
            username,
            password,
            totalWins: 0,
            totalLosses: 0,
            totalProfit: 0.0,
            totalBalance: 500
        };

        userProfiles.push(newUserProfile);
        localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
        showMessage(registerMessage, `User "${username}" registered successfully!`, "success");

        setTimeout(() => {
            flipContainer.classList.remove("active");
            hideMessage(registerMessage); // Hide success message after flipping back to login
        }, 1500);
    });

    // Login Button Event Listener
    loginButton.addEventListener("click", () => {
        const username = document.getElementById("login-username").value.trim();
        const password = document.getElementById("login-password").value.trim();

        hideMessage(loginMessage); // Clear any previous messages

        if (!username || !password) {
            showMessage(loginMessage, "Please fill in both fields!", "error");
            return;
        }

        const userIndex = userProfiles.findIndex(
            profile => profile.username === username && profile.password === password
        );

        if (userIndex === -1) {
            showMessage(loginMessage, "Invalid username or password!", "error");
            return;
        }

        showMessage(loginMessage, `Welcome back, ${username}!`, "success");
        localStorage.setItem("currentUserIndex", userIndex);

        setTimeout(() => {
            window.location.href = "welcome.html";
        }, 1500);
    });

    // Guest Mode Button Event Listener
    guestButton.addEventListener("click", () => {
        hideMessage(loginMessage); // Clear any lingering messages

        const guestProfile = {
            username: "Guest",
            totalWins: 0,
            totalLosses: 0,
            totalProfit: 0.0,
            totalBalance: 500
        };

        userProfiles.push(guestProfile);
        localStorage.setItem("userProfiles", JSON.stringify(userProfiles));
        localStorage.setItem("currentUserIndex", userProfiles.length - 1);

        showMessage(loginMessage, "You are logged in as Guest!", "success");

        setTimeout(() => {
            window.location.href = "welcome.html";
        }, 1500);
    });

    // Utility function to show messages
    function showMessage(messageContainer, msg, type) {
        messageContainer.textContent = msg;
        messageContainer.className = `message ${type}`; // Add 'success' or 'error' class
        messageContainer.style.display = "block"; // Make the message visible
    }

    // Utility function to hide messages
    function hideMessage(messageContainer) {
        messageContainer.textContent = "";
        messageContainer.style.display = "none"; // Hide the message
    }
});