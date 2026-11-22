
const express = require("express");
const router = express.Router();

const { db, FieldValue } = require("../config/firebase");
const verifyToken = require("../middleware/authMiddleware");

// Add Product to Cart
router.post("/add", verifyToken, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid product ID and quantity are required"
            });
        }

        const cartRef = db.collection("carts").doc(req.user.uid);
        const productRef = db.collection("inventory").doc(productId);

        const result = await db.runTransaction(async (transaction) => {
            const productDoc = await transaction.get(productRef);

            if (!productDoc.exists) {
                throw new Error("PRODUCT_NOT_FOUND");
            }

            const product = productDoc.data();

            if (product.active === false) {
                throw new Error("PRODUCT_INACTIVE");
            }

            const stock = Number(product.qty);

            if (!Number.isFinite(stock) || stock < 0) {
                throw new Error("INVALID_STOCK");
            }

            const cartDoc = await transaction.get(cartRef);
            const cart = cartDoc.exists ? cartDoc.data() : { items: [] };

            const items = Array.isArray(cart.items) ? [...cart.items] : [];
            const existingIndex = items.findIndex(
                item => item.productId === productId
            );

            const currentQuantity = existingIndex >= 0
                ? items[existingIndex].quantity
                : 0;

            const newQuantity = currentQuantity + quantity;

            if (newQuantity > stock) {
                throw new Error("INSUFFICIENT_STOCK");
            }

            const price = Number(product.price);

            if (!Number.isFinite(price) || price < 0) {
                throw new Error("INVALID_PRICE");
            }

            const item = {
                productId,
                title: product.title,
                imageUrl: product.imageUrl || "",
                price,
                quantity: newQuantity,
                subtotal: price * newQuantity
            };

            if (existingIndex >= 0) {
                items[existingIndex] = item;
            } else {
                items.push(item);
            }

            const total = items.reduce(
                (sum, currentItem) => sum + currentItem.subtotal,
                0
            );

            transaction.set(cartRef, {
                uid: req.user.uid,
                items,
                total,
                updatedAt: FieldValue.serverTimestamp()
            });

            return { items, total };
        });

        return res.status(200).json({
            success: true,
            message: "Product added to cart successfully",
            cart: result
        });

    } catch (error) {
        const errors = {
            PRODUCT_NOT_FOUND: [404, "Product not found"],
            PRODUCT_INACTIVE: [400, "Product is inactive"],
            INSUFFICIENT_STOCK: [400, "Requested quantity exceeds available stock"],
            INVALID_STOCK: [400, "Product stock value is invalid"],
            INVALID_PRICE: [400, "Product price is invalid"]
        };

        if (errors[error.message]) {
            return res.status(errors[error.message][0]).json({
                success: false,
                message: errors[error.message][1]
            });
        }

        console.error("Add to cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add product to cart"
        });
    }
});


// View Customer Cart
router.get("/", verifyToken, async (req, res) => {
    try {
        const cartDoc = await db.collection("carts")
            .doc(req.user.uid)
            .get();

        if (!cartDoc.exists) {
            return res.status(200).json({
                success: true,
                message: "Your cart is empty",
                cart: {
                    items: [],
                    total: 0
                }
            });
        }

        const cart = cartDoc.data();
        const cartItems = Array.isArray(cart.items) ? cart.items : [];

        // Enrich older cart entries that were saved before product images existed.
        const itemsWithImages = await Promise.all(cartItems.map(async (item) => {
            if (item.imageUrl) return item;

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
            cart: {
                items: itemsWithImages,
                total: cart.total || 0
            }
        });

    } catch (error) {
        console.error("View cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve cart"
        });
    }
});


// Update Product Quantity
router.put("/update/:productId", verifyToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive whole number"
            });
        }

        const cartRef = db.collection("carts").doc(req.user.uid);
        const productRef = db.collection("inventory").doc(productId);

        const result = await db.runTransaction(async (transaction) => {
            const cartDoc = await transaction.get(cartRef);

            if (!cartDoc.exists) {
                throw new Error("CART_NOT_FOUND");
            }

            const productDoc = await transaction.get(productRef);

            if (!productDoc.exists) {
                throw new Error("PRODUCT_NOT_FOUND");
            }

            const product = productDoc.data();

            if (product.active === false) {
                throw new Error("PRODUCT_INACTIVE");
            }

            if (quantity > Number(product.qty)) {
                throw new Error("INSUFFICIENT_STOCK");
            }

            const items = [...(cartDoc.data().items || [])];
            const index = items.findIndex(
                item => item.productId === productId
            );

            if (index === -1) {
                throw new Error("ITEM_NOT_FOUND");
            }

            const price = Number(product.price);

            items[index] = {
                productId,
                title: product.title,
                imageUrl: product.imageUrl || "",
                price,
                quantity,
                subtotal: price * quantity
            };

            const total = items.reduce(
                (sum, item) => sum + item.subtotal,
                0
            );

            transaction.update(cartRef, {
                items,
                total,
                updatedAt: FieldValue.serverTimestamp()
            });

            return { items, total };
        });

        return res.status(200).json({
            success: true,
            message: "Cart quantity updated successfully",
            cart: result
        });

    } catch (error) {
        const errors = {
            CART_NOT_FOUND: [404, "Cart not found"],
            PRODUCT_NOT_FOUND: [404, "Product not found"],
            PRODUCT_INACTIVE: [400, "Product is inactive"],
            INSUFFICIENT_STOCK: [400, "Requested quantity exceeds available stock"],
            ITEM_NOT_FOUND: [404, "Product is not in your cart"]
        };

        if (errors[error.message]) {
            return res.status(errors[error.message][0]).json({
                success: false,
                message: errors[error.message][1]
            });
        }

        console.error("Update cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update cart"
        });
    }
});


// Remove Product from Cart
router.delete("/remove/:productId", verifyToken, async (req, res) => {
    try {
        const { productId } = req.params;

        const cartRef = db.collection("carts").doc(req.user.uid);
        const cartDoc = await cartRef.get();

        if (!cartDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const items = (cartDoc.data().items || []).filter(
            item => item.productId !== productId
        );

        const total = items.reduce(
            (sum, item) => sum + item.subtotal,
            0
        );

        await cartRef.update({
            items,
            total,
            updatedAt: FieldValue.serverTimestamp()
        });

        return res.status(200).json({
            success: true,
            message: "Product removed from cart",
            cart: { items, total }
        });

    } catch (error) {
        console.error("Remove cart item error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to remove product from cart"
        });
    }
});


// Clear Entire Cart
router.delete("/clear", verifyToken, async (req, res) => {
    try {
        const cartRef = db.collection("carts").doc(req.user.uid);
        const cartDoc = await cartRef.get();

        if (!cartDoc.exists) {
            return res.status(200).json({
                success: true,
                message: "Cart is already empty"
            });
        }

        await cartRef.delete();

        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully"
        });

    } catch (error) {
        console.error("Clear cart error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to clear cart"
        });
    }
});

module.exports = router;
