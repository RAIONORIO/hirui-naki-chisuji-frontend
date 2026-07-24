// =========================================
// ADMIN - AVATARES
// =========================================

const avatarForm =
    document.getElementById("avatar-form");

const avatarMessage =
    document.getElementById("avatar-message");

const avatarList =
    document.getElementById("avatar-list");

const avatarFormTitle =
    document.getElementById("avatar-form-title");

const avatarEditInfo =
    document.getElementById("avatar-edit-info");

const avatarSubmitButton =
    document.getElementById("avatar-submit-button");

const avatarCancelEditButton =
    document.getElementById(
        "avatar-cancel-edit-button"
    );

const refreshAvatarsButton =
    document.getElementById(
        "refresh-avatars-button"
    );

const refreshAvatarListButton =
    document.getElementById(
        "refresh-avatar-list-button"
    );

let avatarsCache = [];

let editingAvatarId = null;


function resetAvatarForm() {

    editingAvatarId = null;

    avatarForm.reset();

    document.getElementById(
        "avatar-rarity"
    ).value = "Comum";

    document.getElementById(
        "avatar-source-type"
    ).value = "chapter_reward";

    document.getElementById(
        "avatar-unlock-type"
    ).value = "chapter_finish";

    document.getElementById(
        "avatar-price"
    ).value = 0;

    document.getElementById(
        "avatar-is-active"
    ).checked = true;

    avatarFormTitle.textContent =
        "CRIAR AVATAR";

    avatarSubmitButton.textContent =
        "CRIAR AVATAR";

    avatarEditInfo.style.display =
        "none";

    avatarCancelEditButton.style.display =
        "none";

    avatarMessage.textContent =
        "";

}


function fillAvatarForm(avatarId) {

    const avatar =
        avatarsCache.find((item) => {
            return (
                Number(item.id)
                === Number(avatarId)
            );
        });

    if (!avatar) {

        avatarMessage.textContent =
            "Avatar não encontrado na lista carregada.";

        return;

    }

    editingAvatarId =
        avatar.id;

    document.getElementById(
        "avatar-name"
    ).value = avatar.name || "";

    document.getElementById(
        "avatar-description"
    ).value = avatar.description || "";

    document.getElementById(
        "avatar-rarity"
    ).value = avatar.rarity || "Comum";

    document.getElementById(
        "avatar-source-type"
    ).value = (
        avatar.source_type
        || "chapter_reward"
    );

    document.getElementById(
        "avatar-unlock-type"
    ).value = avatar.unlock_type || "";

    document.getElementById(
        "avatar-unlock-key"
    ).value = avatar.unlock_key || "";

    document.getElementById(
        "avatar-price"
    ).value = avatar.price || 0;

    document.getElementById(
        "avatar-is-active"
    ).checked = (
        avatar.is_active === true
    );

    avatarFormTitle.textContent =
        "EDITAR AVATAR";

    avatarSubmitButton.textContent =
        "SALVAR AVATAR";

    avatarEditInfo.textContent =
        `Editando: ${avatar.name}`;

    avatarEditInfo.style.display =
        "block";

    avatarCancelEditButton.style.display =
        "block";

    avatarMessage.textContent =
        "";

    avatarForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


function getAvatarPayload() {

    const unlockTypeValue =
        document.getElementById(
            "avatar-unlock-type"
        ).value.trim();

    const unlockKeyValue =
        document.getElementById(
            "avatar-unlock-key"
        ).value.trim();

    return {
        name:
            document.getElementById(
                "avatar-name"
            ).value.trim(),
        description:
            document.getElementById(
                "avatar-description"
            ).value.trim()
            || null,
        image_url: null,
        rarity:
            document.getElementById(
                "avatar-rarity"
            ).value.trim()
            || "Comum",
        source_type:
            document.getElementById(
                "avatar-source-type"
            ).value.trim()
            || "chapter_reward",
        unlock_type:
            unlockTypeValue
            || null,
        unlock_key:
            unlockKeyValue
            || null,
        price:
            Number(
                document.getElementById(
                    "avatar-price"
                ).value
                || 0
            ),
        is_active:
            document.getElementById(
                "avatar-is-active"
            ).checked
    };

}


async function uploadAvatarImage(avatarId) {

    const image =
        document.getElementById(
            "avatar-image"
        ).files[0];

    if (!image) {
        return true;
    }

    const formData =
        new FormData();

    formData.append(
        "image",
        image
    );

    const response =
        await adminFetch(
            `${API_URL}/admin/avatars/${avatarId}/upload`,
            {
                method: "POST",
                body: formData
            }
        );

    const data =
        await readAdminResponse(response);

    avatarMessage.textContent =
        data.message
        || "Upload de imagem processado.";

    return data.success === true;

}


async function loadAvatars() {

    avatarList.innerHTML =
        "Carregando avatares...";

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/avatars`
            );

        const data =
            await readAdminResponse(response);

        if (
            !data.success
            || !Array.isArray(data.avatars)
        ) {

            avatarList.innerHTML =
                data.message
                || "Não foi possível carregar os avatares.";

            return;

        }

        avatarsCache =
            data.avatars;

        if (avatarsCache.length === 0) {

            avatarList.innerHTML =
                "Nenhum avatar cadastrado ainda.";

            return;

        }

        avatarList.innerHTML =
            "";

        avatarsCache.forEach((avatar) => {

            const item =
                document.createElement("div");

            item.className =
                "chapter-item";

            const avatarImageUrl =
                normalizeBackendAssetUrl(
                    avatar.image_url
                );

            const status =
                avatar.is_active
                    ? "Ativo"
                    : "Inativo";

            const imageBlock =
                avatarImageUrl
                    ? `
                        <div class="chapter-cover-preview">
                            <img
                                src="${escapeHTML(avatarImageUrl)}"
                                alt="${escapeHTML(avatar.name)}"
                            >
                        </div>
                    `
                    : `
                        <div class="chapter-cover-preview chapter-cover-placeholder">
                            SEM IMAGEM
                        </div>
                    `;

            const deleteButton =
                avatar.source_type === "initial"
                    ? ""
                    : `
                        <button
                            type="button"
                            class="admin-danger-button avatar-delete-button"
                        >
                            EXCLUIR
                        </button>
                    `;

            item.innerHTML = `
                <div class="chapter-item-with-cover">

                    ${imageBlock}

                    <div class="chapter-item-content">

                        <div class="chapter-item-main">

                            <strong>
                                ${escapeHTML(avatar.name)}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    avatar.description
                                    || "Sem descrição"
                                )}
                            </span>

                        </div>

                        <div class="chapter-item-meta">

                            <small>
                                ID:
                                ${escapeHTML(avatar.id)}
                            </small>

                            <small>
                                Status:
                                ${escapeHTML(status)}
                            </small>

                            <small>
                                Raridade:
                                ${escapeHTML(
                                    avatar.rarity
                                    || "Comum"
                                )}
                            </small>

                            <small>
                                Origem:
                                ${escapeHTML(
                                    avatar.source_type
                                    || "Não informada"
                                )}
                            </small>

                            <small>
                                Desbloqueio:
                                ${escapeHTML(
                                    avatar.unlock_type
                                    || "Livre"
                                )}
                                /
                                ${escapeHTML(
                                    avatar.unlock_key
                                    || "Sem chave"
                                )}
                            </small>

                            <small>
                                Preço:
                                ${escapeHTML(
                                    avatar.price
                                    || 0
                                )}
                            </small>

                        </div>

                        <div class="chapter-item-actions">

                            <button
                                type="button"
                                class="admin-small-button avatar-edit-button"
                            >
                                EDITAR
                            </button>

                            <button
                                type="button"
                                class="admin-small-button avatar-toggle-button"
                            >
                                ${avatar.is_active
                                    ? "INATIVAR"
                                    : "ATIVAR"}
                            </button>

                            ${deleteButton}

                        </div>

                    </div>

                </div>
            `;

            item.querySelector(
                ".avatar-edit-button"
            ).addEventListener(
                "click",
                () => {

                    fillAvatarForm(
                        avatar.id
                    );

                }
            );

            item.querySelector(
                ".avatar-toggle-button"
            ).addEventListener(
                "click",
                () => {

                    toggleAvatarActive(
                        avatar.id
                    );

                }
            );

            const removeButton =
                item.querySelector(
                    ".avatar-delete-button"
                );

            if (removeButton) {

                removeButton.addEventListener(
                    "click",
                    () => {

                        deleteAvatar(
                            avatar.id
                        );

                    }
                );

            }

            avatarList.appendChild(
                item
            );

        });

    } catch (error) {

        avatarList.innerHTML =
            "Erro ao conectar com o backend.";

    }

}


async function toggleAvatarActive(avatarId) {

    const avatar =
        avatarsCache.find((item) => {
            return (
                Number(item.id)
                === Number(avatarId)
            );
        });

    if (!avatar) {
        return;
    }

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/avatars/${avatarId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        is_active:
                            !avatar.is_active
                    })
                }
            );

        const data =
            await readAdminResponse(response);

        alert(
            data.message
            || "Avatar atualizado."
        );

        if (data.success) {
            loadAvatars();
        }

    } catch (error) {

        alert(
            "Erro ao atualizar avatar."
        );

    }

}


async function deleteAvatar(avatarId) {

    const confirmed =
        confirm(
            "Deseja excluir este avatar?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/avatars/${avatarId}`,
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

            if (
                Number(editingAvatarId)
                === Number(avatarId)
            ) {

                resetAvatarForm();

            }

            loadAvatars();

        }

    } catch (error) {

        alert(
            "Erro ao excluir avatar."
        );

    }

}


avatarForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        avatarMessage.textContent =
            editingAvatarId
                ? "Salvando avatar..."
                : "Criando avatar...";

        const payload =
            getAvatarPayload();

        if (!payload.name) {

            avatarMessage.textContent =
                "Informe o nome do avatar.";

            return;

        }

        const isEditing =
            editingAvatarId !== null;

        const currentAvatar =
            isEditing
                ? avatarsCache.find((item) => {
                    return (
                        Number(item.id)
                        === Number(editingAvatarId)
                    );
                })
                : null;

        if (
            isEditing
            && currentAvatar
        ) {

            payload.image_url =
                currentAvatar.image_url
                || null;

        }

        const url =
            isEditing
                ? `${API_URL}/admin/avatars/${editingAvatarId}`
                : `${API_URL}/admin/avatars`;

        const method =
            isEditing
                ? "PUT"
                : "POST";

        try {

            const response =
                await adminFetch(
                    url,
                    {
                        method,
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(payload)
                    }
                );

            const data =
                await readAdminResponse(response);

            avatarMessage.textContent =
                data.message
                || "Avatar salvo.";

            if (
                !data.success
                || !data.avatar
            ) {
                return;
            }

            const uploaded =
                await uploadAvatarImage(
                    data.avatar.id
                );

            if (!uploaded) {
                return;
            }

            resetAvatarForm();

            await loadAvatars();

        } catch (error) {

            avatarMessage.textContent =
                "Erro ao salvar avatar.";

        }

    }
);


avatarCancelEditButton.addEventListener(
    "click",
    resetAvatarForm
);


refreshAvatarsButton.addEventListener(
    "click",
    loadAvatars
);


refreshAvatarListButton.addEventListener(
    "click",
    loadAvatars
);


loadAvatars();
