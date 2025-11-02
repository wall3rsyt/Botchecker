const LOCALE_API = "https://fivem-sl-api.onrender.com/fetchServersByLocale/NL-nl";
const FIVEM_SINGLE_API = "https://servers-frontend.fivem.net/api/servers/single";

let allServers = [];
let currentQuery = "";

// Bot score calculation
function calculateBotScore(player) {
  let score = 0;
  const name = (player.name || "").toLowerCase();
  const identifiers = player.identifiers || [];

  if (identifiers.length === 0) score += 2.0;

  const suspiciousNames = ['player','new','test','bot','fake','unknown'];
  if (suspiciousNames.some(s => name.includes(s)) || name.length < 3) score += 1.0;

  let hasSteam = false;
  let hasLicense = false;

  identifiers.forEach(id => {
    if (id.startsWith("steam:")) { hasSteam = true; if(id.length < 20) score += 0.5; }
    if (id.startsWith("license:")) { hasLicense = true; if(id.length < 20) score += 0.5; }
    if (id.startsWith("ip:")) score += 0.3;
  });

  if (!hasSteam && !hasLicense && identifiers.length > 0) score += 1.0;

  return score;
}

function isBot(player) {
  return calculateBotScore(player) >= 2.0;
}

// Fetch all NL servers from locale API
async function fetchServerList() {
  try {
    const res = await fetch(LOCALE_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Fetch single server details
async function fetchServerDetails(endpoint) {
  try {
    const res = await fetch(`${FIVEM_SINGLE_API}/${endpoint}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.Data || null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Render row in table
function renderServerRow(server, rank) {
  const tbody = document.getElementById("tableBody");
  const canvasId = `chart-${rank}`;
  let botClass = "low-bots";
  if (server.botPercent > 50) botClass = "high-bots";
  else if (server.botPercent > 20) botClass = "medium-bots";

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${rank}</td>
    <td><a href="fivem://connect/${server.EndPoint}" class="server-link">${server.hostname}</a></td>
    <td>${server.EndPoint}</td>
    <td>${server.totalPlayers}</td>
    <td>${server.realPlayers}</td>
    <td>${server.bots}</td>
    <td><span class="bot-percent ${botClass}">${server.botPercent}%</span></td>
    <td><canvas id="${canvasId}" width="80" height="80"></canvas></td>
    <td><span class="status-badge status-online">✓ Analyzed</span></td>
  `;
  tbody.appendChild(row);

  const ctx = document.getElementById(canvasId);
  if (ctx && server.totalPlayers > 0) {
    new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Echt','Bots'],
        datasets: [{
          data: [server.realPlayers, server.bots],
          backgroundColor: ['#00ff00','#ff3333'],
          borderWidth: 2,
          borderColor: '#0a0a0a'
        }]
      },
      options: {
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        responsive: true,
        maintainAspectRatio: true
      }
    });
  }
}

// Main load function
async function loadServers(query = "") {
  const loading = document.getElementById("loading");
  const tableContainer = document.getElementById("tableContainer");
  const statsBar = document.getElementById("statsBar");
  const tbody = document.getElementById("tableBody");
  const refreshBtn = document.getElementById("refreshBtn");
  const searchBtn = document.getElementById("searchBtn");

  loading.style.display = "block";
  tableContainer.style.display = "none";
  statsBar.style.display = "none";
  tbody.innerHTML = "";
  refreshBtn.disabled = true; 
  searchBtn.disabled = true;
  allServers = [];

  const serverList = await fetchServerList();
  if (!serverList.length) {
    loading.innerHTML = "<p>❌ Geen Nederlandse servers gevonden</p>";
    refreshBtn.disabled = false; searchBtn.disabled = false;
    return;
  }

  let filtered = serverList;
  if (query) {
    filtered = serverList.filter(s => 
      (s.EndPoint || "").toLowerCase().includes(query.toLowerCase()) ||
      (s.Data?.hostname || "").toLowerCase().includes(query.toLowerCase())
    );
  }

  // Alleen actieve servers
  filtered = filtered.filter(s => s.Data && (s.Data.clients > 0 || (s.Data.players && s.Data.players.length > 0)));
  filtered.sort((a,b) => (b.Data?.clients || b.Data?.players?.length || 0) - (a.Data?.clients || a.Data?.players?.length || 0));

  const top = filtered.slice(0, 20);
  if (!top.length) { loading.innerHTML = "<p>❌ Geen actieve servers gevonden</p>"; return; }

  document.getElementById("totalServers").textContent = top.length;

  let analyzed = 0, totalPlayers = 0, realPlayers = 0, totalBots = 0;

  // Parallel fetch van server details
  const serverDetails = await Promise.all(top.map(s => fetchServerDetails(s.EndPoint)));

  for (let i = 0; i < top.length; i++) {
    const s = top[i];
    const data = serverDetails[i];
    if (!data) continue;

    const players = data.players || [];
    let bots = 0, real = 0;
    players.forEach(p => isBot(p) ? bots++ : real++);
    const total = players.length;

    totalPlayers += total; realPlayers += real; totalBots += bots; analyzed++;

    const botPercent = total > 0 ? Math.round((bots / total) * 100) : 0;
    const serverObj = {
      hostname: data.hostname || "Onbekend",
      EndPoint: s.EndPoint,
      totalPlayers: total,
      realPlayers: real,
      bots: bots,
      botPercent: botPercent
    };
    allServers.push(serverObj);
    renderServerRow(serverObj, i + 1);
  }

  loading.style.display = "none";
  tableContainer.style.display = "block";
  statsBar.style.display = "flex";
  document.getElementById("analyzedServers").textContent = analyzed;
  document.getElementById("totalPlayers").textContent = totalPlayers;
  document.getElementById("realPlayers").textContent = realPlayers;
  document.getElementById("totalBots").textContent = totalBots;

  refreshBtn.disabled = false; searchBtn.disabled = false;
}

function search() {
  currentQuery = document.getElementById("searchInput").value.trim();
  loadServers(currentQuery);
}

document.getElementById("refreshBtn").addEventListener("click", () => loadServers());
document.getElementById("searchBtn").addEventListener("click", search);
window.addEventListener("DOMContentLoaded", () => loadServers());
