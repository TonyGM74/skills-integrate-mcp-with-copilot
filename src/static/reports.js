document.addEventListener("DOMContentLoaded", () => {
  let participationChart = null;
  let occupancyChart = null;

  // Function to fetch statistics from API
  async function fetchStatistics() {
    try {
      const response = await fetch("/statistics");
      const data = await response.json();

      // Update summary statistics
      document.getElementById("total-activities").textContent =
        data.summary.total_activities;
      document.getElementById("total-participants").textContent =
        data.summary.total_participants;
      document.getElementById("total-capacity").textContent =
        data.summary.total_capacity;
      document.getElementById("occupancy-rate").textContent =
        data.summary.overall_occupancy_rate + "%";

      // Create charts
      createCharts(data.activities);

      // Populate reports table
      populateReportsTable(data.activities);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      document.getElementById("summary-stats").innerHTML =
        "<p>Failed to load statistics. Please try again later.</p>";
    }
  }

  // Function to fetch detailed reports
  async function fetchReports() {
    try {
      const response = await fetch("/reports");
      const reports = await response.json();

      // Populate participants details
      populateParticipantsDetails(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      document.getElementById("participants-details").innerHTML =
        "<p>Failed to load participant details. Please try again later.</p>";
    }
  }

  // Function to create charts
  function createCharts(activities) {
    const activityNames = activities.map((a) => a.name);
    const participantCounts = activities.map((a) => a.participant_count);
    const occupancyRates = activities.map((a) => a.occupancy_rate);

    // Create Participation Bar Chart using CSS
    createCSSBarChart(
      "participationChart",
      activityNames,
      participantCounts,
      "Participants",
      Math.max(...participantCounts)
    );

    // Create Occupancy Rate Bar Chart using CSS
    createOccupancyBarChart(
      "occupancyChart",
      activityNames,
      occupancyRates
    );
  }

  // Function to create CSS-based bar chart
  function createCSSBarChart(containerId, labels, data, labelText, maxValue) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const chartDiv = document.createElement("div");
    chartDiv.className = "css-bar-chart";

    labels.forEach((label, index) => {
      const barRow = document.createElement("div");
      barRow.className = "bar-row";

      const barLabel = document.createElement("div");
      barLabel.className = "bar-label";
      barLabel.textContent = label;

      const barContainer = document.createElement("div");
      barContainer.className = "bar-container";

      const bar = document.createElement("div");
      bar.className = "bar";
      const percentage = maxValue > 0 ? (data[index] / maxValue) * 100 : 0;
      bar.style.width = percentage + "%";
      bar.style.backgroundColor = "#1a237e";

      const barValue = document.createElement("span");
      barValue.className = "bar-value";
      barValue.textContent = data[index];

      bar.appendChild(barValue);
      barContainer.appendChild(bar);
      barRow.appendChild(barLabel);
      barRow.appendChild(barContainer);
      chartDiv.appendChild(barRow);
    });

    container.appendChild(chartDiv);
  }

  // Function to create occupancy bar chart
  function createOccupancyBarChart(containerId, labels, data) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const chartDiv = document.createElement("div");
    chartDiv.className = "css-bar-chart";

    labels.forEach((label, index) => {
      const barRow = document.createElement("div");
      barRow.className = "bar-row";

      const barLabel = document.createElement("div");
      barLabel.className = "bar-label";
      barLabel.textContent = label;

      const barContainer = document.createElement("div");
      barContainer.className = "bar-container";

      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.width = data[index] + "%";

      // Color coding based on occupancy rate
      if (data[index] >= 75) {
        bar.style.backgroundColor = "#2e7d32"; // Green
      } else if (data[index] >= 50) {
        bar.style.backgroundColor = "#ffc107"; // Yellow
      } else {
        bar.style.backgroundColor = "#c62828"; // Red
      }

      const barValue = document.createElement("span");
      barValue.className = "bar-value";
      barValue.textContent = data[index] + "%";

      bar.appendChild(barValue);
      barContainer.appendChild(bar);
      barRow.appendChild(barLabel);
      barRow.appendChild(barContainer);
      chartDiv.appendChild(barRow);
    });

    container.appendChild(chartDiv);
  }

  // Function to populate reports table
  function populateReportsTable(activities) {
    const tableBody = document.getElementById("reports-table-body");
    tableBody.innerHTML = "";

    activities.forEach((activity) => {
      const row = document.createElement("tr");

      // Apply color coding based on occupancy rate
      let rowClass = "";
      if (activity.occupancy_rate >= 75) {
        rowClass = "high-occupancy";
      } else if (activity.occupancy_rate >= 50) {
        rowClass = "medium-occupancy";
      } else {
        rowClass = "low-occupancy";
      }
      row.className = rowClass;

      row.innerHTML = `
        <td><strong>${activity.name}</strong></td>
        <td>${activity.participant_count}</td>
        <td>${activity.max_participants}</td>
        <td>${activity.available_spots}</td>
        <td>${activity.occupancy_rate}%</td>
        <td>${getScheduleFromActivity(activity.name)}</td>
      `;

      tableBody.appendChild(row);
    });
  }

  // Function to populate participants details
  function populateParticipantsDetails(reports) {
    const detailsContainer = document.getElementById("participants-details");
    detailsContainer.innerHTML = "";

    reports.forEach((report) => {
      const activityDiv = document.createElement("div");
      activityDiv.className = "activity-detail-card";

      const participantsList =
        report.participants.length > 0
          ? `<ul class="participants-list">
            ${report.participants.map((email) => `<li>${email}</li>`).join("")}
          </ul>`
          : `<p class="no-participants"><em>No participants yet</em></p>`;

      activityDiv.innerHTML = `
        <h4>${report.activity_name}</h4>
        <p class="activity-info"><strong>Schedule:</strong> ${report.schedule}</p>
        <p class="activity-info"><strong>Capacity:</strong> ${report.participant_count}/${report.max_participants}</p>
        <div class="participants-section">
          <h5>Registered Students (${report.participant_count}):</h5>
          ${participantsList}
        </div>
      `;

      detailsContainer.appendChild(activityDiv);
    });
  }

  // Helper function to get schedule (would normally come from API)
  function getScheduleFromActivity(activityName) {
    const schedules = {
      "Chess Club": "Fridays, 3:30 PM - 5:00 PM",
      "Programming Class": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
      "Gym Class": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
      "Soccer Team": "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
      "Basketball Team": "Wednesdays and Fridays, 3:30 PM - 5:00 PM",
      "Art Club": "Thursdays, 3:30 PM - 5:00 PM",
      "Drama Club": "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
      "Math Club": "Tuesdays, 3:30 PM - 4:30 PM",
      "Debate Team": "Fridays, 4:00 PM - 5:30 PM",
    };
    return schedules[activityName] || "N/A";
  }

  // Initialize the reports page
  fetchStatistics();
  fetchReports();
});
