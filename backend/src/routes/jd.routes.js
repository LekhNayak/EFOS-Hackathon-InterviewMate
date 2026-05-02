const { parseJobDescription, getAllJD, getUsersJD, deleteJd, getJdAsString } = require('../handlers/jd.handler');
const express = require('express');
const jdRouter = express.Router();
const upload = require('../middleware/upload.middleware');
const { userAuth } = require('../middleware/auth.middleware');

jdRouter.post('/parse', userAuth, upload.single('jd'), parseJobDescription);
jdRouter.get('/', userAuth, getAllJD);
jdRouter.get('/user', userAuth, getUsersJD);
jdRouter.delete('/:id', userAuth, deleteJd);
jdRouter.get('/get-as-string/:id', userAuth, getJdAsString)

module.exports = jdRouter;