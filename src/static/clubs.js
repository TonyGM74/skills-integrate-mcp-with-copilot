document.addEventListener("DOMContentLoaded", () => {
  const clubsList = document.getElementById("clubs-list");
  const createClubForm = document.getElementById("create-club-form");
  const messageDiv = document.getElementById("message");
  const clubModal = document.getElementById("club-modal");
  const editModal = document.getElementById("edit-modal");
  const memberModal = document.getElementById("member-modal");
  const eventModal = document.getElementById("event-modal");

  // Close buttons
  document.querySelector(".close").addEventListener("click", () => {
    clubModal.classList.add("hidden");
  });
  document.querySelector(".close-edit").addEventListener("click", () => {
    editModal.classList.add("hidden");
  });
  document.querySelector(".close-member").addEventListener("click", () => {
    memberModal.classList.add("hidden");
  });
  document.querySelector(".close-event").addEventListener("click", () => {
    eventModal.classList.add("hidden");
  });

  // Function to show message
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch clubs from API
  async function fetchClubs() {
    try {
      const response = await fetch("/clubs");
      const clubs = await response.json();

      // Clear loading message
      clubsList.innerHTML = "";

      // Check if there are any clubs
      const clubEntries = Object.entries(clubs);
      if (clubEntries.length === 0) {
        clubsList.innerHTML = "<p><em>No clubs yet. Create the first one!</em></p>";
        return;
      }

      // Populate clubs list
      clubEntries.forEach(([id, club]) => {
        const clubCard = document.createElement("div");
        clubCard.className = "club-card";

        const memberCount = club.members.length;
        const eventCount = club.events.length;

        clubCard.innerHTML = `
          <h4>${club.name}</h4>
          <p>${club.description}</p>
          <p><strong>Members:</strong> ${memberCount}</p>
          <p><strong>Events:</strong> ${eventCount}</p>
          <div class="club-actions">
            <button class="btn-view" data-club-id="${id}">View Details</button>
            <button class="btn-edit" data-club-id="${id}">Edit</button>
            <button class="btn-delete" data-club-id="${id}">Delete</button>
          </div>
        `;

        clubsList.appendChild(clubCard);
      });

      // Add event listeners to action buttons
      document.querySelectorAll(".btn-view").forEach((button) => {
        button.addEventListener("click", (e) => viewClubDetails(e.target.dataset.clubId));
      });
      document.querySelectorAll(".btn-edit").forEach((button) => {
        button.addEventListener("click", (e) => openEditModal(e.target.dataset.clubId));
      });
      document.querySelectorAll(".btn-delete").forEach((button) => {
        button.addEventListener("click", (e) => deleteClub(e.target.dataset.clubId));
      });
    } catch (error) {
      clubsList.innerHTML =
        "<p>Failed to load clubs. Please try again later.</p>";
      console.error("Error fetching clubs:", error);
    }
  }

  // Function to view club details
  async function viewClubDetails(clubId) {
    try {
      const response = await fetch(`/clubs/${clubId}`);
      const club = await response.json();

      if (response.ok) {
        const clubDetails = document.getElementById("club-details");
        
        const membersHTML = club.members.length > 0
          ? `<ul class="members-list">
              ${club.members.map(email => 
                `<li>
                  <span>${email}</span>
                  <button class="delete-btn" data-club-id="${clubId}" data-email="${email}">❌</button>
                </li>`
              ).join("")}
            </ul>`
          : `<p><em>No members yet</em></p>`;

        const eventsHTML = club.events.length > 0
          ? `<ul class="events-list">
              ${club.events.map(event => 
                `<li>
                  <div class="event-info">
                    <strong>${event.name}</strong>
                    <p>${event.description}</p>
                    <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
                    <p><strong>Location:</strong> ${event.location}</p>
                  </div>
                  <button class="delete-btn" data-club-id="${clubId}" data-event-id="${event.id}">❌</button>
                </li>`
              ).join("")}
            </ul>`
          : `<p><em>No events yet</em></p>`;

        clubDetails.innerHTML = `
          <h2>${club.name}</h2>
          <p>${club.description}</p>
          
          <div class="detail-section">
            <div class="section-header">
              <h4>Members (${club.members.length})</h4>
              <button class="btn-add-member" data-club-id="${clubId}">Add Member</button>
            </div>
            ${membersHTML}
          </div>

          <div class="detail-section">
            <div class="section-header">
              <h4>Events (${club.events.length})</h4>
              <button class="btn-add-event" data-club-id="${clubId}">Add Event</button>
            </div>
            ${eventsHTML}
          </div>
        `;

        clubModal.classList.remove("hidden");

        // Add event listeners for add buttons
        document.querySelector(".btn-add-member")?.addEventListener("click", (e) => {
          openMemberModal(e.target.dataset.clubId);
        });
        document.querySelector(".btn-add-event")?.addEventListener("click", (e) => {
          openEventModal(e.target.dataset.clubId);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll(".members-list .delete-btn").forEach((button) => {
          button.addEventListener("click", (e) => {
            removeMember(e.target.dataset.clubId, e.target.dataset.email);
          });
        });
        document.querySelectorAll(".events-list .delete-btn").forEach((button) => {
          button.addEventListener("click", (e) => {
            removeEvent(e.target.dataset.clubId, e.target.dataset.eventId);
          });
        });
      }
    } catch (error) {
      showMessage("Failed to load club details", "error");
      console.error("Error fetching club details:", error);
    }
  }

  // Function to open edit modal
  async function openEditModal(clubId) {
    try {
      const response = await fetch(`/clubs/${clubId}`);
      const club = await response.json();

      if (response.ok) {
        document.getElementById("edit-club-id").value = clubId;
        document.getElementById("edit-club-name").value = club.name;
        document.getElementById("edit-club-description").value = club.description;
        editModal.classList.remove("hidden");
      }
    } catch (error) {
      showMessage("Failed to load club data", "error");
      console.error("Error loading club:", error);
    }
  }

  // Function to open member modal
  function openMemberModal(clubId) {
    document.getElementById("member-club-id").value = clubId;
    document.getElementById("member-email").value = "";
    memberModal.classList.remove("hidden");
  }

  // Function to open event modal
  function openEventModal(clubId) {
    document.getElementById("event-club-id").value = clubId;
    document.getElementById("event-name").value = "";
    document.getElementById("event-description").value = "";
    document.getElementById("event-date").value = "";
    document.getElementById("event-location").value = "";
    eventModal.classList.remove("hidden");
  }

  // Function to delete club
  async function deleteClub(clubId) {
    if (!confirm("Are you sure you want to delete this club?")) {
      return;
    }

    try {
      const response = await fetch(`/clubs/${clubId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        fetchClubs();
      } else {
        showMessage(result.detail || "Failed to delete club", "error");
      }
    } catch (error) {
      showMessage("Failed to delete club. Please try again.", "error");
      console.error("Error deleting club:", error);
    }
  }

  // Function to remove member
  async function removeMember(clubId, email) {
    try {
      const response = await fetch(
        `/clubs/${encodeURIComponent(clubId)}/members?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        viewClubDetails(clubId);
      } else {
        showMessage(result.detail || "Failed to remove member", "error");
      }
    } catch (error) {
      showMessage("Failed to remove member. Please try again.", "error");
      console.error("Error removing member:", error);
    }
  }

  // Function to remove event
  async function removeEvent(clubId, eventId) {
    try {
      const response = await fetch(
        `/clubs/${encodeURIComponent(clubId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        viewClubDetails(clubId);
      } else {
        showMessage(result.detail || "Failed to remove event", "error");
      }
    } catch (error) {
      showMessage("Failed to remove event. Please try again.", "error");
      console.error("Error removing event:", error);
    }
  }

  // Handle create club form submission
  createClubForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("club-name").value;
    const description = document.getElementById("club-description").value;

    try {
      const response = await fetch("/clubs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });

      const result = await response.json();

      if (response.ok) {
        showMessage("Club created successfully!", "success");
        createClubForm.reset();
        fetchClubs();
      } else {
        showMessage(result.detail || "Failed to create club", "error");
      }
    } catch (error) {
      showMessage("Failed to create club. Please try again.", "error");
      console.error("Error creating club:", error);
    }
  });

  // Handle edit club form submission
  document.getElementById("edit-club-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const clubId = document.getElementById("edit-club-id").value;
    const name = document.getElementById("edit-club-name").value;
    const description = document.getElementById("edit-club-description").value;

    try {
      const response = await fetch(`/clubs/${clubId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });

      const result = await response.json();

      if (response.ok) {
        showMessage("Club updated successfully!", "success");
        editModal.classList.add("hidden");
        fetchClubs();
      } else {
        showMessage(result.detail || "Failed to update club", "error");
      }
    } catch (error) {
      showMessage("Failed to update club. Please try again.", "error");
      console.error("Error updating club:", error);
    }
  });

  // Handle add member form submission
  document.getElementById("add-member-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const clubId = document.getElementById("member-club-id").value;
    const email = document.getElementById("member-email").value;

    try {
      const response = await fetch(
        `/clubs/${encodeURIComponent(clubId)}/members?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        memberModal.classList.add("hidden");
        viewClubDetails(clubId);
      } else {
        showMessage(result.detail || "Failed to add member", "error");
      }
    } catch (error) {
      showMessage("Failed to add member. Please try again.", "error");
      console.error("Error adding member:", error);
    }
  });

  // Handle add event form submission
  document.getElementById("add-event-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const clubId = document.getElementById("event-club-id").value;
    const name = document.getElementById("event-name").value;
    const description = document.getElementById("event-description").value;
    const date = document.getElementById("event-date").value;
    const location = document.getElementById("event-location").value;

    try {
      const response = await fetch(`/clubs/${clubId}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description, date, location }),
      });

      const result = await response.json();

      if (response.ok) {
        showMessage("Event added successfully!", "success");
        eventModal.classList.add("hidden");
        viewClubDetails(clubId);
      } else {
        showMessage(result.detail || "Failed to add event", "error");
      }
    } catch (error) {
      showMessage("Failed to add event. Please try again.", "error");
      console.error("Error adding event:", error);
    }
  });

  // Close modals when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === clubModal) {
      clubModal.classList.add("hidden");
    }
    if (event.target === editModal) {
      editModal.classList.add("hidden");
    }
    if (event.target === memberModal) {
      memberModal.classList.add("hidden");
    }
    if (event.target === eventModal) {
      eventModal.classList.add("hidden");
    }
  });

  // Initialize app
  fetchClubs();
});
