const express = require('express');
const Donor = require('../models/Donor');

const router = express.Router();
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.bloodGroup && req.query.bloodGroup !== 'All') filter.bloodGroup = req.query.bloodGroup;
  if (req.query.location) filter.$or = [
    { city: { $regex: req.query.location.trim(), $options: 'i' } },
    { state: { $regex: req.query.location.trim(), $options: 'i' } }
  ];
  if (req.query.available === 'true') filter.available = true;
  if (req.query.available === 'false') filter.available = false;
  const donors = await Donor.find(filter).sort({ available: -1, updatedAt: -1 }).limit(200);
  res.json(donors);
}));

router.post('/', asyncHandler(async (req, res) => {
  const donor = await Donor.create(req.body);
  res.status(201).json(donor);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const donor = await Donor.findById(req.params.id);
  if (!donor) return res.status(404).json({ message: 'Donor not found.' });
  res.json(donor);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const donor = await Donor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!donor) return res.status(404).json({ message: 'Donor not found.' });
  res.json(donor);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const donor = await Donor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!donor) return res.status(404).json({ message: 'Donor not found.' });
  res.json(donor);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const donor = await Donor.findByIdAndDelete(req.params.id);
  if (!donor) return res.status(404).json({ message: 'Donor not found.' });
  res.json({ message: 'Donor profile deleted.' });
}));

module.exports = router;
