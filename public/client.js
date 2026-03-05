const socket = io();

const canvas = document.getElementById('rink');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const scoreRedEl = document.getElementById('score-red');
const scoreBlueEl = document.getElementById('score-blue');
const clockEl = document.getElementById('clock');
const nameEl = document.getElementById('name');
const joinBtn = document.getElementById('join-btn');
const shootBtn = document.getElementById('shoot-btn');
const stealBtn = document.getElementById('steal-btn');
const hitBtn = document.getElementById('hit-btn');

const joystickBase = document.getElementById('joystick-base');
const joystickKnob = document.getElementById('joystick-knob');

let selfId = null;
let selfTeam = null;
let gameState = null;
let currentInput = { dx: 0, dy: 0 };

function formatClock(ms) {
  if (!ms && ms !== 0) return '03:00';
  const total = Math.ceil(ms / 1000);
  const min = String(Math.floor(total / 60)).padStart(2, '0');
  const sec = String(total % 60).padStart(2, '0');
  return `${min}:${sec}`;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function sendAction(type) {
  socket.emit('action', { type });
}

joinBtn.addEventListener('click', () => {
  socket.emit('join', { name: nameEl.value });
});

[shootBtn, stealBtn, hitBtn].forEach((button) => {
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (button === shootBtn) sendAction('shoot');
    if (button === stealBtn) sendAction('steal');
    if (button === hitBtn) sendAction('hit');
  });
});

socket.on('welcome', ({ message }) => setStatus(message));

socket.on('joined', ({ id, team }) => {
  selfId = id;
  selfTeam = team;
  setStatus(`Joined ${team.toUpperCase()} squad. Waiting for full 3v3...`);
});

socket.on('join_error', ({ message }) => setStatus(message));

socket.on('state', (state) => {
  gameState = state;
  scoreRedEl.textContent = state.score.red;
  scoreBlueEl.textContent = state.score.blue;
  clockEl.textContent = formatClock(state.matchTimeLeftMs);

  if (!selfId) {
    setStatus(`Spectating. ${state.teamCounts.red}/3 red, ${state.teamCounts.blue}/3 blue.`);
  } else if (state.status === 'waiting') {
    setStatus(`Need full teams. ${state.teamCounts.red}/3 red, ${state.teamCounts.blue}/3 blue.`);
  } else if (state.status === 'faceoff') {
    setStatus('GOAL! FACEOFF...');
  } else if (state.status === 'finished') {
    setStatus(state.winner === 'draw' ? 'DRAW GAME.' : `${state.winner.toUpperCase()} WINS!`);
  } else {
    setStatus(`LIVE ${selfTeam ? selfTeam.toUpperCase() : 'SPEC'} | Powerups on ice: ${state.powerups.length}`);
  }

  render();
});

function drawRink3D(field) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sky = ctx.createLinearGradient(0, 0, 0, field.height);
  sky.addColorStop(0, '#f8fcff');
  sky.addColorStop(1, '#cae4f8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, field.width, field.height);

  const ice = ctx.createLinearGradient(0, 0, field.width, field.height);
  ice.addColorStop(0, '#ecf8ff');
  ice.addColorStop(0.5, '#dff1ff');
  ice.addColorStop(1, '#cde6f8');
  ctx.fillStyle = ice;
  ctx.fillRect(18, 18, field.width - 36, field.height - 36);

  ctx.strokeStyle = '#7cb8e5';
  ctx.lineWidth = 1.5;
  for (let y = 24; y < field.height - 24; y += 28) {
    ctx.beginPath();
    ctx.moveTo(18, y);
    ctx.lineTo(field.width - 18, y + 10);
    ctx.stroke();
  }

  ctx.strokeStyle = '#2a96ff';
  ctx.lineWidth = 8;
  ctx.strokeRect(12, 12, field.width - 24, field.height - 24);

  ctx.strokeStyle = '#e94a57';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(field.width / 2, 12);
  ctx.lineTo(field.width / 2, field.height - 12);
  ctx.stroke();

  ctx.strokeStyle = '#2a96ff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(field.width / 2, field.height / 2, 78, 56, 0, 0, Math.PI * 2);
  ctx.stroke();

  const topGoal = field.height / 2 - field.goalHeight / 2;
  ctx.fillStyle = 'rgba(255, 96, 115, 0.22)';
  ctx.fillRect(12, topGoal, 40, field.goalHeight);
  ctx.fillStyle = 'rgba(80, 154, 255, 0.22)';
  ctx.fillRect(field.width - 52, topGoal, 40, field.goalHeight);
}

