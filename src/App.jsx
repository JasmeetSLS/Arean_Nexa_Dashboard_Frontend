// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ChatBot from './pages/ChatBot';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
           <Route path="/chatbot" element={<ChatBot />} />
      </Routes>
    </BrowserRouter>
  );
}