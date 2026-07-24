// =========================================
// ADMIN - RECUPERAÇÃO DE SENHA
// =========================================

const passwordRecoveryList =
    document.getElementById(
        "password-recovery-list"
    );

const refreshPasswordRecoveryButton =
    document.getElementById(
        "refresh-password-recovery-button"
    );


async function loadPasswordRecoveryRequests() {

    passwordRecoveryList.innerHTML =
        "Carregando solicitações...";

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/password-recovery-requests`
            );

        const data =
            await readAdminResponse(response);

        if (
            !data.success
            || !Array.isArray(data.requests)
        ) {

            passwordRecoveryList.innerHTML =
                data.message
                || "Não foi possível carregar as solicitações.";

            return;

        }

        if (data.requests.length === 0) {

            passwordRecoveryList.innerHTML =
                "Nenhuma solicitação de recuperação cadastrada.";

            return;

        }

        const orderedRequests =
            [...data.requests].sort(
                (
                    firstRequest,
                    secondRequest
                ) => {

                    if (
                        firstRequest.status === "pending"
                        && secondRequest.status !== "pending"
                    ) {
                        return -1;
                    }

                    if (
                        firstRequest.status !== "pending"
                        && secondRequest.status === "pending"
                    ) {
                        return 1;
                    }

                    return (
                        Number(secondRequest.id)
                        - Number(firstRequest.id)
                    );

                }
            );

        passwordRecoveryList.innerHTML =
            "";

        orderedRequests.forEach(
            (request) => {

                const item =
                    document.createElement("div");

                item.className =
                    request.status === "pending"
                        ? "user-item user-item-blocked"
                        : "user-item";

                const status =
                    request.status === "pending"
                        ? "Pendente"
                        : "Resolvida";

                const resolveButton =
                    request.status === "pending"
                        ? `
                            <button
                                type="button"
                                class="admin-small-button password-recovery-resolve-button"
                            >
                                MARCAR COMO RESOLVIDA
                            </button>
                        `
                        : "";

                item.innerHTML = `
                    <div class="user-item-main">

                        <strong>
                            ${escapeHTML(request.email)}
                        </strong>

                        <span>
                            Telefone:
                            ${escapeHTML(
                                request.telefone
                                || "Não informado"
                            )}
                        </span>

                    </div>

                    <div class="user-item-meta">

                        <small>
                            Status:
                            ${escapeHTML(status)}
                        </small>

                        <small>
                            ID:
                            ${escapeHTML(request.id)}
                        </small>

                        <small>
                            Criada em:
                            ${escapeHTML(
                                request.created_at
                                || "Não informado"
                            )}
                        </small>

                        <small>
                            Resolvida em:
                            ${escapeHTML(
                                request.resolved_at
                                || "Não resolvida"
                            )}
                        </small>

                    </div>

                    <div class="user-item-actions">
                        ${resolveButton}
                    </div>
                `;

                const resolveButtonElement =
                    item.querySelector(
                        ".password-recovery-resolve-button"
                    );

                if (resolveButtonElement) {

                    resolveButtonElement.addEventListener(
                        "click",
                        () => {

                            resolvePasswordRecoveryRequest(
                                request.id
                            );

                        }
                    );

                }

                passwordRecoveryList.appendChild(
                    item
                );

            }
        );

    } catch (error) {

        passwordRecoveryList.innerHTML =
            "Erro ao conectar com o backend.";

    }

}


async function resolvePasswordRecoveryRequest(
    requestId
) {

    const confirmed =
        confirm(
            "Deseja marcar esta solicitação "
            + "de recuperação como resolvida?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await adminFetch(
                `${API_URL}/admin/password-recovery-requests/${requestId}/resolve`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: "resolved"
                    })
                }
            );

        const data =
            await readAdminResponse(response);

        alert(
            data.message
            || "Solicitação atualizada."
        );

        if (data.success) {

            loadPasswordRecoveryRequests();

        }

    } catch (error) {

        alert(
            "Erro ao atualizar solicitação de recuperação."
        );

    }

}


refreshPasswordRecoveryButton.addEventListener(
    "click",
    loadPasswordRecoveryRequests
);


loadPasswordRecoveryRequests();
