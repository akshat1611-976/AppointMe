import { useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

export default function GuestView() {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [message, setMessage] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const fetchSlots = async (selectedDate) => {
    setDate(selectedDate);
    setSelectedSlot('');
    setMessage('');
    setHasSearched(true);
    try {
      const res = await axios.get(`/api/appointments/slots?date=${selectedDate}`);
      setSlots(res.data.slots);
    } catch (err) {
      setMessage('Failed to fetch slots.');
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/appointments/book', {
        guestName: formData.name,
        guestEmail: formData.email,
        bookingDate: date,
        startTime: selectedSlot
      });
      setMessage('Success! Vector locked in.');
      
      // Update the UI immediately to show this slot as unavailable
      setSlots(slots.map(s => s.time === selectedSlot ? { ...s, available: false } : s)); 
      setSelectedSlot('');
      setFormData({ name: '', email: '' });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Booking sequence failed.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '40px', padding: '30px', backgroundColor: '#121214', border: '1px solid #00e5ff', borderRadius: '12px', boxShadow: '0 0 20px rgba(0, 229, 255, 0.1)' }}>
        <h2 style={{ color: '#00e5ff', marginTop: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#00e5ff', borderRadius: '50%' }}></span>
          Initialize Booking Vector
        </h2>
        <p style={{ color: '#a1a1aa', marginBottom: '20px' }}>Select a target date to scan for available network slots.</p>
        
        <input 
          type={date ? "date" : "text"} 
          placeholder="Click to select target date 🗓️"
          onFocus={(e) => e.target.type = 'date'}
          onBlur={(e) => { if (!date) e.target.type = 'text'; }}
          value={date} 
          min={dayjs().format('YYYY-MM-DD')}
          onChange={(e) => fetchSlots(e.target.value)} 
          style={{ 
            padding: '20px', fontSize: '20px', backgroundColor: '#09090b', color: '#fff', 
            border: '2px solid #3f3f46', borderRadius: '8px', width: '100%', outline: 'none',
            colorScheme: 'dark', cursor: 'pointer', boxSizing: 'border-box'
          }}
        />
      </div>

      {message && (
        <div style={{ padding: '15px', marginBottom: '20px', borderLeft: `4px solid ${message.includes('Success') ? '#10b981' : '#ef4444'}`, backgroundColor: '#18181b', color: message.includes('Success') ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>
          {message}
        </div>
      )}

{hasSearched && date && (
        <div style={{ marginBottom: '40px', animation: 'fadeIn 0.5s ease-in' }}>
          
          {/* NEW: Title and Duration Badge Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' }}>
            <h3 style={{ color: '#e4e4e7', margin: 0, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Telemetry for {dayjs(date).format('MMM D, YYYY')}
            </h3>
            {slots.length > 0 && (
              <span style={{ backgroundColor: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>
                DURATION: {slots[0] ? dayjs(`2000-01-01T${slots[0].endTime}`).diff(dayjs(`2000-01-01T${slots[0].time}`), 'minute') : 30} MIN
              </span>
            )}
          </div>

          {slots.length === 0 ? (
            <div style={{ padding: '20px', border: '1px dashed #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', color: '#ef4444', textAlign: 'center' }}>
              Host is unavailable on this day or all vectors have elapsed.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {slots.map(slot => (
                <button 
                  key={slot.time} 
                  disabled={!slot.available}
                  onClick={() => slot.available && setSelectedSlot(slot.time)}
                  style={{
                    padding: '12px', fontSize: '15px', fontWeight: '600', fontFamily: 'monospace',
                    backgroundColor: !slot.available ? '#09090b' : (selectedSlot === slot.time ? 'rgba(0, 229, 255, 0.1)' : '#18181b'),
                    color: !slot.available ? '#3f3f46' : (selectedSlot === slot.time ? '#00e5ff' : '#e4e4e7'),
                    border: `1px solid ${!slot.available ? '#18181b' : (selectedSlot === slot.time ? '#00e5ff' : '#3f3f46')}`,
                    borderRadius: '6px', 
                    cursor: !slot.available ? 'not-allowed' : 'pointer', 
                    transition: 'all 0.2s ease',
                    opacity: !slot.available ? 0.5 : 1,
                    boxShadow: selectedSlot === slot.time ? '0 0 15px rgba(0, 229, 255, 0.2)' : 'none'
                  }}
                >
                  {/* NEW: Unambiguous Time Formatting */}
                  <div style={{ textDecoration: !slot.available ? 'line-through' : 'none' }}>
                    {slot.time} - {slot.endTime}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSlot && (
        <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '25px', backgroundColor: '#121214', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#fff', fontWeight: '600' }}>Confirm Identity</h3>
            <span style={{ backgroundColor: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', padding: '4px 10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>
              {selectedSlot}
            </span>
          </div>
          <input type="text" placeholder="System Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: '18px', fontSize: '18px', backgroundColor: '#09090b', color: '#fff', border: '1px solid #3f3f46', borderRadius: '8px', outline: 'none' }} />
          <input type="email" placeholder="Contact Node (Email)" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '18px', fontSize: '18px', backgroundColor: '#09090b', color: '#fff', border: '1px solid #3f3f46', borderRadius: '8px', outline: 'none' }} />
          <button type="submit" style={{ padding: '18px', marginTop: '10px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', transition: 'transform 0.1s' }}>
            Execute Booking
          </button>
        </form>
      )}
    </div>
  );
}