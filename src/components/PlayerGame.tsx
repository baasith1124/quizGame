import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Clock, Users, Trophy, CheckCircle, XCircle } from 'lucide-react';

interface Player {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
}

const PlayerGame = () => {
  const { gameCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { nickname, avatar } = location.state || {};

  const [socket, setSocket] = useState<any>(null);
  const [gameState, setGameState] = useState('joining'); // joining, lobby, question, results, finished
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questionResults, setQuestionResults] = useState<any>(null);
  const [finalResults, setFinalResults] = useState<Player[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!nickname || !avatar || !gameCode) {
      navigate('/join');
      return;
    }

    // Initialize socket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Join the game
    newSocket.emit('join-game', { gameCode, nickname, avatar });

    // Socket event listeners
    newSocket.on('join-success', ({ players }) => {
      setPlayers(players);
      setGameState('lobby');
    });

    newSocket.on('join-error', (error) => {
      setError(error);
      setTimeout(() => navigate('/join'), 3000);
    });

    newSocket.on('players-update', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    newSocket.on('question-start-player', ({ questionIndex, timeLimit, answers }) => {
      setCurrentQuestion({ questionIndex, timeLimit, answers });
      setTimeLeft(timeLimit);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setQuestionResults(null);
      setGameState('question');
    });

    newSocket.on('question-end-player', ({ correctAnswer, correctText, leaderboard }) => {
      setQuestionResults({ correctAnswer, correctText, leaderboard });
      setGameState('results');
    });

    newSocket.on('game-end-player', ({ results }) => {
      setFinalResults(results);
      setGameState('finished');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [gameCode, nickname, avatar, navigate]);

  // Timer countdown for questions
  useEffect(() => {
    if (gameState === 'question' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, gameState]);

  // Submit answer
  const submitAnswer = (answerIndex: number) => {
    if (hasAnswered || !socket || !currentQuestion) return;

    setSelectedAnswer(answerIndex);
    setHasAnswered(true);

    socket.emit('submit-answer', {
      gameCode,
      questionIndex: currentQuestion.questionIndex,
      answerIndex,
      timeLeft
    });
  };

  // Get player rank
  const getPlayerRank = (playerId: string, results: Player[]) => {
    return results.findIndex(p => p.id === playerId) + 1;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center shadow-lg">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">Redirecting back to join page...</p>
        </div>
      </div>
    );
  }

  // Joining state
  if (gameState === 'joining') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 text-center shadow-lg">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-700">Joining game...</p>
        </div>
      </div>
    );
  }

  // Lobby state
  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4">
        <div className="max-w-md mx-auto">
          {/* Player Info */}
          <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
            <div className="text-center">
              <div className="text-4xl mb-3">{avatar}</div>
              <h2 className="text-xl font-bold text-gray-800">{nickname}</h2>
              <p className="text-gray-600">Game Code: <span className="font-bold text-purple-600">{gameCode}</span></p>
            </div>
          </div>

          {/* Players List */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="font-bold text-gray-800">Players ({players.length})</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {players.map((player) => (
                <div key={player.id} className="flex items-center bg-gray-50 rounded-lg p-3">
                  <span className="text-2xl mr-3">{player.avatar}</span>
                  <span className="font-medium text-gray-700 truncate">{player.nickname}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <div className="animate-pulse flex items-center justify-center text-gray-600">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce mr-2"></div>
                <span>Waiting for host to start the game...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Question state
  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 p-4">
        <div className="max-w-md mx-auto">
          {/* Timer */}
          <div className="bg-white rounded-xl p-4 mb-6 text-center shadow-lg">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-orange-500 mr-2" />
              <span className="font-bold text-gray-700">Time Left</span>
            </div>
            <div className={`text-3xl font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-green-600'}`}>
              {timeLeft}s
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  timeLeft <= 5 ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${(timeLeft / currentQuestion.timeLimit) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question Number */}
          <div className="text-center mb-6">
            <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
              Question {currentQuestion.questionIndex + 1}
            </span>
          </div>

          {/* Answer Options */}
          <div className="space-y-4">
            {currentQuestion.answers.map((answer: string, index: number) => (
              <button
                key={index}
                onClick={() => submitAnswer(index)}
                disabled={hasAnswered || timeLeft === 0}
                className={`w-full p-4 rounded-xl text-left font-medium transition-all duration-200 shadow-lg ${
                  selectedAnswer === index
                    ? 'bg-purple-600 text-white transform scale-105'
                    : hasAnswered
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-gray-800 hover:bg-purple-50 hover:border-purple-300 active:scale-95'
                } border-2 ${
                  selectedAnswer === index ? 'border-purple-600' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                    selectedAnswer === index ? 'bg-white text-purple-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  {answer}
                </div>
              </button>
            ))}
          </div>

          {/* Status */}
          {hasAnswered && (
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Answer submitted!</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Results state
  if (gameState === 'results' && questionResults) {
    const playerData = questionResults.leaderboard.find((p: Player) => p.nickname === nickname);
    const playerRank = getPlayerRank(playerData?.id, questionResults.leaderboard);

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-orange-100 p-4">
        <div className="max-w-md mx-auto">
          {/* Correct Answer */}
          <div className="bg-white rounded-xl p-6 mb-6 text-center shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Correct Answer</h3>
            <div className="bg-green-100 border border-green-300 rounded-lg p-4">
              <p className="text-green-800 font-medium">{questionResults.correctText}</p>
            </div>
          </div>

          {/* Player Result */}
          <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
            <div className="text-center">
              <div className="text-3xl mb-2">{avatar}</div>
              <h3 className="text-xl font-bold text-gray-800">{nickname}</h3>
              <div className="flex items-center justify-center mt-4 space-x-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Rank</p>
                  <p className="text-2xl font-bold text-purple-600">#{playerRank}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-2xl font-bold text-blue-600">{playerData?.score || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top 5 Leaderboard */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
              <h3 className="font-bold text-gray-800">Top Players</h3>
            </div>
            
            <div className="space-y-3">
              {questionResults.leaderboard.slice(0, 5).map((player: Player, index: number) => (
                <div key={player.id} className={`flex items-center justify-between p-3 rounded-lg ${
                  player.nickname === nickname ? 'bg-purple-100 border border-purple-300' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-lg mr-2">{player.avatar}</span>
                    <span className="font-medium">{player.nickname}</span>
                  </div>
                  <span className="font-bold text-blue-600">{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Waiting for next question */}
          <div className="mt-6 text-center">
            <div className="animate-pulse text-gray-600">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce mx-auto mb-2"></div>
              <span>Next question coming up...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Final results state
  if (gameState === 'finished' && finalResults.length > 0) {
    const playerData = finalResults.find(p => p.nickname === nickname);
    const playerRank = getPlayerRank(playerData?.id, finalResults);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 p-4">
        <div className="max-w-md mx-auto">
          {/* Game Over Header */}
          <div className="bg-white rounded-xl p-6 mb-6 text-center shadow-lg">
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Game Over!</h2>
            <p className="text-gray-600">Thanks for playing</p>
          </div>

          {/* Player Final Result */}
          <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
            <div className="text-center">
              <div className="text-4xl mb-3">{avatar}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">{nickname}</h3>
              
              <div className={`inline-block px-6 py-3 rounded-full text-white font-bold text-xl ${
                playerRank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                playerRank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                playerRank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 
                'bg-gradient-to-r from-purple-500 to-blue-500'
              }`}>
                #{playerRank} Place
              </div>
              
              <p className="text-3xl font-bold text-blue-600 mt-4">{playerData?.score || 0} points</p>
            </div>
          </div>

          {/* Final Leaderboard */}
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="font-bold text-gray-800 mb-4 text-center">Final Leaderboard</h3>
            
            <div className="space-y-3">
              {finalResults.map((player: Player, index: number) => (
                <div key={player.id} className={`flex items-center justify-between p-4 rounded-lg ${
                  player.nickname === nickname ? 'bg-purple-100 border-2 border-purple-300' : 'bg-gray-50'
                } ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300' : ''
                }`}>
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-xl mr-3">{player.avatar}</span>
                    <div>
                      <p className="font-medium">{player.nickname}</p>
                      {index === 0 && <p className="text-xs text-yellow-600 font-medium">🏆 Winner!</p>}
                    </div>
                  </div>
                  <span className="font-bold text-blue-600 text-lg">{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Play Again */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/join')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 text-center shadow-lg">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-700">Loading...</p>
      </div>
    </div>
  );
};

export default PlayerGame;