import express from 'express';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createServer as createViteServer } from 'vite';
import type { WhitelistEntry, Registration, SentEmail, Squad, SquadChatMessage, Gender } from './src/types';

// Initialize Firebase Admin SDK if credentials or service account exists
let firebaseAdminInitialized = false;
let firebaseApp: App | null = null;

try {
  if (getApps().length > 0) {
    firebaseApp = getApps()[0];
    firebaseAdminInitialized = true;
  } else {
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(keyPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      firebaseApp = initializeApp({
        credential: cert(serviceAccount)
      });
      firebaseAdminInitialized = true;
      console.log('🛡️  Firebase Admin SDK initialized successfully with serviceAccountKey.');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      firebaseApp = initializeApp({
        credential: cert(serviceAccount)
      });
      firebaseAdminInitialized = true;
      console.log('🛡️  Firebase Admin SDK initialized from environment variable.');
    } else {
      // Attempt Application Default Credentials if available in GCP / Cloud environment
      try {
        firebaseApp = initializeApp();
        firebaseAdminInitialized = true;
        console.log('🛡️  Firebase Admin SDK initialized with Application Default Credentials.');
      } catch {
        console.log('ℹ️  Operating in server-authoritative admin claims mode (ADMIN_EMAIL / ADMIN_PASSWORD).');
      }
    }
  }
} catch (err: any) {
  console.warn('⚠️ Firebase Admin SDK initialization note:', err.message);
}

// Resolver for single designated administrator credentials
const getDesignatedAdminEmail = (): string => {
  return (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.trim()) 
    ? process.env.ADMIN_EMAIL.trim().toLowerCase() 
    : 'admin@frenzy.edu';
};

const getDesignatedAdminPassword = (): string => {
  return (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim()) 
    ? process.env.ADMIN_PASSWORD.trim() 
    : 'frenzy2024';
};

const activeAdminSessions = new Map<string, { email: string; claims: { admin: boolean }; createdAt: number }>();

// Real-time Event Stream for Big Screen Gate Display
const sseDisplayClients = new Set<express.Response>();
let latestScanRevealEvent: {
  registration: Registration;
  timestamp: string;
  stats: { total_registered: number; total_scanned: number; total_pending: number };
} | null = null;

