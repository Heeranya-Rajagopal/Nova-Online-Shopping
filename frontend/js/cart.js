
// ========================================
// NOVA - SHOPPING CART MODULE
// ========================================


// ----------------------------------------
// CART API FUNCTIONS
// ----------------------------------------

// Get cart details
function getCartDetails() {
    return apiGet("/cart");
}


// Add product to cart
function addToCart(productId, quantity = 1) {

    if (!getAuthToken()) {
        showError("Please login to add products to your cart.");
        return $.Deferred().reject().promise();
    }

    if (!productId || quantity < 1) {
        showError("Invalid product or quantity.");
        return $.Deferred().reject().promise();
    }

    return apiPost("/cart/add", {
        productId: productId,
        quantity: Number(quantity)
    })

    .done(function (response) {

        showSuccess(
            response.message || "Product added to your cart."
        );

        updateCartCount();

    })

    .fail(function (xhr) {

        showError(getApiError(xhr));

    });

}


// Update product quantity
function updateCartItem(productId, quantity) {

    return apiPut(
        "/cart/update/" + encodeURIComponent(productId),
        {
            quantity: Number(quantity)
        }
    );

}


// Remove product from cart
function removeCartItem(productId) {

    return apiDelete(
        "/cart/remove/" + encodeURIComponent(productId)
    );

}


// Clear complete cart
function clearShoppingCart() {

    return apiDelete("/cart/clear");

}


// ----------------------------------------
// GET CART ITEMS FROM RESPONSE
// ----------------------------------------

function getCartItems(response) {

    let cart = response;

    if (response && response.data) {
        cart = response.data;
    }

    if (cart && cart.cart) {
        cart = cart.cart;
    }

    if (Array.isArray(cart)) {
        return cart;
    }

    if (cart && Array.isArray(cart.items)) {
        return cart.items;
    }

    return [];

}


// ----------------------------------------
// GET CART TOTALS
// ----------------------------------------

function getCartTotals(response, items) {

    let cart = response;

    if (response && response.data) {
        cart = response.data;
    }

    if (cart && cart.cart) {
        cart = cart.cart;
    }

    const calculatedSubtotal = items.reduce(function (total, item) {

        const price = Number(item.price || 0);

        const quantity = Number(item.quantity || item.qty || 0);

        return total + (price * quantity);

    }, 0);

    return {
        subtotal: Number(
            cart?.subtotal ?? calculatedSubtotal
        ),

        total: Number(
            cart?.total ?? cart?.totalAmount ?? calculatedSubtotal
        )
    };

}


// ----------------------------------------
// UPDATE CART COUNT
// ----------------------------------------

function updateCartCount() {

    if (!getAuthToken()) {
        $(".cart-count").text("0");
        return;
    }

    getCartDetails()

        .done(function (response) {

            const items = getCartItems(response);

            const count = items.reduce(function (total, item) {

                return total + Number(
                    item.quantity || item.qty || 0
                );

            }, 0);

            $(".cart-count").text(count);

        })

        .fail(function () {

            $(".cart-count").text("0");

        });

}


// ========================================
// CART PAGE
// ========================================

