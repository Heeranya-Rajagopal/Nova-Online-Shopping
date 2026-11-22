
// ========================================
// NOVA - CUSTOMER PROFILE MODULE
// ========================================

$(document).ready(function () {

    // Run only on profile page
    if (!$("#profileForm").length) {
        return;
    }

    let originalProfile = null;

    const profileForm = $("#profileForm");
    const saveButton = $("#saveProfileButton");


    // ------------------------------------
    // FORMAT DATE
    // ------------------------------------

    function formatProfileDate(value) {

        if (!value) {
            return "Not available";
        }

        let date;

        if (typeof value.toDate === "function") {
            date = value.toDate();
        } else if (value.seconds) {
            date = new Date(value.seconds * 1000);
        } else if (value._seconds) {
            date = new Date(value._seconds * 1000);
        } else {
            date = new Date(value);
        }

        if (Number.isNaN(date.getTime())) {
            return "Not available";
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

    }


    // ------------------------------------
    // FORMAT CUSTOMER CURRENCY
    // ------------------------------------

    function profileCurrency(value) {

        return formatCurrency(Number(value) || 0);

    }


    // ------------------------------------
    // DISPLAY PROFILE MESSAGE
    // ------------------------------------

    function displayProfileMessage(message, type = "success") {

        $("#messageBox")
            .removeClass("success error")
            .addClass(type)
            .text(message)
            .show();

    }


    // ------------------------------------
    // GET CUSTOMER PROFILE
    // ------------------------------------

    function loadProfile() {

        if (!getAuthToken()) {

            window.location.href = "index.html";

            return;

        }

        displayProfileMessage("Loading your profile...", "success");


        apiGet("/auth/me")

            .done(function (response) {

                const customer = response.data ||
                                 response.customer ||
                                 response;

                if (!customer || typeof customer !== "object") {

                    displayProfileMessage(
                        "Unable to retrieve your profile.",
                        "error"
                    );

                    return;

                }

                originalProfile = customer;

                displayProfile(customer);

                $("#messageBox")
                    .removeClass("success error")
                    .text("")
                    .hide();

            })

            .fail(function (xhr) {

                if (xhr.status === 401) {

                    clearToken();

                    window.location.href = "index.html";

                    return;

                }

                displayProfileMessage(
                    getApiError(xhr),
                    "error"
                );

            });

    }


    // ------------------------------------
    // DISPLAY CUSTOMER INFORMATION
    // ------------------------------------

    function displayProfile(customer) {

        const name = customer.fullName ||
                     customer.name ||
                     "NOVA Customer";

        const email = customer.email || "";

        const phone = customer.phone || "";

        const customerId = customer.uid ||
                           customer.id ||
                           customer.customerId ||
                           "";

        const creditLimit = Number(customer.creditLimit || 0);

        const creditUsed = Number(customer.creditUsed || 0);

        const availableCredit = Math.max(
            0,
            creditLimit - creditUsed
        );

        const active = customer.active !== undefined
            ? customer.active
            : String(customer.status || "active").toLowerCase() === "active";


        // Personal information
        $("#profileName").val(name);

        $("#profileEmail").val(email);

        $("#profilePhone").val(phone);


        // Profile card
        $("#profileDisplayName").text(name);

        $("#profileDisplayEmail").text(email);

        $("#profileAvatar").text(
            name.trim().charAt(0).toUpperCase() || "N"
        );


        // Account information
        $("#customerId").text(customerId || "--");

        $("#accountStatus").text(
            active ? "Active" : "Inactive"
        );

        $("#profileStatus")
            .html(
                active
                    ? '<i class="fa-solid fa-circle"></i> Active Account'
                    : '<i class="fa-solid fa-circle"></i> Inactive Account'
            )
            .toggleClass("inactive", !active);


        $("#memberSince").text(
            formatProfileDate(customer.createdAt)
        );


        // Credit information
        $("#creditLimit").text(
            profileCurrency(creditLimit)
        );

        $("#creditUsed").text(
            profileCurrency(creditUsed)
        );

        $("#availableCredit").text(
            profileCurrency(availableCredit)
        );


        // Credit utilization percentage
        const percentage = creditLimit > 0
            ? Math.min((creditUsed / creditLimit) * 100, 100)
            : 0;

        $("#creditPercentage").text(
            percentage.toFixed(1) + "%"
        );

        $("#creditProgress").css(
            "width",
            percentage + "%"
        );

    }


    // ------------------------------------
    // VALIDATE PROFILE INFORMATION
    // ------------------------------------

    function validateProfile(name, phone) {

        if (!name || !phone) {

            return "Please fill in all required fields.";

        }

        if (name.length < 2) {

            return "Name must contain at least 2 characters.";

        }

        if (!/^[0-9]{10}$/.test(phone)) {

            return "Please enter a valid 10-digit phone number.";

        }

        return null;

    }


    // ------------------------------------
    // UPDATE CUSTOMER PROFILE
    // ------------------------------------

    profileForm.on("submit", function (event) {

        event.preventDefault();

        if (!originalProfile) {

            displayProfileMessage(
                "Customer profile is not loaded.",
                "error"
            );

            return;

        }

        const name = $("#profileName").val().trim();

        const phone = $("#profilePhone").val().trim();

        const validationError = validateProfile(name, phone);

        if (validationError) {

            displayProfileMessage(
                validationError,
                "error"
            );

            return;

        }


        const customerId = originalProfile.uid ||
                           originalProfile.id ||
                           originalProfile.customerId;

        if (!customerId) {

            displayProfileMessage(
                "Customer ID is unavailable. Profile cannot be updated.",
                "error"
            );

            return;

        }


        saveButton.prop("disabled", true);

        saveButton.html(
            '<i class="fa-solid fa-spinner fa-spin"></i> Saving...'
        );


        apiPut(
            "/customers/" + encodeURIComponent(customerId),
            {
                fullName: name,
                phone: phone
            }
        )

        .done(function (response) {

            displayProfileMessage(
                response.message ||
                "Your profile has been updated successfully.",
                "success"
            );

            // Reload profile to display updated server values
            loadProfile();

        })

        .fail(function (xhr) {

            displayProfileMessage(
                getApiError(xhr),
                "error"
            );

        })

        .always(function () {

            saveButton.prop("disabled", false);

            saveButton.html(
                '<i class="fa-solid fa-floppy-disk"></i> Save Changes'
            );

        });

    });


    // ------------------------------------
    // CANCEL PROFILE CHANGES
    // ------------------------------------

    $("#cancelProfileChanges").on("click", function () {

        if (!originalProfile) {
            return;
        }

        $("#profileName").val(
            originalProfile.fullName ||
            originalProfile.name ||
            ""
        );

        $("#profilePhone").val(
            originalProfile.phone || ""
        );

        displayProfileMessage(
            "Your changes have been cancelled.",
            "success"
        );

    });


    // ------------------------------------
    // PROFILE NAVIGATION
    // ------------------------------------

    $(".profile-nav-link").on("click", function () {

        $(".profile-nav-link").removeClass("active");

        $(this).addClass("active");

    });


    // ------------------------------------
    // INITIALIZE PROFILE
    // ------------------------------------

    loadProfile();

});


// ========================================
// MODULE LOADED
// ========================================

console.log("NOVA Profile module loaded successfully.");
