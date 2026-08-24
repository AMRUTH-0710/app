import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Sparkles, X, ArrowRight, Star } from 'lucide-react';
import type { InvitationLetterContent } from '../types';
import { sounds } from '../utils/sound';

interface InvitationLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

const DEFAULT_LETTER: InvitationLetterContent = {
  title: "A Golden Invitation to BAS 2026",
  subtitle: "BCom Association Welcomes Batch 2026",
  greeting: "Dear Freshers,",
  body: [
    "Welcome to the start of an extraordinary journey! The BCom Association (BAS), alongside your enthusiastic seniors and respected faculty members, is delighted to officially invite you to Freshers '26.",
    "We have spent weeks planning two unforgettable days filled with high-energy music, thrilling squad challenges, gourmet feasts, and unforgettable memories to welcome you into our vibrant campus family.",
    "Come dressed in your finest spirits, bring your boundless energy, and prepare to celebrate! We cannot wait to welcome each and every one of you."
  ],
  signature_title: "With warmth, excitement, and best wishes,",
  signature_names: "From the Seniors, Student Council & Faculty of BCom Association (BAS)"
};

export const InvitationLetterModal: React.FC<InvitationLetterModalProps> = ({
  isOpen,
  onClose,
  onContinue
}) => {
  const [letterData, setLetterData] = useState<InvitationLetterContent>(DEFAULT_LETTER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        sounds.playBell();
      } catch (e) {}

      setLoading(true);
      fetch('/api/content/invitation_letter')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.data) {
            setLetterData(data.data);
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="relative w-full max-w-2xl bg-[#1c1b1b] border-2 border-[#e61d23] brutal-border p-6 md:p-8 text-[#e5e2e1] overflow-hidden my-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#e7bdb8] hover:text-[#ffb4ab] bg-[#2a2a2a] border border-[#5d3f3c] transition-all cursor-pointer z-20"
            title="Close Invitation"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header pill */}
          <div className="inline-flex items-center gap-1.5 bg-[#e61d23] text-[#fffdff] px-3 py-1 text-xs font-label-bold uppercase faux-border-white mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OFFICIAL INVITATION • BATCH 2026</span>
          </div>

          {/* Letter Head */}
          <div className="border-b border-[#353535] pb-4 mb-5">
            <h2 className="font-headline-md text-2xl md:text-3xl text-[#ffb4ab] uppercase tracking-tight">
              {letterData.title || DEFAULT_LETTER.title}
            </h2>
            <p className="text-xs md:text-sm font-label-bold text-[#e7bdb8] uppercase mt-1">
              {letterData.subtitle || DEFAULT_LETTER.subtitle}
            </p>
          </div>

          {/* Letter Body Parchment */}
          <div className="space-y-4 font-body-md text-sm md:text-base leading-relaxed text-[#e5e2e1] bg-[#20201f] border border-[#353535] p-5 md:p-6">
            <div className="font-headline-md text-lg text-[#ffb4ab] uppercase tracking-wider">
              {letterData.greeting || 'Dear Freshers,'}
            </div>

            {Array.isArray(letterData.body) ? (
              letterData.body.map((para, index) => (
                <p key={index} className="text-[#c6c6c7] text-sm md:text-base">
                  {para}
                </p>
              ))
            ) : (
              <p className="text-[#c6c6c7] text-sm md:text-base whitespace-pre-line">
                {letterData.body}
              </p>
            )}

            {/* Signature Block */}
            <div className="pt-4 border-t border-[#353535] mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[#767575] italic">
                  {letterData.signature_title || 'With warmth and excitement,'}
                </p>
                <p className="font-label-bold text-xs md:text-sm text-[#ffb4ab] mt-0.5">
                  {letterData.signature_names || 'From the Seniors and Faculty of BComm Association'}
                </p>
              </div>

              <div className="flex items-center gap-1 text-[#e61d23] shrink-0">
                <Star className="w-4 h-4 fill-[#e61d23]" />
                <Star className="w-4 h-4 fill-[#e61d23]" />
                <Star className="w-4 h-4 fill-[#e61d23]" />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-[#767575] font-label-bold uppercase">
              Step 1 of 4: Invitation Unveiled
            </span>

            <button
              onClick={onContinue}
              className="w-full sm:w-auto bg-[#e61d23] hover:bg-[#c00014] text-[#fffdff] font-headline-md text-base md:text-lg uppercase px-6 py-3 border-2 border-white faux-border hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>CONTINUE TO EVENT LINEUP</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
