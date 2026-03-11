import React from 'react';
import { Eye, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, user, stopImpersonating } = useAuth();

  if (!isImpersonating || !user) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between text-[13px] font-semibold shadow-md">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4" />
        <span>Viewing as <strong>{user.displayName}</strong></span>
      </div>
      <button
        onClick={stopImpersonating}
        className="flex items-center gap-1.5 px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-[12px] font-semibold transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Return to Admin
      </button>
    </div>
  );
};

export default ImpersonationBanner;
