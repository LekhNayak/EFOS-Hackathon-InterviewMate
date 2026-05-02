const express = require('express');
const userRouter = express.Router();
const { requestOtp, signup, login, profile, updateProfile, logout, changePassword, deleteUser } = require('../handlers/user.handler');
const { userAuth } = require('../middleware/auth.middleware');


userRouter.post('/signup/request-otp', requestOtp);
userRouter.post('/signup/complete', signup);
userRouter.post('/login', login);
userRouter.get('/profile', userAuth, profile);
userRouter.put('/update', userAuth, updateProfile);
userRouter.put('/logout', userAuth, logout);
userRouter.patch('/change-password', userAuth, changePassword);
userRouter.delete('/delete', userAuth, deleteUser);

module.exports = userRouter;