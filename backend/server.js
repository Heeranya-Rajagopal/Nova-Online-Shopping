
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, ".env")
});

// Import routes
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const customerRoutes = require("./routes/customerRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const billingRoutes = require("./routes/billingRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect API routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/reports", reportRoutes);

// Test route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "NOVA Backend is running successfully!"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`NOVA Backend running on port ${PORT}`);
});
