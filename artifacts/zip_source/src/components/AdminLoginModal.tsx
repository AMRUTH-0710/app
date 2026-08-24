import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, ShieldCheck, Settings, Info } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLogin
}) => {
  const [email, setEmail] = useState('admin@frenzy.edu');
  const [password, setPassword] = useState('frenzy2024');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSetupHelp, setShowSetupHelp] = useState(false);
  const [configuredAdminEmail, setConfiguredAdminEmail] = useState('admin@frenzy.edu');
  const [hasCustomAdmin, setHasCustomAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/admin/info')
      .then((res) => res.json())
      .then((data) => {
        if (data.admin_email) {
          setConfiguredAdminEmail(data.admin_email);
          setEmail(data.admin_email);
          setHasCustomAdmin(data.has_custom_email);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await onLogin(email, password);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || `Access Denied: Only ${configuredAdminEmail} is authorized.`);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#1c1b1b] border-2 border-[#e61d23] brutal-border p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#ffb4ab] hover:text-[#ffdad6] p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b border-[#353535] pb-3 mb-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#e61d23] text-[#fffdff] flex items-center justify-center font-black">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-label-bold text-[#ffb4ab] uppercase tracking-widest block">
              ACCESS CONTROL
            </span>
            <h3 className="font-headline-md text-xl text-[#ffb4ab] uppercase">
              DESIGNATED ADMIN AUTH
            </h3>
          </div>
        </div>

        <div className="mb-4 bg-[#20201f] border-l-4 border-[#e61d23] p-3 text-xs text-[#e5e2e1]">
          <div className="font-bold text-[#ffb4ab] mb-0.5 flex items-center gap-1.5">
            <span>Admin Authorization:</span>
            {hasCustomAdmin && (
              <span className="bg-[#e61d23]/20 text-[#ffb4ab] px-1.5 py-0.2 text-[10px] border border-[#e61d23]/40 font-mono">
                CONFIGURED
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#c6c6c7]">
            Access is strictly tied to <code className="text-[#ffb4ab] font-bold">{configuredAdminEmail}</code>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-label-bold text-[#ffb4ab] uppercase mb-1">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={configuredAdminEmail}
              className="w-full bg-[#2a2a2a] border border-[#5d3f3c] p-2.5 text-xs text-[#e5e2e1] font-label-bold outline-none focus:border-[#e61d23] rounded-none"
            />
          </div>

          <div>
            <label className="block text-xs font-label-bold text-[#ffb4ab] uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#2a2a2a] border border-[#5d3f3c] p-2.5 text-xs text-[#e5e2e1] font-label-bold outline-none focus:border-[#e61d23] rounded-none"
            />
          </div>

          {error && (
            <div className="bg-[#350505] border border-[#ffb4ab] p-2.5 text-xs text-[#ffb4ab] font-label-bold flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#ffb4ab] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#e61d23] text-[#fffdff] font-headline-md text-lg py-3 uppercase tracking-wider faux-border hover:bg-[#c00014] transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
          >
            {loading ? 'VERIFYING...' : 'VERIFY & SIGN IN'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-[#353535] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#767575]">
            Target: <span className="text-[#ffb4ab]">{configuredAdminEmail}</span>
          </span>
          <button
            type="button"
            onClick={() => setShowSetupHelp(!showSetupHelp)}
            className="text-[11px] text-[#ffb4ab] hover:underline flex items-center gap-1 font-bold cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Credentials Info</span>
          </button>
        </div>

        {showSetupHelp && (
          <div className="mt-3 p-3 bg-[#20201f] border border-[#5d3f3c] text-[11px] text-[#e5e2e1] space-y-2 font-mono">
            <div className="text-[#ffb4ab] font-bold flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Environment Variables:
            </div>
            <div className="bg-[#2a2a2a] p-2 text-[#ffdad6] space-y-1 border border-[#5d3f3c]">
              <div>ADMIN_EMAIL=your-chosen-admin@domain.com</div>
              <div>ADMIN_PASSWORD=your-secure-password</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
