// =========================================
// ADMIN - PÁGINAS DO MANGÁ
// =========================================

const pageForm =
    document.getElementById("page-form");

const bulkPageForm =
    document.getElementById("bulk-page-form");

const pageMessage =
    document.getElementById("page-message");

const bulkPageMessage =
    document.getElementById("bulk-page-message");

const pageChapter =
    document.getElementById("page-chapter");

const bulkPageChapter =
    document.getElementById("bulk-page-chapter");

const pagesListChapter =
    document.getElementById("pages-list-chapter");

const pagesPanel =
    document.getElementById("pages-panel");

const selectedChapterTitle =
    document.getElementById("selected-chapter-title");

const chapterPagesList =
    document.getElementById("chapter-pages-list");

const loadPagesButton =
    document.getElementById("load-pages-button");

const refreshPagesButton =
    document.getElementById("refresh-pages-button");

let pageChaptersCache = [];

let selectedChapterId = null;


function fillPageChapterSelect(
    selectElement
) {

    selectElement.innerHTML = `
        <option value="">
            Selecione o capítulo
        </option>
    `;

    pageChaptersCache.forEach((chapter) => {

        const option =
            document.createElement("option");

        option.value =
            chapter.id;

        option.textContent =
            `Capítulo ${chapter.number} - ${chapter.title}`;

        selectElement.appendChild(
            option
        );

    });

}


function fillPageChapterSelects() {

    fillPageChapterSelect(
        pageChapter
    );

    fillPageChapterSelect(
        bulkPageChapter
    );

    fillPageChapterSelect(
        pagesListChapter
    );

}


async function loadPageChapters() {

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/chapters`
            );

        const data =
            await readAdminResponse(response);

        if (!data.success) {

            chapterPagesList.innerHTML =
                data.message
                || "Não foi possível carregar os capítulos.";

            return;

        }

        pageChaptersCache =
            data.chapters || [];

        fillPageChapterSelects();

        if (pageChaptersCache.length === 0) {

            chapterPagesList.innerHTML =
                "Nenhum capítulo cadastrado ainda.";

        }

    } catch (error) {

        chapterPagesList.innerHTML =
            "Erro ao conectar com o backend.";

    }

}


function synchronizeChapterSelection(
    chapterId
) {

    const value =
        chapterId
            ? String(chapterId)
            : "";

    pageChapter.value =
        value;

    bulkPageChapter.value =
        value;

    pagesListChapter.value =
        value;

}


async function loadChapterPages(chapterId) {

    const numericChapterId =
        Number(chapterId);

    const chapter =
        pageChaptersCache.find((item) => {
            return (
                Number(item.id)
                === numericChapterId
            );
        });

    selectedChapterId =
        numericChapterId;

    synchronizeChapterSelection(
        numericChapterId
    );

    pagesPanel.style.display =
        "block";

    selectedChapterTitle.textContent =
        chapter
            ? `Capítulo ${chapter.number} - ${chapter.title}`
            : `ID do capítulo: ${numericChapterId}`;

    chapterPagesList.innerHTML =
        "Carregando páginas cadastradas...";

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/chapters/${numericChapterId}/pages`
            );

        const data =
            await readAdminResponse(response);

        if (!data.success) {

            chapterPagesList.innerHTML =
                data.message
                || "Não foi possível carregar as páginas.";

            return;

        }

        if (
            !data.pages
            || data.pages.length === 0
        ) {

            document.getElementById(
                "page-number"
            ).value = 1;

            chapterPagesList.innerHTML =
                "Nenhuma página cadastrada para este capítulo.";

            return;

        }

        const highestPageNumber =
            Math.max(
                ...data.pages.map((page) => {
                    return Number(
                        page.page_number
                    );
                })
            );

        document.getElementById(
            "page-number"
        ).value = highestPageNumber + 1;

        chapterPagesList.innerHTML =
            "";

        data.pages.forEach((page) => {

            const pageItem =
                document.createElement("div");

            pageItem.className =
                "chapter-page-item";

            const pageImageUrl =
                normalizeBackendAssetUrl(
                    page.image_url
                );

            const fileName =
                getFileNameFromUrl(
                    page.image_url
                );

            pageItem.innerHTML = `
                <div class="chapter-page-info">

                    <strong>
                        Página ${escapeHTML(page.page_number)}
                    </strong>

                    <span>
                        Arquivo: ${escapeHTML(fileName)}
                    </span>

                    <small>
                        ${escapeHTML(pageImageUrl)}
                    </small>

                </div>

                <div class="chapter-page-actions">

                    <a
                        href="${escapeHTML(pageImageUrl)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="admin-small-button admin-link-button"
                    >
                        ABRIR IMAGEM
                    </a>

                    <button
                        type="button"
                        class="admin-danger-button page-delete-button"
                    >
                        EXCLUIR
                    </button>

                </div>
            `;

            pageItem.querySelector(
                ".page-delete-button"
            ).addEventListener(
                "click",
                () => {

                    deleteChapterPage(
                        page.id,
                        page.page_number
                    );

                }
            );

            chapterPagesList.appendChild(
                pageItem
            );

        });

    } catch (error) {

        chapterPagesList.innerHTML =
            "Erro ao conectar com o backend.";

    }

}


