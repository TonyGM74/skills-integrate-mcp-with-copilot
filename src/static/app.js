document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const adminActivitySelect = document.getElementById("admin-activity");
  const roleActivitySelect = document.getElementById("role-activity");
  const signupForm = document.getElementById("signup-form");
  const roleForm = document.getElementById("role-form");
  const messageDiv = document.getElementById("message");
  const roleMessageDiv = document.getElementById("role-message");
  const requestsList = document.getElementById("requests-list");

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

        // Create participants HTML with delete icons and roles
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map((email) => {
                    const role = details.roles && details.roles[email] ? details.roles[email] : "member";
                    return `<li>
                      <span class="participant-email">${email} <strong>(${role})</strong></span>
                      <button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>
                    </li>`;
                  })
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

        // Add option to select dropdowns
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option.cloneNode(true));
        
        const adminOption = document.createElement("option");
        adminOption.value = name;
        adminOption.textContent = name;
        adminActivitySelect.appendChild(adminOption);
        
        const roleOption = document.createElement("option");
        roleOption.value = name;
        roleOption.textContent = name;
        roleActivitySelect.appendChild(roleOption);
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

        // Refresh activities list
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
      messageDiv.textContent = "Failed to submit request. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle admin activity selection for viewing requests
  adminActivitySelect.addEventListener("change", async (event) => {
    const activityName = event.target.value;
    
    if (!activityName) {
      requestsList.innerHTML = "<p><em>Select an activity to view requests</em></p>";
      return;
    }

    try {
      const response = await fetch(`/activities/${encodeURIComponent(activityName)}/requests`);
      const requests = await response.json();

      if (requests.length === 0) {
        requestsList.innerHTML = "<p><em>No pending requests</em></p>";
        return;
      }

      // Filter only pending requests
      const pendingRequests = requests.filter(req => req.status === "pending");

      if (pendingRequests.length === 0) {
        requestsList.innerHTML = "<p><em>No pending requests</em></p>";
        return;
      }

      requestsList.innerHTML = `
        <div class="requests-section">
          <h5>Pending Requests:</h5>
          <ul class="requests-list">
            ${pendingRequests.map(req => `
              <li style="margin-bottom: 10px; padding: 10px; background: #f5f5f5; border-radius: 5px;">
                <div><strong>${req.email}</strong></div>
                <div style="margin-top: 8px;">
                  <button class="approve-btn" style="background-color: #2e7d32; margin-right: 5px;" 
                          data-activity="${activityName}" data-email="${req.email}">✓ Approve</button>
                  <button class="reject-btn" style="background-color: #c62828;" 
                          data-activity="${activityName}" data-email="${req.email}">✗ Reject</button>
                </div>
              </li>
            `).join("")}
          </ul>
        </div>
      `;

      // Add event listeners for approve/reject buttons
      document.querySelectorAll(".approve-btn").forEach(btn => {
        btn.addEventListener("click", handleApprove);
      });
      document.querySelectorAll(".reject-btn").forEach(btn => {
        btn.addEventListener("click", handleReject);
      });
    } catch (error) {
      requestsList.innerHTML = "<p>Failed to load requests. Please try again.</p>";
      console.error("Error fetching requests:", error);
    }
  });

  // Handle approve membership request
  async function handleApprove(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/requests/${encodeURIComponent(email)}/approve`,
        { method: "POST" }
      );

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        // Refresh both activities and requests
        fetchActivities();
        adminActivitySelect.dispatchEvent(new Event("change"));
      } else {
        alert(result.detail || "Failed to approve request");
      }
    } catch (error) {
      alert("Failed to approve request. Please try again.");
      console.error("Error approving request:", error);
    }
  }

  // Handle reject membership request
  async function handleReject(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/requests/${encodeURIComponent(email)}/reject`,
        { method: "POST" }
      );

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        // Refresh requests
        adminActivitySelect.dispatchEvent(new Event("change"));
      } else {
        alert(result.detail || "Failed to reject request");
      }
    } catch (error) {
      alert("Failed to reject request. Please try again.");
      console.error("Error rejecting request:", error);
    }
  }

  // Handle role assignment form submission
  roleForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const activity = document.getElementById("role-activity").value;
    const email = document.getElementById("member-email").value;
    const role = document.getElementById("role").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/members/${encodeURIComponent(email)}/role?role=${encodeURIComponent(role)}`,
        { method: "POST" }
      );

      const result = await response.json();

      if (response.ok) {
        roleMessageDiv.textContent = result.message;
        roleMessageDiv.className = "success";
        roleForm.reset();

        // Refresh activities list to show updated roles
        fetchActivities();
      } else {
        roleMessageDiv.textContent = result.detail || "An error occurred";
        roleMessageDiv.className = "error";
      }

      roleMessageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        roleMessageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      roleMessageDiv.textContent = "Failed to assign role. Please try again.";
      roleMessageDiv.className = "error";
      roleMessageDiv.classList.remove("hidden");
      console.error("Error assigning role:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
