const mongoose = require('mongoose');

const competitionResultSchema = new mongoose.Schema({
  competitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userType: { type: String, enum: ['athlete', 'coach'], required: true },
  medal: { type: String, enum: ['Gold', 'Silver', 'Bronze', 'Participant'], default: 'Participant' },
  attendanceStatus: { type: String, enum: ['Present', 'Absent'], default: 'Present' },
  certificateUrl: { type: String, default: null }, // local path or cloudinary url
  publishedAt: { type: Date, default: null },
  emailSent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('CompetitionResult', competitionResultSchema);