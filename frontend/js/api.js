
// ========================================
// NOVA - API COMMUNICATION
// ========================================

// Get Firebase authentication token
function getAuthToken() {
    return localStorage.getItem("novaToken") ||
           sessionStorage.getItem("novaToken");
}


// Common API request function
function apiRequest(method, endpoint, data = null) {

    const token = getAuthToken();

    const headers = {
        "Content-Type": "application/json"
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    return $.ajax({
        url: API_BASE_URL + endpoint,
        method: method,
        headers: headers,
        contentType: "application/json",
        data: data ? JSON.stringify(data) : undefined
    });
}


// GET request
function apiGet(endpoint) {
    return apiRequest("GET", endpoint);
}


// POST request
function apiPost(endpoint, data) {
    return apiRequest("POST", endpoint, data);
}


// PUT request
function apiPut(endpoint, data) {
    return apiRequest("PUT", endpoint, data);
}


// PATCH request
function apiPatch(endpoint, data) {
    return apiRequest("PATCH", endpoint, data);
}


// DELETE request
function apiDelete(endpoint) {
    return apiRequest("DELETE", endpoint);
}


// Display success message
function showSuccess(message, elementId = "messageBox") {

    const element = $("#" + elementId);

    element
        .removeClass("error")
        .addClass("success")
        .text(message)
        .show();

}


// Display error message
function showError(message, elementId = "messageBox") {

    const element = $("#" + elementId);

    element
        .removeClass("success")
        .addClass("error")
        .text(message)
        .show();

}


// Clear message
function clearMessage(elementId = "messageBox") {

    $("#" + elementId)
        .removeClass("success error")
        .text("")
        .hide();

}


// Format currency
function formatCurrency(amount) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);

}


// Handle API errors
function getApiError(xhr) {

    if (xhr.responseJSON && xhr.responseJSON.message) {
        return xhr.responseJSON.message;
    }

    if (xhr.responseJSON && xhr.responseJSON.error) {
        return xhr.responseJSON.error;
    }

    if (xhr.status === 401) {
        return "Session expired. Please login again.";
    }

    if (xhr.status === 403) {
        return "You are not allowed to perform this action.";
    }

    if (xhr.status === 404) {
        return "Requested information was not found.";
    }

    if (xhr.status === 500) {
        return "Server error. Please try again later.";
    }

    return "Something went wrong. Please try again.";

}


console.log("NOVA API module loaded successfully.");
