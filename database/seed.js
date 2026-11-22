
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("../../nova-private/serviceAccountKey.json");

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

// --------------------------------------
// 1. CATEGORIES
// --------------------------------------

const categories = [
    {
        id: "CAT001",
        name: "Electronics",
        description: "Electronic gadgets and accessories"
    },
    {
        id: "CAT002",
        name: "Fashion",
        description: "Clothing and fashion accessories"
    },
    {
        id: "CAT003",
        name: "Home & Living",
        description: "Products for home and daily living"
    },
    {
        id: "CAT004",
        name: "Beauty",
        description: "Beauty and personal care products"
    },
    {
        id: "CAT005",
        name: "Books",
        description: "Books and stationery"
    }
];

// --------------------------------------
// 2. INVENTORY / PRODUCTS
// --------------------------------------

const inventory = [
    {
        id: "PRD001",
        catId: "CAT001",
        title: "Wireless Headphones",
        imageUrl: "assets/images/wireless-headphones.webp",
        description: "Bluetooth over-ear headphones",
        qty: 120,
        price: 2499,
        active: true
    },
    {
        id: "PRD002",
        catId: "CAT001",
        title: "Smart Watch",
        imageUrl: "assets/images/smart-watch.webp",
        description: "Smart watch with fitness tracking",
        qty: 85,
        price: 3499,
        active: true
    },
    {
        id: "PRD003",
        catId: "CAT001",
        title: "Wireless Mouse",
        imageUrl: "assets/images/wireless-mouse.webp",
        description: "Rechargeable wireless mouse",
        qty: 150,
        price: 799,
        active: true
    },
    {
        id: "PRD004",
        catId: "CAT002",
        title: "Casual T-Shirt",
        imageUrl: "assets/images/casual-t-shirt.webp",
        description: "Cotton casual wear T-shirt",
        qty: 90,
        price: 599,
        active: true
    },
    {
        id: "PRD005",
        catId: "CAT002",
        title: "Denim Jeans",
        imageUrl: "assets/images/denim-jeans.webp",
        description: "Regular fit denim jeans",
        qty: 65,
        price: 1499,
        active: true
    },
    {
        id: "PRD006",
        catId: "CAT003",
        title: "Table Lamp",
        imageUrl: "assets/images/table-lamp.webp",
        description: "Modern LED study table lamp",
        qty: 12,
        price: 999,
        active: true
    },
    {
        id: "PRD007",
        catId: "CAT004",
        title: "Face Wash",
        imageUrl: "assets/images/face-wash.webp",
        description: "Gentle daily face cleanser",
        qty: 8,
        price: 349,
        active: true
    },
    {
        id: "PRD008",
        catId: "CAT005",
        title: "Java Programming Book",
        imageUrl: "assets/images/java-programming-book.webp",
        description: "Beginner-friendly Java programming guide",
        qty: 110,
        price: 699,
        active: true
    }
];

// --------------------------------------
// 3. CUSTOMERS
// --------------------------------------

const customers = [
    {
        id: "CUS001",
        name: "Heeranya",
        email: "heeranya@example.com",
        phone: "9876543210",
        creditLimit: 1000,
        creditUsed: 0,
        status: "active"
    },
    {
        id: "CUS002",
        name: "Harshini",
        email: "harshini@example.com",
        phone: "9876543211",
        creditLimit: 1000,
        creditUsed: 500,
        status: "active"
    },
    {
        id: "CUS003",
        name: "Arun",
        email: "arun@example.com",
        phone: "9876543212",
        creditLimit: 1500,
        creditUsed: 0,
        status: "active"
    },
    {
        id: "CUS004",
        name: "Priya",
        email: "priya@example.com",
        phone: "9876543213",
        creditLimit: 1000,
        creditUsed: 300,
        status: "active"
    }
];

// --------------------------------------
// 4. CARTS
// --------------------------------------

const carts = [
    {
        id: "CART001",
        customerId: "CUS001",
        items: [
            { productId: "PRD001", quantity: 1 },
            { productId: "PRD003", quantity: 2 }
        ],
        status: "active"
    },
    {
        id: "CART002",
        customerId: "CUS002",
        items: [
            { productId: "PRD004", quantity: 2 }
        ],
        status: "active"
    }
];

// --------------------------------------
// 5. ORDERS
// --------------------------------------

const orders = [
    {
        id: "ORD001",
        customerId: "CUS001",
        totalAmount: 2499,
        paymentMethod: "cash",
        paymentStatus: "paid",
        orderStatus: "delivered",
        orderDate: new Date("2026-11-10T10:00:00")
    },
    {
        id: "ORD002",
        customerId: "CUS002",
        totalAmount: 500,
        paymentMethod: "credit",
        paymentStatus: "paid",
        orderStatus: "delivered",
        orderDate: new Date("2026-11-12T11:30:00")
    },
    {
        id: "ORD003",
        customerId: "CUS003",
        totalAmount: 1499,
        paymentMethod: "cash",
        paymentStatus: "paid",
        orderStatus: "shipped",
        orderDate: new Date("2026-11-15T14:00:00")
    },
    {
        id: "ORD004",
        customerId: "CUS004",
        totalAmount: 300,
        paymentMethod: "credit",
        paymentStatus: "paid",
        orderStatus: "confirmed",
        orderDate: new Date("2026-11-18T09:30:00")
    }
];

// --------------------------------------
// 6. ORDER DETAILS
// --------------------------------------

const orderDetails = [
    {
        id: "OD001",
        orderId: "ORD001",
        productId: "PRD001",
        productTitle: "Wireless Headphones",
        quantity: 1,
        unitPrice: 2499,
        subtotal: 2499
    },
    {
        id: "OD002",
        orderId: "ORD002",
        productId: "PRD004",
        productTitle: "Casual T-Shirt",
        quantity: 1,
        unitPrice: 500,
        subtotal: 500
    },
    {
        id: "OD003",
        orderId: "ORD003",
        productId: "PRD005",
        productTitle: "Denim Jeans",
        quantity: 1,
        unitPrice: 1499,
        subtotal: 1499
    },
    {
        id: "OD004",
        orderId: "ORD004",
        productId: "PRD007",
        productTitle: "Face Wash",
        quantity: 1,
        unitPrice: 300,
        subtotal: 300
    }
];

// --------------------------------------
// INSERT ALL DATA INTO FIRESTORE
// --------------------------------------

async function seedDatabase() {
    try {
        const collections = [
            { name: "categories", data: categories },
            { name: "inventory", data: inventory },
            { name: "customers", data: customers },
            { name: "carts", data: carts },
            { name: "orders", data: orders },
            { name: "orderDetails", data: orderDetails }
        ];

        for (const collection of collections) {
            for (const item of collection.data) {
                const { id, ...data } = item;

                await db.collection(collection.name)
                    .doc(id)
                    .set(data, { merge: true });
            }

            console.log(
                `${collection.name}: ${collection.data.length} documents inserted`
            );
        }

        console.log("\nNOVA DATABASE SEEDED SUCCESSFULLY!");

    } catch (error) {
        console.error("Database seeding failed:", error);
    }
}

seedDatabase();
