import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Utensils, Sparkles, ArrowRight, ArrowLeft, Star, Tag } from 'lucide-react';
import type { AgendaDayContent } from '../types';

interface AgendaViewProps {
  onNavigate: (tab: string) => void;
}

const DEFAULT_DAY1: AgendaDayContent = {
  theme: "Y2K",
  food: "Snacks provided",
  schedule: [
    { time: "9:00 – 9:30 AM", activity: "Welcome to the Freshers' Party & Speech — CSE Hall" },
    { time: "9:30 AM – 5:00 PM", activity: "Games (with one break in between): KBC, Hyrox, Human Tic-Tac-Toe, Balloon Game (Optional), 8 Brains (Finale)" },
    { time: "5:00 PM", activity: "Closing Ceremony, Awards & Assigning Tasks for Day 2" }
  ]
};

const DEFAULT_DAY2: AgendaDayContent = {
  theme: "Indo-Western",
  food: "Lunch 2:00 – 3:00 PM",
  schedule: [
    { time: "9:00 – 9:30 AM", activity: "Welcome" },
    { time: "9:30 AM – 12:00 PM", activity: "Introduce Yourself Uniquely" },
    { time: "12:00 – 2:00 PM", activity: "Culturals" },
    { time: "2:00 – 3:00 PM", activity: "Lunch" },
    { time: "3:00 – 5:00 PM", activity: "Stress Round — Mr & Mrs Fresher" },
    { time: "5:00 – 5:30 PM", activity: "Awards & Closing Ceremony" }
  ]
};

