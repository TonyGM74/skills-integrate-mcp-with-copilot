document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const notificationsList = document.getElementById("notifications-list");
  const notificationEmailInput = document.getElementById("notification-email");
  const loadNotificationsBtn = document.getElementById("load-notifications-btn");

  // Helper function to escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Function to fetch and display notifications
  async function fetchNotifications() {
    const email = notificationEmailInput.value.trim();
    
    if (!email) {
      notificationsList.innerHTML = '<p class="notification-hint">Please enter your email to view notifications.</p>';
      return;
    }

    try {
      const response = await fetch(`/notifications?email=${encodeURIComponent(email)}`);
      const notifications = await response.json();

      if (notifications.length === 0) {
        notificationsList.innerHTML = '<p class="notification-hint">No notifications yet.</p>';
        return;
      }

      // Sort notifications by timestamp (newest first)
      notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      notificationsList.innerHTML = "";
      
      notifications.forEach(notification => {
        const notificationCard = document.createElement("div");
        notificationCard.className = `notification-card notification-${notification.type} ${notification.read ? 'notification-read' : ''}`;
        
        const timestamp = new Date(notification.timestamp).toLocaleString();
        
        notificationCard.innerHTML = `
          <div class="notification-content">
            <p class="notification-message">${escapeHtml(notification.message)}</p>
            <p class="notification-timestamp">${escapeHtml(timestamp)}</p>
          </div>
          ${!notification.read ? `<button class="mark-read-btn" data-id="${notification.id}" data-email="${escapeHtml(email)}">Mark as Read</button>` : '<span class="read-badge">Read</span>'}
        `;
        
        notificationsList.appendChild(notificationCard);
      });

      // Add event listeners to mark-as-read buttons
      document.querySelectorAll(".mark-read-btn").forEach(button => {
        button.addEventListener("click", handleMarkAsRead);
      });
    } catch (error) {
      notificationsList.innerHTML = '<p class="notification-hint">Failed to load notifications. Please try again.</p>';
      console.error("Error fetching notifications:", error);
    }
  }

  // Handle mark notification as read
  async function handleMarkAsRead(event) {
    const button = event.target;
    const notificationId = button.getAttribute("data-id");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/notifications/${notificationId}/read?email=${encodeURIComponent(email)}`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        // Refresh notifications list
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  // Load notifications button event listener
  loadNotificationsBtn.addEventListener("click", fetchNotifications);

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
        
        // Refresh notifications if email matches
        const currentEmail = notificationEmailInput.value.trim();
        if (currentEmail === email) {
          fetchNotifications();
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
        
        // Refresh notifications if email matches
        const currentEmail = notificationEmailInput.value.trim();
        if (currentEmail === email) {
          fetchNotifications();
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
