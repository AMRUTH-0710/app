import React from 'react';
import { X, Mail, Calendar, MapPin } from 'lucide-react';
import type { Registration } from '../types';

interface EmailModalProps {
  registration: Registration | null;
  onClose: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({ registration, onClose }) => {
  if (!registration) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#1c1b1b] border-2 border-[#e61d23] brutal-border p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#ffb4ab] hover:text-[#ffdad6] p-1 cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Email Header */}
        <div className="flex items-center gap-2 mb-4 border-b border-[#353535] pb-3">
          <Mail className="w-6 h-6 text-[#e61d23]" />
          <div>
            <span className="text-[10px] font-label-bold text-[#ffb4ab] uppercase">EMAIL CONFIRMATION</span>
            <h3 className="font-headline-md text-lg md:text-xl text-[#e5e2e1] uppercase">
              VIP PASS RECEIPT
            </h3>
          </div>
        </div>

        {/* Email Metadata */}
        <div className="bg-[#20201f] border border-[#353535] p-3.5 text-xs font-mono space-y-2 mb-4">
          <div className="flex justify-between border-b border-[#353535] pb-1.5 text-[11px]">
            <span className="text-[#767575]">FROM:</span>
            <span className="text-[#ffb4ab]">invites@freshersfiesta.edu</span>
          </div>
          <div className="flex justify-between border-b border-[#353535] pb-1.5 text-[11px]">
            <span className="text-[#767575]">TO:</span>
            <span className="text-[#e5e2e1] font-bold">{registration.email}</span>
          </div>
          <div className="flex justify-between border-b border-[#353535] pb-1.5 text-[11px]">
            <span className="text-[#767575]">SUBJECT:</span>
            <span className="text-[#ffdad6] font-bold">⚡ Your Pass to Fresher 26&apos; [#{registration.qr_code_id}]</span>
          </div>
          <div className="flex justify-between text-[10px] text-[#767575]">
            <span>STATUS: DELIVERED ✅</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
        </div>

        {/* Ticket Box */}
        <div className="bg-[#2a2a2a] border border-[#5d3f3c] p-4 space-y-4">
          <div className="text-center">
            <h4 className="font-headline-display text-3xl text-[#ffb4ab] uppercase">
              FRESHER 26&apos; • BCOM ASSOCIATION
            </h4>
            <p className="text-xs text-[#e61d23] font-label-bold">CONFIRMED GUEST REGISTRATION</p>
          </div>

          <p className="text-xs text-[#c6c6c7] leading-relaxed">
            Hey <span className="text-[#ffb4ab] font-bold">{registration.name}</span>, your pass has been issued for the <span className="text-[#ffb4ab] font-bold">{registration.branch}</span> department.
          </p>

          {/* QR Attachment Preview */}
          <div className="bg-[#131313] border border-[#353535] p-3 flex flex-col items-center justify-center">
            {registration.qr_code_data_url && (
              <img
                src={registration.qr_code_data_url}
                alt="QR Code Pass"
                className="w-36 h-36 bg-white p-1 mb-2"
              />
            )}
            <div className="text-[11px] font-label-bold text-[#ffb4ab]">
              PASS ID: #{registration.qr_code_id}
            </div>
            <div className="text-[10px] text-[#767575] mt-0.5">
              Show this QR code at the main door scanner for admission.
            </div>
          </div>

          {/* Venue and Timings */}
          <div className="space-y-1.5 text-xs text-[#e5e2e1] bg-[#1c1b1b] p-3 border border-[#353535]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#ffb4ab]" />
              <span>September 1 & 2, 2026 • 2-Day Gala</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#e61d23]" />
              <span>Main Arena, Student Union Grounds</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#e61d23] text-[#fffdff] px-6 py-2.5 text-xs font-label-bold uppercase border border-white hover:bg-[#c00014] transition-all cursor-pointer"
          >
            CLOSE PREVIEW
          </button>
        </div>
      </div>
    </div>
  );
};
