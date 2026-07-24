// =========================================
// ADMIN ACCESS
// Exibe o link ADMIN e protege todas as
// páginas administrativas.
// =========================================

const HIRUI_ADMIN_EMAIL = "raionorio0204@admin.com";

function getLoggedUserFromStorage() {

    const storedUser =
        localStorage.getItem("hiruiUser");

    if (!storedUser) {
        return null;
    }

    try {

        const parsedValue =
            JSON.parse(storedUser);

        if (
            parsedValue
            && typeof parsedValue === "object"
        ) {

            if (parsedValue.email) {
                return parsedValue;
            }

            if (
                parsedValue.user
                && parsedValue.user.email
            ) {
                return parsedValue.user;
            }

        }

    } catch (error) {

        console.log(
            "Não foi possível interpretar o usuário salvo.",
            error
        );

    }

    return null;

}

function isCurrentUserAdmin() {

    const user =
        getLoggedUserFromStorage();

    const token =
        localStorage.getItem("hiruiToken");

    if (
        !user
        || !user.email
        || !token
    ) {
        return false;
    }

    return (
        user.email.trim().toLowerCase()
        === HIRUI_ADMIN_EMAIL
    );

}

function addAdminLinkToNavbar() {

    const navMenu =
        document.getElementById("nav-menu")
        || document.querySelector(".navbar nav");

    if (!navMenu) {
        return;
    }

    if (
        document.getElementById(
            "admin-nav-link"
        )
    ) {
        return;
    }

    if (!isCurrentUserAdmin()) {
        return;
    }

    const adminLink =
        document.createElement("a");

    adminLink.href =
        "admin.html";

    adminLink.id =
        "admin-nav-link";

    adminLink.className =
        "admin-nav-link";

    adminLink.textContent =
        "ADMIN";

    navMenu.appendChild(
        adminLink
    );

}

function isAdminPage() {

    const currentPath =
        window.location.pathname.toLowerCase();

    const currentFile =
        currentPath.split("/").pop();

    return (
        currentPath.endsWith("/admin")
        || currentFile === "admin"
        || currentFile === "admin.html"
        || (
            currentFile
            && currentFile.startsWith("admin-")
            && currentFile.endsWith(".html")
        )
    );

}

function protectAdminPage() {

    if (!isAdminPage()) {
        return;
    }

    if (isCurrentUserAdmin()) {
        return;
    }

    alert(
        "Acesso restrito ao administrador."
    );

    window.location.href =
        "index.html";

}

protectAdminPage();

document.addEventListener(
    "DOMContentLoaded",
    function () {

        addAdminLinkToNavbar();

    }
);
