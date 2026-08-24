import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  CameraOff, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  KeyRound, 
  ShieldCheck, 
  Tv2, 
  Volume2, 
  VolumeX,
  RotateCcw,
  Zap,
  Lock
} from 'lucide-react';
import type { ScanResult, StatsResponse } from '../types';
import { audioController } from '../utils/audioController';
import { fireComicConfetti } from '../utils/confetti';

interface ScannerViewProps {
  isAdmin: boolean;
  adminToken?: string;
  onAdminLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  initialQrToTest?: string;
  onOpenGateDisplay?: () => void;
}

// Deep sanitization helper for scanned QR strings
export function sanitizeScannedQr(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  // Strip control characters, zero-width chars, and trim whitespace
  let text = raw.replace(/[\u200B-\u200D\uFEFF\u0000-\u001F\u007F-\u009F]/g, '').trim();

  // If JSON object format was scanned
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.qr_code_id) return String(parsed.qr_code_id).trim();
      if (parsed.qrId) return String(parsed.qrId).trim();
      if (parsed.id) return String(parsed.id).trim();
      if (parsed.roll_no) return String(parsed.roll_no).trim();
    } catch {}
  }

  // If URL was scanned
  if (text.includes('/pass/')) {
    const part = text.split('/pass/').pop()?.split('?')[0]?.split('#')[0];
    if (part) text = part.trim();
  } else if (text.includes('id=')) {
    const match = text.match(/[?&]id=([^&]+)/);
    if (match && match[1]) text = decodeURIComponent(match[1]).trim();
  }

  // Strip leading '#' if present
  if (text.startsWith('#')) {
    text = text.substring(1).trim();
  }

  return text.trim();
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  isAdmin,
  adminToken,
  onAdminLogin,
  initialQrToTest,
  onOpenGateDisplay
}) => {
  // Admin Login State
  const [loginEmail, setLoginEmail] = useState('admin@frenzy.edu');
  const [loginPass, setLoginPass] = useState('frenzy2024');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Scanner Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Scanner processing & 1-second cooldown lock
  const isProcessingRef = useRef(false);
  const cooldownLockRef = useRef(false);
  const lastScannedCodeRef = useRef('');

  // Live Stats
  const [stats, setStats] = useState<StatsResponse>({
    total_whitelist: 61,
    total_registered: 6,
    total_scanned: 0,
    total_pending: 6
  });

  // Current Scan Result & Burst Animation
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [burstVisible, setBurstVisible] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Manual QR input & Testing helpers
  const [manualQr, setManualQr] = useState(initialQrToTest || 'FF-TEST-001');
  const [scanning, setScanning] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [resettingPass, setResettingPass] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  const [configuredAdminEmail, setConfiguredAdminEmail] = useState('admin@frenzy.edu');

  const fetchStats = async () => {
    try {
      const [statsRes, adminRes] = await Promise.all([
        fetch('/api/stats').then((r) => r.json()),
        fetch('/api/admin/info').then((r) => r.json()).catch(() => null)
      ]);
      if (statsRes) setStats(statsRes);
      if (adminRes && adminRes.admin_email) {
        setConfiguredAdminEmail(adminRes.admin_email);
        setLoginEmail(adminRes.admin_email);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (initialQrToTest) {
      setManualQr(initialQrToTest);
    }
  }, [initialQrToTest]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const result = await onAdminLogin(loginEmail, loginPass);
      if (!result.success) {
        setLoginError(result.error || 'Access Denied: Only the designated admin account is authorized.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  useEffect(() => {
    if (!burstVisible) return;
    const duration = 2800;
    const timer = setTimeout(() => {
      setBurstVisible(false);
    }, duration);
    return () => clearTimeout(timer);
  }, [burstVisible]);

  const toggleMute = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    audioController.setMuted(next);
  };

  // Main QR Scan Processing function with strict sanitization and 1s cooldown lock
  const processQrScan = useCallback(async (rawPayload: string) => {
    if (!rawPayload || isProcessingRef.current || cooldownLockRef.current) {
      return;
    }

    const cleanQrId = sanitizeScannedQr(rawPayload);
    if (!cleanQrId) return;

    // Acquire locks
    isProcessingRef.current = true;
    cooldownLockRef.current = true;
    lastScannedCodeRef.current = cleanQrId;
    setScanning(true);

    console.log('[GATE_SCANNER] Scanned raw payload:', rawPayload);
    console.log('[GATE_SCANNER] Sanitized QR identifier:', cleanQrId);
    console.log('[GATE_SCANNER] Querying backend /api/scan with token:', adminToken ? `${adminToken.substring(0, 10)}...` : 'NONE');

    try {
      const effectiveToken = adminToken || sessionStorage.getItem('frenzy_admin_token') || '';
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (effectiveToken) {
        authHeaders['Authorization'] = `Bearer ${effectiveToken}`;
        authHeaders['x-admin-token'] = effectiveToken;
      }

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ qr_code_id: cleanQrId })
      });

      const data = await res.json();
      console.log('[GATE_SCANNER] API response received:', data);

      if (res.status === 403 || res.status === 401 || data.code === 'FORBIDDEN_NOT_ADMIN' || data.code === 'AUTH_REQUIRED') {
        const forbiddenResult: ScanResult = {
          status: 'forbidden',
          title: 'PERMISSION ERROR',
          message: data.error || 'Access Denied: Logged-in session lacks { admin: true } claim. Please verify admin credentials.',
          timestamp: new Date().toISOString()
        };
        setCurrentResult(forbiddenResult);
        setBurstVisible(true);
        audioController.playDenied();
        setScanHistory((prev) => [forbiddenResult, ...prev.slice(0, 19)]);
      } else {
        const parsedResult: ScanResult = {
          status: data.status || (res.ok ? 'valid' : 'not_found'),
          title: data.title || (data.status === 'valid' ? 'VALID ENTRY' : data.status === 'already_used' ? 'ALREADY SCANNED' : 'QR NOT FOUND'),
          message: data.message || (res.ok ? 'Valid Entry' : 'QR not found'),
          registration: data.registration,
          scanned_at: data.scanned_at || (data.registration?.scanned_at),
          qr_code_id: cleanQrId,
          timestamp: data.timestamp || new Date().toISOString()
        };

        setCurrentResult(parsedResult);
        setBurstVisible(true);

        if (parsedResult.status === 'valid') {
          audioController.playSuccess('bell');
          fireComicConfetti(0.45);
        } else {
          audioController.playDenied();
        }

        setScanHistory((prev) => [parsedResult, ...prev.slice(0, 19)]);
      }

      fetchStats();
    } catch (err: any) {
      console.error('[GATE_SCANNER] Network or client scan error:', err);
      const errRes: ScanResult = {
        status: 'error',
        title: 'NETWORK ERROR',
        message: err.message || 'Connection error while communicating with entry gate server.',
        timestamp: new Date().toISOString()
      };
      setCurrentResult(errRes);
      setBurstVisible(true);
      audioController.playDenied();
    } finally {
      isProcessingRef.current = false;
      setScanning(false);

      // 1-second cooldown lock to prevent double-scanning the same frame
      setTimeout(() => {
        cooldownLockRef.current = false;
      }, 1000);
    }
  }, [adminToken]);

  // Reset pass helper for instant test repeatability
  const handleResetPass = async (qrIdToReset: string) => {
    setResettingPass(true);
    setResetFeedback(null);
    try {
      const effectiveToken = adminToken || sessionStorage.getItem('frenzy_admin_token') || '';
      const res = await fetch('/api/admin/reset-pass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {})
        },
        body: JSON.stringify({ qr_code_id: qrIdToReset, roll_no: 'TEST-001' })
      });
      const data = await res.json();
      if (res.ok) {
        setResetFeedback(`✅ Reset ${qrIdToReset} to PENDING status!`);
        fetchStats();
      } else {
        setResetFeedback(`❌ ${data.error || 'Failed to reset'}`);
      }
    } catch (e: any) {
      setResetFeedback(`❌ ${e.message}`);
    } finally {
      setResettingPass(false);
      setTimeout(() => setResetFeedback(null), 3000);
    }
  };

  // Continuous Camera Loop with jsQR
  useEffect(() => {
    if (!isAdmin || !isCameraActive) return;

    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let isActive = true;

    const startCamera = async () => {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          scanFrame();
        }
      } catch (err: any) {
        console.warn('[GATE_SCANNER] Camera init error:', err);
        setCameraError('Camera access unavailable or permission denied. You can use the manual trigger bar below.');
        setIsCameraActive(false);
      }
    };

    const scanFrame = () => {
      if (!isActive) return;

      if (
        videoRef.current && 
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        !isProcessingRef.current &&
        !cooldownLockRef.current
      ) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            });

            if (code && code.data && code.data.trim().length > 0) {
              const scannedText = code.data.trim();
              if (scannedText !== lastScannedCodeRef.current || !cooldownLockRef.current) {
                processQrScan(scannedText);
              }
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(scanFrame);
    };

    startCamera();

    return () => {
      isActive = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isAdmin, isCameraActive, processQrScan]);

  if (!isAdmin) {
    return (
      <div className="w-full max-w-md mx-auto py-8 px-2">
        <div className="bg-[#1c1b1b] border-2 border-[#e61d23] p-6 md:p-8 brutal-border relative shadow-[8px_8px_0px_0px_#e61d23]">
          <div className="border-b border-[#353535] pb-4 mb-6 flex items-center justify-between">
            <div>
              <span className="font-label-bold text-xs text-[#ffb4ab] uppercase tracking-wider">RESTRICTED PORTAL</span>
              <h2 className="font-headline-md text-2xl md:text-3xl text-[#e61d23] uppercase tracking-wide">
                GATE SCANNER LOGIN
              </h2>
            </div>
            <KeyRound className="w-8 h-8 text-[#ffb4ab]" />
          </div>

          <p className="text-xs text-[#c6c6c7] mb-4 font-body-md">
            Entry verification requires administrator authorization with the designated <span className="font-mono text-[#ffb4ab]">admin: true</span> claim.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-label-bold text-[#ffb4ab] uppercase mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder={configuredAdminEmail}
                className="w-full bg-[#2a2a2a] border border-[#5d3f3c] p-3 text-xs text-[#e5e2e1] font-label-bold outline-none focus:border-[#e61d23] rounded-none"
              />
            </div>

            <div>
              <label className="block text-xs font-label-bold text-[#ffb4ab] uppercase mb-1">
                Security Password
              </label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#2a2a2a] border border-[#5d3f3c] p-3 text-xs text-[#e5e2e1] font-label-bold outline-none focus:border-[#e61d23] rounded-none"
              />
            </div>

            {loginError && (
              <div className="bg-[#350505] border border-[#ffb4ab] p-2.5 text-xs text-[#ffb4ab] font-label-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#ffb4ab] mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-[#e61d23] text-[#fffdff] font-headline-md text-xl py-3 uppercase tracking-wider faux-border hover:bg-[#c00014] transition-all cursor-pointer mt-2"
            >
              {loggingIn ? 'VERIFYING...' : 'UNLOCK SCANNER PORTAL'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#353535] text-center">
            <span className="text-[11px] text-[#e7bdb8] block mb-1 font-label-bold">Designated Admin:</span>
            <div className="bg-[#131313] border border-[#5d3f3c] p-2 text-xs font-mono text-[#ffb4ab] flex justify-between items-center">
              <span>{configuredAdminEmail}</span>
              <span>Claim: {'{admin: true}'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2 md:p-4 relative overflow-hidden font-body-md max-w-md mx-auto w-full">
      {/* Ambient Lightning Effect */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
        style={{ background: 'radial-gradient(circle at 50% 20%, rgba(230, 29, 35, 0.15) 0%, transparent 60%)' }}
      />

      {/* Projector Mode Top Link */}
      {onOpenGateDisplay && (
        <div className="w-full mb-3 flex justify-between items-center bg-[#1c1b1b] border border-[#e61d23] px-3 py-1.5 z-10 shadow-[2px_2px_0px_0px_#e61d23]">
          <span className="text-[11px] font-label-bold text-[#ffb4ab] uppercase flex items-center gap-1.5">
            <Tv2 className="w-3.5 h-3.5 text-[#e61d23]" />
            <span>PROJECTOR BIG SCREEN</span>
          </span>
          <button
            onClick={onOpenGateDisplay}
            className="bg-[#e61d23] text-[#fffdff] px-2.5 py-0.5 text-xs font-label-bold uppercase border border-white hover:bg-[#c00014] transition-colors cursor-pointer"
          >
            OPEN STAGE VIEW
          </button>
        </div>
      )}

      {/* Scanner Container */}
      <div className="relative z-10 w-full bg-[#1c1b1b] border-2 border-[#e61d23] shadow-[8px_8px_0px_0px_#e61d23] flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center p-4 bg-[#131313] border-b-2 border-[#e61d23]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#39FF14] rounded-full animate-ping" />
            <h1 className="font-headline-md text-2xl md:text-3xl text-[#ffb4ab] tracking-tight uppercase">
              GATE SCANNER
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1.5 bg-[#20201f] text-[#ffb4ab] border border-[#5d3f3c] hover:bg-[#353535] transition-colors cursor-pointer"
              title={soundMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-1.5 bg-[#e61d23] text-[#fffdff] px-3 py-1 font-label-bold text-xs uppercase border border-white faux-border">
              <span>{stats.total_scanned}/{stats.total_registered || 120} ADMITTED</span>
            </div>
          </div>
        </header>

        {/* Viewfinder Area */}
        <div className="relative bg-black aspect-square w-full overflow-hidden flex items-center justify-center group">
          {/* Video Feed or Standby */}
          {!isCameraActive ? (
            <div className="absolute inset-0 bg-[#131313] flex flex-col items-center justify-center p-6 text-center">
              <CameraOff className="w-12 h-12 text-[#767575] mb-2" />
              <p className="font-label-bold text-xs text-[#ffdad6] uppercase">Camera Inactive</p>
              <p className="text-[11px] text-[#767575] mt-1 mb-4">Click below to activate auto-scan camera</p>
              <button
                onClick={() => setIsCameraActive(true)}
                className="bg-[#e61d23] text-white px-4 py-2 text-xs font-label-bold uppercase border border-white hover:bg-[#c00014] transition-colors"
              >
                START CAMERA
              </button>
            </div>
          ) : (
            <video ref={videoRef} className="w-full h-full object-cover" />
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Red Scan Viewfinder Frame */}
          {isCameraActive && (
            <div className="absolute inset-8 border-2 border-[#e61d23] border-dashed pointer-events-none">
              {/* Corner Target Accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#ffb4ab] -mt-1 -ml-1"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#ffb4ab] -mt-1 -mr-1"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#ffb4ab] -mb-1 -ml-1"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#ffb4ab] -mb-1 -mr-1"></div>

              {/* Animated Laser Scan Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[#e61d23] shadow-[0_0_12px_3px_rgba(230,29,35,0.9)] scan-line z-20"></div>
            </div>
          )}

          {/* Cooldown / Live Scanning Status Indicator */}
          {scanning && (
            <div className="absolute top-3 right-3 z-20 bg-[#131313]/90 text-[#ffb4ab] px-2.5 py-1 text-[10px] font-label-bold uppercase border border-[#e61d23] flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin text-[#e61d23]" />
              <span>VERIFYING PASS...</span>
            </div>
          )}

          {/* RESULT OVERLAY BADGE */}
          {burstVisible && currentResult && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30 transition-opacity duration-300 p-4">
              {currentResult.status === 'valid' ? (
                <div className="font-headline-md text-3xl uppercase transform -rotate-2 px-6 py-5 border-4 bg-[#131313] text-[#ffb4ab] border-[#e61d23] shadow-[6px_6px_0px_0px_#e61d23] text-center w-full max-w-xs animate-in zoom-in-95">
                  <div className="text-4xl text-[#39FF14] font-headline-display flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-[#39FF14]" />
                    <span>VALID ENTRY</span>
                  </div>
                  {currentResult.registration && (
                    <div className="mt-2 pt-2 border-t border-[#353535]">
                      <div className="font-headline-md text-xl text-white">
                        {currentResult.registration.name}
                      </div>
                      <div className="font-mono text-xs text-[#ffdad6] mt-0.5">
                        USN: {currentResult.registration.roll_no}
                      </div>
                      {currentResult.registration.squad_name && (
                        <div className="mt-2 inline-block bg-[#e61d23] text-white px-2 py-0.5 text-[11px] font-label-bold uppercase">
                          ⚡ {currentResult.registration.squad_name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : currentResult.status === 'already_used' ? (
                <div className="font-headline-md text-2xl uppercase transform rotate-1 px-6 py-5 border-4 bg-[#131313] text-[#ffdad6] border-[#e61d23] shadow-[6px_6px_0px_0px_#93000a] text-center w-full max-w-xs animate-in zoom-in-95">
                  <div className="text-2xl text-[#ffb4ab] font-headline-display flex items-center justify-center gap-2">
                    <AlertTriangle className="w-7 h-7 text-[#ffb4ab]" />
                    <span>ALREADY SCANNED</span>
                  </div>
                  <div className="font-body-md text-xs text-[#e5e2e1] mt-2 pt-2 border-t border-[#353535]">
                    {currentResult.registration ? (
                      <>
                        <div className="font-label-bold text-white text-sm">{currentResult.registration.name}</div>
                        <div className="font-mono text-xs text-[#ffb4ab]">{currentResult.registration.roll_no}</div>
                      </>
                    ) : null}
                    <div className="mt-1 text-[11px] text-[#ffdad6] bg-[#350505] p-1.5 border border-[#5d3f3c]">
                      Scanned: {currentResult.scanned_at ? new Date(currentResult.scanned_at).toLocaleTimeString() : 'Earlier'}
                    </div>
                  </div>
                </div>
              ) : currentResult.status === 'forbidden' ? (
                <div className="font-headline-md text-2xl uppercase px-5 py-5 border-4 bg-[#131313] text-[#ffb4ab] border-[#e61d23] shadow-[6px_6px_0px_0px_#e61d23] text-center w-full max-w-xs animate-in zoom-in-95">
                  <div className="text-2xl text-[#ffb4ab] font-headline-display flex items-center justify-center gap-2">
                    <Lock className="w-7 h-7 text-[#e61d23]" />
                    <span>PERMISSION ERROR</span>
                  </div>
                  <div className="font-body-md text-xs text-[#e5e2e1] mt-2 pt-2 border-t border-[#353535]">
                    <p className="text-[11px] text-[#ffdad6]">{currentResult.message}</p>
                    <p className="text-[10px] text-[#767575] mt-1">Requires {'{ admin: true }'} designated claim</p>
                  </div>
                </div>
              ) : (
                <div className="font-headline-md text-2xl uppercase transform -rotate-1 px-6 py-5 border-4 bg-[#131313] text-[#ffb4ab] border-[#e61d23] shadow-[6px_6px_0px_0px_#e61d23] text-center w-full max-w-xs animate-in zoom-in-95">
                  <div className="text-2xl text-[#e61d23] font-headline-display flex items-center justify-center gap-2">
                    <XCircle className="w-7 h-7 text-[#e61d23]" />
                    <span>QR NOT FOUND</span>
                  </div>
                  <div className="font-body-md text-xs text-[#e5e2e1] mt-2 pt-2 border-t border-[#353535]">
                    <p className="text-xs text-[#ffdad6]">
                      {currentResult.qr_code_id ? `No record for ID #${currentResult.qr_code_id}` : 'Unrecognized QR code'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Camera toggle pill inside viewfinder */}
          <div className="absolute bottom-3 left-3 z-20">
            <button
              onClick={() => setIsCameraActive(!isCameraActive)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-label-bold uppercase border transition-all cursor-pointer ${
                isCameraActive
                  ? 'bg-[#e61d23] text-[#fffdff] border-white'
                  : 'bg-[#131313]/90 text-[#ffb4ab] border-[#e61d23]'
              }`}
            >
              {isCameraActive ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
              <span>{isCameraActive ? 'AUTO-SCAN LIVE' : 'CAMERA OFF'}</span>
            </button>
          </div>
        </div>

        {/* Controls & Quick Test Bar */}
        <div className="p-5 flex flex-col gap-3 bg-[#131313]">
          {/* Quick Verification for TEST-001 */}
          <div className="bg-[#20201f] border border-[#5d3f3c] p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-label-bold text-[#ffb4ab] uppercase flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#e61d23]" />
                <span>QUICK TEST (TEST-001)</span>
              </span>
              <button
                onClick={() => handleResetPass('FF-TEST-001')}
                disabled={resettingPass}
                className="text-[10px] text-[#ffdad6] hover:text-white underline font-mono flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Reset TEST-001 status back to pending so you can scan it again"
              >
                <RotateCcw className={`w-3 h-3 ${resettingPass ? 'animate-spin' : ''}`} />
                <span>Reset to Pending</span>
              </button>
            </div>

            {resetFeedback && (
              <div className="text-[11px] font-mono text-[#39FF14] bg-black/60 p-1 border border-[#39FF14]">
                {resetFeedback}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => processQrScan('FF-TEST-001')}
                disabled={scanning}
                className="bg-[#e61d23] text-white py-2 px-2 text-xs font-label-bold uppercase border border-white hover:bg-[#c00014] transition-all cursor-pointer truncate"
              >
                ⚡ TEST-001 (VALID)
              </button>
              <button
                onClick={() => processQrScan('FF-FAKE-999')}
                disabled={scanning}
                className="bg-[#2a2a2a] text-[#ffb4ab] py-2 px-2 text-xs font-label-bold uppercase border border-[#5d3f3c] hover:bg-[#353535] transition-all cursor-pointer truncate"
              >
                ❌ INVALID QR
              </button>
            </div>
          </div>

          {/* Manual Input Search & Trigger */}
          <div className="flex gap-2">
            <input
              type="text"
              value={manualQr}
              onChange={(e) => setManualQr(e.target.value.toUpperCase())}
              placeholder="Enter Pass ID (e.g. FF-TEST-001) or Roll No"
              className="flex-1 bg-[#20201f] border border-[#5d3f3c] px-3 py-2 text-xs font-label-bold text-[#e5e2e1] outline-none rounded-none focus:border-[#e61d23]"
            />
            <button
              onClick={() => processQrScan(manualQr || 'FF-TEST-001')}
              disabled={scanning || !manualQr.trim()}
              className="bg-[#e61d23] text-[#fffdff] px-4 py-2 font-headline-md text-lg uppercase faux-border hover:bg-[#c00014] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              SCAN
            </button>
          </div>

          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="w-full bg-transparent border border-[#454747] text-[#e5e2e1] font-label-bold text-xs uppercase py-2 hover:bg-[#20201f] transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <span className="material-symbols-outlined text-sm">history</span>
            <span>{showHistory ? 'HIDE RECENT SCANS' : `VIEW RECENT SCANS (${scanHistory.length})`}</span>
          </button>
        </div>
      </div>

      {/* Recent Scans Drawer / Log */}
      {showHistory && (
        <div className="w-full mt-3 bg-[#1c1b1b] border-2 border-[#e61d23] p-4 max-h-60 overflow-y-auto shadow-[4px_4px_0px_0px_#e61d23]">
          <h4 className="font-label-bold text-xs uppercase text-[#ffb4ab] mb-2 tracking-wider">
            Audit Log (Session)
          </h4>
          {scanHistory.length === 0 ? (
            <p className="text-xs text-[#767575] font-body-md">No scans in this session yet.</p>
          ) : (
            <div className="space-y-2">
              {scanHistory.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-[#2a2a2a] p-2 border border-[#353535] text-xs">
                  <div>
                    <span className="font-label-bold text-[#e5e2e1]">
                      {item.registration ? `${item.registration.name} (${item.registration.roll_no})` : item.message}
                    </span>
                    <div className="text-[10px] text-[#767575]">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-label-bold uppercase ${
                    item.status === 'valid' ? 'bg-[#e61d23] text-white' : 'bg-[#353535] text-[#ffb4ab]'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
