document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message / previous list
      activitiesList.innerHTML = "";

      // Reset select options (keep placeholder)
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants";

        const header = document.createElement("div");
        header.className = "participants-header";
        const title = document.createElement("span");
        title.textContent = "Participants";
        const count = document.createElement("span");
        count.className = "participant-count";
        count.textContent = details.participants.length;
        header.appendChild(title);
        header.appendChild(count);
        participantsSection.appendChild(header);

        if (details.participants.length === 0) {
          const empty = document.createElement("div");
          empty.className = "no-participants";
          empty.textContent = "No participants yet. Be the first!";
          participantsSection.appendChild(empty);
        } else {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant";

            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";
            // Create initials from email/name
            const initials = (p.split("@")[0] || "").split(".").map(s => s[0] || "").slice(0,2).join("").toUpperCase();
            avatar.textContent = initials || "S";

            const label = document.createElement("span");
            label.textContent = p;

            // Delete / unregister button
            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "participant-delete";
            deleteBtn.title = `Unregister ${p}`;
            deleteBtn.setAttribute('aria-label', `Unregister ${p}`);
            // use a simple cross mark for the icon
            deleteBtn.textContent = "×";

            // When clicked, call the unregister endpoint and refresh the list
            deleteBtn.addEventListener("click", async (ev) => {
              ev.stopPropagation();
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );

                const result = await resp.json().catch(() => ({}));

                if (resp.ok) {
                  messageDiv.textContent = result.message || `${p} has been unregistered.`;
                  messageDiv.className = "success";
                  // refresh
                  fetchActivities();
                } else {
                  messageDiv.textContent = result.detail || result.message || "Failed to unregister participant.";
                  messageDiv.className = "error";
                }

                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 5000);
              } catch (error) {
                console.error("Error unregistering participant:", error);
                messageDiv.textContent = "Failed to unregister. Please try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            });

            li.appendChild(avatar);
            li.appendChild(label);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });
          participantsSection.appendChild(ul);
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh the activities so the participants list updates
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
});
