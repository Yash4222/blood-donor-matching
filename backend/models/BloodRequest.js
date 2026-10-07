const mongoose = require('mongoose');

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const requestSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true, trim: true, maxlength: 80 },
    bloodGroup: { type: String, required: true, enum: bloodGroups },
    units: { type: Number, required: true, min: 1, max: 20, default: 1 },
    hospital: { type: String, required: true, trim: true, maxlength: 120 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    state: { type: String, trim: true, maxlength: 80, default: '' },
    contactName: { type: String, required: true, trim: true, maxlength: 80 },
    contactPhone: { type: String, required: true, trim: true, maxlength: 24 },
    neededBy: { type: Date, required: true },
    urgency: { type: String, enum: ['Critical', 'Urgent', 'Routine'], default: 'Urgent' },
    status: { type: String, enum: ['Open', 'In progress', 'Fulfilled'], default: 'Open' },
    details: { type: String, trim: true, maxlength: 500, default: '' }
  },
  { timestamps: true }
);

requestSchema.index({ status: 1, bloodGroup: 1, city: 1, neededBy: 1 });

module.exports = mongoose.model('BloodRequest', requestSchema);
