const Competition = require('../models/Competition.model');

exports.createCompetition = async (req, res) => {
  try {
    const { title, description, date, venue, categories, ageGroups, registrationFee, deadline, requirements } = req.body;
    
    const competition = new Competition({
      title,
      description,
      date,
      venue,
      categories,
      ageGroups,
      registrationFee,
      deadline,
      requirements,
      createdBy: req.user._id
    });

    await competition.save();
    return res.status(201).json({ success: true, data: competition, message: 'Competition created successfully' });
  } catch (error) {
    console.error('Error creating competition:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error while creating competition' });
  }
};

exports.getAllCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: competitions, message: 'Competitions fetched successfully' });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching competitions' });
  }
};

exports.getPublicCompetitions = async (req, res) => {
  try {
    const competitions = await Competition.find({ status: 'upcoming' }).sort({ date: 1 });
    return res.status(200).json({ success: true, data: competitions, message: 'Upcoming competitions fetched successfully' });
  } catch (error) {
    console.error('Error fetching public competitions:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching public competitions' });
  }
};
