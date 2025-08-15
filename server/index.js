const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// In-memory storage for the prototype
const games = new Map();
const players = new Map();

// Generate unique game code
function generateGameCode() {
  return nanoid(6).toUpperCase();
}

// Avatar options for players
const avatars = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐸', '🐙', '🦄', '🐲', '🤖', '👽', '🎭', '🎨', '🎯'
];

// API Routes
app.post('/api/quiz', (req, res) => {
  const { title, description, questions } = req.body;
  const gameCode = generateGameCode();
  
  const quiz = {
    id: nanoid(),
    gameCode,
    title,
    description,
    questions,
    players: [],
    currentQuestion: -1,
    gameState: 'waiting', // waiting, playing, finished
    scores: {},
    createdAt: new Date()
  };
  
  games.set(gameCode, quiz);
  
  res.json({ 
    success: true, 
    gameCode, 
    quizId: quiz.id,
    qrData: `${process.env.CLIENT_URL || 'http://localhost:5173'}/join/${gameCode}`
  });
});

app.get('/api/game/:gameCode', (req, res) => {
  const { gameCode } = req.params;
  const game = games.get(gameCode.toUpperCase());
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  res.json(game);
});

app.get('/api/avatars', (req, res) => {
  res.json(avatars);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Admin joins game room
  socket.on('admin-join', (gameCode) => {
    socket.join(`admin-${gameCode}`);
    console.log(`Admin joined game: ${gameCode}`);
  });

  // Player joins game
  socket.on('join-game', ({ gameCode, nickname, avatar }) => {
    const game = games.get(gameCode.toUpperCase());
    
    if (!game) {
      socket.emit('join-error', 'Game not found');
      return;
    }

    if (game.gameState !== 'waiting') {
      socket.emit('join-error', 'Game has already started');
      return;
    }

    const player = {
      id: socket.id,
      nickname,
      avatar,
      score: 0,
      answers: {}
    };

    game.players.push(player);
    game.scores[socket.id] = 0;
    players.set(socket.id, { gameCode: gameCode.toUpperCase(), ...player });

    socket.join(gameCode.toUpperCase());
    
    // Notify admin of new player
    io.to(`admin-${gameCode.toUpperCase()}`).emit('player-joined', game.players);
    
    // Confirm join to player
    socket.emit('join-success', { gameCode: gameCode.toUpperCase(), players: game.players });
    
    // Update all players in game
    io.to(gameCode.toUpperCase()).emit('players-update', game.players);
  });

  // Admin starts the game
  socket.on('start-game', (gameCode) => {
    const game = games.get(gameCode);
    
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    game.gameState = 'playing';
    game.currentQuestion = 0;
    
    // Start first question
    startQuestion(game);
  });

  // Player submits answer
  socket.on('submit-answer', ({ gameCode, questionIndex, answerIndex, timeLeft }) => {
    const game = games.get(gameCode);
    const player = players.get(socket.id);
    
    if (!game || !player || game.currentQuestion !== questionIndex) {
      return;
    }

    const question = game.questions[questionIndex];
    const isCorrect = answerIndex === question.correctAnswer;
    
    // Calculate points based on correctness and time
    let points = 0;
    if (isCorrect) {
      const timeBonus = Math.floor((timeLeft / question.timeLimit) * 500);
      points = 1000 + timeBonus;
    }

    game.scores[socket.id] = (game.scores[socket.id] || 0) + points;
    player.score = game.scores[socket.id];
    
    // Store answer
    if (!player.answers) player.answers = {};
    player.answers[questionIndex] = {
      answerIndex,
      isCorrect,
      points,
      timeLeft
    };

    console.log(`Player ${player.nickname} answered question ${questionIndex}: ${isCorrect ? 'Correct' : 'Wrong'} (+${points} points)`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    
    if (player) {
      const game = games.get(player.gameCode);
      
      if (game) {
        // Remove player from game
        game.players = game.players.filter(p => p.id !== socket.id);
        delete game.scores[socket.id];
        
        // Notify admin and other players
        io.to(`admin-${player.gameCode}`).emit('player-left', game.players);
        io.to(player.gameCode).emit('players-update', game.players);
      }
      
      players.delete(socket.id);
    }
    
    console.log('User disconnected:', socket.id);
  });
});

// Function to start a question
function startQuestion(game) {
  const question = game.questions[game.currentQuestion];
  
  if (!question) {
    // Game finished
    endGame(game);
    return;
  }

  // Send question to admin screen
  io.to(`admin-${game.gameCode}`).emit('question-start', {
    question,
    questionIndex: game.currentQuestion,
    totalQuestions: game.questions.length
  });

  // Send answer options to players
  io.to(game.gameCode).emit('question-start-player', {
    questionIndex: game.currentQuestion,
    timeLimit: question.timeLimit,
    answers: question.answers
  });

  // Set timer for question
  setTimeout(() => {
    endQuestion(game);
  }, question.timeLimit * 1000);
}

// Function to end current question and show results
function endQuestion(game) {
  const question = game.questions[game.currentQuestion];
  
  // Calculate results
  const results = game.players.map(player => ({
    ...player,
    lastAnswer: player.answers?.[game.currentQuestion] || { answerIndex: -1, isCorrect: false, points: 0 },
    score: game.scores[player.id] || 0
  })).sort((a, b) => b.score - a.score);

  // Send results to admin
  io.to(`admin-${game.gameCode}`).emit('question-end', {
    correctAnswer: question.correctAnswer,
    correctText: question.answers[question.correctAnswer],
    results,
    questionIndex: game.currentQuestion
  });

  // Send results to players
  io.to(game.gameCode).emit('question-end-player', {
    correctAnswer: question.correctAnswer,
    correctText: question.answers[question.correctAnswer],
    leaderboard: results.slice(0, 10) // Top 10
  });

  // Move to next question after showing results
  setTimeout(() => {
    game.currentQuestion++;
    
    if (game.currentQuestion < game.questions.length) {
      startQuestion(game);
    } else {
      endGame(game);
    }
  }, 5000); // 5 seconds to show results
}

// Function to end the game
function endGame(game) {
  game.gameState = 'finished';
  
  const finalResults = game.players.map(player => ({
    ...player,
    score: game.scores[player.id] || 0
  })).sort((a, b) => b.score - a.score);

  io.to(`admin-${game.gameCode}`).emit('game-end', { results: finalResults });
  io.to(game.gameCode).emit('game-end-player', { results: finalResults });
}

const PORT = process.env.PORT || 3001;


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});