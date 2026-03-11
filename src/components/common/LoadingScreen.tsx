import React from 'react';
import { Music } from 'lucide-react';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center justify-center gap-4">
    <div className="relative">
      <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center animate-pulse">
        <Music className="w-8 h-8 text-white" />
      </div>
    </div>
    <p className="text-sm text-[var(--color-text-secondary)] font-medium">Loading...</p>
  </div>
);

export default LoadingScreen;
