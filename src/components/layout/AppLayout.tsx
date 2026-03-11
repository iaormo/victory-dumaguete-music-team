import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen gradient-surface">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
