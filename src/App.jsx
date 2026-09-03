import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import UserPortal from './components/UserPortal';
import ProjectorView from './components/ProjectorView';
import { socket } from './utils/socket';
import { sounds } from './utils/sound';

export default function App() {
  // Check if opened via QR scan link (e.g. ?token=JAMAL-XXXX)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialToken = urlParams?.get('token') || '';

  const [activeTab, setActiveTab] = useState(initialToken ? 'user' : 'admin');
  const [session, setSession] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [roster, setRoster] = useState([]);
  const [guests, setGuests] = useState([]);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [notification, setNotification] = useState(null);

  // Fetch initial data & network IPs
  const fetchData = async () => {
    try {
      const [sessionRes, rosterRes, netRes] = await Promise.all([
        fetch('/api/session'),
        fetch('/api/roster'),
        fetch('/api/network-info'),
      ]);

      if (sessionRes.ok) {
        const data = await sessionRes.json();
        setSession(data.session);
        setQrData(data.qr);
      }

      if (rosterRes.ok) {
        const data = await rosterRes.json();
        setRoster(data.roster || []);
        setGuests(data.guests || []);
      }

      if (netRes.ok) {
        const data = await netRes.json();
        setNetworkInfo(data);
      }

      // Also get initial attendance and visitors
      const [attRes, visRes] = await Promise.all([
        fetch('/api/attendance'),
        fetch('/api/visitors'),
      ]);

      if (attRes.ok) {
        const data = await attRes.json();
        setAttendance(data.attendance || []);
      }

      if (visRes.ok) {
        const data = await visRes.json();
        setVisitors(data.visitors || []);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup Socket.IO Event Listeners
    socket.on('connect', () => {
      console.log('Connected to attendance server');
    });

    socket.on('init_state', (data) => {
      if (data.session) setSession(data.session);
      if (data.qr) setQrData(data.qr);
      if (data.attendance) setAttendance(data.attendance);
      if (data.visitors) setVisitors(data.visitors);
    });

    // Dynamic QR rotation event
    socket.on('qr_rotated', (data) => {
      setQrData(data);
    });

    // Real-Time Verified Attendance Event! (Triggers sound & toast)
    socket.on('attendance_new', ({ record }) => {
      setAttendance((prev) => [record, ...prev.filter((a) => a.id !== record.id)]);
      sounds.playSuccess();

      // Show notification toast
      setNotification({
        type: 'attendance',
        title: 'Presensi Baru Terverifikasi!',
        message: `${record.name} telah berhasil absen (✓ Centang Hijau)`,
      });
      setTimeout(() => setNotification(null), 5000);

      // Refresh roster status
      fetch('/api/roster')
        .then((res) => res.json())
        .then((data) => {
          setRoster(data.roster || []);
          setGuests(data.guests || []);
        })
        .catch((e) => console.error(e));
    });

    // Real-Time Visitor Entry Event! (When user inputs name on site)
    socket.on('visitor_new', (visitor) => {
      setVisitors((prev) => [visitor, ...prev]);
      sounds.playVisitorPop();
    });

    socket.on('session_updated', (data) => {
      setSession(data.session);
      setAttendance([]);
      setVisitors([]);
      fetchData();
    });

    socket.on('roster_updated', () => {
      fetch('/api/roster')
        .then((res) => res.json())
        .then((data) => {
          setRoster(data.roster || []);
          setGuests(data.guests || []);
        });
    });

    return () => {
      socket.off('connect');
      socket.off('init_state');
      socket.off('qr_rotated');
      socket.off('attendance_new');
      socket.off('visitor_new');
      socket.off('session_updated');
      socket.off('roster_updated');
    };
  }, []);

  // Handlers for session and roster
  const handleResetSession = async (formData) => {
    try {
      const res = await fetch('/api/session/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setAttendance([]);
        setVisitors([]);
      }
    } catch (e) {
      console.error('Reset session error:', e);
    }
  };

  const handleAddMember = async (memberData) => {
    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {
      console.error('Add member error:', e);
    }
  };

  const handleDeleteMember = async (id) => {
    try {
      const res = await fetch(`/api/roster/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error('Delete member error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Toast Notification Alert */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-2xl bg-emerald-900/90 text-white border border-emerald-400/40 shadow-2xl shadow-emerald-950/60 flex items-center space-x-3 animate-bounce">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-base">
            ✓
          </div>
          <div>
            <h5 className="font-bold text-xs text-emerald-200">{notification.title}</h5>
            <p className="text-xs text-white">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Render Views */}
      {activeTab === 'projector' ? (
        <ProjectorView
          session={session}
          qrData={qrData}
          attendance={attendance}
          roster={roster}
          networkInfo={networkInfo}
          onClose={() => setActiveTab('admin')}
        />
      ) : (
        <>
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            networkInfo={networkInfo}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {activeTab === 'admin' && (
              <AdminDashboard
                session={session}
                qrData={qrData}
                attendance={attendance}
                visitors={visitors}
                roster={roster}
                guests={guests}
                networkInfo={networkInfo}
                onResetSession={handleResetSession}
                onAddMember={handleAddMember}
                onDeleteMember={handleDeleteMember}
                onFullscreenProjector={() => setActiveTab('projector')}
              />
            )}

            {activeTab === 'user' && (
              <UserPortal
                session={session}
                initialToken={initialToken}
              />
            )}
          </main>
        </>
      )}

    </div>
  );
}
