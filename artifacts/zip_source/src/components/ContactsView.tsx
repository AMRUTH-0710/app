import React, { useState } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Copy, 
  Check, 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  Code, 
  Heart, 
  HelpCircle,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { sounds } from '../utils/sound';

interface ContactsViewProps {
  onNavigate: (tab: string) => void;
}

interface Organizer {
  name: string;
  role: string;
  phone: string;
  cleanPhone: string;
  highlight: string;
  badge: string;
  description: string;
  avatarColor: string;
}

const ORGANIZERS: Organizer[] = [
  {
    name: 'Amruth P',
    role: 'GS',
    phone: '7019475272',
    cleanPhone: '917019475272',
    highlight: 'GS',
    badge: 'GS',
    description: 'Direct contact for schedule inquiries, general queries, invitations, and overall coordination.',
    avatarColor: '#e61d23'
  },
  {
    name: 'GP',
    role: 'GS',
    phone: '9632270887',
    cleanPhone: '919632270887',
    highlight: 'GS',
    badge: 'GS',
    description: 'Point of contact for the Fresher\'s Portal, QR Entry Passes, Scanner Gates, and Squad coordination.',
    avatarColor: '#00FFFF'
  }
];

export const ContactsView: React.FC<ContactsViewProps> = ({ onNavigate }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (phone: string, index: number) => {
    navigator.clipboard.writeText(phone);
    sounds.playValid();
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 pb-20 px-2">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-[#e61d23] text-[#fffdff] px-3 py-1 font-label-bold text-xs uppercase tracking-widest border border-white shadow-[3px_3px_0px_0px_#000000]">
          <Sparkles className="w-4 h-4" />
          <span>BATCH OF 2026 HELPDESK & SUPPORT</span>
        </div>
        <h1 
          className="text-4xl sm:text-6xl md:text-7xl font-headline-display text-[#ffdad6] uppercase tracking-tighter distressed-text drop-shadow-[3px_3px_0px_#e61d23]"
          data-text="EVENT CONTACTS"
        >
          EVENT CONTACTS
        </h1>
        <p className="text-xs md:text-sm text-[#e7bdb8] max-w-xl mx-auto font-body-md">
          Have questions about the event, sessions, QR passes, or directions at KLE Tech Gokul Campus? Connect directly with the organizing team!
        </p>
      </div>

      {/* Organizer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ORGANIZERS.map((org, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -4 }}
            className="bg-[#1c1b1b] border-[3px] border-[#e61d23] p-6 sm:p-8 relative shadow-[6px_6px_0px_0px_rgba(230,29,35,0.4)] flex flex-col justify-between"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between border-b border-[#353535] pb-3 mb-4">
              <span className="bg-[#e61d23] text-[#fffdff] text-[11px] font-label-bold px-2.5 py-0.5 uppercase tracking-wider border border-white shadow-[2px_2px_0px_0px_#000000]">
                {org.badge}
              </span>
              <span className="text-[11px] font-mono text-[#ffb4ab] uppercase">
                KLE TECH GOKUL
              </span>
            </div>

            {/* Profile Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 bg-[#242424] border-2 border-[#ffb4ab] flex items-center justify-center font-headline-display text-2xl text-[#ffdad6] shrink-0"
                  style={{ textShadow: '1px 1px 0px #e61d23' }}
                >
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-headline-md text-2xl md:text-3xl text-[#e5e2e1] uppercase tracking-wide">
                    {org.name}
                  </h2>
                  <div className="text-xs font-label-bold text-[#ffb4ab] uppercase mt-0.5">
                    {org.role}
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#c6c6c7] font-body-md leading-relaxed bg-[#242424] p-3 border border-[#353535]">
                {org.description}
              </p>

              {/* Prominent Phone Display */}
              <div className="bg-[#131313] border-2 border-[#5d3f3c] p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-label-bold text-[#8e8d8d] uppercase block">
                    DIRECT CONTACT NUMBER
                  </span>
                  <span className="font-headline-md text-xl md:text-2xl text-[#ffdad6] tracking-wider">
                    {org.phone}
                  </span>
                </div>

                <button
                  onClick={() => handleCopy(org.phone, index)}
                  className="bg-[#2a2a2a] hover:bg-[#ffb4ab] hover:text-[#131313] text-[#ffdad6] p-2 border border-[#5d3f3c] transition-colors flex items-center gap-1 text-xs font-label-bold cursor-pointer"
                  title="Copy Phone Number"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-4 h-4 text-[#39FF14]" />
                      <span className="text-[10px] uppercase">COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-[10px] uppercase">COPY</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Action Buttons: Call & WhatsApp */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-[#353535]">
              {/* Call Link */}
              <a
                href={`tel:${org.phone}`}
                className="bg-[#e61d23] text-white hover:bg-[#c00014] text-xs font-label-bold uppercase py-3 px-3 text-center flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_0px_#ffffff] active:scale-95 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>CALL NOW</span>
              </a>

              {/* WhatsApp Link */}
              <a
                href={`https://wa.me/${org.cleanPhone}?text=Hi%20${encodeURIComponent(org.name)},%20I%20have%20a%20query%20regarding%20Fresher's%20Fiesta%202026`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] text-black hover:bg-[#1ebd59] text-xs font-label-bold uppercase py-3 px-3 text-center flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_0px_#ffffff] active:scale-95 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WHATSAPP</span>
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Venue & Event Location Info Box */}
      <section className="bg-[#1c1b1b] border-2 border-[#5d3f3c] p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2 text-[#ffb4ab]">
          <MapPin className="w-5 h-5 text-[#e61d23]" />
          <h3 className="font-headline-md text-xl text-[#e5e2e1] uppercase tracking-wide">
            EVENT VENUE & COORDINATION CENTER
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-body-md">
          <div className="bg-[#242424] p-4 border border-[#353535]">
            <span className="text-[#ffb4ab] font-label-bold uppercase block mb-1">
              CAMPUS LOCATION
            </span>
            <p className="text-[#e5e2e1] leading-relaxed">
              <strong>KLE Technological University</strong><br />
              Gokul Campus, Gokul Road, Vidyanagar<br />
              Hubballi, Karnataka 580031
            </p>
          </div>

          <div className="bg-[#242424] p-4 border border-[#353535]">
            <span className="text-[#ffb4ab] font-label-bold uppercase block mb-1">
              HELP ON ARRIVAL
            </span>
            <p className="text-[#e5e2e1] leading-relaxed">
              Volunteers will be stationed at the Main Entrance Security Gate and CSE Rotunda with digital scanners and squad assignment badges.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap justify-between items-center gap-3 border-t border-[#353535]">
          <span className="text-xs text-[#8e8d8d]">
            Need the directional floor plan?
          </span>
          <button
            onClick={() => onNavigate('map')}
            className="bg-[#131313] border border-[#ffb4ab] text-[#ffdad6] hover:bg-[#e61d23] hover:text-white px-3.5 py-1.5 text-xs font-label-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>OPEN CAMPUS EVENT MAP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
