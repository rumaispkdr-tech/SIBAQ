export type UserRole = "candidate" | "admin";

export type TaskStatus = "not_started" | "in_progress" | "completed";

export type ThemeName =
  | "peaceful-garden"
  | "morning-mist"
  | "soft-sky"
  | "warm-evening"
  | "minimal-ivory";

export type TextSize = "standard" | "large" | "extra-large";

export type AnimationMode = "full" | "reduced" | "off";

export interface Candidate {
  id: string;
  admission_no: string;
  name: string;
  password_hash: string;
  role: UserRole;
  must_change_password: boolean;
  is_active: boolean;
  phone?: string | null;
  email?: string | null;
  chest_no?: string | null;
  class_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateSafe {
  id: string;
  admission_no: string;
  name: string;
  role: UserRole;
  must_change_password: boolean;
  is_active: boolean;
  phone?: string | null;
  email?: string | null;
  chest_no?: string | null;
  class_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyTask {
  id: string;
  candidate_id: string;
  task_date: string; // YYYY-MM-DD
  target_count: number; // 33
  completed_count: number; // 0 to 33
  status: TaskStatus;
  completed_at?: string | null;
  last_recitation_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecitationEvent {
  id: string;
  daily_task_id: string;
  candidate_id: string;
  count_after: number;
  duration_seconds: number;
  timestamp: string;
}

export interface UserPreferences {
  candidate_id: string;
  theme: ThemeName;
  text_size: TextSize;
  animation_mode: AnimationMode;
  fireworks_enabled: boolean;
  ambient_motion: boolean;
  sound_enabled: boolean;
  eye_rest_enabled: boolean;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name?: string;
  actor_role: UserRole;
  action: string;
  target_type: string;
  target_id: string;
  details?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface SiteSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface RecitationTimingStats {
  averageDurationSeconds: number;
  estimatedRemainingSeconds: number;
  formattedAverage: string;
  formattedRemaining: string;
  hasEnoughData: boolean;
}

export interface AdminStats {
  totalCandidates: number;
  completedToday: number;
  inProgressToday: number;
  notStartedToday: number;
  incompleteToday: number;
  completionPercentage: number;
  date: string;
}

export interface CandidateWithTask {
  id: string;
  admission_no: string;
  name: string;
  role: string;
  is_active: boolean;
  phone: string | null;
  email: string | null;
  chest_no?: string | null;
  class_name?: string | null;
  task_date: string;
  today_count: number;
  target_count: number;
  status: string;
  last_activity: string | null;
  completed_at: string | null;
}

