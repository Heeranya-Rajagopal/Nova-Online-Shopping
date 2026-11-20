
const { auth } = require("../config/firebase");

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Token is required"
            });
        }

        const token = authHeader.split(" ")[1];

        const decodedToken = await auth.verifyIdToken(token, true);

        req.user = decodedToken;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid, expired or revoked token"
        });
    }
};

module.exports = verifyToken;
