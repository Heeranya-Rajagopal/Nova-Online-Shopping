const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.admin !== true) {
        return res.status(403).json({
            success: false,
            message: "Administrator access is required."
        });
    }
    next();
};

module.exports = requireAdmin;
