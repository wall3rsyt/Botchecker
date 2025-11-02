const API_BASE_URL = 'https://servers-frontend.fivem.net/api';
const serverIdInput = document.getElementById('server-id');
const serverButton = document.getElementById('server-id-button');
const serverName = document.getElementById('server-name');
const serverIcon = document.getElementById('server-icon');
const serverPlayers = document.getElementById('server-players');
const playersBody = document.getElementById('players-body');
const loader = document.getElementById('loader');

let currentPlayers = [];

// Optional: known Dutch servers
const DUTCH_SERVER_IDS = ['abcd1234', 'nlserver01'];

serverButton.addEventListener('click', () => {
	const serverId = serverIdInput.value.trim();
	if (!serverId) return alert('Voer een server ID in!');
	fetchServer(serverId);
});

async function fetchServer(serverId) {
	showLoader(true);
	try {
		if (!/^[a-zA-Z0-9]+$/.test(serverId)) throw new Error('Invalid server ID.');

		const res = await fetch(`${API_BASE_URL}/servers/single/${serverId}`);
		const data = await res.json();

		if (!data.Data) throw new Error('Server not found.');
		
		// Botchecker: Dutch filter
		const lang = (data.Data.vars?.locale || data.Data.vars?.language || '').toLowerCase();
		const isDutch = lang === 'nl' || DUTCH_SERVER_IDS.includes(serverId);

		if (!isDutch) {
			alert('Deze server is geen Nederlandse server.');
			showLoader(false);
			return;
		}

		setServerInfo(serverId, data.Data);
		renderPlayers(data.Data.players || []);
	} catch (err) {
		console.error(err);
		alert(err.message);
	} finally {
		showLoader(false);
	}
}

function setServerInfo(serverId, data) {
	serverName.textContent = data.hostname;
	const iconUrl = `https://servers-live.fivem.net/servers/icon/${serverId}/${data.iconVersion}.png`;
	serverIcon.src = iconUrl;
	serverPlayers.textContent = `${data.clients}/${data.svMaxclients ?? data.sv_maxclients ?? 0} spelers`;
}

function renderPlayers(players) {
	playersBody.innerHTML = '';
	if (!players.length) {
		playersBody.innerHTML = '<tr><td colspan="6">Geen spelers online.</td></tr>';
		return;
	}

	currentPlayers = players.map(p => ({
		name: p.name,
		id: p.id,
		ping: p.ping,
		steam: (p.identifiers || []).find(i => i.startsWith('steam:'))?.replace('steam:', ''),
		discord: (p.identifiers || []).find(i => i.startsWith('discord:'))?.replace('discord:', '')
	}));

	currentPlayers.forEach((player, index) => {
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${index + 1}</td>
			<td><img src="img/empty-star.svg" alt="Favorite"></td>
			<td>${player.id}</td>
			<td>${player.name}</td>
			<td>
				${player.steam ? `<a href="https://steamcommunity.com/profiles/${player.steam}" target="_blank"><img src="img/steam.svg" alt="Steam"></a>` : ''}
				${player.discord ? `<a href="https://discord.com/users/${player.discord}" target="_blank"><img src="img/discord.svg" alt="Discord"></a>` : ''}
			</td>
			<td>${player.ping}ms</td>
		`;
		playersBody.appendChild(tr);
	});
}

function showLoader(visible) {
	loader.style.display = visible ? 'flex' : 'none';
}
