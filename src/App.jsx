import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import UserPortal from './components/UserPortal';
import ProjectorView from './components/ProjectorView';
import { socket } from './utils/socket';
import { sounds } from './utils/sound';
import { clientEngine } from './utils/clientEngine';

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
  const [networkInfo, setNetworkInfo] = useState({ primaryIp: window.location.hostname });
  const [notification, setNotification] = useState(null);

  // Fallback to local client engine
  const loadFromClientEngine = () => {
    const s = clientEngine.getSession();
    const q = clientEngine.getCurrentQR();
    const r = clientEngine.getRoster();
    const a = clientEngine.getAttendance();
    const v = clientEngine.getVisitors();

    setSession(s);
    setQrData(q);
    setAttendance(a);
    setVisitors(v);

    const attendedSet = new Set(a.map((item) => item.name.toLowerCase()));
    const rosterWithStatus = r.map((p) => ({
      ...p,
      attended: attendedSet.has(p.name.toLowerCase()),
      attendanceRecord: a.find((item) => item.name.toLowerCase() === p.name.toLowerCase()) || null,
    }));
    setRoster(rosterWithStatus);
  };

  // Fetch data with automatic fallback for GitHub Pages
  const fetchData = async () => {
    try {
      const sessionRes = await fetch('/api/session');
      if (sessionRes.ok) {
        const data = await sessionRes.json();
        setSession(data.session);
        setQrData(data.qr);

        const [rosterRes, netRes, attRes, visRes] = await Promise.all([
          fetch('/api/roster'),
          fetch('/api/network-info'),
          fetch('/api/attendance'),
          fetch('/api/visitors'),
        ]);

        if (rosterRes.ok) {
          const rData = await rosterRes.json();
          setRoster(rData.roster || []);
          setGuests(rData.guests || []);
        }
        if (netRes.ok) {
          const nData = await netRes.json();
          setNetworkInfo(nData);
        }
        if (attRes.ok) {
          const aData = await attRes.json();
          setAttendance(aData.attendance || []);
        }
        if (visRes.ok) {
          const vData = await visRes.json();
          setVisitors(vData.visitors || []);
        }
        return;
      }
    } catch (err) {
      // Backend not running (e.g. GitHub Pages) -> Use client engine
    }
    loadFromClientEngine();
  };

  useEffect(() => {
    fetchData();

    // 1. Socket.IO Listeners (When running with Node server)
    socket.on('init_state', (data) => {
      if (data.session) setSession(data.session);
      if (data.qr) setQrData(data.qr);
      if (data.attendance) setAttendance(data.attendance);
      if (data.visitors) setVisitors(data.visitors);
    });

    socket.on('qr_rotated', (data) => {
      setQrData(data);
    });

    socket.on('attendance_new', ({ record }) => {
      setAttendance((prev) => [record, ...prev.filter((a) => a.id !== record.id)]);
      sounds.playSuccess();
      setNotification({
        type: 'attendance',
        title: 'Presensi Baru Terverifikasi!',
        message: `${record.name} telah berhasil absen (✓ Centang Hijau)`,
      });
      setTimeout(() => setNotification(null), 5000);
      fetchData();
    });

    socket.on('visitor_new', (visitor) => {
      setVisitors((prev) => [visitor, ...prev]);
      sounds.playVisitorPop();
    });

    socket.on('session_updated', (data) => {
      setSession(data.session);
      fetchData();
    });

    socket.on('roster_updated', () => {
      fetchData();
    });

    // 2. ClientEngine Listeners (When running standalone on GitHub Pages)
    clientEngine.on('qr_rotated', (data) => {
      setQrData(data);
    });

    clientEngine.on('attendance_new', ({ record }) => {
      setAttendance((prev) => [record, ...prev.filter((a) => a.id !== record.id)]);
      sounds.playSuccess();
      setNotification({
        type: 'attendance',
        title: 'Presensi Baru Terverifikasi!',
        message: `${record.name} telah berhasil absen (✓ Centang Hijau)`,
      });
      setTimeout(() => setNotification(null), 5000);
      loadFromClientEngine();
    });

    clientEngine.on('visitor_new', (visitor) => {
      setVisitors((prev) => [visitor, ...prev]);
      sounds.playVisitorPop();
    });

    clientEngine.on('session_updated', () => {
      loadFromClientEngine();
    });

    clientEngine.on('roster_updated', () => {
      loadFromClientEngine();
    });

    return () => {
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
      if (res.ok) {
        fetchData();
        return;
      }
    } catch (e) {}
    clientEngine.resetSession(formData);
    loadFromClientEngine();
  };

  const handleAddMember = async (memberData) => {
    try {
      const res = await fetch('/api/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      if (res.ok) {
        fetchData();
        return;
      }
    } catch (e) {}
    clientEngine.addRoster(memberData);
    loadFromClientEngine();
  };

  const handleDeleteMember = async (id) => {
    try {
      const res = await fetch(`/api/roster/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
        return;
      }
    } catch (e) {}
    clientEngine.deleteRoster(id);
    loadFromClientEngine();
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
