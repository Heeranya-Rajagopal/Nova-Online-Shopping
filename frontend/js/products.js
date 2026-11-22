// ========================================
// NOVA - PRODUCTS MODULE
// Connected to the current products.html
// ========================================

$(document).ready(function () {
    const $productGrid = $("#productGrid");
    const $searchInput = $("#searchInput");
    const $sortSelect = $("#sortSelect");
    const $categoryFilters = $("#categoryFilters");
    const $loadingMessage = $("#loadingMessage");
    const $errorMessage = $("#errorMessage");
    const $emptyMessage = $("#emptyMessage");
    const $messageBox = $("#messageBox");

    let allProducts = [];
    let allCategories = [];
    let selectedCategory = "all";

    function getArray(response, key) {
        if (Array.isArray(response)) return response;
        if (response && Array.isArray(response[key])) return response[key];
        if (response && Array.isArray(response.data)) return response.data;
        return [];
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[character];
        });
    }

    function categoryIdOf(product) {
        return product.catId || product.categoryId || product.category_id || "";
    }

    function getCategoryName(product) {
        const categoryId = String(categoryIdOf(product));
        const category = allCategories.find(function (item) {
            return String(item.id || item.catId) === categoryId;
        });

        return category
            ? (category.name || category.categoryName || "NOVA Collection")
            : (product.categoryName || product.category || "NOVA Collection");
    }

    function cleanProductTitle(value) {
        return String(value || "NOVA Product")
            .replace(/\s+(?:updated|update)$/i, "")
            .trim();
    }

    function getProductImage(product) {
        if (product.imageUrl || product.image || product.imageURL) {
            return product.imageUrl || product.image || product.imageURL;
        }

        const title = String(product.title || "").toLowerCase();
        const imageByTitle = [
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

        const match = imageByTitle.find(([keyword]) => title.includes(keyword));
        return match ? `assets/images/${match[1]}` : "";
    }

    function getCategoryIcon(categoryName) {
        const name = String(categoryName).toLowerCase();
        if (name.includes("electronic")) return "💻";
        if (name.includes("fashion")) return "👕";
        if (name.includes("home")) return "🏠";
        if (name.includes("beauty")) return "✨";
        if (name.includes("book")) return "📚";
        if (name.includes("sport")) return "⚽";
        return "🛍️";
    }

    function showPageMessage(message, type) {
        if (!$messageBox.length) {
            window.alert(message);
            return;
        }

        $messageBox
            .removeClass("success error info hidden")
            .addClass(type || "info")
            .text(message)
            .show();
    }

    function clearPageMessage() {
        $messageBox.removeClass("success error info").text("").hide();
    }

    function loadProducts() {
        $loadingMessage.prop("hidden", false).show();
        $errorMessage.prop("hidden", true).hide();
        $emptyMessage.prop("hidden", true).hide();
        $productGrid.empty();

        apiGet("/products")
            .done(function (response) {
                allProducts = getArray(response, "products");
                loadCategories();
            })
            .fail(function (xhr) {
                $loadingMessage.hide();
                $errorMessage.prop("hidden", false).show();
                $("#errorText").text(getApiError(xhr));
            });
    }

    function loadCategories() {
        apiGet("/categories")
            .done(function (response) {
                allCategories = getArray(response, "categories");
                renderCategoryFilters();
                filterAndRenderProducts();
                updateCartCount();
            })
            .fail(function () {
                // Products can still be displayed if category lookup fails.
                allCategories = [];
                renderCategoryFilters();
                filterAndRenderProducts();
                updateCartCount();
            });
    }

    function renderCategoryFilters() {
        $categoryFilters.empty();

        const allButton = $("<button>", {
            type: "button",
            class: "category-chip" + (selectedCategory === "all" ? " active" : ""),
            "data-category": "all",
            text: "All Products"
        });

        $categoryFilters.append(allButton);

        allCategories.forEach(function (category) {
            const id = category.id || category.catId;
            const name = category.name || category.categoryName;

            if (!id || !name) return;

            const button = $("<button>", {
                type: "button",
                class: "category-chip" +
                    (String(selectedCategory) === String(id) ? " active" : ""),
                "data-category": String(id),
                text: name
            });

            $categoryFilters.append(button);
        });
    }

    function createProductCard(product) {
        const id = product.id || product.productId;
        const title = cleanProductTitle(product.title);
        const description = product.description || "Discover this product from NOVA.";
        const price = Number(product.price) || 0;
        const quantity = Number(product.qty) || 0;
        const category = getCategoryName(product);
        const image = getProductImage(product);
        const imageMarkup = image
            ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(title)}"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='assets/images/' + (function(t){if(t.includes('headphone'))return 'wireless-headphones.webp';if(t.includes('bluetooth speaker')||t.includes('speaker'))return 'bluetooth-speaker.webp';if(t.includes('keyboard'))return 'bluetooth-keyboard.webp';if(t.includes('earbud'))return 'wireless-earbuds.webp';if(t.includes('watch'))return 'smart-watch.webp';if(t.includes('mouse'))return 'wireless-mouse.webp';if(t.includes('t-shirt')||t.includes('shirt'))return 'casual-t-shirt.webp';if(t.includes('jean'))return 'denim-jeans.webp';if(t.includes('lamp'))return 'table-lamp.webp';if(t.includes('face wash'))return 'face-wash.webp';if(t.includes('java')||t.includes('book'))return 'java-programming-book.webp';return '';})('${escapeHTML(title).toLowerCase()}');if(this.src.endsWith('/')){this.closest('.product-visual').classList.add('image-unavailable');this.remove();}">`
            : `<span class="product-fallback-icon">${getCategoryIcon(category)}</span>`;

        const $card = $(`
            <article class="product-card">
                <div class="product-visual">
                    ${imageMarkup}
                    <span class="product-tag">${escapeHTML(category)}</span>
                </div>
                <div class="product-info">
                    <span class="product-category">${escapeHTML(category)}</span>
                    <h3>${escapeHTML(title)}</h3>
                    <p class="product-description">${escapeHTML(description)}</p>
                    <div class="product-bottom">
                        <span class="product-price">${formatCurrency(price)}</span>
                        <span class="stock-label">${quantity > 0 ? "In Stock" : "Out of Stock"}</span>
                    </div>
                    <div class="product-card-actions">
                        <button type="button" class="primary-button view-product-btn">
                            View Details
                        </button>
                        <button type="button" class="add-cart-btn" ${quantity <= 0 ? "disabled" : ""}>
                            <i class="fa-solid fa-cart-plus"></i> Add
                        </button>
                    </div>
                </div>
            </article>
        `);

        $card.find(".view-product-btn").on("click", function () {
            window.location.href = "product-details.html?id=" +
                encodeURIComponent(id);
        });

        $card.find(".add-cart-btn").on("click", function () {
            addProductToCart(id, 1);
        });

        return $card;
    }

    function filterAndRenderProducts() {
        $loadingMessage.hide();
        $errorMessage.hide();

        let filtered = allProducts.filter(function (product) {
            return product.active !== false;
        });

        const searchText = $searchInput.val().trim().toLowerCase();

        if (searchText) {
            filtered = filtered.filter(function (product) {
                return String(product.title || "").toLowerCase().includes(searchText) ||
                    String(product.description || "").toLowerCase().includes(searchText) ||
                    getCategoryName(product).toLowerCase().includes(searchText);
            });
        }

        if (selectedCategory !== "all") {
            filtered = filtered.filter(function (product) {
                return String(categoryIdOf(product)) === String(selectedCategory);
            });
        }

        const sort = $sortSelect.val();
        if (sort === "low") {
            filtered.sort((a, b) => Number(a.price) - Number(b.price));
        } else if (sort === "high") {
            filtered.sort((a, b) => Number(b.price) - Number(a.price));
        } else if (sort === "name") {
            filtered.sort((a, b) =>
                String(a.title || "").localeCompare(String(b.title || ""))
            );
        }

        $("#productCount").text(filtered.length + " products available");
        $productGrid.empty();

        if (!filtered.length) {
            $emptyMessage.prop("hidden", false).show();
            return;
        }

        $emptyMessage.prop("hidden", true).hide();
        filtered.forEach(function (product) {
            $productGrid.append(createProductCard(product));
        });
    }

    function addProductToCart(productId, quantity) {
        clearPageMessage();

        if (!getAuthToken()) {
            showPageMessage("Please login to add products to your cart.", "error");
            return;
        }

        apiPost("/cart/add", {
            productId: productId,
            quantity: quantity
        })
        .done(function (response) {
            showPageMessage(response.message || "Product added to your cart.", "success");
            updateCartCount();
        })
        .fail(function (xhr) {
            showPageMessage(getApiError(xhr), "error");
        });
    }

    function updateCartCount() {
        if (!getAuthToken()) {
            $(".cart-count").text("0");
            return;
        }

        apiGet("/cart").done(function (response) {
            const cart = response.cart || response.data || response;
            const items = Array.isArray(cart) ? cart : (cart.items || []);
            const count = items.reduce(function (total, item) {
                return total + Number(item.quantity || item.qty || 0);
            }, 0);

            $(".cart-count").text(count);
        });
    }

    $searchInput.on("input", filterAndRenderProducts);
    $sortSelect.on("change", filterAndRenderProducts);

    $categoryFilters.on("click", ".category-chip", function () {
        selectedCategory = String($(this).data("category") || "all");
        $categoryFilters.find(".category-chip").removeClass("active");
        $(this).addClass("active");
        filterAndRenderProducts();
    });

    $("#retryBtn").on("click", loadProducts);

    loadProducts();
});

console.log("NOVA Products module loaded successfully.");
