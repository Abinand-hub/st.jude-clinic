export type UserRole = 'manager' | 'staff';
export type Profession = 'doctor' | 'nurse' | 'receptionist';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  profession?: Profession; // Required if role === 'staff'
  phone?: string;
  avatarColor?: string;
}

export interface RoleRequirements {
  doctor: number;
  nurse: number;
  receptionist: number;
}

export interface Shift {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hr)
  endTime: string; // HH:mm (24-hr)
  requirements: RoleRequirements;
  notes?: string;
  location?: string;
  seriesId?: string;
  isRecurring?: boolean;
  recurrenceRule?: string; // e.g. "Weekly Mon/Wed until 2026-10-01"
}

export interface ShiftClaim {
  id: string;
  shiftId: string;
  userId: string;
  userProfession: Profession;
  claimedAt: string;
  assignedByManager?: boolean;
  assignedByUserId?: string;
}

export interface ShiftWithClaims extends Shift {
  claims: ShiftClaim[];
  claimedUsers: (User & { claimId: string; claimedAt: string })[];
  status: 'fully_staffed' | 'partially_staffed' | 'unstaffed';
  currentCounts: RoleRequirements;
  missingRoles: RoleRequirements;
  totalRequired: number;
  totalClaimed: number;
}

export interface ImportLogRow {
  id: string;
  rowNumber: number;
  rawData: string;
  entityType: 'staff' | 'shift';
  status: 'accepted' | 'merged' | 'rejected';
  reason?: string;
  actionTaken: string;
  parsedResult?: Record<string, any>;
}

export interface ImportReport {
  id: string;
  timestamp: string;
  fileName: string;
  totalRows: number;
  acceptedCount: number;
  mergedCount: number;
  rejectedCount: number;
  logs: ImportLogRow[];
}

export interface ClaimValidationResult {
  valid: boolean;
  error?: string;
  code?: 'CAPACITY_FULL' | 'TIME_OVERLAP' | 'INVALID_PROFESSION' | 'NOT_FOUND' | 'PAST_SHIFT';
  conflictShift?: Shift;
}

export interface ShiftEditImpactReport {
  shiftId: string;
  retainedClaims: ShiftClaim[];
  revokedClaims: { claim: ShiftClaim; user: User; reason: string }[];
}
