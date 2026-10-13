import React from 'react';
import ChatBot from './ChatBot';

export default function TrainerHome() {
  return (
    <div className="min-h-screen bg-[#F7F8FC] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <h1 className="text-lg font-black text-slate-900">Trainer Portal</h1>
          <p className="text-[11px] text-slate-500">
            Use the chat bubble below to talk to any admin
          </p>
        </div>

        {/* Full-page chat */}
        <div className="h-[calc(100vh-160px)]">
          <ChatBot embedded />
        </div>
      </div>
    </div>
  );
}