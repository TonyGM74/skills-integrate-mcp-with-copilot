document.addEventListener("DOMContentLoaded", () => {
  const createForm = document.getElementById("create-activity-form");
  const editForm = document.getElementById("edit-activity-form");
  const createMessage = document.getElementById("create-message");
  const editMessage = document.getElementById("edit-message");
  const adminActivitiesList = document.getElementById("admin-activities-list");
  const editModal = document.getElementById("edit-modal");
  const closeModal = document.querySelector(".close-modal");
  const cancelEdit = document.getElementById("cancel-edit");

  // Function to show messages
  function showMessage(element, message, type) {
    element.textContent = message;
    element.className = type;
    element.classList.remove("hidden");
    setTimeout(() => {
      element.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch and display activities
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      adminActivitiesList.innerHTML = "";

      if (Object.keys(activities).length === 0) {
        adminActivitiesList.innerHTML = "<p><em>No activities available</em></p>";
        return;
      }

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "admin-activity-card";

        const participantsCount = details.participants.length;
        const participantsList =
          participantsCount > 0
            ? details.participants.join(", ")
            : "No participants yet";

        activityCard.innerHTML = `
          <div class="activity-header">
            <h4>${name}</h4>
            <div class="activity-actions">
              <button class="btn-edit" data-activity="${name}">Edit</button>
              <button class="btn-delete" data-activity="${name}">Delete</button>
            </div>
          </div>
          <p><strong>Description:</strong> ${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Max Participants:</strong> ${details.max_participants}</p>
          <p><strong>Current Participants (${participantsCount}):</strong> ${participantsList}</p>
        `;

        adminActivitiesList.appendChild(activityCard);
      });

      // Add event listeners to edit buttons
      document.querySelectorAll(".btn-edit").forEach((button) => {
        button.addEventListener("click", handleEdit);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".btn-delete").forEach((button) => {
        button.addEventListener("click", handleDelete);
      });
    } catch (error) {
      adminActivitiesList.innerHTML =
        "<p class='error'>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle create activity
  createForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("activity-name").value.trim();
    const description = document
      .getElementById("activity-description")
      .value.trim();
    const schedule = document.getElementById("activity-schedule").value.trim();
    const maxParticipants = parseInt(
      document.getElementById("activity-max-participants").value
    );

    // Client-side validation
    if (!name || !description || !schedule || !maxParticipants) {
      showMessage(
        createMessage,
        "All fields are required",
        "error"
      );
      return;
    }

    if (maxParticipants < 1 || maxParticipants > 100) {
      showMessage(
        createMessage,
        "Max participants must be between 1 and 100",
        "error"
      );
      return;
    }

    try {
      const response = await fetch("/admin/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          description: description,
          schedule: schedule,
          max_participants: maxParticipants,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showMessage(createMessage, result.message, "success");
        createForm.reset();
        fetchActivities();
      } else {
        showMessage(
          createMessage,
          result.detail || "An error occurred",
          "error"
        );
      }
    } catch (error) {
      showMessage(
        createMessage,
        "Failed to create activity. Please try again.",
        "error"
      );
      console.error("Error creating activity:", error);
    }
  });

  // Handle edit button click
  async function handleEdit(event) {
    const activityName = event.target.getAttribute("data-activity");

    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      const activity = activities[activityName];

      if (!activity) {
        showMessage(editMessage, "Activity not found", "error");
        return;
      }

      // Populate form with current values
      document.getElementById("edit-activity-name").value = activityName;
      document.getElementById("edit-activity-description").value =
        activity.description;
      document.getElementById("edit-activity-schedule").value =
        activity.schedule;
      document.getElementById("edit-activity-max-participants").value =
        activity.max_participants;

      // Show modal
      editModal.classList.remove("hidden");
    } catch (error) {
      console.error("Error loading activity for edit:", error);
    }
  }

  // Handle edit form submission
  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const activityName = document.getElementById("edit-activity-name").value;
    const description = document
      .getElementById("edit-activity-description")
      .value.trim();
    const schedule = document
      .getElementById("edit-activity-schedule")
      .value.trim();
    const maxParticipants = document.getElementById(
      "edit-activity-max-participants"
    ).value;

    // Build update object with only non-empty fields
    const updateData = {};
    if (description) updateData.description = description;
    if (schedule) updateData.schedule = schedule;
    if (maxParticipants !== '') {
      const parsedMax = parseInt(maxParticipants);
      if (!isNaN(parsedMax) && parsedMax > 0) {
        updateData.max_participants = parsedMax;
      }
    }

    if (Object.keys(updateData).length === 0) {
      showMessage(editMessage, "No changes to save", "info");
      return;
    }

    try {
      const response = await fetch(
        `/admin/activities/${encodeURIComponent(activityName)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(editMessage, result.message, "success");
        setTimeout(() => {
          editModal.classList.add("hidden");
          editForm.reset();
          fetchActivities();
        }, 1500);
      } else {
        showMessage(
          editMessage,
          result.detail || "An error occurred",
          "error"
        );
      }
    } catch (error) {
      showMessage(
        editMessage,
        "Failed to update activity. Please try again.",
        "error"
      );
      console.error("Error updating activity:", error);
    }
  });

  // Handle delete button click
  async function handleDelete(event) {
    const activityName = event.target.getAttribute("data-activity");

    if (
      !confirm(
        `Are you sure you want to delete "${activityName}"? This action cannot be undone.`
      )
    ) {
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
        showMessage(
          createMessage,
          result.message,
          "success"
        );
        fetchActivities();
      } else {
        showMessage(
          createMessage,
          result.detail || "An error occurred",
          "error"
        );
      }
    } catch (error) {
      showMessage(
        createMessage,
        "Failed to delete activity. Please try again.",
        "error"
      );
      console.error("Error deleting activity:", error);
    }
  }

  // Close modal handlers
  closeModal.addEventListener("click", () => {
    editModal.classList.add("hidden");
    editForm.reset();
  });

  cancelEdit.addEventListener("click", () => {
    editModal.classList.add("hidden");
    editForm.reset();
  });

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === editModal) {
      editModal.classList.add("hidden");
      editForm.reset();
    }
  });

  // Initialize
  fetchActivities();
});
