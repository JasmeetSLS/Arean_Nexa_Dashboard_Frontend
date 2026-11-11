import React from 'react';
import ChatBot from './ChatBot';

export default function TrainerHome() {
  return (
    <div className="min-h-screen bg-[#F7F8FC] p-6">
      
        {/* Full-page chat */}
        <div className="h-[calc(100vh-160px)]">
          <ChatBot embedded />
        </div>
    </div>
  );
}