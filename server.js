const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const FIELD_WIDTH = 1100;
const FIELD_HEIGHT = 640;
const TEAM_SIZE = 3;
const PLAYER_RADIUS = 18;
const PUCK_RADIUS = 11;
const MAX_SPEED = 6.8;
const ACCEL = 0.55;
const FRICTION = 0.9;
const PUCK_FRICTION = 0.992;
const GOAL_HEIGHT = 230;
const MATCH_LENGTH_MS = 3 * 60 * 1000;
const RESTART_DELAY_MS = 1500;
const POWERUP_LIFETIME_MS = 12000;
const POWERUP_EFFECT_MS = 8000;
const POWERUP_SPAWN_MS = 10000;

const players = new Map();
const score = { red: 0, blue: 0 };
const powerups = [];

const gameState = {
  puck: {
    x: FIELD_WIDTH / 2,
    y: FIELD_HEIGHT / 2,
    vx: 0,
    vy: 0,
    radius: PUCK_RADIUS,
  },
  status: 'waiting',
  matchEndsAt: null,
  winner: null,
  lastPowerupAt: Date.now(),
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createSpawn(team, slot) {
  const lane = (slot + 1) / (TEAM_SIZE + 1);
  const y = lane * FIELD_HEIGHT;
  const xBase = team === 'red' ? FIELD_WIDTH * 0.24 : FIELD_WIDTH * 0.76;
  const jitter = (Math.random() - 0.5) * 25;
  return { x: xBase + jitter, y: y + jitter * 0.4 };
}

function countTeam(team) {
  let count = 0;
  players.forEach((player) => {
    if (player.team === team) count += 1;
  });
  return count;
}

function chooseTeam() {
  const redCount = countTeam('red');
  const blueCount = countTeam('blue');

  if (redCount < TEAM_SIZE && blueCount < TEAM_SIZE) return redCount <= blueCount ? 'red' : 'blue';
  if (redCount < TEAM_SIZE) return 'red';
  if (blueCount < TEAM_SIZE) return 'blue';
  return null;
}

function resetFaceoff() {
  gameState.puck.x = FIELD_WIDTH / 2;
  gameState.puck.y = FIELD_HEIGHT / 2;
  gameState.puck.vx = 0;
  gameState.puck.vy = 0;

  const teamSlots = { red: 0, blue: 0 };
  players.forEach((player) => {
    const slot = teamSlots[player.team] ?? 0;
    teamSlots[player.team] = slot + 1;
    const spawn = createSpawn(player.team, slot);
    player.x = spawn.x;
    player.y = spawn.y;
    player.vx = 0;
    player.vy = 0;
  });
}

function startMatchIfReady() {
  if (gameState.status === 'live') return;
  if (countTeam('red') < TEAM_SIZE || countTeam('blue') < TEAM_SIZE) {
    gameState.status = 'waiting';
    gameState.matchEndsAt = null;
    gameState.winner = null;
    return;
  }

  score.red = 0;
  score.blue = 0;
  gameState.status = 'live';
  gameState.winner = null;
  gameState.matchEndsAt = Date.now() + MATCH_LENGTH_MS;
  powerups.length = 0;
  resetFaceoff();
}

function applyEffect(player) {
  if (player.effectUntil < Date.now()) {
    player.effect = 'none';
  }
}

function updatePlayerMovement(player) {
  applyEffect(player);

  const input = player.input;
  const magnitude = Math.hypot(input.dx, input.dy) || 1;
  const normX = input.dx / magnitude;
  const normY = input.dy / magnitude;

  const accel = player.effect === 'speed' ? ACCEL * 1.4 : ACCEL;
  const maxSpeed = player.effect === 'speed' ? MAX_SPEED * 1.35 : MAX_SPEED;

  player.vx += normX * accel;
  player.vy += normY * accel;

  const speed = Math.hypot(player.vx, player.vy);
  if (speed > maxSpeed) {
    player.vx = (player.vx / speed) * maxSpeed;
    player.vy = (player.vy / speed) * maxSpeed;
  }

  player.vx *= FRICTION;
  player.vy *= FRICTION;

  player.x += player.vx;
  player.y += player.vy;

  player.x = clamp(player.x, PLAYER_RADIUS, FIELD_WIDTH - PLAYER_RADIUS);
  player.y = clamp(player.y, PLAYER_RADIUS, FIELD_HEIGHT - PLAYER_RADIUS);

  if (Math.hypot(input.dx, input.dy) > 0.1) {
    player.facingX = input.dx;
    player.facingY = input.dy;
  }
}

function resolvePlayerPuckCollision(player) {
  const dx = gameState.puck.x - player.x;
  const dy = gameState.puck.y - player.y;
  const minDist = PLAYER_RADIUS + PUCK_RADIUS;
  const dist = Math.hypot(dx, dy);

  if (dist < minDist && dist > 0) {
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = minDist - dist;

    gameState.puck.x += nx * overlap;
    gameState.puck.y += ny * overlap;

    const relativeVX = gameState.puck.vx - player.vx;
    const relativeVY = gameState.puck.vy - player.vy;
    const impact = relativeVX * nx + relativeVY * ny;

    gameState.puck.vx -= impact * nx * 1.55;
    gameState.puck.vy -= impact * ny * 1.55;

    gameState.puck.vx += player.vx * 0.58;
    gameState.puck.vy += player.vy * 0.58;
  }
}

function handleWallAndGoals() {
  const puck = gameState.puck;
  const topGoal = FIELD_HEIGHT / 2 - GOAL_HEIGHT / 2;
  const bottomGoal = FIELD_HEIGHT / 2 + GOAL_HEIGHT / 2;
  const inGoalRange = puck.y > topGoal && puck.y < bottomGoal;

  if (puck.y <= PUCK_RADIUS || puck.y >= FIELD_HEIGHT - PUCK_RADIUS) {
    puck.vy *= -0.93;
    puck.y = clamp(puck.y, PUCK_RADIUS, FIELD_HEIGHT - PUCK_RADIUS);
  }

  if (puck.x <= PUCK_RADIUS) {
    if (inGoalRange) {
      score.blue += 1;
      return 'blue';
    }
    puck.vx *= -0.96;
    puck.x = PUCK_RADIUS;
  }

  if (puck.x >= FIELD_WIDTH - PUCK_RADIUS) {
    if (inGoalRange) {
      score.red += 1;
      return 'red';
    }
    puck.vx *= -0.96;
    puck.x = FIELD_WIDTH - PUCK_RADIUS;
  }

  return null;
}

function spawnPowerupIfNeeded() {
  if (Date.now() - gameState.lastPowerupAt < POWERUP_SPAWN_MS) return;
  if (powerups.length >= 2 || gameState.status !== 'live') return;

  gameState.lastPowerupAt = Date.now();
  powerups.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: Math.random() < 0.5 ? 'speed' : 'superShot',
    x: 160 + Math.random() * (FIELD_WIDTH - 320),
    y: 80 + Math.random() * (FIELD_HEIGHT - 160),
    expiresAt: Date.now() + POWERUP_LIFETIME_MS,
  });
}

