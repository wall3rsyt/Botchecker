const BASE_URL = 'https://servers-frontend.fivem.net/api/servers';
const ALL_SERVERS_URL = `${BASE_URL}/streamRedir/`;

let allServers = [];
let currentQuery = "";

// Bot-check functies
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
    if (id.startsWith("steam:")) { hasSteam = true; if(id.length<20) score+=0.5; }
    if (id.startsWith("license:")) { hasLicense = true; if(id.length<20) score+=0.5; }
    if (id.startsWith("ip:")) score+=0.3;
  });

  if(!hasSteam && !hasLicense && identifiers.length>0) score+=1.0;

  return score;
}

function isBot(player) {
  return calculateBotScore(player) >= 2.0;
}

// Render tabelrij
function renderServerRow(server, rank) {
  const tbody = document.getElementById("tableBody");
  const canvasId = `chart-${rank}`;
  let botClass = "low-bots";
  if(server.botPercent>50) botClass="high-bots";
  else if(server.botPercent>20) botClass="medium-bots";

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
  if(ctx && server.totalPlayers>0){
    new Chart(ctx.getContext('2d'), {
      type:'doughnut',
      data:{
        labels:['Echt','Bots'],
        datasets:[{data:[server.realPlayers,server.bots],backgroundColor:['#00ff00','#ff3333'],borderWidth:2,borderColor:'#0a0a0a'}]
      },
      options:{plugins:{legend:{display:false},tooltip:{enabled:false}},responsive:true,maintainAspectRatio:true}
    });
  }
}

// Fetch alle servers (stream)
async function loadServers(query="") {
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
  refreshBtn.disabled = true; searchBtn.disabled = true;
  allServers = [];

  try {
    const res = await fetch(ALL_SERVERS_URL);
    if(!res.body) throw new Error("Geen body stream beschikbaar");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let rank = 1;

    while(true){
      const { done, value } = await reader.read();
      if(done) break;

      const chunk = decoder.decode(value, {stream:true});
      const lines = chunk.split("\n").filter(l=>l.trim());
      for(const line of lines){
        try {
          const srv = JSON.parse(line);
          const data = srv.Data;
          if(!data || !data.vars || data.vars.locale !== "NL-nl") continue;

          const players = data.players || [];
          let bots=0, real=0;
          players.forEach(p=>isBot(p)?bots++:real++);
          const total = players.length;
          const botPercent = total>0 ? Math.round((bots/total)*100) : 0;

          const serverObj = {
            hostname: data.hostname || "Onbekend",
            EndPoint: srv.EndPoint,
            totalPlayers: total,
            realPlayers: real,
            bots: bots,
            botPercent: botPercent
          };

          // filter op zoekterm
          if(query && !(srv.EndPoint.toLowerCase().includes(query.toLowerCase()) || (data.hostname||"").toLowerCase().includes(query.toLowerCase()))) continue;

          allServers.push(serverObj);
          renderServerRow(serverObj, rank);
          rank++;
        } catch(e){
          console.error("Fout bij verwerken server line:", e);
        }
      }
    }

    if(allServers.length===0){
      loading.innerHTML="<p>❌ Geen Nederlandse servers gevonden</p>";
    } else {
      loading.style.display="none";
      tableContainer.style.display="block";
      statsBar.style.display="flex";

      const totalPlayers = allServers.reduce((a,s)=>a+s.totalPlayers,0);
      const realPlayers = allServers.reduce((a,s)=>a+s.realPlayers,0);
      const totalBots = allServers.reduce((a,s)=>a+s.bots,0);

      document.getElementById("totalServers").textContent = allServers.length;
      document.getElementById("analyzedServers").textContent = allServers.length;
      document.getElementById("totalPlayers").textContent = totalPlayers;
      document.getElementById("realPlayers").textContent = realPlayers;
      document.getElementById("totalBots").textContent = totalBots;
    }

  } catch(err){
    console.error(err);
    loading.innerHTML = "<p>❌ Fout bij het ophalen van servers</p>";
  }

  refreshBtn.disabled = false;
  searchBtn.disabled = false;
}

function search(){
  currentQuery = document.getElementById("searchInput").value.trim();
  loadServers(currentQuery);
}

document.getElementById("refreshBtn").addEventListener("click",()=>loadServers());
document.getElementById("searchBtn").addEventListener("click",search);
window.addEventListener("DOMContentLoaded",()=>loadServers());
