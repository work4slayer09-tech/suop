const messagesEl = document.getElementById('messages');
const messageForm = document.getElementById('message-form');
const inputEl = document.getElementById('message-input');
const channelTitle = document.getElementById('channel-title');
const presenceEl = document.getElementById('presence');
const sidebarChannels = document.getElementById('sidebar-channels');
const sidebarServers = document.getElementById('sidebar-servers');
const dmListEl = document.getElementById('dm-list');
const meSummary = document.getElementById('me-summary');
const profileModal = document.getElementById('profile-modal');
const profileBody = document.getElementById('profile-body');
const profileName = document.getElementById('profile-name');

let current = { serverId: null, channelId: null, dmUserId: null };
let me = null;

async function fetchMe() {
  const token = localStorage.getItem('suop_token');
  if (!token) return null;
  const res = await fetch('http://localhost:3000/api/users/me', { headers: { Authorization: 'Bearer ' + token }});
  if (res.ok) {
    me = await res.json();
    renderMeSummary();
    return me;
  }
  return null;
}

async function fetchUsers() {
  const token = localStorage.getItem('suop_token');
  const res = await fetch('http://localhost:3000/api/users', { headers: { Authorization: 'Bearer ' + token }});
  if (!res.ok) return [];
  return res.json();
}

function renderServers(list = []) {
  sidebarServers.innerHTML = '';
  if (list.length === 0) {
    const s = document.createElement('div'); s.className = 'server'; s.textContent = 'S'; sidebarServers.appendChild(s);
    return;
  }
  list.forEach(srv => {
    const el = document.createElement('div'); el.className = 'server'; el.textContent = srv.name[0].toUpperCase();
    el.addEventListener('click', async () => {
      const token = localStorage.getItem('suop_token');
      const res = await fetch(`http://localhost:3000/api/server/${srv._id}`, { headers: { Authorization: 'Bearer ' + token }});
      const data = await res.json();
      renderChannels(data);
    });
    sidebarServers.appendChild(el);
  });
}

function renderChannels(server) {
  sidebarChannels.innerHTML = '';
  const header = document.createElement('div'); header.className = 'server-header';
  header.innerHTML = `<strong>${server.name}</strong>`;
  sidebarChannels.appendChild(header);
  const list = document.createElement('div'); list.className = 'channel-list';
  server.channels.forEach(ch => {
    const el = document.createElement('div'); el.className = 'channel'; el.textContent = '# ' + ch.name;
    el.addEventListener('click', async () => {
      document.querySelectorAll('.channel').forEach(n => n.classList.remove('active'));
      el.classList.add('active');
      current.serverId = server._id;
      current.channelId = ch.id;
      current.dmUserId = null;
      channelTitle.textContent = `# ${ch.name}`;
      window.__suop_socket.joinChannel(server._id, ch.id);
      const token = localStorage.getItem('suop_token');
      const res = await fetch(`http://localhost:3000/api/messages/channel/${server._id}/${ch.id}`, { headers: { Authorization: 'Bearer ' + token }});
      const msgs = await res.json();
      renderMessages(msgs);
    });
    list.appendChild(el);
  });
  sidebarChannels.appendChild(list);
}

async function renderDMList() {
  const users = await fetchUsers();
  dmListEl.innerHTML = '';
  users.forEach(u => {
    if (u._id === (me && me._id)) return;
    const item = document.createElement('div'); item.className = 'dm-item';
    const dp = document.createElement('div'); dp.className = 'dp'; dp.textContent = u.username[0].toUpperCase();
    const meta = document.createElement('div'); meta.innerHTML = `<div style="font-weight:600">${u.username}</div><div style="font-size:12px;color:var(--muted)">${u.online ? 'Online' : 'Offline'}</div>`;
    item.appendChild(dp); item.appendChild(meta);
    item.addEventListener('click', async () => {
      current.dmUserId = u._id;
      current.serverId = null;
      current.channelId = null;
      channelTitle.textContent = `DM — ${u.username}`;
      const token = localStorage.getItem('suop_token');
      const res = await fetch(`http://localhost:3000/api/messages/dm/${u._id}`, { headers: { Authorization: 'Bearer ' + token }});
      const msgs = await res.json();
      renderMessages(msgs);
    });
    item.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      showProfile(u);
    });
    dmListEl.appendChild(item);
  });
}

function renderMeSummary() {
  if (!me) return;
  meSummary.innerHTML = `<div><strong>${me.username}</strong></div><div style="font-size:12px;color:var(--muted)">${me.email || ''}</div>`;
}

function renderMessages(msgs) {
  messagesEl.innerHTML = '';
  msgs.forEach(m => appendMessage(m));
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
function appendMessage(m) {
  const el = document.createElement('div'); el.className = 'msg';
  const av = document.createElement('div'); av.className = 'avatar'; av.textContent = m.sender.username[0].toUpperCase();
  const body = document.createElement('div');
  const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = `${m.sender.username} • ${new Date(m.createdAt).toLocaleTimeString()}`;
  const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.textContent = m.content;
  body.appendChild(meta); body.appendChild(bubble);
  el.appendChild(av); el.appendChild(body);
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

window.__SUOP_onMessage = (msg) => {
  if (!msg.isDM) {
    if (msg.server && current.serverId && msg.server.toString() === current.serverId.toString() && msg.channelId === current.channelId) {
      appendMessage(msg);
    }
  } else {
    if (current.dmUserId && msg.participants && msg.participants.includes(current.dmUserId)) {
      appendMessage(msg);
    }
  }
};

window.__SUOP_onTyping = (info) => {
  presenceEl.textContent = `${info.username} is typing...`;
  setTimeout(() => { presenceEl.textContent = ''; }, 1500);
};

window.__SUOP_onPresence = (p) => {
  presenceEl.textContent = p.online ? 'Online' : `Last seen ${new Date(p.lastSeen || Date.now()).toLocaleString()}`;
  renderDMList();
};

window.__SUOP_onAuth = async (token, user) => {
  if (user) me = user;
  await fetchMe();
  await renderDMList();
  const sock = window.__suop_socket.connectSocket(token);
  sock.on('connect', async () => {
    const res = await fetch('http://localhost:3000/api/server', { headers: { Authorization: 'Bearer ' + token }});
    const list = await res.json();
    renderServers(list);
  });
};

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;
  if (current.serverId && current.channelId) {
    window.__suop_socket.sendMessage({ serverId: current.serverId, channelId: current.channelId, content: text });
    inputEl.value = '';
  } else if (current.dmUserId) {
    window.__suop_socket.sendMessage({ participants: [current.dmUserId], content: text });
    inputEl.value = '';
  } else {
    alert('Choose a channel or a DM');
  }
});

inputEl.addEventListener('input', () => {
  if (current.serverId && current.channelId) {
    window.__suop_socket.typing({ serverId: current.serverId, channelId: current.channelId });
  } else if (current.dmUserId) {
    window.__suop_socket.typing({ toUserId: current.dmUserId });
  }
});

function showProfile(user) {
  profileName.textContent = user.username;
  profileBody.innerHTML = `<div><strong>Username:</strong> ${user.username}</div><div><strong>Online:</strong> ${user.online ? 'Yes' : 'No'}</div>`;
  profileModal.style.display = 'flex';
}
document.getElementById('profile-close').addEventListener('click', () => { profileModal.style.display = 'none'; });

window.__SUOP = { renderServers, renderChannels, renderMessages, renderDMList, fetchMe };
