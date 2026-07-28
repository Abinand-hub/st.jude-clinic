import fs from 'fs';
import path from 'path';
import {
  User, Shift, ShiftClaim, ShiftWithClaims, ImportReport,
  ImportLogRow, ClaimValidationResult, ShiftEditImpactReport, Profession, UserRole, RoleRequirements
} from '../src/types.js';
import { processStaffCsv, processShiftsCsv, timeToMinutes } from './importEngine.js';

class ClinicDataStore {
  private users: Map<string, User> = new Map();
  private shifts: Map<string, Shift> = new Map();
  private claims: Map<string, ShiftClaim> = new Map();
  private importReports: ImportReport[] = [];
  private lock: boolean = false; // Mutex for atomic operations

  constructor() {
    this.seedInitialData();
  }

  private async acquireLock(): Promise<void> {
    while (this.lock) {
      await new Promise(res => setTimeout(res, 10));
    }
    this.lock = true;
  }

  private releaseLock(): void {
    this.lock = false;
  }

  private seedInitialData() {
    try {
      const staffCsvPath = path.join(process.cwd(), 'server', 'seed_data', 'staff.csv');
      const shiftsCsvPath = path.join(process.cwd(), 'server', 'seed_data', 'shifts.csv');

      let staffLogs: ImportLogRow[] = [];
      let shiftLogs: ImportLogRow[] = [];

      if (fs.existsSync(staffCsvPath)) {
        const staffContent = fs.readFileSync(staffCsvPath, 'utf-8');
        const res = processStaffCsv(staffContent, []);
        res.users.forEach(u => this.users.set(u.id, u));
        staffLogs = res.logs;
      }

      if (fs.existsSync(shiftsCsvPath)) {
        const shiftsContent = fs.readFileSync(shiftsCsvPath, 'utf-8');
        const res = processShiftsCsv(shiftsContent, []);
        res.shifts.forEach(s => this.shifts.set(s.id, s));
        shiftLogs = res.logs;
      }

      // Ensure primary manager login exists
      const managerEmail = 'dr.sarah@stjude.clinic';
      let manager = Array.from(this.users.values()).find(u => u.email === managerEmail);
      if (!manager) {
        manager = {
          id: 'usr_mgr_sarah',
          name: 'Dr. Sarah Vance',
          email: managerEmail,
          password: 'manager123',
          role: 'manager',
          avatarColor: '#7c3aed'
        };
        this.users.set(manager.id, manager);
      }

      // Build Seed Import Report
      const combinedLogs = [...staffLogs, ...shiftLogs];
      const accepted = combinedLogs.filter(l => l.status === 'accepted').length;
      const merged = combinedLogs.filter(l => l.status === 'merged').length;
      const rejected = combinedLogs.filter(l => l.status === 'rejected').length;

      const initialReport: ImportReport = {
        id: 'report_initial_seed',
        timestamp: new Date().toISOString(),
        fileName: 'staff.csv & shifts.csv (Legacy Spreadsheet Export)',
        totalRows: combinedLogs.length,
        acceptedCount: accepted,
        mergedCount: merged,
        rejectedCount: rejected,
        logs: combinedLogs
      };

      this.importReports.unshift(initialReport);

      // Pre-populate realistic seed claims for demonstration
      this.seedInitialClaims();

    } catch (err) {
      console.error('Error seeding initial clinic data:', err);
    }
  }

  private seedInitialClaims() {
    const usersArr = Array.from(this.users.values());
    const shiftsArr = Array.from(this.shifts.values());

    const drChen = usersArr.find(u => u.email.includes('chen'));
    const nurseJoy = usersArr.find(u => u.email.includes('joy'));
    const nurseBen = usersArr.find(u => u.email.includes('ben'));
    const recSam = usersArr.find(u => u.email.includes('sam'));

    // Find Monday Aug 3 08:00 shift
    const mondayMorning = shiftsArr.find(s => s.date === '2026-08-03' && s.startTime === '08:00');
    if (mondayMorning) {
      if (drChen) this.internalCreateClaim(mondayMorning.id, drChen.id, drChen.profession!);
      if (nurseJoy) this.internalCreateClaim(mondayMorning.id, nurseJoy.id, nurseJoy.profession!);
      if (recSam) this.internalCreateClaim(mondayMorning.id, recSam.id, recSam.profession!);
    }

    // Find Monday Aug 3 16:00 shift
    const mondayEvening = shiftsArr.find(s => s.date === '2026-08-03' && s.startTime === '16:00');
    if (mondayEvening && nurseBen) {
      this.internalCreateClaim(mondayEvening.id, nurseBen.id, nurseBen.profession!);
    }
  }

