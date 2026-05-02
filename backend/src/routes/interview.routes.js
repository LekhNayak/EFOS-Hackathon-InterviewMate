const { startInterview, saveSession, getMyInterviews, getByJD, getByResume, getByType } = require('../handlers/interview.handler');
const express = require('express');
const upload = require('../middleware/upload.middleware');
const interviewRouter = express.Router();
const { userAuth } = require('../middleware/auth.middleware');

interviewRouter.post('/create', userAuth, upload.single('videoFile'), startInterview);
interviewRouter.post('/save', userAuth, saveSession);
interviewRouter.get('/user', userAuth, getMyInterviews);
interviewRouter.get('/resume/:resumeId', userAuth, getByResume);
interviewRouter.get('/jd/:jdId', userAuth, getByJD);
interviewRouter.get('/type/:type', userAuth, getByType);

module.exports = interviewRouter