
const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");

const inventory = db.collection("inventory");


// Get all active products
router.get("/", async (req, res) => {
    try {
        const snapshot = await inventory
            .where("active", "==", true)
            .get();

        const products = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Get a product by ID
router.get("/:id", async (req, res) => {
    try {
        const id = req.params.id.trim();

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required"
            });
        }

        const productDoc = await inventory.doc(id).get();

        if (!productDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            product: {
                ...productDoc.data(),
                id: productDoc.id
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Add a new product
router.post("/", async (req, res) => {
    try {
        const { id, catId, title, description, qty, price } = req.body;

        if (!id || !catId || !title || !description ||
            qty === undefined || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "Please provide all product details"
            });
        }

        const productId = String(id).trim();
        const quantity = Number(qty);
        const productPrice = Number(price);

        if (!productId || !Number.isFinite(quantity) ||
            !Number.isFinite(productPrice) ||
            quantity < 0 || productPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID, quantity or price"
            });
        }

        const productRef = inventory.doc(productId);
        const existingProduct = await productRef.get();

        if (existingProduct.exists) {
            return res.status(409).json({
                success: false,
                message: "Product ID already exists"
            });
        }

        const product = {
            catId: String(catId).trim(),
            title: String(title).trim(),
            description: String(description).trim(),
            qty: quantity,
            price: productPrice,
            active: true
        };

        await productRef.set(product);

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            product: {
                id: productId,
                ...product
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Update an existing product
router.put("/:id", async (req, res) => {
    try {
        const id = req.params.id.trim();
        const { catId, title, description, qty, price } = req.body;

        if (!catId || !title || !description ||
            qty === undefined || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "Please provide all product details"
            });
        }

        const quantity = Number(qty);
        const productPrice = Number(price);

        if (!Number.isFinite(quantity) ||
            !Number.isFinite(productPrice) ||
            quantity < 0 || productPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid quantity or price"
            });
        }

        const productRef = inventory.doc(id);
        const existingProduct = await productRef.get();

        if (!existingProduct.exists) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        await productRef.update({
            catId: String(catId).trim(),
            title: String(title).trim(),
            description: String(description).trim(),
            qty: quantity,
            price: productPrice
        });

        res.status(200).json({
            success: true,
            message: "Product updated successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Delete a product
router.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id.trim();

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required"
            });
        }

        const productRef = inventory.doc(id);
        const existingProduct = await productRef.get();

        if (!existingProduct.exists) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        await productRef.delete();

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            deletedId: id
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


module.exports = router;
