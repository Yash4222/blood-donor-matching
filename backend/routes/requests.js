const express = require('express');
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const router = express.Router();

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const handle = (res, err) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  res.status(500).json({ message: err.message });
};

// Who can give blood to whom (patient group -> allowed donor groups)
const COMPATIBLE = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

router.get('/', async (req, res) => {
  try { res.json(await BloodRequest.find().sort({ createdAt: -1 })); }
  catch (err) { handle(res, err); }
});

router.post('/', async (req, res) => {
  try { res.status(201).json(await BloodRequest.create(req.body)); }
  catch (err) { handle(res, err); }
});

// MATCHING: available donors in the same city with a compatible blood group
router.get('/:id/matches', async (req, res) => {
  try {
    const reqDoc = await BloodRequest.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
    const donors = await Donor.find({
      bloodGroup: { $in: COMPATIBLE[reqDoc.bloodGroup] },
      city: new RegExp('^' + esc(reqDoc.city.trim()) + '$', 'i'),
      available: true,
    });
    res.json(donors);
  } catch (err) { handle(res, err); }
});

router.put('/:id', async (req, res) => {
  try {
    const doc = await BloodRequest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    res.json(doc);
  } catch (err) { handle(res, err); }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await BloodRequest.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Request deleted' });
  } catch (err) { handle(res, err); }
});

module.exports = router;