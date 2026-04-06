// middleware/verifyToken.js

const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization) {
            token = req.headers.authorization?.split(" ")[1];
        }

        if (!token && req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                message: "Token missing"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_secret);
        console.log("decoded", decoded)
        req.user = decoded; // 🔥 attach to request

        next(); // move to controller
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = verifyToken;