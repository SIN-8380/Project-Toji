    let currentBoxElement = null;
    let currentEditBox = null;
    let playExercises = [];
    let playIndex = 0;
    let currentSet = 1;
    let playTimerInterval = null;
    const timerBeep = new Audio('/public/sounds/timer.wav');




    if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(() => console.log('Service Worker Registered'))
    .catch((err) => console.error('Service Worker Failed:', err));
}




  document.querySelector("header .btn").addEventListener("click", () => {
  document.getElementById("app").style.display = "none";
  document.getElementById("settingsPage").style.display = "flex";
});



function closeSettings() {
  document.getElementById("app").style.display = "block";
  document.getElementById("settingsPage").style.display = "none";
}

function showSettingsSection(section) {
  const content = document.getElementById("settingsContent");

  if (section === "signIn") {
    content.innerHTML = `
      <h2>Sign In</h2>
      <input type="text" placeholder="Username" class="input"/><br><br>
      <input type="password" placeholder="Password" class="input"/><br><br>
      <button class="btn">Login</button>
    `;
  } else if (section === "account") {
    content.innerHTML = `
      <h2>Account</h2>
      <p>Email: user@example.com</p>
      <p>Plan: Free</p>
      <button class="btn" onclick="confirm('Are you sure you want to delete your account?') && alert('Account deleted.')">Delete Account</button>
    `;
  }
}

    document.getElementById("dateDisplay").textContent = new Date().toLocaleDateString("en-US", {
  year: "2-digit",
  month: "numeric",
  day: "numeric"
});