function refreshSelectedChapterPages() {

    if (!selectedChapterId) {

        chapterPagesList.innerHTML =
            "Selecione um capítulo.";

        return;

    }

    loadChapterPages(
        selectedChapterId
    );

}


async function deleteChapterPage(
    pageId,
    pageNumber
) {

    const confirmed =
        confirm(
            `Deseja excluir o cadastro da página ${pageNumber}?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/pages/${pageId}`,
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

            refreshSelectedChapterPages();

        }

    } catch (error) {

        alert(
            "Erro ao excluir página."
        );

    }

}


pageForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        pageMessage.textContent =
            "Enviando página...";

        const chapterId =
            pageChapter.value;

        const pageNumber =
            document.getElementById(
                "page-number"
            ).value;

        const image =
            document.getElementById(
                "page-image"
            ).files[0];

        if (
            !chapterId
            || !pageNumber
            || !image
        ) {

            pageMessage.textContent =
                "Preencha todos os campos.";

            return;

        }

        const formData =
            new FormData();

        formData.append(
            "page_number",
            pageNumber
        );

        formData.append(
            "image",
            image
        );

        try {

            const response =
                await adminFetch(
                    `${API_URL}/admin/chapters/${chapterId}/pages/upload`,
                    {
                        method: "POST",
                        body: formData
                    }
                );

            const data =
                await readAdminResponse(response);

            pageMessage.textContent =
                data.message
                || "Operação concluída.";

            if (data.success) {

                document.getElementById(
                    "page-image"
                ).value = "";

                selectedChapterId =
                    Number(chapterId);

                synchronizeChapterSelection(
                    selectedChapterId
                );

                await loadChapterPages(
                    selectedChapterId
                );

            }

        } catch (error) {

            pageMessage.textContent =
                "Erro ao enviar página.";

        }

    }
);


bulkPageForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        bulkPageMessage.textContent =
            "Enviando capítulo completo...";

        const chapterId =
            bulkPageChapter.value;

        const images =
            document.getElementById(
                "bulk-page-images"
            ).files;

        if (
            !chapterId
            || images.length === 0
        ) {

            bulkPageMessage.textContent =
                "Selecione o capítulo e as imagens.";

            return;

        }

        const formData =
            new FormData();

        Array.from(images).forEach(
            (image) => {

                formData.append(
                    "images",
                    image
                );

            }
        );

        try {

            const response =
                await adminFetch(
                    `${API_URL}/admin/chapters/${chapterId}/pages/bulk-upload`,
                    {
                        method: "POST",
                        body: formData
                    }
                );

            const data =
                await readAdminResponse(response);

            bulkPageMessage.textContent =
                data.message
                || "Operação concluída.";

            if (data.success) {

                document.getElementById(
                    "bulk-page-images"
                ).value = "";

                selectedChapterId =
                    Number(chapterId);

                synchronizeChapterSelection(
                    selectedChapterId
                );

                await loadChapterPages(
                    selectedChapterId
                );

            }

        } catch (error) {

            bulkPageMessage.textContent =
                "Erro ao enviar capítulo completo.";

        }

    }
);


loadPagesButton.addEventListener(
    "click",
    () => {

        const chapterId =
            pagesListChapter.value;

        if (!chapterId) {

            chapterPagesList.innerHTML =
                "Selecione um capítulo.";

            pagesPanel.style.display =
                "block";

            return;

        }

        loadChapterPages(
            Number(chapterId)
        );

    }
);


pagesListChapter.addEventListener(
    "change",
    () => {

        const chapterId =
            pagesListChapter.value;

        if (chapterId) {

            synchronizeChapterSelection(
                Number(chapterId)
            );

        }

    }
);


pageChapter.addEventListener(
    "change",
    () => {

        if (pageChapter.value) {

            synchronizeChapterSelection(
                Number(pageChapter.value)
            );

        }

    }
);


bulkPageChapter.addEventListener(
    "change",
    () => {

        if (bulkPageChapter.value) {

            synchronizeChapterSelection(
                Number(bulkPageChapter.value)
            );

        }

    }
);


refreshPagesButton.addEventListener(
    "click",
    refreshSelectedChapterPages
);


loadPageChapters();
