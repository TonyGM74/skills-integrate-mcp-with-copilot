document.addEventListener("DOMContentLoaded", () => {
  const statisticsContent = document.getElementById("statistics-content");
  const adminActivitiesContainer = document.getElementById("admin-activities-container");
  const reportsContent = document.getElementById("reports-content");
  const createActivityForm = document.getElementById("create-activity-form");
  const generateReportBtn = document.getElementById("generate-report-btn");
  const messageDiv = document.getElementById("message");

  // Function to show message
  function showMessage(text, type = "success") {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch and display statistics
  async function fetchStatistics() {
    try {
      const response = await fetch("/admin/statistics");
      const stats = await response.json();

      statisticsContent.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <h4>Total Activities</h4>
            <p class="stat-number">${stats.total_activities}</p>
          </div>
          <div class="stat-card">
            <h4>Total Participants</h4>
            <p class="stat-number">${stats.total_participants}</p>
          </div>
          <div class="stat-card">
            <h4>Total Capacity</h4>
            <p class="stat-number">${stats.total_capacity}</p>
          </div>
          <div class="stat-card">
            <h4>Overall Utilization</h4>
            <p class="stat-number">${stats.overall_utilization}%</p>
          </div>
        </div>
        <div class="activity-details-table">
          <h4>Activity Utilization Details</h4>
          <table>
            <thead>
              <tr>
                <th>Activity</th>
                <th>Participants</th>
                <th>Capacity</th>
                <th>Utilization</th>
              </tr>
            </thead>
            <tbody>
              ${stats.activity_details
                .map(
                  (activity) => `
                <tr>
                  <td>${activity.name}</td>
                  <td>${activity.participants}</td>
                  <td>${activity.capacity}</td>
                  <td>
                    <div class="utilization-bar">
                      <div class="utilization-fill" style="width: ${activity.utilization}%"></div>
                      <span class="utilization-text">${activity.utilization}%</span>
                    </div>
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      statisticsContent.innerHTML = "<p>Failed to load statistics.</p>";
      console.error("Error fetching statistics:", error);
    }
  }

  // Function to fetch and display activities for management
  async function fetchActivitiesForManagement() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      adminActivitiesContainer.innerHTML = "";

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "admin-activity-card";

        const participantsList = details.participants.length > 0
          ? `<ul class="participants-list-admin">
              ${details.participants.map(email => `<li>${email}</li>`).join("")}
            </ul>`
          : `<p><em>No participants</em></p>`;

        activityCard.innerHTML = `
          <div class="activity-header">
            <h5>${name}</h5>
            <div class="activity-actions">
              <button class="btn-edit" data-name="${name}">✏️ Edit</button>
              <button class="btn-delete" data-name="${name}">🗑️ Delete</button>
            </div>
          </div>
          <div class="activity-details">
            <p><strong>Description:</strong> ${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Capacity:</strong> ${details.participants.length} / ${details.max_participants}</p>
            <div class="participants-section-admin">
              <strong>Participants:</strong>
              ${participantsList}
            </div>
          </div>
        `;

        adminActivitiesContainer.appendChild(activityCard);
      });

      // Add event listeners to edit and delete buttons
      document.querySelectorAll(".btn-edit").forEach((btn) => {
        btn.addEventListener("click", handleEdit);
      });

      document.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.addEventListener("click", handleDelete);
      });
    } catch (error) {
      adminActivitiesContainer.innerHTML = "<p>Failed to load activities.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle create activity
  createActivityForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("new-activity-name").value;
    const description = document.getElementById("new-activity-description").value;
    const schedule = document.getElementById("new-activity-schedule").value;
    const maxParticipants = parseInt(document.getElementById("new-activity-capacity").value);

    try {
      const response = await fetch(
        `/admin/activities?name=${encodeURIComponent(name)}&description=${encodeURIComponent(
          description
        )}&schedule=${encodeURIComponent(schedule)}&max_participants=${maxParticipants}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        createActivityForm.reset();
        fetchStatistics();
        fetchActivitiesForManagement();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to create activity. Please try again.", "error");
      console.error("Error creating activity:", error);
    }
  });

  // Handle edit activity
  async function handleEdit(event) {
    const activityName = event.target.getAttribute("data-name");
    
    // Get current activity details
    const response = await fetch("/activities");
    const activities = await response.json();
    const activity = activities[activityName];

    if (!activity) {
      showMessage("Activity not found", "error");
      return;
    }

    // Prompt for new values
    const newDescription = prompt("Enter new description:", activity.description);
    const newSchedule = prompt("Enter new schedule:", activity.schedule);
    const newCapacityStr = prompt("Enter new max participants:", activity.max_participants);

    if (newDescription === null && newSchedule === null && newCapacityStr === null) {
      return; // User cancelled
    }

    // Validate capacity if provided
    let newCapacity = null;
    if (newCapacityStr !== null && newCapacityStr !== "") {
      newCapacity = parseInt(newCapacityStr, 10);
      if (isNaN(newCapacity) || newCapacity < 1) {
        showMessage("Max participants must be a positive number", "error");
        return;
      }
    }

    try {
      const params = new URLSearchParams();
      if (newDescription !== null && newDescription !== "") params.append("description", newDescription);
      if (newSchedule !== null && newSchedule !== "") params.append("schedule", newSchedule);
      if (newCapacity !== null) params.append("max_participants", newCapacity);

      const updateResponse = await fetch(
        `/admin/activities/${encodeURIComponent(activityName)}?${params.toString()}`,
        {
          method: "PUT",
        }
      );

      const result = await updateResponse.json();

      if (updateResponse.ok) {
        showMessage(result.message, "success");
        fetchStatistics();
        fetchActivitiesForManagement();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to update activity. Please try again.", "error");
      console.error("Error updating activity:", error);
    }
  }

  // Handle delete activity
  async function handleDelete(event) {
    const activityName = event.target.getAttribute("data-name");

    if (!confirm(`Are you sure you want to delete "${activityName}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/admin/activities/${encodeURIComponent(activityName)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        fetchStatistics();
        fetchActivitiesForManagement();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to delete activity. Please try again.", "error");
      console.error("Error deleting activity:", error);
    }
  }

  // Handle report generation
  generateReportBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/admin/reports");
      const reports = await response.json();

      reportsContent.innerHTML = `
        <div class="report-summary">
          <h4>Summary</h4>
          <div class="stats-grid">
            <div class="stat-card">
              <h5>Total Activities</h5>
              <p class="stat-number">${reports.summary.total_activities}</p>
            </div>
            <div class="stat-card">
              <h5>Total Participants</h5>
              <p class="stat-number">${reports.summary.total_participants}</p>
            </div>
            <div class="stat-card">
              <h5>Avg Participants/Activity</h5>
              <p class="stat-number">${reports.summary.average_participants_per_activity}</p>
            </div>
          </div>
        </div>
        <div class="report-details">
          <h4>Activity Details (sorted by utilization)</h4>
          ${reports.activities
            .map(
              (activity) => `
            <div class="report-activity-card">
              <h5>${activity.name}</h5>
              <p><strong>Description:</strong> ${activity.description}</p>
              <p><strong>Schedule:</strong> ${activity.schedule}</p>
              <p><strong>Participants:</strong> ${activity.participants_count} / ${activity.max_participants}</p>
              <div class="utilization-bar">
                <div class="utilization-fill" style="width: ${activity.utilization_percentage}%"></div>
                <span class="utilization-text">${activity.utilization_percentage}% utilized</span>
              </div>
              <details>
                <summary>View Participants (${activity.participants_count})</summary>
                <ul class="participants-list-report">
                  ${activity.participants.map(email => `<li>${email}</li>`).join("") || "<li>No participants</li>"}
                </ul>
              </details>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    } catch (error) {
      reportsContent.innerHTML = "<p>Failed to generate report.</p>";
      console.error("Error generating report:", error);
    }
  });

  // Initialize admin panel
  fetchStatistics();
  fetchActivitiesForManagement();
});
