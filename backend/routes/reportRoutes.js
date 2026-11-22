
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");
router.use(verifyToken, requireAdmin);

const { db } = require("../config/firebase");

// Convert Firestore timestamps and JavaScript dates into milliseconds
const getTime = (value) => {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

// Validate date range supplied as YYYY-MM-DD
const getDateRange = (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        res.status(400).json({
            success: false,
            message: "startDate and endDate are required (YYYY-MM-DD)"
        });
        return null;
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        startDate > endDate
    ) {
        res.status(400).json({
            success: false,
            message: "Please provide a valid date range"
        });
        return null;
    }

    return {
        start: start.getTime(),
        end: end.getTime()
    };
};

// Load orders and keep only orders inside the selected date range
const getOrdersInRange = async (start, end) => {
    const snapshot = await db.collection("orders").get();

    return snapshot.docs
        .map(doc => ({
            orderId: doc.id,
            ...doc.data()
        }))
        .filter(order => {
            const time = getTime(order.createdAt);
            return time >= start && time <= end;
        });
};

// Load order details for a list of orders
const getOrderDetails = async (orders) => {
    const snapshot = await db.collection("orderDetails").get();
    const orderIds = new Set(orders.map(order => order.orderId));

    return snapshot.docs
        .map(doc => doc.data())
        .filter(item => orderIds.has(item.orderId));
};


// CUSTOMER REPORTS

// Get All Customers
router.get("/customers", verifyToken, async (req, res) => {
    try {
        const snapshot = await db.collection("customers").get();

        const customers = snapshot.docs.map(doc => ({
            customerId: doc.id,
            ...doc.data()
        }));

        return res.status(200).json({
            success: true,
            count: customers.length,
            customers
        });

    } catch (error) {
        console.error("Customer report error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve customer report"
        });
    }
});


// Top 10 Customers by Purchase Amount
router.get("/customers/top", verifyToken, async (req, res) => {
    try {
        const range = getDateRange(req, res);
        if (!range) return;

        const orders = await getOrdersInRange(range.start, range.end);
        const totals = {};

        orders.forEach(order => {
            const uid = order.customerId;

            if (!uid) return;

            if (!totals[uid]) {
                totals[uid] = {
                    customerId: uid,
                    customerName: order.customerName || "",
                    email: order.email || "",
                    totalOrders: 0,
                    totalPurchase: 0
                };
            }

            totals[uid].totalOrders++;
            totals[uid].totalPurchase += Number(order.totalAmount || 0);
        });

        const customers = Object.values(totals)
            .sort((a, b) => b.totalPurchase - a.totalPurchase)
            .slice(0, 10);

        return res.status(200).json({
            success: true,
            count: customers.length,
            dateRange: req.query,
            customers
        });

    } catch (error) {
        console.error("Top customers report error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to generate top customers report"
        });
    }
});


// Cash or Credit Purchase Report
router.get("/customers/purchases/:paymentMethod", verifyToken, async (req, res) => {
    try {
        const paymentMethod = req.params.paymentMethod.toLowerCase();

        if (!["cash", "credit"].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Payment method must be cash or credit"
            });
        }

        const range = getDateRange(req, res);
        if (!range) return;

        const orders = await getOrdersInRange(range.start, range.end);

        const filteredOrders = orders.filter(
            order => order.paymentMethod === paymentMethod
        );

        const totalAmount = filteredOrders.reduce(
            (sum, order) => sum + Number(order.totalAmount || 0),
            0
        );

        return res.status(200).json({
            success: true,
            paymentMethod,
            count: filteredOrders.length,
            totalAmount,
            orders: filteredOrders
        });

    } catch (error) {
        console.error("Customer purchase report error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to generate purchase report"
        });
    }
});


// INVENTORY REPORTS

// Current Stock Report
router.get("/inventory/current-stock", verifyToken, async (req, res) => {
    try {
        const snapshot = await db.collection("inventory").get();

        const products = snapshot.docs.map(doc => {
            const product = doc.data();

            return {
                productId: doc.id,
                title: product.title,
                catId: product.catId,
                quantity: Number(product.qty || 0),
                price: Number(product.price || 0),
                stockValue:
                    Number(product.qty || 0) * Number(product.price || 0),
                active: product.active
            };
        });

        const totalStock = products.reduce(
            (sum, product) => sum + product.quantity,
            0
        );

        return res.status(200).json({
            success: true,
            productCount: products.length,
            totalStock,
            products
        });

    } catch (error) {
        console.error("Current stock report error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to generate current stock report"
        });
    }
});


// Category-wise Stock Report
router.get("/inventory/category-wise", verifyToken, async (req, res) => {
    try {
        const [productSnapshot, categorySnapshot] = await Promise.all([
            db.collection("inventory").get(),
            db.collection("categories").get()
        ]);

        const categoryNames = {};

        categorySnapshot.docs.forEach(doc => {
            categoryNames[doc.id] = doc.data().name;
        });

        const categories = {};

        productSnapshot.docs.forEach(doc => {
            const product = doc.data();
            const catId = product.catId || "Uncategorized";

            if (!categories[catId]) {
                categories[catId] = {
                    catId,
                    categoryName: categoryNames[catId] || "Uncategorized",
                    productCount: 0,
                    totalStock: 0,
                    stockValue: 0
                };
            }

            const quantity = Number(product.qty || 0);
            const price = Number(product.price || 0);

            categories[catId].productCount++;
            categories[catId].totalStock += quantity;
            categories[catId].stockValue += quantity * price;
        });

        return res.status(200).json({
            success: true,
            categories: Object.values(categories)
        });

    } catch (error) {
        console.error("Category stock report error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to generate category-wise stock report"
        });
    }
});


