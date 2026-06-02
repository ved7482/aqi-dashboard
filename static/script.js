/* Limits */
const HISTORY_LIMIT = 50;
const ANALYTICS_LIMIT = 30;
const DASHBOARD_LIMIT = 25;

/* Navigation */
function showSection(section, element) {

  document.querySelectorAll("main > section")
    .forEach(s => s.classList.add("hidden"));

  document.getElementById(section).classList.remove("hidden");

  document.querySelectorAll(".sidebar nav a")
    .forEach(a => a.classList.remove("active"));

  element.classList.add("active");
}

/* MAIN DASHBOARD CHART */
const chart = new Chart(document.getElementById("chart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "PM2.5",
      data: [],
      borderColor: "#22c55e",
      tension: 0.4
    }]
  }
});

/* ANALYTICS CHART */
const analyticsChart = new Chart(document.getElementById("analyticsChart"), {
  type: "bar",
  data: {
    labels: [],
    datasets: [{
      label: "PM2.5 Trend",
      data: [],
      backgroundColor: "#3b82f6"
    }]
  }
});

/* AQI STATUS */
function getStatus(pm) {
  if (pm <= 50) return "Good 😊";
  if (pm <= 100) return "Moderate 😐";
  if (pm <= 200) return "Poor 😷";
  if (pm <= 300) return "Very Poor 😫";
  return "Hazardous ☠️";
}

let lastTime = "";

async function fetchData() {
  const res = await fetch("/api/data");
  const d = await res.json();

  // 🚨 IMPORTANT: prevent duplicate updates
  if (d.time === lastTime) return;

  lastTime = d.time;

  console.log("New Data:", d);

  // Update cards
  document.getElementById("pm").textContent = d.pm2_5;
  document.getElementById("gas").textContent = d.gas;
  document.getElementById("temp").textContent = d.temperature;
  document.getElementById("hum").textContent = d.humidity;

  const status = getStatus(d.pm2_5);
  document.getElementById("status").textContent = "AQI Status: " + status;

  // Table update
  const table = document.getElementById("historyTable");

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${d.time}</td>
    <td>${d.pm2_5}</td>
    <td>${d.gas}</td>
    <td>${d.temperature}</td>
    <td>${d.humidity}</td>
  `;

  table.appendChild(row);

  while (table.rows.length > HISTORY_LIMIT + 1) {
    table.deleteRow(1);
  }

  // Chart update
  chart.data.labels.push(d.time);
  chart.data.datasets[0].data.push(d.pm2_5);

  if (chart.data.labels.length > DASHBOARD_LIMIT) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }

  chart.update();
}

/* Auto refresh */
setInterval(fetchData, 2000);
fetchData();

/* Clock */
setInterval(() => {
  document.getElementById("clock").textContent =
    new Date().toLocaleTimeString();
}, 1000);