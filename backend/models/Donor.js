const mongoose = require('mongoose');

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const donorSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: { values: GROUPS, message: 'Invalid blood group' },
    },
    city: { type: String, required: [true, 'City is required'], trim: true },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      match: [/^[0-9]{10}$/, 'Phone must be 10 digits'],
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [18, 'Donor must be at least 18'],
      max: [65, 'Donor must be at most 65'],
    },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donor', donorSchema);