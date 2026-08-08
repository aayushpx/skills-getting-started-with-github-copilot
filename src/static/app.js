document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function setMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities?_=" + Date.now(), { cache: "no-store" });
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants:</strong>
            ${details.participants.length > 0
              ? `<ul class="participants-list">${details.participants
                  .map(
                    (participant) => `
                      <li class="participant-chip">
                        <span class="participant-email">${participant}</span>
                        <button
                          type="button"
                          class="participant-remove-btn"
                          data-activity="${name}"
                          data-email="${participant}"
                          aria-label="Remove ${participant}"
                        >
                          ×
                        </button>
                      </li>`
                  )
                  .join("")}</ul>`
              : '<p class="participants-empty">No participants yet.</p>'}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      activitiesList.querySelectorAll(".participant-remove-btn").forEach((button) => {
        button.addEventListener("click", async (event) => {
          const activityName = event.currentTarget.dataset.activity;
          const email = event.currentTarget.dataset.email;

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(email)}?_=" + Date.now(),
              { method: "DELETE", cache: "no-store" }
            );
            const result = await response.json();

            if (response.ok) {
              setMessage(result.message, "success");
              await fetchActivities();
            } else {
              setMessage(result.detail || "Unable to remove participant.", "error");
            }
          } catch (error) {
            console.error("Error removing participant:", error);
            setMessage("Failed to remove participant. Please try again.", "error");
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}&_=" + Date.now(),
        {
          method: "POST",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        setMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      setMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  fetchActivities();
});
