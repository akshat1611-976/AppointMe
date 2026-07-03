const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth.routes'); // Add this line

const bookingRoutes = require('./routes/booking.routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable cross-origin resource sharing so our React frontend can converse freely
app.use(cors());
app.use(express.json());
// ... existing imports
// ... inside the app initialization
app.use('/api/auth', authRoutes); // Add this line
app.use('/api/appointments', bookingRoutes);
// API Entry point route registration
app.use('/api/appointments', bookingRoutes);

app.listen(PORT, () => {
  console.log(`✓ ChronosAppoint Engine running live on http://localhost:${PORT}`);
});