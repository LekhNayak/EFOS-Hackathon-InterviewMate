const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

const userAuth = async (req, res, next) => {

    try {
        const { token } = req.cookies;
        if (!token) {
            res.status(401).send({ message: "Unauthorized access" });
        }
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        console.log(decoded)
        const { _id } = decoded;
        if (!_id)
            throw new Error("Invalid token");

        const user = await User.findById(_id);
        if (!user)
            throw new Error("User not found");
        else {
            req.user = user;
            next();
        }
    } catch (err) {
        res.status(400).json({ "Error": err.message });
    }
}

module.exports = {
    userAuth
};