import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MonitorsPage from './pages/MonitorsPage';
import HistoryPage from './pages/HistoryPage';
import { Toaster } from './components/ui/sonner';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route
          path="/login"
          element={!token ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />}
        />
        <Route
          path="/"
          element={token ? <Dashboard token={token} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/monitors"
          element={token ? <MonitorsPage token={token} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/history"
          element={token ? <HistoryPage token={token} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;