export type Gender = 'Male' | 'Female' | 'Custom' | 'Other';

export interface WhitelistEntry {
  roll_no: string;
  name: string;
  branch: string;
  gender?: Gender;
  email?: string;
  created_at?: string;
}

export type RegistrationStatus = 'pending' | 'scanned';

export interface Registration {
  roll_no: string;
  name: string;
  branch: string;
  phone: string;
  email: string;
  gender?: Gender;
  squad_id?: string;
  squad_name?: string;
  qr_code_id: string;
  status: RegistrationStatus;
  registered_at: string;
  scanned_at: string | null;
  qr_code_data_url?: string;
}

export interface SquadMember {
  roll_no: string;
  name: string;
  branch: string;
  gender?: Gender;
  qr_code_id: string;
}

export interface Squad {
  squad_id: string;
  squad_name: string;
  created_at: string;
  members: SquadMember[];
}

export interface SquadChatMessage {
  id: string;
  squad_id: string;
  sender_name: string;
  sender_roll_no: string;
  text: string;
  timestamp: string;
}

export interface SquadConfig {
  target_size: number;
  grouped: boolean;
  last_grouped_at?: string;
  total_squads?: number;
  total_registrations?: number;
}

export type ScanStatus = 'valid' | 'already_used' | 'not_found' | 'forbidden' | 'error';

export interface ScanResult {
  status: ScanStatus;
  title?: string;
  message: string;
  registration?: Registration;
  scanned_at?: string | null;
  qr_code_id?: string;
  timestamp: string;
}

export interface SentEmail {
  id: string;
  to: string;
  subject: string;
  roll_no: string;
  name: string;
  branch: string;
  qr_code_id: string;
  sent_at: string;
  status: 'delivered' | 'sent';
  qr_code_data_url?: string;
}

export interface StatsResponse {
  total_whitelist: number;
  total_registered: number;
  total_scanned: number;
  total_pending: number;
  total_squads?: number;
}

export interface ScheduleItem {
  time: string;
  activity?: string;
  title?: string;
  description?: string;
}

export interface AgendaDayContent {
  title?: string;
  date?: string;
  theme: string;
  food?: string;
  timings?: string;
  food_provided?: boolean | string;
  food_details?: string;
  schedule: ScheduleItem[];
  notes?: string;
  updated_at?: string;
}

export interface InvitationLetterContent {
  title: string;
  subtitle: string;
  greeting: string;
  body: string[];
  signature_title: string;
  signature_names: string;
  updated_at?: string;
}

export interface AdminUser {
  email: string;
  uid?: string;
  token: string;
  claims: {
    admin?: boolean;
    [key: string]: any;
  };
}

