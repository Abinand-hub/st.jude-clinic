# Conflict Resolution Decision

When a manager edits a shift's timeframe (e.g., changing 9 AM - 5 PM to 9 AM - 12 PM or altering overnight shifts), the system must determine how to handle any existing staff claims that might now overlap with their other scheduled shifts.

**Decision Chosen:** Remove conflicting claims and notify the manager.

### Why this approach?

1. **Managerial Authority and Flow:** The manager's priority is adjusting the schedule to fit operational needs. Blocking the shift save (by showing errors and preventing the update) forces the manager into a tedious flow where they must manually find and unassign conflicting staff before they can even save the new required time.
2. **Data Integrity:** By allowing the save but automatically revoking the conflicting claims, the system immediately guarantees that the schedule remains logically sound (no staff member is scheduled for two places at once).
3. **Visibility:** The system returns an `impactReport` when the shift updates. The UI surfaces this report to the manager as an alert (e.g., "⚠️ X claims revoked due to new time conflict"), immediately notifying them that they need to find replacement staff for those specific roles.

### Technical Implementation

- During the `updateShift` operation in `dataStore.ts`, the system iterates over every existing claim for the modified shift.
- It uses a robust Date-interval intersection check (`startA < endB && startB < endA`) that fully supports multi-day and overnight shifts.
- If an overlap is detected with any of the user's *other* claims, the conflicting claim on the currently-editing shift is deleted.
- The manager is notified via the `revokedClaims` payload returned in the API response, which surfaces a clear warning in the `ShiftFormModal` interface.
