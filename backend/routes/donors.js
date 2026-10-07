const express = require('express');
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

// READ + SEARCH by blood group and city
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.bloodGroup) filter.bloodGroup = req.query.bloodGroup;
    if (req.query.city) filter.city = new RegExp(esc(req.query.city.trim()), 'i');
    res.json(await Donor.find(filter).sort({ createdAt: -1 }));
  } catch (err) { handle(res, err); }
});

// CREATE
router.post('/', async (req, res) => {
  try { res.status(201).json(await Donor.create(req.body)); }
  catch (err) { handle(res, err); }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const donor = await Donor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json(donor);
  } catch (err) { handle(res, err); }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const donor = await Donor.findByIdAndDelete(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json({ message: 'Donor deleted' });
  } catch (err) { handle(res, err); }
});

module.exports = router;