
// ========================================
// NOVA - AUTHENTICATION MODULE
// ========================================


// Check whether the user is logged in
function getToken() {

    return localStorage.getItem("novaToken") ||
           sessionStorage.getItem("novaToken");

}


// Save authentication token
function saveToken(token, rememberMe) {

    localStorage.removeItem("novaToken");
    sessionStorage.removeItem("novaToken");

    if (rememberMe) {
        localStorage.setItem("novaToken", token);
    } else {
        sessionStorage.setItem("novaToken", token);
    }

}


// Clear authentication data
function clearToken() {

    localStorage.removeItem("novaToken");
    sessionStorage.removeItem("novaToken");

}


// Check authentication before opening protected pages
function requireLogin() {

    if (!getToken()) {
        window.location.href = "index.html";
        return false;
    }

    return true;

}


// ========================================
// LOGIN AND SIGNUP PAGE
// ========================================

$(document).ready(function () {

    // Only run login/signup page logic on index.html
    if ($("#loginForm").length) {

        // --------------------------------
        // FORM ELEMENTS
        // --------------------------------

        const loginForm = $("#loginForm");
        const signupForm = $("#signupForm");

        const loginTab = $("#loginTab");
        const signupTab = $("#signupTab");

        const formHeading = $("#formHeading");
        const formDescription = $("#formDescription");

        const tabIndicator = $("#tabIndicator");
        const messageBox = $("#messageBox");
        let adminLoginMode = false;


        // --------------------------------
        // SHOW LOGIN FORM
        // --------------------------------

        function showLoginForm() {

            loginForm.removeClass("hidden");
            signupForm.addClass("hidden");

            loginTab.addClass("active");
            signupTab.removeClass("active");

            tabIndicator.css({
                width: "calc(50% - 5px)",
                transform: "translateX(0)"
            });

            formHeading.html('Welcome back<span>.</span>');

            formDescription.text(
                "Sign in to continue your shopping journey."
            );

            adminLoginMode = false;
            $("#adminSignInLink").removeClass("hidden");
            $("#customerSignInLink").addClass("hidden");
            signupTab.removeClass("hidden").text("Create Account");
            loginTab.text("Sign In");
            formHeading.html('Welcome back<span>.</span>');
            clearAuthMessage();

        }


        // --------------------------------
        // SHOW SIGNUP FORM
        // --------------------------------

        function showSignupForm() {

            adminLoginMode = false;
            $("#adminSignInLink").addClass("hidden");
            signupForm.removeClass("hidden");
            loginForm.addClass("hidden");

            signupTab.addClass("active");
            loginTab.removeClass("active");

            tabIndicator.css("transform", "translateX(100%)");

            formHeading.html('Create account<span>.</span>');

            formDescription.text(
                "Join NOVA and discover something special."
            );

            clearAuthMessage();

        }


        // --------------------------------
        // AUTH MESSAGE
        // --------------------------------

        function showAuthMessage(message, type) {

            messageBox
                .removeClass("success error")
                .addClass(type)
                .text(message)
                .show();

        }


        function clearAuthMessage() {

            messageBox
                .removeClass("success error")
                .text("")
                .hide();

        }


        // --------------------------------
        // TAB EVENTS
        // --------------------------------

        loginTab.on("click", showLoginForm);

        signupTab.on("click", showSignupForm);

        $("#createAccountLink").on("click", showSignupForm);

        $("#backToLogin").on("click", showLoginForm);

        $("#customerSignInLink").on("click", showLoginForm);

        $("#adminSignInLink").on("click", function () {
            adminLoginMode = true;
            signupForm.addClass("hidden");
            loginForm.removeClass("hidden");
            formHeading.html('Admin sign in<span>.</span>');
            formDescription.text("Sign in with your authorized NOVA administrator account.");
            $("#adminSignInLink").addClass("hidden");
            $("#customerSignInLink").removeClass("hidden");
            signupTab.addClass("hidden");
            loginTab.text("Admin Sign In");
            tabIndicator.css("width", "calc(100% - 10px)");
            tabIndicator.css("transform", "translateX(0)");
            clearAuthMessage();
            $("#loginEmail").trigger("focus");
        });


        // --------------------------------
        // PASSWORD VISIBILITY
        // --------------------------------

        $(".password-toggle").on("click", function () {

            const targetId = $(this).data("target");

            const passwordInput = $("#" + targetId);

            const icon = $(this).find("i");

            if (passwordInput.attr("type") === "password") {

                passwordInput.attr("type", "text");

                icon.removeClass("fa-eye")
                    .addClass("fa-eye-slash");

            } else {

                passwordInput.attr("type", "password");

                icon.removeClass("fa-eye-slash")
                    .addClass("fa-eye");

            }

        });


        // --------------------------------
        // LOGIN
        // --------------------------------

        loginForm.on("submit", function (event) {

            event.preventDefault();

            clearAuthMessage();

            const email = $("#loginEmail").val().trim();

            const password = $("#loginPassword").val();

            const rememberMe = $("#rememberMe").is(":checked");

            const loginButton = $("#loginButton");

            if (!email || !password) {

                showAuthMessage(
                    "Please enter your email and password.",
                    "error"
                );

                return;

            }

            loginButton.prop("disabled", true);

            loginButton.find("span").text("Signing In...");


            apiPost("/auth/login", {
                email: email,
                password: password,
                loginType: adminLoginMode ? "admin" : "customer"
            })

            .done(function (response) {

                const token = response.idToken ||
                              response.token ||
                              response.data?.idToken;

                if (!token) {

                    showAuthMessage(
                        "Login succeeded but the authentication token was not received.",
                        "error"
                    );

                    return;

                }

                if (adminLoginMode && response.role !== "admin") {
                    showAuthMessage("This account is not authorized for the Admin Portal.", "error");
                    return;
                }

                if (!adminLoginMode && response.role === "admin") {
                    showAuthMessage("This is an administrator account. Please use Admin Sign In.", "error");
                    return;
                }

                saveToken(token, rememberMe);

                showAuthMessage(
                    "Login successful! Redirecting...",
                    "success"
                );

                setTimeout(function () {

                    window.location.href = adminLoginMode ? "admin.html" : "products.html";

                }, 700);

            })

            .fail(function (xhr) {

                showAuthMessage(
                    getApiError(xhr),
                    "error"
                );

            })

            .always(function () {

                loginButton.prop("disabled", false);

                loginButton.find("span").text("Sign In");

            });

        });


        // --------------------------------
        // CUSTOMER REGISTRATION
        // --------------------------------

        signupForm.on("submit", function (event) {

            event.preventDefault();

            clearAuthMessage();

            const fullName = $("#signupName").val().trim();

            const email = $("#signupEmail").val().trim();

            const phone = $("#signupPhone").val().trim();

            const password = $("#signupPassword").val();

            const confirmPassword = $("#confirmPassword").val();

            const agreeTerms = $("#agreeTerms").is(":checked");

            const signupButton = $("#signupButton");


            if (!fullName || !email || !phone || !password) {

                showAuthMessage(
                    "Please fill in all required fields.",
                    "error"
                );

                return;

            }


            if (!/^[0-9]{10}$/.test(phone)) {

                showAuthMessage(
                    "Please enter a valid 10-digit phone number.",
                    "error"
                );

                return;

            }


            if (password.length < 6) {

                showAuthMessage(
                    "Password must contain at least 6 characters.",
                    "error"
                );

                return;

            }


            if (password !== confirmPassword) {

                showAuthMessage(
                    "Passwords do not match.",
                    "error"
                );

                return;

            }


            if (!agreeTerms) {

                showAuthMessage(
                    "Please agree to the terms and conditions.",
                    "error"
                );

                return;

            }


            signupButton.prop("disabled", true);

            signupButton.find("span").text("Creating Account...");


            apiPost("/customers/register", {

                fullName: fullName,
                email: email,
                phone: phone,
                password: password

            })

            .done(function (response) {

                showAuthMessage(
                    response.message ||
                    "Account created successfully! Please sign in.",
                    "success"
                );

                signupForm[0].reset();

                setTimeout(function () {

                    showLoginForm();

                    $("#loginEmail").val(email);

                    showAuthMessage(
                        "Your account is ready. Please sign in.",
                        "success"
                    );

                }, 1000);

            })

            .fail(function (xhr) {

                showAuthMessage(
                    getApiError(xhr),
                    "error"
                );

            })

            .always(function () {

                signupButton.prop("disabled", false);

                signupButton.find("span").text("Create Account");

            });

        });


        // ========================================
        // FORGOT PASSWORD MODAL
        // ========================================

        const resetModal = $("#resetModal");

        $("#forgotPassword").on("click", function () {

            $("#resetEmail").val($("#loginEmail").val());

            $("#resetMessage")
                .removeClass("success error")
                .text("")
                .hide();

            resetModal.removeClass("hidden");

        });


        $("#closeResetModal").on("click", function () {

            resetModal.addClass("hidden");

        });


        resetModal.on("click", function (event) {

            if (event.target === this) {
                resetModal.addClass("hidden");
            }

        });


        // --------------------------------
        // SEND PASSWORD RESET EMAIL
        // --------------------------------

        $("#resetForm").on("submit", function (event) {

            event.preventDefault();

            const email = $("#resetEmail").val().trim();

            const resetButton = $("#resetButton");

            if (!email) {

                showAuthMessage(
                    "Please enter your registered email address.",
                    "error"
                );

                return;

            }

            resetButton.prop("disabled", true);

            resetButton.find("span").text("Sending...");


            apiPost("/auth/forgot-password", {
                email: email
            })

            .done(function (response) {

                $("#resetMessage")
                    .removeClass("error")
                    .addClass("success")
                    .text(
                        response.message ||
                        "Password reset instructions have been sent to your email."
                    )
                    .show();

                $("#resetForm")[0].reset();

            })

            .fail(function (xhr) {

                $("#resetMessage")
                    .removeClass("success")
                    .addClass("error")
                    .text(getApiError(xhr))
                    .show();

            })

            .always(function () {

                resetButton.prop("disabled", false);

                resetButton.find("span").text("Send Reset Link");

            });

        });

    }


    // ========================================
    // LOGOUT
    // ========================================

    $("#logoutButton").on("click", function () {

        const token = getToken();

        if (!token) {

            window.location.href = "index.html";

            return;

        }

        const button = $(this);

        button.prop("disabled", true);


        apiPost("/auth/logout", {})

        .always(function () {

            clearToken();

            window.location.href = "index.html";

        });

    });


});


// ========================================
// AUTHENTICATION MODULE LOADED
// ========================================

console.log("NOVA Authentication module loaded successfully.");
