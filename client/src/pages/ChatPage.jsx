import React from 'react';

const ChatPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            💬 Real-Time Chat System
          </h1>
          <p className="text-gray-600 mb-6">
            Teacher-to-Teacher & Group Communication
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">
              ✅ Chat feature is being integrated. Full functionality coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;