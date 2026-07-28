import { ImportLogRow, ImportReport, User, Shift, RoleRequirements, Profession, UserRole } from '../src/types.js';

export function normalizeProfession(rawRole: string): { role: UserRole; profession?: Profession; normalized: string } | null {
  if (!rawRole) return null;
  const clean = rawRole.trim().toLowerCase();

  if (clean.includes('mgr') || clean.includes('admin') || clean.includes('manager') || clean.includes('lead')) {
    return { role: 'manager', normalized: 'manager' };
  }
  if (clean.includes('doc') || clean.includes('physician') || clean.includes('md') || clean.includes('doctor') || clean === 'dr') {
    return { role: 'staff', profession: 'doctor', normalized: 'doctor' };
  }
  if (clean.includes('rn') || clean.includes('nurse') || clean.includes('np') || clean.includes('lpn')) {
    return { role: 'staff', profession: 'nurse', normalized: 'nurse' };
  }
  if (clean.includes('recept') || clean.includes('front desk') || clean.includes('sec') || clean.includes('clerk')) {
    return { role: 'staff', profession: 'receptionist', normalized: 'receptionist' };
  }

  return null;
}

export function parseDateString(rawDate: string): string | null {
  if (!rawDate) return null;
  const clean = rawDate.trim();

  // YYYY-MM-DD or YYYY.MM.DD
  const ymdMatch = clean.match(/^(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return validateCalendarDate(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10));
  }

  // MM/DD/YYYY
  const mdyMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch;
    return validateCalendarDate(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10));
  }

  // MMM D YYYY (e.g. Aug 5 2026, August 5, 2026)
  const monthMap: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };
  const textMatch = clean.match(/^([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (textMatch) {
    const [, mStr, day, year] = textMatch;
    const mKey = mStr.toLowerCase().substring(0, 3);
    if (monthMap[mKey]) {
      return validateCalendarDate(parseInt(year, 10), monthMap[mKey], parseInt(day, 10));
    }
  }

  return null;
}

function validateCalendarDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  // Check days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return null;

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function parseTimeString(rawTime: string): string | null {
  if (!rawTime) return null;
  const clean = rawTime.trim().toLowerCase();

  // 12-hr format: 8am, 4:30pm, 8:00 am, 4 pm
  const twelveMatch = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (twelveMatch) {
    let hour = parseInt(twelveMatch[1], 10);
    const minute = twelveMatch[2] ? parseInt(twelveMatch[2], 10) : 0;
    const ampm = twelveMatch[3];

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  // 24-hr format: 08:00, 16:00, 8:00, 00:00
  const twentyFourMatch = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourMatch) {
    const hour = parseInt(twentyFourMatch[1], 10);
    const minute = parseInt(twentyFourMatch[2], 10);

    if (hour < 0 || hour > 24 || minute < 0 || minute > 59) return null;
    if (hour === 24 && minute === 0) return '24:00'; // Standard midnight representation
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  return null;
}

export function parseCsvRows(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/);
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    // Basic CSV splitting handling quotes
    const row: string[] = [];
    let inQuotes = false;
    let current = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

export function processStaffCsv(csvText: string, existingUsers: User[] = []): { users: User[]; logs: ImportLogRow[] } {
  const rows = parseCsvRows(csvText);
  if (rows.length === 0) return { users: existingUsers, logs: [] };

  const logs: ImportLogRow[] = [];
  const usersMap = new Map<string, User>();

  // Populate existing
  existingUsers.forEach(u => usersMap.set(u.email.toLowerCase(), u));

  // Check header
  let startIdx = 0;
  if (rows[0][0].toLowerCase().includes('name') || rows[0][1]?.toLowerCase().includes('email')) {
    startIdx = 1;
  }

  for (let i = startIdx; i < rows.length; i++) {
    const rowNum = i + 1;
    const row = rows[i];
    const rawData = row.join(', ');

    const name = row[0] ? row[0].trim() : '';
    const rawEmail = row[1] ? row[1].trim() : '';
    const rawRole = row[2] ? row[2].trim() : '';
    const phone = row[3] ? row[3].trim() : '';

    if (!name || !rawEmail) {
      logs.push({
        id: `staff_log_${Date.now()}_${i}`,
        rowNumber: rowNum,
        rawData,
        entityType: 'staff',
        status: 'rejected',
        reason: 'Missing required field: Name or Email address is empty.',
        actionTaken: 'Row rejected and skipped from staff database.'
      });
      continue;
    }

    const email = rawEmail.toLowerCase();

    // Check role/profession normalization
    const normalizedRole = normalizeProfession(rawRole);
    if (!normalizedRole) {
      logs.push({
        id: `staff_log_${Date.now()}_${i}`,
        rowNumber: rowNum,
        rawData,
        entityType: 'staff',
        status: 'rejected',
        reason: `Unrecognized role or profession: '${rawRole}'. Must be Doctor, Nurse, Receptionist, or Manager.`,
        actionTaken: 'Row rejected. Cannot assign system permissions to unknown role.'
      });
      continue;
    }

    // Check duplicates
    if (usersMap.has(email)) {
      const existing = usersMap.get(email)!;
      // Merge phone if missing
      if (phone && !existing.phone) {
        existing.phone = phone;
      }
      logs.push({
        id: `staff_log_${Date.now()}_${i}`,
        rowNumber: rowNum,
        rawData,
        entityType: 'staff',
        status: 'merged',
        reason: `Duplicate email address '${email}' detected. Staff record already exists for ${existing.name}.`,
        actionTaken: `Merged duplicate data into existing user profile for ${existing.name} (${normalizedRole.normalized}).`
      });
      continue;
    }

    // Create valid user
    const newUser: User = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      name,
      email,
      password: normalizedRole.role === 'manager' ? 'manager123' : 'staff123',
      role: normalizedRole.role,
      profession: normalizedRole.profession,
      phone,
      avatarColor: getAvatarColor(normalizedRole.profession || 'manager')
    };

    usersMap.set(email, newUser);
    logs.push({
      id: `staff_log_${Date.now()}_${i}`,
      rowNumber: rowNum,
      rawData,
      entityType: 'staff',
      status: 'accepted',
      actionTaken: `Created new ${normalizedRole.role} user profile for ${name} (${normalizedRole.normalized}).`,
      parsedResult: newUser
    });
  }

  return { users: Array.from(usersMap.values()), logs };
}

export function processShiftsCsv(csvText: string, existingShifts: Shift[] = []): { shifts: Shift[]; logs: ImportLogRow[] } {
  const rows = parseCsvRows(csvText);
  if (rows.length === 0) return { shifts: existingShifts, logs: [] };

  const logs: ImportLogRow[] = [];
  const shiftsMap = new Map<string, Shift>();

  // Key generator for duplicate check
  const getShiftKey = (title: string, date: string, start: string, end: string) => `${title.toLowerCase().trim()}_${date}_${start}_${end}`;

  existingShifts.forEach(s => {
    shiftsMap.set(getShiftKey(s.title, s.date, s.startTime, s.endTime), s);
  });

  let startIdx = 0;
  if (rows[0][0].toLowerCase().includes('title') || rows[0][1]?.toLowerCase().includes('date')) {
    startIdx = 1;
  }

  for (let i = startIdx; i < rows.length; i++) {
    const rowNum = i + 1;
    const row = rows[i];
    const rawData = row.join(', ');

    const title = row[0] ? row[0].trim() : '';
    const rawDate = row[1] ? row[1].trim() : '';
    const rawStart = row[2] ? row[2].trim() : '';
    const rawEnd = row[3] ? row[3].trim() : '';
    const rawDocs = row[4] ? row[4].trim() : '0';
    const rawNurses = row[5] ? row[5].trim() : '0';
    const rawRecs = row[6] ? row[6].trim() : '0';
    const notes = row[7] ? row[7].trim() : '';

    if (!title) {
      logs.push({
        id: `shift_log_${Date.now()}_${i}`,
        rowNumber: rowNum,
        rawData,
        entityType: 'shift',
        status: 'rejected',
        reason: 'Missing shift title.',
        actionTaken: 'Row rejected.'
      });
      continue;
    }

    // Date validation
    const parsedDate = parseDateString(rawDate);
    if (!parsedDate) {
      logs.push({
        id: `shift_log_${Date.now()}_${i}`,
        rowNumber: rowNum,
        rawData,
        entityType: 'shift',
        status: 'rejected',
        reason: `Invalid or non-existent calendar date format: '${rawDate}'.`,
        actionTaken: 'Row rejected. Shifts must have a valid calendar date.'
      });
      continue;
    }

    // Time validation
    const parsedStart = parseTimeString(rawStart);
    const parsedEnd = parseTimeString(rawEnd);

    if (!parsedStart || !parsedEnd) {
      logs.push({
        id: `shift_log_${Date.now()}_${i}`,
        rowNumber: rowNum,
        rawData,
        entityType: 'shift',
        status: 'rejected',
        reason: `Unparseable time string: Start '${rawStart}', End '${rawEnd}'.`,
        actionTaken: 'Row rejected. Times must be valid 12-hr or 24-hr formats.'
      });
      continue;
    }

    // Impossible time check (e.g. start >= end on same day, unless 24:00 or overnight)
    const startMins = timeToMinutes(parsedStart);
    const endMins = timeToMinutes(parsedEnd);

    if (endMins <= startMins && parsedEnd !== '24:00' && !(parsedEnd === '00:00' && parsedStart !== '00:00')) {
      logs.push({
        id: `shift_log_${Date.now()}_${i}`,
        rowNumber: rowNum,
        rawData,
        entityType: 'shift',
        status: 'rejected',
        reason: `Impossible shift time range: End time (${parsedEnd}) is prior to or equal to Start time (${parsedStart}).`,
        actionTaken: 'Row rejected. End time must be after start time.'
      });
      continue;
    }

    // Parse role requirements
    const docReq = Math.max(0, parseInt(rawDocs, 10) || 0);
    const nurseReq = Math.max(0, parseInt(rawNurses, 10) || 0);
    const recReq = Math.max(0, parseInt(rawRecs, 10) || 0);

    const totalReq = docReq + nurseReq + recReq;
    if (totalReq === 0) {
      logs.push({
        id: `shift_log_${Date.now()}_${i}`,
        rowNumber: rowNum,
        rawData,
        entityType: 'shift',
        status: 'rejected',
        reason: `No role requirements specified (Doctors: ${rawDocs}, Nurses: ${rawNurses}, Receptionists: ${rawRecs}).`,
        actionTaken: 'Row rejected. At least one role requirement must be greater than 0.'
      });
      continue;
    }

    // Duplicate check
    const key = getShiftKey(title, parsedDate, parsedStart, parsedEnd);
    if (shiftsMap.has(key)) {
      logs.push({
        id: `shift_log_${Date.now()}_${i}`,
        rowNumber: rowNum,
        rawData,
        entityType: 'shift',
        status: 'merged',
        reason: `Duplicate shift row detected for '${title}' on ${parsedDate} (${parsedStart} - ${parsedEnd}).`,
        actionTaken: 'Deduplicated duplicate shift record. Retained single shift instance.'
      });
      continue;
    }

    const newShift: Shift = {
      id: `shift_${Math.random().toString(36).substring(2, 9)}`,
      title,
      date: parsedDate,
      startTime: parsedStart,
      endTime: parsedEnd,
      requirements: {
        doctor: docReq,
        nurse: nurseReq,
        receptionist: recReq
      },
      notes
    };

    shiftsMap.set(key, newShift);
    logs.push({
      id: `shift_log_${Date.now()}_${i}`,
      rowNumber: rowNum,
      rawData,
      entityType: 'shift',
      status: 'accepted',
      actionTaken: `Created new shift: ${title} on ${parsedDate} (${parsedStart}-${parsedEnd}) requiring ${docReq} Dr, ${nurseReq} RN, ${recReq} Rec.`,
      parsedResult: newShift
    });
  }

  return { shifts: Array.from(shiftsMap.values()), logs };
}

export function timeToMinutes(timeStr: string): number {
  if (timeStr === '24:00') return 24 * 60;
  const [h, m] = timeStr.split(':').map(n => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}

function getAvatarColor(pref: string): string {
  switch (pref) {
    case 'doctor': return '#2563eb'; // Blue
    case 'nurse': return '#059669'; // Emerald
    case 'receptionist': return '#d97706'; // Amber
    default: return '#7c3aed'; // Purple (Manager)
  }
}
