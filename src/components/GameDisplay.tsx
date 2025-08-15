import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Users, Play, Trophy, Clock, CheckCircle, ArrowLeft } from 'lucide-react';

interface Player {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
}

interface Question {
  question: string;
  answers: string[];
  correctAnswer: number;
  timeLimit: number;
}

const GameDisplay = () => {
  const { gameCode } = useParams();
  const [socket, setSocket] = useState<any>(null);
  const [gameState, setGameState] = useState('lobby'); // lobby, question, results, finished
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionResults, setQuestionResults] = useState<any>(null);
  const [finalResults, setFinalResults] = useState<Player[]>([]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Join as admin
    newSocket.emit('admin-join', gameCode);

    // Socket event listeners
    newSocket.on('player-joined', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    newSocket.on('player-left', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    newSocket.on('question-start', ({ question, questionIndex, totalQuestions }) => {
      setCurrentQuestion(question);
      setQuestionIndex(questionIndex);
      setTotalQuestions(totalQuestions);
      setTimeLeft(question.timeLimit);
      setQuestionResults(null);
      setGameState('question');
    });

    newSocket.on('question-end', ({ correctAnswer, correctText, results, questionIndex }) => {
      setQuestionResults({ correctAnswer, correctText, results, questionIndex });
      setGameState('results');
    });

    newSocket.on('game-end', ({ results }) => {
      setFinalResults(results);
      setGameState('finished');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [gameCode]);

  // Timer countdown for questions
  useEffect(() => {
    if (gameState === 'question' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, gameState]);

  // Start the game
  const startGame = () => {
    if (socket) {
      socket.emit('start-game', gameCode);
    }
  };

  // Lobby View - Players waiting to start
  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/admin" className="text-white/70 hover:text-white inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Link>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2">Game Lobby</h1>
              <p className="text-white/70">Game Code: <span className="font-bold text-yellow-400 text-2xl">{gameCode}</span></p>
            </div>
            <div></div>
          </div>

          {/* Player Count and Start Button */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-400 mr-4" />
                <div>
                  <h3 className="text-2xl font-bold text-white">{players.length} Players Joined</h3>
                  <p className="text-white/70">Waiting for more players to join...</p>
                </div>
              </div>
              
              <button
                onClick={startGame}
                disabled={players.length === 0}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-xl hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center"
              >
                <Play className="w-6 h-6 mr-3" />
                Start Game
              </button>
            </div>
          </div>

          {/* Players Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {players.map((player) => (
              <div key={player.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                <div className="text-4xl mb-3">{player.avatar}</div>
                <h4 className="text-lg font-bold text-white mb-1">{player.nickname}</h4>
                <p className="text-white/60 text-sm">Ready to play</p>
              </div>
            ))}
            
            {/* Empty slots indication */}
            {players.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Users className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-xl text-white/70 mb-2">No players yet</h3>
                <p className="text-white/50">Share the game code for players to join</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Instructions for Players</h3>
            <div className="grid md:grid-cols-2 gap-6 text-white/70">
              <div>
                <p className="mb-2">• Visit the join page or scan the QR code</p>
                <p className="mb-2">• Enter the game code: <span className="font-bold text-yellow-400">{gameCode}</span></p>
                <p>• Choose a nickname and avatar</p>
              </div>
              <div>
                <p className="mb-2">• Questions will appear on this screen</p>
                <p className="mb-2">• Answer options will appear on player devices</p>
                <p>• Points are awarded for correct and fast answers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Question View
  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-white/70">
              Question {questionIndex + 1} of {totalQuestions}
            </div>
            <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
              <Clock className="w-5 h-5 text-orange-400 mr-2" />
              <span className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="text-white/70">
              {players.length} players
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-3 mb-8">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-3xl p-12 mb-8 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 text-center leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {currentQuestion.answers.map((answer, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-6">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-2xl font-semibold text-white">{answer}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Timer Bar */}
          <div className="mt-8">
            <div className="w-full bg-white/20 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all duration-1000 ${
                  timeLeft <= 5 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                  'bg-gradient-to-r from-green-500 to-blue-500'
                }`}
                style={{ width: `${(timeLeft / currentQuestion.timeLimit) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center">
            <p className="text-white/70 text-xl">Players: Select your answer on your device!</p>
          </div>
        </div>
      </div>
    );
  }

  // Results View
  if (gameState === 'results' && questionResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-900 to-red-900 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">Question {questionResults.questionIndex + 1} Results</h2>
          </div>

          {/* Correct Answer */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-3xl p-8 mb-8 text-center shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-white mr-4" />
              <h3 className="text-3xl font-bold text-white">Correct Answer</h3>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
              <p className="text-3xl font-bold text-white">{questionResults.correctText}</p>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center mb-6">
              <Trophy className="w-8 h-8 text-yellow-500 mr-4" />
              <h3 className="text-3xl font-bold text-gray-800">Current Leaderboard</h3>
            </div>
            
            <div className="grid gap-4">
              {questionResults.results.slice(0, 10).map((player: Player, index: number) => (
                <div key={player.id} className={`flex items-center justify-between p-6 rounded-xl ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400' :
                  index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-400' :
                  index === 2 ? 'bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-400' :
                  'bg-gray-50'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl mr-6 ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                      'bg-gradient-to-r from-purple-500 to-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-3xl mr-4">{player.avatar}</span>
                    <div>
                      <h4 className="text-xl font-bold text-gray-800">{player.nickname}</h4>
                      <p className="text-gray-600">
                        {player.lastAnswer?.isCorrect ? 
                          `+${player.lastAnswer.points} points` : 
                          'No points'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">{player.score}</p>
                    <p className="text-gray-600">total</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Question Indicator */}
          <div className="mt-8 text-center">
            <div className="animate-pulse text-white">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce mx-auto mb-4"></div>
              <p className="text-xl">Next question in 5 seconds...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Final Results View
  if (gameState === 'finished' && finalResults.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-yellow-900 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-6xl font-bold text-white mb-4">Game Over!</h1>
            <p className="text-2xl text-white/70">Final Results</p>
          </div>

          {/* Podium for top 3 */}
          <div className="flex items-end justify-center gap-8 mb-12">
            {/* 2nd Place */}
            {finalResults[1] && (
              <div className="text-center">
                <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl p-6 mb-4">
                  <div className="text-4xl mb-2">{finalResults[1].avatar}</div>
                  <h3 className="text-xl font-bold text-white">{finalResults[1].nickname}</h3>
                  <p className="text-3xl font-bold text-white">{finalResults[1].score}</p>
                </div>
                <div className="bg-gradient-to-r from-gray-400 to-gray-500 w-32 h-24 rounded-t-lg flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">2nd</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {finalResults[0] && (
              <div className="text-center">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-8 mb-4 transform scale-110">
                  <Trophy className="w-8 h-8 text-white mx-auto mb-2" />
                  <div className="text-5xl mb-3">{finalResults[0].avatar}</div>
                  <h3 className="text-2xl font-bold text-white">{finalResults[0].nickname}</h3>
                  <p className="text-4xl font-bold text-white">{finalResults[0].score}</p>
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 w-40 h-32 rounded-t-lg flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">1st</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {finalResults[2] && (
              <div className="text-center">
                <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl p-6 mb-4">
                  <div className="text-4xl mb-2">{finalResults[2].avatar}</div>
                  <h3 className="text-xl font-bold text-white">{finalResults[2].nickname}</h3>
                  <p className="text-3xl font-bold text-white">{finalResults[2].score}</p>
                </div>
                <div className="bg-gradient-to-r from-orange-400 to-orange-500 w-28 h-20 rounded-t-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">3rd</span>
                </div>
              </div>
            )}
          </div>

          {/* Complete Leaderboard */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">Final Rankings</h3>
            
            <div className="grid gap-4">
              {finalResults.map((player: Player, index: number) => (
                <div key={player.id} className={`flex items-center justify-between p-6 rounded-xl ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400' :
                  index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-400' :
                  index === 2 ? 'bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-400' :
                  'bg-gray-50'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mr-6 ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                      'bg-gradient-to-r from-purple-500 to-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-4xl mr-6">{player.avatar}</span>
                    <div>
                      <h4 className="text-2xl font-bold text-gray-800">{player.nickname}</h4>
                      {index === 0 && <p className="text-yellow-600 font-bold">🏆 Champion!</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-blue-600">{player.score}</p>
                    <p className="text-gray-600">points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Game Button */}
          <div className="mt-12 text-center">
            <Link
              to="/admin"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-12 py-4 rounded-xl font-semibold text-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg inline-block"
            >
              Create New Game
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-white text-xl">Loading game...</p>
      </div>
    </div>
  );
};

export default GameDisplay;