import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Clock, ArrowLeft, Play, QrCode, Copy, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';

interface Question {
  question: string;
  answers: string[];
  correctAnswer: number;
  timeLimit: number;
}

const AdminDashboard = () => {
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    questions: [{
      question: '',
      answers: ['', '', '', ''],
      correctAnswer: 0,
      timeLimit: 30
    }] as Question[]
  });
  
  const [gameCode, setGameCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Add new question
  const addQuestion = () => {
    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, {
        question: '',
        answers: ['', '', '', ''],
        correctAnswer: 0,
        timeLimit: 30
      }]
    }));
  };

  // Remove question
  const removeQuestion = (index: number) => {
    if (quiz.questions.length > 1) {
      setQuiz(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
    }
  };

  // Update question
  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  // Update answer
  const updateAnswer = (questionIndex: number, answerIndex: number, value: string) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? {
          ...q,
          answers: q.answers.map((a, j) => j === answerIndex ? value : a)
        } : q
      )
    }));
  };

  // Create quiz
  const createQuiz = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('http://localhost:3001/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quiz),
      });

      const data = await response.json();
      
      if (data.success) {
        setGameCode(data.gameCode);
        
        // Generate QR Code
        const qrUrl = await QRCode.toDataURL(data.qrData);
        setQrCodeUrl(qrUrl);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Copy game code
  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode);
  };

  const joinUrl = `${window.location.origin}/join/${gameCode}`;

  if (gameCode) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Created Successfully!</h1>
              <p className="text-gray-600">Players can now join your game</p>
            </div>

            {/* Game Code Display */}
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">Game Code</h2>
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-4xl font-bold text-purple-600 tracking-wider">{gameCode}</span>
                <button
                  onClick={copyGameCode}
                  className="p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                  title="Copy code"
                >
                  <Copy className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600 text-center">Share this code with players</p>
            </div>

            {/* QR Code */}
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-center">
                <QrCode className="w-5 h-5 mr-2" />
                Scan to Join
              </h3>
              <div className="inline-block bg-white p-4 rounded-xl shadow-md">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
              </div>
              <p className="text-sm text-gray-600 mt-2">Players can scan this QR code to join instantly</p>
            </div>

            {/* Join URL */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Direct join link:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={joinUrl}
                  readOnly
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(joinUrl)}
                  className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Link
                to={`/game/${gameCode}`}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center"
              >
                <Play className="w-5 h-5 mr-2" />
                Open Game Display
              </Link>
              <button
                onClick={() => window.open(joinUrl, '_blank')}
                className="bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-colors flex items-center"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Test Join
              </button>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/admin"
                className="text-gray-500 hover:text-gray-700 inline-flex items-center"
                onClick={() => {
                  setGameCode('');
                  setQrCodeUrl('');
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Create Another Quiz
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-white/70 hover:text-white inline-flex items-center mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Create Quiz Game</h1>
          <p className="text-white/70">Set up your multiplayer quiz with custom questions</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Quiz Basic Info */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Quiz Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title</label>
                <input
                  type="text"
                  value={quiz.title}
                  onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter quiz title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={quiz.description}
                  onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Brief description..."
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Questions</h2>
              <button
                onClick={addQuestion}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </button>
            </div>

            {quiz.questions.map((question, questionIndex) => (
              <div key={questionIndex} className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Question {questionIndex + 1}</h3>
                  {quiz.questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(questionIndex)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mb-4">
                  <textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your question..."
                    rows={2}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {question.answers.map((answer, answerIndex) => (
                    <div key={answerIndex} className="flex items-center">
                      <input
                        type="radio"
                        name={`correct-${questionIndex}`}
                        checked={question.correctAnswer === answerIndex}
                        onChange={() => updateQuestion(questionIndex, 'correctAnswer', answerIndex)}
                        className="mr-3 text-green-600"
                      />
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => updateAnswer(questionIndex, answerIndex, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={`Answer ${answerIndex + 1}...`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-500 mr-2" />
                  <label className="text-sm text-gray-600 mr-3">Time limit:</label>
                  <select
                    value={question.timeLimit}
                    onChange={(e) => updateQuestion(questionIndex, 'timeLimit', parseInt(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value={10}>10 seconds</option>
                    <option value={15}>15 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={45}>45 seconds</option>
                    <option value={60}>60 seconds</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Create Button */}
          <div className="text-center">
            <button
              onClick={createQuiz}
              disabled={isCreating || !quiz.title || quiz.questions.some(q => !q.question || q.answers.some(a => !a))}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isCreating ? 'Creating...' : 'Create Quiz Game'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;