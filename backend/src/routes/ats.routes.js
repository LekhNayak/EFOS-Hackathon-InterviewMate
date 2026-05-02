const express = require('express');
const atsRouter = express.Router();
const { analyze, quickAnalyze, getAllByUser, getATSById, getAllByJD, getAllByResume } = require('../handlers/ats.handler');
const { userAuth } = require('../middleware/auth.middleware');

atsRouter.post('/analyze', userAuth, analyze);
atsRouter.post('/quick-analyze', userAuth, quickAnalyze);
atsRouter.get('/user', userAuth, getAllByUser);
atsRouter.get('/resume/:resumeId', userAuth, getAllByResume);
atsRouter.get('/jd/:jdId', userAuth, getAllByJD);
atsRouter.get('/:id', userAuth, getATSById);

module.exports = atsRouter;