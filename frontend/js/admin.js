
// ========================================
// NOVA - ADMIN DASHBOARD MODULE
// ========================================

$(document).ready(function () {

    // Run only on admin page
    if (!$("#adminDashboard").length && !$("#adminProducts").length) {
        return;
    }

    let products = [];
    let categories = [];
    let customers = [];

    let editingProductId = null;
    let editingCategoryId = null;


    function cleanAdminProductTitle(value) {
        return String(value || "NOVA Product").replace(/\s+(?:updated|update)$/i, "").trim();
    }

    function getAdminProductImage(product) {
        if (product.imageUrl || product.image || product.imageURL) {
            return product.imageUrl || product.image || product.imageURL;
        }
        const title = String(product.title || "").toLowerCase();
        const map = [
            ["headphone", "wireless-headphones.webp"],
            ["bluetooth speaker", "bluetooth-speaker.webp"],
            ["speaker", "bluetooth-speaker.webp"],
            ["bluetooth keyboard", "bluetooth-keyboard.webp"],
            ["keyboard", "bluetooth-keyboard.webp"],
            ["earbuds", "wireless-earbuds.webp"],
            ["earbud", "wireless-earbuds.webp"], ["smart watch", "smart-watch.webp"],
            ["watch", "smart-watch.webp"], ["mouse", "wireless-mouse.webp"],
            ["t-shirt", "casual-t-shirt.webp"], ["shirt", "casual-t-shirt.webp"],
            ["jeans", "denim-jeans.webp"], ["lamp", "table-lamp.webp"],
            ["face wash", "face-wash.webp"], ["java", "java-programming-book.webp"],
            ["programming book", "java-programming-book.webp"]
        ];
        const match = map.find(([keyword]) => title.includes(keyword));
        return match ? "assets/images/" + match[1] : "";
    }

    // ------------------------------------
    // COMMON MESSAGE
    // ------------------------------------

    function adminMessage(message, type = "success") {

        const box = $("#adminMessage");

        if (!box.length) {
            alert(message);
            return;
        }

        box.removeClass("success error")
            .addClass(type)
            .text(message)
            .show();

    }


    // ------------------------------------
    // AUTHENTICATION
    // ------------------------------------

    if (!getAuthToken()) {
        window.location.href = "index.html";
        return;
    }


    // ------------------------------------
    // LOAD ADMIN DASHBOARD
    // ------------------------------------

    function loadDashboard() {

        loadProducts();
        loadCategories();
        loadCustomers();
        loadSalesReport();

    }


    // ====================================
    // PRODUCT MANAGEMENT
    // ====================================

    // ------------------------------------
    // LOAD PRODUCTS
    // ------------------------------------

    function loadProducts() {

        const container = $("#adminProducts");

        if (!container.length) {
            return;
        }

        container.html(`
            <p><i class="fa-solid fa-spinner fa-spin"></i>
            Loading products...</p>
        `);

        apiGet("/products")

            .done(function (response) {

                products = getArray(response);

                displayProducts();

                $("#productTotal").text(products.length);

            })

            .fail(function (xhr) {

                container.html(
                    `<p>${escapeHTML(getApiError(xhr))}</p>`
                );

            });

    }


    // ------------------------------------
    // DISPLAY PRODUCTS
    // ------------------------------------

    function displayProducts() {

        const container = $("#adminProducts");

        container.empty();

        if (!products.length) {

            container.html("<p>No products available.</p>");

            return;

        }

        const table = $(`
            <div class="admin-table-wrapper">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Product ID</th>
                            <th>Product Name</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `);

        products.forEach(function (product) {

            const id = product.id || product.productId;

            const row = $(`
                <tr>
                    <td><img class="admin-product-thumb" src="${escapeHTML(getAdminProductImage(product))}" alt="${escapeHTML(cleanAdminProductTitle(product.title))}" onerror="this.onerror=null;const t='${escapeHTML(cleanAdminProductTitle(product.title).toLowerCase())}';const m=t.includes('speaker')?'bluetooth-speaker.webp':t.includes('keyboard')?'bluetooth-keyboard.webp':t.includes('earbud')?'wireless-earbuds.webp':t.includes('headphone')?'wireless-headphones.webp':t.includes('watch')?'smart-watch.webp':t.includes('mouse')?'wireless-mouse.webp':t.includes('shirt')?'casual-t-shirt.webp':t.includes('jean')?'denim-jeans.webp':t.includes('lamp')?'table-lamp.webp':t.includes('face wash')?'face-wash.webp':t.includes('java')||t.includes('book')?'java-programming-book.webp':'';if(m){this.src='assets/images/'+m;}else{this.style.display='none';}"></td>
                    <td>${escapeHTML(id)}</td>
                    <td>${escapeHTML(cleanAdminProductTitle(product.title))}</td>
                    <td>${formatCurrency(product.price)}</td>
                    <td>${Number(product.qty || 0)}</td>
                    <td>
                        ${product.active === false ? "Inactive" : "Active"}
                    </td>
                    <td>
                        <button type="button" class="edit-product">
                            Edit
                        </button>

                        <button type="button" class="delete-product">
                            Delete
                        </button>
                    </td>
                </tr>
            `);

            row.find(".edit-product").on("click", function () {

                editProduct(id);

            });

            row.find(".delete-product").on("click", function () {

                deleteProduct(id);

            });

            table.find("tbody").append(row);

        });

        container.append(table);

    }


    // ------------------------------------
    // ADD PRODUCT
    // ------------------------------------

    $("#productForm").on("submit", function (event) {

        event.preventDefault();

        const productData = {

            id: editingProductId || ("PROD" + Date.now()),

            title: $("#productTitle").val().trim(),

            description: $("#productDescription").val().trim(),

            catId: $("#productCategory").val(),

            price: Number($("#productPrice").val()),

            qty: Number($("#productQty").val()),

            active: $("#productActive").is(":checked"),

            imageUrl: $("#productImageUrl").val().trim()

        };


        if (!productData.title ||
            !productData.description ||
            !productData.catId ||
            productData.price < 0 ||
            productData.qty < 0 ||
            !Number.isFinite(productData.price) ||
            !Number.isInteger(productData.qty)) {

            adminMessage(
                "Please enter valid product details.",
                "error"
            );

            return;

        }


        const request = editingProductId
            ? apiPut(
                "/products/" + encodeURIComponent(editingProductId),
                productData
            )
            : apiPost("/products", productData);


        request

            .done(function (response) {

                adminMessage(
                    response.message ||
                    (editingProductId
                        ? "Product updated successfully."
                        : "Product added successfully.")
                );

                resetProductForm();

                loadProducts();

            })

            .fail(function (xhr) {

                adminMessage(
                    getApiError(xhr),
                    "error"
                );

            });

    });


    // ------------------------------------
    // EDIT PRODUCT
    // ------------------------------------

    function editProduct(productId) {

        const product = products.find(function (item) {

            return String(item.id || item.productId) === String(productId);

        });

        if (!product) {
            adminMessage("Product not found.", "error");
            return;
        }

        editingProductId = productId;

        $("#productTitle").val(cleanAdminProductTitle(product.title));

        $("#productDescription").val(product.description || "");

        $("#productCategory").val(product.catId || "");

        $("#productPrice").val(product.price || 0);

        $("#productQty").val(product.qty || 0);

        $("#productImageUrl").val(product.imageUrl || "");

        $("#productActive").prop(
            "checked",
            product.active !== false
        );

        $("#productSubmitButton").text("Update Product");

        $("#productFormHeading").text("Update Product");

        $("#productForm")[0].scrollIntoView({
            behavior: "smooth"
        });

    }


    // ------------------------------------
    // DELETE PRODUCT
    // ------------------------------------

    function deleteProduct(productId) {

        if (!confirm("Are you sure you want to delete this product?")) {
            return;
        }

        apiDelete(
            "/products/" + encodeURIComponent(productId)
        )

        .done(function (response) {

            adminMessage(
                response.message || "Product deleted successfully."
            );

            loadProducts();

        })

        .fail(function (xhr) {

            adminMessage(
                getApiError(xhr),
                "error"
            );

        });

    }


    // ------------------------------------
    // RESET PRODUCT FORM
    // ------------------------------------

    function resetProductForm() {

        editingProductId = null;

        if ($("#productForm").length) {
            $("#productForm")[0].reset();
        }

        $("#productFormHeading").text("Add New Product");

        $("#productSubmitButton").text("Add Product");

    }


    $("#resetProductForm").on("click", resetProductForm);


    // ====================================
    // CATEGORY MANAGEMENT
    // ====================================

    // ------------------------------------
    // LOAD CATEGORIES
    // ------------------------------------

    function loadCategories() {

        const container = $("#adminCategories");

        if (!container.length) {
            return;
        }

        apiGet("/categories")

            .done(function (response) {

                categories = getArray(response);

                displayCategories();

                populateCategoryDropdown();

                $("#categoryTotal").text(categories.length);

            })

            .fail(function (xhr) {

                container.html(
                    `<p>${escapeHTML(getApiError(xhr))}</p>`
                );

            });

    }


    // ------------------------------------
    // DISPLAY CATEGORIES
    // ------------------------------------

    function displayCategories() {

        const container = $("#adminCategories");

        container.empty();

        if (!categories.length) {

            container.html("<p>No categories available.</p>");

            return;

        }

        const table = $(`
            <div class="admin-table-wrapper">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Category ID</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `);

        categories.forEach(function (category) {

            const id = category.id || category.catId;

            const row = $(`
                <tr>
                    <td>${escapeHTML(id)}</td>
                    <td>${escapeHTML(category.name || "")}</td>
                    <td>${escapeHTML(category.description || "")}</td>
                    <td>
                        <button type="button" class="edit-category">
                            Edit
                        </button>

                        <button type="button" class="delete-category">
                            Delete
                        </button>
                    </td>
                </tr>
            `);

            row.find(".edit-category").on("click", function () {

                editCategory(id);

            });

            row.find(".delete-category").on("click", function () {

                deleteCategory(id);

            });

            table.find("tbody").append(row);

        });

        container.append(table);

    }


    // ------------------------------------
    // POPULATE CATEGORY DROPDOWN
    // ------------------------------------

    function populateCategoryDropdown() {

        const dropdown = $("#productCategory");

        if (!dropdown.length) {
            return;
        }

        const selectedValue = dropdown.val();

        dropdown.empty();

        dropdown.append(
            '<option value="">Select Category</option>'
        );

        categories.forEach(function (category) {

            const id = category.id || category.catId;

            dropdown.append(
                $("<option>", {
                    value: id,
                    text: category.name
                })
            );

        });

        if (selectedValue) {
            dropdown.val(selectedValue);
        }

    }


    // ------------------------------------
    // ADD CATEGORY
    // ------------------------------------

    $("#categoryForm").on("submit", function (event) {

        event.preventDefault();

        const categoryData = {

            name: $("#categoryName").val().trim(),

            description: $("#categoryDescription").val().trim()

        };


        if (!categoryData.name) {

            adminMessage(
                "Please enter a category name.",
                "error"
            );

            return;

        }


        const request = editingCategoryId
            ? apiPut(
                "/categories/" + encodeURIComponent(editingCategoryId),
                categoryData
            )
            : apiPost("/categories", categoryData);


        request

            .done(function (response) {

                adminMessage(
                    response.message ||
                    (editingCategoryId
                        ? "Category updated successfully."
                        : "Category added successfully.")
                );

                resetCategoryForm();

                loadCategories();

            })

            .fail(function (xhr) {

                adminMessage(
                    getApiError(xhr),
                    "error"
                );

            });

    });


    // ------------------------------------
    // EDIT CATEGORY
    // ------------------------------------

    function editCategory(categoryId) {

        const category = categories.find(function (item) {

            return String(item.id || item.catId) === String(categoryId);

        });

        if (!category) {
            adminMessage("Category not found.", "error");
            return;
        }

        editingCategoryId = categoryId;

        $("#categoryName").val(category.name || "");

        $("#categoryDescription").val(
            category.description || ""
        );

        $("#categoryFormHeading").text("Update Category");

        $("#categorySubmitButton").text("Update Category");

        $("#categoryForm")[0].scrollIntoView({
            behavior: "smooth"
        });

    }


    // ------------------------------------
    // DELETE CATEGORY
    // ------------------------------------

    function deleteCategory(categoryId) {

        if (!confirm("Are you sure you want to delete this category?")) {
            return;
        }

        apiDelete(
            "/categories/" + encodeURIComponent(categoryId)
        )

        .done(function (response) {

            adminMessage(
                response.message || "Category deleted successfully."
            );

            loadCategories();

        })

        .fail(function (xhr) {

            adminMessage(
                getApiError(xhr),
                "error"
            );

        });

    }


    // ------------------------------------
    // RESET CATEGORY FORM
    // ------------------------------------

    function resetCategoryForm() {

        editingCategoryId = null;

        if ($("#categoryForm").length) {
            $("#categoryForm")[0].reset();
        }

        $("#categoryFormHeading").text("Add New Category");

        $("#categorySubmitButton").text("Add Category");

    }


    $("#resetCategoryForm").on("click", resetCategoryForm);


    // ====================================
    // CUSTOMER MANAGEMENT
    // ====================================

    // ------------------------------------
    // LOAD CUSTOMERS
    // ------------------------------------

    function loadCustomers() {

        const container = $("#adminCustomers");

        if (!container.length) {
            return;
        }

        apiGet("/customers")

            .done(function (response) {

                customers = getArray(response);

                displayCustomers();

                $("#customerTotal").text(customers.length);

            })

            .fail(function (xhr) {

                container.html(
                    `<p>${escapeHTML(getApiError(xhr))}</p>`
                );

            });

    }


    // ------------------------------------
    // DISPLAY CUSTOMERS
    // ------------------------------------

    function displayCustomers() {

        const container = $("#adminCustomers");

        container.empty();

        if (!customers.length) {

            container.html("<p>No customers available.</p>");

            return;

        }

        const table = $(`
            <div class="admin-table-wrapper">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Customer ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Credit Limit</th>
                            <th>Credit Used</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `);

        customers.forEach(function (customer) {

            const id = customer.uid ||
                       customer.id ||
                       customer.customerId ||
                       "";

            const name = customer.fullName ||
                         customer.name ||
                         "";

            const active = customer.active !== undefined
                ? customer.active
                : String(customer.status || "active").toLowerCase() === "active";

            const row = $(`
                <tr>
                    <td>${escapeHTML(id)}</td>
                    <td>${escapeHTML(name)}</td>
                    <td>${escapeHTML(customer.email || "")}</td>
                    <td>${escapeHTML(customer.phone || "")}</td>
                    <td>${formatCurrency(customer.creditLimit || 0)}</td>
                    <td>${formatCurrency(customer.creditUsed || 0)}</td>
                    <td>${active ? "Active" : "Inactive"}</td>
                </tr>
            `);

            table.find("tbody").append(row);

        });

        container.append(table);

    }


    // ====================================
    // SALES REPORTS
    // ====================================

    // ------------------------------------
    // LOAD SALES REPORT
    // ------------------------------------

    function loadSalesReport() {

        const container = $("#adminSalesReport");

        if (!container.length) {
            return;
        }

        apiGet("/reports/sales")

            .done(function (response) {

                const report = response.data || response;

                displaySalesReport(report);

            })

            .fail(function (xhr) {

                container.html(
                    `<p>${escapeHTML(getApiError(xhr))}</p>`
                );

            });

    }


    // ------------------------------------
    // DISPLAY SALES REPORT
    // ------------------------------------

    function displaySalesReport(report) {

        const container = $("#adminSalesReport");

        container.empty();

        let sales = Array.isArray(report)
            ? report
            : report.sales || report.orders || [];

        if (!sales.length) {

            container.html("<p>No sales information available.</p>");

            return;

        }

        const table = $(`
            <div class="admin-table-wrapper">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Payment Method</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `);

        sales.forEach(function (sale) {

            const row = $(`
                <tr>
                    <td>${escapeHTML(sale.id || sale.orderId || "")}</td>
                    <td>${escapeHTML(sale.customerName || sale.fullName || sale.uid || "")}</td>
                    <td>${escapeHTML(sale.paymentMethod || "")}</td>
                    <td>${formatCurrency(sale.total || sale.totalAmount || 0)}</td>
                    <td>${escapeHTML(sale.status || sale.paymentStatus || "")}</td>
                </tr>
            `);

            table.find("tbody").append(row);

        });

        container.append(table);

    }


    // ====================================
    // REPORT FILTERS
    // ====================================

    $("#reportFilter").on("change", function () {

        const reportType = $(this).val();

        let endpoint = "/reports/sales";

        if (reportType === "cash") {
            endpoint = "/reports/sales/payment/cash";
        }

        if (reportType === "credit") {
            endpoint = "/reports/sales/payment/credit";
        }

        if (reportType === "category") {
            endpoint = "/reports/sales/category-wise";
        }

        if (reportType === "top") {
            endpoint = "/reports/sales/products/top";
        }

        if (reportType === "bottom") {
            endpoint = "/reports/sales/products/bottom";
        }

        apiGet(endpoint)

            .done(function (response) {

                displaySalesReport(response.data || response);

            })

            .fail(function (xhr) {

                adminMessage(
                    getApiError(xhr),
                    "error"
                );

            });

    });


    // ====================================
    // INVENTORY REPORTS
    // ====================================

    $("#inventoryReportFilter").on("change", function () {

        const reportType = $(this).val();

        let endpoint = "/reports/inventory/current-stock";

        if (reportType === "category") {
            endpoint = "/reports/inventory/category-wise";
        }

        if (reportType === "high") {
            endpoint = "/reports/inventory/high-stock";
        }

        if (reportType === "low") {
            endpoint = "/reports/inventory/low-stock";
        }

        apiGet(endpoint)

            .done(function (response) {

                const report = response.data || response;

                displayInventoryReport(report);

            })

            .fail(function (xhr) {

                adminMessage(
                    getApiError(xhr),
                    "error"
                );

            });

    });


    // ------------------------------------
    // DISPLAY INVENTORY REPORT
    // ------------------------------------

    function displayInventoryReport(report) {

        const container = $("#adminInventoryReport");

        if (!container.length) {
            return;
        }

        container.empty();

        const items = Array.isArray(report)
            ? report
            : report.products || report.inventory || [];

        if (!items.length) {

            container.html("<p>No inventory information available.</p>");

            return;

        }

        const table = $(`
            <div class="admin-table-wrapper">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `);

        items.forEach(function (item) {

            const row = $(`
                <tr>
                    <td>${escapeHTML(item.title || item.name || item.category || "")}</td>
                    <td>${Number(item.qty ?? item.totalQty ?? item.quantity ?? 0)}</td>
                    <td>${formatCurrency(item.price || 0)}</td>
                </tr>
            `);

            table.find("tbody").append(row);

        });

        container.append(table);

    }


    // ====================================
    // COMMON HELPER FUNCTIONS
    // ====================================

    function getArray(response) {

        if (Array.isArray(response)) {
            return response;
        }

        if (Array.isArray(response.data)) {
            return response.data;
        }

        if (Array.isArray(response.products)) {
            return response.products;
        }

        if (Array.isArray(response.categories)) {
            return response.categories;
        }

        if (Array.isArray(response.customers)) {
            return response.customers;
        }

        return [];

    }


    function escapeHTML(value) {

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


    // ====================================
    // INITIALIZE ADMIN DASHBOARD
    // ====================================

    apiGet("/auth/me")
        .done(function (response) {
            if (response.role !== "admin") {
                localStorage.removeItem("novaToken");
                sessionStorage.removeItem("novaToken");
                window.location.href = "index.html";
                return;
            }
            loadDashboard();
        })
        .fail(function () {
            localStorage.removeItem("novaToken");
            sessionStorage.removeItem("novaToken");
            window.location.href = "index.html";
        });

    console.log("NOVA Admin module loaded successfully.");

});
