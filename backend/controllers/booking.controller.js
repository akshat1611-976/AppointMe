const pool = require('../config/db');
const dayjs = require('dayjs');

// 1. Calculate and fetch available slots dynamically
const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query; 
    if (!date) return res.status(400).json({ message: 'Date parameter is required.' });

    const dayOfWeek = dayjs(`${date}T12:00:00`).format('dddd');

    // Fetch the new settings from the database, including breaks
    const [availability] = await pool.query(
      'SELECT start_time, end_time, break_start, break_end, is_active, slot_duration FROM availability WHERE day_of_week = ?',
      [dayOfWeek]
    );

    // If the day doesn't exist OR the admin turned it off (is_active = false)
    if (availability.length === 0 || !availability[0].is_active) {
      return res.json({ date, slots: [], duration: 0 }); 
    }

    const hostStart = availability[0].start_time; 
    const hostEnd = availability[0].end_time;     
    const duration = availability[0].slot_duration; 

    // Setup Break Variables
    const bStartStr = availability[0].break_start;
    const bEndStr = availability[0].break_end;
    const bStart = bStartStr ? dayjs(`${date}T${bStartStr}`) : null;
    const bEnd = bEndStr ? dayjs(`${date}T${bEndStr}`) : null;

    const [existingBookings] = await pool.query(
      'SELECT start_time FROM bookings WHERE booking_date = ?', [date]
    );
    const bookedSlots = existingBookings.map(b => b.start_time.substring(0, 5)); 

    const generatedSlots = [];
    let currentTime = dayjs(`${date}T${hostStart}`);
    const endTimeLimit = dayjs(`${date}T${hostEnd}`);
    
    const isToday = dayjs().format('YYYY-MM-DD') === date;
    const now = dayjs();

    while (currentTime.isBefore(endTimeLimit)) {
      const slotStart = currentTime.format('HH:mm');
      const slotEndObj = currentTime.add(duration, 'minute');
      const slotEnd = slotEndObj.format('HH:mm');
      
      // BREAK COLLISION DETECTION
      let overlapsBreak = false;
      if (bStart && bEnd) {
        if (currentTime.isBefore(bEnd) && slotEndObj.isAfter(bStart)) {
          overlapsBreak = true;
        }
      }
      
      // Push if not overlapping a break and not in the past
      if (!overlapsBreak && !(isToday && currentTime.isBefore(now))) {
        generatedSlots.push({
          time: slotStart,
          endTime: slotEnd,
          available: !bookedSlots.includes(slotStart) 
        });
      }
      
      // Jump forward by the dynamic duration
      currentTime = currentTime.add(duration, 'minute');
    }

    res.json({ date, slots: generatedSlots, duration });
  } catch (err) {
    console.error('Error generating slots:', err);
    res.status(500).json({ message: 'Internal server error while compiling slots.' });
  }
};

