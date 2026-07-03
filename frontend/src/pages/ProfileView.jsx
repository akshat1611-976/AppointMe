import { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

export default function ProfileView() {
  const [profile, setProfile] = useState({ username: '', email: '', bookings: [] });
  const [adminData, setAdminData] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming'); 
  const role = localStorage.getItem('role');

  useEffect(() => {
    if (role === 'admin') {
      fetchAdminStats();
    } else {
      fetchProfile();
    }
  }, [role]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/appointments/me', { headers: { Authorization: `Bearer ${token}` }});
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to load profile', err);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/appointments/admin/stats', { headers: { Authorization: `Bearer ${token}` }});
      setAdminData(res.data);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/appointments/${bookingId}`, { headers: { Authorization: `Bearer ${token}` }});
      setProfile(prev => ({ ...prev, bookings: prev.bookings.filter(b => b.id !== bookingId) }));
    } catch (err) {
      alert('Failed to cancel booking.');
    }
  };

  // --- RENDER ADMIN ANALYTICS HUB ---
  if (role === 'admin' && adminData) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px', padding: '30px', backgroundColor: '#121214', borderRadius: '12px', border: '1px solid #00e5ff', boxShadow: '0 0 20px rgba(0, 229, 255, 0.05)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#00e5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px', fontWeight: '900', color: '#09090b', textTransform: 'uppercase' }}>
            {adminData.username ? adminData.username.charAt(0) : 'A'}
          </div>
          <div>
            <h1 style={{ margin: '0 0 5px 0', color: '#fff', textTransform: 'capitalize' }}>{adminData.username} (Admin)</h1>
            <p style={{ margin: 0, color: '#00e5ff', fontFamily: 'monospace', fontSize: '16px' }}>{adminData.email}</p>
          </div>
        </div>

        <h3 style={{ color: '#e4e4e7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Lifetime Analytics</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ padding: '25px', backgroundColor: '#121214', border: '1px solid #27272a', borderRadius: '12px' }}>
            <div style={{ color: '#a1a1aa', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>TOTAL CLIENTS</div>
            <div style={{ color: '#fff', fontSize: '36px', fontWeight: '900' }}>{adminData.stats.total_clients}</div>
          </div>
          <div style={{ padding: '25px', backgroundColor: '#121214', border: '1px solid #27272a', borderRadius: '12px' }}>
            <div style={{ color: '#a1a1aa', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>TOTAL BOOKINGS</div>
            <div style={{ color: '#fff', fontSize: '36px', fontWeight: '900' }}>{adminData.stats.total_bookings}</div>
          </div>
          <div style={{ padding: '25px', backgroundColor: '#121214', border: '1px solid #27272a', borderRadius: '12px' }}>
            <div style={{ color: '#a1a1aa', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>MOST POPULAR DAY</div>
            <div style={{ color: '#00e5ff', fontSize: '28px', fontWeight: '900', textTransform: 'uppercase' }}>{adminData.stats.popular_day}</div>
          </div>
        </div>

        <h3 style={{ color: '#e4e4e7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Recently Locked Vectors</h3>
        {adminData.recent_bookings.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', border: '1px dashed #3f3f46', borderRadius: '8px', color: '#71717a' }}>No network activity recorded.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {adminData.recent_bookings.map((b) => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#121214', border: '1px solid #27272a', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '18px' }}>{b.guest_name}</h4>
                  <p style={{ margin: 0, color: '#a1a1aa', fontFamily: 'monospace', fontSize: '14px' }}>{b.guest_email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#00e5ff', fontWeight: 'bold', marginBottom: '5px' }}>{dayjs(b.booking_date).format('MMM D, YYYY')}</div>
                  <div style={{ color: '#71717a', fontSize: '14px', fontFamily: 'monospace' }}>{b.start_time.substring(0,5)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- RENDER STANDARD CLIENT PROFILE ---
  const now = dayjs();
  const upcomingBookings = profile.bookings.filter(b => dayjs(`${dayjs(b.booking_date).format('YYYY-MM-DD')}T${b.start_time}`).isAfter(now));
  const pastBookings = profile.bookings.filter(b => dayjs(`${dayjs(b.booking_date).format('YYYY-MM-DD')}T${b.start_time}`).isBefore(now));
  const displayBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px', padding: '30px', backgroundColor: '#121214', borderRadius: '12px', border: '1px solid #27272a' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(0, 229, 255, 0.1)', border: '2px solid #00e5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 'bold', color: '#00e5ff', textTransform: 'uppercase' }}>
          {profile.username ? profile.username.charAt(0) : '?'}
        </div>
        <div>
          <h1 style={{ margin: '0 0 5px 0', color: '#fff', textTransform: 'capitalize' }}>{profile.username || 'User Profile'}</h1>
          <p style={{ margin: 0, color: '#a1a1aa', fontFamily: 'monospace', fontSize: '16px' }}>{profile.email}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #27272a', paddingBottom: '15px' }}>
        <button onClick={() => setActiveTab('upcoming')} style={{ padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', backgroundColor: 'transparent', border: 'none', color: activeTab === 'upcoming' ? '#00e5ff' : '#a1a1aa', cursor: 'pointer', position: 'relative' }}>
          Upcoming Vectors ({upcomingBookings.length})
          {activeTab === 'upcoming' && <div style={{ position: 'absolute', bottom: '-16px', left: 0, width: '100%', height: '3px', backgroundColor: '#00e5ff', borderRadius: '3px' }}></div>}
        </button>
        <button onClick={() => setActiveTab('past')} style={{ padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', backgroundColor: 'transparent', border: 'none', color: activeTab === 'past' ? '#fff' : '#a1a1aa', cursor: 'pointer', position: 'relative' }}>
          Past Telemetry ({pastBookings.length})
          {activeTab === 'past' && <div style={{ position: 'absolute', bottom: '-16px', left: 0, width: '100%', height: '3px', backgroundColor: '#fff', borderRadius: '3px' }}></div>}
        </button>
      </div>
      
      {displayBookings.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed #3f3f46', borderRadius: '8px', color: '#71717a', backgroundColor: '#121214' }}>
          No {activeTab} bookings found on this network.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {displayBookings.map((b) => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#121214', border: '1px solid #27272a', borderRadius: '8px', transition: 'transform 0.2s' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '18px' }}>{dayjs(b.booking_date).format('dddd, MMMM D, YYYY')}</h4>
                <p style={{ margin: 0, color: '#00e5ff', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '16px' }}>{b.start_time.substring(0, 5)} - {b.end_time.substring(0, 5)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', backgroundColor: activeTab === 'past' ? '#3f3f46' : 'rgba(16, 185, 129, 0.1)', color: activeTab === 'past' ? '#a1a1aa' : '#10b981' }}>
                  {activeTab === 'past' ? 'COMPLETED' : 'LOCKED IN'}
                </div>
                {activeTab === 'upcoming' && (
                  <button onClick={() => handleCancel(b.id)} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' }} onMouseOver={(e) => { e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)' }} onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent' }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}