  private internalCreateClaim(shiftId: string, userId: string, profession: Profession, assignedByManager = false) {
    const claimId = `claim_${Math.random().toString(36).substring(2, 9)}`;
    const claim: ShiftClaim = {
      id: claimId,
      shiftId,
      userId,
      userProfession: profession,
      claimedAt: new Date().toISOString(),
      assignedByManager
    };
    this.claims.set(claimId, claim);
  }

  // --- PUBLIC DATA GETTERS ---

  public getUsers(): User[] {
    return Array.from(this.users.values());
  }

  public addUser(userData: Partial<User>): User {
    const id = `usr_${Math.random().toString(36).substring(2, 9)}`;
    // Assign generic color if no profession
    let avatarColor = '#2563eb';
    if (userData.profession === 'doctor') avatarColor = '#10b981';
    else if (userData.profession === 'nurse') avatarColor = '#3b82f6';
    else if (userData.profession === 'receptionist') avatarColor = '#f59e0b';
    else if (userData.role === 'manager') avatarColor = '#7c3aed';

    const newUser: User = {
      id,
      name: userData.name!,
      email: userData.email!,
      password: userData.password || (userData.role === 'manager' ? 'manager123' : 'staff123'),
      role: userData.role || 'staff',
      profession: userData.profession,
      phone: userData.phone,
      avatarColor
    };

    this.users.set(id, newUser);
    return newUser;
  }

  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public updateUser(id: string, userData: Partial<User>): User | undefined {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser = {
      ...existingUser,
      ...userData,
      id // Ensure ID cannot be changed
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  public getUserByEmail(email: string): User | undefined {
    const cleanEmail = email.toLowerCase().trim();
    return Array.from(this.users.values()).find(u => u.email.toLowerCase() === cleanEmail);
  }

  public getShiftsWithClaims(): ShiftWithClaims[] {
    const usersMap = this.users;
    const allClaims = Array.from(this.claims.values());

    return Array.from(this.shifts.values()).map(shift => {
      const shiftClaims = allClaims.filter(c => c.shiftId === shift.id);

      const currentCounts: RoleRequirements = { doctor: 0, nurse: 0, receptionist: 0 };
      const claimedUsers: (User & { claimId: string; claimedAt: string })[] = [];

      shiftClaims.forEach(c => {
        if (c.userProfession && currentCounts[c.userProfession] !== undefined) {
          currentCounts[c.userProfession]++;
        }
        const user = usersMap.get(c.userId);
        if (user) {
          claimedUsers.push({
            ...user,
            claimId: c.id,
            claimedAt: c.claimedAt
          });
        }
      });

      const missingRoles: RoleRequirements = {
        doctor: Math.max(0, shift.requirements.doctor - currentCounts.doctor),
        nurse: Math.max(0, shift.requirements.nurse - currentCounts.nurse),
        receptionist: Math.max(0, shift.requirements.receptionist - currentCounts.receptionist)
      };

      const totalRequired = shift.requirements.doctor + shift.requirements.nurse + shift.requirements.receptionist;
      const totalClaimed = shiftClaims.length;

      let status: 'fully_staffed' | 'partially_staffed' | 'unstaffed' = 'unstaffed';
      if (totalClaimed === 0) {
        status = 'unstaffed';
      } else if (
        missingRoles.doctor === 0 &&
        missingRoles.nurse === 0 &&
        missingRoles.receptionist === 0
      ) {
        status = 'fully_staffed';
      } else {
        status = 'partially_staffed';
      }

      return {
        ...shift,
        claims: shiftClaims,
        claimedUsers,
        status,
        currentCounts,
        missingRoles,
        totalRequired,
        totalClaimed
      };
    });
  }

  public getImportReports(): ImportReport[] {
    return this.importReports;
  }

  // --- SERVER-ENFORCED CLAIM VALIDATION & BUSINESS RULES ---

  public validateClaim(userId: string, shiftId: string): ClaimValidationResult {
    const user = this.users.get(userId);
    if (!user) {
      return { valid: false, error: 'User profile not found.', code: 'NOT_FOUND' };
    }

    if (user.role !== 'staff' || !user.profession) {
      return { valid: false, error: 'Managers cannot claim shifts. Managers may assign staff.', code: 'INVALID_PROFESSION' };
    }

    const targetShift = this.shifts.get(shiftId);
    if (!targetShift) {
      return { valid: false, error: 'Target shift not found.', code: 'NOT_FOUND' };
    }

    const profession = user.profession;
    const requiredCapacity = targetShift.requirements[profession] || 0;

    // Check if user already claimed THIS shift
    const existingSelfClaim = Array.from(this.claims.values()).find(
      c => c.shiftId === shiftId && c.userId === userId
    );
    if (existingSelfClaim) {
      return { valid: false, error: 'You have already claimed this shift.', code: 'CAPACITY_FULL' };
    }

    // Rule 1: Profession Capacity Check
    const existingClaimsForRole = Array.from(this.claims.values()).filter(
      c => c.shiftId === shiftId && c.userProfession === profession
    );

    if (existingClaimsForRole.length >= requiredCapacity) {
      return {
        valid: false,
        error: `Capacity reached for ${profession}s on this shift (${existingClaimsForRole.length}/${requiredCapacity} spots filled).`,
        code: 'CAPACITY_FULL'
      };
    }

    // Rule 2: Overlap Check with existing claimed shifts
    const userClaims = Array.from(this.claims.values()).filter(c => c.userId === userId);
    
    const getShiftInterval = (d: string, st: string, et: string) => {
      const start = new Date(`${d}T${st}:00`);
      const end = new Date(`${d}T${et}:00`);
      if (end <= start) end.setDate(end.getDate() + 1);
      return { start: start.getTime(), end: end.getTime() };
    };

    const targetInterval = getShiftInterval(targetShift.date, targetShift.startTime, targetShift.endTime);

    for (const c of userClaims) {
      const claimedShift = this.shifts.get(c.shiftId);
      if (!claimedShift) continue;

      const existingInterval = getShiftInterval(claimedShift.date, claimedShift.startTime, claimedShift.endTime);

      if (targetInterval.start < existingInterval.end && existingInterval.start < targetInterval.end) {
        return {
          valid: false,
          error: `Schedule Conflict: Overlaps with your existing shift '${claimedShift.title}' (${claimedShift.startTime} - ${claimedShift.endTime}) on ${claimedShift.date}.`,
          code: 'TIME_OVERLAP',
          conflictShift: claimedShift
        };
      }
    }

    return { valid: true };
  }

  // ATOMIC SHIFT CLAIM
  public async claimShift(userId: string, shiftId: string, assignedByManager = false, managerUserId?: string): Promise<ShiftClaim> {
    await this.acquireLock();
    try {
      const val = this.validateClaim(userId, shiftId);
      if (!val.valid) {
        throw new Error(val.error || 'Claim validation failed.');
      }

      const user = this.users.get(userId)!;
      const claimId = `claim_${Math.random().toString(36).substring(2, 9)}`;
      const claim: ShiftClaim = {
        id: claimId,
        shiftId,
        userId,
        userProfession: user.profession!,
        claimedAt: new Date().toISOString(),
        assignedByManager,
        assignedByUserId: managerUserId
      };

      this.claims.set(claimId, claim);
      return claim;
    } finally {
      this.releaseLock();
    }
  }

  // ATOMIC SHIFT UNCLAIM
  public async unclaimShift(claimId: string, requestingUserId: string, requestingRole: UserRole): Promise<boolean> {
    await this.acquireLock();
    try {
      const claim = this.claims.get(claimId);
      if (!claim) {
        throw new Error('Shift claim record not found.');
      }

      if (requestingRole !== 'manager' && claim.userId !== requestingUserId) {
        throw new Error('Unauthorized: Staff can only unclaim their own shifts.');
      }

      this.claims.delete(claimId);
      return true;
    } finally {
      this.releaseLock();
    }
  }

  // SHIFT CREATION (with optional recurrence series)
  public async createShift(shiftData: Omit<Shift, 'id'>, generateRecurring = false, repeatWeeks = 4): Promise<Shift[]> {
    await this.acquireLock();
    try {
      const createdShifts: Shift[] = [];
      const seriesId = generateRecurring ? `series_${Math.random().toString(36).substring(2, 9)}` : undefined;

      const baseDate = new Date(shiftData.date + 'T00:00:00');

      const numOccurrences = generateRecurring ? Math.max(1, repeatWeeks) : 1;

      for (let w = 0; w < numOccurrences; w++) {
        const currDate = new Date(baseDate);
        currDate.setDate(currDate.getDate() + (w * 7));

        const yyyy = currDate.getFullYear();
        const mm = String(currDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const shiftId = `shift_${Math.random().toString(36).substring(2, 9)}`;
        const shift: Shift = {
          ...shiftData,
          id: shiftId,
          date: dateStr,
          seriesId: seriesId,
          isRecurring: generateRecurring,
          recurrenceRule: generateRecurring ? `Weekly for ${repeatWeeks} weeks` : undefined
        };

        this.shifts.set(shiftId, shift);
        createdShifts.push(shift);
      }

      return createdShifts;
    } finally {
      this.releaseLock();
    }
  }

  // SHIFT EDIT & CLAIM RE-VALIDATION ENGINE
  public async updateShift(shiftId: string, updatedFields: Partial<Shift>): Promise<{ shift: Shift; impactReport: ShiftEditImpactReport }> {
    await this.acquireLock();
    try {
      const shift = this.shifts.get(shiftId);
      if (!shift) {
        throw new Error('Shift not found.');
      }

      const updatedShift: Shift = {
        ...shift,
        ...updatedFields,
        id: shiftId // Prevent ID overwrite
      };

      this.shifts.set(shiftId, updatedShift);

      // RE-VALIDATION OF EXISTING CLAIMS ON THIS SHIFT
      const existingClaims = Array.from(this.claims.values()).filter(c => c.shiftId === shiftId);
      const retainedClaims: ShiftClaim[] = [];
      const revokedClaims: { claim: ShiftClaim; user: User; reason: string }[] = [];

      // Profession counts tracker for new limits
      const roleCounts: Record<Profession, number> = { doctor: 0, nurse: 0, receptionist: 0 };

      // Process claims in order of creation
      existingClaims.sort((a, b) => new Date(a.claimedAt).getTime() - new Date(b.claimedAt).getTime());

      for (const claim of existingClaims) {
        const user = this.users.get(claim.userId);
        if (!user || !user.profession) {
          this.claims.delete(claim.id);
          revokedClaims.push({ claim, user: user || { id: claim.userId, name: 'Unknown', email: '', role: 'staff' }, reason: 'User profile no longer valid.' });
          continue;
        }

        const prof = user.profession;
        const maxCapacity = updatedShift.requirements[prof] || 0;

        // Check 1: Capacity reduction violation
        if (roleCounts[prof] >= maxCapacity) {
          this.claims.delete(claim.id);
          revokedClaims.push({
            claim,
            user,
            reason: `Role quota reduced by manager. Capacity for ${prof}s reduced to ${maxCapacity}.`
          });
          continue;
        }

        // Check 2: Time overlap with user's OTHER claimed shifts
        const otherUserClaims = Array.from(this.claims.values()).filter(
          c => c.userId === user.id && c.shiftId !== shiftId
        );

        let overlapFound = false;
        let conflictTitle = '';

        const getShiftInterval = (d: string, st: string, et: string) => {
          const start = new Date(`${d}T${st}:00`);
          const end = new Date(`${d}T${et}:00`);
          if (end <= start) end.setDate(end.getDate() + 1);
          return { start: start.getTime(), end: end.getTime() };
        };

        const targetInterval = getShiftInterval(updatedShift.date, updatedShift.startTime, updatedShift.endTime);

        for (const c of otherUserClaims) {
          const otherShift = this.shifts.get(c.shiftId);
          if (otherShift) {
            const existingInterval = getShiftInterval(otherShift.date, otherShift.startTime, otherShift.endTime);
            if (targetInterval.start < existingInterval.end && existingInterval.start < targetInterval.end) {
              overlapFound = true;
              conflictTitle = `'${otherShift.title}' (${otherShift.startTime}-${otherShift.endTime}) on ${otherShift.date}`;
              break;
            }
          }
        }

        if (overlapFound) {
          this.claims.delete(claim.id);
          revokedClaims.push({
            claim,
            user,
            reason: `Shift time changed by manager to ${updatedShift.startTime}-${updatedShift.endTime}, causing a schedule conflict with user's shift ${conflictTitle}.`
          });
          continue;
        }

        // Valid claim retained
        roleCounts[prof]++;
        retainedClaims.push(claim);
      }

      return {
        shift: updatedShift,
        impactReport: {
          shiftId,
          retainedClaims,
          revokedClaims
        }
      };
    } finally {
      this.releaseLock();
    }
  }

  // DELETE SHIFT
  public async deleteShift(shiftId: string, deleteSeries = false): Promise<number> {
    await this.acquireLock();
    try {
      const target = this.shifts.get(shiftId);
      if (!target) return 0;

      let shiftsToDelete: string[] = [shiftId];

      if (deleteSeries && target.seriesId) {
        shiftsToDelete = Array.from(this.shifts.values())
          .filter(s => s.seriesId === target.seriesId)
          .map(s => s.id);
      }

      shiftsToDelete.forEach(sId => {
        this.shifts.delete(sId);
        // Clean up claims
        Array.from(this.claims.values())
          .filter(c => c.shiftId === sId)
          .forEach(c => this.claims.delete(c.id));
      });

      return shiftsToDelete.length;
    } finally {
      this.releaseLock();
    }
  }

  // CUSTOM CSV UPLOAD ENGINE
  public async importCustomCsv(csvText: string, fileName: string): Promise<ImportReport> {
    await this.acquireLock();
    try {
      // Determine if CSV is staff or shifts by checking header keywords
      const firstLine = csvText.split(/\r?\n/)[0]?.toLowerCase() || '';

      let newReport: ImportReport;

      if (firstLine.includes('email') || firstLine.includes('profession') || firstLine.includes('role')) {
        const res = processStaffCsv(csvText, Array.from(this.users.values()));
        res.users.forEach(u => this.users.set(u.id, u));

        const accepted = res.logs.filter(l => l.status === 'accepted').length;
        const merged = res.logs.filter(l => l.status === 'merged').length;
        const rejected = res.logs.filter(l => l.status === 'rejected').length;

        newReport = {
          id: `report_${Date.now()}`,
          timestamp: new Date().toISOString(),
          fileName: fileName || 'Staff_Import.csv',
          totalRows: res.logs.length,
          acceptedCount: accepted,
          mergedCount: merged,
          rejectedCount: rejected,
          logs: res.logs
        };
      } else {
        const res = processShiftsCsv(csvText, Array.from(this.shifts.values()));
        res.shifts.forEach(s => this.shifts.set(s.id, s));

        const accepted = res.logs.filter(l => l.status === 'accepted').length;
        const merged = res.logs.filter(l => l.status === 'merged').length;
        const rejected = res.logs.filter(l => l.status === 'rejected').length;

        newReport = {
          id: `report_${Date.now()}`,
          timestamp: new Date().toISOString(),
          fileName: fileName || 'Shifts_Import.csv',
          totalRows: res.logs.length,
          acceptedCount: accepted,
          mergedCount: merged,
          rejectedCount: rejected,
          logs: res.logs
        };
      }

      this.importReports.unshift(newReport);
      return newReport;

    } finally {
      this.releaseLock();
    }
  }
}

export const clinicStore = new ClinicDataStore();
