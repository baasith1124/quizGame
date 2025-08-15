import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Gamepad2, Zap, Trophy } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <Zap className="w-12 h-12 text-yellow-400 mr-3" />
            <h1 className="text-5xl md:text-6xl font-bold text-white">
              Quiz<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Master</span>
            </h1>
          </div>
          <p className="text-xl text-gray-300 mb-8">
            Create engaging multiplayer quiz games in real-time
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Multiplayer</h3>
            <p className="text-gray-300 text-sm">Connect multiple players instantly with QR codes</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Gamepad2 className="w-8 h-8 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Real-time</h3>
            <p className="text-gray-300 text-sm">Synchronized gameplay with live updates</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Leaderboards</h3>
            <p className="text-gray-300 text-sm">Track scores and celebrate winners</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/admin"
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Create Quiz Game
          </Link>
          <Link
            to="/join"
            className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/30 transition-all duration-200 border border-white/30 hover:border-white/50 transform hover:-translate-y-1"
          >
            Join Game
          </Link>
        </div>

        {/* Instructions */}
        <div className="mt-16 bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div>
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mb-3">1</div>
              <h3 className="font-semibold text-white mb-2">Create</h3>
              <p className="text-gray-300 text-sm">Set up your quiz with custom questions and time limits</p>
            </div>
            <div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mb-3">2</div>
              <h3 className="font-semibold text-white mb-2">Share</h3>
              <p className="text-gray-300 text-sm">Players scan QR code or enter game code to join</p>
            </div>
            <div>
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mb-3">3</div>
              <h3 className="font-semibold text-white mb-2">Play</h3>
              <p className="text-gray-300 text-sm">Questions appear on main screen, players answer on mobile</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;