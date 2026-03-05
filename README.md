# 8-Bit 3v3 Arcade Hockey (Mobile Multiplayer)

A lightweight browser hockey game inspired by over-the-top 3-on-3 arcade hockey.

## Features

- Real-time 3v3 online play over Socket.IO.
- Mobile-friendly joystick movement + dedicated action buttons:
  - **Shoot** (blast puck forward)
  - **Steal** (quick puck control move)
  - **Hit** (body-check nearby opponents)
- Power-ups:
  - ⚡ **Speed Boost**
  - 🔥 **Super Shot**
- Top-down pseudo-3D rink/player/puck visuals with depth shading.
- Match timer, goals, faceoffs, and winner announcement.
- Desktop fallback controls:
  - Move: **WASD / Arrows**
  - Actions: **J (shoot), K (steal), L (hit)**

## Run locally

```bash
npm install
npm start
```

Then open `http://localhost:3000` on multiple devices or tabs.

## Play over the internet

Deploy this Node app on any host (Render, Railway, Fly.io, VPS, etc.) and share your public URL.