function collectPowerups() {
  for (let i = powerups.length - 1; i >= 0; i -= 1) {
    const p = powerups[i];
    if (Date.now() > p.expiresAt) {
      powerups.splice(i, 1);
      continue;
    }

    let collectedBy = null;
    players.forEach((player) => {
      if (collectedBy) return;
      const d = Math.hypot(player.x - p.x, player.y - p.y);
      if (d < PLAYER_RADIUS + 14) {
        collectedBy = player;
      }
    });

    if (collectedBy) {
      collectedBy.effect = p.type === 'superShot' ? 'superShot' : 'speed';
      collectedBy.effectUntil = Date.now() + POWERUP_EFFECT_MS;
      powerups.splice(i, 1);
    }
  }
}

function applyAction(player, type) {
  const now = Date.now();
  if (!player || gameState.status !== 'live') return;

  const cooldowns = { shoot: 450, steal: 600, hit: 850 };
  if (now - player.lastAction[type] < cooldowns[type]) return;
  player.lastAction[type] = now;

  const puck = gameState.puck;
  const toPuckX = puck.x - player.x;
  const toPuckY = puck.y - player.y;
  const puckDist = Math.hypot(toPuckX, toPuckY);

  if (type === 'shoot' && puckDist < 84) {
    const faceMag = Math.hypot(player.facingX, player.facingY) || 1;
    const dirX = player.facingX / faceMag;
    const dirY = player.facingY / faceMag;
    const shotBoost = player.effect === 'superShot' ? 18 : 13;
    puck.vx = dirX * shotBoost + player.vx * 0.3;
    puck.vy = dirY * shotBoost + player.vy * 0.3;
  }

  if (type === 'steal' && puckDist < 74) {
    puck.vx = player.vx * 0.6;
    puck.vy = player.vy * 0.6;
    puck.x = player.x + player.facingX * 28;
    puck.y = player.y + player.facingY * 28;
  }

  if (type === 'hit') {
    players.forEach((other) => {
      if (other.id === player.id || other.team === player.team) return;
      const dx = other.x - player.x;
      const dy = other.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 66 && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        other.vx += nx * 5.5;
        other.vy += ny * 5.5;
      }
    });

    if (puckDist < 72 && puckDist > 0) {
      const nx = toPuckX / puckDist;
      const ny = toPuckY / puckDist;
      puck.vx += nx * 6;
      puck.vy += ny * 6;
    }
  }
}

