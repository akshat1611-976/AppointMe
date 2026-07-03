import { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

export default function HostView() {
  const [bookings, setBookings] = useState([]);
  const [settings, setSettings] = useState([]);
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' or 'settings'

  useEffect(() => {
    fetchBookings();
    fetchSettings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/appointments/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/appointments/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const handleUpdateSetting = async (id, field, value) => {
    // Optimistically update the UI
    const updatedSettings = settings.map(s => s.id === id ? { ...s, [field]: value } : s);
    setSettings(updatedSettings);

    const targetSetting = updatedSettings.find(s => s.id === id);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/appointments/settings/${id}`, {
        is_active: targetSetting.is_active,
        slot_duration: targetSetting.slot_duration,
        start_time: targetSetting.start_time,
        end_time: targetSetting.end_time,
        break_start: targetSetting.break_start,
        break_end: targetSetting.break_end
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      alert('Failed to sync setting to database.');
      fetchSettings(); // Revert on failure
    }
  };

  const now = dayjs();
  const upcomingBookings = bookings.filter(b => dayjs(`${dayjs(b.booking_date).format('YYYY-MM-DD')}T${b.start_time}`).isAfter(now));
  const pastBookings = bookings.filter(b => dayjs(`${dayjs(b.booking_date).format('YYYY-MM-DD')}T${b.start_time}`).isBefore(now));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-1px' }}>Command Center</h1>
          <p style={{ color: '#a1a1aa', margin: 0 }}>Global network telemetry and configuration.</p>
        </div>
        <div style={{ padding: '8px 16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', border: '1px solid #10b981' }}>
          ADMIN CLEARANCE ACTIVE
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid #27272a', paddingBottom: '15px' }}>
        <button 
          onClick={() => setActiveTab('telemetry')}
          style={{ padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', backgroundColor: 'transparent', border: 'none', color: activeTab === 'telemetry' ? '#00e5ff' : '#a1a1aa', cursor: 'pointer', position: 'relative' }}
        >
          Network Telemetry
          {activeTab === 'telemetry' && <div style={{ position: 'absolute', bottom: '-16px', left: 0, width: '100%', height: '3px', backgroundColor: '#00e5ff', borderRadius: '3px' }}></div>}
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          style={{ padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', backgroundColor: 'transparent', border: 'none', color: activeTab === 'settings' ? '#00e5ff' : '#a1a1aa', cursor: 'pointer', position: 'relative' }}
        >
          System Configuration
          {activeTab === 'settings' && <div style={{ position: 'absolute', bottom: '-16px', left: 0, width: '100%', height: '3px', backgroundColor: '#00e5ff', borderRadius: '3px' }}></div>}
        </button>
      </div>

      {/* VIEW 1: TELEMETRY (Bookings) */}
      {activeTab === 'telemetry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Upcoming Bookings */}
          <div>
            <h3 style={{ color: '#e4e4e7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Upcoming Vectors ({upcomingBookings.length})</h3>
            {upcomingBookings.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed #3f3f46', borderRadius: '8px', color: '#71717a', backgroundColor: '#121214' }}>No upcoming network activity.</div>
            ) : (
              <div style={{ border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#121214' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#09090b', borderBottom: '1px solid #27272a' }}>
                      <th style={{ padding: '15px 20px', color: '#a1a1aa', fontSize: '12px', textTransform: 'uppercase' }}>Date & Time</th>
                      <th style={{ padding: '15px 20px', color: '#a1a1aa', fontSize: '12px', textTransform: 'uppercase' }}>Identity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingBookings.map((b, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #27272a' }}>
                        <td style={{ padding: '15px 20px' }}>
                          <div style={{ color: '#e4e4e7', fontWeight: 'bold' }}>{dayjs(b.booking_date).format('MMM D, YYYY')}</div>
                          <div style={{ color: '#00e5ff', fontFamily: 'monospace', fontSize: '14px', marginTop: '4px' }}>{b.start_time.substring(0, 5)} - {b.end_time.substring(0, 5)}</div>
                        </td>
                        <td style={{ padding: '15px 20px' }}>
                          <div style={{ color: '#fff', fontWeight: '600' }}>{b.guest_name}</div>
                          <div style={{ color: '#a1a1aa', fontSize: '14px' }}>{b.guest_email}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Past Bookings */}
          <div>
            <h3 style={{ color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Archived Logs ({pastBookings.length})</h3>
            {pastBookings.length > 0 && (
              <div style={{ border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#121214', opacity: 0.7 }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <tbody>
                    {pastBookings.map((b, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #27272a' }}>
                        <td style={{ padding: '15px 20px', width: '200px' }}>
                          <div style={{ color: '#a1a1aa' }}>{dayjs(b.booking_date).format('MMM D, YYYY')}</div>
                          <div style={{ color: '#71717a', fontFamily: 'monospace', fontSize: '14px' }}>{b.start_time.substring(0, 5)}</div>
                        </td>
                        <td style={{ padding: '15px 20px' }}>
                          <div style={{ color: '#a1a1aa' }}>{b.guest_name} <span style={{ color: '#71717a', fontSize: '14px', marginLeft: '10px' }}>({b.guest_email})</span></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: SYSTEM CONFIGURATION */}
      {activeTab === 'settings' && (
        <div style={{ backgroundColor: '#121214', border: '1px solid #27272a', borderRadius: '12px', padding: '30px' }}>
          <h3 style={{ color: '#e4e4e7', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Schedule Parameters</h3>
          <p style={{ color: '#a1a1aa', marginBottom: '30px' }}>Changes made here instantly update the public client portal.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {settings.map((day) => (
              <div key={day.id} style={{ display: 'flex', flexDirection: 'column', padding: '30px', backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '12px', gap: '20px' }}>
                
                {/* Supersized Day Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: day.is_active ? '#fff' : '#71717a', fontSize: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {day.day_of_week}
                  </h4>
                  <button onClick={() => handleUpdateSetting(day.id, 'is_active', !day.is_active)} style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '900', borderRadius: '6px', backgroundColor: day.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: day.is_active ? '#10b981' : '#ef4444', border: `2px solid ${day.is_active ? '#10b981' : '#ef4444'}`, cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    {day.is_active ? 'DAY ONLINE' : 'DAY OFFLINE'}
                  </button>
                </div>

                {/* Supersized Inputs */}
                {day.is_active && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'flex-end', backgroundColor: '#121214', padding: '25px', borderRadius: '10px', border: '1px solid #27272a' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: 'bold', letterSpacing: '1px' }}>WORK HOURS</label>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <input type="time" value={day.start_time?.substring(0,5) || ''} onChange={(e) => handleUpdateSetting(day.id, 'start_time', e.target.value)} style={{ padding: '12px', fontSize: '16px', backgroundColor: '#09090b', color: '#fff', border: '2px solid #3f3f46', borderRadius: '6px', colorScheme: 'dark', outline: 'none' }} />
                        <span style={{ color: '#71717a', fontWeight: 'bold' }}>to</span>
                        <input type="time" value={day.end_time?.substring(0,5) || ''} onChange={(e) => handleUpdateSetting(day.id, 'end_time', e.target.value)} style={{ padding: '12px', fontSize: '16px', backgroundColor: '#09090b', color: '#fff', border: '2px solid #3f3f46', borderRadius: '6px', colorScheme: 'dark', outline: 'none' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: 'bold', letterSpacing: '1px' }}>LUNCH / BREAK</label>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <input type="time" value={day.break_start ? day.break_start.substring(0,5) : ''} onChange={(e) => handleUpdateSetting(day.id, 'break_start', e.target.value)} style={{ padding: '12px', fontSize: '16px', backgroundColor: '#09090b', color: '#fff', border: '2px solid #3f3f46', borderRadius: '6px', colorScheme: 'dark', outline: 'none' }} />
                        <span style={{ color: '#71717a', fontWeight: 'bold' }}>to</span>
                        <input type="time" value={day.break_end ? day.break_end.substring(0,5) : ''} onChange={(e) => handleUpdateSetting(day.id, 'break_end', e.target.value)} style={{ padding: '12px', fontSize: '16px', backgroundColor: '#09090b', color: '#fff', border: '2px solid #3f3f46', borderRadius: '6px', colorScheme: 'dark', outline: 'none' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: 'bold', letterSpacing: '1px' }}>SLOT DURATION</label>
                      <select value={day.slot_duration} onChange={(e) => handleUpdateSetting(day.id, 'slot_duration', parseInt(e.target.value))} style={{ padding: '12px', fontSize: '16px', backgroundColor: '#09090b', color: '#00e5ff', border: '2px solid #3f3f46', borderRadius: '6px', fontWeight: '900', outline: 'none', cursor: 'pointer' }}>
                        <option value={15}>15 MIN</option>
                        <option value={30}>30 MIN</option>
                        <option value={45}>45 MIN</option>
                        <option value={60}>60 MIN</option>
                      </select>
                    </div>

                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}