document.addEventListener("DOMContentLoaded", () => {
  const messageDiv = document.getElementById("message");
  const modal = document.getElementById("activity-modal");
  const addActivityBtn = document.getElementById("add-activity-btn");
  const closeModal = document.querySelector(".close-modal");
  const activityForm = document.getElementById("activity-form");

  // Occupancy thresholds for color coding
  const OCCUPANCY_LOW = 50;
  const OCCUPANCY_MEDIUM = 80;
  const COLOR_LOW = "#4caf50";
  const COLOR_MEDIUM = "#ff9800";
  const COLOR_HIGH = "#f44336";

  // Tab switching
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all tabs
      document.querySelectorAll(".tab-button").forEach((btn) => {
        btn.classList.remove("active");
      });
      document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
      });

      // Add active class to clicked tab
      button.classList.add("active");
      const tabId = button.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");

      // Load data when switching to tabs
      if (tabId === "participants-tab") {
        loadParticipants();
      } else if (tabId === "statistics-tab") {
        loadStatistics();
      }
    });
  });

  // Modal controls
  addActivityBtn.addEventListener("click", () => {
    document.getElementById("modal-title").textContent = "Add New Activity";
    document.getElementById("edit-activity-name").value = "";
    document.getElementById("activity-name").disabled = false;
    activityForm.reset();
    modal.style.display = "block";
  });

  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Form submission
  activityForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("activity-name").value;
    const description = document.getElementById("activity-description").value;
    const schedule = document.getElementById("activity-schedule").value;
    const maxParticipants = parseInt(
      document.getElementById("activity-max").value
    );
    const editName = document.getElementById("edit-activity-name").value;

    try {
      let response;
      if (editName) {
        // Update existing activity
        response = await fetch(
          `/admin/activities/${encodeURIComponent(editName)}?description=${encodeURIComponent(description)}&schedule=${encodeURIComponent(schedule)}&max_participants=${maxParticipants}`,
          { method: "PUT" }
        );
      } else {
        // Create new activity
        response = await fetch(
          `/admin/activities?name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}&schedule=${encodeURIComponent(schedule)}&max_participants=${maxParticipants}`,
          { method: "POST" }
        );
      }

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        modal.style.display = "none";
        loadDashboard();
        loadActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to save activity. Please try again.", "error");
      console.error("Error saving activity:", error);
    }
  });

  // Load dashboard statistics
  async function loadDashboard() {
    try {
      const response = await fetch("/admin/dashboard");
      const data = await response.json();

      document.getElementById("total-activities").textContent =
        data.total_activities;
      document.getElementById("total-participants").textContent =
        data.total_participants;
      document.getElementById("unique-participants").textContent =
        data.unique_participants;
      document.getElementById("participation-rate").textContent =
        data.participation_rate + "%";
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  }

  // Load activities
  async function loadActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      const activitiesList = document.getElementById("activities-list");
      activitiesList.innerHTML = "";

      if (Object.keys(activities).length === 0) {
        activitiesList.innerHTML = "<p>No activities found.</p>";
        return;
      }

      const table = document.createElement("table");
      table.className = "activity-table";
      table.innerHTML = `
        <thead>
          <tr>
            <th>Activity Name</th>
            <th>Description</th>
            <th>Schedule</th>
            <th>Participants</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="activities-tbody"></tbody>
      `;

      activitiesList.appendChild(table);

      const tbody = document.getElementById("activities-tbody");

      Object.entries(activities).forEach(([name, details]) => {
        const row = document.createElement("tr");
        const participantCount = details.participants.length;
        const maxParticipants = details.max_participants;

        row.innerHTML = `
          <td><strong>${name}</strong></td>
          <td>${details.description}</td>
          <td>${details.schedule}</td>
          <td>${participantCount} / ${maxParticipants}</td>
          <td class="action-buttons">
            <button class="btn-edit" data-name="${name}">Edit</button>
            <button class="btn-delete" data-name="${name}">Delete</button>
          </td>
        `;

        tbody.appendChild(row);
      });

      // Add event listeners to edit and delete buttons
      document.querySelectorAll(".btn-edit").forEach((button) => {
        button.addEventListener("click", () => editActivity(button.dataset.name, activities));
      });

      document.querySelectorAll(".btn-delete").forEach((button) => {
        button.addEventListener("click", () => deleteActivity(button.dataset.name));
      });
    } catch (error) {
      document.getElementById("activities-list").innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error loading activities:", error);
    }
  }

  // Edit activity
  function editActivity(name, activities) {
    const activity = activities[name];
    document.getElementById("modal-title").textContent = "Edit Activity";
    document.getElementById("edit-activity-name").value = name;
    document.getElementById("activity-name").value = name;
    document.getElementById("activity-name").disabled = true;
    document.getElementById("activity-description").value = activity.description;
    document.getElementById("activity-schedule").value = activity.schedule;
    document.getElementById("activity-max").value = activity.max_participants;
    modal.style.display = "block";
  }

  // Delete activity
  async function deleteActivity(name) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/admin/activities/${encodeURIComponent(name)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        loadDashboard();
        loadActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to delete activity. Please try again.", "error");
      console.error("Error deleting activity:", error);
    }
  }

  // Load participants
  async function loadParticipants() {
    try {
      const response = await fetch("/admin/participants");
      const participants = await response.json();

      const participantsList = document.getElementById("participants-list");
      participantsList.innerHTML = "";

      if (participants.length === 0) {
        participantsList.innerHTML = "<p>No participants found.</p>";
        return;
      }

      const table = document.createElement("table");
      table.className = "participant-table";
      table.innerHTML = `
        <thead>
          <tr>
            <th>Student Email</th>
            <th>Enrolled Activities</th>
            <th>Total Activities</th>
          </tr>
        </thead>
        <tbody id="participants-tbody"></tbody>
      `;

      participantsList.appendChild(table);

      const tbody = document.getElementById("participants-tbody");

      participants.forEach((participant) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${participant.email}</td>
          <td>${participant.activities.join(", ")}</td>
          <td>${participant.activity_count}</td>
        `;
        tbody.appendChild(row);
      });
    } catch (error) {
      document.getElementById("participants-list").innerHTML =
        "<p>Failed to load participants. Please try again later.</p>";
      console.error("Error loading participants:", error);
    }
  }

  // Load statistics
  async function loadStatistics() {
    try {
      const response = await fetch("/admin/dashboard");
      const data = await response.json();

      const statisticsList = document.getElementById("statistics-list");
      statisticsList.innerHTML = "<h4>Activity Occupancy</h4>";

      if (data.activity_stats.length === 0) {
        statisticsList.innerHTML += "<p>No activities found.</p>";
        return;
      }

      data.activity_stats.forEach((stat) => {
        const statCard = document.createElement("div");
        statCard.style.marginBottom = "20px";
        statCard.style.padding = "15px";
        statCard.style.border = "1px solid #ddd";
        statCard.style.borderRadius = "5px";

        const occupancyRate = stat.occupancy_rate.toFixed(1);
        const color =
          occupancyRate < OCCUPANCY_LOW ? COLOR_LOW : 
          occupancyRate < OCCUPANCY_MEDIUM ? COLOR_MEDIUM : 
          COLOR_HIGH;

        statCard.innerHTML = `
          <h4 style="margin-bottom: 10px; color: #1a237e;">${stat.name}</h4>
          <p style="margin-bottom: 5px;">
            <strong>Participants:</strong> ${stat.participants} / ${stat.capacity}
            <span style="color: ${color}; font-weight: bold; margin-left: 10px;">${occupancyRate}%</span>
          </p>
          <div class="occupancy-bar">
            <div class="occupancy-fill" style="width: ${occupancyRate}%;"></div>
          </div>
        `;

        statisticsList.appendChild(statCard);
      });
    } catch (error) {
      document.getElementById("statistics-list").innerHTML =
        "<p>Failed to load statistics. Please try again later.</p>";
      console.error("Error loading statistics:", error);
    }
  }

  // Show message
  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Initialize
  loadDashboard();
  loadActivities();
});
