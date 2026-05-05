const Competition = require('../models/Competition.model');

exports.createCompetition = async (req, res) => {
  try {
    const { title, description, date, venue, categories, ageGroups, registrationFee, deadline, requirements } = req.body;
    const competition = new Competition({
      title, description, date, venue, categories, ageGroups,
      registrationFee, deadline, requirements, createdBy: req.user._id
    });
    await competition.save();
    return res.status(201).json({ success: true, data: competition, message: 'Competition created successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error while creating competition' });
  }
};

exports.getAllCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: competitions });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error while fetching competitions' });
  }
};

exports.getPublicCompetitions = async (req, res) => {
  try {
    // Show upcoming AND ongoing, exclude admin-rejected
    const competitions = await Competition.find({
      status: { $in: ['upcoming', 'ongoing'] },
    }).sort({ date: 1 });
    return res.status(200).json({ success: true, data: competitions });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error while fetching competitions' });
  }
};

exports.updateCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const competition = await Competition.findById(id);
    if (!competition) return res.status(404).json({ success: false, message: 'Competition not found' });

    const fields = ['title','description','date','venue','categories','ageGroups','registrationFee','deadline','requirements','status'];
    fields.forEach(f => { if (req.body[f] !== undefined) competition[f] = req.body[f]; });

    await competition.save();
    return res.status(200).json({ success: true, data: competition, message: 'Competition updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

exports.deleteCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const competition = await Competition.findByIdAndDelete(id);
    if (!competition) return res.status(404).json({ success: false, message: 'Competition not found' });
    return res.status(200).json({ success: true, message: 'Competition deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateCompetitionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const VALID = ['upcoming', 'ongoing', 'completed'];
    if (status && !VALID.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${VALID.join(', ')}` });
    }
    const competition = await Competition.findById(id);
    if (!competition) return res.status(404).json({ success: false, message: 'Competition not found' });

    if (status) competition.status = status;
    if (adminNote !== undefined) competition.adminNote = adminNote;
    await competition.save();
    return res.status(200).json({ success: true, data: competition, message: 'Status updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};