
const express = require("express");
const router = express.Router();

const { db, FieldValue } = require("../config/firebase");
const verifyToken = require("../middleware/authMiddleware");

// Place Order
router.post("/place", verifyToken, async (req, res) => {
    try {
        const { paymentMethod } = req.body;

        if (!["cash", "credit"].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Payment method must be cash or credit"
            });
        }

        const uid = req.user.uid;

        const cartRef = db.collection("carts").doc(uid);
        const customerRef = db.collection("customers").doc(uid);
        const orderRef = db.collection("orders").doc();

        const result = await db.runTransaction(async (transaction) => {

            // Read customer and cart
            const [cartDoc, customerDoc] = await Promise.all([
                transaction.get(cartRef),
                transaction.get(customerRef)
            ]);

            if (!cartDoc.exists || !cartDoc.data().items?.length) {
                throw new Error("CART_EMPTY");
            }

            if (!customerDoc.exists) {
                throw new Error("CUSTOMER_NOT_FOUND");
            }

            const customer = customerDoc.data();

            if (customer.active === false || customer.status === "inactive") {
                throw new Error("CUSTOMER_INACTIVE");
            }

            const cartItems = cartDoc.data().items;

            // Read all products before making any changes
            const productRefs = cartItems.map(item =>
                db.collection("inventory").doc(item.productId)
            );

            const productDocs = await Promise.all(
                productRefs.map(ref => transaction.get(ref))
            );

            let totalAmount = 0;
            const orderItems = [];

            for (let i = 0; i < cartItems.length; i++) {
                const item = cartItems[i];
                const productDoc = productDocs[i];

                if (!productDoc.exists) {
                    throw new Error("PRODUCT_NOT_FOUND");
                }

                const product = productDoc.data();

                if (product.active === false) {
                    throw new Error("PRODUCT_INACTIVE");
                }

                const quantity = Number(item.quantity);
                const stock = Number(product.qty);
                const price = Number(product.price);

                if (!Number.isInteger(quantity) || quantity <= 0) {
                    throw new Error("INVALID_QUANTITY");
                }

                if (!Number.isFinite(stock) || stock < quantity) {
                    throw new Error("INSUFFICIENT_STOCK");
                }

                if (!Number.isFinite(price) || price < 0) {
                    throw new Error("INVALID_PRICE");
                }

                const subtotal = price * quantity;
                totalAmount += subtotal;

                orderItems.push({
                    productId: item.productId,
                    title: product.title,
                    imageUrl: product.imageUrl || "",
                    price,
                    quantity,
                    subtotal,
                    productRef: productRefs[i],
                    remainingStock: stock - quantity
                });
            }

            // Check customer's available credit
            const creditLimit = Number(customer.creditLimit || 0);
            const creditUsed = Number(customer.creditUsed || 0);

            if (paymentMethod === "credit") {
                if (creditUsed + totalAmount > creditLimit) {
                    throw new Error("CREDIT_LIMIT_EXCEEDED");
                }
            }

            const orderStatus = "confirmed";
            const paymentStatus =
                paymentMethod === "cash" ? "paid" : "pending";

            const orderData = {
                customerId: uid,
                customerName: customer.fullName || customer.name || "",
                email: customer.email || "",
                totalAmount,
                paymentMethod,
                paymentStatus,
                orderStatus,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            };

            // Create order and order details
            transaction.set(orderRef, orderData);

            for (const item of orderItems) {
                const detailRef = db.collection("orderDetails").doc();

                transaction.set(detailRef, {
                    orderId: orderRef.id,
                    customerId: uid,
                    productId: item.productId,
                    title: item.title,
                    imageUrl: item.imageUrl,
                    price: item.price,
                    quantity: item.quantity,
                    subtotal: item.subtotal,
                    createdAt: FieldValue.serverTimestamp()
                });

                // Deduct stock
                transaction.update(item.productRef, {
                    qty: item.remainingStock
                });
            }

            // Update credit used only for credit purchases
            if (paymentMethod === "credit") {
                transaction.update(customerRef, {
                    creditUsed: creditUsed + totalAmount
                });
            }

            // Clear cart after successful order
            transaction.delete(cartRef);

            return {
                orderId: orderRef.id,
                totalAmount,
                paymentMethod,
                paymentStatus,
                orderStatus,
                items: orderItems.map(item => ({
                    productId: item.productId,
                    title: item.title,
                    imageUrl: item.imageUrl,
                    price: item.price,
                    quantity: item.quantity,
                    subtotal: item.subtotal
                }))
            };
        });

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order: result
        });

    } catch (error) {
        const errors = {
            CART_EMPTY: [400, "Your cart is empty"],
            CUSTOMER_NOT_FOUND: [404, "Customer not found"],
            CUSTOMER_INACTIVE: [403, "Customer account is inactive"],
            PRODUCT_NOT_FOUND: [404, "A product in your cart was not found"],
            PRODUCT_INACTIVE: [400, "A product in your cart is inactive"],
            INVALID_QUANTITY: [400, "Cart contains an invalid quantity"],
            INSUFFICIENT_STOCK: [400, "Available stock is insufficient"],
            INVALID_PRICE: [400, "A product has an invalid price"],
            CREDIT_LIMIT_EXCEEDED: [400, "Purchase exceeds your available credit limit"]
        };

        if (errors[error.message]) {
            return res.status(errors[error.message][0]).json({
                success: false,
                message: errors[error.message][1]
            });
        }

        console.error("Place order error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to place order"
        });
    }
});


// View Customer Order History
router.get("/my-orders", verifyToken, async (req, res) => {
    try {
        const snapshot = await db.collection("orders")
            .where("customerId", "==", req.user.uid)
            .get();

        const orders = snapshot.docs.map(doc => ({
            orderId: doc.id,
            ...doc.data()
        }));

        orders.sort((a, b) => {
            const dateA = a.createdAt?.toMillis?.() || 0;
            const dateB = b.createdAt?.toMillis?.() || 0;
            return dateB - dateA;
        });

        return res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        console.error("Order history error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve order history"
        });
    }
});


// View Single Order
router.get("/:id", verifyToken, async (req, res) => {
    try {
        const orderId = req.params.id;

        const orderDoc = await db.collection("orders")
            .doc(orderId)
            .get();

        if (!orderDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const order = orderDoc.data();

        if (order.customerId !== req.user.uid) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view this order"
            });
        }

        const detailsSnapshot = await db.collection("orderDetails")
            .where("orderId", "==", orderId)
            .get();

        // Older orders may not have an imageUrl saved in their item snapshot.
        const items = await Promise.all(detailsSnapshot.docs.map(async (doc) => {
            const item = doc.data();

            if (item.imageUrl || !item.productId) return item;

            const productDoc = await db.collection("inventory")
                .doc(item.productId)
                .get();

            const product = productDoc.exists ? productDoc.data() : {};

            return {
                ...item,
                imageUrl: product.imageUrl || ""
            };
        }));

        return res.status(200).json({
            success: true,
            order: {
                orderId: orderDoc.id,
                ...order,
                items
            }
        });

    } catch (error) {
        console.error("View order error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve order"
        });
    }
});

module.exports = router;
