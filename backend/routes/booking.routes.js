const express = require('express');
const router = express.Router();

// FIX: Added getSettings and updateSettings to the import list!
const { 
  getAvailableSlots, 
  createBooking, 
  getAllBookings, 
  getMyProfile, 
  cancelBooking,
  getSettings,    
  updateSettings,
    getAdminStats  
} = require('../controllers/booking.controller');

const verifyToken = require('../middleware/auth');
router.get('/slots', getAvailableSlots);
router.post('/book', createBooking);

// Protected Routes (Requires Login)
router.get('/all', verifyToken, getAllBookings);
router.get('/me', verifyToken, getMyProfile);
router.delete('/:id', verifyToken, cancelBooking); 
router.get('/settings', verifyToken, getSettings);       // <-- Added
router.put('/settings/:id', verifyToken, updateSettings);
router.get('/admin/stats', verifyToken, getAdminStats); // <-- Added
module.exports = router;