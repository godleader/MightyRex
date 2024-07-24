const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const configPath = path.join(__dirname, '../public/MightyRexCT/latest-stable/MightyRex/game_init.conf');
let gameConfig;

fs.readFile(configPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading config file:', err);
    return;
  }
  gameConfig = JSON.parse(data);
});

let gameState = {};
let savedGameState = {};

app.get('/config', (req, res) => {
  res.json(gameConfig);
});

app.post('/start_game', (req, res) => {
  gameState = {
    balance: 1000, // 初始余额
    currentBet: 0,
    lastWin: 0,
    history: [],
    score: 0,
    level: 1,
    playerPosition: { x: 0, y: 0 }
  };
  res.json({ message: 'Game started', gameState });
});

app.post('/process_input', (req, res) => {
  const userInput = req.body;
  if (userInput.direction === 'left') {
    gameState.playerPosition.x -= 1;
  } else if (userInput.direction === 'right') {
    gameState.playerPosition.x += 1;
  }
  res.json({ message: 'Input processed', gameState });
});

app.get('/game_state', (req, res) => {
    res.json({ gameState });
  });

  app.post('/reset_game', (req, res) => {
    gameState = {
      balance: 1000, // 初始余额
      currentBet: 0,
      lastWin: 0,
      history: [],
      score: 0,
      level: 1,
      playerPosition: { x: 0, y: 0 }
    };
    res.json({ message: 'Game reset', gameState });
  });

app.post('/save_game', (req, res) => {
  savedGameState = { ...gameState };
  res.json({ message: 'Game saved' });
});

app.get('/load_game', (req, res) => {
  gameState = { ...savedGameState };
  res.json({ message: 'Game loaded', gameState });
});

app.use('/static', express.static(path.join(__dirname, '../public/MightyRexCT/latest-stable')));

// 导出Vercel处理函数
module.exports = app;