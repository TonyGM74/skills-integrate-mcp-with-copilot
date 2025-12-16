document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Event management elements
  const eventForm = document.getElementById("event-form");
  const eventClubSelect = document.getElementById("event-club");
  const eventMessageDiv = document.getElementById("event-message");
  const eventsClubFilter = document.getElementById("events-club-filter");
  const eventsList = document.getElementById("events-list");
  const notificationEmail = document.getElementById("notification-email");
  const viewNotificationsBtn = document.getElementById("view-notifications-btn");
  const notificationsList = document.getElementById("notifications-list");

  // Tab switching
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove("active"));
      tabContents.forEach(content => content.classList.remove("active"));
      
      // Add active class to clicked button and corresponding content
      button.classList.add("active");
      document.getElementById(`${targetTab}-tab`).classList.add("active");
      
      // Load clubs when switching to events tab
      if (targetTab === "events") {
        loadClubs();
      }
    });
  });

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

  // Load clubs for event management
  async function loadClubs() {
    try {
      const response = await fetch("/clubs");
      const clubs = await response.json();

      // Populate club selects
      eventClubSelect.innerHTML = '<option value="">-- Select a club --</option>';
      eventsClubFilter.innerHTML = '<option value="">-- All Clubs --</option>';
      
      Object.keys(clubs).forEach(clubName => {
        const option1 = document.createElement("option");
        option1.value = clubName;
        option1.textContent = clubName;
        eventClubSelect.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = clubName;
        option2.textContent = clubName;
        eventsClubFilter.appendChild(option2);
      });
    } catch (error) {
      console.error("Error loading clubs:", error);
    }
  }

  // Handle event creation form submission
  eventForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const clubName = document.getElementById("event-club").value;
    const eventData = {
      title: document.getElementById("event-title").value,
      description: document.getElementById("event-description").value,
      date: document.getElementById("event-date").value,
      time: document.getElementById("event-time").value,
      location: document.getElementById("event-location").value,
      max_participants: parseInt(document.getElementById("event-max").value)
    };

    try {
      const response = await fetch(
        `/clubs/${encodeURIComponent(clubName)}/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(eventData)
        }
      );

      const result = await response.json();

      if (response.ok) {
        eventMessageDiv.textContent = result.message;
        eventMessageDiv.className = "success";
        eventForm.reset();
        
        // Reload events if the club is currently selected
        if (eventsClubFilter.value === clubName) {
          loadClubEvents(clubName);
        }
      } else {
        eventMessageDiv.textContent = result.detail || "An error occurred";
        eventMessageDiv.className = "error";
      }

      eventMessageDiv.classList.remove("hidden");

      setTimeout(() => {
        eventMessageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      eventMessageDiv.textContent = "Failed to create event. Please try again.";
      eventMessageDiv.className = "error";
      eventMessageDiv.classList.remove("hidden");
      console.error("Error creating event:", error);
    }
  });

  // Handle club filter change
  eventsClubFilter.addEventListener("change", (event) => {
    const clubName = event.target.value;
    if (clubName) {
      loadClubEvents(clubName);
    } else {
      eventsList.innerHTML = "<p>Select a club to view events.</p>";
    }
  });

  // Load events for a specific club
  async function loadClubEvents(clubName) {
    try {
      const response = await fetch(`/clubs/${encodeURIComponent(clubName)}/events`);
      const events = await response.json();

      if (Object.keys(events).length === 0) {
        eventsList.innerHTML = `<p>No events found for ${clubName}. Create one above!</p>`;
        return;
      }

      eventsList.innerHTML = "";
      
      Object.values(events).forEach(event => {
        const eventCard = document.createElement("div");
        eventCard.className = "event-card";

        const spotsLeft = event.max_participants - event.participants.length;
        
        const participantsHTML = event.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants (${event.participants.length}):</h5>
              <ul class="participants-list">
                ${event.participants.map(email => `<li>${email}</li>`).join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

        eventCard.innerHTML = `
          <h4>${event.title}</h4>
          <p><strong>Description:</strong> ${event.description}</p>
          <p><strong>Date:</strong> ${event.date}</p>
          <p><strong>Time:</strong> ${event.time}</p>
          <p><strong>Location:</strong> ${event.location}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
          <div class="event-actions">
            <button class="register-event-btn" data-club="${clubName}" data-event="${event.id}">Register for Event</button>
            <button class="unregister-event-btn" data-club="${clubName}" data-event="${event.id}">Unregister</button>
            <button class="notify-btn" data-club="${clubName}" data-event="${event.id}">Send Notification</button>
          </div>
        `;

        eventsList.appendChild(eventCard);
      });

      // Add event listeners to action buttons
      document.querySelectorAll(".register-event-btn").forEach(btn => {
        btn.addEventListener("click", handleEventRegistration);
      });

      document.querySelectorAll(".unregister-event-btn").forEach(btn => {
        btn.addEventListener("click", handleEventUnregistration);
      });

      document.querySelectorAll(".notify-btn").forEach(btn => {
        btn.addEventListener("click", handleEventNotification);
      });

    } catch (error) {
      eventsList.innerHTML = "<p>Failed to load events. Please try again later.</p>";
      console.error("Error loading events:", error);
    }
  }

  // Handle event registration
  async function handleEventRegistration(e) {
    const clubName = e.target.getAttribute("data-club");
    const eventId = e.target.getAttribute("data-event");
    const email = prompt("Enter your email to register:");

    if (!email) return;

    try {
      const response = await fetch(
        `/clubs/${encodeURIComponent(clubName)}/events/${eventId}/register?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        loadClubEvents(clubName);
      } else {
        alert(result.detail || "Registration failed");
      }
    } catch (error) {
      alert("Failed to register. Please try again.");
      console.error("Error registering:", error);
    }
  }

  // Handle event unregistration
  async function handleEventUnregistration(e) {
    const clubName = e.target.getAttribute("data-club");
    const eventId = e.target.getAttribute("data-event");
    const email = prompt("Enter your email to unregister:");

    if (!email) return;

    try {
      const response = await fetch(
        `/clubs/${encodeURIComponent(clubName)}/events/${eventId}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        loadClubEvents(clubName);
      } else {
        alert(result.detail || "Unregistration failed");
      }
    } catch (error) {
      alert("Failed to unregister. Please try again.");
      console.error("Error unregistering:", error);
    }
  }

  // Handle sending notifications
  async function handleEventNotification(e) {
    const clubName = e.target.getAttribute("data-club");
    const eventId = e.target.getAttribute("data-event");
    const message = prompt("Enter notification message to send to all participants:");

    if (!message) return;

    try {
      const response = await fetch(
        `/clubs/${encodeURIComponent(clubName)}/events/${eventId}/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ message })
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
      } else {
        alert(result.detail || "Failed to send notifications");
      }
    } catch (error) {
      alert("Failed to send notifications. Please try again.");
      console.error("Error sending notifications:", error);
    }
  }

  // View notifications
  viewNotificationsBtn.addEventListener("click", async () => {
    const email = notificationEmail.value;
    
    if (!email) {
      alert("Please enter your email address");
      return;
    }

    try {
      const response = await fetch(`/notifications?email=${encodeURIComponent(email)}`);
      const notifications = await response.json();

      if (notifications.length === 0) {
        notificationsList.innerHTML = "<p>No notifications found for this email.</p>";
        return;
      }

      notificationsList.innerHTML = "";
      
      notifications.forEach(notification => {
        const notifCard = document.createElement("div");
        notifCard.className = "notification-card";
        
        const timestamp = new Date(notification.timestamp).toLocaleString();
        
        notifCard.innerHTML = `
          <p><strong>${notification.message}</strong></p>
          <p class="timestamp">${timestamp}</p>
        `;
        
        notificationsList.appendChild(notifCard);
      });
    } catch (error) {
      notificationsList.innerHTML = "<p>Failed to load notifications.</p>";
      console.error("Error loading notifications:", error);
    }
  });
});
