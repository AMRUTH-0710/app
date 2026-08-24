import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, MapPin, Clock, ArrowRight, ShieldCheck, Ticket, Mail, Heart, Phone, Users, AlertTriangle, CheckCircle2, Utensils, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InvitationLetterModal } from './InvitationLetterModal';
import type { AgendaDayContent } from '../types';

interface HomeViewProps {
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

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<'day1' | 'day2'>('day1');
  const [day1Data, setDay1Data] = useState<AgendaDayContent>(DEFAULT_DAY1);
  const [day2Data, setDay2Data] = useState<AgendaDayContent>(DEFAULT_DAY2);

  // Countdown timer to party date
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Event start date: September 1, 2026 at 9:00 AM
    const targetDate = new Date('2026-09-01T09:00:00');
    
    const calculateTime = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, targetDate.getTime() - now);
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch dynamic agenda data if updated by admin
  useEffect(() => {
    Promise.all([
      fetch('/api/content/agenda_day1').then((res) => res.json()).catch(() => null),
      fetch('/api/content/agenda_day2').then((res) => res.json()).catch(() => null)
    ]).then(([d1, d2]) => {
      if (d1 && d1.data) setDay1Data(d1.data);
      if (d2 && d2.data) setDay2Data(d2.data);
    });
  }, []);

  const currentData = activeDay === 'day1' ? day1Data : day2Data;
  const currentTheme = currentData.theme || (activeDay === 'day1' ? 'Y2K' : 'Indo-Western');
  const currentFood = currentData.food || 
    (typeof currentData.food_provided === 'string' ? currentData.food_provided : '') || 
    (activeDay === 'day1' ? 'Snacks provided' : 'Lunch 2:00 – 3:00 PM');

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-10 pb-20">
      {/* Invitation Letter Modal / Overlay */}
      <InvitationLetterModal
        isOpen={isLetterModalOpen}
        onClose={() => setIsLetterModalOpen(false)}
        onContinue={() => {
          setIsLetterModalOpen(false);
          onNavigate('join');
        }}
      />

      {/* Hero Section */}
      <section className="relative min-h-[65vh] flex flex-col items-center justify-center px-4 md:px-12 lightning-bg overflow-hidden rounded-none border border-[#e61d23]/30">
        {/* Atmospheric Background Image with Noise Overlay */}
        <div 
          className="absolute inset-0 z-[-1] opacity-35 mix-blend-screen bg-cover bg-center" 
          style={{ 
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCfc0Bzn4kynU79jftweWPaZpE29Xbs0mUUuOt2VCOkjEMdKUMIe9S2d_0KS9hhMQIyR3u3RaciCHPsobUXoU7H_GCb1j-psu4Ve3y4OvXrn5OSK9r0QPKoRTFWZQUk7hqJcmOSvV7Z2YC8Is35WPwpn-pEVOJo0Lw0xF1ceSicdQBYJ4z1Jy4XQwPrq5wTPDTjmGvw4AcWOwwZghXqWylDeSQjK7lhpQT9ycb50E6QCttpySEnGztf')" 
          }}
        />

        <div className="text-center z-10 w-full max-w-4xl pt-8 pb-10">
          {/* Header Sub-bar */}
          <div className="flex flex-wrap justify-between items-center w-full mb-6 font-label-bold text-xs md:text-sm text-[#ffb4ab] tracking-widest uppercase gap-2 px-2">
            <span>New Faces</span>
            <span className="hidden sm:inline">•</span>
            <span>New Stories</span>
            <span className="hidden sm:inline">•</span>
            <span>Same Vibes!</span>
          </div>

          {/* Giant Distressed Title: FRESHERS / '26 */}
          <div className="flex flex-col items-center justify-center my-3 select-none">
            <h1 
              className="text-[65px] sm:text-[110px] md:text-[150px] lg:text-[175px] leading-[0.85] font-headline-display tracking-tighter distressed-text transform -rotate-1 text-[#ffdad6]"
              data-text="FRESHERS"
            >
              FRESHERS
            </h1>
            <div 
              className="text-[55px] sm:text-[90px] md:text-[120px] lg:text-[145px] leading-[0.8] font-headline-display tracking-wider text-[#e61d23] distressed-text -mt-2 sm:-mt-5 md:-mt-8 transform rotate-1"
              data-text="'26"
            >
              &apos;26
            </div>
          </div>

          {/* Subtitle */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-headline-md text-[#e5e2e1] uppercase tracking-tight mb-2">
            The wait is over
          </h2>
          <p className="text-xs md:text-sm font-label-bold text-[#ffb4ab] uppercase tracking-wider mb-6">
            BCom Association (BAS) Organizes Freshers&apos; Party For Batch 2026
          </p>

          {/* Top Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <button 
              onClick={() => setIsLetterModalOpen(true)}
              className="bg-[#ffd700] hover:bg-[#ffe082] text-[#1a1402] font-headline-md text-lg md:text-xl px-8 py-3 uppercase border-2 border-black shadow-[4px_4px_0px_0px_#000000] hover:translate-x-1 hover:-translate-y-1 transition-transform cursor-pointer font-bold flex items-center gap-2"
            >
              <Mail className="w-5 h-5 text-[#1a1402]" />
              <span>OPEN GOLDEN INVITATION</span>
            </button>
            <button 
              onClick={() => onNavigate('pass')}
              className="brutal-border-white bg-[#131313] text-[#e5e2e1] font-headline-md text-lg md:text-xl px-8 py-3 uppercase hover:translate-x-1 hover:-translate-y-1 transition-transform cursor-pointer"
            >
              GET YOUR PASS
            </button>
          </div>
        </div>

        {/* Custom Lightning Divider */}
        <div className="absolute bottom-0 w-full h-8 opacity-60">
          <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 10" width="100%">
            <polyline fill="none" points="0,5 20,2 25,8 40,1 45,9 60,3 70,7 80,2 90,6 100,5" stroke="#e61d23" strokeWidth="0.75" />
          </svg>
        </div>
      </section>

      {/* 1. THE GOLDEN INVITATION TO BAS 2026 (COMES FIRST WHEN OPENING WEBSITE) */}
      <section className="px-2">
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setIsLetterModalOpen(true)}
          className="cursor-pointer bg-gradient-to-r from-[#2c2008] via-[#1c1b1b] to-[#2c2008] border-3 border-[#ffd700] p-6 md:p-8 shadow-[6px_6px_0px_0px_#ffd700] relative overflow-hidden group transition-all"
        >
          {/* Decorative golden sparkle badge */}
          <div className="absolute -top-1 -right-1 bg-[#ffd700] text-[#1a1402] text-[10px] font-label-bold px-3 py-1 uppercase tracking-widest font-bold border border-black shadow-[2px_2px_0px_0px_#000000]">
            ✨ OFFICIAL GOLDEN INVITATION
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-1">
            <div className="flex items-center gap-4 text-left">
              <div className="w-16 h-16 bg-[#3d2c08] border-2 border-[#ffd700] flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-[3px_3px_0px_0px_#000000]">
                <Mail className="w-8 h-8 text-[#ffd700]" />
              </div>
              <div>
                <div className="inline-block bg-[#ffd700] text-[#1a1402] text-[10px] font-label-bold px-2 py-0.5 uppercase tracking-wider mb-1 font-bold">
                  BCOM ASSOCIATION (BAS)
                </div>
                <h3 className="font-headline-md text-2xl md:text-3xl text-[#ffe082] group-hover:text-white uppercase transition-colors">
                  A GOLDEN INVITATION TO BAS 2026
                </h3>
                <p className="text-xs md:text-sm text-[#e7bdb8] font-body-md mt-0.5 max-w-xl">
                  Tap to open and read the sealed invitation letter from the Seniors, Student Council & Faculty.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-label-bold text-xs md:text-sm text-[#1a1402] bg-[#ffd700] hover:bg-[#ffe082] px-5 py-2.5 border-2 border-black uppercase tracking-wider shrink-0 font-bold shadow-[3px_3px_0px_0px_#000000]">
              <span>OPEN INVITATION</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. LIVE COUNTDOWN & DETAILS (WHEN / WHERE) */}
      <section className="bg-[#1c1b1b] border-2 border-[#e61d23] p-6 brutal-border relative mx-2">
        <div className="border-b border-[#353535] pb-3 mb-4 text-center">
          <div className="inline-flex items-center gap-1.5 bg-[#e61d23] text-[#fffdff] px-2.5 py-0.5 text-[10px] font-label-bold uppercase tracking-wider mb-1.5">
            <Clock className="w-3 h-3" />
            <span>LIVE EVENT COUNTDOWN</span>
          </div>
          <h2 className="font-headline-md text-2xl md:text-3xl uppercase text-[#ffb4ab] tracking-wider font-['Anton']">
            COUNTDOWN TO FRESHERS' PARTY
          </h2>
          <p className="text-xs text-[#c6c6c7] font-label-bold uppercase mt-0.5">
            KLE TECH GOKUL CAMPUS • SEPTEMBER 1 & 2, 2026 @ 9:00 AM
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center py-2 max-w-2xl mx-auto">
          {/* Days */}
          <div className="bg-[#242424] border-2 border-[#e61d23] p-3 sm:p-4 flex flex-col items-center justify-center shadow-[3px_3px_0px_0px_#ffb4ab]">
            <span 
              className="font-['Anton'] text-4xl sm:text-5xl md:text-6xl text-[#ffdad6] distressed-text leading-none select-none"
              data-text={String(timeLeft.days).padStart(2, '0')}
              style={{ fontFamily: "'Anton', sans-serif" }}
            >
              {String(timeLeft.days).padStart(2, '0')}
            </span>
            <span className="font-label-bold text-[10px] sm:text-xs text-[#ffb4ab] uppercase mt-2 tracking-widest">
              Days
            </span>
          </div>

          {/* Hours */}
          <div className="bg-[#242424] border-2 border-[#e61d23] p-3 sm:p-4 flex flex-col items-center justify-center shadow-[3px_3px_0px_0px_#ffb4ab]">
            <span 
              className="font-['Anton'] text-4xl sm:text-5xl md:text-6xl text-[#ffdad6] distressed-text leading-none select-none"
              data-text={String(timeLeft.hours).padStart(2, '0')}
              style={{ fontFamily: "'Anton', sans-serif" }}
            >
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="font-label-bold text-[10px] sm:text-xs text-[#ffb4ab] uppercase mt-2 tracking-widest">
              Hours
            </span>
          </div>

          {/* Minutes */}
          <div className="bg-[#242424] border-2 border-[#e61d23] p-3 sm:p-4 flex flex-col items-center justify-center shadow-[3px_3px_0px_0px_#ffb4ab]">
            <span 
              className="font-['Anton'] text-4xl sm:text-5xl md:text-6xl text-[#ffdad6] distressed-text leading-none select-none"
              data-text={String(timeLeft.minutes).padStart(2, '0')}
              style={{ fontFamily: "'Anton', sans-serif" }}
            >
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="font-label-bold text-[10px] sm:text-xs text-[#ffb4ab] uppercase mt-2 tracking-widest">
              Minutes
            </span>
          </div>

          {/* Seconds */}
          <div className="bg-[#242424] border-2 border-[#353535] p-3 sm:p-4 flex flex-col items-center justify-center shadow-[3px_3px_0px_0px_#e61d23]">
            <span 
              className="font-['Anton'] text-4xl sm:text-5xl md:text-6xl text-[#e5e2e1] leading-none select-none"
              style={{ fontFamily: "'Anton', sans-serif" }}
            >
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <span className="font-label-bold text-[10px] sm:text-xs text-[#c6c6c7] uppercase mt-2 tracking-widest">
              Seconds
            </span>
          </div>
        </div>
      </section>

      {/* Details Grid Section (When / Where) */}
      <section className="px-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date/Time Card */}
          <div className="border border-[#ffb4ab] bg-[#1c1b1b] p-8 relative overflow-hidden group hover:bg-[#2a2a2a] transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-[#ffb4ab] text-4xl">calendar_today</span>
            </div>
            <h3 className="font-label-bold text-xs text-[#ffb4ab] uppercase tracking-widest mb-2">When</h3>
            <p className="font-headline-lg-mobile text-3xl md:text-4xl text-[#e5e2e1] uppercase leading-none mb-1 font-headline-md">1 & 2 SEPT</p>
            <p className="font-headline-md text-xl text-[#e7bdb8]">2026</p>
            <div className="mt-6 font-label-sm bg-[#ffb4ab] text-[#690006] inline-block px-2.5 py-1 font-bold text-xs uppercase">
              09:00 AM ONWARDS
            </div>
          </div>

          {/* Venue Card (KLE Technological University, Gokul Campus) */}
          <div className="border border-[#ffb4ab] bg-[#1c1b1b] p-8 relative overflow-hidden group hover:bg-[#2a2a2a] transition-colors md:col-span-2">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-[#ffb4ab] text-4xl">location_on</span>
            </div>
            <h3 className="font-label-bold text-xs text-[#ffb4ab] uppercase tracking-widest mb-2">Where</h3>
            <p className="font-headline-lg-mobile text-2xl sm:text-3xl md:text-4xl text-[#e5e2e1] uppercase leading-tight mb-2 font-headline-md">
              KLE TECHNOLOGICAL UNIVERSITY
            </p>
            <p className="font-body-md text-[#e7bdb8] max-w-lg text-sm sm:text-base leading-relaxed">
              Gokul Campus, Gokul Road, Vidyanagar, Hubballi, Karnataka 580031<br />
              <span className="text-[#ffb4ab] text-xs font-label-bold mt-1 inline-block">CSE Main Hall • Cultural Stage • Activity Turf</span>
            </p>
            <div className="mt-6 pt-3 border-t border-[#353535] flex items-center justify-between">
              <span className="text-xs font-label-bold text-[#8e8d8d] uppercase tracking-wider">
                📍 VENUE CONFIRMED FOR BATCH 2026
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OFFICIAL 2-DAY EVENT AGENDA & LINEUP */}
      <section className="px-2">
        <div className="bg-[#1c1b1b] border-2 border-[#e61d23] p-6 md:p-8 brutal-border space-y-6 relative overflow-hidden">
          {/* Header */}
          <div className="text-center border-b border-[#353535] pb-4">
            <div className="inline-flex items-center gap-1.5 bg-[#e61d23] text-[#fffdff] px-3 py-1 text-xs font-label-bold uppercase faux-border-white mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>OFFICIAL EVENT SCHEDULE • 2-DAY GALA</span>
            </div>
            <h2 
              className="font-headline-display text-3xl sm:text-4xl md:text-5xl text-[#ffdad6] uppercase tracking-tight distressed-text"
              data-text="PARTY AGENDA & LINEUP"
            >
              PARTY AGENDA &amp; LINEUP
            </h2>
            <p className="text-xs sm:text-sm text-[#e7bdb8] font-body-md mt-1 max-w-lg mx-auto">
              Explore the complete theme, food provisions, and timeline activities for Batch 2026.
            </p>
          </div>

          {/* Day Selector Switcher */}
          <div className="grid grid-cols-2 gap-3 bg-[#131313] p-1.5 border-2 border-[#e61d23]">
            <button
              onClick={() => setActiveDay('day1')}
              className={`p-3 text-center transition-all cursor-pointer font-headline-md flex flex-col items-center justify-center gap-0.5 ${
                activeDay === 'day1'
                  ? 'bg-[#e61d23] text-[#fffdff] faux-border-white -rotate-1 shadow-[2px_2px_0px_0px_#ffffff]'
                  : 'bg-[#1c1b1b] text-[#ffb4ab] hover:bg-[#252525] border border-transparent'
              }`}
            >
              <span className="text-lg md:text-2xl uppercase">DAY 1</span>
              <span className="text-[11px] font-label-bold uppercase opacity-90">September 1, 2026</span>
            </button>

            <button
              onClick={() => setActiveDay('day2')}
              className={`p-3 text-center transition-all cursor-pointer font-headline-md flex flex-col items-center justify-center gap-0.5 ${
                activeDay === 'day2'
                  ? 'bg-[#e61d23] text-[#fffdff] faux-border-white rotate-1 shadow-[2px_2px_0px_0px_#ffffff]'
                  : 'bg-[#1c1b1b] text-[#ffb4ab] hover:bg-[#252525] border border-transparent'
              }`}
            >
              <span className="text-lg md:text-2xl uppercase">DAY 2</span>
              <span className="text-[11px] font-label-bold uppercase opacity-90">September 2, 2026</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              {/* Prominent Theme & Food Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Theme Card */}
                <div className="bg-[#242424] border-2 border-[#ffb4ab] p-4 flex flex-col justify-between shadow-[3px_3px_0px_0px_#e61d23]">
                  <div className="flex items-center gap-1.5 text-[11px] font-label-bold text-[#ffb4ab] uppercase tracking-wider mb-1">
                    <Sparkles className="w-4 h-4 text-[#e61d23]" />
                    <span>OFFICIAL THEME</span>
                  </div>
                  <div className="font-headline-display text-2xl md:text-3xl text-[#ffdad6] uppercase tracking-wide">
                    {currentTheme}
                  </div>
                </div>

                {/* Food Card */}
                <div className="bg-[#242424] border-2 border-[#e61d23] p-4 flex flex-col justify-between shadow-[3px_3px_0px_0px_#ffb4ab]">
                  <div className="flex items-center gap-1.5 text-[11px] font-label-bold text-[#ffb4ab] uppercase tracking-wider mb-1">
                    <Utensils className="w-4 h-4 text-[#ffb4ab]" />
                    <span>FOOD PROVISION</span>
                  </div>
                  <div className="font-headline-display text-2xl md:text-3xl text-[#ffdad6] uppercase tracking-wide">
                    {currentFood}
                  </div>
                </div>
              </div>

              {/* Schedule Timeline Header & List */}
              <div>
                <div className="flex items-center justify-between mb-3 pt-2">
                  <h3 className="font-headline-md text-lg text-[#e5e2e1] uppercase tracking-wide flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#ffb4ab]" />
                    <span>TIMELINE SCHEDULE</span>
                  </h3>
                  <span className="text-[10px] bg-[#e61d23] text-[#fffdff] px-2.5 py-0.5 font-label-bold uppercase">
                    {activeDay === 'day1' ? 'DAY 1 ITINERARY' : 'DAY 2 ITINERARY'}
                  </span>
                </div>

                <div className="space-y-2.5 relative before:absolute before:inset-0 before:left-4 md:before:left-36 before:w-0.5 before:bg-[#353535] before:hidden md:before:block">
                  {currentData.schedule && currentData.schedule.length > 0 ? (
                    currentData.schedule.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-[#242424] border border-[#353535] hover:border-[#ffb4ab] p-3.5 flex flex-col md:flex-row md:items-center gap-3 transition-all relative z-10"
                      >
                        {/* Time */}
                        <div className="bg-[#e61d23] text-[#fffdff] px-3 py-1 font-label-bold text-xs md:text-sm uppercase border border-[#ffdad6] shrink-0 md:w-36 text-center shadow-[2px_2px_0px_0px_#131313]">
                          {item.time}
                        </div>

                        {/* Activity */}
                        <div className="flex-grow">
                          <div className="font-headline-md text-base md:text-lg text-[#e5e2e1] uppercase leading-snug">
                            {item.activity || item.title}
                          </div>
                          {item.description && (
                            <p className="text-xs text-[#c6c6c7] mt-0.5 font-body-md leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#767575] italic py-3">No schedule timeline published yet for this day.</p>
                  )}
                </div>
              </div>

              {/* Optional Notes */}
              {currentData.notes && (
                <div className="bg-[#20201f] border border-[#5d3f3c] p-3 text-xs text-[#e7bdb8] flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#ffb4ab] shrink-0" />
                  <span>
                    <strong className="text-[#ffb4ab] uppercase font-label-bold">Notice: </strong>
                    {currentData.notes}
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 3. HIGHLIGHTED OFFICIAL NOTICE FOR JUNIORS: Team Allocation Notice */}
      <section className="px-2">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-[#2a1215] via-[#1f1717] to-[#2a1215] border-3 border-[#e61d23] p-6 md:p-7 shadow-[6px_6px_0px_0px_#e61d23] overflow-hidden"
        >
          {/* Accent corner tag */}
          <div className="absolute -top-1 -right-1 bg-[#e61d23] text-[#fffdff] text-[10px] font-label-bold px-3 py-1 uppercase tracking-widest border border-black shadow-[2px_2px_0px_0px_#000000]">
            ⚡ MUST READ FOR JUNIORS
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="w-14 h-14 bg-[#e61d23] text-white flex items-center justify-center shrink-0 border-2 border-white shadow-[3px_3px_0px_0px_#000000]">
              <Users className="w-8 h-8" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-[#ffdad6] text-[#93000a] text-xs font-label-bold px-2 py-0.5 uppercase tracking-wider font-bold">
                  TEAM ALLOCATION NOTICE
                </span>
                <span className="text-[#ffb4ab] text-xs font-mono">📢 OFFICIAL UPDATE</span>
              </div>

              <h3 className="font-headline-md text-xl md:text-2xl text-[#ffdad6] tracking-wide uppercase">
                TEAMS WILL BE MADE RANDOMLY!
              </h3>

              <p className="text-sm md:text-base text-[#e5e2e1] font-body-md mt-1.5 leading-relaxed">
                Please note that <strong className="text-[#ffb4ab] font-bold">all teams will be formed randomly</strong> and the <strong className="text-[#ffb4ab] font-bold">volunteers will be deciding the teams</strong>. You will get to know your assigned team and squad members <strong className="text-white bg-[#e61d23] px-1.5 py-0.5 font-bold">A DAY PRIOR</strong> to the event!
              </p>

              <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-3.5">
                <div className="bg-[#1c1b1b] border border-[#ffb4ab]/40 px-2.5 py-1 text-xs font-label-bold text-[#ffdad6] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#ffb4ab]" />
                  <span>Random Team Balancing</span>
                </div>
                <div className="bg-[#1c1b1b] border border-[#ffb4ab]/40 px-2.5 py-1 text-xs font-label-bold text-[#ffdad6] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#ffb4ab]" />
                  <span>Volunteer Moderated</span>
                </div>
                <div className="bg-[#1c1b1b] border border-[#ffb4ab]/40 px-2.5 py-1 text-xs font-label-bold text-[#ffdad6] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#ffb4ab]" />
                  <span>Squad Reveal: 1 Day Before</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 4. Quick Action Bento Grid (Pass Lookup & Contacts) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2">
        {/* Get Your Pass Card */}
        <button
          onClick={() => onNavigate('pass')}
          className="bg-[#1c1b1b] border-2 border-[#e61d23] p-6 text-left faux-border hover:-translate-y-1 transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <Ticket className="w-6 h-6 text-[#ffb4ab]" />
            <span className="text-[11px] font-label-bold text-[#ffb4ab] uppercase">Instant Access</span>
          </div>
          <div className="font-headline-md text-2xl text-[#ffdad6] group-hover:text-[#ffb4ab] transition-colors">
            GET YOUR PASS
          </div>
          <p className="text-xs text-[#c6c6c7] mt-1.5 font-body-md leading-relaxed">
            Already registered? Enter your Roll Number or Pass ID to view, download high-res PNG badge, or present QR for entry.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-label-bold text-[#ffb4ab] uppercase">
            <span>CLAIM / LOOKUP PASS</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Contacts & Organizers Card */}
        <div className="bg-[#1c1b1b] border-2 border-[#ffb4ab] p-6 text-left faux-border-white hover:-translate-y-1 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <Phone className="w-6 h-6 text-[#ffb4ab]" />
            <span className="text-[11px] font-label-bold text-[#ffb4ab] uppercase">Organizers & Helpline</span>
          </div>
          <div className="font-headline-md text-2xl text-[#ffdad6] group-hover:text-[#ffb4ab] transition-colors">
            CONTACTS
          </div>
          <div className="mt-2 space-y-2 text-xs">
            <div className="flex items-center justify-between bg-[#242424] p-2 border border-[#5d3f3c]">
              <div>
                <div className="flex items-center gap-1.5">
                  <strong className="text-[#ffdad6]">Amruth P</strong>
                  <span className="text-[10px] font-label-bold bg-[#e61d23] text-white px-1.5 py-0.2 uppercase">GS</span>
                </div>
                <span className="text-[#ffb4ab] font-mono text-xs">7019475272</span>
              </div>
              <a
                href="tel:7019475272"
                className="bg-[#e61d23] text-white px-2 py-1 text-[10px] font-label-bold uppercase hover:bg-[#c00014]"
              >
                CALL
              </a>
            </div>

            <div className="flex items-center justify-between bg-[#242424] p-2 border border-[#5d3f3c]">
              <div>
                <div className="flex items-center gap-1.5">
                  <strong className="text-[#ffdad6]">GP</strong>
                  <span className="text-[10px] font-label-bold bg-[#e61d23] text-white px-1.5 py-0.2 uppercase">GS</span>
                </div>
                <span className="text-[#ffb4ab] font-mono text-xs">9632270887</span>
              </div>
              <a
                href="tel:9632270887"
                className="bg-[#e61d23] text-white px-2 py-1 text-[10px] font-label-bold uppercase hover:bg-[#c00014]"
              >
                CALL
              </a>
            </div>
          </div>

          <button
            onClick={() => onNavigate('contacts')}
            className="mt-3 w-full bg-[#131313] hover:bg-[#e61d23] hover:text-white text-[#ffb4ab] py-2 text-xs font-label-bold uppercase text-center border border-[#5d3f3c] transition-colors cursor-pointer"
          >
            VIEW ALL CONTACTS & DETAILS →
          </button>
        </div>
      </section>

      {/* 5. FINAL / BOTTOM "REGISTER NOW" CTA SECTION */}
      <section className="px-2">
        <div className="bg-[#1c1b1b] border-3 border-[#e61d23] p-8 md:p-10 text-center relative overflow-hidden shadow-[8px_8px_0px_0px_#e61d23]">
          {/* Background subtle noise and lightning accent */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e61d23_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 bg-[#e61d23] text-white px-3 py-1 text-[11px] font-label-bold uppercase tracking-widest mb-3 shadow-[2px_2px_0px_0px_#000000]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OFFICIAL BATCH 2026 REGISTRATION</span>
            </div>

            <h2 className="font-headline-display text-4xl sm:text-5xl md:text-6xl text-[#ffdad6] uppercase tracking-tight leading-none mb-3">
              REGISTER FOR FRESHERS &apos;26
            </h2>

            <p className="text-sm sm:text-base text-[#e7bdb8] font-body-md max-w-lg mb-6 leading-relaxed">
              Haven&apos;t registered yet? Fill in your details, secure your official entry pass, and get ready for the ultimate welcome party!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
              <button
                onClick={() => onNavigate('join')}
                className="w-full sm:w-auto bg-[#e61d23] text-white font-headline-md text-2xl md:text-3xl px-10 md:px-14 py-4 uppercase border-2 border-white shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-1 hover:-translate-y-1 transition-transform cursor-pointer"
              >
                REGISTER NOW →
              </button>
              <button
                onClick={() => onNavigate('pass')}
                className="w-full sm:w-auto bg-[#242424] text-[#ffdad6] font-headline-md text-xl md:text-2xl px-8 py-4 uppercase border-2 border-[#5d3f3c] hover:border-[#ffb4ab] transition-colors cursor-pointer"
              >
                LOOKUP EXISTING PASS
              </button>
            </div>

            <div className="mt-6 flex flex-wrap justify-center items-center gap-4 text-xs font-label-bold text-[#8e8d8d] uppercase">
              <span>⚡ Free Entry</span>
              <span>•</span>
              <span>🎟️ Instant QR ID</span>
              <span>•</span>
              <span>🏛️ KLE Tech Gokul Campus</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
