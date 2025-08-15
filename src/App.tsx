import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import GameDisplay from './components/GameDisplay';
import PlayerJoin from './components/PlayerJoin';
import PlayerGame from './components/PlayerGame';
import Home from './components/Home';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/game/:gameCode" element={<GameDisplay />} />
          <Route path="/join/:gameCode?" element={<PlayerJoin />} />
          <Route path="/play/:gameCode" element={<PlayerGame />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;