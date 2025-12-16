document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const authMessage = document.getElementById("auth-message");
  const tabButtons = document.querySelectorAll(".tab-button");

  // Tab switching functionality
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.getAttribute("data-tab");

      // Update active tab button
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Show/hide forms
      if (tab === "login") {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
      } else {
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
      }

      // Clear message
      authMessage.classList.add("hidden");
    });
  });

  // Handle login
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        // Store token
        localStorage.setItem("token", result.access_token);

        // Fetch user info to get role
        const userResponse = await fetch("/auth/me", {
          headers: {
            Authorization: `Bearer ${result.access_token}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          localStorage.setItem("user", JSON.stringify(userData));

          // Redirect to main page
          window.location.href = "/";
        }
      } else {
        authMessage.textContent = result.detail || "Login failed";
        authMessage.className = "error";
        authMessage.classList.remove("hidden");
      }
    } catch (error) {
      authMessage.textContent = "Login failed. Please try again.";
      authMessage.className = "error";
      authMessage.classList.remove("hidden");
      console.error("Error logging in:", error);
    }
  });

  // Handle registration
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const fullName = document.getElementById("register-fullname").value;
    const role = document.getElementById("register-role").value;

    try {
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
          full_name: fullName || null,
          role: role,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Store token
        localStorage.setItem("token", result.access_token);

        // Fetch user info
        const userResponse = await fetch("/auth/me", {
          headers: {
            Authorization: `Bearer ${result.access_token}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          localStorage.setItem("user", JSON.stringify(userData));

          // Redirect to main page
          window.location.href = "/";
        }
      } else {
        authMessage.textContent = result.detail || "Registration failed";
        authMessage.className = "error";
        authMessage.classList.remove("hidden");
      }
    } catch (error) {
      authMessage.textContent = "Registration failed. Please try again.";
      authMessage.className = "error";
      authMessage.classList.remove("hidden");
      console.error("Error registering:", error);
    }
  });
});
