// =========================================
// ADMIN - CAPÍTULOS
// =========================================

const chapterForm =
    document.getElementById("chapter-form");

const chapterMessage =
    document.getElementById("chapter-message");

const chapterList =
    document.getElementById("chapter-list");

const chapterFormTitle =
    document.getElementById("chapter-form-title");

const chapterEditInfo =
    document.getElementById("chapter-edit-info");

const chapterSubmitButton =
    document.getElementById("chapter-submit-button");

const chapterCancelEditButton =
    document.getElementById("chapter-cancel-edit-button");

const refreshChaptersButton =
    document.getElementById("refresh-chapters-button");

let chaptersCache = [];

let editingChapterId = null;


function resetChapterForm() {

    editingChapterId = null;

    chapterForm.reset();

    chapterFormTitle.textContent =
        "CRIAR CAPÍTULO";

    chapterSubmitButton.textContent =
        "CRIAR CAPÍTULO";

    chapterEditInfo.style.display =
        "none";

    chapterCancelEditButton.style.display =
        "none";

    chapterMessage.textContent =
        "";

}


function fillChapterForm(chapterId) {

    const chapter =
        chaptersCache.find((item) => {
            return (
                Number(item.id)
                === Number(chapterId)
            );
        });

    if (!chapter) {

        chapterMessage.textContent =
            "Capítulo não encontrado na lista carregada.";

        return;

    }

    editingChapterId =
        chapter.id;

    document.getElementById(
        "chapter-number"
    ).value = chapter.number;

    document.getElementById(
        "chapter-title"
    ).value = chapter.title || "";

    document.getElementById(
        "chapter-date"
    ).value = chapter.release_date || "";

    chapterFormTitle.textContent =
        "EDITAR CAPÍTULO";

    chapterSubmitButton.textContent =
        "SALVAR ALTERAÇÕES";

    chapterEditInfo.textContent =
        `Editando: Capítulo ${chapter.number} - ${chapter.title}`;

    chapterEditInfo.style.display =
        "block";

    chapterCancelEditButton.style.display =
        "block";

    chapterMessage.textContent =
        "";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


async function loadChapters() {

    chapterList.innerHTML =
        "Carregando capítulos...";

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/chapters`
            );

        const data =
            await readAdminResponse(response);

        if (!data.success) {

            chapterList.innerHTML =
                data.message
                || "Não foi possível carregar os capítulos.";

            return;

        }

        chaptersCache =
            data.chapters || [];

        if (chaptersCache.length === 0) {

            chapterList.innerHTML =
                "Nenhum capítulo cadastrado ainda.";

            return;

        }

        chapterList.innerHTML =
            "";

        chaptersCache.forEach((chapter) => {

            const item =
                document.createElement("div");

            item.className =
                "chapter-item";

            const status =
                chapter.is_published
                    ? "Publicado"
                    : "Oculto";

            const coverImage =
                chapter.cover_image
                    ? escapeHTML(
                        normalizeBackendAssetUrl(
                            chapter.cover_image
                        )
                    )
                    : "";

            const coverBlock =
                coverImage
                    ? `
                        <div class="chapter-cover-preview">
                            <img
                                src="${coverImage}"
                                alt="Capa do capítulo ${escapeHTML(chapter.number)}"
                            >
                        </div>
                    `
                    : `
                        <div class="chapter-cover-preview chapter-cover-placeholder">
                            SEM CAPA
                        </div>
                    `;

            item.innerHTML = `
                <div class="chapter-item-with-cover">

                    ${coverBlock}

                    <div class="chapter-item-content">

                        <div class="chapter-item-main">

                            <strong>
                                Capítulo ${escapeHTML(chapter.number)}
                                - ${escapeHTML(chapter.title)}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    chapter.description
                                    || "Sem descrição"
                                )}
                            </span>

                        </div>

                        <div class="chapter-item-meta">

                            <small>
                                Status: ${escapeHTML(status)}
                            </small>

                            <small>
                                Data: ${escapeHTML(
                                    chapter.release_date
                                    || "Sem data"
                                )}
                            </small>

                            <small>
                                ID: ${escapeHTML(chapter.id)}
                            </small>

                        </div>

                        <div class="chapter-item-actions">

                            <button
                                type="button"
                                class="admin-small-button chapter-edit-button"
                            >
                                EDITAR
                            </button>

                            <button
                                type="button"
                                class="admin-small-button chapter-toggle-publish-button"
                            >
                                ${chapter.is_published
                                    ? "OCULTAR"
                                    : "PUBLICAR"}
                            </button>

                            <button
                                type="button"
                                class="admin-danger-button chapter-delete-button"
                            >
                                EXCLUIR
                            </button>

                        </div>

                    </div>

                </div>
            `;

            item.querySelector(
                ".chapter-edit-button"
            ).addEventListener(
                "click",
                () => {

                    fillChapterForm(
                        chapter.id
                    );

                }
            );

            item.querySelector(
                ".chapter-toggle-publish-button"
            ).addEventListener(
                "click",
                () => {

                    toggleChapterPublished(
                        chapter.id
                    );

                }
            );

            item.querySelector(
                ".chapter-delete-button"
            ).addEventListener(
                "click",
                () => {

                    deleteChapter(
                        chapter.id
                    );

                }
            );

            chapterList.appendChild(
                item
            );

        });

    } catch (error) {

        console.log(
            "Erro ao carregar capítulos:",
            error
        );

        chapterList.innerHTML =
            "Erro ao conectar com o backend.";

    }

}


async function toggleChapterPublished(chapterId) {

    const chapter =
        chaptersCache.find((item) => {
            return (
                Number(item.id)
                === Number(chapterId)
            );
        });

    if (!chapter) {

        alert(
            "Capítulo não encontrado na lista carregada."
        );

        return;

    }

    const newStatus =
        !chapter.is_published;

    const actionText =
        newStatus
            ? "publicar"
            : "ocultar";

    const confirmed =
        confirm(
            `Deseja ${actionText} o Capítulo `
            + `${chapter.number} - ${chapter.title}?`
        );

    if (!confirmed) {
        return;
    }

    const payload = {
        number: chapter.number,
        title: chapter.title,
        description: chapter.description,
        cover_image: chapter.cover_image,
        release_date: chapter.release_date,
        is_published: newStatus
    };

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/chapters/${chapter.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

        const data =
            await readAdminResponse(response);

        alert(
            data.message
            || "Status do capítulo atualizado."
        );

        if (data.success) {
            await loadChapters();
        }

    } catch (error) {

        alert(
            "Erro ao atualizar status do capítulo."
        );

    }

}


async function deleteChapter(chapterId) {

    const chapter =
        chaptersCache.find((item) => {
            return (
                Number(item.id)
                === Number(chapterId)
            );
        });

    if (!chapter) {

        alert(
            "Capítulo não encontrado na lista carregada."
        );

        return;

    }

    const confirmationText =
        `EXCLUIR CAPÍTULO ${chapter.number}`;

    const typedConfirmation =
        prompt(
            `Esta ação vai remover o Capítulo `
            + `${chapter.number} - ${chapter.title} `
            + `do banco de dados.\n\n`
            + `As páginas cadastradas também serão `
            + `removidas do banco.\n\n`
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
                `${API_URL}/admin/chapters/${chapter.id}`,
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

            await loadChapters();

            resetChapterForm();

        }

    } catch (error) {

        alert(
            "Erro ao excluir capítulo."
        );

    }

}


chapterForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const currentChapter =
            editingChapterId
                ? chaptersCache.find((item) => {
                    return (
                        Number(item.id)
                        === Number(editingChapterId)
                    );
                })
                : null;

        const payload = {
            number: Number(
                document.getElementById(
                    "chapter-number"
                ).value
            ),
            title:
                document.getElementById(
                    "chapter-title"
                ).value,
            description:
                currentChapter
                    ? currentChapter.description
                    : null,
            cover_image:
                currentChapter
                    ? currentChapter.cover_image
                    : null,
            release_date:
                document.getElementById(
                    "chapter-date"
                ).value
                || null,
            is_published:
                currentChapter
                    ? currentChapter.is_published
                    : true
        };

        const isEditing =
            editingChapterId !== null;

        const url =
            isEditing
                ? `${API_URL}/admin/chapters/${editingChapterId}`
                : `${API_URL}/admin/chapters`;

        const method =
            isEditing
                ? "PUT"
                : "POST";

        chapterMessage.textContent =
            isEditing
                ? "Salvando alterações..."
                : "Criando capítulo...";

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

            chapterMessage.textContent =
                data.message
                || "Operação concluída.";

            if (data.success) {

                resetChapterForm();

                await loadChapters();

            }

        } catch (error) {

            chapterMessage.textContent =
                isEditing
                    ? "Erro ao atualizar capítulo."
                    : "Erro ao criar capítulo.";

        }

    }
);


chapterCancelEditButton.addEventListener(
    "click",
    resetChapterForm
);


refreshChaptersButton.addEventListener(
    "click",
    loadChapters
);


loadChapters();
