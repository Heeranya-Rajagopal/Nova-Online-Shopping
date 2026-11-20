
const express = require("express");
const router = express.Router();

const { db, FieldValue } = require("../config/firebase");
const verifyToken = require("../middleware/authMiddleware");

// Generate Invoice for an Order
router.post("/generate/:orderId", verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const uid = req.user.uid;

        const orderRef = db.collection("orders").doc(orderId);
        const invoiceRef = db.collection("invoices").doc(orderId);

        // Get order details
        const detailsSnapshot = await db.collection("orderDetails")
            .where("orderId", "==", orderId)
            .get();

        if (detailsSnapshot.empty) {
            return res.status(404).json({
                success: false,
                message: "Order items not found"
            });
        }

        const items = detailsSnapshot.docs.map(doc => {
            const item = doc.data();

            return {
                productId: item.productId,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.subtotal
            };
        });

        const result = await db.runTransaction(async (transaction) => {
            const orderDoc = await transaction.get(orderRef);
            const invoiceDoc = await transaction.get(invoiceRef);

            if (!orderDoc.exists) {
                throw new Error("ORDER_NOT_FOUND");
            }

            const order = orderDoc.data();

            if (order.customerId !== uid) {
                throw new Error("ACCESS_DENIED");
            }

            if (invoiceDoc.exists) {
                throw new Error("INVOICE_EXISTS");
            }

            const invoiceData = {
                invoiceNumber: `NOVA-${orderId}`,
                orderId,
                customerId: uid,
                customerName: order.customerName || "",
                email: order.email || "",
                items,
                subtotal: Number(order.totalAmount),
                totalAmount: Number(order.totalAmount),
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                orderStatus: order.orderStatus,
                invoiceDate: FieldValue.serverTimestamp()
            };

            transaction.set(invoiceRef, invoiceData);

            return {
                invoiceNumber: invoiceData.invoiceNumber,
                orderId,
                customerName: invoiceData.customerName,
                email: invoiceData.email,
                items,
                subtotal: invoiceData.subtotal,
                totalAmount: invoiceData.totalAmount,
                paymentMethod: invoiceData.paymentMethod,
                paymentStatus: invoiceData.paymentStatus
            };
        });

        return res.status(201).json({
            success: true,
            message: "Invoice generated successfully",
            invoice: result
        });

    } catch (error) {
        const errors = {
            ORDER_NOT_FOUND: [404, "Order not found"],
            ACCESS_DENIED: [403, "You are not allowed to generate this invoice"],
            INVOICE_EXISTS: [409, "Invoice already exists for this order"]
        };

        if (errors[error.message]) {
            return res.status(errors[error.message][0]).json({
                success: false,
                message: errors[error.message][1]
            });
        }

        console.error("Generate invoice error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to generate invoice"
        });
    }
});


// View All Invoices of Logged-in Customer
router.get("/my-invoices", verifyToken, async (req, res) => {
    try {
        const snapshot = await db.collection("invoices")
            .where("customerId", "==", req.user.uid)
            .get();

        const invoices = snapshot.docs.map(doc => ({
            ...doc.data(),
            invoiceId: doc.id
        }));

        invoices.sort((a, b) => {
            const dateA = a.invoiceDate?.toMillis?.() || 0;
            const dateB = b.invoiceDate?.toMillis?.() || 0;
            return dateB - dateA;
        });

        return res.status(200).json({
            success: true,
            count: invoices.length,
            invoices
        });

    } catch (error) {
        console.error("Get invoices error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve invoices"
        });
    }
});


// View a Specific Invoice
router.get("/:orderId", verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;

        const invoiceDoc = await db.collection("invoices")
            .doc(orderId)
            .get();

        if (!invoiceDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        const invoice = invoiceDoc.data();

        if (invoice.customerId !== req.user.uid) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view this invoice"
            });
        }

        return res.status(200).json({
            success: true,
            invoice: {
                invoiceId: invoiceDoc.id,
                ...invoice
            }
        });

    } catch (error) {
        console.error("Get invoice error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve invoice"
        });
    }
});

module.exports = router;
