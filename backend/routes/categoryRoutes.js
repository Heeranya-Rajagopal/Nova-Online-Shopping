
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

const { db } = require("../config/firebase");

const categories = db.collection("categories");
const inventory = db.collection("inventory");


// 1. Get all categories
router.get("/", async (req, res) => {
    try {
        const snapshot = await categories.get();

        const categoryList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return res.status(200).json({
            success: true,
            count: categoryList.length,
            categories: categoryList
        });

    } catch (error) {
        console.error("Get Categories Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve categories"
        });
    }
});


// 2. Get category by ID
router.get("/:id", async (req, res) => {
    try {
        const categoryDoc = await categories.doc(req.params.id).get();

        if (!categoryDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        return res.status(200).json({
            success: true,
            category: {
                id: categoryDoc.id,
                ...categoryDoc.data()
            }
        });

    } catch (error) {
        console.error("Get Category Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve category"
        });
    }
});


// 3. Add a new category
router.post("/", verifyToken, requireAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        const categoryName = name.trim();

        const existingCategories = await categories.get();

        const duplicate = existingCategories.docs.some(doc =>
            (doc.data().name || "").toLowerCase() === categoryName.toLowerCase()
        );

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: "Category already exists"
            });
        }

        const categoryData = {
            name: categoryName,
            description: typeof description === "string"
                ? description.trim()
                : ""
        };

        const categoryRef = await categories.add(categoryData);

        return res.status(201).json({
            success: true,
            message: "Category added successfully",
            category: {
                id: categoryRef.id,
                ...categoryData
            }
        });

    } catch (error) {
        console.error("Add Category Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add category"
        });
    }
});


// 4. Update category
router.put("/:id", verifyToken, requireAdmin, async (req, res) => {
    try {
        const { name, description } = req.body;

        const categoryRef = categories.doc(req.params.id);
        const categoryDoc = await categoryRef.get();

        if (!categoryDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        const updateData = {};

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Category name cannot be empty"
                });
            }

            updateData.name = name.trim();
        }

        if (description !== undefined) {
            if (typeof description !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Description must be a string"
                });
            }

            updateData.description = description.trim();
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide category details to update"
            });
        }

        if (updateData.name) {
            const existingCategories = await categories.get();

            const duplicate = existingCategories.docs.some(doc =>
                doc.id !== req.params.id &&
                (doc.data().name || "").toLowerCase() === updateData.name.toLowerCase()
            );

            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message: "Another category with this name already exists"
                });
            }
        }

        await categoryRef.update(updateData);

        const updatedDoc = await categoryRef.get();

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category: {
                id: updatedDoc.id,
                ...updatedDoc.data()
            }
        });

    } catch (error) {
        console.error("Update Category Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update category"
        });
    }
});


// 5. Delete category
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
    try {
        const categoryRef = categories.doc(req.params.id);
        const categoryDoc = await categoryRef.get();

        if (!categoryDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Check whether products are using this category
        const linkedProducts = await inventory
            .where("catId", "==", req.params.id)
            .limit(1)
            .get();

        if (!linkedProducts.empty) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete category because products are linked to it"
            });
        }

        await categoryRef.delete();

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully",
            id: req.params.id
        });

    } catch (error) {
        console.error("Delete Category Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete category"
        });
    }
});

module.exports = router;
