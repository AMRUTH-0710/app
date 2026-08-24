import React from 'react';
import { Shield, Sparkles, Zap, ShieldCheck } from 'lucide-react';

interface ComicHeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
}

export const ComicHeader: React.FC<ComicHeaderProps> = ({
  currentTab,
  onNavigate,
  isAdmin,
  onOpenAdminLogin
}) => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-12 py-3 bg-[#131313]/90 backdrop-blur-md border-b-2 border-[#e61d23]/40">
      {/* Left Menu / Navigation Trigger */}
      <button 
        onClick={() => onNavigate('home')}
        className="text-[#ffb4ab] hover:text-[#e61d23] scale-95 active:duration-75 transition-colors flex items-center gap-2 p-1 cursor-pointer"
        title="Home"
      >
        <span className="material-symbols-outlined text-2xl md:text-3xl">menu</span>
      </button>

      {/* Main Title: BCOM ASSOCIATION */}
      <div 
        onClick={() => onNavigate('home')}
        className="cursor-pointer font-headline-md text-xl md:text-2xl lg:text-3xl uppercase tracking-wider text-[#ffdad6] distressed-text text-center flex-1 select-none hover:scale-105 transition-transform"
        data-text="BCOM ASSOCIATION"
      >
        BCOM ASSOCIATION
      </div>

      {/* Right Action: Admin / Bolt Trigger */}
      <div className="flex items-center gap-3">
        {isAdmin ? (
          <button
            onClick={() => onNavigate('admin')}
            className="flex items-center gap-1.5 bg-[#e61d23] text-[#fffdff] border border-[#ffb4ab] px-3 py-1 text-xs font-label-bold uppercase faux-border-white hover:scale-105 transition-all cursor-pointer"
            title="Admin Portal Active"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ADMIN</span>
          </button>
        ) : (
          <button
            onClick={onOpenAdminLogin}
            className="text-[#ffb4ab] hover:text-[#e61d23] scale-95 active:duration-75 transition-colors p-1 flex items-center cursor-pointer"
            title="Admin Portal"
          >
            <span className="material-symbols-outlined text-2xl md:text-3xl">bolt</span>
          </button>
        )}
      </div>
    </header>
  );
};
