const validator = require('validator');

const validateSignUpData = (req) => {
    const { name, email, password, interests } = req.body;

    if (!name)
        throw new Error("Name is required");
    else if (!email)
        throw new Error("Email id is required");
    else if (!password)
        throw new Error("Password is required");
    else if (!validator.isEmail(email))
        throw new Error("Invalid email id");
}

module.exports = { validateSignUpData }