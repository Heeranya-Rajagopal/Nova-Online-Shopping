
const express = require("express");
const router = express.Router();

const { db, auth, FieldValue } = require("../config/firebase");

const customers = db.collection("customers");

// 1. Register a new customer
router.post("/register", async (req, res) => {
    let userRecord;

    try {
        const { fullName, email, password, phone } = req.body;

        if (!fullName || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: "Please provide all customer details"
            });
        }

        if (typeof fullName !== "string" || fullName.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: "Full name must contain at least 3 characters"
            });
        }

        if (typeof email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }

        if (typeof phone !== "string" || !/^[0-9]{10}$/.test(phone.trim())) {
            return res.status(400).json({
                success: false,
                message: "Phone number must contain exactly 10 digits"
            });
        }

        userRecord = await auth.createUser({
            email: email.trim().toLowerCase(),
            password,
            displayName: fullName.trim()
        });

        const customerData = {
            uid: userRecord.uid,
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            creditLimit: 1000,
            creditUsed: 0,
            createdAt: FieldValue.serverTimestamp(),
            active: true
        };

        await customers.doc(userRecord.uid).set(customerData);

        return res.status(201).json({
            success: true,
            message: "Customer registered successfully",
            customer: {
                uid: userRecord.uid,
                fullName: customerData.fullName,
                email: customerData.email,
                phone: customerData.phone,
                creditLimit: customerData.creditLimit,
                creditUsed: customerData.creditUsed,
                active: customerData.active
            }
        });

    } catch (error) {
        console.error("Customer Registration Error:", error);

        if (userRecord) {
            await auth.deleteUser(userRecord.uid).catch(() => {});
        }

        if (error.code === "auth/email-already-exists") {
            return res.status(409).json({
                success: false,
                message: "Email address is already registered"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to register customer"
        });
    }
});


// 2. Get all customers
router.get("/", async (req, res) => {
    try {
        const snapshot = await customers.get();

        const customerList = snapshot.docs.map(doc => ({
            ...doc.data(),
            uid: doc.id
        }));

        return res.status(200).json({
            success: true,
            count: customerList.length,
            customers: customerList
        });

    } catch (error) {
        console.error("Get Customers Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve customers"
        });
    }
});


// 3. Get customer by ID
router.get("/:id", async (req, res) => {
    try {
        const customerDoc = await customers.doc(req.params.id).get();

        if (!customerDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        return res.status(200).json({
            success: true,
            customer: customerDoc.data()
        });

    } catch (error) {
        console.error("Get Customer Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve customer"
        });
    }
});


// 4. Update customer details
router.put("/:id", async (req, res) => {
    try {
        const { fullName, phone } = req.body;

        const customerRef = customers.doc(req.params.id);
        const customerDoc = await customerRef.get();

        if (!customerDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        const updateData = {};

        if (fullName !== undefined) {
            if (typeof fullName !== "string" || fullName.trim().length < 3) {
                return res.status(400).json({
                    success: false,
                    message: "Full name must contain at least 3 characters"
                });
            }

            updateData.fullName = fullName.trim();
        }

        if (phone !== undefined) {
            if (typeof phone !== "string" || !/^[0-9]{10}$/.test(phone.trim())) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number must contain exactly 10 digits"
                });
            }

            updateData.phone = phone.trim();
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one field to update"
            });
        }

        await customerRef.update(updateData);

        const updatedCustomer = await customerRef.get();

        return res.status(200).json({
            success: true,
            message: "Customer details updated successfully",
            customer: updatedCustomer.data()
        });

    } catch (error) {
        console.error("Update Customer Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update customer"
        });
    }
});


// 5. Update customer credit limit
router.put("/:id/credit-limit", async (req, res) => {
    try {
        const { creditLimit } = req.body;

        if (typeof creditLimit !== "number" ||
            !Number.isFinite(creditLimit) ||
            creditLimit < 0) {
            return res.status(400).json({
                success: false,
                message: "Credit limit must be a valid non-negative number"
            });
        }

        const customerRef = customers.doc(req.params.id);
        const customerDoc = await customerRef.get();

        if (!customerDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        await customerRef.update({ creditLimit });

        return res.status(200).json({
            success: true,
            message: "Customer credit limit updated successfully",
            uid: req.params.id,
            creditLimit
        });

    } catch (error) {
        console.error("Update Credit Limit Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update credit limit"
        });
    }
});


// 6. Deactivate customer
router.patch("/:id/deactivate", async (req, res) => {
    try {
        const customerRef = customers.doc(req.params.id);
        const customerDoc = await customerRef.get();

        if (!customerDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        if (customerDoc.data().active === false) {
            return res.status(400).json({
                success: false,
                message: "Customer is already deactivated"
            });
        }

        await customerRef.update({ active: false });

        return res.status(200).json({
            success: true,
            message: "Customer deactivated successfully",
            uid: req.params.id,
            active: false
        });

    } catch (error) {
        console.error("Deactivate Customer Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to deactivate customer"
        });
    }
});

module.exports = router;
