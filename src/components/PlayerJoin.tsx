import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, Play } from 'lucide-react';

const PlayerJoin = () => {
  const { gameCode: urlGameCode } = useParams();
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState(urlGameCode || '');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [avatars, setAvatars] = useState<string[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load available avatars
    fetchAvatars();
  }, []);

  const fetchAvatars = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/avatars');
      const data = await response.json();
      setAvatars(data);
      setSelectedAvatar(data[0]); // Select first avatar by default
    } catch (error) {
      console.error('Error fetching avatars:', error);
    }
  };

  const handleJoin = async () => {
    if (!nickname.trim() || !selectedAvatar || !gameCode.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      // Verify game exists
      const response = await fetch(`http://localhost:3001/api/game/${gameCode.toUpperCase()}`);
      
      if (!response.ok) {
        throw new Error('Game not found');
      }

      const game = await response.json();
      
      if (game.gameState !== 'waiting') {
        setError('Game has already started');
        setIsJoining(false);
        return;
      }

      // Navigate to player game with join data
      navigate(`/play/${gameCode.toUpperCase()}`, {
        state: { nickname: nickname.trim(), avatar: selectedAvatar }
      });
    } catch (error) {
      setError('Game not found. Please check the game code.');
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="max-w-md mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="text-gray-500 hover:text-gray-700 inline-flex items-center mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-purple-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-800">Join Game</h1>
            </div>
            <p className="text-gray-600">Enter game details to join the quiz</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Game Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Game Code</label>
            <input
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-wider focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="ENTER CODE"
              maxLength={6}
            />
          </div>

          {/* Nickname Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your name..."
              maxLength={20}
            />
          </div>

          {/* Avatar Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">Choose Your Avatar</label>
            <div className="grid grid-cols-5 gap-3">
              {avatars.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-12 h-12 text-2xl rounded-lg border-2 hover:scale-110 transition-all duration-200 ${
                    selectedAvatar === avatar 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoin}
            disabled={isJoining || !nickname.trim() || !selectedAvatar || !gameCode.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
          >
            {isJoining ? (
              'Joining...'
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Join Game
              </>
            )}
          </button>

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Make sure you have a stable internet connection for the best experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerJoin;