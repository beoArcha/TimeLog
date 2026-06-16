export interface Project {
  id: string;
  name: string;
  color: string; // Tailwind color name like 'rose', 'teal', 'amber', 'violet' etc.
  createdAt: string;
  archived?: boolean; // Added support for archiving
  originalName?: string;
  originalColor?: string;
  editHistory?: Array<{
    editedAt: string;
    prevName?: string;
    prevColor?: string;
    reason?: string;
  }>;
}

export interface Task {
  id: string;
  projectId: string;
  parentTaskId: string | null; // null for primary tasks, string for subtasks
  name: string;
  createdAt: string;
  completed: boolean;
  originalName?: string;
  originalCompleted?: boolean;
  editHistory?: Array<{
    editedAt: string;
    prevName?: string;
    prevCompleted?: boolean;
    reason?: string;
  }>;
}


export interface TimeLog {
  id: string;
  taskId: string;
  projectId: string; // Cache project ID for fast reporting
  startTime: string; // ISO string
  endTime: string | null; // ISO string, null if currently running
  note?: string;
  originalStartTime?: string;
  originalEndTime?: string | null;
  originalNote?: string;
  editHistory?: Array<{
    editedAt: string;
    prevStartTime?: string;
    prevEndTime?: string | null;
    prevNote?: string;
    reason?: string;
  }>;
}

export interface PatchLog {
  id: string;
  projectId: string; // Can be global or specific
  taskId?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  patchNote: string;
  isSystemEvent?: boolean; // np. komuter przeszedł w stan uśpienia
}

export interface Settings {
  autoStart: boolean;
  autoPauseOnSleep: boolean;
  includePatchesInReports: boolean;
}

export interface HolidayLeave {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'holiday' | 'leave'; // 'holiday' (święto) or 'leave' (urlop)
  name: string; // Nazwa np. "Święto Pracy", "Urlop wypoczynkowy"
  note?: string;
  originalName?: string;
  originalDate?: string;
  originalType?: 'holiday' | 'leave';
  editHistory?: Array<{
    editedAt: string;
    prevName?: string;
    prevDate?: string;
    prevType?: 'holiday' | 'leave';
    reason?: string;
  }>;
}

export interface DatabaseState {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  holidays: HolidayLeave[];
  patches: PatchLog[];
}

export interface CliCommandHelp {
  command: string;
  description: string;
  usage: string;
}