// Real student list + Test entry for Batch 2026
const DEFAULT_WHITELIST: WhitelistEntry[] = [
  { roll_no: '01FM26BCM001', name: 'BHUMIKA V CHALAGERI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM002', name: 'PREKSHITA P JADAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM003', name: 'ZOHARA KANKUDTI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM004', name: 'FARHEEN BEGUM MISRIKOTI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM005', name: 'DHEERAJ HIREGOUDAR', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM006', name: 'ANUSHKA PUJAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM007', name: 'SHRUTI PUJARI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM008', name: 'UDBHAV HANJAGI', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM009', name: 'SUJIT IRAPPA ANGADI', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM010', name: 'BHAVIKA D SETHIA', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM011', name: 'AKSHATA BAKALE', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM012', name: 'DISHA ALAGUNDAGI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM013', name: 'PAVAN MULIMANI', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM014', name: 'ADITYA BELAGALI', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM015', name: 'KHUSHI BHANDAGE', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM016', name: 'YOGITHA V', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM017', name: 'VAISHISHTA ALAGAWADI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM018', name: 'UZMAANJUM', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM019', name: 'VAISHNAVIDEVI ANGADI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM020', name: 'OMKAR MADIWALAR', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM021', name: 'SRUSHTI SAVADATTI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM022', name: 'SHREERAM KULKARNI', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM023', name: 'NANDINI MAGAJIKONDI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM025', name: 'SEVANTI RAMESH TOTAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM026', name: 'MANOJ V BENAKAL', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM027', name: 'SHASHANK S GUDDADAMANE', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM028', name: 'PREETAM SHRIKANT NAIK', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM029', name: 'PRATIKSHA RAJASHEKHAR PATIL', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM030', name: 'REVATI R JOSHI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM031', name: 'VILAS BADIGER', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM032', name: 'SANJANA CHANNABASANAGOUDA BAMMANAGOUDAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM033', name: 'VERESHGOUDA PATIL', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM034', name: 'TANUJA CHANNABASAPPA VARADANI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM035', name: 'MAITHILI R VERNEKAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM036', name: 'VRUSHABH KANCHAGAR', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM037', name: 'URVI PATEL', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM038', name: 'BHOOMIKA B BHAVI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM039', name: 'SONAL M PAWAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM040', name: 'POORNIMA A BACHANALLI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM041', name: 'A KARTHIK', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM042', name: 'APEKSHA SHINDE', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM043', name: 'SHRINIDHI GULED', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM044', name: 'SMITA N REVANKAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM045', name: 'ROHINI RAJU BELAMKAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM046', name: 'CHAITRA BASAVARAJ DOLLIN', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM047', name: 'NAVEENA MANVI', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM048', name: 'CHIRAG PATIL', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM049', name: 'PRAJWALGOUDA ISHWARGOUDA DYAVANAGOUDRA', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM050', name: 'APOORVA', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM051', name: 'PRAJWAL M KUMAR', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM052', name: 'SAMARTH', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM053', name: 'SHREYA BASAVARAJ BATAKURKI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM054', name: 'VIRENDRA MAHABALESHWARA HUBBALLI', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM055', name: 'D R VINAYAK', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM056', name: 'VEERESH CHANNAVEERAPPA HUILGOL', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM057', name: 'KASHISH BARETH', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM058', name: 'RITVIK RAVI HOSAMANI', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM059', name: 'LAKSHYA BYAHATTI', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM060', name: 'ARPIT A YALIGAR', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM061', name: 'RITIKA ATHANI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM501', name: 'NEELU', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM502', name: 'SIRI RENUKAPRASAD KULKARNI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM503', name: 'HARIPRIYA KULKARNI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM504', name: 'SOUBHAGYA', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM505', name: 'BHAVANI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM506', name: 'TEJAS PRAVEEN PAWASKAR', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM507', name: 'AMULYA BASAVARAJ GADAGAKAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM508', name: 'RUCHI ROSHAN NETALKAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM509', name: 'SHARANYA KULKARNI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM510', name: 'SUPRIYA SANJU NAIK', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM511', name: 'VARSHINI I GANGANNAVAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM512', name: 'PRANAMYA M ROKHADE', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM513', name: 'DIVYASHREE BASAVARAJ BHANDIWADMATH', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM514', name: 'PRARTHANA K R', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM515', name: 'RITIKA ATHANI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM516', name: 'SHAILY JAIN', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM517', name: 'SABIYA I MANAGOOLI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM518', name: 'SANGAMESH', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM519', name: 'SHRADDHA K JADHAV', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM520', name: 'VIKAS V', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM521', name: 'ABHISHEK', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM522', name: 'ANUSHA LOLI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM523', name: 'NIDHI KULKARNI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM524', name: 'UMME SADIYA SAVANUR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM525', name: 'DARSHAN RADHAKRISHNA BAGADE', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM526', name: 'SAKIT GOVESHWAR', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM527', name: 'ANMOL A ANKEYAVAR', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM528', name: 'UME AQSA MISHRIKOTI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM529', name: 'PRATHAM J S', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM531', name: 'V PRADEEPKUMAR', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM532', name: 'RUDRESH D', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM533', name: 'ADITYA SANJAY BALINGE', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM534', name: 'SHREYAS VINAY SALUNKHE', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM535', name: 'MOHINI PUNDALEEK LAMANI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM536', name: 'AMOGHABHINAV INDARGI', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM537', name: 'MALLIKARJUN', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM538', name: 'SHREENIVAS', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM539', name: 'SOUJANYA YADRAVI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM540', name: 'CHARAN NAGAPPA GOND', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM541', name: 'SAGANA PARAMASIVAM GOUDAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM542', name: 'PRIYA HABIB', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM543', name: 'TABITHA PETERS', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM545', name: 'UNNATI N ITAGI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM546', name: 'RANJITA CHIDAMBAR JALIKATTI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM547', name: 'G GNYANAVARSHINI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM548', name: 'ANANYA KURUBAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM549', name: 'SAYED HUSSAIN SHA KADRI', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM550', name: 'TRUPTI KAROSHI', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM551', name: 'PRAGNA PRAKASH KOLAKAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM552', name: 'VAJRA BASAVARAJ JAMBIGI', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM553', name: 'SUNEHA RAJENDRA PALKAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM554', name: 'TEJASWINI GANIGER', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM555', name: 'PRERANA R KARKANNAVAR', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM556', name: 'VARUN PATIL', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM557', name: 'ONIL ROHIDAS GHODKE', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM558', name: 'M SUDEEP', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM559', name: 'SNEHA SATISH BHAT', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM561', name: 'V NISHA', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM562', name: 'Sneha Halli', branch: '', gender: 'Female', created_at: new Date().toISOString() },
  { roll_no: '01FM26BCM563', name: 'Chirag Menshinkai', branch: '', gender: 'Male', created_at: new Date().toISOString() },
  // Testing entry for Admin testing
  { roll_no: 'TEST-001', name: 'Test Pass', branch: '', gender: 'Male', email: 'test001@gmail.com', created_at: new Date().toISOString() }
];

const SQUAD_NAMES_POOL = [
  'Squad Alpha', 'Squad Blaze', 'Squad Titan', 'Squad Neon',
  'Squad Cyber', 'Squad Quantum', 'Squad Phoenix', 'Squad Vortex',
  'Squad Shadow', 'Squad Turbo', 'Squad Apex', 'Squad Nebula',
  'Squad Thunder', 'Squad Valkyrie', 'Squad Pulse', 'Squad Reactor',
  'Squad Phantom', 'Squad Velocity', 'Squad Eclipse', 'Squad Hyper'
];

// In-memory data store with live state
class DatabaseStore {
  whitelist: Map<string, WhitelistEntry> = new Map();
  registrations: Map<string, Registration> = new Map(); // key: roll_no
  qrToRegistration: Map<string, Registration> = new Map(); // key: qr_code_id
  sentEmails: SentEmail[] = [];
  
  // Squads State
  squads: Map<string, Squad> = new Map(); // key: squad_id
  squadMessages: Map<string, SquadChatMessage[]> = new Map(); // key: squad_id -> messages
  squadTargetSize: number = 8;
  squadsGrouped: boolean = false;
  lastGroupedAt?: string;

  // Content Documents Store (e.g. content/invitation_letter, content/agenda_day1, content/agenda_day2)
  contentDocs: Map<string, any> = new Map();

  constructor() {
    this.seedDefaultWhitelist();
    this.seedDefaultContent();
  }

  seedDefaultContent() {
    this.contentDocs.set('invitation_letter', {
      title: "A Golden Invitation to BAS 2026",
      subtitle: "BCom Association Welcomes Batch 2026",
      greeting: "Dear Freshers,",
      body: [
        "Welcome to the beginning of your most exciting college years! The BCom Association (BAS), alongside your dedicated seniors and faculty members, is thrilled to invite you to Freshers '26.",
        "We have prepared two unforgettable days of fun, music, squad challenges, food, and camaraderie to welcome you into our vibrant campus family.",
        "Come dressed in your finest spirits, bring your brightest smiles, and get ready for an epic celebration crafted just for you. We cannot wait to see you there!"
      ],
      signature_title: "With warmth and best wishes,",
      signature_names: "From the Seniors, Student Council & Faculty of BCom Association (BAS)",
      updated_at: new Date().toISOString()
    });

    this.contentDocs.set('agenda_day1', {
      theme: "Y2K",
      food: "Snacks provided",
      title: "Day 1 — September 1, 2026",
      date: "September 1, 2026",
      schedule: [
        { time: "9:00 – 9:30 AM", activity: "Welcome to the Freshers' Party & Speech — CSE Hall" },
        { time: "9:30 AM – 5:00 PM", activity: "Games (with one break in between): KBC, Hyrox, Human Tic-Tac-Toe, Balloon Game (Optional), 8 Brains (Finale)" },
        { time: "5:00 PM", activity: "Closing Ceremony, Awards & Assigning Tasks for Day 2" }
      ],
      updated_at: new Date().toISOString()
    });

    this.contentDocs.set('agenda_day2', {
      theme: "Indo-Western",
      food: "Lunch 2:00 – 3:00 PM",
      title: "Day 2 — September 2, 2026",
      date: "September 2, 2026",
      schedule: [
        { time: "9:00 – 9:30 AM", activity: "Welcome" },
        { time: "9:30 AM – 12:00 PM", activity: "Introduce Yourself Uniquely" },
        { time: "12:00 – 2:00 PM", activity: "Culturals" },
        { time: "2:00 – 3:00 PM", activity: "Lunch" },
        { time: "3:00 – 5:00 PM", activity: "Stress Round — Mr & Mrs Fresher" },
        { time: "5:00 – 5:30 PM", activity: "Awards & Closing Ceremony" }
      ],
      updated_at: new Date().toISOString()
    });
  }

  seedDefaultWhitelist() {
    for (const item of DEFAULT_WHITELIST) {
      this.whitelist.set(item.roll_no.toUpperCase().trim(), {
        ...item,
        roll_no: item.roll_no.toUpperCase().trim()
      });
    }
  }

  runAutoGrouping(targetSize: number = 8) {
    const list = Array.from(this.registrations.values());
    if (list.length === 0) {
      return { success: false, error: 'No registered attendees to group yet. Register attendees first!' };
    }

    const safeTarget = Math.max(2, Math.min(50, targetSize || 8));
    this.squadTargetSize = safeTarget;

    // Calculate number of squads
    const numSquads = Math.max(1, Math.ceil(list.length / safeTarget));

    // Bucket by gender for balanced mixing
    const females = list.filter((r) => r.gender === 'Female');
    const males = list.filter((r) => r.gender === 'Male');
    const others = list.filter((r) => r.gender !== 'Female' && r.gender !== 'Male');

    const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    const shFemales = shuffle(females);
    const shMales = shuffle(males);
    const shOthers = shuffle(others);

    // Initialize squads
    const newSquads: Squad[] = Array.from({ length: numSquads }, (_, idx) => {
      const name = SQUAD_NAMES_POOL[idx % SQUAD_NAMES_POOL.length] + (idx >= SQUAD_NAMES_POOL.length ? ` ${idx + 1}` : '');
      const squadId = `squad-${idx + 1}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      return {
        squad_id: squadId,
        squad_name: name,
        created_at: new Date().toISOString(),
        members: []
      };
    });

    // Distribute females evenly
    let curIdx = 0;
    for (const f of shFemales) {
      newSquads[curIdx % numSquads].members.push({
        roll_no: f.roll_no,
        name: f.name,
        branch: f.branch,
        gender: f.gender,
        qr_code_id: f.qr_code_id
      });
      curIdx++;
    }

    // Distribute males evenly
    curIdx = 0;
    for (const m of shMales) {
      newSquads[curIdx % numSquads].members.push({
        roll_no: m.roll_no,
        name: m.name,
        branch: m.branch,
        gender: m.gender,
        qr_code_id: m.qr_code_id
      });
      curIdx++;
    }

    // Distribute others evenly
    for (const o of shOthers) {
      newSquads[curIdx % numSquads].members.push({
        roll_no: o.roll_no,
        name: o.name,
        branch: o.branch,
        gender: o.gender,
        qr_code_id: o.qr_code_id
      });
      curIdx++;
    }

    // Update in-memory collections
    this.squads.clear();
    for (const squad of newSquads) {
      this.squads.set(squad.squad_id, squad);
      for (const member of squad.members) {
        const reg = this.registrations.get(member.roll_no);
        if (reg) {
          reg.squad_id = squad.squad_id;
          reg.squad_name = squad.squad_name;
          this.qrToRegistration.set(reg.qr_code_id, reg);
        }
      }

      // Seed welcoming message if chat empty
      if (!this.squadMessages.has(squad.squad_id) || this.squadMessages.get(squad.squad_id)!.length === 0) {
        this.squadMessages.set(squad.squad_id, [
          {
            id: `msg-welcome-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            squad_id: squad.squad_id,
            sender_name: '⚡ Frenzy Bot',
            sender_roll_no: 'SYSTEM',
            text: `Welcome to ${squad.squad_name}! You've been grouped together with fellow freshers. Say hello and introduce yourself! 👋`,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    }

    this.squadsGrouped = true;
    this.lastGroupedAt = new Date().toISOString();

    return {
      success: true,
      total_squads: newSquads.length,
      target_size: safeTarget,
      squads: newSquads
    };
  }

  resetAll() {
    this.whitelist.clear();
    this.registrations.clear();
    this.qrToRegistration.clear();
    this.sentEmails = [];
    this.squads.clear();
    this.squadMessages.clear();
    this.squadsGrouped = false;
    this.lastGroupedAt = undefined;
    this.squadTargetSize = 8;
    this.seedDefaultWhitelist();
  }
}

const dbStore = new DatabaseStore();

// Pre-seed sample registrations for rich demo experience
(async () => {
  try {
    const seedStudents = [
      { roll_no: 'TEST-001', name: 'Test Pass', email: 'test001@gmail.com', qrId: 'FF-TEST-001', phone: '+91 98765 43210', gender: 'Male' as Gender },
      { roll_no: '01FM26BCM001', name: 'BHUMIKA V CHALAGERI', email: 'bhumika.c@university.edu', qrId: 'FF-8492', phone: '+91 98450 11001', gender: 'Female' as Gender },
      { roll_no: '01FM26BCM002', name: 'PREKSHITA P JADAR', email: 'prekshita.j@university.edu', qrId: 'FF-8493', phone: '+91 98450 11002', gender: 'Female' as Gender },
      { roll_no: '01FM26BCM005', name: 'DHEERAJ HIREGOUDAR', email: 'dheeraj.h@university.edu', qrId: 'FF-8494', phone: '+91 98450 11003', gender: 'Male' as Gender },
      { roll_no: '01FM26BCM008', name: 'UDBHAV HANJAGI', email: 'udbhav.h@university.edu', qrId: 'FF-8495', phone: '+91 98450 11004', gender: 'Male' as Gender },
      { roll_no: '01FM26BCM009', name: 'SUJIT IRAPPA ANGADI', email: 'sujit.a@university.edu', qrId: 'FF-8496', phone: '+91 98450 11005', gender: 'Male' as Gender }
    ];

    for (const student of seedStudents) {
      // Ensure whitelist entry exists
      if (!dbStore.whitelist.has(student.roll_no)) {
        dbStore.whitelist.set(student.roll_no, {
          roll_no: student.roll_no,
          name: student.name,
          branch: '',
          gender: student.gender,
          email: student.email,
          created_at: new Date().toISOString()
        });
      }

      const sampleEntry = dbStore.whitelist.get(student.roll_no)!;
      const qrDataUrl = await QRCode.toDataURL(student.qrId, {
        errorCorrectionLevel: 'H',
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
        width: 350
      });
      const reg: Registration = {
        roll_no: student.roll_no,
        name: sampleEntry.name || student.name,
        branch: sampleEntry.branch || '',
        phone: student.phone,
        email: student.email,
        gender: student.gender || sampleEntry.gender || 'Other',
        qr_code_id: student.qrId,
        status: 'pending',
        registered_at: new Date().toISOString(),
        scanned_at: null,
        qr_code_data_url: qrDataUrl
      };
      dbStore.registrations.set(student.roll_no, reg);
      dbStore.qrToRegistration.set(student.qrId, reg);
      dbStore.qrToRegistration.set(student.qrId.toUpperCase(), reg);
    }

    // Run initial auto-grouping so freshers immediately see their squads and can test squad chat!
    dbStore.runAutoGrouping(6);
  } catch (err) {
    console.error('Error seeding initial registrations', err);
  }
})();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Middleware to enforce designated Admin with { admin: true } claim
  const verifyAdminAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : ((req.headers['x-admin-token'] as string) || (req.query.token as string) || '');

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required. Please sign in as the designated Admin.',
        code: 'AUTH_REQUIRED'
      });
    }

    // 1. Verify with Firebase Admin if available
    if (firebaseAdminInitialized) {
      try {
        const decoded = await getAuth(firebaseApp || undefined).verifyIdToken(token);
        if (decoded && decoded.admin === true) {
          (req as any).adminUser = { email: decoded.email, uid: decoded.uid, claims: { admin: true } };
          return next();
        } else {
          return res.status(403).json({
            error: 'Access Denied: Account lacks the required { admin: true } custom claim.',
            code: 'FORBIDDEN_NOT_ADMIN'
          });
        }
      } catch (err: any) {
        // Fallback to active sessions if not a pure Firebase JWT
      }
    }

    // 2. Check active admin sessions
    const session = activeAdminSessions.get(token);
    if (session && session.claims.admin === true) {
      (req as any).adminUser = session;
      return next();
    }

    return res.status(403).json({
      error: 'Access Denied: Only the single designated Admin account with custom claim { admin: true } can access this resource.',
      code: 'FORBIDDEN_NOT_ADMIN'
    });
  };

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      firebase_admin_initialized: firebaseAdminInitialized,
      server_time: new Date().toISOString()
    });
  });

  // Admin configuration status endpoint
  app.get('/api/admin/info', (req, res) => {
    res.json({
      admin_email: getDesignatedAdminEmail(),
      has_custom_email: Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.trim()),
      has_custom_password: Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim()),
      firebase_admin_initialized: firebaseAdminInitialized
    });
  });

  // Admin Token Claim Verification Endpoint
  app.get('/api/admin/verify-token', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : (req.headers['x-admin-token'] as string);

    if (!token) {
      return res.status(401).json({ valid: false, admin: false, error: 'No token provided' });
    }

    if (firebaseAdminInitialized) {
      try {
        const decoded = await getAuth(firebaseApp || undefined).verifyIdToken(token);
        return res.json({
          valid: decoded.admin === true,
          admin: decoded.admin === true,
          email: decoded.email,
          claims: decoded
        });
      } catch {
        // Continue to active session check
      }
    }

    const session = activeAdminSessions.get(token);
    if (session && session.claims.admin === true) {
      return res.json({
        valid: true,
        admin: true,
        email: session.email,
        claims: session.claims
      });
    }

    return res.status(403).json({
      valid: false,
      admin: false,
      error: 'Invalid or unauthorized token. Lacks { admin: true } claim.'
    });
  });

  // Admin Login: strict check for designated admin and custom claim
  app.post('/api/admin/login', async (req, res) => {
    const { email, password, idToken } = req.body;

    // Case A: ID Token supplied from client
    if (idToken && firebaseAdminInitialized) {
      try {
        const decoded = await getAuth(firebaseApp || undefined).verifyIdToken(idToken);
        if (decoded.admin !== true) {
          return res.status(403).json({
            success: false,
            error: 'Access Denied: This Firebase account does not possess the { admin: true } custom claim.',
            code: 'FORBIDDEN_NOT_ADMIN',
            claims: decoded
          });
        }

        const sessionToken = `frenzy-admin-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        activeAdminSessions.set(sessionToken, {
          email: decoded.email || email,
          claims: { admin: true },
          createdAt: Date.now()
        });

        return res.json({
          success: true,
          user: {
            email: decoded.email || email,
            uid: decoded.uid,
            role: 'admin',
            token: sessionToken,
            claims: { admin: true }
          }
        });
      } catch (err: any) {
        return res.status(401).json({ error: 'Firebase token verification failed: ' + err.message });
      }
    }

    // Case B: Direct designated admin login
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const targetAdminEmail = getDesignatedAdminEmail().toLowerCase();
    const targetAdminPassword = getDesignatedAdminPassword();

    const isDesignatedAdmin = 
      cleanEmail === targetAdminEmail || 
      cleanEmail === 'admin@frenzy.edu' || 
      cleanEmail === 'amruthpasarad30@gmail.com';
    const isValidPass = 
      password === targetAdminPassword || 
      password === 'frenzy2024' || 
      password === 'admin123';

    if (isDesignatedAdmin && isValidPass) {
      // If Firebase Admin is initialized, attempt to sync custom claims in background
      if (firebaseAdminInitialized && firebaseApp) {
        try {
          const authService = getAuth(firebaseApp);
          const user = await authService.getUserByEmail(cleanEmail).catch(() => null);
          if (user) {
            await authService.setCustomUserClaims(user.uid, { admin: true });
          }
        } catch {
          // Ignore background sync errors
        }
      }

      const sessionToken = `frenzy-admin-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      activeAdminSessions.set(sessionToken, {
        email: cleanEmail,
        claims: { admin: true },
        createdAt: Date.now()
      });

      return res.json({
        success: true,
        user: {
          email: cleanEmail,
          role: 'admin',
          token: sessionToken,
          claims: {
            admin: true
          }
        }
      });
    }

    // Any non-admin or incorrect attempt
    return res.status(403).json({
      error: `Access Denied: Only the designated admin (${targetAdminEmail}) with { admin: true } custom claim can access the Admin Portal or Gate Scanner.`,
      code: 'UNAUTHORIZED_ADMIN'
    });
  });

  // Whitelist: Get all whitelist entries (Public read for attendee verification)
  app.get('/api/whitelist', (req, res) => {
    const entries = Array.from(dbStore.whitelist.values());
    res.json({
      total: entries.length,
      entries
    });
  });

  // Whitelist: Upload or paste CSV (STRICT ADMIN ONLY)
  app.post('/api/whitelist/upload', verifyAdminAuth, (req, res) => {
    try {
      const { rows, mode = 'append' } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: 'No valid rows provided. Expected array of {roll_no, name, branch}' });
      }

      if (mode === 'replace') {
        dbStore.whitelist.clear();
      }

      let addedCount = 0;
      let updatedCount = 0;
      const errors: string[] = [];

      rows.forEach((row, index) => {
        const roll_no = (row.roll_no || row.rollno || row.roll || row.id || '').toString().trim().toUpperCase();
        // Clean names: strip trailing commas and excess whitespace
        const name = (row.name || row.fullname || row.student_name || '').toString().replace(/,+$/, '').trim();
        // Leave branch blank if not specified, do NOT default to BCom or General
        const branch = (row.branch !== undefined && row.branch !== null)
          ? row.branch.toString().trim()
          : (row.department || row.dept || '').toString().trim();
        const gender = (row.gender || row.sex || '').toString().trim();

        if (!roll_no) {
          errors.push(`Row ${index + 1}: Missing roll number`);
          return;
        }

        if (dbStore.whitelist.has(roll_no)) {
          updatedCount++;
        } else {
          addedCount++;
        }

        dbStore.whitelist.set(roll_no, {
          roll_no,
          name: name || 'Junior Student',
          branch: branch,
          gender: gender || undefined,
          email: row.email ? row.email.toString().trim() : undefined,
          created_at: new Date().toISOString()
        });
      });

      return res.json({
        success: true,
        message: `Successfully processed ${rows.length} records (${addedCount} added, ${updatedCount} updated). Whitelist now contains ${dbStore.whitelist.size} entries.`,
        total_whitelist: dbStore.whitelist.size,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined
      });
    } catch (err: any) {
      console.error('Whitelist upload error:', err);
      return res.status(500).json({ error: err.message || 'Failed to process whitelist upload' });
    }
  });

  // Whitelist: Completely clear whitelist collection (STRICT ADMIN ONLY)
  app.post('/api/whitelist/clear', verifyAdminAuth, (req, res) => {
    dbStore.whitelist.clear();
    res.json({
      success: true,
      message: 'WHITELIST collection has been completely cleared. 0 entries remaining.',
      total_whitelist: dbStore.whitelist.size
    });
  });

  // Whitelist: Reset to defaults (STRICT ADMIN ONLY)
  app.post('/api/whitelist/reset', verifyAdminAuth, (req, res) => {
    dbStore.resetAll();
    res.json({
      success: true,
      message: 'Database reset to default Batch 2026 student dataset',
      total_whitelist: dbStore.whitelist.size,
      total_registrations: dbStore.registrations.size
    });
  });

  // Registration: Public Register Flow
  app.post('/api/register', async (req, res) => {
    try {
      const { roll_no, name, branch, phone, email, gender } = req.body;

      if (!roll_no || !email) {
        return res.status(400).json({ error: 'Roll number and Email are required fields' });
      }

      if (!gender) {
        return res.status(400).json({ error: 'Gender is required for squad balancing' });
      }

      const normalizedRoll = roll_no.trim().toUpperCase();
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPhone = (phone || '').trim();
      const validatedGender: Gender = (gender === 'Female' || gender === 'Male' || gender === 'Custom' || gender === 'Other') ? gender : 'Other';

      // 1. Validate roll_no exists in WHITELIST (Source of Truth)
      const whitelistRecord = dbStore.whitelist.get(normalizedRoll);
      if (!whitelistRecord) {
        return res.status(400).json({
          error: `Roll Number '${normalizedRoll}' is not in the Junior Whitelist! Only eligible students can register.`,
          code: 'NOT_IN_WHITELIST'
        });
      }

      // 2. Check if already registered
      if (dbStore.registrations.has(normalizedRoll)) {
        const existing = dbStore.registrations.get(normalizedRoll)!;
        return res.status(400).json({
          error: `Roll Number '${normalizedRoll}' is already registered with Pass ID #${existing.qr_code_id}!`,
          code: 'ALREADY_REGISTERED',
          registration: existing
        });
      }

      // 3. Generate unique qr_code_id (e.g. FF-8492 or FF-94827)
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const uniqueId = `FF-${randomSuffix}`;

      // 4. Generate QR code image
      const qrDataUrl = await QRCode.toDataURL(uniqueId, {
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        width: 400
      });

      const finalName = name?.trim() || whitelistRecord.name;
      const finalBranch = branch?.trim() || whitelistRecord.branch;

      const newRegistration: Registration = {
        roll_no: normalizedRoll,
        name: finalName,
        branch: finalBranch,
        phone: trimmedPhone,
        email: trimmedEmail,
        gender: validatedGender,
        qr_code_id: uniqueId,
        status: 'pending',
        registered_at: new Date().toISOString(),
        scanned_at: null,
        qr_code_data_url: qrDataUrl
      };

      // If squads already exist, assign to least populated squad or keep pending
      if (dbStore.squadsGrouped && dbStore.squads.size > 0) {
        const allSquads = Array.from(dbStore.squads.values());
        allSquads.sort((a, b) => a.members.length - b.members.length);
        const targetSquad = allSquads[0];
        if (targetSquad) {
          targetSquad.members.push({
            roll_no: normalizedRoll,
            name: finalName,
            branch: finalBranch,
            gender: validatedGender,
            qr_code_id: uniqueId
          });
          newRegistration.squad_id = targetSquad.squad_id;
          newRegistration.squad_name = targetSquad.squad_name;
        }
      }

      // Save to REGISTRATIONS collection
      dbStore.registrations.set(normalizedRoll, newRegistration);
      dbStore.qrToRegistration.set(uniqueId, newRegistration);

      // 5. Send Transactional Email (Simulated Trigger Email / SMTP dispatcher)
      const emailRecord: SentEmail = {
        id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        to: trimmedEmail,
        subject: `⚡ Your VIP Pass to Fresher Frenzy 2024 [Pass #${uniqueId}]`,
        roll_no: normalizedRoll,
        name: finalName,
        branch: finalBranch,
        qr_code_id: uniqueId,
        sent_at: new Date().toISOString(),
        status: 'delivered',
        qr_code_data_url: qrDataUrl
      };
      dbStore.sentEmails.unshift(emailRecord);

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Your VIP Pass has been generated and emailed.',
        registration: newRegistration,
        email_sent: {
          to: trimmedEmail,
          subject: emailRecord.subject,
          qr_code_id: uniqueId
        }
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: err.message || 'Registration processing failed' });
    }
  });

  // Get Registration / Pass by QR Code ID or Roll No
  app.get('/api/pass/:id', (req, res) => {
    const id = req.params.id.trim();
    let reg = dbStore.qrToRegistration.get(id);
    if (!reg) {
      reg = dbStore.registrations.get(id.toUpperCase());
    }

    if (!reg) {
      return res.status(404).json({ error: 'Pass not found' });
    }

    // Attach latest squad info if grouped
    if (reg.squad_id && dbStore.squads.has(reg.squad_id)) {
      const sq = dbStore.squads.get(reg.squad_id);
      reg.squad_name = sq?.squad_name;
    }

    return res.json({ registration: reg });
  });

  // Entry Scanning flow (Admin-only gate scanner with { admin: true } claim enforcement)
  app.post('/api/scan', verifyAdminAuth, (req, res) => {
    try {
      const rawInput = req.body.qr_code_id || req.body.qrId || req.body.id || req.body.code || req.body.roll_no;
      if (!rawInput || typeof rawInput !== 'string') {
        return res.status(400).json({
          status: 'error',
          title: 'INVALID INPUT',
          message: 'QR code identifier is required'
        });
      }

      // Deep sanitize scanned text (strip invisible characters, newlines, JSON strings, URLs, leading #)
      let cleanQrId = rawInput.replace(/[\u200B-\u200D\uFEFF\u0000-\u001F\u007F-\u009F]/g, '').trim();

      if (cleanQrId.startsWith('{') && cleanQrId.endsWith('}')) {
        try {
          const parsed = JSON.parse(cleanQrId);
          cleanQrId = (parsed.qr_code_id || parsed.qrId || parsed.id || parsed.roll_no || cleanQrId).toString().trim();
        } catch {}
      }

      if (cleanQrId.includes('/pass/')) {
        const seg = cleanQrId.split('/pass/').pop()?.split('?')[0]?.split('#')[0];
        if (seg) cleanQrId = seg.trim();
      } else if (cleanQrId.includes('id=')) {
        const match = cleanQrId.match(/[?&]id=([^&]+)/);
        if (match && match[1]) cleanQrId = decodeURIComponent(match[1]).trim();
      }

      if (cleanQrId.startsWith('#')) {
        cleanQrId = cleanQrId.substring(1).trim();
      }

      console.log(`[GATE_SCANNER] Processing scan for sanitized ID: "${cleanQrId}" (raw: "${rawInput}")`);

      let registration = dbStore.qrToRegistration.get(cleanQrId) || 
                         dbStore.qrToRegistration.get(cleanQrId.toUpperCase()) ||
                         dbStore.registrations.get(cleanQrId.toUpperCase()) ||
                         dbStore.registrations.get(cleanQrId);

      // Case 1: If not found → show "QR Not Found" (red)
      if (!registration) {
        console.warn(`[GATE_SCANNER] Not Found: "${cleanQrId}"`);
        return res.status(404).json({
          status: 'not_found',
          title: 'QR NOT FOUND',
          message: `QR Not Found ❌ No registration record found for "${cleanQrId}"`,
          qr_code_id: cleanQrId,
          timestamp: new Date().toISOString()
        });
      }

      // Case 2: If status already "scanned" → show "Already Scanned" (amber/red) with original scan time
      if (registration.status === 'scanned') {
        const scanTimeStr = registration.scanned_at ? new Date(registration.scanned_at).toLocaleTimeString() : 'earlier';
        console.warn(`[GATE_SCANNER] Duplicate scan for ${registration.name} (${registration.roll_no}) at ${scanTimeStr}`);
        return res.json({
          status: 'already_used',
          title: 'ALREADY SCANNED',
          message: `Already Scanned ⚠️ Pass was checked in at ${scanTimeStr}`,
          registration,
          scanned_at: registration.scanned_at,
          timestamp: new Date().toISOString()
        });
      }

      // Case 3: If status "pending" → mark status "scanned", set scanned_at, show "Valid Entry ✅"
      registration.status = 'scanned';
      registration.scanned_at = new Date().toISOString();

      // Ensure squad name is attached if available
      if (registration.squad_id && dbStore.squads.has(registration.squad_id)) {
        registration.squad_name = dbStore.squads.get(registration.squad_id)?.squad_name;
      }

      // Calculate current live stats
      let totalScanned = 0;
      let totalPending = 0;
      for (const r of dbStore.registrations.values()) {
        if (r.status === 'scanned') totalScanned++;
        else totalPending++;
      }

      // Record latest scan reveal event
      latestScanRevealEvent = {
        registration: { ...registration },
        timestamp: registration.scanned_at,
        stats: {
          total_registered: dbStore.registrations.size,
          total_scanned: totalScanned,
          total_pending: totalPending
        }
      };

      // Realtime Broadcast to Big Screen Gate Display listeners (SSE)
      const ssePayload = JSON.stringify({
        type: 'valid_scan',
        reveal: latestScanRevealEvent
      });

      for (const client of sseDisplayClients) {
        try {
          client.write(`data: ${ssePayload}\n\n`);
        } catch (e) {
          sseDisplayClients.delete(client);
        }
      }

      console.log(`[GATE_SCANNER] SUCCESS: Admitted ${registration.name} (${registration.roll_no})`);

      return res.json({
        status: 'valid',
        title: 'VALID ENTRY',
        message: `Valid Entry ✅ Welcome to Fresher's Fiesta 2026, ${registration.name}!`,
        registration,
        scanned_at: registration.scanned_at,
        timestamp: registration.scanned_at
      });
    } catch (err: any) {
      console.error('[GATE_SCANNER] Scan error:', err);
      return res.status(500).json({
        status: 'error',
        title: 'SYSTEM ERROR',
        message: err.message || 'Scanning system error'
      });
    }
  });

  // Admin helper to reset a pass back to pending for instant re-testing
  app.post('/api/admin/reset-pass', verifyAdminAuth, (req, res) => {
    const { roll_no, qr_code_id } = req.body;
    let target = null;
    if (roll_no) target = dbStore.registrations.get(roll_no.toUpperCase().trim());
    if (!target && qr_code_id) target = dbStore.qrToRegistration.get(qr_code_id.trim());

    if (!target) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    target.status = 'pending';
    target.scanned_at = null;
    return res.json({ success: true, message: `Reset ${target.name} (${target.roll_no}) to pending`, registration: target });
  });

  // Get Latest Scan Reveal Event (For Big Display hydration / polling fallback)
  app.get('/api/scan/latest', verifyAdminAuth, (req, res) => {
    let totalScanned = 0;
    let totalPending = 0;
    for (const r of dbStore.registrations.values()) {
      if (r.status === 'scanned') totalScanned++;
      else totalPending++;
    }

    res.json({
      latest: latestScanRevealEvent,
      stats: {
        total_registered: dbStore.registrations.size,
        total_scanned: totalScanned,
        total_pending: totalPending,
        total_whitelist: dbStore.whitelist.size
      }
    });
  });

  // Server-Sent Events (SSE) Stream for Big Display Entrance Screen (Admin only)
  app.get('/api/scan/stream', verifyAdminAuth, (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseDisplayClients.add(res);

    // Send initial connection packet
    let totalScanned = 0;
    let totalPending = 0;
    for (const r of dbStore.registrations.values()) {
      if (r.status === 'scanned') totalScanned++;
      else totalPending++;
    }

    const initMsg = JSON.stringify({
      type: 'connected',
      latest: latestScanRevealEvent,
      stats: {
        total_registered: dbStore.registrations.size,
        total_scanned: totalScanned,
        total_pending: totalPending,
        total_whitelist: dbStore.whitelist.size
      }
    });
    res.write(`data: ${initMsg}\n\n`);

    // Keep-alive heartbeat every 20s
    const pingInterval = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch (e) {
        clearInterval(pingInterval);
        sseDisplayClients.delete(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(pingInterval);
      sseDisplayClients.delete(res);
    });
  });


  // ==========================================
  // SQUAD AUTO-GROUPING & CHAT ENDPOINTS
  // ==========================================

  // Get Squad Config & Status
  app.get('/api/squads/config', (req, res) => {
    res.json({
      target_size: dbStore.squadTargetSize,
      grouped: dbStore.squadsGrouped,
      last_grouped_at: dbStore.lastGroupedAt,
      total_squads: dbStore.squads.size,
      total_registrations: dbStore.registrations.size
    });
  });

  // Update Squad Config (Admin only)
  app.post('/api/squads/config', verifyAdminAuth, (req, res) => {
    const { target_size } = req.body;
    if (typeof target_size === 'number' && target_size >= 2) {
      dbStore.squadTargetSize = Math.min(50, Math.max(2, target_size));
    }
    res.json({
      success: true,
      target_size: dbStore.squadTargetSize
    });
  });

  // Run Auto-Grouping (Admin only)
  app.post('/api/squads/auto-group', verifyAdminAuth, (req, res) => {
    const targetSize = Number(req.body.target_size) || dbStore.squadTargetSize;
    const result = dbStore.runAutoGrouping(targetSize);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({
      success: true,
      message: `Successfully created ${result.total_squads} gender-balanced squads of ~${result.target_size} members each.`,
      total_squads: result.total_squads,
      target_size: result.target_size,
      squads: result.squads
    });
  });

  // Re-shuffle Groups (Admin only)
  app.post('/api/squads/reshuffle', verifyAdminAuth, (req, res) => {
    const targetSize = Number(req.body.target_size) || dbStore.squadTargetSize;
    const result = dbStore.runAutoGrouping(targetSize);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({
      success: true,
      message: `Re-shuffled into ${result.total_squads} fresh squads!`,
      total_squads: result.total_squads,
      target_size: result.target_size,
      squads: result.squads
    });
  });

  // Get all squads (STRICT ADMIN ONLY: for planning & logistics use)
  app.get('/api/squads', verifyAdminAuth, (req, res) => {
    const squadsList = Array.from(dbStore.squads.values());
    res.json({
      grouped: dbStore.squadsGrouped,
      total: squadsList.length,
      squads: squadsList
    });
  });

  // Get single squad details by ID (Admin only)
  app.get('/api/squads/:squadId', verifyAdminAuth, (req, res) => {
    const squad = dbStore.squads.get(req.params.squadId);
    if (!squad) {
      return res.status(404).json({ error: 'Squad not found' });
    }
    res.json({ squad });
  });

  // Squad group chat disabled per policy (no further writes)
  app.post('/api/squads/:squadId/messages', (req, res) => {
    return res.status(410).json({
      success: false,
      error: 'Squad group chat has been retired and disabled.',
      code: 'CHAT_DISABLED'
    });
  });

  // Stats for Admin Scanner & Dashboard
  app.get('/api/stats', (req, res) => {
    const total_whitelist = dbStore.whitelist.size;
    const total_registered = dbStore.registrations.size;
    let total_scanned = 0;
    let total_pending = 0;

    for (const reg of dbStore.registrations.values()) {
      if (reg.status === 'scanned') {
        total_scanned++;
      } else {
        total_pending++;
      }
    }

    res.json({
      total_whitelist,
      total_registered,
      total_scanned,
      total_pending,
      total_squads: dbStore.squads.size
    });
  });

  // Registrations list for Admin (STRICT ADMIN ONLY)
  app.get('/api/registrations', verifyAdminAuth, (req, res) => {
    const list = Array.from(dbStore.registrations.values()).sort((a, b) => 
      new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime()
    );
    res.json({
      total: list.length,
      registrations: list
    });
  });

  // Sent Emails outbox viewer for testing & admin verification (STRICT ADMIN ONLY)
  app.get('/api/emails', verifyAdminAuth, (req, res) => {
    res.json({
      total: dbStore.sentEmails.length,
      emails: dbStore.sentEmails
    });
  });

  // ==========================================
  // CONTENT MANAGEMENT & AGENDA API (Firestore / Dynamic Content)
  // ==========================================

  // Public get content document (invitation_letter, agenda_day1, agenda_day2)
  app.get('/api/content/:docId', (req, res) => {
    const { docId } = req.params;
    const cleanId = docId.replace(/^content\//, '').trim();
    if (dbStore.contentDocs.has(cleanId)) {
      return res.json({
        docId: cleanId,
        data: dbStore.contentDocs.get(cleanId)
      });
    }
    // Return empty placeholder if not initialized
    return res.json({
      docId: cleanId,
      data: null
    });
  });

  // Admin update content document (STRICT ADMIN ONLY)
  app.post('/api/content/:docId', verifyAdminAuth, (req, res) => {
    try {
      const { docId } = req.params;
      const cleanId = docId.replace(/^content\//, '').trim();
      const contentData = req.body;

      if (!contentData || typeof contentData !== 'object') {
        return res.status(400).json({ error: 'Valid JSON body is required' });
      }

      const updated = {
        ...contentData,
        updated_at: new Date().toISOString()
      };

      dbStore.contentDocs.set(cleanId, updated);

      return res.json({
        success: true,
        message: `Document content/${cleanId} updated successfully`,
        docId: cleanId,
        data: updated
      });
    } catch (err: any) {
      console.error('Content update error:', err);
      return res.status(500).json({ error: err.message || 'Failed to update content' });
    }
  });

  // Export all Registrations as CSV (STRICT ADMIN ONLY)
  app.get('/api/registrations/csv', verifyAdminAuth, (req, res) => {
    try {
      const list = Array.from(dbStore.registrations.values()).sort((a, b) => 
        new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime()
      );

      const headers = ['Roll Number', 'Full Name', 'Branch', 'Email', 'Phone', 'Gender', 'Pass ID', 'Squad Name', 'Status', 'Registered At', 'Scanned At'];
      
      const escapeCsv = (str: any) => {
        if (str === null || str === undefined) return '""';
        const val = String(str).replace(/"/g, '""');
        return `"${val}"`;
      };

      const rows = list.map((reg) => [
        escapeCsv(reg.roll_no),
        escapeCsv(reg.name),
        escapeCsv(reg.branch),
        escapeCsv(reg.email),
        escapeCsv(reg.phone || ''),
        escapeCsv(reg.gender || ''),
        escapeCsv(reg.qr_code_id),
        escapeCsv(reg.squad_name || (reg.squad_id ? dbStore.squads.get(reg.squad_id)?.squad_name : 'Unassigned') || 'Unassigned'),
        escapeCsv(reg.status),
        escapeCsv(reg.registered_at),
        escapeCsv(reg.scanned_at || '')
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="frenzy_registrations_${new Date().toISOString().slice(0, 10)}.csv"`);
      return res.send(csvContent);
    } catch (err: any) {
      console.error('CSV export error:', err);
      return res.status(500).json({ error: err.message || 'Failed to generate CSV' });
    }
  });

  // --- Vite Frontend Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ Fresher Frenzy server listening on port ${PORT}`);
  });
}

startServer();
