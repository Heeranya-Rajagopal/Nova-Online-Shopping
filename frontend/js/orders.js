
// ========================================
// NOVA - ORDER HISTORY MODULE
// ========================================

$(document).ready(function () {

    // Run only on the orders page
    if (!$("#ordersList").length) {
        return;
    }

    let allOrders = [];
    let currentFilter = "all";

    const ordersContainer = $("#ordersList");


    // ------------------------------------
    // GET ORDER ARRAY FROM API RESPONSE
    // ------------------------------------

    function getOrdersArray(response) {

        if (Array.isArray(response)) {
            return response;
        }

        if (Array.isArray(response.data)) {
            return response.data;
        }

        if (Array.isArray(response.orders)) {
            return response.orders;
        }

        if (response.data && Array.isArray(response.data.orders)) {
            return response.data.orders;
        }

        return [];

    }


    // ------------------------------------
    // ORDER FIELD HELPERS
    // ------------------------------------

    function getOrderId(order) {

        return order.id ||
               order.orderId ||
               order.order_id ||
               "";

    }


    function getOrderStatus(order) {

        return String(
            order.status ||
            order.orderStatus ||
            "pending"
        ).toLowerCase();

    }


    function getPaymentMethod(order) {

        return String(
            order.paymentMethod ||
            order.payment_method ||
            "Not specified"
        ).toLowerCase();

    }


    function getPaymentStatus(order) {

        return String(
            order.paymentStatus ||
            order.payment_status ||
            order.status ||
            "pending"
        ).toLowerCase();

    }


    function getOrderAmount(order) {

        return Number(
            order.total ||
            order.totalAmount ||
            order.grandTotal ||
            order.amount ||
            0
        );

    }


    function getOrderDate(order) {

        const dateValue = order.createdAt ||
                          order.orderDate ||
                          order.created_at ||
                          order.date;

        if (!dateValue) {
            return null;
        }

        if (typeof dateValue.toDate === "function") {
            return dateValue.toDate();
        }

        if (dateValue._seconds) {
            return new Date(dateValue._seconds * 1000);
        }

        if (dateValue.seconds) {
            return new Date(dateValue.seconds * 1000);
        }

        const date = new Date(dateValue);

        return Number.isNaN(date.getTime()) ? null : date;

    }


    // ------------------------------------
    // FORMAT DATE
    // ------------------------------------

    function formatOrderDate(dateValue) {

        const date = dateValue instanceof Date
            ? dateValue
            : getOrderDate({ createdAt: dateValue });

        if (!date) {
            return "Date unavailable";
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

    }


    // ------------------------------------
    // NORMALIZE ORDER STATUS
    // ------------------------------------

    function normalizeStatus(status) {

        const value = String(status || "").toLowerCase();

        if (["completed", "delivered"].includes(value)) {
            return "completed";
        }

        if (["paid", "confirmed"].includes(value)) {
            return "paid";
        }

        if (["cancelled", "canceled"].includes(value)) {
            return "cancelled";
        }

        if (["shipped", "processing"].includes(value)) {
            return value;
        }

        return "pending";

    }


    // ------------------------------------
    // LOAD ORDERS
    // ------------------------------------

    function loadOrders() {

        if (!getAuthToken()) {

            ordersContainer.html(`
                <div class="empty-orders">
                    <h2>Please login to view your orders</h2>
                    <a href="index.html" class="primary-btn">
                        Sign In
                    </a>
                </div>
            `);

            return;

        }

        ordersContainer.html(`
            <div class="orders-loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Loading your orders...</p>
            </div>
        `);

        apiGet("/orders/my-orders")

            .done(function (response) {

                allOrders = getOrdersArray(response);

                updateOrderStatistics();

                applyOrderFilters();

            })

            .fail(function (xhr) {

                ordersContainer.html(`
                    <div class="empty-orders">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <h2>Unable to load orders</h2>
                        <p>${escapeOrderHTML(getApiError(xhr))}</p>
                        <button type="button" id="retryOrders">
                            Try Again
                        </button>
                    </div>
                `);

            });

    }


    // ------------------------------------
    // UPDATE ORDER STATISTICS
    // ------------------------------------

    function updateOrderStatistics() {

        const totalOrders = allOrders.length;

        const pendingOrders = allOrders.filter(function (order) {

            return normalizeStatus(getOrderStatus(order)) === "pending";

        }).length;

        const paidOrders = allOrders.filter(function (order) {

            return getPaymentStatus(order) === "paid";

        }).length;

        const totalSpent = allOrders.reduce(function (total, order) {

            return total + getOrderAmount(order);

        }, 0);


        $("#totalOrders").text(totalOrders);

        $("#pendingOrders").text(pendingOrders);

        $("#paidOrders").text(paidOrders);

        $("#totalSpent").text(formatCurrency(totalSpent));

    }


    // ------------------------------------
    // FILTER ORDERS
    // ------------------------------------

    function applyOrderFilters() {

        let filteredOrders = [...allOrders];

        const searchText = $("#orderSearch").val()
            .trim()
            .toLowerCase();


        // Filter by order status
        if (currentFilter === "pending") {

            filteredOrders = filteredOrders.filter(function (order) {

                return normalizeStatus(getOrderStatus(order)) === "pending";

            });

        } else if (currentFilter === "paid") {

            filteredOrders = filteredOrders.filter(function (order) {

                return getPaymentStatus(order) === "paid";

            });

        } else if (currentFilter === "completed") {

            filteredOrders = filteredOrders.filter(function (order) {

                return normalizeStatus(getOrderStatus(order)) === "completed";

            });

        }


        // Search by order ID
        if (searchText) {

            filteredOrders = filteredOrders.filter(function (order) {

                return getOrderId(order)
                    .toLowerCase()
                    .includes(searchText);

            });

        }


        // Newest orders first
        filteredOrders.sort(function (a, b) {

            const dateA = getOrderDate(a)?.getTime() || 0;

            const dateB = getOrderDate(b)?.getTime() || 0;

            return dateB - dateA;

        });


        displayOrders(filteredOrders);

    }


    // ------------------------------------
    // DISPLAY ORDERS
    // ------------------------------------

    function displayOrders(orders) {

        ordersContainer.empty();

        $("#orderResultCount").text(
            orders.length + (orders.length === 1
                ? " order found"
                : " orders found")
        );


        if (!orders.length) {

            $("#emptyOrders").prop("hidden", false);

            return;

        }

        $("#emptyOrders").prop("hidden", true);


        orders.forEach(function (order) {

            ordersContainer.append(createOrderCard(order));

        });

    }


    // ------------------------------------
    // CREATE ORDER CARD
    // ------------------------------------

    function createOrderCard(order) {

        const orderId = getOrderId(order);

        const status = normalizeStatus(getOrderStatus(order));

        const paymentMethod = getPaymentMethod(order);

        const paymentStatus = getPaymentStatus(order);

        const amount = getOrderAmount(order);

        const orderDate = formatOrderDate(getOrderDate(order));


        const card = $(`
            <article class="order-card">

                <div class="order-card-header">

                    <div>
                        <span class="order-label">ORDER ID</span>
                        <h3>${escapeOrderHTML(orderId)}</h3>
                    </div>

                    <span class="order-status ${escapeOrderHTML(status)}">
                        ${escapeOrderHTML(status.toUpperCase())}
                    </span>

                </div>


                <div class="order-card-info">

                    <div>
                        <span>Order Date</span>
                        <strong>${escapeOrderHTML(orderDate)}</strong>
                    </div>

                    <div>
                        <span>Payment Method</span>
                        <strong>${escapeOrderHTML(paymentMethod.toUpperCase())}</strong>
                    </div>

                    <div>
                        <span>Payment Status</span>
                        <strong>${escapeOrderHTML(paymentStatus.toUpperCase())}</strong>
                    </div>

                    <div>
                        <span>Total Amount</span>
                        <strong>${formatCurrency(amount)}</strong>
                    </div>

                </div>


                <div class="order-card-footer">

                    <span>
                        <i class="fa-solid fa-box"></i>
                        View your purchase details
                    </span>

                    <button type="button" class="view-order-btn">
                        View Details
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>

                </div>

            </article>
        `);


        card.find(".view-order-btn").on("click", function () {

            openOrderDetails(orderId);

        });


        return card;

    }


    // ------------------------------------
    // VIEW ORDER DETAILS
    // ------------------------------------

    function openOrderDetails(orderId) {

        if (!orderId) {
            showError("Invalid order ID.");
            return;
        }

        $("#orderDetailsModal").removeClass("hidden");

        $("#orderDetailsContent").html(`
            <div class="orders-loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Loading order details...</p>
            </div>
        `);


        apiGet("/orders/" + encodeURIComponent(orderId))

            .done(function (response) {

                const order = response.data ||
                              response.order ||
                              response;

                displayOrderDetails(order);

            })

            .fail(function (xhr) {

                $("#orderDetailsContent").html(`
                    <div class="empty-orders">
                        <p>${escapeOrderHTML(getApiError(xhr))}</p>
                    </div>
                `);

            });

    }


    // ------------------------------------
    // DISPLAY ORDER DETAILS
    // ------------------------------------

    function displayOrderDetails(order) {

        const orderId = getOrderId(order);

        const status = normalizeStatus(getOrderStatus(order));

        const amount = getOrderAmount(order);

        const paymentMethod = getPaymentMethod(order);

        const paymentStatus = getPaymentStatus(order);

        const orderDate = formatOrderDate(getOrderDate(order));

        const items = Array.isArray(order.items)
            ? order.items
            : Array.isArray(order.orderDetails)
                ? order.orderDetails
                : [];


        let itemHTML = "";

        if (items.length) {

            items.forEach(function (item) {

                const title = String(item.title || item.productName || item.name || "Product")
                    .replace(/\s+(?:updated|update)$/i, "")
                    .trim();

                const quantity = Number(
                    item.quantity || item.qty || 0
                );

                const price = Number(
                    item.price || item.unitPrice || 0
                );

                const subtotal = Number(
                    item.subtotal ?? item.total ?? price * quantity
                );

                let imageUrl = item.imageUrl || item.image || "";
                if (!imageUrl) {
                    const titleKey = String(title).toLowerCase();
                    const imageMap = [
                        ["headphone", "wireless-headphones.webp"],
                        ["bluetooth speaker", "bluetooth-speaker.webp"],
                        ["speaker", "bluetooth-speaker.webp"],
                        ["bluetooth keyboard", "bluetooth-keyboard.webp"],
                        ["keyboard", "bluetooth-keyboard.webp"],
                        ["earbuds", "wireless-earbuds.webp"],
                        ["earbud", "wireless-earbuds.webp"],
                        ["smart watch", "smart-watch.webp"],
                        ["watch", "smart-watch.webp"],
                        ["mouse", "wireless-mouse.webp"],
                        ["t-shirt", "casual-t-shirt.webp"],
                        ["shirt", "casual-t-shirt.webp"],
                        ["jeans", "denim-jeans.webp"],
                        ["lamp", "table-lamp.webp"],
                        ["face wash", "face-wash.webp"],
                        ["java", "java-programming-book.webp"],
                        ["programming book", "java-programming-book.webp"]
                    ];
                    const match = imageMap.find(([keyword]) => titleKey.includes(keyword));
                    if (match) imageUrl = "assets/images/" + match[1];
                }
                const imageMarkup = imageUrl
                    ? `<img class="order-item-image" src="${escapeOrderHTML(imageUrl)}" alt="${escapeOrderHTML(title)}" loading="lazy" onerror="this.style.display='none'">`
                    : `<span class="order-item-image-placeholder"><i class="fa-solid fa-box"></i></span>`;

                itemHTML += `
                    <div class="order-detail-item">

                        ${imageMarkup}

                        <div class="order-detail-item-info">
                            <strong>${escapeOrderHTML(title)}</strong>
                            <span>Quantity: ${quantity}</span>
                        </div>

                        <strong>${formatCurrency(subtotal)}</strong>

                    </div>
                `;

            });

        } else {

            itemHTML = `
                <p>Individual product details are unavailable.</p>
            `;

        }


        $("#orderDetailsContent").html(`

            <div class="order-detail-overview">

                <div>
                    <span>Order ID</span>
                    <strong>${escapeOrderHTML(orderId)}</strong>
                </div>

                <div>
                    <span>Order Date</span>
                    <strong>${escapeOrderHTML(orderDate)}</strong>
                </div>

                <div>
                    <span>Order Status</span>
                    <strong>${escapeOrderHTML(status.toUpperCase())}</strong>
                </div>

                <div>
                    <span>Payment Method</span>
                    <strong>${escapeOrderHTML(paymentMethod.toUpperCase())}</strong>
                </div>

                <div>
                    <span>Payment Status</span>
                    <strong>${escapeOrderHTML(paymentStatus.toUpperCase())}</strong>
                </div>

            </div>


            <div class="order-detail-products">

                <h3>Purchased Products</h3>

                ${itemHTML}

            </div>


            <div class="order-detail-total">

                <span>Total Amount</span>

                <strong>${formatCurrency(amount)}</strong>

            </div>

            <div class="invoice-actions">
                ${paymentStatus === "paid"
                    ? `<button type="button" class="primary-btn" id="viewInvoiceBtn"
                               data-order-id="${escapeOrderHTML(orderId)}">
                            <i class="fa-solid fa-file-invoice"></i> View / Print Invoice
                       </button>`
                    : `<p class="invoice-pending-note">
                            <i class="fa-solid fa-circle-info"></i>
                            Your invoice will be available and emailed after payment is confirmed.
                       </p>`}
            </div>

        `);

        $("#viewInvoiceBtn").off("click").on("click", function () {
            loadAndPrintInvoice(orderId);
        });

    }


    // ------------------------------------
    // VIEW / PRINT CUSTOMER INVOICE
    // ------------------------------------

    function loadAndPrintInvoice(orderId) {
        const invoiceUrl = "/billing/" + encodeURIComponent(orderId);

        function fetchInvoice() {
            apiGet(invoiceUrl)
                .done(function (response) {
                    const invoice = response.invoice || response.data?.invoice || response.data || response;
                    renderPrintableInvoice(invoice);
                })
                .fail(function (xhr) {
                    if (xhr.status === 404) {
                        apiPost("/billing/generate/" + encodeURIComponent(orderId), {})
                            .done(function (response) {
                                const invoice = response.invoice || response.data?.invoice || response.data || response;
                                renderPrintableInvoice(invoice);
                                if (response.email && response.email.sent) {
                                    showSuccess("Invoice generated and emailed to your registered email.");
                                }
                            })
                            .fail(function (generateError) {
                                showError(getApiError(generateError) || "Invoice could not be generated.");
                            });
                    } else {
                        showError(getApiError(xhr) || "Invoice is not available yet.");
                    }
                });
        }

        fetchInvoice();
    }

    function renderPrintableInvoice(invoice) {
        const items = Array.isArray(invoice.items) ? invoice.items : [];
        const rows = items.map(function (item) {
            const quantity = Number(item.quantity || 0);
            const price = Number(item.price || item.unitPrice || 0);
            const subtotal = Number(item.subtotal ?? price * quantity);
            const invoiceTitle = String(item.title || item.productTitle || "Product")
                .replace(/\s+(?:updated|update)$/i, "").trim();
            return `<tr>
                <td>${escapeOrderHTML(invoiceTitle)}</td>
                <td>${quantity}</td>
                <td>${formatCurrency(price)}</td>
                <td>${formatCurrency(subtotal)}</td>
            </tr>`;
        }).join("");

        const printWindow = window.open("", "_blank", "width=900,height=750");
        if (!printWindow) {
            showError("Please allow pop-ups to view and print your invoice.");
            return;
        }

        printWindow.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${escapeOrderHTML(invoice.invoiceNumber || "NOVA Invoice")}</title>
<style>
body{font-family:Arial,sans-serif;color:#241333;margin:0;padding:40px;background:#f8f5fc}
.invoice{max-width:800px;margin:auto;background:#fff;padding:42px;border:1px solid #eee;border-radius:14px}
.top{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #7628d7;padding-bottom:22px}
.logo{font-size:30px;font-weight:800;color:#7628d7;letter-spacing:2px}
h1{font-size:24px;margin:25px 0 8px}
.muted{color:#777;font-size:13px;line-height:1.7}
table{width:100%;border-collapse:collapse;margin-top:28px}
th,td{text-align:left;padding:13px 10px;border-bottom:1px solid #eee;font-size:13px}
th{background:#f6efff;color:#55218a}
.total{text-align:right;font-size:20px;font-weight:800;margin-top:25px;color:#7628d7}
.paid{display:inline-block;padding:7px 12px;background:#e8f8ef;color:#138a59;border-radius:20px;font-size:12px;font-weight:bold}
.actions{margin-top:30px;text-align:right}
button{background:#7628d7;color:#fff;border:0;border-radius:8px;padding:12px 20px;font-weight:bold;cursor:pointer}
@media print{body{padding:0;background:#fff}.invoice{border:0;border-radius:0;padding:20px}.actions{display:none}}
</style></head><body><main class="invoice">
<div class="top"><div><div class="logo">NOVA.</div><p class="muted">Online Shopping<br>Customer Invoice</p></div>
<div><h2>INVOICE</h2><p class="muted">Invoice: ${escapeOrderHTML(invoice.invoiceNumber || "")}<br>Order: ${escapeOrderHTML(invoice.orderId || "")}<br>Payment: ${escapeOrderHTML(String(invoice.paymentMethod || "").toUpperCase())}</p><span class="paid">PAID</span></div></div>
<h1>Thank you for shopping with NOVA!</h1>
<p class="muted">Billed to: ${escapeOrderHTML(invoice.customerName || "NOVA Customer")}<br>Email: ${escapeOrderHTML(invoice.email || "")}</p>
<table><thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
<div class="total">Total: ${formatCurrency(Number(invoice.totalAmount || invoice.subtotal || 0))}</div>
<p class="muted">This is a computer-generated invoice from NOVA Online Shopping.</p>
<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>
</main></body></html>`);
        printWindow.document.close();
    }

    // ------------------------------------
    // CLOSE ORDER DETAILS MODAL
    // ------------------------------------

    $("#closeOrderModal").on("click", function () {

        $("#orderDetailsModal").addClass("hidden");

    });


    $("#orderDetailsModal").on("click", function (event) {

        if (event.target === this) {

            $(this).addClass("hidden");

        }

    });


    // ------------------------------------
    // FILTER BUTTON EVENTS
    // ------------------------------------

    $(".order-filter").on("click", function () {

        $(".order-filter").removeClass("active");

        $(this).addClass("active");

        currentFilter = $(this).data("filter");

        applyOrderFilters();

    });


    // ------------------------------------
    // SEARCH ORDERS
    // ------------------------------------

    $("#orderSearch").on("input", function () {

        applyOrderFilters();

    });


    // ------------------------------------
    // REFRESH ORDERS
    // ------------------------------------

    $("#refreshOrders").on("click", function () {

        loadOrders();

    });


    // Retry loading
    $(document).on("click", "#retryOrders", function () {

        loadOrders();

    });


    // ------------------------------------
    // HTML ESCAPE
    // ------------------------------------

    function escapeOrderHTML(value) {

        return String(value ?? "").replace(/[&<>"']/g, function (character) {

            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return entities[character];

        });

    }


    // ------------------------------------
    // INITIALIZE
    // ------------------------------------

    if (!getAuthToken()) {

        ordersContainer.html(`
            <div class="empty-orders">
                <h2>Please login to view your orders</h2>
                <a href="index.html" class="primary-btn">
                    Sign In
                </a>
            </div>
        `);

    } else {

        loadOrders();

    }

});


// ========================================
// MODULE LOADED
// ========================================

console.log("NOVA Orders module loaded successfully.");
