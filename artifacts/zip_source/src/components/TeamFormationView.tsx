import React from 'react';
import { Users2, Shuffle, Sparkles, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, Award, Zap, HeartHandshake } from 'lucide-react';

interface TeamFormationViewProps {
  onNavigate: (tab: string) => void;
}

export const TeamFormationView: React.FC<TeamFormationViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 pb-16 px-2">
      {/* Top Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 bg-[#e61d23] text-[#fffdff] px-3.5 py-1 text-xs font-label-bold uppercase faux-border-white mb-3">
          <Shuffle className="w-3.5 h-3.5" />
          <span>SQUAD ARCHITECTURE • RANDOM BALANCED ASSIGNMENT</span>
        </div>
        <h1 
          className="font-headline-display text-4xl sm:text-5xl md:text-6xl text-[#ffb4ab] uppercase tracking-tight distressed-text mb-2"
          data-text="SQUAD ENGINE"
        >
          SQUAD ENGINE
        </h1>
        <p className="text-xs md:text-sm text-[#e7bdb8] max-w-lg mx-auto font-body-md">
          Zero awkward group picks. Equal chance for glory. Automatic team synergy.
        </p>
      </div>

      {/* Main Core Highlight Card */}
      <div className="bg-[#1c1b1b] border-2 border-[#e61d23] p-6 md:p-8 brutal-border relative overflow-hidden space-y-6">
        {/* Big Highlight Sentence Box */}
        <div className="bg-[#2a2a2a] border-2 border-[#ffb4ab] p-5 md:p-6 text-center">
          <span className="text-[11px] font-label-bold text-[#ffb4ab] uppercase tracking-widest block mb-1">
            ⚡ CORE SYSTEM ARCHITECTURE
          </span>
          <h2 className="font-headline-md text-2xl md:text-3xl text-[#e5e2e1] uppercase leading-snug">
            120 PARTICIPANTS WILL BE RANDOMLY DIVIDED INTO 15 TEAMS OF 8
          </h2>
          <p className="text-xs md:text-sm font-label-bold text-[#ffdad6] uppercase mt-2">
            Team assignments happen automatically after registration closes!
          </p>
        </div>

        {/* 3 Feature Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Point 1: Purely Random & Fair */}
          <div className="bg-[#20201f] border border-[#5d3f3c] p-4 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-[#e61d23] text-[#fffdff] flex items-center justify-center font-bold text-lg mb-3 border border-white">
                <Shuffle className="w-5 h-5" />
              </div>
              <h3 className="font-headline-md text-base text-[#ffb4ab] uppercase mb-1">
                Randomized Pairing
              </h3>
              <p className="text-xs text-[#c6c6c7] leading-relaxed">
                No need to scramble for a group. Our automated balancer places you into a fresh team where everyone starts on equal footing.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#353535] text-[10px] font-label-bold text-[#ffdad6] uppercase">
              ✓ Automated Algorithm
            </div>
          </div>

          {/* Point 2: Balanced Gender & Branch Mix */}
          <div className="bg-[#20201f] border border-[#5d3f3c] p-4 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-[#353535] text-[#ffb4ab] flex items-center justify-center font-bold text-lg mb-3 border border-[#ffb4ab]">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-headline-md text-base text-[#ffb4ab] uppercase mb-1">
                Gender & Branch Balance
              </h3>
              <p className="text-xs text-[#c6c6c7] leading-relaxed">
                Squads are evenly balanced with mixed branches and genders, giving you an authentic chance to meet students across the entire batch!
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#353535] text-[10px] font-label-bold text-[#ffdad6] uppercase">
              ✓ Optimal Diversity
            </div>
          </div>

          {/* Point 3: Revealed on Your VIP Pass */}
          <div className="bg-[#20201f] border border-[#5d3f3c] p-4 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-[#e61d23] text-[#fffdff] flex items-center justify-center font-bold text-lg mb-3 border border-white">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-headline-md text-base text-[#ffb4ab] uppercase mb-1">
                Live Squad Channel
              </h3>
              <p className="text-xs text-[#c6c6c7] leading-relaxed">
                Your squad badge, team name, and real-time team chat channel unlock right on your digital VIP pass.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#353535] text-[10px] font-label-bold text-[#ffdad6] uppercase">
              ✓ Digital Pass Badge
            </div>
          </div>
        </div>

        {/* Note / Info Callout */}
        <div className="bg-[#20201f] border border-[#5d3f3c] p-4 flex items-start gap-3">
          <HeartHandshake className="w-5 h-5 text-[#ffb4ab] shrink-0 mt-0.5" />
          <div className="text-xs text-[#e5e2e1] space-y-1">
            <p className="font-label-bold text-[#ffb4ab] uppercase">
              Notice: No Manual Grouping Needed
            </p>
            <p className="text-[#c6c6c7]">
              Simply complete your registration with your roll number and gender. The squad engine will group and balance teams automatically!
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('agenda')}
          className="w-full sm:w-auto bg-[#1c1b1b] hover:bg-[#252525] text-[#ffb4ab] px-5 py-3 font-label-bold text-xs uppercase border border-[#5d3f3c] flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO LINEUP</span>
        </button>

        <button
          onClick={() => onNavigate('join')}
          className="w-full sm:w-auto bg-[#e61d23] hover:bg-[#c00014] text-[#fffdff] px-8 py-3.5 font-headline-md text-lg uppercase border-2 border-white faux-border hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>SIGN UP / REGISTER NOW</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
