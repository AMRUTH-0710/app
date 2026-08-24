import React from 'react';

interface ComicNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  isAdmin: boolean;
}

export const ComicNav: React.FC<ComicNavProps> = ({ currentTab, onNavigate, isAdmin }) => {
  const navItems = [
    { id: 'home', label: 'MAIN', longLabel: 'MAIN PAGE', icon: 'home' },
    { id: 'join', label: 'SIGN UP', longLabel: 'REGISTER / SIGN UP', icon: 'person_add' },
    { id: 'pass', label: 'GET PASS', longLabel: 'GET YOUR PASS', icon: 'confirmation_number' },
    { id: 'scan', label: 'SCANNER', longLabel: 'GATE SCANNER', icon: 'qr_code_scanner' },
    { id: 'admin', label: 'ADMIN', longLabel: 'ADMIN CONSOLE', icon: 'settings' }
  ];

  return (
    <>
      {/* Mobile Fixed Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex items-center h-20 px-1 bg-[#1c1b1b] border-t-4 border-[#e61d23] md:hidden overflow-x-auto no-scrollbar justify-between">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-1.5 min-w-[58px] flex-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#e61d23] text-[#fffdff] rounded-none transform translate-y-[-2px] shadow-[2px_2px_0px_0px_#000000]'
                  : 'text-[#e7bdb8] hover:bg-[#ffb4ab] hover:text-[#690006]'
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-label-sm font-bold tracking-tighter mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Desktop Fixed Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 bg-[#1c1b1b] border-r-2 border-[#e61d23] flex-col gap-2 p-6 z-40 overflow-y-auto">
        <div className="font-label-bold text-xs text-[#ffb4ab] uppercase mb-2 tracking-widest border-b-2 border-[#e61d23] pb-2 flex items-center justify-between">
          <span>EVENT NAVIGATION</span>
          <span className="text-[10px] bg-[#e61d23] text-[#fffdff] px-2 py-0.5 font-bold">2026</span>
        </div>

        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3.5 p-2.5 font-label-bold text-xs uppercase tracking-wider transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-[#e61d23] text-[#fffdff] border-2 border-white faux-border font-bold -rotate-1 shadow-[3px_3px_0px_0px_#ffffff]'
                  : 'border border-transparent hover:border-[#ffb4ab] hover:bg-[#20201f] text-[#e5e2e1] hover:text-[#ffb4ab]'
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span>{item.longLabel}</span>
            </button>
          );
        })}

        {/* Decorative Badge */}
        <div className="mt-auto bg-[#20201f] border border-[#e61d23] p-3 text-center relative overflow-hidden shadow-[3px_3px_0px_0px_#e61d23]">
          <div className="text-[11px] font-label-bold text-[#ffdad6] uppercase tracking-wider">
            ⚡ FRESHER 26&apos;
          </div>
          <div className="font-headline-md text-xs text-[#ffb4ab] uppercase mt-1">
            BCOM ASSOCIATION
          </div>
          <div className="text-[9px] font-mono text-[#8e8d8d] uppercase mt-0.5">
            KLE TECH GOKUL CAMPUS
          </div>
        </div>
      </nav>
    </>
  );
};
