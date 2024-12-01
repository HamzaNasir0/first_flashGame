document.addEventListener("DOMContentLoaded", () => {
    const registerButton = document.getElementById("register-button");
    const loginButton = document.getElementById("login-button");
    const guestButton = document.getElementById("guest-button"); // Guest Mode Button
    const message = document.getElementById("message");

    // Load existing user profiles from LocalStorage
    let userProfiles = JSON.parse(localStorage.getItem("userProfiles")) || [];

    // Register Button Event Listener
    registerButton.addEventListener("click", () => {
        const username = document.getElementById("register-username").value.trim();
        const password = document.getElementById("register-password").value.trim();

        if (username === "" || password === "") {
            showMessage("Please fill in both fields!", "error");
            return;
        }

        // Check if the username is already taken
        if (userProfiles.some(profile => profile.username === username)) {
            showMessage("Username is already taken. Please choose another one.", "error");
            return;
        }

        // Create new user profile and save it
        const newUserProfile = {
            username: username,
            password: password,
            totalWins: 0,
            totalLosses: 0,
            totalProfit: 0.0,
            totalBalance: 500 // Starting balance
        };
        userProfiles.push(newUserProfile);
        localStorage.setItem("userProfiles", JSON.stringify(userProfiles));

        showMessage(`User "${username}" registered successfully!`, "success");
    });

    // Login Button Event Listener
    loginButton.addEventListener("click", () => {
        const username = document.getElementById("login-username").value.trim();
        const password = document.getElementById("login-password").value.trim();

        if (username === "" || password === "") {
            showMessage("Please fill in both fields!", "error");
            return;
        }

        // Find the user profile by username and password
        const userIndex = userProfiles.findIndex(profile => profile.username === username && profile.password === password);

        if (userIndex === -1) {
            showMessage("Invalid username or password!", "error");
            return;
        }

        // Successful login
        showMessage(`Welcome back, ${username}!`, "success");

        // Store the user index in LocalStorage for later use
        localStorage.setItem("currentUserIndex", userIndex);

        // Redirect to welcome page
        setTimeout(() => {
            window.location.href = `welcome.html`;
        }, 1500);
    });

    // Guest Mode Button Event Listener
    guestButton.addEventListener("click", () => {
        const guestProfile = {
            username: "Guest",
            totalWins: 0,
            totalLosses: 0,
            totalProfit: 0.0,
            totalBalance: 500 // Default starting balance
        };

        // Add Guest Profile
        userProfiles.push(guestProfile);
        localStorage.setItem("userProfiles", JSON.stringify(userProfiles));

        // Set Guest as the current user
        localStorage.setItem("currentUserIndex", userProfiles.length - 1);

        // Show success message and redirect
        showMessage("You are logged in as Guest!", "success");
        setTimeout(() => {
            window.location.href = `welcome.html`;
        }, 1500);
    });

    // Function to show messages to the user
    function showMessage(msg, type) {
        message.textContent = msg;
        message.className = type; // 'success' or 'error' for different styling
    }
});