function tick() {
  startMatchIfReady();

  if (gameState.status === 'live') {
    players.forEach(updatePlayerMovement);

    gameState.puck.x += gameState.puck.vx;
    gameState.puck.y += gameState.puck.vy;

    players.forEach(resolvePlayerPuckCollision);
    spawnPowerupIfNeeded();
    collectPowerups();

    const scorer = handleWallAndGoals();
    if (scorer) {
      gameState.status = 'faceoff';
      setTimeout(() => {
        if (gameState.status === 'faceoff') {
          resetFaceoff();
          gameState.status = countTeam('red') === TEAM_SIZE && countTeam('blue') === TEAM_SIZE ? 'live' : 'waiting';
        }
      }, RESTART_DELAY_MS);
    }

    gameState.puck.vx *= PUCK_FRICTION;
    gameState.puck.vy *= PUCK_FRICTION;

    if (Date.now() >= gameState.matchEndsAt) {
      gameState.status = 'finished';
      gameState.winner = score.red === score.blue ? 'draw' : score.red > score.blue ? 'red' : 'blue';
      gameState.matchEndsAt = null;
      setTimeout(() => {
        if (gameState.status === 'finished') {
          gameState.status = 'waiting';
          gameState.winner = null;
          startMatchIfReady();
        }
      }, 6000);
    }
  }

  io.emit('state', {
    field: { width: FIELD_WIDTH, height: FIELD_HEIGHT, goalHeight: GOAL_HEIGHT },
    players: Array.from(players.values()).map((player) => ({
      id: player.id,
      name: player.name,
      team: player.team,
      x: player.x,
      y: player.y,
      effect: player.effect,
    })),
    puck: gameState.puck,
    powerups,
    score,
    status: gameState.status,
    winner: gameState.winner,
    matchTimeLeftMs: gameState.matchEndsAt ? Math.max(0, gameState.matchEndsAt - Date.now()) : null,
    teamCounts: { red: countTeam('red'), blue: countTeam('blue') },
  });
}

setInterval(tick, 1000 / 60);

io.on('connection', (socket) => {
  socket.emit('welcome', { message: 'Connected. Join and tap action buttons to play.' });

  socket.on('join', ({ name }) => {
    if (players.has(socket.id)) return;

    const team = chooseTeam();
    if (!team) {
      socket.emit('join_error', { message: 'Both teams are full (3v3). Wait for a slot.' });
      return;
    }

    const slot = countTeam(team);
    const spawn = createSpawn(team, slot);
    const cleanName = String(name || 'Rookie').trim().slice(0, 18) || 'Rookie';

    players.set(socket.id, {
      id: socket.id,
      name: cleanName,
      team,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      facingX: team === 'red' ? 1 : -1,
      facingY: 0,
      input: { dx: 0, dy: 0 },
      lastAction: { shoot: 0, steal: 0, hit: 0 },
      effect: 'none',
      effectUntil: 0,
    });

    socket.emit('joined', { id: socket.id, team });
    startMatchIfReady();
  });

  socket.on('input', ({ dx, dy }) => {
    const player = players.get(socket.id);
    if (!player) return;

    const x = Number(dx) || 0;
    const y = Number(dy) || 0;
    const magnitude = Math.hypot(x, y);

    if (magnitude > 1) {
      player.input.dx = x / magnitude;
      player.input.dy = y / magnitude;
    } else {
      player.input.dx = x;
      player.input.dy = y;
    }
  });

  socket.on('action', ({ type }) => {
    const player = players.get(socket.id);
    if (!player) return;
    if (!['shoot', 'steal', 'hit'].includes(type)) return;
    applyAction(player, type);
  });

  socket.on('disconnect', () => {
    players.delete(socket.id);
    if (countTeam('red') < TEAM_SIZE || countTeam('blue') < TEAM_SIZE) {
      gameState.status = 'waiting';
      gameState.matchEndsAt = null;
      gameState.winner = null;
    }
  });
});

server.listen(PORT, () => {
  console.log(`Arcade hockey server running on http://localhost:${PORT}`);
});
