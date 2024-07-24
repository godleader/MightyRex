const express = require('express');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(morgan('combined'));

// API密钥（在实际应用中，建议使用环境变量）
const apiKey = 'your-secret-api-key';

// 中间件检查API密钥
function checkApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (key && key === apiKey) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden' });
  }
}

// 在所有API端点上应用中间件
app.use(checkApiKey);

// 读取游戏初始化配置
const configPath = path.join(__dirname, 'public/MightyRexCT/latest-stable/MightyRex/game_init.conf');
let gameConfig;

fs.readFile(configPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading config file:', err);
    return;
  }
  gameConfig = JSON.parse(data);
});

let gameState = {
  balance: 1000, // 初始余额
  currentBet: 0,
  lastWin: 0,
  history: [],
  score: 0,
  level: 1,
  playerPosition: { x: 0, y: 0 }
};

let savedGameState = {};

// Swagger配置
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'Game API',
      description: 'API documentation for the game',
      version: '1.0.0',
    },
  },
  apis: ['server.js'], // 替换为你的API文件路径
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /config:
 *   get:
 *     description: 获取游戏配置
 *     responses:
 *       200:
 *         description: 成功获取游戏配置
 */
app.get('/config', (req, res) => {
  res.json(gameConfig);
});

/**
 * @swagger
 * /start_game:
 *   post:
 *     description: 启动游戏
 *     responses:
 *       200:
 *         description: 成功启动游戏
 */
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

/**
 * @swagger
 * /place_bet:
 *   post:
 *     description: 处理用户投注
 *     parameters:
 *       - name: amount
 *         description: 投注金额
 *         in: body
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: 成功处理投注
 */
app.post('/place_bet', (req, res) => {
  const { amount } = req.body;
  if (amount > gameState.balance) {
    return res.status(400).json({ message: 'Insufficient balance' });
  }
  gameState.currentBet = amount;
  gameState.balance -= amount;
  res.json({ message: 'Bet placed', gameState });
});

/**
 * @swagger
 * /process_input:
 *   post:
 *     description: 处理用户输入
 *     parameters:
 *       - name: direction
 *         description: 用户移动方向
 *         in: body
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: 成功处理用户输入
 */
app.post('/process_input', (req, res) => {
  const userInput = req.body;
  let winAmount = 0;

  // 示例：根据输入更新游戏状态和计算输赢
  if (userInput.direction === 'left') {
    gameState.playerPosition.x -= 1;
  } else if (userInput.direction === 'right') {
    gameState.playerPosition.x += 1;
  }

  // 假设随机决定用户是否赢得该局
  const win = Math.random() > 0.5;
  if (win) {
    winAmount = gameState.currentBet * 2; // 假设赢得两倍投注金额
    gameState.balance += winAmount;
    gameState.lastWin = winAmount;
  } else {
    gameState.lastWin = 0;
  }

  // 记录历史
  gameState.history.push({
    bet: gameState.currentBet,
    win: winAmount,
    newBalance: gameState.balance,
    timestamp: new Date()
  });

  // 重置当前投注
  gameState.currentBet = 0;

  res.json({ message: 'Input processed', gameState });
});

/**
 * @swagger
 * /game_state:
 *   get:
 *     description: 获取游戏状态
 *     responses:
 *       200:
 *         description: 成功获取游戏状态
 */
app.get('/game_state', (req, res) => {
  res.json({ gameState });
});

/**
 * @swagger
 * /reset_game:
 *   post:
 *     description: 重置游戏
 *     responses:
 *       200:
 *         description: 成功重置游戏
 */
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

/**
 * @swagger
 * /save_game:
 *   post:
 *     description: 保存游戏进度
 *     responses:
 *       200:
 *         description: 成功保存游戏进度
 */
app.post('/save_game', (req, res) => {
  savedGameState = { ...gameState };
  res.json({ message: 'Game saved' });
});

/**
 * @swagger
 * /load_game:
 *   get:
 *     description: 加载游戏进度
 *     responses:
 *       200:
 *         description: 成功加载游戏进度
 */
app.get('/load_game', (req, res) => {
  gameState = { ...savedGameState };
  res.json({ message: 'Game loaded', gameState });
});

// 提供静态资源
app.use('/static', express.static(path.join(__dirname, 'public/MightyRexCT/latest-stable')));

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
