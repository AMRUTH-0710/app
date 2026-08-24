import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ComicHeader } from './components/ComicHeader';
import { ComicNav } from './components/ComicNav';
import { HomeView } from './components/HomeView';
import { RegisterView } from './components/RegisterView';
import { PassView } from './components/PassView';
import { ScannerView } from './components/ScannerView';
import { AdminView } from './components/AdminView';
import { GateDisplayView } from './components/GateDisplayView';
import { EmailModal } from './components/EmailModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AgendaView } from './components/AgendaView';
import { ContactsView } from './components/ContactsView';
import type { Registration, AdminUser } from './types';
import { ShieldAlert, X, ShieldCheck } from 'lucide-react';

export default function App() {
  // Check initial URL pathname for direct route access like /gate-display
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/gate-display' || path.endsWith('/gate-display')) return 'gate-display';
      if (path === '/scan' || path.endsWith('/scan')) return 'scan';
      if (path === '/admin' || path.endsWith('/admin')) return 'admin';
      if (path === '/pass' || path.endsWith('/pass')) return 'pass';
      if (path === '/join' || path.endsWith('/join')) return 'join';
      if (path === '/contacts' || path.endsWith('/contacts')) return 'contacts';
      if (path === '/agenda' || path.endsWith('/agenda')) return 'agenda';
    }
    return 'home';
  };

  const [currentTab, setCurrentTab] = useState<string>(getInitialTab);
  const [activeRegistration, setActiveRegistration] = useState<Registration | null>(null);
  const [qrToTestAtScan, setQrToTestAtScan] = useState<string | undefined>(undefined);

  // Admin User & Claims State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [unauthorizedMessage, setUnauthorizedMessage] = useState<string | null>(null);

  // Strict check: isAdmin is ONLY true if claims.admin === true
  const isAdmin = Boolean(adminUser && adminUser.claims && adminUser.claims.admin === true);

  // Email Preview Modal
  const [emailModalReg, setEmailModalReg] = useState<Registration | null>(null);

  // Listen to browser popstate for path changes
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/gate-display' || path.endsWith('/gate-display')) {
        setCurrentTab('gate-display');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Verify stored session token on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem('frenzy_admin_token');
    if (!savedToken) return;

    fetch('/api/admin/verify-token', {
      headers: {
        Authorization: `Bearer ${savedToken}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid && data.claims && data.claims.admin === true) {
          setAdminUser({
            email: data.email,
            token: savedToken,
            claims: data.claims
          });
        } else {
          sessionStorage.removeItem('frenzy_admin_token');
          setAdminUser(null);
        }
      })
      .catch(() => {
        sessionStorage.removeItem('frenzy_admin_token');
        setAdminUser(null);
      });
  }, []);

  // Secure navigation guard: block access to admin, scan, & display if not admin claim holder
  const handleNavigate = useCallback((tab: string) => {
    if (tab === 'admin' || tab === 'scan' || tab === 'gate-display') {
      if (!isAdmin) {
        setUnauthorizedMessage(
          'Access Denied: The Admin Portal, Gate Scanner, and Projector Display require the designated administrator account with the { admin: true } custom claim.'
        );
        // Note: GateDisplayView contains its own embedded admin login gate if visited directly
        if (tab !== 'gate-display') {
          setCurrentTab('home');
          return;
        }
      }
    }

    if (tab === 'gate-display') {
      try {
        if (window.location.pathname !== '/gate-display') {
          window.history.pushState({}, '', '/gate-display');
        }
      } catch (e) {}
    } else {
      try {
        if (window.location.pathname === '/gate-display') {
          window.history.pushState({}, '', '/');
        }
      } catch (e) {}
    }

    setUnauthorizedMessage(null);
    setCurrentTab(tab);
  }, [isAdmin]);

  const handleAdminLogin = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();

      if (res.ok && data.success && data.user && data.user.claims && data.user.claims.admin === true) {
        const receivedToken = data.token || data.user.token || '';
        const userObj: AdminUser = {
          email: data.user.email,
          token: receivedToken,
          claims: data.user.claims
        };
        setAdminUser(userObj);
        if (receivedToken) {
          sessionStorage.setItem('frenzy_admin_token', receivedToken);
        }
        setUnauthorizedMessage(null);
        return { success: true };
      }

      return {
        success: false,
        error: data.error || 'Access Denied: Account lacks { admin: true } custom claim.'
      };
    } catch (e: any) {
      return {
        success: false,
        error: e.message || 'Authentication service error'
      };
    }
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    sessionStorage.removeItem('frenzy_admin_token');
    if (currentTab === 'admin' || currentTab === 'scan' || currentTab === 'gate-display') {
      setCurrentTab('home');
    }
  };

  const handleRegistrationSuccess = (reg: Registration) => {
    setActiveRegistration(reg);
    setCurrentTab('pass');
  };

  const handleNavigateToPass = async (qrCodeId: string) => {
    try {
      const res = await fetch(`/api/pass/${qrCodeId}`);
      const data = await res.json();
      if (data.registration) {
        setActiveRegistration(data.registration);
      }
    } catch (e) {}
    setCurrentTab('pass');
  };

  const handleNavigateToScanWithPass = (qrCodeId?: string) => {
    setQrToTestAtScan(qrCodeId);
    handleNavigate('scan');
  };

  return (
    <div className={`min-h-screen bg-[#0A0B10] text-[#e5e2e1] flex flex-col pt-16 selection:bg-[#00FFFF] selection:text-[#000000] ${
      currentTab === 'gate-display' ? 'pb-4' : 'pb-24 md:pb-8 md:pl-64 halftone-bg'
    }`}>
      {/* Top App Bar (Hidden in gate-display mode to maximize projector stage) */}
      {currentTab !== 'gate-display' && (
        <ComicHeader
          currentTab={currentTab}
          onNavigate={handleNavigate}
          isAdmin={isAdmin}
          onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
        />
      )}

      {/* Unauthorized Access Notification Toast */}
      {unauthorizedMessage && currentTab !== 'gate-display' && (
        <div className="fixed top-18 right-4 left-4 md:left-68 z-50 bg-[#350505] border-3 border-[#ffb4ab] p-4 shadow-[4px_4px_0px_0px_#FF00FF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-bounce-short">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-[#ffb4ab] shrink-0" />
            <div>
              <div className="font-label-bold text-xs text-[#ffb4ab] uppercase">
                NOT AUTHORIZED • 403 FORBIDDEN
              </div>
              <div className="text-xs text-[#e5e2e1] font-body-md">
                {unauthorizedMessage}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => {
                setUnauthorizedMessage(null);
                setIsAdminLoginModalOpen(true);
              }}
              className="bg-[#00FFFF] text-[#000000] px-3 py-1 text-xs font-label-bold uppercase border border-[#000000] hover:bg-[#39FF14]"
            >
              Sign In As Admin
            </button>
            <button
              onClick={() => setUnauthorizedMessage(null)}
              className="text-[#ffb4ab] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-grow p-4 md:p-8 flex items-start justify-center overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex justify-center"
          >
            {currentTab === 'home' && (
              <HomeView onNavigate={handleNavigate} />
            )}

            {currentTab === 'agenda' && (
              <AgendaView onNavigate={handleNavigate} />
            )}

            {currentTab === 'contacts' && (
              <ContactsView onNavigate={handleNavigate} />
            )}

            {currentTab === 'join' && (
              <RegisterView
                onRegistrationSuccess={handleRegistrationSuccess}
                onNavigateToPass={handleNavigateToPass}
              />
            )}

            {currentTab === 'pass' && (
              <PassView
                registration={activeRegistration}
                onNavigateToScan={handleNavigateToScanWithPass}
                onOpenEmailModal={(reg) => setEmailModalReg(reg)}
              />
            )}

            {currentTab === 'scan' && (
              <ScannerView
                isAdmin={isAdmin}
                adminToken={adminUser?.token}
                onAdminLogin={handleAdminLogin}
                initialQrToTest={qrToTestAtScan}
                onOpenGateDisplay={() => handleNavigate('gate-display')}
              />
            )}

            {currentTab === 'admin' && (
              <AdminView
                isAdmin={isAdmin}
                adminToken={adminUser?.token}
                onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
                onAdminLogout={handleAdminLogout}
                onViewPass={handleNavigateToPass}
                onOpenGateDisplay={() => handleNavigate('gate-display')}
              />
            )}

            {currentTab === 'gate-display' && (
              <GateDisplayView
                isAdmin={isAdmin}
                adminToken={adminUser?.token}
                onAdminLogin={handleAdminLogin}
                onBackToScanner={() => handleNavigate('scan')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation (Bottom Bar for Mobile, Sidebar for Desktop - Hidden in Projector display mode) */}
      {currentTab !== 'gate-display' && (
        <ComicNav
          currentTab={currentTab}
          onNavigate={handleNavigate}
          isAdmin={isAdmin}
        />
      )}

      {/* Transactional Email Modal */}
      {emailModalReg && (
        <EmailModal
          registration={emailModalReg}
          onClose={() => setEmailModalReg(null)}
        />
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onLogin={handleAdminLogin}
      />
    </div>
  );
}

