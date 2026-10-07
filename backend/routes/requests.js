const express = require('express');
const BloodRequest = require('../models/BloodRequest');

const router = express.Router();
const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== 'All') filter.status = req.query.status;
  if (req.query.bloodGroup && req.query.bloodGroup !== 'All') filter.bloodGroup = req.query.bloodGroup;
  if (req.query.location) filter.$or = [
    { city: { $regex: req.query.location.trim(), $options: 'i' } },
    { state: { $regex: req.query.location.trim(), $options: 'i' } }
  ];
  const requests = await BloodRequest.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json(requests);
}));

router.post('/', asyncHandler(async (req, res) => {
  const bloodRequest = await BloodRequest.create(req.body);
  res.status(201).json(bloodRequest);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const bloodRequest = await BloodRequest.findById(req.params.id);
  if (!bloodRequest) return res.status(404).json({ message: 'Blood request not found.' });
  res.json(bloodRequest);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const bloodRequest = await BloodRequest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!bloodRequest) return res.status(404).json({ message: 'Blood request not found.' });
  res.json(bloodRequest);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const bloodRequest = await BloodRequest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!bloodRequest) return res.status(404).json({ message: 'Blood request not found.' });
  res.json(bloodRequest);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const bloodRequest = await BloodRequest.findByIdAndDelete(req.params.id);
  if (!bloodRequest) return res.status(404).json({ message: 'Blood request not found.' });
  res.json({ message: 'Blood request deleted.' });
}));

module.exports = router;
