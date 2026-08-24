import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { 
  Upload, 
  FileText, 
  Users, 
  CheckCircle2, 
  RefreshCw, 
  Plus, 
  Search, 
  Trash2, 
  Mail, 
  Download, 
  ShieldCheck, 
  ArrowUpDown, 
  Terminal, 
  Key, 
  ShieldAlert,
  Users2,
  Shuffle,
  Sparkles,
  MessageSquare,
  Send,
  Save,
  Check,
  Tv2,
  Calendar,
  Edit3,
  BookOpen
} from 'lucide-react';
import type { WhitelistEntry, Registration, SentEmail, StatsResponse, Squad, SquadMember, InvitationLetterContent, AgendaDayContent, ScheduleItem } from '../types';
import { sounds } from '../utils/sound';

interface AdminViewProps {
  isAdmin: boolean;
  adminToken?: string;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
  onViewPass: (qrCodeId: string) => void;
  onOpenGateDisplay?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  isAdmin,
  adminToken,
  onOpenAdminLogin,
  onAdminLogout,
  onViewPass,
  onOpenGateDisplay
}) => {
  const [activeTab, setActiveTab] = useState<'whitelist' | 'registrations' | 'squads' | 'emails' | 'content' | 'security'>('squads');

  // Whitelist state
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [whitelistSearch, setWhitelistSearch] = useState('');
  const [csvText, setCsvText] = useState('');
  const [uploadMode, setUploadMode] = useState<'append' | 'replace'>('append');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Single add student
  const [newRoll, setNewRoll] = useState('');
  const [newName, setNewName] = useState('');
  const [newBranch, setNewBranch] = useState('Computer Science');

  // Registrations state
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regSearch, setRegSearch] = useState('');
  const [regFilter, setRegFilter] = useState<'all' | 'pending' | 'scanned'>('all');

  // Squads state
  const [squads, setSquads] = useState<Squad[]>([]);
  const [squadSize, setSquadSize] = useState<number>(8);
  const [squadLoading, setSquadLoading] = useState<boolean>(false);
  const [squadMessage, setSquadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedAdminSquad, setSelectedAdminSquad] = useState<Squad | null>(null);
  const [adminBroadcastText, setAdminBroadcastText] = useState<string>('');

  // Emails outbox state
  const [emails, setEmails] = useState<SentEmail[]>([]);

  // Content Management & Agenda State
  const [contentSubTab, setContentSubTab] = useState<'letter' | 'day1' | 'day2'>('letter');
  const [letterForm, setLetterForm] = useState<InvitationLetterContent>({
    title: "A Golden Invitation to Freshers' Bash 2026",
    subtitle: "BComm Association Welcomes Batch 2026",
    greeting: "Dear Freshers,",
    body: [
      "Welcome to the beginning of your most exciting college years! The BComm Association, alongside your dedicated seniors and faculty members, is thrilled to invite you to the official Freshers' Party for the Batch of 2026.",
      "We have prepared two unforgettable days of fun, music, food, and camaraderie to welcome you into our vibrant campus family.",
      "Come dressed in your finest spirits, bring your brightest smiles, and get ready for an epic celebration crafted just for you. We cannot wait to see you there!"
    ],
    signature_title: "With warmth and best wishes,",
    signature_names: "From the Seniors, Student Council & Faculty of BComm Association"
  });
  const [day1Form, setDay1Form] = useState<AgendaDayContent>({
    title: "Day 1 — September 1, 2026",
    date: "September 1, 2026",
    theme: "Y2K",
    food: "Snacks provided",
    schedule: [
      { time: "9:00 – 9:30 AM", activity: "Welcome to the Freshers' Party & Speech — CSE Hall" },
      { time: "9:30 AM – 5:00 PM", activity: "Games (with one break in between): KBC, Hyrox, Human Tic-Tac-Toe, Balloon Game (Optional), 8 Brains (Finale)" },
      { time: "5:00 PM", activity: "Closing Ceremony, Awards & Assigning Tasks for Day 2" }
    ]
  });
  const [day2Form, setDay2Form] = useState<AgendaDayContent>({
    title: "Day 2 — September 2, 2026",
    date: "September 2, 2026",
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
  });
  const [contentSaveLoading, setContentSaveLoading] = useState(false);
  const [contentSaveMessage, setContentSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Stats
  const [stats, setStats] = useState<StatsResponse>({
    total_whitelist: 0,
    total_registered: 0,
    total_scanned: 0,
    total_pending: 0
  });

  // Admin info state
  const [adminConfig, setAdminConfig] = useState<{
    admin_email: string;
    has_custom_email: boolean;
    has_custom_password: boolean;
    firebase_admin_initialized: boolean;
  }>({
    admin_email: 'admin@frenzy.edu',
    has_custom_email: false,
    has_custom_password: false,
    firebase_admin_initialized: false
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
  };

  const fetchData = async () => {
    try {
      const [wlRes, regRes, squadRes, squadConfigRes, emailRes, statsRes, adminInfoRes] = await Promise.all([
        fetch('/api/whitelist').then((r) => r.json()),
        fetch('/api/registrations', { headers: authHeaders }).then((r) => r.json()),
        fetch('/api/squads').then((r) => r.json()).catch(() => ({ squads: [] })),
        fetch('/api/squads/config').then((r) => r.json()).catch(() => ({ squad_size: 8 })),
        fetch('/api/emails', { headers: authHeaders }).then((r) => r.json()),
        fetch('/api/stats').then((r) => r.json()),
        fetch('/api/admin/info').then((r) => r.json()).catch(() => null)
      ]);

      if (wlRes.entries) setWhitelist(wlRes.entries);
      if (regRes.registrations) setRegistrations(regRes.registrations);
      if (squadRes.squads) setSquads(squadRes.squads);
      if (squadConfigRes.squad_size) setSquadSize(squadConfigRes.squad_size);
      if (emailRes.emails) setEmails(emailRes.emails);
      if (statsRes) setStats(statsRes);
      if (adminInfoRes) setAdminConfig(adminInfoRes);
      await fetchContentDocs();
    } catch (e) {
      console.error('Error fetching admin data', e);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, adminToken]);

  // Squad Config & Auto-Grouping Handlers
  const handleSaveSquadSize = async (e: React.FormEvent) => {
    e.preventDefault();
    setSquadLoading(true);
    setSquadMessage(null);
    try {
      const res = await fetch('/api/squads/config', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ squad_size: Number(squadSize) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update squad size');
      sounds.playValid();
      setSquadMessage({ type: 'success', text: `Squad size updated to ${squadSize} members per group!` });
    } catch (err: any) {
      sounds.playDenied();
      setSquadMessage({ type: 'error', text: err.message });
    } finally {
      setSquadLoading(false);
    }
  };

  const handleRunAutoGrouping = async () => {
    setSquadLoading(true);
    setSquadMessage(null);
    try {
      const res = await fetch('/api/squads/auto-group', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ squad_size: Number(squadSize) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run auto-grouping');
      sounds.playValid();
      setSquadMessage({ 
        type: 'success', 
        text: `⚡ Successfully created ${data.squad_count} balanced squads for ${data.total_registrants} registrants!` 
      });
      fetchData();
    } catch (err: any) {
      sounds.playDenied();
      setSquadMessage({ type: 'error', text: err.message });
    } finally {
      setSquadLoading(false);
    }
  };

  const handleReshuffleSquads = async () => {
    if (!window.confirm('Are you sure you want to reshuffle all squads? This will re-balance all registered attendees into new teams.')) {
      return;
    }
    setSquadLoading(true);
    setSquadMessage(null);
    try {
      const res = await fetch('/api/squads/reshuffle', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ squad_size: Number(squadSize) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reshuffle squads');
      sounds.playValid();
      setSquadMessage({ 
        type: 'success', 
        text: `🎲 Re-shuffled ${data.total_registrants} registrants across ${data.squad_count} squads!` 
      });
      fetchData();
    } catch (err: any) {
      sounds.playDenied();
      setSquadMessage({ type: 'error', text: err.message });
    } finally {
      setSquadLoading(false);
    }
  };

  // Send admin announcement to a squad
  const handleSendAdminBroadcast = async (squadId: string) => {
    if (!adminBroadcastText.trim()) return;
    try {
      const res = await fetch(`/api/squads/${squadId}/messages`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          sender_name: 'EVENT COMMAND (ADMIN)',
          sender_roll_no: 'SYSTEM',
          text: adminBroadcastText.trim()
        })
      });
      if (res.ok) {
        sounds.playValid();
        setAdminBroadcastText('');
        setSquadMessage({ type: 'success', text: 'Broadcast sent to squad chat!' });
      }
    } catch (err: any) {
      sounds.playDenied();
      setSquadMessage({ type: 'error', text: 'Failed to send broadcast' });
    }
  };

  // Handle CSV File Upload via file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          processCsvRows(results.data);
        } else {
          setUploadMessage({ type: 'error', text: 'No rows found in the CSV file.' });
        }
      },
      error: (err) => {
        setUploadMessage({ type: 'error', text: `CSV Parse Error: ${err.message}` });
      }
    });
  };

  // Handle CSV Text paste submission
  const handleCsvTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    // Check if input contains header or raw rows
    Papa.parse(csvText.trim(), {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          // If first row has roll_no key, use header mode results
          const first = results.data[0] as any;
          if (first && (first.roll_no || first.rollno || first.roll || first.id)) {
            processCsvRows(results.data);
            return;
          }
        }

        // Fallback to non-header raw parsing for lines like "01FM26BCM001,BHUMIKA V CHALAGERI,"
        Papa.parse(csvText.trim(), {
          header: false,
          skipEmptyLines: true,
          complete: (rawResults) => {
            if (rawResults.data && rawResults.data.length > 0) {
              const parsedRows = (rawResults.data as string[][]).map((cols) => {
                const roll_no = (cols[0] || '').trim().toUpperCase();
                const name = (cols[1] || '').replace(/,+$/, '').trim();
                const branch = (cols[2] || '').trim();
                const gender = (cols[3] || '').trim();
                return { roll_no, name, branch, gender };
              }).filter((r) => r.roll_no && r.roll_no.toLowerCase() !== 'roll_no');

              processCsvRows(parsedRows);
            } else {
              setUploadMessage({ type: 'error', text: 'No valid records found in pasted text.' });
            }
          },
          error: (err) => {
            setUploadMessage({ type: 'error', text: `Parse Error: ${err.message}` });
          }
        });
      },
      error: (err) => {
        setUploadMessage({ type: 'error', text: `Parse Error: ${err.message}` });
      }
    });
  };

  // Post CSV parsed rows to server
  const processCsvRows = async (rows: any[]) => {
    setUploadLoading(true);
    setUploadMessage(null);

    const cleanedRows = rows.map((r) => {
      const roll_no = (r.roll_no || r.rollno || r.roll || r.id || '').toString().trim().toUpperCase();
      const name = (r.name || r.fullname || r.student_name || '').toString().replace(/,+$/, '').trim();
      const branch = (r.branch !== undefined && r.branch !== null ? r.branch : (r.department || r.dept || '')).toString().trim();
      const gender = (r.gender || r.sex || '').toString().trim();
      return { roll_no, name, branch, gender };
    }).filter((r) => r.roll_no && r.roll_no.toLowerCase() !== 'roll_no');

    try {
      const res = await fetch('/api/whitelist/upload', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          rows: cleanedRows,
          mode: uploadMode
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload whitelist');

      sounds.playValid();
      setUploadMessage({ type: 'success', text: data.message });
      setCsvText('');
      fetchData();
    } catch (err: any) {
      sounds.playDenied();
      setUploadMessage({ type: 'error', text: err.message });
    } finally {
      setUploadLoading(false);
    }
  };

  // Completely clear whitelist
  const handleClearWhitelist = async () => {
    if (!window.confirm('⚠️ WARNING: Are you sure you want to completely clear the WHITELIST collection? All entries will be deleted.')) {
      return;
    }
    setUploadLoading(true);
    try {
      const res = await fetch('/api/whitelist/clear', {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clear whitelist');
      sounds.playValid();
      setUploadMessage({ type: 'success', text: data.message });
      fetchData();
    } catch (err: any) {
      sounds.playDenied();
      setUploadMessage({ type: 'error', text: err.message });
    } finally {
      setUploadLoading(false);
    }
  };

  // Add single whitelist entry
  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoll.trim()) return;

    await processCsvRows([
      {
        roll_no: newRoll.trim().toUpperCase(),
        name: newName.trim() || 'Junior Student',
        branch: newBranch.trim()
      }
    ]);

    setNewRoll('');
    setNewName('');
  };

  // Reset database to demo state
  const handleReset = async () => {
    if (window.confirm('Reset database to default sample dataset?')) {
      try {
        await fetch('/api/whitelist/reset', {
          method: 'POST',
          headers: authHeaders
        });
        fetchData();
      } catch (e) {}
    }
  };

  // Quick scan/admit student from admin table
  const handleDirectAdmit = async (qrId: string) => {
    try {
      await fetch('/api/scan', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ qr_code_id: qrId })
      });
      fetchData();
    } catch (e) {}
  };

  // Fetch content docs for admin editor
  const fetchContentDocs = async () => {
    try {
      const [letterRes, d1Res, d2Res] = await Promise.all([
        fetch('/api/content/invitation_letter').then((r) => r.json()),
        fetch('/api/content/agenda_day1').then((r) => r.json()),
        fetch('/api/content/agenda_day2').then((r) => r.json())
      ]);

      if (letterRes && letterRes.data) setLetterForm(letterRes.data);
      if (d1Res && d1Res.data) setDay1Form(d1Res.data);
      if (d2Res && d2Res.data) setDay2Form(d2Res.data);
    } catch (e) {
      console.error('Error loading content documents:', e);
    }
  };

  // Save content document to Firestore
  const handleSaveContent = async (docId: 'invitation_letter' | 'agenda_day1' | 'agenda_day2', dataToSave: any) => {
    setContentSaveLoading(true);
    setContentSaveMessage(null);
    try {
      const res = await fetch(`/api/content/${docId}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(dataToSave)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update content in Firestore');

      sounds.playValid();
      setContentSaveMessage({
        type: 'success',
        text: `✓ Firestore document content/${docId} successfully updated & published live!`
      });
    } catch (err: any) {
      sounds.playDenied();
      setContentSaveMessage({
        type: 'error',
        text: err.message || 'Failed to save content document.'
      });
    } finally {
      setContentSaveLoading(false);
    }
  };

  // Export all Registrations as CSV
  const handleExportRegistrations = async () => {
    try {
      const res = await fetch('/api/registrations/csv', {
        headers: authHeaders
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `FresherFrenzy_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
        link.click();
        URL.revokeObjectURL(url);
        return;
      }
    } catch (e) {}

    // Client-side fallback
    const csvRows = registrations.map((r) => ({
      'Roll Number': r.roll_no,
      'Full Name': r.name,
      'Branch': r.branch,
      'Email': r.email,
      'Phone': r.phone || '',
      'Gender': r.gender || '',
      'Pass ID': r.qr_code_id,
      'Squad Name': r.squad_name || squads.find((s) => s.squad_id === r.squad_id)?.squad_name || 'Unassigned',
      'Status': r.status,
      'Registered At': r.registered_at,
      'Scanned At': r.scanned_at || ''
    }));
    const csv = Papa.unparse(csvRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FresherFrenzy_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export Whitelist CSV
  const handleExportWhitelist = () => {
    const csv = Papa.unparse(whitelist);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'FresherFrenzy_Junior_Whitelist.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isAdmin) {
    return (
      <div className="w-full max-w-md mx-auto py-12 text-center">
        <div className="comic-panel-pink p-6">
          <ShieldCheck className="w-12 h-12 text-[#00FFFF] mx-auto mb-3" />
          <h3 className="font-headline-lg text-2xl text-[#FF00FF] uppercase mb-2">
            ADMIN PORTAL LOCKED
          </h3>
          <p className="text-xs text-[#e5e2e1] mb-6 font-body-md">
            Please sign in to upload student whitelist CSVs and manage event registrations.
          </p>
          <button
            onClick={onOpenAdminLogin}
            className="comic-button px-6 py-2.5 text-base uppercase"
          >
            SIGN IN AS ADMIN
          </button>
        </div>
      </div>
    );
  }

  // Filtered lists
  const filteredWhitelist = whitelist.filter(
    (w) =>
      w.roll_no.toLowerCase().includes(whitelistSearch.toLowerCase()) ||
      w.name.toLowerCase().includes(whitelistSearch.toLowerCase()) ||
      w.branch.toLowerCase().includes(whitelistSearch.toLowerCase())
  );

  const filteredRegistrations = registrations.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(regSearch.toLowerCase()) ||
      r.roll_no.toLowerCase().includes(regSearch.toLowerCase()) ||
      r.qr_code_id.toLowerCase().includes(regSearch.toLowerCase());
    const matchFilter = regFilter === 'all' || r.status === regFilter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-16 px-2">
      {/* Top Banner & Stats Bento */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#131313] border-3 border-[#39FF14] p-4 shadow-[4px_4px_0px_0px_#FF00FF]">
        <div>
          <span className="font-label-bold text-xs text-[#39FF14] uppercase">SUPERVISOR CONSOLE</span>
          <h2 className="font-headline-lg text-2xl md:text-3xl text-[#00FFFF] uppercase tracking-wide">
            PARTY COMMAND CENTER
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onOpenGateDisplay && (
            <button
              onClick={onOpenGateDisplay}
              className="bg-[#00FFFF] text-[#000000] border border-[#000000] px-3 py-1.5 text-xs font-label-bold uppercase hover:bg-[#39FF14] transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000000] cursor-pointer"
            >
              <Tv2 className="w-3.5 h-3.5" />
              <span>GATE DISPLAY</span>
            </button>
          )}
          <button
            onClick={handleReset}
            className="bg-[#201f1f] text-[#ffb4ab] border border-[#ffb4ab] px-3 py-1.5 text-xs font-label-bold uppercase hover:bg-[#ffb4ab] hover:text-[#000000] transition-all flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESET DEMO</span>
          </button>
          <button
            onClick={onAdminLogout}
            className="bg-[#FF00FF] text-[#000000] px-3 py-1.5 text-xs font-label-bold uppercase border border-[#000000] hover:bg-[#00FFFF] transition-all cursor-pointer"
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#1c1b1b] border-2 border-[#00FFFF] p-3 text-center">
          <div className="text-[11px] font-label-bold text-[#dcbed4] uppercase">ELIGIBLE JUNIORS</div>
          <div className="font-display-hero text-2xl md:text-3xl text-[#00FFFF]">{stats.total_whitelist}</div>
        </div>
        <div className="bg-[#1c1b1b] border-2 border-[#FF00FF] p-3 text-center">
          <div className="text-[11px] font-label-bold text-[#dcbed4] uppercase">REGISTERED</div>
          <div className="font-display-hero text-2xl md:text-3xl text-[#FF00FF]">{stats.total_registered}</div>
        </div>
        <div className="bg-[#1c1b1b] border-2 border-[#39FF14] p-3 text-center">
          <div className="text-[11px] font-label-bold text-[#dcbed4] uppercase">SQUADS ACTIVE</div>
          <div className="font-display-hero text-2xl md:text-3xl text-[#39FF14]">{squads.length}</div>
        </div>
        <div className="bg-[#1c1b1b] border-2 border-[#ffd7f5] p-3 text-center">
          <div className="text-[11px] font-label-bold text-[#dcbed4] uppercase">SCANNED / IN PARTY</div>
          <div className="font-display-hero text-2xl md:text-3xl text-[#ffd7f5]">{stats.total_scanned}</div>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b-2 border-[#39FF14] pb-2">
        <button
          onClick={() => setActiveTab('squads')}
          className={`px-3 sm:px-4 py-2 text-xs font-label-bold uppercase border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'squads'
              ? 'bg-[#39FF14] text-[#000000] border-[#000000] shadow-[2px_2px_0px_0px_#FF00FF]'
              : 'bg-[#131313] text-[#39FF14] border-transparent hover:border-[#39FF14]'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>SQUADS ({squads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('whitelist')}
          className={`px-3 sm:px-4 py-2 text-xs font-label-bold uppercase border-2 transition-all cursor-pointer ${
            activeTab === 'whitelist'
              ? 'bg-[#00FFFF] text-[#000000] border-[#000000] shadow-[2px_2px_0px_0px_#FF00FF]'
              : 'bg-[#131313] text-[#00FFFF] border-transparent hover:border-[#00FFFF]'
          }`}
        >
          1. WHITELIST ({whitelist.length})
        </button>

        <button
          onClick={() => setActiveTab('registrations')}
          className={`px-3 sm:px-4 py-2 text-xs font-label-bold uppercase border-2 transition-all cursor-pointer ${
            activeTab === 'registrations'
              ? 'bg-[#FF00FF] text-[#000000] border-[#000000] shadow-[2px_2px_0px_0px_#00FFFF]'
              : 'bg-[#131313] text-[#FF00FF] border-transparent hover:border-[#FF00FF]'
          }`}
        >
          2. REGISTRATIONS ({registrations.length})
        </button>

        <button
          onClick={() => setActiveTab('emails')}
          className={`px-3 sm:px-4 py-2 text-xs font-label-bold uppercase border-2 transition-all cursor-pointer ${
            activeTab === 'emails'
              ? 'bg-[#00FFFF] text-[#000000] border-[#000000] shadow-[2px_2px_0px_0px_#39FF14]'
              : 'bg-[#131313] text-[#00FFFF] border-transparent hover:border-[#00FFFF]'
          }`}
        >
          3. EMAILS ({emails.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('content');
            fetchContentDocs();
          }}
          className={`px-3 sm:px-4 py-2 text-xs font-label-bold uppercase border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'content'
              ? 'bg-[#39FF14] text-[#000000] border-[#000000] shadow-[2px_2px_0px_0px_#FF00FF]'
              : 'bg-[#131313] text-[#39FF14] border-transparent hover:border-[#39FF14]'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>4. CONTENT & AGENDA</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 sm:px-4 py-2 text-xs font-label-bold uppercase border-2 transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-[#ffd7f5] text-[#000000] border-[#000000] shadow-[2px_2px_0px_0px_#39FF14]'
              : 'bg-[#131313] text-[#ffd7f5] border-transparent hover:border-[#ffd7f5]'
          }`}
        >
          5. ADMIN SETUP
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          {/* SQUADS & AUTO-GROUPING TAB */}
          {activeTab === 'squads' && (
        <div className="space-y-6">
          {/* Squad Engine Control Box */}
          <div className="bg-[#1c1b1b] border-3 border-[#39FF14] p-5 shadow-[6px_6px_0px_0px_#FF00FF]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#564052] pb-4 mb-4">
              <div>
                <span className="font-label-bold text-xs text-[#39FF14] uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#FF00FF]" />
                  <span>ALGORITHMIC BALANCER</span>
                </span>
                <h3 className="font-headline-lg text-2xl text-[#00FFFF] uppercase tracking-wide">
                  AUTO-GROUPED SQUAD ENGINE
                </h3>
                <p className="text-xs text-[#dcbed4] mt-1">
                  Evenly distributes registrants into balanced squads by size and mixes genders evenly across every squad.
                </p>
              </div>

              {/* Action Buttons: Run Auto-Grouping & Reshuffle */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunAutoGrouping}
                  disabled={squadLoading || registrations.length === 0}
                  className="bg-[#39FF14] hover:bg-[#00FFFF] disabled:opacity-50 text-[#000000] px-4 py-2.5 font-label-bold text-xs uppercase border-2 border-[#000000] shadow-[3px_3px_0px_0px_#FF00FF] hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{squadLoading ? 'GROUPING...' : 'RUN AUTO-GROUPING'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReshuffleSquads}
                  disabled={squadLoading || squads.length === 0}
                  className="bg-[#FF00FF] hover:bg-[#ffabf3] disabled:opacity-50 text-[#000000] px-4 py-2.5 font-label-bold text-xs uppercase border-2 border-[#000000] shadow-[3px_3px_0px_0px_#00FFFF] hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>RE-SHUFFLE SQUADS</span>
                </button>
              </div>
            </div>

            {/* Config: Set Squad Size */}
            <form onSubmit={handleSaveSquadSize} className="flex flex-wrap items-center gap-3 bg-[#131313] p-3 border border-[#39FF14]">
              <div className="flex items-center gap-2">
                <label className="text-xs font-label-bold text-[#FF00FF] uppercase">
                  SET SQUAD SIZE:
                </label>
                <input
                  type="number"
                  min={2}
                  max={50}
                  value={squadSize}
                  onChange={(e) => setSquadSize(Math.max(2, parseInt(e.target.value) || 2))}
                  className="w-20 bg-[#1c1b1b] border-2 border-[#00FFFF] px-2.5 py-1 text-center font-bold text-sm text-[#00FFFF] outline-none"
                />
                <span className="text-xs text-[#a4899d]">members per squad (default 8)</span>
              </div>

              <button
                type="submit"
                disabled={squadLoading}
                className="bg-[#00FFFF] hover:bg-[#39FF14] text-[#000000] px-3 py-1 text-xs font-label-bold uppercase border border-[#000000] shadow-[2px_2px_0px_0px_#000000] flex items-center gap-1 cursor-pointer transition-all ml-auto"
              >
                <Save className="w-3.5 h-3.5" />
                <span>SAVE SIZE</span>
              </button>
            </form>

            {/* Feedback Message */}
            {squadMessage && (
              <div
                className={`mt-4 p-3 border text-xs font-label-bold flex items-center gap-2 ${
                  squadMessage.type === 'success'
                    ? 'bg-[#052600] border-[#39FF14] text-[#39FF14]'
                    : 'bg-[#350505] border-[#ffb4ab] text-[#ffb4ab]'
                }`}
              >
                {squadMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
                <span>{squadMessage.text}</span>
              </div>
            )}
          </div>

          {/* Squads List Grid */}
          <div className="bg-[#1c1b1b] border-2 border-[#00FFFF] p-4">
            <div className="flex items-center justify-between mb-4 border-b border-[#564052] pb-2">
              <h4 className="font-headline-lg text-lg text-[#00FFFF] uppercase flex items-center gap-2">
                <Users2 className="w-5 h-5 text-[#39FF14]" />
                <span>GENERATED SQUADS ({squads.length})</span>
              </h4>
              <span className="text-xs text-[#a4899d] font-mono">
                {registrations.length} Total Registrants Grouped
              </span>
            </div>

            {squads.length === 0 ? (
              <div className="text-center py-10 bg-[#131313] border border-[#564052] p-6">
                <Users className="w-10 h-10 text-[#FF00FF] mx-auto mb-2 opacity-60" />
                <p className="font-label-bold text-sm text-[#00FFFF] uppercase">No Squads Created Yet</p>
                <p className="text-xs text-[#dcbed4] mt-1 max-w-md mx-auto">
                  Click <strong>"RUN AUTO-GROUPING"</strong> above to distribute all registered freshers into balanced squads with gender mixing!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {squads.map((sq) => {
                  const femaleCount = sq.members.filter((m) => m.gender === 'Female').length;
                  const maleCount = sq.members.filter((m) => m.gender === 'Male').length;
                  const otherCount = sq.members.filter((m) => m.gender === 'Other').length;

                  return (
                    <div
                      key={sq.squad_id}
                      className="bg-[#131313] border-2 border-[#39FF14] p-4 flex flex-col justify-between shadow-[4px_4px_0px_0px_#000000] hover:border-[#00FFFF] transition-all"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 border-b border-[#313030] pb-2 mb-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-label-bold text-[10px] bg-[#FF00FF] text-[#000000] px-1.5 py-0.2 uppercase">
                                SQUAD #{sq.squad_id.slice(-4)}
                              </span>
                              <span className="text-[10px] text-[#39FF14] font-mono">
                                {sq.members.length} Freshers
                              </span>
                            </div>
                            <h5 className="font-headline-lg text-lg text-[#00FFFF] uppercase tracking-wide mt-1">
                              {sq.squad_name}
                            </h5>
                          </div>

                          {/* Gender balance indicator badge */}
                          <div className="bg-[#1c1b1b] border border-[#564052] p-1 text-[10px] font-mono text-right text-[#a4899d]">
                            <div>♀ {femaleCount} | ♂ {maleCount} {otherCount > 0 ? `| ⚧ ${otherCount}` : ''}</div>
                            <span className="text-[#39FF14] text-[9px]">Balanced Mix</span>
                          </div>
                        </div>

                        {/* Members Roster */}
                        <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto pr-1">
                          {sq.members.map((member) => (
                            <div
                              key={member.roll_no}
                              className="bg-[#1c1b1b] border border-[#313030] px-2.5 py-1.5 text-xs flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold text-[#e5e2e1]">{member.name}</span>
                                <span className="text-[11px] text-[#a4899d] ml-1.5">({member.branch})</span>
                              </div>
                              <span className="font-mono text-[10px] text-[#00FFFF] bg-[#131313] px-1.5 py-0.5 border border-[#564052]">
                                {member.roll_no}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Admin Chat Announcement Bar for this squad */}
                      <div className="pt-2 border-t border-[#313030] flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder={`Broadcast note to ${sq.squad_name}...`}
                          value={selectedAdminSquad?.squad_id === sq.squad_id ? adminBroadcastText : ''}
                          onFocus={() => setSelectedAdminSquad(sq)}
                          onChange={(e) => {
                            setSelectedAdminSquad(sq);
                            setAdminBroadcastText(e.target.value);
                          }}
                          className="flex-1 bg-[#1c1b1b] border border-[#564052] px-2.5 py-1 text-xs text-[#00FFFF] placeholder:text-[#564052] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendAdminBroadcast(sq.squad_id)}
                          className="bg-[#39FF14] hover:bg-[#00FFFF] text-[#000000] p-1.5 border border-[#000000] text-xs font-bold transition-all cursor-pointer"
                          title="Send Announcement"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: WHITELIST MANAGER & CSV UPLOADER */}
      {activeTab === 'whitelist' && (
        <div className="space-y-6">
          {/* CSV Upload & Paste Section */}
          <div className="bg-[#1c1b1b] border-3 border-[#00FFFF] p-5">
            <h3 className="font-headline-lg text-lg text-[#00FFFF] uppercase mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              POPULATE JUNIOR WHITELIST (SOURCE OF TRUTH)
            </h3>
            <p className="text-xs text-[#dcbed4] mb-4">
              Upload or paste a CSV with headers: <code className="text-[#39FF14] font-mono font-bold">roll_no, name, branch, gender</code>
            </p>

            {/* Mode selection */}
            <div className="flex items-center gap-4 mb-4 text-xs font-label-bold">
              <label className="flex items-center gap-1.5 cursor-pointer text-[#e5e2e1]">
                <input
                  type="radio"
                  name="uploadMode"
                  checked={uploadMode === 'append'}
                  onChange={() => setUploadMode('append')}
                  className="accent-[#39FF14]"
                />
                <span>Append / Update existing</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[#e5e2e1]">
                <input
                  type="radio"
                  name="uploadMode"
                  checked={uploadMode === 'replace'}
                  onChange={() => setUploadMode('replace')}
                  className="accent-[#FF00FF]"
                />
                <span>Replace entire Whitelist</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File upload box */}
              <div className="border-2 border-dashed border-[#FF00FF] p-4 text-center bg-[#131313] flex flex-col items-center justify-center">
                <FileText className="w-8 h-8 text-[#FF00FF] mb-2" />
                <span className="text-xs font-label-bold text-[#e5e2e1] mb-2">
                  Upload CSV File from Device
                </span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="text-xs text-[#00FFFF] file:mr-2 file:py-1 file:px-2 file:border-0 file:bg-[#FF00FF] file:text-[#000000] file:font-label-bold file:text-xs file:cursor-pointer"
                />
              </div>

              {/* Paste text area */}
              <form onSubmit={handleCsvTextSubmit} className="flex flex-col gap-2">
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="roll_no, name, branch, gender&#10;FRESH-101, Gwen Stacy, Engineering, Female&#10;FRESH-102, Hobie Brown, Arts, Male"
                  className="w-full bg-[#131313] border border-[#00FFFF] p-2 text-xs font-mono text-[#00FFFF] outline-none placeholder:text-[#564052]"
                />
                <button
                  type="submit"
                  disabled={uploadLoading || !csvText.trim()}
                  className="bg-[#00FFFF] text-[#000000] py-2 px-4 text-xs font-label-bold uppercase border border-[#000000] hover:bg-[#39FF14] transition-all disabled:opacity-50"
                >
                  {uploadLoading ? 'PROCESSING CSV...' : 'PARSE & IMPORT CSV TEXT'}
                </button>
              </form>
            </div>

            {uploadMessage && (
              <div
                className={`mt-4 p-3 border text-xs font-label-bold ${
                  uploadMessage.type === 'success'
                    ? 'bg-[#052600] border-[#39FF14] text-[#39FF14]'
                    : 'bg-[#350505] border-[#ffb4ab] text-[#ffb4ab]'
                }`}
              >
                {uploadMessage.text}
              </div>
            )}
          </div>

          {/* Whitelist Table & Search */}
          <div className="bg-[#1c1b1b] border-2 border-[#39FF14] p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a4899d]" />
                  <input
                    type="text"
                    value={whitelistSearch}
                    onChange={(e) => setWhitelistSearch(e.target.value)}
                    placeholder="Search whitelist..."
                    className="w-full bg-[#131313] border border-[#00FFFF] pl-9 pr-3 py-1.5 text-xs text-[#00FFFF] outline-none"
                  />
                </div>
                <button
                  onClick={handleExportWhitelist}
                  className="bg-[#131313] text-[#39FF14] border border-[#39FF14] px-3 py-1.5 text-xs font-label-bold uppercase hover:bg-[#39FF14] hover:text-[#000000] transition-all flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT</span>
                </button>
                <button
                  onClick={handleClearWhitelist}
                  disabled={uploadLoading}
                  className="bg-[#131313] text-[#ffb4ab] border border-[#e61d23] px-3 py-1.5 text-xs font-label-bold uppercase hover:bg-[#e61d23] hover:text-[#ffffff] transition-all flex items-center gap-1 shrink-0"
                  title="Completely clear all whitelist entries"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>CLEAR ALL</span>
                </button>
              </div>

              {/* Quick Add Single Student */}
              <form onSubmit={handleAddSingle} className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  required
                  placeholder="Roll No"
                  value={newRoll}
                  onChange={(e) => setNewRoll(e.target.value.toUpperCase())}
                  className="w-24 bg-[#131313] border border-[#FF00FF] px-2 py-1 text-xs text-[#00FFFF] uppercase font-bold"
                />
                <input
                  type="text"
                  required
                  placeholder="Student Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-32 bg-[#131313] border border-[#FF00FF] px-2 py-1 text-xs text-[#00FFFF]"
                />
                <button
                  type="submit"
                  className="bg-[#FF00FF] text-[#000000] px-3 py-1 text-xs font-label-bold uppercase border border-[#000000] hover:bg-[#00FFFF] shrink-0"
                >
                  + ADD
                </button>
              </form>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#131313] border-b-2 border-[#39FF14] text-[#FF00FF] font-label-bold uppercase">
                    <th className="p-2.5">Roll No</th>
                    <th className="p-2.5">Student Name</th>
                    <th className="p-2.5">Branch</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#313030]">
                  {filteredWhitelist.map((item) => {
                    const isRegistered = registrations.some((r) => r.roll_no === item.roll_no);
                    return (
                      <tr key={item.roll_no} className="hover:bg-[#131313]">
                        <td className="p-2.5 font-mono text-[#00FFFF] font-bold">{item.roll_no}</td>
                        <td className="p-2.5 text-[#e5e2e1]">{item.name}</td>
                        <td className="p-2.5 text-[#dcbed4]">{item.branch}</td>
                        <td className="p-2.5">
                          {isRegistered ? (
                            <span className="bg-[#052600] text-[#39FF14] border border-[#39FF14] px-2 py-0.5 font-label-bold uppercase text-[10px]">
                              Registered
                            </span>
                          ) : (
                            <span className="bg-[#201f1f] text-[#dcbed4] px-2 py-0.5 font-label-bold uppercase text-[10px]">
                              Not Claimed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTRATIONS MANAGER */}
      {activeTab === 'registrations' && (
        <div className="bg-[#1c1b1b] border-2 border-[#FF00FF] p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a4899d]" />
              <input
                type="text"
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                placeholder="Search attendee or Pass ID..."
                className="w-full bg-[#131313] border border-[#FF00FF] pl-9 pr-3 py-1.5 text-xs text-[#00FFFF] outline-none"
              />
            </div>

            {/* Filter and Export buttons */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-label-bold">
              <button
                onClick={() => setRegFilter('all')}
                className={`px-3 py-1 uppercase border ${
                  regFilter === 'all' ? 'bg-[#FF00FF] text-black border-black' : 'bg-[#131313] text-[#e5e2e1]'
                }`}
              >
                All ({registrations.length})
              </button>
              <button
                onClick={() => setRegFilter('pending')}
                className={`px-3 py-1 uppercase border ${
                  regFilter === 'pending' ? 'bg-[#00FFFF] text-black border-black' : 'bg-[#131313] text-[#00FFFF]'
                }`}
              >
                Pending ({stats.total_pending})
              </button>
              <button
                onClick={() => setRegFilter('scanned')}
                className={`px-3 py-1 uppercase border ${
                  regFilter === 'scanned' ? 'bg-[#39FF14] text-black border-black' : 'bg-[#131313] text-[#39FF14]'
                }`}
              >
                Admitted ({stats.total_scanned})
              </button>

              <button
                onClick={handleExportRegistrations}
                className="bg-[#39FF14] hover:bg-[#00FFFF] text-[#000000] border-2 border-[#000000] px-3 py-1 uppercase font-bold shadow-[2px_2px_0px_0px_#FF00FF] hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                title="Export all registrations to CSV for Excel / Google Sheets"
              >
                <Download className="w-3.5 h-3.5" />
                <span>EXPORT REGISTRATIONS AS CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#131313] border-b-2 border-[#FF00FF] text-[#00FFFF] font-label-bold uppercase">
                  <th className="p-2.5">Pass ID</th>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">Roll No</th>
                  <th className="p-2.5">Squad</th>
                  <th className="p-2.5">Branch</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#313030]">
                {filteredRegistrations.map((reg) => (
                  <tr key={reg.roll_no} className="hover:bg-[#131313]">
                    <td className="p-2.5 font-mono text-[#FF00FF] font-bold">#{reg.qr_code_id}</td>
                    <td className="p-2.5 text-[#e5e2e1] font-medium">{reg.name}</td>
                    <td className="p-2.5 text-[#00FFFF] font-mono">{reg.roll_no}</td>
                    <td className="p-2.5 text-[#39FF14] font-bold text-[11px]">
                      {reg.squad_id ? (
                        <span className="bg-[#052600] px-2 py-0.5 border border-[#39FF14]">
                          {squads.find((s) => s.squad_id === reg.squad_id)?.squad_name || reg.squad_id}
                        </span>
                      ) : (
                        <span className="text-[#a4899d] italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-2.5 text-[#dcbed4]">{reg.branch}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 font-label-bold uppercase text-[10px] ${
                          reg.status === 'scanned'
                            ? 'bg-[#39FF14] text-[#000000] font-bold'
                            : 'bg-[#00FFFF] text-[#000000] font-bold'
                        }`}
                      >
                        {reg.status === 'scanned' ? 'ADMITTED ✅' : 'PENDING'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right space-x-2">
                      <button
                        onClick={() => onViewPass(reg.qr_code_id)}
                        className="bg-[#131313] border border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF] hover:text-[#000000] px-2 py-0.5 text-[11px] font-label-bold uppercase"
                      >
                        Pass
                      </button>
                      {reg.status === 'pending' && (
                        <button
                          onClick={() => handleDirectAdmit(reg.qr_code_id)}
                          className="bg-[#39FF14] text-[#000000] hover:bg-white px-2 py-0.5 text-[11px] font-label-bold uppercase font-bold"
                        >
                          Admit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTIONAL SENT EMAILS OUTBOX */}
      {activeTab === 'emails' && (
        <div className="bg-[#1c1b1b] border-2 border-[#39FF14] p-4">
          <div className="mb-4">
            <h3 className="font-headline-lg text-lg text-[#39FF14] uppercase flex items-center gap-2">
              <Mail className="w-5 h-5" />
              TRANSACTIONAL PASS EMAILS DISPATCH LOG
            </h3>
            <p className="text-xs text-[#dcbed4]">
              Simulated Firebase Extensions Trigger Email / SendGrid dispatcher. Every registered student receives their high-res QR pass.
            </p>
          </div>

          <div className="space-y-3">
            {emails.length === 0 ? (
              <p className="text-xs text-[#a4899d] py-6 text-center">No emails sent yet. Register a student to trigger the transactional pass email.</p>
            ) : (
              emails.map((email) => (
                <div key={email.id} className="bg-[#131313] border border-[#313030] p-3 text-xs">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[#39FF14] font-label-bold uppercase text-[10px]">DELIVERED TO:</span>
                      <div className="text-white font-mono font-bold text-sm">{email.to}</div>
                    </div>
                    <span className="bg-[#052600] text-[#39FF14] border border-[#39FF14] px-2 py-0.5 text-[10px] font-label-bold">
                      SENT • {new Date(email.sent_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-[#00FFFF] font-label-bold mb-2">{email.subject}</div>
                  <div className="flex items-center gap-4 bg-[#201f1f] p-2 border border-[#313030]">
                    {email.qr_code_data_url && (
                      <img src={email.qr_code_data_url} alt="QR Attached" className="w-12 h-12 bg-white p-0.5 shrink-0" />
                    )}
                    <div>
                      <div className="text-white font-bold">{email.name} ({email.roll_no})</div>
                      <div className="text-[#dcbed4] text-[11px]">{email.branch} • Pass #{email.qr_code_id}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CONTENT & AGENDA LIVE FIRESTORE EDITOR */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-[#1c1b1b] border-3 border-[#39FF14] p-5 shadow-[6px_6px_0px_0px_#FF00FF]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#564052] pb-4 mb-4">
              <div>
                <span className="font-label-bold text-xs text-[#39FF14] uppercase flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-[#FF00FF]" />
                  <span>FIRESTORE CONTENT MANAGEMENT SYSTEM</span>
                </span>
                <h3 className="font-headline-lg text-2xl text-[#00FFFF] uppercase tracking-wide">
                  INVITATION LETTER & 2-DAY AGENDA EDITOR
                </h3>
                <p className="text-xs text-[#dcbed4] mt-1">
                  Edit the live invitation letter and Day 1 & Day 2 agenda documents stored in Firestore. All updates publish instantly across the public site.
                </p>
              </div>

              {/* Sub-tabs for content */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setContentSubTab('letter')}
                  className={`px-3 py-1.5 text-xs font-label-bold uppercase border-2 transition-all cursor-pointer ${
                    contentSubTab === 'letter'
                      ? 'bg-[#00FFFF] text-[#000000] border-[#000000] shadow-[2px_2px_0px_0px_#FF00FF]'
                      : 'bg-[#131313] text-[#00FFFF] border-[#00FFFF]/40 hover:border-[#00FFFF]'
                  }`}
                >
                  ✉️ INVITATION LETTER
                </button>
                <button
                  type="button"
                  onClick={() => setContentSubTab('day1')}
                  className={`px-3 py-1.5 text-xs font-label-bold uppercase border-2 transition-all cursor-pointer ${
                    contentSubTab === 'day1'
                      ? 'bg-[#FF00FF] text-[#000000] border-[#000000] shadow-[2px_2px_0px_0px_#00FFFF]'
                      : 'bg-[#131313] text-[#FF00FF] border-[#FF00FF]/40 hover:border-[#FF00FF]'
                  }`}
                >
                  📅 AGENDA DAY 1
                </button>
                <button
                  type="button"
                  onClick={() => setContentSubTab('day2')}
                  className={`px-3 py-1.5 text-xs font-label-bold uppercase border-2 transition-all cursor-pointer ${
                    contentSubTab === 'day2'
                      ? 'bg-[#39FF14] text-[#000000] border-[#000000] shadow-[2px_2px_0px_0px_#FF00FF]'
                      : 'bg-[#131313] text-[#39FF14] border-[#39FF14]/40 hover:border-[#39FF14]'
                  }`}
                >
                  📅 AGENDA DAY 2
                </button>
              </div>
            </div>

            {/* Notification message */}
            {contentSaveMessage && (
              <div
                className={`mb-4 p-3 border text-xs font-label-bold flex items-center gap-2 ${
                  contentSaveMessage.type === 'success'
                    ? 'bg-[#052600] border-[#39FF14] text-[#39FF14]'
                    : 'bg-[#350505] border-[#ffb4ab] text-[#ffb4ab]'
                }`}
              >
                {contentSaveMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
                <span>{contentSaveMessage.text}</span>
              </div>
            )}

            {/* 1. INVITATION LETTER EDITOR */}
            {contentSubTab === 'letter' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveContent('invitation_letter', letterForm);
                }}
                className="space-y-4 bg-[#131313] p-4 border-2 border-[#00FFFF]"
              >
                <div className="flex items-center justify-between border-b border-[#313030] pb-2">
                  <div className="font-headline-lg text-lg text-[#00FFFF] uppercase">
                    Edit Document: <code className="text-[#39FF14]">content/invitation_letter</code>
                  </div>
                  <span className="text-[11px] text-[#a4899d]">Shown on the Landing Envelope Overlay</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-label-bold text-[#FF00FF] uppercase mb-1">
                      Letter Heading
                    </label>
                    <input
                      type="text"
                      required
                      value={letterForm.title}
                      onChange={(e) => setLetterForm({ ...letterForm, title: e.target.value })}
                      className="w-full bg-[#1c1b1b] border border-[#00FFFF] px-3 py-2 text-xs text-[#00FFFF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-label-bold text-[#FF00FF] uppercase mb-1">
                      Subtitle / Association Banner
                    </label>
                    <input
                      type="text"
                      required
                      value={letterForm.subtitle}
                      onChange={(e) => setLetterForm({ ...letterForm, subtitle: e.target.value })}
                      className="w-full bg-[#1c1b1b] border border-[#00FFFF] px-3 py-2 text-xs text-[#00FFFF] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-label-bold text-[#39FF14] uppercase mb-1">
                    Opening Greeting
                  </label>
                  <input
                    type="text"
                    required
                    value={letterForm.greeting}
                    onChange={(e) => setLetterForm({ ...letterForm, greeting: e.target.value })}
                    className="w-full bg-[#1c1b1b] border border-[#39FF14] px-3 py-2 text-xs text-[#e5e2e1] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-label-bold text-[#00FFFF] uppercase mb-1">
                    Letter Body Content (Paragraphs separated by double linebreaks)
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={Array.isArray(letterForm.body) ? letterForm.body.join('\n\n') : letterForm.body}
                    onChange={(e) => {
                      const paras = e.target.value.split('\n\n').map((p) => p.trim()).filter(Boolean);
                      setLetterForm({ ...letterForm, body: paras });
                    }}
                    placeholder="Write the warm welcome message from the seniors and faculty..."
                    className="w-full bg-[#1c1b1b] border border-[#564052] px-3 py-2 text-xs text-[#e5e2e1] outline-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-label-bold text-[#dcbed4] uppercase mb-1">
                      Signoff Closing
                    </label>
                    <input
                      type="text"
                      required
                      value={letterForm.signature_title}
                      onChange={(e) => setLetterForm({ ...letterForm, signature_title: e.target.value })}
                      className="w-full bg-[#1c1b1b] border border-[#564052] px-3 py-2 text-xs text-[#e5e2e1] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-label-bold text-[#dcbed4] uppercase mb-1">
                      Signature Names (Seniors & Faculty)
                    </label>
                    <input
                      type="text"
                      required
                      value={letterForm.signature_names}
                      onChange={(e) => setLetterForm({ ...letterForm, signature_names: e.target.value })}
                      className="w-full bg-[#1c1b1b] border border-[#564052] px-3 py-2 text-xs text-[#00FFFF] outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={contentSaveLoading}
                    className="bg-[#00FFFF] hover:bg-[#39FF14] text-[#000000] px-6 py-2.5 text-xs font-label-bold uppercase border-2 border-[#000000] shadow-[3px_3px_0px_0px_#FF00FF] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{contentSaveLoading ? 'SAVING TO FIRESTORE...' : 'PUBLISH INVITATION LETTER'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* 2. AGENDA DAY 1 EDITOR */}
            {contentSubTab === 'day1' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveContent('agenda_day1', day1Form);
                }}
                className="space-y-4 bg-[#131313] p-4 border-2 border-[#FF00FF]"
              >
                <div className="flex items-center justify-between border-b border-[#313030] pb-2">
                  <div className="font-headline-lg text-lg text-[#FF00FF] uppercase">
                    Edit Document: <code className="text-[#00FFFF]">content/agenda_day1</code>
                  </div>
                  <span className="text-[11px] text-[#a4899d]">September 1, 2026 Schedule</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-label-bold text-[#00FFFF] uppercase mb-1">
                      Theme (e.g. Y2K)
                    </label>
                    <input
                      type="text"
                      required
                      value={day1Form.theme}
                      onChange={(e) => setDay1Form({ ...day1Form, theme: e.target.value })}
                      className="w-full bg-[#1c1b1b] border border-[#00FFFF] px-3 py-2 text-xs text-[#e5e2e1] outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-label-bold text-[#39FF14] uppercase mb-1">
                      Food / Catering Provision (e.g. Snacks provided)
                    </label>
                    <input
                      type="text"
                      required
                      value={day1Form.food || (typeof day1Form.food_provided === 'string' ? day1Form.food_provided : 'Snacks provided')}
                      onChange={(e) => setDay1Form({ ...day1Form, food: e.target.value, food_provided: e.target.value })}
                      className="w-full bg-[#1c1b1b] border border-[#39FF14] px-3 py-2 text-xs text-[#39FF14] outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Schedule Items List */}
                <div className="border-t border-[#313030] pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-label-bold text-xs text-[#FF00FF] uppercase">
                      Day 1 Schedule Timeline Items ({day1Form.schedule?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextSched = [...(day1Form.schedule || []), { time: '9:00 AM', activity: 'New Activity' }];
                        setDay1Form({ ...day1Form, schedule: nextSched });
                      }}
                      className="bg-[#FF00FF] text-[#000000] px-2.5 py-1 text-[11px] font-label-bold uppercase border border-black hover:bg-[#00FFFF]"
                    >
                      + ADD TIMELINE ROW
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {day1Form.schedule?.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-[#1c1b1b] p-2 border border-[#313030]">
                        <input
                          type="text"
                          value={item.time}
                          onChange={(e) => {
                            const next = [...day1Form.schedule];
                            next[idx] = { ...next[idx], time: e.target.value };
                            setDay1Form({ ...day1Form, schedule: next });
                          }}
                          placeholder="Time (e.g. 9:00 – 9:30 AM)"
                          className="w-36 bg-[#131313] border border-[#FF00FF] p-1.5 text-xs text-[#FF00FF] font-mono"
                        />
                        <div className="flex-grow space-y-1">
                          <input
                            type="text"
                            value={item.activity || item.title || ''}
                            onChange={(e) => {
                              const next = [...day1Form.schedule];
                              next[idx] = { ...next[idx], activity: e.target.value, title: e.target.value };
                              setDay1Form({ ...day1Form, schedule: next });
                            }}
                            placeholder="Activity Details (e.g. Welcome & Speech)"
                            className="w-full bg-[#131313] border border-[#00FFFF] p-1.5 text-xs text-[#00FFFF] font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = day1Form.schedule.filter((_, i) => i !== idx);
                            setDay1Form({ ...day1Form, schedule: next });
                          }}
                          className="text-[#ffb4ab] hover:text-white p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-label-bold text-[#a4899d] uppercase mb-1">
                    Dress Code / Notes
                  </label>
                  <input
                    type="text"
                    value={day1Form.notes || ''}
                    onChange={(e) => setDay1Form({ ...day1Form, notes: e.target.value })}
                    className="w-full bg-[#1c1b1b] border border-[#564052] px-3 py-2 text-xs text-[#e5e2e1] outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={contentSaveLoading}
                    className="bg-[#FF00FF] hover:bg-[#00FFFF] text-[#000000] px-6 py-2.5 text-xs font-label-bold uppercase border-2 border-[#000000] shadow-[3px_3px_0px_0px_#00FFFF] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{contentSaveLoading ? 'SAVING TO FIRESTORE...' : 'PUBLISH DAY 1 AGENDA'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* 3. AGENDA DAY 2 EDITOR */}
            {contentSubTab === 'day2' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveContent('agenda_day2', day2Form);
                }}
                className="space-y-4 bg-[#131313] p-4 border-2 border-[#39FF14]"
              >
                <div className="flex items-center justify-between border-b border-[#313030] pb-2">
                  <div className="font-headline-lg text-lg text-[#39FF14] uppercase">
                    Edit Document: <code className="text-[#FF00FF]">content/agenda_day2</code>
                  </div>
                  <span className="text-[11px] text-[#a4899d]">September 2, 2026 Schedule</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-label-bold text-[#00FFFF] uppercase mb-1">
                      Theme (e.g. Indo-Western)
                    </label>
                    <input
                      type="text"
                      required
                      value={day2Form.theme}
                      onChange={(e) => setDay2Form({ ...day2Form, theme: e.target.value })}
                      className="w-full bg-[#1c1b1b] border border-[#00FFFF] px-3 py-2 text-xs text-[#e5e2e1] outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-label-bold text-[#39FF14] uppercase mb-1">
                      Food / Catering Provision (e.g. Lunch 2:00 – 3:00 PM)
                    </label>
                    <input
                      type="text"
                      required
                      value={day2Form.food || (typeof day2Form.food_provided === 'string' ? day2Form.food_provided : 'Lunch 2:00 – 3:00 PM')}
                      onChange={(e) => setDay2Form({ ...day2Form, food: e.target.value, food_provided: e.target.value })}
                      className="w-full bg-[#1c1b1b] border border-[#39FF14] px-3 py-2 text-xs text-[#39FF14] outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Schedule Items List */}
                <div className="border-t border-[#313030] pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-label-bold text-xs text-[#39FF14] uppercase">
                      Day 2 Schedule Timeline Items ({day2Form.schedule?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextSched = [...(day2Form.schedule || []), { time: '9:00 AM', activity: 'New Activity' }];
                        setDay2Form({ ...day2Form, schedule: nextSched });
                      }}
                      className="bg-[#39FF14] text-[#000000] px-2.5 py-1 text-[11px] font-label-bold uppercase border border-black hover:bg-[#FF00FF]"
                    >
                      + ADD TIMELINE ROW
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {day2Form.schedule?.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-[#1c1b1b] p-2 border border-[#313030]">
                        <input
                          type="text"
                          value={item.time}
                          onChange={(e) => {
                            const next = [...day2Form.schedule];
                            next[idx] = { ...next[idx], time: e.target.value };
                            setDay2Form({ ...day2Form, schedule: next });
                          }}
                          placeholder="Time (e.g. 9:00 – 9:30 AM)"
                          className="w-36 bg-[#131313] border border-[#39FF14] p-1.5 text-xs text-[#39FF14] font-mono"
                        />
                        <div className="flex-grow space-y-1">
                          <input
                            type="text"
                            value={item.activity || item.title || ''}
                            onChange={(e) => {
                              const next = [...day2Form.schedule];
                              next[idx] = { ...next[idx], activity: e.target.value, title: e.target.value };
                              setDay2Form({ ...day2Form, schedule: next });
                            }}
                            placeholder="Activity Details"
                            className="w-full bg-[#131313] border border-[#FF00FF] p-1.5 text-xs text-[#FF00FF] font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = day2Form.schedule.filter((_, i) => i !== idx);
                            setDay2Form({ ...day2Form, schedule: next });
                          }}
                          className="text-[#ffb4ab] hover:text-white p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-label-bold text-[#a4899d] uppercase mb-1">
                    Dress Code / Notes
                  </label>
                  <input
                    type="text"
                    value={day2Form.notes || ''}
                    onChange={(e) => setDay2Form({ ...day2Form, notes: e.target.value })}
                    className="w-full bg-[#1c1b1b] border border-[#564052] px-3 py-2 text-xs text-[#e5e2e1] outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={contentSaveLoading}
                    className="bg-[#39FF14] hover:bg-[#00FFFF] text-[#000000] px-6 py-2.5 text-xs font-label-bold uppercase border-2 border-[#000000] shadow-[3px_3px_0px_0px_#FF00FF] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{contentSaveLoading ? 'SAVING TO FIRESTORE...' : 'PUBLISH DAY 2 AGENDA'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ACCESS CONTROL & ONE-TIME SETUP GUIDE */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-[#1c1b1b] border-2 border-[#ffd7f5] p-5">
            <div className="flex items-center gap-3 border-b-2 border-[#39FF14] pb-3 mb-4">
              <ShieldCheck className="w-7 h-7 text-[#39FF14]" />
              <div>
                <span className="text-[10px] font-label-bold text-[#39FF14] uppercase tracking-widest block">
                  SECURITY & RBAC ARCHITECTURE
                </span>
                <h3 className="font-headline-lg text-xl text-[#00FFFF] uppercase">
                  Designated Single Admin Access Model
                </h3>
              </div>
            </div>

            <div className="space-y-4 text-xs text-[#e5e2e1]">
              <div className="p-3 bg-[#131313] border-l-4 border-[#39FF14]">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[#39FF14] mb-1">
                    1. Strict Custom Claim Policy ({'{ admin: true }'})
                  </p>
                  {adminConfig.has_custom_email && (
                    <span className="bg-[#39FF14]/20 text-[#39FF14] px-2 py-0.5 text-[10px] font-mono border border-[#39FF14]/40">
                      CUSTOM ENV SET
                    </span>
                  )}
                </div>
                <p className="text-[#a4899d]">
                  Active designated admin account: <strong className="text-[#39FF14] font-mono">{adminConfig.admin_email}</strong>. Only this account receives <code className="text-[#39FF14] font-mono">admin: true</code> authority.
                </p>
              </div>

              <div className="p-4 bg-[#0A0B10] border border-[#00FFFF]">
                <div className="flex items-center gap-2 text-[#00FFFF] font-bold text-sm mb-2">
                  <Terminal className="w-4 h-4" />
                  <span>Zero-Config Environment Setup:</span>
                </div>
                <p className="text-[#dcbed4] mb-2">
                  You do not need to manually upload a JSON file. Simply set these secrets in <strong>Settings &gt; Secrets</strong>:
                </p>
                <div className="bg-[#131313] p-3 text-[#00FFFF] font-mono text-xs border border-[#313030] space-y-1 select-all">
                  <div>ADMIN_EMAIL = {adminConfig.admin_email}</div>
                  <div>ADMIN_PASSWORD = [your chosen secret password]</div>
                </div>
                <p className="mt-2 text-[11px] text-[#39FF14]">
                  ✓ The server automatically recognizes this account and grants the <code className="bg-[#131313] px-1 py-0.5 border border-[#39FF14]/30">{'{ admin: true }'}</code> claim upon login.
                </p>
              </div>

              <div className="p-4 bg-[#131313] border border-[#FF00FF]">
                <div className="text-[#FF00FF] font-bold text-sm mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  <span>Optional: Live Firebase Console Key (Only if Syncing Firebase Auth):</span>
                </div>
                <p className="text-[#dcbed4] mb-2">
                  If you want to sync custom claims directly into the Google Cloud Firebase Auth user directory:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[#a4899d]">
                  <li>Open <strong className="text-white">Firebase Console</strong> (console.firebase.google.com)</li>
                  <li>Click <strong className="text-white">Project Settings</strong> (gear icon next to Project Overview)</li>
                  <li>Click the <strong className="text-white">Service accounts</strong> tab</li>
                  <li>Click <strong className="text-[#39FF14]">Generate new private key</strong>, then click <strong className="text-white">Generate key</strong> in the popup to download the JSON file</li>
                </ol>
              </div>

              <div className="p-4 bg-[#131313] border border-[#313030]">
                <div className="text-white font-bold text-sm mb-2">
                  Active Firestore Security Rules:
                </div>
                <pre className="bg-[#0A0B10] p-3 text-[11px] font-mono text-[#00FFFF] border border-[#313030] overflow-x-auto">
{`// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    
    match /whitelist/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /registrations/{id} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if isAdmin();
    }

    match /squads/{squadId} {
      allow read: if true;
      allow write: if isAdmin();
      
      match /messages/{messageId} {
        allow read, create: if true; // or attendee squad membership check
      }
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
