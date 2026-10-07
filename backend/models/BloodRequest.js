const mongoose = require('mongoose');

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const requestSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: [true, 'Patient name is required'], trim: true },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: { values: GROUPS, message: 'Invalid blood group' },
    },
    units: {
      type: Number,
      required: [true, 'Units are required'],
      min: [1, 'At least 1 unit'],
      max: [10, 'At most 10 units'],
    },
    hospital: { type: String, required: [true, 'Hospital is required'], trim: true },
    city: { type: String, required: [true, 'City is required'], trim: true },
    contact: {
      type: String,
      required: [true, 'Contact is required'],
      match: [/^[0-9]{10}$/, 'Contact must be 10 digits'],
    },
    urgency: { type: String, enum: ['Normal', 'Urgent', 'Critical'], default: 'Normal' },
    status: { type: String, enum: ['Open', 'Fulfilled'], default: 'Open' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BloodRequest', requestSchema);