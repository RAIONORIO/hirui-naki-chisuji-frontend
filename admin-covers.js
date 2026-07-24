// =========================================
// ADMIN - CAPAS DOS CAPÍTULOS
// =========================================

const coverForm =
    document.getElementById("cover-form");

const coverMessage =
    document.getElementById("cover-message");

const coverChapter =
    document.getElementById("cover-chapter");

const coverList =
    document.getElementById("cover-list");

const refreshCoversButton =
    document.getElementById("refresh-covers-button");

let coverChaptersCache = [];


function fillCoverChapterSelect() {

    coverChapter.innerHTML = `
        <option value="">
            Selecione o capítulo
        </option>
    `;

    coverChaptersCache.forEach((chapter) => {

        const option =
            document.createElement("option");

        option.value =
            chapter.id;

        option.textContent =
            `Capítulo ${chapter.number} - ${chapter.title}`;

        coverChapter.appendChild(
            option
        );

    });

}


function renderCoverList() {

    if (coverChaptersCache.length === 0) {

        coverList.innerHTML = `
            <div class="admin-empty-state">
                Nenhum capítulo cadastrado ainda.
            </div>
        `;

        return;

    }

    coverList.innerHTML =
        "";

    coverChaptersCache.forEach((chapter) => {

        const item =
            document.createElement("div");

        item.className =
            "admin-cover-item";

        const coverUrl =
            normalizeBackendAssetUrl(
                chapter.cover_image
            );

        const preview =
            coverUrl
                ? `
                    <div class="chapter-cover-preview">
                        <img
                            src="${escapeHTML(coverUrl)}"
                            alt="Capa do capítulo ${escapeHTML(chapter.number)}"
                        >
                    </div>
                `
                : `
                    <div class="chapter-cover-preview chapter-cover-placeholder">
                        SEM CAPA
                    </div>
                `;

        const openButton =
            coverUrl
                ? `
                    <a
                        href="${escapeHTML(coverUrl)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="admin-small-button admin-link-button"
                    >
                        ABRIR CAPA
                    </a>
                `
                : "";

        item.innerHTML = `
            ${preview}

            <div class="admin-cover-item-info">

                <strong>
                    Capítulo ${escapeHTML(chapter.number)}
                    - ${escapeHTML(chapter.title)}
                </strong>

                <span>
                    ${coverUrl
                        ? "Capa cadastrada"
                        : "Nenhuma capa cadastrada"}
                </span>

                <small>
                    Status:
                    ${chapter.is_published
                        ? "Publicado"
                        : "Oculto"}
                </small>

            </div>

            <div class="admin-cover-item-actions">

                ${openButton}

                <button
                    type="button"
                    class="admin-small-button cover-select-button"
                >
                    SELECIONAR
                </button>

            </div>
        `;

        item.querySelector(
            ".cover-select-button"
        ).addEventListener(
            "click",
            () => {

                coverChapter.value =
                    String(chapter.id);

                coverForm.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

        coverList.appendChild(
            item
        );

    });

}


async function loadCovers() {

    coverList.innerHTML =
        "Carregando capas...";

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/chapters`
            );

        const data =
            await readAdminResponse(response);

        if (!data.success) {

            coverList.innerHTML =
                data.message
                || "Não foi possível carregar os capítulos.";

            return;

        }

        coverChaptersCache =
            data.chapters || [];

        fillCoverChapterSelect();

        renderCoverList();

    } catch (error) {

        coverList.innerHTML =
            "Erro ao conectar com o backend.";

    }

}


coverForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        coverMessage.textContent =
            "Enviando capa...";

        const chapterId =
            coverChapter.value;

        const cover =
            document.getElementById(
                "cover-image"
            ).files[0];

        if (
            !chapterId
            || !cover
        ) {

            coverMessage.textContent =
                "Selecione o capítulo e a imagem da capa.";

            return;

        }

        const formData =
            new FormData();

        formData.append(
            "cover",
            cover
        );

        try {

            const response =
                await adminFetch(
                    `${API_URL}/admin/chapters/${chapterId}/cover/upload`,
                    {
                        method: "POST",
                        body: formData
                    }
                );

            const data =
                await readAdminResponse(response);

            coverMessage.textContent =
                data.message
                || "Operação concluída.";

            if (data.success) {

                coverForm.reset();

                await loadCovers();

            }

        } catch (error) {

            coverMessage.textContent =
                "Erro ao enviar capa.";

        }

    }
);


refreshCoversButton.addEventListener(
    "click",
    loadCovers
);


loadCovers();