function openAddWorkoutModal() {
  document.getElementById("addBoxModal").style.display = "flex";
  document.getElementById("newBoxName").focus();
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

function createWorkoutBox() {
  const container = document.getElementById("workoutContainer");
  const name = document.getElementById("newBoxName").value || "Workout Box";
  const prepTime = parseInt(document.getElementById("prepTimeInput").value || "0");

  const box = document.createElement("div");
  box.className = "workout-box";
  box.dataset.prepTime = prepTime;

  box.innerHTML = `
    <div class="workout-header">
      <h3 contenteditable="true">${name}</h3>
      <div>
        <button class="btn" onclick="openEditOptions(this)">Edit</button>
        <button class="btn" onclick="startPlayMode(this)">Play</button>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Set</th>
          <th>Rep</th>
          <th>Time</th>
          <th>Rest</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

  container.appendChild(box);
  document.getElementById("newBoxName").value = "";
  document.getElementById("prepTimeInput").value = ""; // Clear input after creation
  closeModal('addBoxModal');
  saveToLocalStorage();
}


function startPlayMode(btn) {
  const box = btn.closest(".workout-box");
  const rows = Array.from(box.querySelectorAll("tbody tr"));

  if (rows.length === 0) {
    alert("You haven't added any exercises yet.");
    return;
  }

  timerBeep.play().then(() => {
    timerBeep.pause();
    timerBeep.currentTime = 0;
  }).catch(err => {
    console.warn("Audio not unlocked yet:", err);
  });

  playExercises = rows.map(row => {
    return {
      name: row.children[0].innerText,
      set: parseInt(row.children[1].innerText),
      rep: parseInt(row.children[2].innerText),
      time: parseInt(row.children[3].innerText),
      rest: parseInt(row.children[4].innerText),
      restAfter: parseInt(row.dataset.restAfter || 20)
    };
  });

  playIndex = 0;
currentSet = 1;
document.getElementById("playScreen").style.display = "flex";

timerBeep.play().then(() => {
  timerBeep.pause();
  timerBeep.currentTime = 0;
}).catch(e => {
  console.warn("Audio unlock failed:", e);
});

const prep = parseInt(box.dataset.prepTime || "0");
if (prep > 0) {
  let t = prep;
  const timerEl = document.getElementById("playTimer");
  document.getElementById("playExerciseName").innerText = "Get Ready";
  document.getElementById("playExerciseDetails").innerText = `Starting in...`;
  timerEl.innerText = `${t}s`;
  playTimerInterval = setInterval(() => {
    t--;
    timerEl.innerText = `${t}s`;
    if (t === 4) timerBeep.play();
    if (t <= 0) {
      clearInterval(playTimerInterval);
      showCurrentSet(); // 🔥 Start workout after prep
    }
  }, 1000);
} else {
  showCurrentSet(); // 🚀 Start immediately
}
}

function showCurrentSet() {
  clearInterval(playTimerInterval);
  const ex = playExercises[playIndex];
  const playName = document.getElementById("playExerciseName");
  const playDetails = document.getElementById("playExerciseDetails");
  const timerEl = document.getElementById("playTimer");

  playName.innerText = ex.name;
  playDetails.innerText = `Set: ${ex.set}/${currentSet} | Rep: ${ex.rep}`;
  timerEl.innerText = "";

  if (ex.rep === 0 && ex.time > 0) {
    let t = ex.time;
    timerEl.innerText = `${t}s`;
    playTimerInterval = setInterval(() => {
      t--;
      timerEl.innerText = `${t}s`;

      if (t === 4) timerBeep.play();
      if (t <= 0) {
        clearInterval(playTimerInterval);
        setTimeout(() => {
          const isFinalSet = currentSet >= ex.set;
          startRestPhase(isFinalSet ? ex.restAfter : ex.rest, isFinalSet);
        }, 500);
      }
    }, 1000);
  }
}

function nextSetOrExercise() {
  clearInterval(playTimerInterval);
  const ex = playExercises[playIndex];

  if (currentSet < ex.set) {
    startRestPhase(ex.rest, false);
  } else {
    startRestPhase(ex.restAfter, true);
  }
}

function startRestPhase(duration, moveToNext) {
  const timerEl = document.getElementById("playTimer");
  document.getElementById("playExerciseDetails").innerText = moveToNext ? "Rest between exercises..." : `Rest before set ${currentSet + 1}`;
  let t = duration;
  timerEl.innerText = `${t}s`;
  playTimerInterval = setInterval(() => {
    t--;
    timerEl.innerText = `${t}s`;
    if (t === 4) timerBeep.play();
    if (t <= 0) {
      clearInterval(playTimerInterval);
      if (moveToNext) {
        playIndex++;
        currentSet = 1;
        if (playIndex >= playExercises.length) return exitPlayMode();
      } else {
        currentSet++;
      }
      showCurrentSet();
    }
  }, 1000);
}
/*
function exitPlayMode() {
  document.getElementById("playScreen").style.display = "none";
  clearInterval(playTimerInterval);
  if (!timerBeep.paused) {
    timerBeep.pause();
    timerBeep.currentTime = 0;
  }
  // ✅ Update total completed workouts
let count = parseInt(localStorage.getItem("totalWorkouts") || "0");
localStorage.setItem("totalWorkouts", count + 1);

// ✅ Update last workout date
const today = new Date().toISOString().split("T")[0];
localStorage.setItem("lastWorkoutDate", today);

// ✅ Mark today as completed on the chart
  markTodayWorkoutComplete();
}
*/

function exitPlayMode() {
  document.getElementById("playScreen").style.display = "none";
  clearInterval(playTimerInterval);

  if (!timerBeep.paused) {
    timerBeep.pause();
    timerBeep.currentTime = 0;
  }

  // ✅ Get today's date in Philippines timezone
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }); // e.g., 2025-06-26

  // ✅ Only count streak once per day
  const lastStreakEval = localStorage.getItem("lastStreakEvaluatedDate");
  if (lastStreakEval !== today) {
    evaluateWorkoutStreak(today); // pass today as argument
    localStorage.setItem("lastStreakEvaluatedDate", today);
  }

  // ✅ Update total completed workouts
  let count = parseInt(localStorage.getItem("totalWorkouts") || "0");
  localStorage.setItem("totalWorkouts", count + 1);

  // ✅ Update last workout date
  localStorage.setItem("lastWorkoutDate", today);

  // ✅ Update chart data
  markTodayWorkoutComplete();
}


function openEditOptions(button) {
  currentBoxElement = button.closest(".workout-box");
  document.getElementById("editOptionsModal").style.display = "flex";
}

function openAddExerciseModal() {
  closeModal('editOptionsModal');
  ['exName','exSet','exRep','exTime','exRest','exRestBetween'].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("addExerciseModal").style.display = "flex";
}

function saveNewExercise() {
  const name = document.getElementById("exName").value.trim();
  const set = +document.getElementById("exSet").value;
  const rep = +document.getElementById("exRep").value;
  const time = +document.getElementById("exTime").value;
  const rest = +document.getElementById("exRest").value;
  const restBetween = +document.getElementById("exRestBetween").value || 20;

  if (!name || set < 1) return alert("Name and Set are required");
  const tbody = currentBoxElement.querySelector("tbody");
  const tr = document.createElement("tr");
  tr.dataset.restAfter = restBetween;
  tr.innerHTML = `<td>${name}</td><td>${set}</td><td>${rep}</td><td>${time}</td><td>${rest}</td>`;
  tbody.appendChild(tr);
  closeModal('addExerciseModal');
  saveToLocalStorage();
}

function openEditBoxModal() {
  closeModal('editOptionsModal');
  const boxName = currentBoxElement.querySelector("h3").innerText;
  document.getElementById("editBoxName").value = boxName;
  const list = document.getElementById("editExerciseList");
  list.innerHTML = "";
  const rows = currentBoxElement.querySelectorAll("tbody tr");
  rows.forEach((row, index) => {
    const div = document.createElement("div");
    div.className = "exercise-edit";
    div.innerHTML = `
      <span>${row.children[0].innerText}</span>
      <button onclick="moveExercise(${index}, -1)">↑</button>
      <button onclick="moveExercise(${index}, 1)">↓</button>
      <button onclick="deleteExercise(${index})">✖</button>
    `;
    list.appendChild(div);
  });
  document.getElementById("editBoxModal").style.display = "flex";
  document.getElementById("editBoxName").oninput = function () {
    currentBoxElement.querySelector("h3").innerText = this.value;
  };
}

function moveExercise(index, dir) {
  const tbody = currentBoxElement.querySelector("tbody");
  const rows = Array.from(tbody.children);
  const target = index + dir;
  if (target < 0 || target >= rows.length) return;
  tbody.insertBefore(rows[index], dir === 1 ? rows[target].nextSibling : rows[target]);
  openEditBoxModal();
  saveToLocalStorage();
}

function deleteExercise(index) {
  const tbody = currentBoxElement.querySelector("tbody");
  tbody.removeChild(tbody.children[index]);
  openEditBoxModal();
  saveToLocalStorage();
}

function deleteWorkoutBox() {
  if (!currentBoxElement) return;
  if (confirm("Are you sure you want to delete this entire workout box?")) {
    currentBoxElement.remove();
    closeModal('editBoxModal');
    currentBoxElement = null;
  }
  saveToLocalStorage();
}

function saveToLocalStorage() {
  const boxes = [];
  document.querySelectorAll('.workout-box').forEach(box => {
    const name = box.querySelector('h3').innerText;
    const exercises = [];
    box.querySelectorAll('tbody tr').forEach(row => {
      exercises.push({
        name: row.children[0].innerText,
        set: parseInt(row.children[1].innerText),
        rep: parseInt(row.children[2].innerText),
        time: parseInt(row.children[3].innerText),
        rest: parseInt(row.children[4].innerText),
        restAfter: parseInt(row.dataset.restAfter || 20)
      });
    });
    boxes.push({ name, exercises });
  });
  localStorage.setItem('workouts', JSON.stringify(boxes));
}

function loadFromLocalStorage() {
  const saved = JSON.parse(localStorage.getItem('workouts') || '[]');
  saved.forEach(box => createWorkoutBoxFromData(box.name, box.exercises));
}

function createWorkoutBoxFromData(name, exercises) {
  const container = document.getElementById("workoutContainer");

  const box = document.createElement("div");
  box.className = "workout-box";
  box.innerHTML = `
    <div class="workout-header">
      <h3 contenteditable="true">${name}</h3>
      <div>
        <button class="btn" onclick="openEditOptions(this)">Edit</button>
        <button class="btn" onclick="startPlayMode(this)">Play</button>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Name</th><th>Set</th><th>Rep</th><th>Time</th><th>Rest</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;
  container.appendChild(box);

  const tbody = box.querySelector("tbody");
  exercises.forEach(ex => {
    const tr = document.createElement("tr");
    tr.dataset.restAfter = ex.restAfter || 20;
    tr.innerHTML = `<td>${ex.name}</td><td>${ex.set}</td><td>${ex.rep}</td><td>${ex.time}</td><td>${ex.rest}</td>`;
    tbody.appendChild(tr);
  });

  box.querySelector("h3").addEventListener("input", saveToLocalStorage);
}

function openProfileScreen() {
  document.getElementById("app").style.display = "none";
  document.getElementById("profilePage").style.display = "block";

  // Update total boxes
  document.getElementById("totalBoxes").innerText = document.querySelectorAll(".workout-box").length;

  // Target correct <strong> elements in order
  const statStrongTags = document.querySelectorAll(".profile-stats .stat-row span strong");

  if (statStrongTags.length < 3) {
    console.error("❌ Not enough stat elements found.");
    return;
  }

  statStrongTags[0].innerText = localStorage.getItem('totalWorkouts') || 0;
  statStrongTags[1].innerText = (localStorage.getItem('workoutStreak') || '0') + ' Days';
  statStrongTags[2].innerText = localStorage.getItem('lastWorkoutDate') || 'N/A';
}

function closeProfileScreen() {
  document.getElementById("profilePage").style.display = "none";
  document.getElementById("app").style.display = "block";
}


/*
function evaluateWorkoutStreak() {
  const today = new Date().toISOString().split("T")[0];
  const last = localStorage.getItem("lastWorkoutDate") || null;
  const streak = parseInt(localStorage.getItem("workoutStreak") || "0");

  if (!last) return;

  const diff = (new Date(today) - new Date(last)) / (1000 * 60 * 60 * 24);

  if (diff === 1) {
    localStorage.setItem("workoutStreak", streak + 1);
  } else if (diff > 1) {
    localStorage.setItem("workoutStreak", 1);
  }
}
*/

function evaluateWorkoutStreak(today) {
  const last = localStorage.getItem("lastWorkoutDate") || null;
  const streak = parseInt(localStorage.getItem("workoutStreak") || "0");

  if (!last) {
    localStorage.setItem("workoutStreak", 1);
    return;
  }

  const diff = (new Date(today) - new Date(last)) / (1000 * 60 * 60 * 24);

  if (diff === 1) {
    localStorage.setItem("workoutStreak", streak + 1);
  } else if (diff > 1) {
    localStorage.setItem("workoutStreak", 1);
  }
}
window.addEventListener("DOMContentLoaded", () => {
  evaluateWorkoutStreak();
  

  const profilePic = document.getElementById("profilePic");
  const avatarUpload = document.getElementById("avatarUpload");
  const profileNameDisplay = document.getElementById("profileNameDisplay");
  const profileNameInput = document.getElementById("profileNameInput");

  // Load saved data
  const savedName = localStorage.getItem("profileName");
  const savedAvatar = localStorage.getItem("profileAvatar");

  if (savedName) profileNameDisplay.textContent = savedName;
  if (savedAvatar) profilePic.src = savedAvatar;

  // Avatar click-to-upload
  profilePic.addEventListener("click", () => avatarUpload.click());

  avatarUpload.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const base64 = e.target.result;
      profilePic.src = base64;
      localStorage.setItem("profileAvatar", base64);
    };
    reader.readAsDataURL(file);
  });

  // Name click to edit
  profileNameDisplay.addEventListener("click", () => {
    profileNameInput.value = profileNameDisplay.textContent;
    profileNameDisplay.style.visibility = "hidden"; // Freeze layout
    profileNameInput.style.display = "inline-block";
    profileNameInput.focus();
  });
  
  

