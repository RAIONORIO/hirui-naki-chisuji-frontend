// =========================================
// ADMIN ACCESS
// Mostra o link ADMIN apenas para o e-mail autorizado
// =========================================

function getLoggedUserFromStorage() {

    for (let index = 0; index < localStorage.length; index++) {

        const key = localStorage.key(index);
        const value = localStorage.getItem(key);

        if (!value) {
            continue;
        }

        try {

            const parsedValue = JSON.parse(value);

            if (parsedValue && typeof parsedValue === "object") {

                if (parsedValue.email) {
                    return parsedValue;
                }

                if (parsedValue.user && parsedValue.user.email) {
                    return parsedValue.user;
                }

            }

        } catch (error) {
            continue;
        }

    }

    return null;

}

function isCurrentUserAdmin() {

    const user = getLoggedUserFromStorage();

    if (!user || !user.email) {
        return false;
    }

    const token = localStorage.getItem("hiruiToken");

    return Boolean(user && user.is_admin && token);

}

function addAdminLinkToNavbar() {

    const navMenu = document.getElementById("nav-menu") || document.querySelector(".navbar nav");

    if (!navMenu) {
        return;
    }

    const existingAdminLink = document.getElementById("admin-nav-link");

    if (existingAdminLink) {
        return;
    }

    if (!isCurrentUserAdmin()) {
        return;
    }

    const adminLink = document.createElement("a");

    adminLink.href = "admin.html";
    adminLink.id = "admin-nav-link";
    adminLink.className = "admin-nav-link";
    adminLink.textContent = "ADMIN";

    navMenu.appendChild(adminLink);

}

function protectAdminPage() {

    const currentPage = window.location.pathname.toLowerCase();

    const isAdminPage = currentPage.endsWith("admin.html") || currentPage.endsWith("/admin");

    if (!isAdminPage) {
        return;
    }

    if (!isCurrentUserAdmin()) {

        alert("Acesso restrito ao administrador.");
        window.location.href = "/";

    }

}

document.addEventListener("DOMContentLoaded", function () {

    addAdminLinkToNavbar();
    protectAdminPage();

});
