// =========================================
// ADMIN - USUÁRIOS
// =========================================

const userList =
    document.getElementById("user-list");

const refreshUsersButton =
    document.getElementById("refresh-users-button");

const userSearchForm =
    document.getElementById("user-search-form");

const userSearchInput =
    document.getElementById("user-search-input");

const userSearchEmpty =
    document.getElementById("user-search-empty");


let usersCache = [];


function normalizeUserSearchText(value) {

    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


function getOrderedUsers(users) {

    return [...users].sort(
        (
            firstUser,
            secondUser
        ) => {

            if (
                firstUser.is_admin
                && !secondUser.is_admin
            ) {
                return -1;
            }

            if (
                !firstUser.is_admin
                && secondUser.is_admin
            ) {
                return 1;
            }

            if (
                firstUser.is_blocked
                && !secondUser.is_blocked
            ) {
                return -1;
            }

            if (
                !firstUser.is_blocked
                && secondUser.is_blocked
            ) {
                return 1;
            }

            return (
                Number(firstUser.id)
                - Number(secondUser.id)
            );

        }
    );

}


function userMatchesSearch(
    user,
    query
) {

    if (!query) {
        return true;
    }

    const searchableText =
        normalizeUserSearchText(
            [
                user.nome,
                user.apelido,
                user.email,
                user.telefone,
                user.id,
                user.is_admin
                    ? "administrador admin"
                    : "usuario",
                user.is_blocked
                    ? "bloqueado aguardando aprovacao"
                    : "ativo"
            ].join(" ")
        );

    return searchableText.includes(
        query
    );

}


function renderUsers(users) {

    userList.innerHTML =
        "";

    if (
        !Array.isArray(users)
        || users.length === 0
    ) {

        if (userSearchEmpty) {

            userSearchEmpty.style.display =
                "block";

        }

        return;

    }

    if (userSearchEmpty) {

        userSearchEmpty.style.display =
            "none";

    }

    users.forEach((user) => {

        const item =
            document.createElement("div");

        item.className =
            user.is_blocked
                ? "user-item user-item-blocked"
                : "user-item";

        const status =
            user.is_blocked
                ? "Aguardando aprovação / bloqueado"
                : "Ativo";

        const type =
            user.is_admin
                ? "Administrador"
                : "Usuário";

        const approvalButton =
            user.is_blocked
                ? `
                    <button
                        type="button"
                        class="admin-small-button user-unblock-button"
                    >
                        APROVAR ACESSO
                    </button>
                `
                : `
                    <button
                        type="button"
                        class="admin-danger-button user-block-button"
                    >
                        BLOQUEAR
                    </button>
                `;

        const actionButtons =
            user.is_admin
                ? ""
                : `
                    ${approvalButton}

                    <button
                        type="button"
                        class="admin-small-button user-reset-password-button"
                    >
                        RESETAR SENHA
                    </button>

                    <button
                        type="button"
                        class="admin-danger-button user-delete-button"
                    >
                        EXCLUIR
                    </button>
                `;

        item.innerHTML = `
            <div class="user-item-main">

                <strong>
                    ${escapeHTML(user.nome)}
                    ${user.is_admin ? "(Admin)" : ""}
                </strong>

                <span>
                    Apelido:
                    ${escapeHTML(
                        user.apelido
                        || "Não informado"
                    )}
                </span>

                <span>
                    Email:
                    ${escapeHTML(user.email)}
                </span>

                <span>
                    Telefone:
                    ${escapeHTML(
                        user.telefone
                        || "Não informado"
                    )}
                </span>

            </div>

            <div class="user-item-meta">

                <small>
                    Status: ${escapeHTML(status)}
                </small>

                <small>
                    Tipo: ${escapeHTML(type)}
                </small>

                <small>
                    ID: ${escapeHTML(user.id)}
                </small>

            </div>

            <div class="user-item-actions">
                ${actionButtons}
            </div>
        `;

        const blockButton =
            item.querySelector(
                ".user-block-button"
            );

        const unblockButton =
            item.querySelector(
                ".user-unblock-button"
            );

        const resetPasswordButton =
            item.querySelector(
                ".user-reset-password-button"
            );

        const deleteButton =
            item.querySelector(
                ".user-delete-button"
            );

        if (blockButton) {

            blockButton.addEventListener(
                "click",
                () => {

                    blockUser(
                        user.id
                    );

                }
            );

        }

        if (unblockButton) {

            unblockButton.addEventListener(
                "click",
                () => {

                    unblockUser(
                        user.id
                    );

                }
            );

        }

        if (resetPasswordButton) {

            resetPasswordButton.addEventListener(
                "click",
                () => {

                    resetUserPassword(
                        user.id,
                        user.email
                    );

                }
            );

        }

        if (deleteButton) {

            deleteButton.addEventListener(
                "click",
                () => {

                    deleteUser(
                        user.id
                    );

                }
            );

        }

        userList.appendChild(
            item
        );

    });

}


function searchUsers() {

    const query =
        normalizeUserSearchText(
            userSearchInput
                ? userSearchInput.value
                : ""
        );

    const filteredUsers =
        usersCache.filter((user) => {

            return userMatchesSearch(
                user,
                query
            );

        });

    renderUsers(
        filteredUsers
    );

}


async function loadUsers() {

    userList.innerHTML =
        "Carregando usuários...";

    if (userSearchEmpty) {

        userSearchEmpty.style.display =
            "none";

    }

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/users`
            );

        const data =
            await readAdminResponse(response);

        if (!data.success) {

            userList.innerHTML =
                data.message
                || "Não foi possível carregar os usuários.";

            return;

        }

        if (
            !data.users
            || data.users.length === 0
        ) {

            usersCache = [];

            userList.innerHTML =
                "Nenhum usuário cadastrado ainda.";

            return;

        }

        usersCache =
            getOrderedUsers(
                data.users
            );

        searchUsers();

    } catch (error) {

        userList.innerHTML =
            "Erro ao conectar com o backend.";

    }

}


async function resetUserPassword(
    userId,
    userEmail
) {

    const newPassword =
        prompt(
            `Digite a nova senha temporária para:\n`
            + `${userEmail}\n\n`
            + `A senha precisa ter pelo menos 6 caracteres.`
        );

    if (!newPassword) {

        alert(
            "Reset de senha cancelado."
        );

        return;

    }

    if (
        newPassword.trim().length < 6
    ) {

        alert(
            "A nova senha precisa ter pelo menos 6 caracteres."
        );

        return;

    }

    const confirmPassword =
        prompt(
            "Confirme a nova senha temporária:"
        );

    if (
        newPassword
        !== confirmPassword
    ) {

        alert(
            "As senhas não coincidem."
        );

        return;

    }

    const confirmed =
        confirm(
            `Deseja resetar a senha do usuário ${userEmail}?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/users/${userId}/reset-password`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        nova_senha:
                            newPassword.trim(),
                        confirmar_senha:
                            confirmPassword.trim()
                    })
                }
            );

        const data =
            await readAdminResponse(response);

        alert(
            data.message
            || "Operação concluída."
        );

    } catch (error) {

        alert(
            "Erro ao resetar senha do usuário."
        );

    }

}


async function deleteUser(userId) {

    const confirmationText =
        `EXCLUIR USUÁRIO ${userId}`;

    const typedConfirmation =
        prompt(
            `Esta ação vai excluir permanentemente `
            + `este usuário.\n\n`
            + `Também serão removidos o progresso `
            + `de leitura e desbloqueios ligados a ele.\n\n`
            + `Essa ação não pode ser desfeita.\n\n`
            + `Para confirmar, digite exatamente:\n`
            + confirmationText
        );

    if (
        typedConfirmation
        !== confirmationText
    ) {

        alert(
            "Exclusão cancelada."
        );

        return;

    }

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/users/${userId}`,
                {
                    method: "DELETE"
                }
            );

        const data =
            await readAdminResponse(response);

        alert(
            data.message
            || "Operação concluída."
        );

        if (data.success) {
            loadUsers();
        }

    } catch (error) {

        alert(
            "Erro ao excluir usuário."
        );

    }

}


