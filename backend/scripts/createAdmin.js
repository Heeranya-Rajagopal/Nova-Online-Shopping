require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const { auth, db } = require("../config/firebase");

async function createOrPromoteAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const displayName = process.env.ADMIN_NAME || "NOVA Administrator";

    if (!email || !password) {
        throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env before running this script.");
    }

    if (password.length < 12) {
        throw new Error("Use an admin password with at least 12 characters.");
    }

    let user;
    try {
        user = await auth.getUserByEmail(email);
        user = await auth.updateUser(user.uid, {
            password,
            displayName,
            disabled: false
        });
        console.log("Existing Firebase user found; password and display name updated.");
    } catch (error) {
        if (error.code !== "auth/user-not-found") throw error;
        user = await auth.createUser({
            email,
            password,
            displayName,
            emailVerified: false
        });
        console.log("New Firebase administrator account created.");
    }

    await auth.setCustomUserClaims(user.uid, {
        ...(user.customClaims || {}),
        admin: true
    });

    await db.collection("admins").doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        fullName: displayName,
        role: "admin",
        active: true,
        updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log("NOVA administrator role assigned successfully.");
    console.log("Admin email:", user.email);
    console.log("Firebase UID:", user.uid);
    console.log("Password: the ADMIN_PASSWORD value you entered in backend/.env");
    console.log("Remove ADMIN_PASSWORD from backend/.env after setup.");
}

createOrPromoteAdmin()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Admin setup failed:", error.message);
        process.exit(1);
    });