// High Stock Report: More than 100
router.get("/inventory/high-stock", verifyToken, async (req, res) => {
    try {
        const snapshot = await db.collection("inventory").get();

        const products = snapshot.docs
            .map(doc => ({
                productId: doc.id,
                ...doc.data(),
                quantity: Number(doc.data().qty || 0)
            }))
            .filter(product => product.quantity > 100);

        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error("High stock report error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to generate high stock report"
        });
    }
});


// Low Stock Report: Less than 15
router.get("/inventory/low-stock", verifyToken, async (req, res) => {
    try {
        const snapshot = await db.collection("inventory").get();

        const products = snapshot.docs
            .map(doc => ({
                productId: doc.id,
                ...doc.data(),
                quantity: Number(doc.data().qty || 0)
            }))
            .filter(product => product.quantity < 15);

        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error("Low stock report error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to generate low stock report"
        });
    }
});


// SALES REPORTS

// All Sales or Sales Within a Date Range
router.get("/sales", verifyToken, async (req, res) => {
    try {
        let orders;

        if (req.query.startDate || req.query.endDate) {
            const range = getDateRange(req, res);
            if (!range) return;

            orders = await getOrdersInRange(range.start, range.end);
        } else {
            const snapshot = await db.collection("orders").get();

            orders = snapshot.docs.map(doc => ({
                orderId: doc.id,
                ...doc.data()
            }));
        }

        const totalSales = orders.reduce(
            (sum, order) => sum + Number(order.totalAmount || 0),
            0
        );

        return res.status(200).json({
            success: true,
            count: orders.length,
            totalSales,
            orders
        });

    } catch (error) {
        console.error("Sales report error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to generate sales report"
        });
    }
});


// Category-wise Sales Report
router.get("/sales/category-wise", verifyToken, async (req, res) => {
    try {
        const orders = await getOrdersInRange(
            0,
            Number.MAX_SAFE_INTEGER
        );

        const details = await getOrderDetails(orders);
        const [productSnapshot, categorySnapshot] = await Promise.all([
            db.collection("inventory").get(),
            db.collection("categories").get()
        ]);

        const productCategories = {};
        const categoryNames = {};

        productSnapshot.docs.forEach(doc => {
            productCategories[doc.id] = doc.data().catId;
        });

        categorySnapshot.docs.forEach(doc => {
            categoryNames[doc.id] = doc.data().name;
        });

        const totals = {};

        details.forEach(item => {
            const catId = productCategories[item.productId] || "Uncategorized";

            if (!totals[catId]) {
                totals[catId] = {
                    catId,
                    categoryName: categoryNames[catId] || "Uncategorized",
                    totalQuantity: 0,
                    totalSales: 0
                };
            }

            totals[catId].totalQuantity += Number(item.quantity || 0);
            totals[catId].totalSales += Number(item.subtotal || 0);
        });

        return res.status(200).json({
            success: true,
            categories: Object.values(totals)
        });

    } catch (error) {
        console.error("Category sales report error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to generate category-wise sales report"
        });
    }
});


// Cash or Credit Sales Report
router.get("/sales/payment/:paymentMethod", verifyToken, async (req, res) => {
    try {
        const paymentMethod = req.params.paymentMethod.toLowerCase();

        if (!["cash", "credit"].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Payment method must be cash or credit"
            });
        }

        const orders = await getOrdersInRange(
            0,
            Number.MAX_SAFE_INTEGER
        );

        const filteredOrders = orders.filter(
            order => order.paymentMethod === paymentMethod
        );

        const totalSales = filteredOrders.reduce(
            (sum, order) => sum + Number(order.totalAmount || 0),
            0
        );

        return res.status(200).json({
            success: true,
            paymentMethod,
            count: filteredOrders.length,
            totalSales,
            orders: filteredOrders
        });

    } catch (error) {
        console.error("Payment sales report error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to generate payment sales report"
        });
    }
});


// Top 10 and Bottom 10 Selling Products
router.get("/sales/products/:type", verifyToken, async (req, res) => {
    try {
        const type = req.params.type.toLowerCase();

        if (!["top", "bottom"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Type must be top or bottom"
            });
        }

        const orders = await getOrdersInRange(
            0,
            Number.MAX_SAFE_INTEGER
        );

        const details = await getOrderDetails(orders);
        const totals = {};

        details.forEach(item => {
            const productId = item.productId;

            if (!totals[productId]) {
                totals[productId] = {
                    productId,
                    title: item.title,
                    totalQuantity: 0,
                    totalSales: 0
                };
            }

            totals[productId].totalQuantity += Number(item.quantity || 0);
            totals[productId].totalSales += Number(item.subtotal || 0);
        });

        const products = Object.values(totals).sort((a, b) => {
            if (type === "top") {
                return b.totalQuantity - a.totalQuantity;
            }

            return a.totalQuantity - b.totalQuantity;
        }).slice(0, 10);

        return res.status(200).json({
            success: true,
            type,
            count: products.length,
            products
        });

    } catch (error) {
        console.error("Product sales report error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to generate product sales report"
        });
    }
});

module.exports = router;