function drawShadow(x, y, w = 16, h = 8) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x + 4, y + 10, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer3D(player) {
  const isSelf = player.id === selfId;
  const boosted = player.effect && player.effect !== 'none';

  drawShadow(player.x, player.y, 15, 7);

  const jerseyBase = player.team === 'red' ? '#f45c74' : '#4c96ff';
  const jerseyDark = player.team === 'red' ? '#be304f' : '#2a66d2';

  const body = ctx.createLinearGradient(player.x - 16, player.y - 20, player.x + 18, player.y + 12);
  body.addColorStop(0, '#ffffff');
  body.addColorStop(0.35, jerseyBase);
  body.addColorStop(1, jerseyDark);

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(player.x, player.y - 2, 17, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1a223e';
  ctx.fillRect(player.x - 11, player.y + 12, 8, 7);
  ctx.fillRect(player.x + 3, player.y + 12, 8, 7);

  ctx.fillStyle = '#f0c8a0';
  ctx.beginPath();
  ctx.arc(player.x, player.y - 13, 7, 0, Math.PI * 2);
  ctx.fill();

  if (isSelf || boosted) {
    ctx.strokeStyle = isSelf ? '#ffe35f' : '#6af2a0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 1, 22, 26, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(player.name, player.x, player.y - 28);
}

function drawPuck3D(puck) {
  drawShadow(puck.x, puck.y, 10, 4);

  const disc = ctx.createRadialGradient(puck.x - 3, puck.y - 4, 2, puck.x, puck.y, puck.radius + 3);
  disc.addColorStop(0, '#697799');
  disc.addColorStop(0.4, '#2c3552');
  disc.addColorStop(1, '#161d33');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.ellipse(puck.x, puck.y - 1, puck.radius + 1, puck.radius - 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#98a8d0';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPowerup3D(powerup) {
  const emoji = powerup.type === 'speed' ? '⚡' : '🔥';
  drawShadow(powerup.x, powerup.y, 14, 6);

  const cube = ctx.createLinearGradient(powerup.x - 14, powerup.y - 14, powerup.x + 14, powerup.y + 14);
  cube.addColorStop(0, powerup.type === 'speed' ? '#90ffd2' : '#ffd19b');
  cube.addColorStop(1, powerup.type === 'speed' ? '#2ac98b' : '#ff7b2f');

  ctx.fillStyle = cube;
  ctx.fillRect(powerup.x - 14, powerup.y - 18, 28, 28);
  ctx.strokeStyle = '#10213e';
  ctx.lineWidth = 3;
  ctx.strokeRect(powerup.x - 14, powerup.y - 18, 28, 28);

  ctx.font = '16px monospace';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(emoji, powerup.x, powerup.y + 3);
}

function render() {
  if (!gameState) return;
  drawRink3D(gameState.field);
  gameState.powerups.forEach(drawPowerup3D);
  gameState.players.forEach(drawPlayer3D);
  drawPuck3D(gameState.puck);
}

function sendInput() {
  socket.emit('input', currentInput);
}

let joystickActive = false;
const baseRect = () => joystickBase.getBoundingClientRect();

function moveJoystick(clientX, clientY) {
  const rect = baseRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  let dx = clientX - cx;
  let dy = clientY - cy;
  const maxRadius = rect.width * 0.36;
  const mag = Math.hypot(dx, dy);

  if (mag > maxRadius) {
    dx = (dx / mag) * maxRadius;
    dy = (dy / mag) * maxRadius;
  }

  joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  currentInput.dx = dx / maxRadius;
  currentInput.dy = dy / maxRadius;
  sendInput();
}

function resetJoystick() {
  joystickKnob.style.transform = 'translate(-50%, -50%)';
  currentInput.dx = 0;
  currentInput.dy = 0;
  sendInput();
}

joystickBase.addEventListener('pointerdown', (event) => {
  joystickActive = true;
  joystickBase.setPointerCapture(event.pointerId);
  moveJoystick(event.clientX, event.clientY);
});

joystickBase.addEventListener('pointermove', (event) => {
  if (!joystickActive) return;
  moveJoystick(event.clientX, event.clientY);
});

joystickBase.addEventListener('pointerup', () => {
  joystickActive = false;
  resetJoystick();
});

joystickBase.addEventListener('pointercancel', () => {
  joystickActive = false;
  resetJoystick();
});

window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'j', 'k', 'l'].includes(event.key)) {
    event.preventDefault();
  }
  if (event.key === 'ArrowUp' || event.key === 'w') currentInput.dy = -1;
  if (event.key === 'ArrowDown' || event.key === 's') currentInput.dy = 1;
  if (event.key === 'ArrowLeft' || event.key === 'a') currentInput.dx = -1;
  if (event.key === 'ArrowRight' || event.key === 'd') currentInput.dx = 1;
  if (event.key === 'j') sendAction('shoot');
  if (event.key === 'k') sendAction('steal');
  if (event.key === 'l') sendAction('hit');
  sendInput();
});

window.addEventListener('keyup', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)) {
    event.preventDefault();
  }
  if (['ArrowUp', 'w', 'ArrowDown', 's'].includes(event.key)) currentInput.dy = 0;
  if (['ArrowLeft', 'a', 'ArrowRight', 'd'].includes(event.key)) currentInput.dx = 0;
  sendInput();
});
