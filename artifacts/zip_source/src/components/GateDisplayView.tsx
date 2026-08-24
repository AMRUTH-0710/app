import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv2, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Users, 
  CheckCircle2, 
  ShieldCheck, 
  Radio, 
  ArrowLeft,
  KeyRound,
  AlertTriangle
} from 'lucide-react';
import type { Registration, StatsResponse, ScanResult } from '../types';
import { sounds } from '../utils/sound';
import { fireBigScreenCelebration, fireComicConfetti } from '../utils/confetti';

interface GateDisplayViewProps {
  isAdmin: boolean;
  adminToken?: string;
  onAdminLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onBackToScanner: () => void;
}

export const GateDisplayView: React.FC<GateDisplayViewProps> = ({
  isAdmin,
  adminToken,
  onAdminLogin,
  onBackToScanner
}) => {
  // Login Form state if not admin
  const [loginEmail, setLoginEmail] = useState('admin@frenzy.edu');
  const [loginPass, setLoginPass] = useState('frenzy2024');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Big Screen Reveal State
  const [activeReveal, setActiveReveal] = useState<{
    registration: Registration;
    timestamp: string;
  } | null>(null);
  const [revealCountdown, setRevealCountdown] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Live Attendance Stats
  const [stats, setStats] = useState<StatsResponse>({
    total_whitelist: 14,
    total_registered: 0,
    total_scanned: 0,
    total_pending: 0
  });

  // Recent scanned history ticker
  const [recentScans, setRecentScans] = useState<Registration[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastProcessedTimeRef = useRef<string>('');

  // Handle Admin Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const result = await onAdminLogin(loginEmail, loginPass);
      if (!result.success) {
        setLoginError(result.error || 'Access Denied: Admin { admin: true } claim required.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  // Trigger the Fullscreen Big Reveal Animation
  const triggerReveal = (registration: Registration, timestamp: string) => {
    if (lastProcessedTimeRef.current === timestamp) return;
    lastProcessedTimeRef.current = timestamp;

    setActiveReveal({ registration, timestamp });
    setRevealCountdown(4);

    // Play Fanfare Audio
    if (soundEnabled) {
      sounds.playFanfare();
    }

    // Fire Big Screen Halftone Confetti
    fireBigScreenCelebration();

    // Add to recent ticker list
    setRecentScans((prev) => {
      const filtered = prev.filter((r) => r.roll_no !== registration.roll_no);
      return [registration, ...filtered.slice(0, 7)];
    });
  };

  // Countdown timer to auto-clear reveal back to standby
  useEffect(() => {
    if (!activeReveal || revealCountdown <= 0) {
      if (revealCountdown <= 0) setActiveReveal(null);
      return;
    }

    const timer = setTimeout(() => {
      setRevealCountdown((c) => Math.max(0, c - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [activeReveal, revealCountdown]);

  // Real-time EventSource (SSE) Listener
  useEffect(() => {
    if (!isAdmin || !adminToken) return;

    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        const streamUrl = `/api/scan/stream?token=${encodeURIComponent(adminToken)}`;
        eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'valid_scan' && data.reveal?.registration) {
              triggerReveal(data.reveal.registration, data.reveal.timestamp);
              if (data.reveal.stats) setStats(data.reveal.stats);
            } else if (data.type === 'connected') {
              setIsConnected(true);
              if (data.stats) setStats(data.stats);
            }
          } catch (e) {
            // ignore parse error
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
        };
      } catch (e) {
        setIsConnected(false);
      }
    };

    // Polling fallback to guarantee zero missed scans
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/scan/latest', {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.stats) setStats(data.stats);
          if (data.latest && data.latest.registration) {
            const scanTime = new Date(data.latest.timestamp).getTime();
            const now = Date.now();
            // If scan happened in last 6 seconds and hasn't been shown yet
            if (now - scanTime < 6000 && lastProcessedTimeRef.current !== data.latest.timestamp) {
              triggerReveal(data.latest.registration, data.latest.timestamp);
            }
          }
        }
      } catch (e) {
        // ignore
      }
    };

    connectSSE();
    pollInterval = setInterval(fetchLatest, 2500);

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isAdmin, adminToken, soundEnabled]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Test reveal trigger for sound & visual check
  const handleTestDisplayReveal = () => {
    const mockGuest: Registration = {
      roll_no: 'FRESH-003',
      name: 'Gwen Stacy',
      branch: 'Engineering',
      phone: '+1 (555) 019-1002',
      email: 'gwen.stacy@university.edu',
      gender: 'Female',
      squad_name: 'Squad Alpha',
      qr_code_id: 'FF-1002',
      status: 'scanned',
      registered_at: new Date().toISOString(),
      scanned_at: new Date().toISOString()
    };
    triggerReveal(mockGuest, `test-${Date.now()}`);
  };

  // If Admin is not logged in, render the Comic Login Gate
  if (!isAdmin) {
    return (
      <div className="w-full max-w-md mx-auto py-8 px-2">
        <div className="comic-panel-pink p-6 md:p-8 -rotate-1 relative">
          <div className="border-b-4 border-[#00FFFF] pb-4 mb-6 flex items-center justify-between">
            <div>
              <span className="font-label-bold text-xs text-[#39FF14] uppercase">BIG SCREEN RESTRICTED</span>
              <h2 className="font-headline-lg text-2xl md:text-3xl text-[#FF00FF] uppercase tracking-wide">
                PROJECTOR DISPLAY LOGIN
              </h2>
            </div>
            <Tv2 className="w-8 h-8 text-[#00FFFF]" />
          </div>

          <p className="text-xs md:text-sm text-[#e5e2e1] mb-4 font-body-md">
            The Gate Display mode is secured by the administrator account with the <code className="text-[#39FF14] bg-[#131313] px-1 py-0.5 border border-[#39FF14]/30">{'{ admin: true }'}</code> claim to prevent unauthorized access.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-label-bold text-[#00FFFF] uppercase mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-[#131313] border-2 border-[#FF00FF] p-3 text-sm text-[#00FFFF] font-label-bold outline-none focus:border-[#39FF14]"
              />
            </div>

            <div>
              <label className="block text-xs font-label-bold text-[#00FFFF] uppercase mb-1">
                Security Password
              </label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#131313] border-2 border-[#FF00FF] p-3 text-sm text-[#00FFFF] font-label-bold outline-none focus:border-[#39FF14]"
              />
            </div>

            {loginError && (
              <div className="bg-[#350505] border-2 border-[#ffb4ab] p-2.5 text-xs text-[#ffb4ab] font-label-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#ffb4ab] mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full comic-button py-3 text-lg uppercase tracking-wider cursor-pointer mt-2 flex items-center justify-center gap-2"
            >
              {loggingIn ? 'VERIFYING ADMIN...' : 'UNLOCK GATE DISPLAY'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-6xl mx-auto flex flex-col gap-4 pb-12 px-2 select-none relative overflow-hidden"
    >
      {/* Top Controls Bar for Projector Operator */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131313] border-3 border-[#00FFFF] p-3 shadow-[4px_4px_0px_0px_#FF00FF] z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToScanner}
            className="bg-[#1c1b1b] hover:bg-[#FF00FF] text-[#00FFFF] hover:text-[#000000] p-1.5 border-2 border-[#000000] transition-colors cursor-pointer flex items-center gap-1 text-xs font-label-bold uppercase"
            title="Back to Gate Scanner"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">GATE SCANNER</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-headline-lg text-lg text-[#00FFFF] uppercase tracking-wide flex items-center gap-1.5">
              <Tv2 className="w-5 h-5 text-[#39FF14]" />
              <span>MAIN ENTRANCE PROJECTOR DISPLAY</span>
            </span>
          </div>
        </div>

        {/* Status Indicators & Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Live Sync Status */}
          <div className="flex items-center gap-1.5 bg-[#1c1b1b] border border-[#39FF14] px-2.5 py-1 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#39FF14] animate-ping' : 'bg-[#ffb4ab]'}`} />
            <span className={isConnected ? 'text-[#39FF14]' : 'text-[#ffb4ab]'}>
              {isConnected ? 'LIVE SYNC' : 'CONNECTING...'}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 border border-[#000000] text-xs font-label-bold uppercase cursor-pointer flex items-center gap-1 transition-all ${
              soundEnabled ? 'bg-[#39FF14] text-[#000000]' : 'bg-[#1c1b1b] text-[#a4899d]'
            }`}
            title={soundEnabled ? 'Fanfare Audio Enabled' : 'Audio Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundEnabled ? 'AUDIO ON' : 'MUTED'}</span>
          </button>

          {/* Test Trigger */}
          <button
            onClick={handleTestDisplayReveal}
            className="bg-[#FF00FF] hover:bg-[#ffabf3] text-[#000000] px-2.5 py-1 border border-[#000000] text-xs font-label-bold uppercase cursor-pointer shadow-[2px_2px_0px_0px_#000000]"
          >
            TEST REVEAL
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="bg-[#00FFFF] hover:bg-[#39FF14] text-[#000000] p-1.5 border border-[#000000] text-xs font-label-bold uppercase cursor-pointer"
            title="Toggle Fullscreen Projector Mode"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Projector Stage Area */}
      <div className="relative w-full min-h-[580px] bg-[#0A0B10] border-4 border-[#39FF14] shadow-[0_0_40px_rgba(57,255,20,0.3)] p-6 md:p-10 flex flex-col justify-between overflow-hidden halftone-bg">
        
        {/* Background Comic Glow Waves */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FF00FF]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#00FFFF]/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* STATE A: ACTIVE WOW CELEBRATORY REVEAL SCREEN */}
        {activeReveal ? (
          <div className="relative z-30 flex flex-col items-center justify-center my-auto py-8 animate-in fade-in zoom-in-90 duration-300">
            
            {/* Comic Explosive Jagged Burst Backdrop */}
            <div className="relative flex items-center justify-center mb-6">
              {/* Rotating Starburst Glow */}
              <div className="w-48 h-48 md:w-64 md:h-64 bg-[#FFE600] border-4 border-[#000000] shadow-[8px_8px_0px_0px_#000000] rounded-none rotate-12 flex items-center justify-center animate-spin-slow">
                <div className="w-full h-full bg-[#FF00FF] border-4 border-[#000000] -rotate-45 flex items-center justify-center">
                  <div className="w-full h-full bg-[#39FF14] border-4 border-[#000000] rotate-25 flex items-center justify-center">
                    <span className="font-onomatopoeia text-4xl md:text-6xl text-[#000000] tracking-wider uppercase drop-shadow-[2px_2px_0px_#FFFFFF]">
                      POW!
                    </span>
                  </div>
                </div>
              </div>

              {/* Foreground Banner */}
              <div className="absolute bg-[#000000] border-4 border-[#39FF14] px-6 py-2 shadow-[6px_6px_0px_0px_#FF00FF] -rotate-2">
                <span className="font-onomatopoeia text-2xl md:text-4xl text-[#39FF14] uppercase tracking-widest neon-glow-green">
                  💥 ACCESS GRANTED 💥
                </span>
              </div>
            </div>

            {/* Giant Comic Reveal Hero Card */}
            <div className="w-full max-w-2xl bg-[#1c1b1b] border-4 border-[#00FFFF] shadow-[12px_12px_0px_0px_#FF00FF] p-6 md:p-8 transform -rotate-1 relative">
              
              {/* Comic Rubber Stamp: VIP ADMITTED */}
              <div className="absolute -top-5 -right-5 md:-top-7 md:-right-7 bg-[#39FF14] border-4 border-[#000000] px-4 py-1.5 rotate-12 shadow-[4px_4px_0px_0px_#000000] z-20">
                <span className="font-onomatopoeia text-lg md:text-2xl text-[#000000] uppercase tracking-wider">
                  ★ VIP ADMITTED ★
                </span>
              </div>

              {/* Attendee Info Display */}
              <div className="text-center space-y-4">
                <div>
                  <span className="text-xs md:text-sm font-label-bold text-[#FF00FF] uppercase tracking-widest block mb-1">
                    WELCOME FRESHER TO FRENZY 2024
                  </span>
                  <h1 className="font-onomatopoeia text-4xl sm:text-6xl md:text-7xl text-[#FFFFFF] uppercase tracking-wide drop-shadow-[4px_4px_0px_#000000]">
                    {activeReveal.registration.name}
                  </h1>
                </div>

                {/* Badges Row: Roll No & Branch */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <div className="bg-[#131313] border-2 border-[#00FFFF] px-4 py-2 shadow-[3px_3px_0px_0px_#000000]">
                    <span className="text-[11px] font-label-bold text-[#a4899d] block uppercase">ROLL NUMBER</span>
                    <span className="font-mono text-xl md:text-2xl font-bold text-[#00FFFF]">
                      {activeReveal.registration.roll_no}
                    </span>
                  </div>

                  <div className="bg-[#131313] border-2 border-[#FFE600] px-4 py-2 shadow-[3px_3px_0px_0px_#000000]">
                    <span className="text-[11px] font-label-bold text-[#a4899d] block uppercase">DEPARTMENT / BRANCH</span>
                    <span className="font-headline-lg text-lg md:text-xl text-[#FFE600] uppercase">
                      {activeReveal.registration.branch}
                    </span>
                  </div>

                  {/* Assigned Squad Badge if available */}
                  {activeReveal.registration.squad_name && (
                    <div className="bg-[#052600] border-2 border-[#39FF14] px-4 py-2 shadow-[3px_3px_0px_0px_#000000]">
                      <span className="text-[11px] font-label-bold text-[#39FF14] block uppercase">ASSIGNED SQUAD</span>
                      <span className="font-headline-lg text-lg md:text-xl text-[#39FF14] uppercase">
                        ⚡ {activeReveal.registration.squad_name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Scan Timestamp */}
                <div className="text-xs font-mono text-[#a4899d] pt-2">
                  Gate Check-in Time: {new Date(activeReveal.timestamp).toLocaleTimeString()} • Pass ID: #{activeReveal.registration.qr_code_id}
                </div>
              </div>

              {/* Reveal Progress / Reset Timer Line */}
              <div className="w-full bg-[#131313] h-2.5 border border-[#564052] mt-6 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#39FF14] via-[#00FFFF] to-[#FF00FF] transition-all duration-1000 ease-linear"
                  style={{ width: `${(revealCountdown / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* STATE B: STANDBY ENTRANCE DASHBOARD */
          <div className="relative z-10 flex flex-col justify-between h-full gap-8 my-auto py-4">
            {/* Header / Hero Graphic */}
            <div className="text-center space-y-2">
              <div className="inline-block bg-[#FF00FF] border-3 border-[#000000] px-4 py-1 -rotate-1 shadow-[4px_4px_0px_0px_#00FFFF] mb-2">
                <span className="font-onomatopoeia text-sm md:text-lg text-[#000000] uppercase tracking-widest">
                  ⚡ OFFICIAL COLLEGE FRESHER WELCOME 2024 ⚡
                </span>
              </div>
              <h1 className="font-onomatopoeia text-4xl sm:text-6xl md:text-7xl text-[#00FFFF] uppercase tracking-wider neon-glow-cyan">
                FRESHER FRENZY
              </h1>
              <p className="font-label-bold text-sm md:text-lg text-[#dcbed4] uppercase tracking-wide max-w-xl mx-auto">
                SCAN YOUR VIP QR PASS AT THE GATE SCANNER TO ENTER
              </p>
            </div>

            {/* Attendance Bento Stats & Live Radar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
              
              {/* Box 1: Total Scanned & Admitted */}
              <div className="bg-[#131313] border-3 border-[#39FF14] p-6 text-center shadow-[6px_6px_0px_0px_#000000] relative overflow-hidden">
                <div className="text-xs font-label-bold text-[#39FF14] uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CHECKED IN / IN PARTY</span>
                </div>
                <div className="font-onomatopoeia text-5xl md:text-6xl text-[#39FF14]">
                  {stats.total_scanned}
                </div>
                <span className="text-[11px] text-[#a4899d] font-mono mt-1 block">
                  Freshers on Dance Floor
                </span>
              </div>

              {/* Box 2: Total Registered Freshers */}
              <div className="bg-[#131313] border-3 border-[#FF00FF] p-6 text-center shadow-[6px_6px_0px_0px_#000000] relative overflow-hidden">
                <div className="text-xs font-label-bold text-[#FF00FF] uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>TOTAL REGISTERED</span>
                </div>
                <div className="font-onomatopoeia text-5xl md:text-6xl text-[#FF00FF]">
                  {stats.total_registered}
                </div>
                <span className="text-[11px] text-[#a4899d] font-mono mt-1 block">
                  Eligible VIP Attendees
                </span>
              </div>

              {/* Box 3: Live Radar Pulse */}
              <div className="bg-[#131313] border-3 border-[#00FFFF] p-6 text-center shadow-[6px_6px_0px_0px_#000000] flex flex-col items-center justify-center">
                <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                  <div className="absolute inset-0 rounded-full border-2 border-[#00FFFF] animate-ping opacity-75"></div>
                  <div className="w-12 h-12 rounded-full bg-[#00FFFF]/20 border-2 border-[#00FFFF] flex items-center justify-center">
                    <Radio className="w-6 h-6 text-[#00FFFF] animate-pulse" />
                  </div>
                </div>
                <span className="font-label-bold text-xs text-[#00FFFF] uppercase tracking-wider">
                  GATE SENSORS ACTIVE
                </span>
                <span className="text-[10px] text-[#a4899d] font-mono mt-0.5">
                  Awaiting Next Guest Scan...
                </span>
              </div>
            </div>

            {/* Recent VIP Entries Marquee / Live Ticker */}
            {recentScans.length > 0 && (
              <div className="bg-[#131313] border-2 border-[#564052] p-3 max-w-4xl mx-auto w-full">
                <div className="text-[10px] font-label-bold text-[#FF00FF] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#39FF14]" />
                  <span>RECENTLY ADMITTED FRESHERS:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentScans.map((guest, idx) => (
                    <div 
                      key={idx}
                      className="bg-[#1c1b1b] border border-[#39FF14] px-2.5 py-1 text-xs flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#39FF14]" />
                      <span className="font-bold text-[#e5e2e1]">{guest.name}</span>
                      <span className="text-[11px] text-[#00FFFF] font-mono">({guest.roll_no})</span>
                      <span className="text-[10px] text-[#a4899d]">{guest.branch}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Projector Footer */}
        <div className="relative z-10 pt-4 border-t border-[#313030] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#a4899d]">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
            <span>FRENZY GATE REVEAL ENGINE • SECURE ADMIN CHANNEL</span>
          </div>
          <div className="font-label-bold uppercase text-[11px] text-[#dcbed4]">
            POWERED BY COMIC REVEAL PROTOCOL
          </div>
        </div>
      </div>
    </div>
  );
};
