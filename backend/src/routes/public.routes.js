const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/competition.controller');

router.get('/competitions', competitionController.getPublicCompetitions);

module.exports = router;