const ctx = document.getElementById('workoutChart').getContext('2d');

const savedWorkoutData = JSON.parse(localStorage.getItem("weeklyWorkoutData")) || {
  labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  data: [0, 0, 0, 0, 0, 0, 0]
};

window.workoutChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: savedWorkoutData.labels,
    datasets: [{
      label: 'Workouts This Week',
      data: savedWorkoutData.data,
      backgroundColor: 'goldenrod'
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0
        }
      }
    }
  }
});
});


function markTodayWorkoutComplete() {
  const today = new Date();
  const weekday = today.getDay();
  
  const workoutData = JSON.parse(localStorage.getItem("weeklyWorkoutData")) || {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    data: [0, 0, 0, 0, 0, 0, 0]
  };
  
  workoutData.data[weekday] += 1;
  localStorage.setItem("weeklyWorkoutData", JSON.stringify(workoutData));
  
  if (window.workoutChart) {
    window.workoutChart.data.datasets[0].data = workoutData.data;
    window.workoutChart.update();
  }
}
function resetEverything() {
  if (!confirm("⚠️ Are you absolutely sure? This will DELETE ALL your data.")) return;
  
  // Clear all localStorage keys related to your app
  localStorage.removeItem("workouts");
  localStorage.removeItem("profileName");
  localStorage.removeItem("profileAvatar");
  localStorage.removeItem("totalWorkouts");
  localStorage.removeItem("lastWorkoutDate");
  localStorage.removeItem("weeklyWorkoutData");
  localStorage.removeItem("workoutStreak");
  localStorage.removeItem("maxStreak");
  localStorage.removeItem("totalTimeTrained");
  // If you added a calendar tracker:
  localStorage.removeItem("workoutCalendar");
  
  // Clear DOM content
  document.getElementById("workoutContainer").innerHTML = "";
  
  // Reload to reset all
  location.reload();
}

window.addEventListener("DOMContentLoaded", loadFromLocalStorage);