// 2. Submit a new appointment (Dynamic End Time)
const createBooking = async (req, res) => {
  try {
    const { guestName, guestEmail, bookingDate, startTime } = req.body;

    if (!guestName || !guestEmail || !bookingDate || !startTime) {
      return res.status(400).json({ message: 'All booking fields are strictly required.' });
    }

    // Look up the duration for this specific day so we save the right end_time
    const dayOfWeek = dayjs(`${bookingDate}T12:00:00`).format('dddd');
    const [[avail]] = await pool.query('SELECT slot_duration FROM availability WHERE day_of_week = ?', [dayOfWeek]);
    const duration = avail ? avail.slot_duration : 30;

    const startDateTime = dayjs(`${bookingDate}T${startTime}`);
    const endTime = startDateTime.add(duration, 'minute').format('HH:mm:00');
    const formattedStartTime = startDateTime.format('HH:mm:00');

    await pool.query(
      `INSERT INTO bookings (guest_name, guest_email, booking_date, start_time, end_time) 
       VALUES (?, ?, ?, ?, ?)`,
      [guestName, guestEmail, bookingDate, formattedStartTime, endTime]
    );

    res.status(201).json({ message: 'Vector locked in successfully!' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Concurrency Error: This slot was just taken by another user!' });
    }
    console.error('Database Booking Error:', err);
    res.status(500).json({ message: 'Failed to complete booking processing.' });
  }
};

// 3. Fetch all upcoming appointments (For Host View Dashboard)
const getAllBookings = async (req, res) => {
  try {
    const [allBookings] = await pool.query(
      'SELECT * FROM bookings ORDER BY booking_date ASC, start_time ASC'
    );
    res.json(allBookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to pull schedule database records.' });
  }
};

// 4. Fetch bookings for the currently logged-in user
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [[user]] = await pool.query('SELECT username, email FROM users WHERE id = ?', [userId]);
    
    const [myBookings] = await pool.query(
      'SELECT * FROM bookings WHERE guest_email = ? ORDER BY booking_date DESC', 
      [user.email]
    );

    res.json({ username: user.username, email: user.email, bookings: myBookings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load profile data.' });
  }
};

// 5. Cancel a booking securely
const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    const [[user]] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);

    const [result] = await pool.query(
      'DELETE FROM bookings WHERE id = ? AND guest_email = ?', 
      [bookingId, user.email]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ message: 'Unauthorized or booking not found.' });
    }

    res.json({ message: 'Booking successfully canceled.' });
  } catch (err) {
    console.error('Cancellation Error:', err);
    res.status(500).json({ message: 'Failed to cancel the booking.' });
  }
};

// --- ADMIN SYSTEM CONTROLS ---

// 6. Fetch all schedule settings for the Admin Dashboard
const getSettings = async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM availability ORDER BY id ASC');
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to pull system settings.' });
  }
};

// 7. Update a specific day's settings (ON/OFF, Hours, Breaks, and Duration)
const updateSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, slot_duration, start_time, end_time, break_start, break_end } = req.body;
    
    // Convert empty strings to null for the database
    const bStart = break_start || null;
    const bEnd = break_end || null;

    await pool.query(
      'UPDATE availability SET is_active = ?, slot_duration = ?, start_time = ?, end_time = ?, break_start = ?, break_end = ? WHERE id = ?',
      [is_active, slot_duration, start_time, end_time, bStart, bEnd, id]
    );
    
    res.json({ message: 'Settings synchronized successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update system parameters.' });
  }
};
// 8. Fetch Admin Analytics Hub Data
const getAdminStats = async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Make sure only the admin can run these expensive queries
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin clearance required.' });
      }
  
      // 1. Get Admin's identity for the header
      const [[user]] = await pool.query('SELECT username, email FROM users WHERE id = ?', [userId]);
  
      // 2. Calculate Total Unique Clients
      const [[{ total_clients }]] = await pool.query('SELECT COUNT(DISTINCT guest_email) AS total_clients FROM bookings');
  
      // 3. Calculate Total Lifetime Bookings
      const [[{ total_bookings }]] = await pool.query('SELECT COUNT(*) AS total_bookings FROM bookings');
  
      // 4. Find the Most Popular Booking Day
      const [popularDayRes] = await pool.query(
        'SELECT DAYNAME(booking_date) as day_name, COUNT(*) as total FROM bookings GROUP BY day_name ORDER BY total DESC LIMIT 1'
      );
      const popular_day = popularDayRes.length > 0 ? popularDayRes[0].day_name : 'N/A';
  
      // 5. Get the 3 most recently created bookings
      const [recent_bookings] = await pool.query(
        'SELECT * FROM bookings ORDER BY id DESC LIMIT 3'
      );
  
      res.json({ 
        username: user.username, 
        email: user.email, 
        stats: { total_clients, total_bookings, popular_day },
        recent_bookings 
      });
    } catch (err) {
      console.error('Analytics Error:', err);
      res.status(500).json({ message: 'Failed to compile network analytics.' });
    }
  };
module.exports = {
  getAvailableSlots,
  createBooking,
  getAllBookings,
  getMyProfile,
  cancelBooking,
  getSettings,
  updateSettings,
    getAdminStats
};