async function blockUser(userId) {

    const confirmed =
        confirm(
            "Deseja bloquear este usuário? "
            + "Ele não poderá mais fazer login "
            + "até ser aprovado novamente."
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/users/${userId}/block`,
                {
                    method: "PUT"
                }
            );

        const data =
            await readAdminResponse(response);

        alert(
            data.message
            || "Operação concluída."
        );

        if (data.success) {
            loadUsers();
        }

    } catch (error) {

        alert(
            "Erro ao bloquear usuário."
        );

    }

}


async function unblockUser(userId) {

    const confirmed =
        confirm(
            "Deseja aprovar o acesso deste usuário? "
            + "Ele poderá fazer login normalmente."
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/users/${userId}/unblock`,
                {
                    method: "PUT"
                }
            );

        const data =
            await readAdminResponse(response);

        alert(
            data.message
            || "Operação concluída."
        );

        if (data.success) {
            loadUsers();
        }

    } catch (error) {

        alert(
            "Erro ao desbloquear usuário."
        );

    }

}


refreshUsersButton.addEventListener(
    "click",
    loadUsers
);


if (userSearchForm) {

    userSearchForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();

            searchUsers();

        }
    );

}


if (userSearchInput) {

    userSearchInput.addEventListener(
        "input",
        () => {

            if (
                userSearchInput.value.trim()
                === ""
            ) {

                searchUsers();

            }

        }
    );

}


loadUsers();
