
// ========================================
// NOVA - CHECKOUT MODULE
// ========================================

$(document).ready(function () {

    // Run checkout only when checkout form exists
    if (!$("#checkoutForm").length) {
        return;
    }

    let isPlacingOrder = false;

    const checkoutForm = $("#checkoutForm");
    const placeOrderButton = $("#placeOrderButton");
    const checkoutMessage = $("#checkoutMessage");


    // ------------------------------------
    // DISPLAY CHECKOUT MESSAGE
    // ------------------------------------

    function displayCheckoutMessage(message, type = "error") {

        checkoutMessage
            .removeClass("success error")
            .addClass(type)
            .text(message)
            .show();

    }


    // ------------------------------------
    // GET SELECTED PAYMENT METHOD
    // ------------------------------------

    function getPaymentMethod() {

        const selectedPayment = $(
            'input[name="paymentMethod"]:checked'
        ).val();

        if (!selectedPayment) {
            return null;
        }

        return selectedPayment.toLowerCase();

    }


    // ------------------------------------
    // LOAD CART SUMMARY
    // ------------------------------------

    function loadCheckoutSummary() {

        apiGet("/cart")

            .done(function (response) {

                let cart = response.data || response.cart || response;

                let items = Array.isArray(cart)
                    ? cart
                    : (cart.items || []);

                if (!items.length) {

                    displayCheckoutMessage(
                        "Your cart is empty. Please add products before checkout."
                    );

                    placeOrderButton.prop("disabled", true);

                    return;

                }

                let subtotal = Number(cart.subtotal);

                if (!Number.isFinite(subtotal)) {

                    subtotal = items.reduce(function (total, item) {

                        return total +
                            Number(item.price || 0) *
                            Number(item.quantity || item.qty || 0);

                    }, 0);

                }

                $("#checkoutSubtotal").text(formatCurrency(subtotal));

                $("#checkoutTotal").text(formatCurrency(subtotal));

            })

            .fail(function (xhr) {

                displayCheckoutMessage(getApiError(xhr));

            });

    }


    // ------------------------------------
    // PAYMENT METHOD CHANGE
    // ------------------------------------

    $('input[name="paymentMethod"]').on("change", function () {

        const method = getPaymentMethod();

        $("#paymentMethodDisplay").text(
            method ? method.toUpperCase() : "Not selected"
        );

        clearCheckoutMessage();

    });


    // ------------------------------------
    // CLEAR MESSAGE
    // ------------------------------------

    function clearCheckoutMessage() {

        checkoutMessage
            .removeClass("success error")
            .text("")
            .hide();

    }


    // ------------------------------------
    // PLACE ORDER
    // ------------------------------------

    checkoutForm.on("submit", function (event) {

        event.preventDefault();

        if (isPlacingOrder) {
            return;
        }

        clearCheckoutMessage();

        if (!getAuthToken()) {

            displayCheckoutMessage(
                "Your session has expired. Please login again."
            );

            return;

        }

        const paymentMethod = getPaymentMethod();

        if (!paymentMethod) {

            displayCheckoutMessage(
                "Please select a payment method."
            );

            return;

        }

        if (!["cash", "credit"].includes(paymentMethod)) {

            displayCheckoutMessage(
                "Please select a valid payment method."
            );

            return;

        }


        isPlacingOrder = true;

        placeOrderButton.prop("disabled", true);

        placeOrderButton.find("span").text("Placing Order...");


        // Send order request to backend
        apiPost("/orders/place", {

            paymentMethod: paymentMethod

        })

        .done(function (response) {

            displayCheckoutMessage(
                response.message || "Your order has been placed successfully!",
                "success"
            );

            const order = response.data || response.order || response;

            const orderId = order.id ||
                            order.orderId ||
                            order.order?.id;

            // Clear displayed cart count
            $(".cart-count").text("0");

            // Store the latest order ID for display
            if (orderId) {
                sessionStorage.setItem("novaLastOrderId", orderId);
            }

            // Generate the invoice and email it only after backend marks payment as paid.
            if (orderId && order.paymentStatus === "paid") {
                apiPost("/billing/generate/" + encodeURIComponent(orderId), {})
                    .done(function (billingResponse) {
                        const emailSent = billingResponse.email && billingResponse.email.sent;
                        displayCheckoutMessage(
                            emailSent
                                ? "Payment confirmed! Your invoice has been emailed to your registered email address."
                                : "Payment confirmed! Your invoice is ready. Email delivery needs SMTP configuration.",
                            "success"
                        );
                    })
                    .fail(function (xhr) {
                        displayCheckoutMessage(
                            "Order placed and payment confirmed, but invoice generation needs attention: " +
                            getApiError(xhr),
                            "info"
                        );
                    })
                    .always(function () {
                        setTimeout(function () {
                            window.location.href = "orders.html";
                        }, 2200);
                    });
            } else {
                displayCheckoutMessage(
                    "Order placed. Your invoice will be generated and emailed once payment is confirmed.",
                    "success"
                );
                setTimeout(function () {
                    window.location.href = "orders.html";
                }, 2200);
            }

        })

        .fail(function (xhr) {

            displayCheckoutMessage(getApiError(xhr));

        })

        .always(function () {

            isPlacingOrder = false;

            placeOrderButton.prop("disabled", false);

            placeOrderButton.find("span").text("Place Order");

        });

    });


    // ------------------------------------
    // INITIALIZE CHECKOUT
    // ------------------------------------

    if (getAuthToken()) {

        loadCheckoutSummary();

    } else {

        displayCheckoutMessage(
            "Please login before proceeding to checkout."
        );

        placeOrderButton.prop("disabled", true);

    }

});


// ========================================
// CHECKOUT MODULE LOADED
// ========================================

console.log("NOVA Checkout module loaded successfully.");