$(document).ready(function () {

    // Run cart page logic only when cart elements exist
    if (!$("#cartItems").length) {
        updateCartCount();
        return;
    }

    let currentCartItems = [];

    const cartContainer = $("#cartItems");

    const emptyCart = $("#emptyCart");

    const messageBox = $("#messageBox");


    // ------------------------------------
    // DISPLAY MESSAGE
    // ------------------------------------

    function displayCartMessage(message, type = "success") {

        messageBox
            .removeClass("success error")
            .addClass(type)
            .text(message)
            .show();

    }


    // ------------------------------------
    // GET PRODUCT INFORMATION
    // ------------------------------------

    function getProductId(item) {

        return item.productId ||
               item.id ||
               item.product?.id ||
               "";

    }


    function getProductTitle(item) {
        const title = item.title || item.productName || item.name || item.product?.title || "NOVA Product";
        return String(title).replace(/\s+(?:updated|update)$/i, "").trim();
    }


    function getProductPrice(item) {

        return Number(
            item.price ||
            item.productPrice ||
            item.product?.price ||
            0
        );

    }


    function getProductQuantity(item) {

        return Number(item.quantity || item.qty || 1);

    }


    function getProductImage(item) {
        const savedImage = item.imageUrl ||
            item.image ||
            item.product?.imageUrl ||
            item.product?.image;

        if (savedImage) return savedImage;

        const title = String(item.title || item.productTitle || item.product?.title || "").toLowerCase();
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
        const match = imageMap.find(([keyword]) => title.includes(keyword));
        return match ? `assets/images/${match[1]}` : "";
    }


    // ------------------------------------
    // LOAD CART
    // ------------------------------------

    function loadCart() {

        if (!getAuthToken()) {

            cartContainer.empty();

            emptyCart.prop("hidden", false);

            $("#cartItemCount").text("0 items in your cart");

            updateCartSummary([]);

            return;

        }

        cartContainer.html(`
            <div class="cart-loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Loading your cart...</p>
            </div>
        `);

        emptyCart.prop("hidden", true);


        getCartDetails()

            .done(function (response) {

                currentCartItems = getCartItems(response);

                displayCartItems(response, currentCartItems);

                updateCartCount();

            })

            .fail(function (xhr) {

                cartContainer.html(`
                    <div class="empty-cart">
                        <h3>Unable to load your cart</h3>
                        <p>${escapeCartHTML(getApiError(xhr))}</p>
                        <button type="button" id="retryCart">
                            Try Again
                        </button>
                    </div>
                `);

            });

    }


    // ------------------------------------
    // DISPLAY CART ITEMS
    // ------------------------------------

    function displayCartItems(response, items) {

        cartContainer.empty();

        if (!items.length) {

            emptyCart.prop("hidden", false);

            $("#cartItemCount").text("0 items in your cart");

            updateCartSummary([]);

            return;

        }

        emptyCart.prop("hidden", true);

        const totalQuantity = items.reduce(function (total, item) {

            return total + getProductQuantity(item);

        }, 0);

        $("#cartItemCount").text(
            totalQuantity + (totalQuantity === 1
                ? " item in your cart"
                : " items in your cart")
        );


        items.forEach(function (item) {

            cartContainer.append(createCartItem(item));

        });

        updateCartSummary(items, response);

    }


    // ------------------------------------
    // CREATE CART ITEM
    // ------------------------------------

    function createCartItem(item) {

        const productId = getProductId(item);

        const title = getProductTitle(item);

        const price = getProductPrice(item);

        const quantity = getProductQuantity(item);

        const image = getProductImage(item);

        const subtotal = price * quantity;

        const imageContent = image
            ? `<img src="${escapeCartHTML(image)}"
                    alt="${escapeCartHTML(title)}"
                    loading="lazy"
                    onerror="this.onerror=null;const t='${escapeCartHTML(title).toLowerCase()}';const m=t.includes('speaker')?'bluetooth-speaker.webp':t.includes('keyboard')?'bluetooth-keyboard.webp':t.includes('earbud')?'wireless-earbuds.webp':t.includes('headphone')?'wireless-headphones.webp':t.includes('watch')?'smart-watch.webp':t.includes('mouse')?'wireless-mouse.webp':t.includes('shirt')?'casual-t-shirt.webp':t.includes('jean')?'denim-jeans.webp':t.includes('lamp')?'table-lamp.webp':t.includes('face wash')?'face-wash.webp':t.includes('java')||t.includes('book')?'java-programming-book.webp':'';if(m){this.src='assets/images/'+m;}else{this.replaceWith(Object.assign(document.createElement('i'),{className:'fa-solid fa-image'}));}">`
            : `<i class="fa-solid fa-bag-shopping"></i>`;

        const card = $(`
            <article class="cart-item" data-product-id="${escapeCartHTML(productId)}">

                <div class="cart-item-image">
                    ${imageContent}
                </div>

                <div class="cart-item-details">

                    <h3>${escapeCartHTML(title)}</h3>

                    <p class="cart-item-price">
                        ${formatCurrency(price)}
                    </p>

                    <div class="cart-item-actions">

                        <div class="quantity-control">

                            <button type="button"
                                class="decrease-cart-quantity"
                                aria-label="Decrease quantity">
                                <i class="fa-solid fa-minus"></i>
                            </button>

                            <span class="cart-quantity">
                                ${quantity}
                            </span>

                            <button type="button"
                                class="increase-cart-quantity"
                                aria-label="Increase quantity">
                                <i class="fa-solid fa-plus"></i>
                            </button>

                        </div>

                        <button type="button" class="remove-cart-item">
                            <i class="fa-regular fa-trash-can"></i>
                            Remove
                        </button>

                    </div>

                </div>

                <div class="cart-item-subtotal">
                    <strong>${formatCurrency(subtotal)}</strong>
                </div>

            </article>
        `);


        // Decrease quantity
        card.find(".decrease-cart-quantity").on("click", function () {

            if (quantity <= 1) {
                return;
            }

            changeQuantity(productId, quantity - 1);

        });


        // Increase quantity
        card.find(".increase-cart-quantity").on("click", function () {

            changeQuantity(productId, quantity + 1);

        });


        // Remove item
        card.find(".remove-cart-item").on("click", function () {

            removeItem(productId);

        });


        return card;

    }


    // ------------------------------------
    // CHANGE QUANTITY
    // ------------------------------------

    function changeQuantity(productId, quantity) {

        if (quantity < 1) {
            return;
        }

        cartContainer.find("button").prop("disabled", true);

        updateCartItem(productId, quantity)

            .done(function (response) {

                displayCartMessage(
                    response.message || "Cart quantity updated."
                );

                loadCart();

            })

            .fail(function (xhr) {

                displayCartMessage(
                    getApiError(xhr),
                    "error"
                );

                loadCart();

            });

    }


    // ------------------------------------
    // REMOVE ITEM
    // ------------------------------------

    function removeItem(productId) {

        if (!confirm("Are you sure you want to remove this product?")) {
            return;
        }

        removeCartItem(productId)

            .done(function (response) {

                displayCartMessage(
                    response.message || "Product removed from cart."
                );

                loadCart();

            })

            .fail(function (xhr) {

                displayCartMessage(
                    getApiError(xhr),
                    "error"
                );

            });

    }


    // ------------------------------------
    // CLEAR CART
    // ------------------------------------

    $("#clearCartButton").on("click", function () {

        if (!currentCartItems.length) {
            return;
        }

        if (!confirm("Are you sure you want to clear your entire cart?")) {
            return;
        }

        const button = $(this);

        button.prop("disabled", true);


        clearShoppingCart()

            .done(function (response) {

                displayCartMessage(
                    response.message || "Your cart has been cleared."
                );

                loadCart();

            })

            .fail(function (xhr) {

                displayCartMessage(
                    getApiError(xhr),
                    "error"
                );

            })

            .always(function () {

                button.prop("disabled", false);

            });

    });


    // ------------------------------------
    // UPDATE ORDER SUMMARY
    // ------------------------------------

    function updateCartSummary(items, response = null) {

        const totals = response
            ? getCartTotals(response, items)
            : getCartTotals({}, items);

        const subtotal = totals.subtotal;

        // Delivery and discount are not calculated
        // by this frontend module.
        const delivery = 0;

        const discount = 0;

        const total = Math.max(
            0,
            subtotal + delivery - discount
        );

        $("#cartSubtotal").text(formatCurrency(subtotal));

        $("#deliveryCharge").text(formatCurrency(delivery));

        $("#cartDiscount").text(formatCurrency(discount));

        $("#cartTotal").text(formatCurrency(total));

    }


    // ------------------------------------
    // CHECKOUT BUTTON
    // ------------------------------------

    $("#checkoutButton").on("click", function () {

        if (!getAuthToken()) {

            displayCartMessage(
                "Please login before proceeding to checkout.",
                "error"
            );

            return;

        }

        if (!currentCartItems.length) {

            displayCartMessage(
                "Your cart is empty.",
                "error"
            );

            return;

        }

        window.location.href = "orders.html#checkout";

    });


    // ------------------------------------
    // RETRY CART
    // ------------------------------------

    $(document).on("click", "#retryCart", function () {

        loadCart();

    });


    // ------------------------------------
    // ESCAPE HTML
    // ------------------------------------

    function escapeCartHTML(value) {

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
    // INITIALIZE CART
    // ------------------------------------

    updateCartCount();

    loadCart();

});


// ========================================
// MODULE LOADED
// ========================================

console.log("NOVA Cart module loaded successfully.");
