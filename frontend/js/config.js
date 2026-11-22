
// NOVA - Application Configuration

const API_BASE_URL = "https://nova-online-shopping.onrender.com/api";

// Application details
const APP_NAME = "NOVA";
const APP_VERSION = "1.0.0";

// API endpoints
const API_ENDPOINTS = {
    products: "/products",
    categories: "/categories",
    customers: "/customers",
    auth: "/auth",
    cart: "/cart",
    orders: "/orders",
    billing: "/billing",
    reports: "/reports"
};

// Currency configuration
const CURRENCY = "INR";
const CURRENCY_SYMBOL = "₹";

console.log(`${APP_NAME} configuration loaded successfully.`);
