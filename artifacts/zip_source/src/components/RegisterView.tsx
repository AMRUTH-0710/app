import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import type { Registration, WhitelistEntry, Gender } from '../types';
import { sounds } from '../utils/sound';

interface RegisterViewProps {
  onRegistrationSuccess: (registration: Registration) => void;
  onNavigateToPass: (qrCodeId: string) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onRegistrationSuccess,
  onNavigateToPass
}) => {
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRegisteredPassId, setAlreadyRegisteredPassId] = useState<string | null>(null);

  // Whitelist cache for silent backend validation & autofill
  const [whitelistSamples, setWhitelistSamples] = useState<WhitelistEntry[]>([]);
  const [matchedJunior, setMatchedJunior] = useState<WhitelistEntry | null>(null);
  const [isRollValid, setIsRollValid] = useState<boolean | null>(null);

  // Fetch whitelist silently in background to support instant roll match
  useEffect(() => {
    fetch('/api/whitelist')
      .then((res) => res.json())
      .then((data) => {
        if (data.entries) {
          setWhitelistSamples(data.entries);
        }
      })
      .catch((err) => console.error('Could not fetch whitelist', err));
  }, []);

  // Match roll number with whitelist silently
  useEffect(() => {
    if (!rollNo.trim()) {
      setMatchedJunior(null);
      setIsRollValid(null);
      setError(null);
      return;
    }

    const clean = rollNo.trim().toUpperCase();
    const match = whitelistSamples.find((w) => w.roll_no.toUpperCase() === clean);

    if (match) {
      setMatchedJunior(match);
      setIsRollValid(true);
      setError(null);
      // Autofill name and gender if not provided
      if (!name) setName(match.name);
      if (!gender && match.gender) setGender(match.gender);
    } else {
      setMatchedJunior(null);
      if (clean.length >= 4) {
        setIsRollValid(false);
      } else {
        setIsRollValid(null);
      }
    }
  }, [rollNo, whitelistSamples]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAlreadyRegisteredPassId(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!rollNo.trim()) {
      setError('Please enter your USN or Roll Number.');
      return;
    }

    if (!gender) {
      setError('Please select your gender.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your university email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roll_no: rollNo.trim(),
          name: name.trim(),
          branch: matchedJunior?.branch || 'General',
          phone: phone.trim(),
          email: email.trim(),
          gender: gender
        })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'ALREADY_REGISTERED' && data.registration) {
          setAlreadyRegisteredPassId(data.registration.qr_code_id);
        }
        throw new Error(data.error || 'Failed to complete registration');
      }

      // Success Sound and Confetti
      sounds.playValid();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#e61d23', '#ffb4ab', '#ffffff', '#c8c6c5']
      });

      // Pass registration result back to parent
      onRegistrationSuccess(data.registration);
    } catch (err: any) {
      sounds.playDenied();
      setError(err.message || 'Something went wrong during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto relative px-2 py-6">
      {/* Background Subtle Atmospheric Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#e61d23]/20 via-[#131313] to-[#131313]"></div>

      {/* Registration Form Container */}
      <div className="w-full bg-[#131313] border-[3px] border-[#e61d23] p-6 md:p-10 relative shadow-[8px_8px_0px_0px_rgba(230,29,35,0.3)]">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 
            className="text-4xl md:text-5xl font-headline-lg text-[#ffdad6] uppercase tracking-widest leading-none mb-2 font-['Anton'] drop-shadow-[2px_2px_0px_#e61d23]"
          >
            SIGN UP
          </h2>
          <p className="text-sm font-body-md text-[#e7bdb8]">
            Fresher&apos;s Party Registration • Batch of 2026
          </p>
        </div>

        {/* Lightning Divider */}
        <div className="lightning-divider mb-6"></div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Name Field */}
          <div className="relative group">
            <label className="block text-xs font-label-bold text-[#ffb4ab] mb-1.5 uppercase tracking-wider" htmlFor="full_name">
              1. Participant Name *
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#ffb4ab] pl-3">person</span>
              <input
                id="full_name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-[#242424] border-2 border-[#5d3f3c] focus:border-[#e61d23] text-[#fffdff] text-base font-body-lg pl-11 pr-3 py-3 transition-colors outline-none placeholder-[#8e8d8d]"
              />
            </div>
          </div>

          {/* 2. USN or Roll Number */}
          <div className="relative group">
            <label className="block text-xs font-label-bold text-[#ffb4ab] mb-1.5 uppercase tracking-wider" htmlFor="student_id">
              2. USN / Roll Number *
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#ffb4ab] pl-3">badge</span>
              <input
                id="student_id"
                type="text"
                required
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                placeholder="e.g. 1RV26CS001 or FRESH-001"
                className={`w-full bg-[#242424] border-2 text-[#fffdff] text-base font-body-lg pl-11 pr-3 py-3 transition-colors outline-none placeholder-[#8e8d8d] uppercase font-bold ${
                  isRollValid === false
                    ? 'border-[#e61d23] text-[#ffb4ab]'
                    : isRollValid === true
                    ? 'border-[#ffb4ab] text-[#ffdad6]'
                    : 'border-[#5d3f3c] focus:border-[#e61d23]'
                }`}
              />
            </div>
            {matchedJunior && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#ffb4ab] font-label-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#ffb4ab]" />
                <span>Verified student record found</span>
              </div>
            )}
          </div>

          {/* 3. Gender (Options: Male, Female, Custom) */}
          <div className="relative group">
            <label className="block text-xs font-label-bold text-[#ffb4ab] mb-1.5 uppercase tracking-wider" htmlFor="gender">
              3. Gender *
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#ffb4ab] pl-3 z-10">wc</span>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                required
                className="w-full bg-[#242424] border-2 border-[#5d3f3c] focus:border-[#e61d23] text-[#fffdff] text-base font-body-lg pl-11 pr-10 py-3 transition-colors outline-none appearance-none relative cursor-pointer"
              >
                <option value="" disabled className="bg-[#131313] text-[#8e8d8d]">Select Gender...</option>
                <option value="Male" className="bg-[#131313] text-[#ffffff]">Male</option>
                <option value="Female" className="bg-[#131313] text-[#ffffff]">Female</option>
                <option value="Custom" className="bg-[#131313] text-[#ffffff]">Custom</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#ffb4ab] pointer-events-none">arrow_drop_down</span>
            </div>
          </div>

          {/* 4. University Email Address */}
          <div className="relative group">
            <label className="block text-xs font-label-bold text-[#ffb4ab] mb-1.5 uppercase tracking-wider" htmlFor="email">
              4. University Email Address *
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#ffb4ab] pl-3">mail</span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name.usn@university.edu"
                className="w-full bg-[#242424] border-2 border-[#5d3f3c] focus:border-[#e61d23] text-[#fffdff] text-base font-body-lg pl-11 pr-3 py-3 transition-colors outline-none placeholder-[#8e8d8d]"
              />
            </div>
          </div>

          {/* 5. Phone Number (Optional) */}
          <div className="relative group">
            <label className="block text-xs font-label-bold text-[#ffb4ab] mb-1.5 uppercase tracking-wider" htmlFor="phone">
              5. Phone Number <span className="text-[#c6c6c7] font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#ffb4ab] pl-3">call</span>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210 (optional)"
                className="w-full bg-[#242424] border-2 border-[#5d3f3c] focus:border-[#e61d23] text-[#fffdff] text-base font-body-lg pl-11 pr-3 py-3 transition-colors outline-none placeholder-[#8e8d8d]"
              />
            </div>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="bg-[#350505] border-2 border-[#ffb4ab] p-3 text-[#ffb4ab] text-xs font-label-bold flex items-start gap-2 shadow-[2px_2px_0px_0px_#e61d23]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#ffb4ab]" />
              <div className="flex-1">
                <p>{error}</p>
                {alreadyRegisteredPassId && (
                  <button
                    type="button"
                    onClick={() => onNavigateToPass(alreadyRegisteredPassId)}
                    className="mt-2 inline-flex items-center gap-1 bg-[#e61d23] text-[#fffdff] px-2.5 py-1 text-xs font-label-bold uppercase shadow-[2px_2px_0px_0px_#ffffff] hover:scale-105 transition-all cursor-pointer"
                  >
                    <span>View Entry Pass #{alreadyRegisteredPassId}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e61d23] text-[#fffdff] border-2 border-[#fffdff] text-xl md:text-2xl font-headline-md uppercase py-4 px-6 block text-center transition-all hover:bg-[#c00014] hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] active:scale-95 group relative overflow-hidden cursor-pointer shadow-[4px_4px_0px_0px_#ffb4ab]"
            >
              {loading ? (
                <span className="relative z-10 flex items-center justify-center gap-2 text-[#ffffff] font-bold">
                  <Loader2 className="w-5 h-5 animate-spin text-[#ffffff]" />
                  GENERATING PASS...
                </span>
              ) : (
                <span className="relative z-10 text-[#ffffff] font-bold tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  JOIN THE FRESHERS
                </span>
              )}
              {/* Hover highlight */}
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-200 z-0"></div>
            </button>
          </div>
        </form>

        {/* Decorative Tag */}
        <div className="absolute -bottom-3 -right-3 bg-[#e61d23] text-[#fffdff] text-[10px] font-label-bold px-2.5 py-0.5 uppercase border border-white shadow-[2px_2px_0px_0px_#000000]">
          BATCH 2026
        </div>
      </div>
    </div>
  );
};
