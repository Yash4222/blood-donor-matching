const mongoose = require('mongoose');

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const donorSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    bloodGroup: { type: String, required: true, enum: bloodGroups },
    age: { type: Number, required: true, min: 18, max: 65 },
    phone: { type: String, required: true, trim: true, maxlength: 24 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120, default: '' },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    state: { type: String, trim: true, maxlength: 80, default: '' },
    lastDonation: { type: Date, default: null },
    available: { type: Boolean, default: true },
    notes: { type: String, trim: true, maxlength: 300, default: '' }
  },
  { timestamps: true }
);

donorSchema.index({ bloodGroup: 1, city: 1, available: 1 });

module.exports = mongoose.model('Donor', donorSchema);
