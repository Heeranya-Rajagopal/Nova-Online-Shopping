
const express = require("express");
const router = express.Router();

const { auth } = require("../config/firebase");
const verifyToken = require("../middleware/authMiddleware");

// Customer Login
router.post("/login", async (req, res) => {
    try {
        const { email, password, loginType = "customer" } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        if (!process.env.FIREBASE_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "Firebase API key is not configured"
            });
        }

        const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password,
                    returnSecureToken: true
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const decodedToken = await auth.verifyIdToken(data.idToken, true);
        const isAdmin = decodedToken.admin === true;

        if (loginType === "admin") {
            if (!isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: "This account is not authorized for the Admin Portal."
                });
            }

            const adminDoc = await require("../config/firebase")
                .db.collection("admins")
                .doc(data.localId)
                .get();

            return res.status(200).json({
                success: true,
                message: "Administrator login successful",
                role: "admin",
                idToken: data.idToken,
                refreshToken: data.refreshToken,
                expiresIn: data.expiresIn,
                admin: adminDoc.exists ? adminDoc.data() : {
                    uid: data.localId,
                    email: data.email
                }
            });
        }

        if (isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Please use Admin Sign In for this account."
            });
        }

        const customerDoc = await require("../config/firebase")
            .db.collection("customers")
            .doc(data.localId)
            .get();

        if (!customerDoc.exists) {
            return res.status(403).json({
                success: false,
                message: "Customer profile not found"
            });
        }

        const customer = customerDoc.data();

        if (customer.active === false) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Login successful",
            role: "customer",
            idToken: data.idToken,
            refreshToken: data.refreshToken,
            expiresIn: data.expiresIn,
            customer: {
                uid: data.localId,
                fullName: customer.fullName || customer.name,
                email: customer.email,
                phone: customer.phone,
                creditLimit: customer.creditLimit,
                creditUsed: customer.creditUsed,
                active: customer.active
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
});


// Forgot Password
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        if (!process.env.FIREBASE_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "Firebase API key is not configured"
            });
        }

        const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.FIREBASE_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    requestType: "PASSWORD_RESET",
                    email
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(400).json({
                success: false,
                message: "Unable to send password reset email"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Password reset email sent successfully"
        });

    } catch (error) {
        console.error("Forgot password error:", error);

        return res.status(500).json({
            success: false,
            message: "Password reset failed",
            error: error.message
        });
    }
});


// Logout
router.post("/logout", verifyToken, async (req, res) => {
    try {
        await auth.revokeRefreshTokens(req.user.uid);

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });

    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            success: false,
            message: "Logout failed",
            error: error.message
        });
    }
});


// Get Logged-in Customer Details
router.get("/me", verifyToken, async (req, res) => {
    try {
        const db = require("../config/firebase").db;

        if (req.user.admin === true) {
            const adminDoc = await db.collection("admins").doc(req.user.uid).get();
            return res.status(200).json({
                success: true,
                role: "admin",
                admin: adminDoc.exists ? adminDoc.data() : {
                    uid: req.user.uid,
                    email: req.user.email
                }
            });
        }

        const customerDoc = await db
            .collection("customers")
            .doc(req.user.uid)
            .get();

        if (!customerDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Customer profile not found"
            });
        }

        const customer = customerDoc.data();

        return res.status(200).json({
            success: true,
            role: "customer",
            customer: {
                uid: req.user.uid,
                fullName: customer.fullName || customer.name,
                email: customer.email,
                phone: customer.phone,
                creditLimit: customer.creditLimit,
                creditUsed: customer.creditUsed,
                active: customer.active
            }
        });

    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to get customer details",
            error: error.message
        });
    }
});

module.exports = router;
