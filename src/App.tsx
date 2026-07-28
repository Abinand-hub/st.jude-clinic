import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { Header } from './components/Header.js';
import { CoverageDashboard } from './components/CoverageDashboard.js';
import { ManagerDashboard } from './components/ManagerDashboard.js';
import { MyShiftsView } from './components/MyShiftsView.js';
import { ShiftWithClaims } from './types.js';
import { ShiftDetailModal } from './components/ShiftDetailModal.js';
import { ShiftFormModal } from './components/ShiftFormModal.js';

export default function App() {
  const { currentUser, isManager } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'myshifts' | 'roster' | 'import' | 'policy'>('dashboard');

  useEffect(() => {
    if (currentUser) {
      if (isManager) {
        setActiveTab('dashboard');
      } else {
        setActiveTab('dashboard'); // Both use dashboard (Available Shifts view) by default
      }
    }
  }, [currentUser, isManager]);
  const [shifts, setShifts] = useState<ShiftWithClaims[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentVersion, setCurrentVersion] = useState<number>(0);

  // Modal states
  const [selectedShift, setSelectedShift] = useState<ShiftWithClaims | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingShift, setEditingShift] = useState<ShiftWithClaims | null>(null);
  const [defaultDateForNewShift, setDefaultDateForNewShift] = useState<string | undefined>(undefined);

  const fetchShifts = useCallback(async () => {
    try {
      const res = await fetch('/api/shifts');
      if (res.ok) {
        const data = await res.json();
        setShifts(data.shifts || []);
        if (data.version) {
          setCurrentVersion(data.version);
        }

        // If modal shift is open, keep its state updated
        setSelectedShift((prev) => {
          if (!prev) return null;
          const updated = (data.shifts || []).find((s: ShiftWithClaims) => s.id === prev.id);
          return updated || prev;
        });
      }
    } catch (err) {
      console.error('Failed to fetch shifts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  // Live Auto-Update Polling (Every 3 Seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/version');
        if (res.ok) {
          const data = await res.json();
          if (data.version && data.version !== currentVersion) {
            fetchShifts();
          }
        }
      } catch (err) {
        // Silent poll error
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentVersion, fetchShifts]);

  const handleOpenCreateShift = (dateStr?: string) => {
    setEditingShift(null);
    setDefaultDateForNewShift(dateStr);
    setIsFormModalOpen(true);
  };

  const handleOpenEditShift = (shift: ShiftWithClaims) => {
    setEditingShift(shift);
    setIsFormModalOpen(true);
  };

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
      <div id="app-root-layout" className="min-h-screen bg-white text-slate-900 font-sans flex flex-col antialiased">
        {/* Main Sticky Header with Persona Switcher & Navigation Tabs */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewShiftModal={() => handleOpenCreateShift()}
        />

        {/* Main Content Body */}
        <main id="main-content-area" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'dashboard' && isManager && (
            <ManagerDashboard
              shifts={shifts}
              loading={loading}
              onRefresh={fetchShifts}
              onSelectShift={(s) => setSelectedShift(s)}
              onOpenCreateShiftModal={(d) => handleOpenCreateShift(d)}
            />
          )}

          {activeTab === 'dashboard' && !isManager && (
            <CoverageDashboard
              shifts={shifts}
              loading={loading}
              onRefresh={fetchShifts}
              onSelectShift={(s) => setSelectedShift(s)}
              onOpenCreateShiftModal={(d) => handleOpenCreateShift(d)}
            />
          )}

          {activeTab === 'myshifts' && (
            <MyShiftsView
              shifts={shifts}
              onRefresh={fetchShifts}
              onSelectShift={(s) => setSelectedShift(s)}
            />
          )}
        </main>

        {/* Footer */}
        <footer id="app-footer" className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>🏥 St. Jude Clinic — Staff Shift & Coverage OS</span>
            <span className="font-mono text-[11px] text-slate-400">Server-Enforced Business Rules • Atomic Locks • Real-time Polling</span>
          </div>
        </footer>

        {/* Shift Details Modal */}
        {selectedShift && (
          <ShiftDetailModal
            shift={selectedShift}
            onClose={() => setSelectedShift(null)}
            onRefresh={fetchShifts}
            onEditShift={(s) => handleOpenEditShift(s)}
          />
        )}

        {/* Shift Creation / Editing Form Modal */}
        {isFormModalOpen && (
          <ShiftFormModal
            initialShift={editingShift}
            defaultDate={defaultDateForNewShift}
            onClose={() => setIsFormModalOpen(false)}
            onRefresh={fetchShifts}
          />
        )}
      </div>
  );
}
