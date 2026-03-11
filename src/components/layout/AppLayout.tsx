import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { useAuth } from '../../context/AuthContext';

const AppLayout: React.FC = () => {
  const { isImpersonating } = useAuth();

  return (
    <div className={`min-h-screen gradient-surface ${isImpersonating ? 'pt-10' : ''}`}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
