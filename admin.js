// =========================================
// ADMIN - BASE COMPARTILHADA
// Mantém a comunicação com o backend e
// utilitários usados pelas páginas admin.
// =========================================

const API_URL =
    ["localhost", "127.0.0.1"].includes(
        window.location.hostname
    )
        ? "http://127.0.0.1:8000"
        : "https://hiruibackend.shardweb.app";


function getAdminToken() {

    return (
        localStorage.getItem("hiruiToken")
        || ""
    );

}


function getAdminAuthHeaders(headers = {}) {

    const token =
        getAdminToken();

    return {
        ...headers,
        ...(token
            ? {
                Authorization: `Bearer ${token}`
            }
            : {})
    };

}


function adminFetch(url, options = {}) {

    return fetch(url, {
        ...options,
        headers: getAdminAuthHeaders(
            options.headers || {}
        )
    });

}


function escapeHTML(value) {

    if (
        value === null
        || value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function normalizeBackendAssetUrl(url) {

    if (
        !url
        || typeof url !== "string"
        || url.trim() === ""
    ) {
        return "";
    }

    const cleanUrl =
        url.trim();

    if (
        cleanUrl.startsWith("http://")
        || cleanUrl.startsWith("https://")
    ) {
        return cleanUrl;
    }

    if (cleanUrl.startsWith("/manga")) {
        return `${API_URL}${cleanUrl}`;
    }

    if (cleanUrl.startsWith("manga/")) {
        return `${API_URL}/${cleanUrl}`;
    }

    return cleanUrl;

}


function getFileNameFromUrl(url) {

    if (!url) {
        return "Arquivo não informado";
    }

    const cleanUrl =
        String(url).split("?")[0];

    const parts =
        cleanUrl.split("/");

    return (
        parts[parts.length - 1]
        || cleanUrl
    );

}


async function readAdminResponse(response) {

    try {

        return await response.json();

    } catch (error) {

        return {
            success: false,
            message: (
                "O backend retornou uma resposta inválida."
            )
        };

    }

}