export const AgendaView: React.FC<AgendaViewProps> = ({ onNavigate }) => {
  const [activeDay, setActiveDay] = useState<'day1' | 'day2'>('day1');
  const [day1Data, setDay1Data] = useState<AgendaDayContent>(DEFAULT_DAY1);
  const [day2Data, setDay2Data] = useState<AgendaDayContent>(DEFAULT_DAY2);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/content/agenda_day1').then((res) => res.json()).catch(() => null),
      fetch('/api/content/agenda_day2').then((res) => res.json()).catch(() => null)
    ])
      .then(([d1, d2]) => {
        if (d1 && d1.data) setDay1Data(d1.data);
        if (d2 && d2.data) setDay2Data(d2.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const currentData = activeDay === 'day1' ? day1Data : day2Data;

  const currentTheme = currentData.theme || (activeDay === 'day1' ? 'Y2K' : 'Indo-Western');
  const currentFood = currentData.food || 
    (typeof currentData.food_provided === 'string' ? currentData.food_provided : '') || 
    (activeDay === 'day1' ? 'Snacks provided' : 'Lunch 2:00 – 3:00 PM');

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 pb-16 px-2">
      {/* Top Banner */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 bg-[#e61d23] text-[#fffdff] px-3.5 py-1 text-xs font-label-bold uppercase faux-border-white mb-3">
          <Calendar className="w-3.5 h-3.5" />
          <span>OFFICIAL EVENT SCHEDULE • 2-DAY GALA</span>
        </div>
        <h1 
          className="font-headline-display text-4xl sm:text-5xl md:text-6xl text-[#ffb4ab] uppercase tracking-tight distressed-text mb-2"
          data-text="PARTY LINEUP"
        >
          PARTY LINEUP
        </h1>
        <p className="text-xs md:text-sm text-[#e7bdb8] max-w-lg mx-auto font-body-md">
          Explore the official theme, food provisions, and timeline activities prepared for Batch 2026.
        </p>
      </div>

      {/* Day Selector Tabs */}
      <div className="grid grid-cols-2 gap-3 bg-[#131313] p-1.5 border-2 border-[#e61d23]">
        <button
          onClick={() => setActiveDay('day1')}
          className={`p-3 md:p-4 text-center transition-all cursor-pointer font-headline-md flex flex-col items-center justify-center gap-1 ${
            activeDay === 'day1'
              ? 'bg-[#e61d23] text-[#fffdff] faux-border-white -rotate-1'
              : 'bg-[#1c1b1b] text-[#ffb4ab] hover:bg-[#252525] border border-transparent'
          }`}
        >
          <span className="text-lg md:text-2xl uppercase">DAY 1</span>
          <span className="text-xs font-label-bold uppercase opacity-90">Day 1 Schedule</span>
        </button>

        <button
          onClick={() => setActiveDay('day2')}
          className={`p-3 md:p-4 text-center transition-all cursor-pointer font-headline-md flex flex-col items-center justify-center gap-1 ${
            activeDay === 'day2'
              ? 'bg-[#e61d23] text-[#fffdff] faux-border-white rotate-1'
              : 'bg-[#1c1b1b] text-[#ffb4ab] hover:bg-[#252525] border border-transparent'
          }`}
        >
          <span className="text-lg md:text-2xl uppercase">DAY 2</span>
          <span className="text-xs font-label-bold uppercase opacity-90">Day 2 Schedule</span>
        </button>
      </div>

      {/* Main Agenda Card */}
      <div className="bg-[#1c1b1b] border-2 border-[#e61d23] p-6 md:p-8 brutal-border space-y-6 relative overflow-hidden">
        {/* Prominent Theme and Food Highlights at the Top */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[#353535] pb-6">
          {/* Prominent Theme Line */}
          <div className="bg-[#242424] border-2 border-[#ffb4ab] p-4 flex flex-col justify-between shadow-[3px_3px_0px_0px_#e61d23]">
            <div className="flex items-center gap-1.5 text-[11px] font-label-bold text-[#ffb4ab] uppercase tracking-wider mb-1.5">
              <Sparkles className="w-4 h-4 text-[#e61d23]" />
              <span>THEME</span>
            </div>
            <div className="font-headline-display text-2xl md:text-3xl text-[#ffdad6] uppercase tracking-wide">
              {currentTheme}
            </div>
          </div>

          {/* Prominent Food Line */}
          <div className="bg-[#242424] border-2 border-[#e61d23] p-4 flex flex-col justify-between shadow-[3px_3px_0px_0px_#ffb4ab]">
            <div className="flex items-center gap-1.5 text-[11px] font-label-bold text-[#ffb4ab] uppercase tracking-wider mb-1.5">
              <Utensils className="w-4 h-4 text-[#ffb4ab]" />
              <span>FOOD</span>
            </div>
            <div className="font-headline-display text-2xl md:text-3xl text-[#ffdad6] uppercase tracking-wide">
              {currentFood}
            </div>
          </div>
        </div>

        {/* Schedule Timeline Header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-md text-xl text-[#e5e2e1] uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#ffb4ab]" />
              <span>SCHEDULE TIMELINE</span>
            </h3>
            <span className="text-[10px] bg-[#e61d23] text-[#fffdff] px-2.5 py-0.5 font-label-bold uppercase">
              {activeDay === 'day1' ? 'DAY 1 ITINERARY' : 'DAY 2 ITINERARY'}
            </span>
          </div>

          {/* Timeline List: Time on left, Activity on right */}
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-4 md:before:left-36 before:w-0.5 before:bg-[#353535] before:hidden md:before:block">
            {currentData.schedule && currentData.schedule.length > 0 ? (
              currentData.schedule.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#2a2a2a] border border-[#353535] hover:border-[#ffb4ab] p-4 flex flex-col md:flex-row md:items-center gap-3.5 md:gap-5 transition-all relative z-10"
                >
                  {/* Time (Left side) */}
                  <div className="bg-[#e61d23] text-[#fffdff] px-3 py-1.5 font-label-bold text-xs md:text-sm uppercase border border-[#ffdad6] shrink-0 md:w-36 text-center shadow-[2px_2px_0px_0px_#131313]">
                    {item.time}
                  </div>

                  {/* Activity (Right side) */}
                  <div className="flex-grow">
                    <div className="font-headline-md text-base md:text-lg text-[#e5e2e1] uppercase leading-snug">
                      {item.activity || item.title}
                    </div>
                    {item.description && (
                      <p className="text-xs text-[#c6c6c7] mt-1 font-body-md leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#767575] italic py-4">No schedule timeline published yet for this day.</p>
            )}
          </div>
        </div>

        {/* Optional Notes */}
        {currentData.notes && (
          <div className="bg-[#20201f] border border-[#5d3f3c] p-3.5 text-xs text-[#e7bdb8] flex items-center gap-2.5">
            <Star className="w-4 h-4 text-[#ffb4ab] shrink-0" />
            <span>
              <strong className="text-[#ffb4ab] uppercase font-label-bold">Notice: </strong>
              {currentData.notes}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('home')}
          className="w-full sm:w-auto bg-[#1c1b1b] hover:bg-[#252525] text-[#ffb4ab] px-5 py-3 font-label-bold text-xs uppercase border border-[#5d3f3c] flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO LIVE HOME</span>
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
