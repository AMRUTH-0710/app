import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Download, 
  Mail, 
  Search, 
  Sparkles, 
  QrCode, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2,
  Clock,
  Zap,
  PartyPopper,
  Share2,
  Loader2,
  ImageDown
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import type { Registration } from '../types';
import { sounds } from '../utils/sound';

interface PassViewProps {
  registration: Registration | null;
  onNavigateToScan: (qrCodeId?: string) => void;
  onOpenEmailModal: (registration: Registration) => void;
}

export const PassView: React.FC<PassViewProps> = ({
  registration,
  onNavigateToScan,
  onOpenEmailModal
}) => {
  const [currentReg, setCurrentReg] = useState<Registration | null>(registration);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // 3D Card Tilt on Mouse Move
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const xPct = clientX / width - 0.5;
    const yPct = clientY / height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Trigger celebration on initial mount / pass reveal
  useEffect(() => {
    if (registration) {
      setCurrentReg(registration);
    }
  }, [registration]);

  useEffect(() => {
    if (currentReg && !revealed) {
      setRevealed(true);
      sounds.playValid();
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.55 },
          colors: ['#e61d23', '#ffb4ab', '#ffffff', '#ffd7f5', '#ffdad6'],
          disableForReducedMotion: true
        });
      } catch (e) {}
    }
  }, [currentReg, revealed]);

  // Load sample default pass if empty
  useEffect(() => {
    if (!currentReg) {
      fetch('/api/pass/FF-8492')
        .then((res) => res.json())
        .then((data) => {
          if (data.registration) {
            setCurrentReg(data.registration);
          }
        })
        .catch(() => {});
    }
  }, [currentReg]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/pass/${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.registration) {
        throw new Error(data.error || `No pass found matching '${searchQuery}'`);
      }
      setCurrentReg(data.registration);
      setSearchQuery('');
      setRevealed(false); // trigger reveal animation again
    } catch (err: any) {
      setSearchError(err.message || 'Pass not found. Verify your Roll Number or Pass ID.');
    } finally {
      setLoading(false);
    }
  };

  // High-Resolution Full Pass PNG Generation and Download
  const handleDownloadHighResPass = async () => {
    if (!currentReg) return;
    setIsDownloading(true);
    setDownloadSuccess(null);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize canvas context');

      // High definition canvas dimensions (1200 x 1750 px for crisp retina resolution)
      const w = 1200;
      const h = 1750;
      canvas.width = w;
      canvas.height = h;

      // Outer background
      ctx.fillStyle = '#131313';
      ctx.fillRect(0, 0, w, h);

      // Outer accent border
      ctx.strokeStyle = '#e61d23';
      ctx.lineWidth = 16;
      ctx.strokeRect(16, 16, w - 32, h - 32);

      // Card body background
      ctx.fillStyle = '#1c1b1b';
      ctx.fillRect(32, 32, w - 64, h - 64);

      // Header Banner
      ctx.fillStyle = '#e61d23';
      ctx.fillRect(32, 32, w - 64, 270);

      // Header top meta
      ctx.fillStyle = '#ffdad6';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('BATCH 2026 • ADMISSION TICKET', 64, 80);

      // VIP Auth Pill
      ctx.fillStyle = '#131313';
      ctx.fillRect(w - 220, 52, 155, 40);
      ctx.strokeStyle = '#ffb4ab';
      ctx.lineWidth = 2;
      ctx.strokeRect(w - 220, 52, 155, 40);
      ctx.fillStyle = '#ffb4ab';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VIP AUTH', w - 142, 78);

      // Event Subtitle
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffdad6';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText("FRESHER 26' • BCOM ASSOCIATION", w / 2, 150);

      // Main Hero Title
      ctx.fillStyle = '#ffffff';
      ctx.font = "900 82px 'Anton', sans-serif, system-ui";
      ctx.fillText("YOU'RE IN", w / 2, 240);

      // Perforation Dashed Line
      ctx.strokeStyle = '#5d3f3c';
      ctx.lineWidth = 4;
      ctx.setLineDash([16, 10]);
      ctx.beginPath();
      ctx.moveTo(50, 302);
      ctx.lineTo(w - 50, 302);
      ctx.stroke();
      ctx.setLineDash([]);

      // Left & Right Notches
      ctx.fillStyle = '#131313';
      ctx.beginPath();
      ctx.arc(32, 302, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e61d23';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(w - 32, 302, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e61d23';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Logistics Box (Date & Venue)
      ctx.fillStyle = '#20201f';
      ctx.fillRect(64, 345, w - 128, 110);
      ctx.strokeStyle = '#353535';
      ctx.lineWidth = 2;
      ctx.strokeRect(64, 345, w - 128, 110);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffb4ab';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('EVENT DATE & TIMING', 94, 385);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('SEPT 1 & 2 • 09:00 AM', 94, 425);

      ctx.fillStyle = '#ffb4ab';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('VENUE', w / 2 + 40, 385);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('CAMPUS ARENA / CSE HALL', w / 2 + 40, 425);

      // Attendee Details Card
      ctx.fillStyle = '#20201f';
      ctx.fillRect(64, 485, w - 128, 250);
      ctx.strokeStyle = '#353535';
      ctx.lineWidth = 2;
      ctx.strokeRect(64, 485, w - 128, 250);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffb4ab';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('ATTENDEE NAME', 94, 530);
      ctx.fillStyle = '#ffffff';
      ctx.font = "900 46px 'Anton', sans-serif, system-ui";
      ctx.fillText(currentReg.name.toUpperCase(), 94, 585);

      // Roll No Box
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffb4ab';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('USN / ROLL NO', w - 94, 530);
      ctx.fillStyle = '#131313';
      ctx.fillRect(w - 380, 545, 286, 52);
      ctx.strokeStyle = '#5d3f3c';
      ctx.strokeRect(w - 380, 545, 286, 52);
      ctx.fillStyle = '#ffdad6';
      ctx.font = 'bold 28px monospace';
      ctx.fillText(currentReg.roll_no, w - 108, 582);

      // Divider inside attendee section
      ctx.strokeStyle = '#353535';
      ctx.beginPath();
      ctx.moveTo(85, 630);
      ctx.lineTo(w - 85, 630);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#767575';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('REGISTERED UNIVERSITY EMAIL', 94, 665);
      ctx.fillStyle = '#ffb4ab';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(currentReg.email, 94, 700);

      // Status Badge
      ctx.textAlign = 'right';
      ctx.fillStyle = '#e61d23';
      ctx.fillRect(w - 340, 650, 246, 50);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(w - 340, 650, 246, 50);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('CONFIRMED PASS ✅', w - 110, 683);

      // Draw QR Code Section
      const qrBoxSize = 500;
      const qrBoxX = (w - qrBoxSize) / 2;
      const qrBoxY = 780;

      ctx.fillStyle = '#131313';
      ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
      ctx.strokeStyle = '#e61d23';
      ctx.lineWidth = 5;
      ctx.strokeRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

      // White inner plate for crisp QR matrix
      const pad = 28;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrBoxX + pad, qrBoxY + pad, qrBoxSize - pad * 2, qrBoxSize - pad * 2);

      // Load & Render QR Image
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';

      await new Promise<void>((resolveImg) => {
        qrImage.onload = () => {
          ctx.drawImage(
            qrImage,
            qrBoxX + pad + 10,
            qrBoxY + pad + 10,
            qrBoxSize - (pad + 10) * 2,
            qrBoxSize - (pad + 10) * 2
          );
          resolveImg();
        };
        qrImage.onerror = () => resolveImg();
        qrImage.src = currentReg.qr_code_data_url || '';
      });

      // Accent Corner Brackets on QR Box
      ctx.strokeStyle = '#ffb4ab';
      ctx.lineWidth = 8;
      // Top Left
      ctx.beginPath();
      ctx.moveTo(qrBoxX - 12, qrBoxY + 36);
      ctx.lineTo(qrBoxX - 12, qrBoxY - 12);
      ctx.lineTo(qrBoxX + 36, qrBoxY - 12);
      ctx.stroke();
      // Top Right
      ctx.beginPath();
      ctx.moveTo(qrBoxX + qrBoxSize - 36, qrBoxY - 12);
      ctx.lineTo(qrBoxX + qrBoxSize + 12, qrBoxY - 12);
      ctx.lineTo(qrBoxX + qrBoxSize + 12, qrBoxY + 36);
      ctx.stroke();
      // Bottom Left
      ctx.beginPath();
      ctx.moveTo(qrBoxX - 12, qrBoxY + qrBoxSize - 36);
      ctx.lineTo(qrBoxX - 12, qrBoxY + qrBoxSize + 12);
      ctx.lineTo(qrBoxX + 36, qrBoxY + qrBoxSize + 12);
      ctx.stroke();
      // Bottom Right
      ctx.beginPath();
      ctx.moveTo(qrBoxX + qrBoxSize - 36, qrBoxY + qrBoxSize + 12);
      ctx.lineTo(qrBoxX + qrBoxSize + 12, qrBoxY + qrBoxSize + 12);
      ctx.lineTo(qrBoxX + qrBoxSize + 12, qrBoxY + qrBoxSize - 36);
      ctx.stroke();

      // Pass ID pill
      ctx.textAlign = 'center';
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(w / 2 - 220, 1315, 440, 56);
      ctx.strokeStyle = '#5d3f3c';
      ctx.lineWidth = 2;
      ctx.strokeRect(w / 2 - 220, 1315, 440, 56);

      ctx.fillStyle = '#ffb4ab';
      ctx.font = 'bold 28px monospace';
      ctx.fillText(`PASS ID: #${currentReg.qr_code_id}`, w / 2, 1353);

      ctx.fillStyle = '#c6c6c7';
      ctx.font = '20px sans-serif';
      ctx.fillText('Present this dynamic QR code at the campus entry scanner', w / 2, 1410);

      // Pass Footer Bar
      ctx.fillStyle = '#131313';
      ctx.fillRect(32, h - 130, w - 64, 98);
      ctx.strokeStyle = '#353535';
      ctx.lineWidth = 2;
      ctx.strokeRect(32, h - 130, w - 64, 98);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#e7bdb8';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('📍 BCOMM FESTIVAL ARENA • BATCH OF 2026', 64, h - 70);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#e61d23';
      ctx.fillRect(w - 330, h - 108, 266, 54);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(w - 330, h - 108, 266, 54);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('ALL-ACCESS PASS', w - 85, h - 73);

      // Trigger high-res file download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `FresherFiesta-Pass-${currentReg.roll_no}-${currentReg.qr_code_id}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      sounds.playValid();
      setDownloadSuccess('High-Resolution Pass PNG Downloaded!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err: any) {
      console.error('High-res download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Direct QR Code Only PNG Download
  const handleDownloadQROnly = () => {
    if (!currentReg || !currentReg.qr_code_data_url) return;
    const link = document.createElement('a');
    link.download = `FresherFiesta-QRCode-${currentReg.qr_code_id}.png`;
    link.href = currentReg.qr_code_data_url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sounds.playValid();
    setDownloadSuccess('QR Code Image Saved!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleShareOrCopy = () => {
    if (!currentReg) return;
    const url = window.location.origin;
    const text = `🎉 I'm attending Fresher's Fiesta 2026! VIP Pass #${currentReg.qr_code_id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text} • ${url}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center relative px-2 py-4 space-y-6">
      {/* Search / Lookup Pass Bar */}
      <form onSubmit={handleLookup} className="w-full relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#767575] text-sm">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Roll No (e.g. FRESH-001) or Pass ID..."
              className="w-full bg-[#1c1b1b] border-2 border-[#e61d23] pl-9 pr-3.5 py-2.5 text-xs text-[#e5e2e1] placeholder-[#767575] font-label-bold outline-none rounded-none focus:border-[#ffb4ab]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#e61d23] text-[#fffdff] px-4 py-2 font-headline-md text-lg uppercase faux-border hover:bg-[#c00014] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>FIND</span>
          </button>
        </div>
        {searchError && (
          <p className="text-xs text-[#ffb4ab] mt-2 font-label-bold bg-[#350505] p-2.5 border border-[#ffb4ab] flex items-center gap-2">
            <span>{searchError}</span>
          </p>
        )}
      </form>

      {currentReg ? (
        <div className="w-full relative mt-4">
          {/* Celebratory Comic Banner Pill */}
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 15 }}
            className="flex items-center justify-center gap-2 mb-3"
          >
            <div className="bg-[#e61d23] text-[#fffdff] px-4 py-1 border-2 border-white faux-border font-label-bold text-xs uppercase flex items-center gap-2 shadow-[2px_2px_0px_0px_#000000]">
              <Sparkles className="w-3.5 h-3.5 text-[#ffdad6] animate-pulse" />
              <span>OFFICIAL VIP ENTRY PASS ISSUED</span>
              <PartyPopper className="w-3.5 h-3.5 text-[#ffdad6]" />
            </div>
          </motion.div>

          {/* Lanyard Graphic Element */}
          <div className="relative mx-auto w-12 h-10 -mb-2 flex flex-col items-center justify-center z-30 pointer-events-none">
            <div className="w-5 h-5 rounded-full bg-[#131313] border-2 border-[#e61d23] shadow-md flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#ffb4ab]" />
            </div>
            <div className="w-2 h-5 bg-[#353535] border-x border-[#e61d23]" />
          </div>

          {/* 3D Tilted Interactive Card Container */}
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d'
            }}
            initial={{ opacity: 0, scale: 0.85, y: 30, rotateX: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 140 }}
            className="w-full bg-[#1c1b1b] border-3 border-[#e61d23] shadow-[8px_8px_0px_0px_#e61d23] relative overflow-hidden group select-none"
          >
            {/* Continuous Subtle Shine Sweep Overlay */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/12 to-transparent animate-shine-sweep" />
            </div>

            {/* Comic Halftone Dot Accents in Corners */}
            <div className="absolute top-0 right-0 w-24 h-24 comic-halftone-dots pointer-events-none opacity-40 z-10" />
            <div className="absolute bottom-0 left-0 w-20 h-20 comic-halftone-dots pointer-events-none opacity-40 z-10" />

            {/* Lightning Graphic Overlay (Subtle Atmospheric) */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
              <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
                <path d="M10,0 L35,45 L20,50 L55,100" fill="none" stroke="#e61d23" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path d="M85,0 L60,50 L75,55 L40,100" fill="none" stroke="#e61d23" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>

            {/* PASS HEADER */}
            <div className="bg-[#e61d23] text-[#fffdff] p-5 border-b-3 border-[#131313] flex flex-col items-center justify-center relative z-20 overflow-hidden">
              <div className="absolute top-2 left-3 font-mono text-[9px] text-[#ffdad6] uppercase tracking-widest opacity-80">
                BATCH 2026 • ADMISSION TICKET
              </div>
              <div className="absolute top-2 right-3 font-mono text-[9px] bg-[#131313] text-[#ffb4ab] px-1.5 py-0.5 border border-[#ffb4ab]/40">
                VIP AUTH
              </div>

              <div className="pt-2 text-center">
                <p className="font-label-bold text-xs tracking-widest uppercase text-[#ffdad6] mb-0.5">
                  FRESHER 26&apos; • BCOM ASSOCIATION
                </p>
                <h2 className="font-headline-display text-4xl md:text-5xl text-center leading-none tracking-tight text-[#fffdff] drop-shadow-[2px_2px_0px_#000000]">
                  YOU&apos;RE IN
                </h2>
              </div>
            </div>

            {/* TICKET NOTCH PERFORATIONS */}
            <div className="relative flex items-center justify-between z-25 -my-3">
              <div className="w-6 h-6 rounded-full bg-[#131313] border-r-2 border-[#e61d23] -ml-3" />
              <div className="flex-1 border-t-2 border-dashed border-[#5d3f3c] mx-2" />
              <div className="w-6 h-6 rounded-full bg-[#131313] border-l-2 border-[#e61d23] -mr-3" />
            </div>

            {/* PASS BODY */}
            <div className="p-6 md:p-8 flex flex-col items-center relative z-20 gap-5 pt-6">
              {/* Event Date & Venue Subtitle */}
              <div className="w-full text-center">
                <div className="grid grid-cols-2 gap-2 bg-[#20201f] border border-[#353535] p-2.5 text-left text-xs">
                  <div className="border-r border-[#353535] pr-2">
                    <span className="block font-label-sm text-[10px] text-[#ffb4ab] uppercase">Date & Timing</span>
                    <span className="block font-label-bold text-xs text-[#e5e2e1]">SEPT 1 & 2 • 09:00 AM</span>
                  </div>
                  <div className="pl-2">
                    <span className="block font-label-sm text-[10px] text-[#ffb4ab] uppercase">Venue</span>
                    <span className="block font-label-bold text-xs text-[#e5e2e1] truncate">CAMPUS ARENA</span>
                  </div>
                </div>
              </div>

              {/* Attendee Profile Section */}
              <div className="w-full bg-[#20201f] border-2 border-[#353535] p-4 text-left relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-label-bold text-[#ffb4ab] uppercase tracking-wider block">
                      ATTENDEE NAME
                    </span>
                    <div className="font-headline-md text-2xl text-[#e5e2e1] uppercase tracking-wide">
                      {currentReg.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-label-bold text-[#ffb4ab] uppercase tracking-wider block">
                      USN / ROLL NO
                    </span>
                    <div className="font-label-bold text-sm text-[#ffdad6] font-mono bg-[#131313] px-2 py-0.5 border border-[#5d3f3c]">
                      {currentReg.roll_no}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#353535] flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-[#767575] uppercase block">REGISTERED EMAIL</span>
                    <span className="text-[#ffb4ab] font-mono text-xs">{currentReg.email}</span>
                  </div>
                  <div>
                    <span className={`px-2.5 py-1 font-label-bold uppercase text-[10px] border ${
                      currentReg.status === 'scanned'
                        ? 'bg-[#e61d23] text-[#fffdff] border-white font-bold'
                        : 'bg-[#131313] text-[#ffb4ab] border-[#ffb4ab]'
                    }`}>
                      {currentReg.status === 'scanned' ? 'ADMITTED ✅' : 'STATUS: CONFIRMED ✅'}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR CODE FRAME WITH SOFT PULSING GLOW */}
              <div className="flex flex-col items-center justify-center my-1">
                <div className="relative p-3 bg-[#131313] border-3 rounded-none animate-qr-pulse transition-all">
                  {/* Corner Target Brackets */}
                  <div className="absolute -top-2 -left-2 w-5 h-5 border-t-3 border-l-3 border-[#ffb4ab]" />
                  <div className="absolute -top-2 -right-2 w-5 h-5 border-t-3 border-r-3 border-[#ffb4ab]" />
                  <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b-3 border-l-3 border-[#ffb4ab]" />
                  <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b-3 border-r-3 border-[#ffb4ab]" />

                  {/* Clean, high-contrast QR Matrix (No opacity filter on matrix itself to ensure 100% camera readability) */}
                  <div className="bg-white p-2 flex items-center justify-center">
                    {currentReg.qr_code_data_url ? (
                      <img
                        src={currentReg.qr_code_data_url}
                        alt={`QR Code Pass for ${currentReg.name}`}
                        className="w-44 h-44 object-contain block select-none pointer-events-none"
                      />
                    ) : (
                      <div className="w-44 h-44 bg-white flex flex-col items-center justify-center text-black font-mono text-xs">
                        <QrCode className="w-12 h-12 text-black mb-1" />
                        <span>[#{currentReg.qr_code_id}]</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <div className="inline-flex items-center gap-1.5 bg-[#2a2a2a] px-3 py-1 border border-[#5d3f3c]">
                    <span className="font-label-bold text-xs text-[#ffb4ab] tracking-widest font-mono">
                      PASS ID: #{currentReg.qr_code_id}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#767575] mt-1">
                    Present this dynamic QR code at the campus entry scanner
                  </p>
                </div>
              </div>
            </div>

            {/* PASS FOOTER BAR */}
            <div className="bg-[#131313] p-4 flex justify-between items-center relative z-20 border-t-2 border-[#353535]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#e61d23]" />
                <span className="font-label-sm text-[11px] text-[#e7bdb8] uppercase">BCOMM FESTIVAL ARENA</span>
              </div>
              <div className="font-label-bold text-xs text-[#fffdff] bg-[#e61d23] px-3 py-1 uppercase border border-white faux-border">
                ALL-ACCESS PASS
              </div>
            </div>
          </motion.div>

          {/* Toast Notification */}
          {downloadSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 w-full bg-[#131313] border-2 border-[#39FF14] p-3 text-center text-xs font-label-bold text-[#39FF14] flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#39FF14]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{downloadSuccess}</span>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3 mt-6">
            {/* Primary High-Resolution PNG Pass Download Button */}
            <button
              onClick={handleDownloadHighResPass}
              disabled={isDownloading}
              className="w-full bg-[#e61d23] text-[#fffdff] font-headline-md text-xl md:text-2xl uppercase py-4 px-6 flex items-center justify-center gap-2 hover:bg-[#c00014] faux-border transition-all cursor-pointer shadow-[4px_4px_0px_0px_#ffffff] active:scale-[0.99] disabled:opacity-75"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                  <span>GENERATING HIGH-RES PASS...</span>
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  <span>DOWNLOAD PASS (HIGH-RES PNG)</span>
                </>
              )}
            </button>

            {/* Secondary Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Standalone QR Code Download */}
              <button
                onClick={handleDownloadQROnly}
                className="bg-[#1c1b1b] text-[#ffb4ab] border-2 border-[#5d3f3c] py-3 px-3 font-label-bold text-xs uppercase hover:bg-[#2a2a2a] hover:border-[#ffb4ab] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Download QR code matrix only"
              >
                <ImageDown className="w-4 h-4 text-[#e61d23]" />
                <span>QR CODE ONLY</span>
              </button>

              {/* View Email Pass */}
              <button
                onClick={() => onOpenEmailModal(currentReg)}
                className="bg-[#1c1b1b] text-[#ffb4ab] border-2 border-[#5d3f3c] py-3 px-3 font-label-bold text-xs uppercase hover:bg-[#2a2a2a] hover:border-[#ffb4ab] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-[#e61d23]" />
                <span>VIEW EMAIL PASS</span>
              </button>

              {/* Gate Scanner */}
              <button
                onClick={() => onNavigateToScan(currentReg.qr_code_id)}
                className="bg-[#1c1b1b] text-[#ffb4ab] border-2 border-[#e61d23] py-3 px-3 font-label-bold text-xs uppercase hover:bg-[#e61d23] hover:text-[#fffdff] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>GATE SCANNER</span>
              </button>
            </div>

            {/* Quick Share Link Pill */}
            <div className="mt-1 flex items-center justify-between bg-[#1c1b1b] border border-[#353535] p-3 text-xs">
              <span className="text-[#c6c6c7]">Pass Ready for Admission</span>
              <button
                onClick={handleShareOrCopy}
                className="text-[#ffb4ab] hover:text-white font-label-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#39FF14]" />
                    <span className="text-[#39FF14]">COPIED DETAILS!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>COPY PASS DETAILS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-[#767575] bg-[#1c1b1b] border border-[#353535] p-8 w-full">
          <p className="font-label-bold text-xs text-[#ffb4ab]">No active pass found.</p>
          <p className="text-xs text-[#c6c6c7] mt-1">Please search by your Roll Number or Pass ID above.</p>
        </div>
      )}
    </div>
  );
};

