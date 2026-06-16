let currentPage = 1;

const mangaImage = document.getElementById("manga-image");

const hiddenFragment = document.getElementById("hidden-fragment");

const hiddenFragmentLink = document.getElementById("hidden-fragment-link");

/* =========================================
   USUÁRIO LOGADO
========================================= */

const loggedUser =
    JSON.parse(localStorage.getItem("hiruiUser"));

/* =========================================
   CAPÍTULO ATUAL VIA HASH
========================================= */

const hash = window.location.hash.replace("#", "");

const params = new URLSearchParams(hash);

const currentChapter =
    params.get("cap") !== null
    ? Number(params.get("cap"))
    : 1;
    if(params.get("page") !== null){

    currentPage =
        Number(params.get("page"));

}

/* =========================================
   CONTROLAR FRAGMENTO OCULTO
========================================= */

function controlHiddenFragment(){

    if(!hiddenFragment){
        return;
    }

    hiddenFragment.style.display = "none";

    if(currentChapter === 1 && currentPage === 6){

        hiddenFragment.style.display = "flex";

    }

}


async function unlockHiddenFragment(){

    if(!loggedUser){

        window.location.href = "login.html";

        return;

    }

    try{

        await fetch(

            "http://127.0.0.1:8000/unlocks",

            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    user_id:loggedUser.id,

                    unlock_type:"chapter",

                    unlock_key:"cap0"

                })

            }

        );

    }catch(error){

        console.log(
            "Erro ao desbloquear Fragmento Oculto:",
            error
        );

    }

    window.location.href = "reader.html#cap=0&page=1";

}


if(hiddenFragmentLink){

    hiddenFragmentLink.addEventListener(
        "click",
        function(event){

            event.preventDefault();

            unlockHiddenFragment();

        }
    );

}

/* =========================================
   SALVAR PROGRESSO DE LEITURA
========================================= */

async function saveReadingProgress(){

    if(!loggedUser || !mangaImage){
        return;
    }

    try{

        await fetch(

            "http://127.0.0.1:8000/reading-progress",

            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    user_id:loggedUser.id,

                    chapter:currentChapter,

                    page:currentPage

                })

            }

        );

        unlockNextChapterIfNeeded();

    }catch(error){

        console.log(
            "Erro ao salvar progresso:",
            error
        );

    }

}
/* =========================================
   DESBLOQUEAR PRÓXIMO CAPÍTULO AUTOMATICAMENTE
========================================= */
async function unlockNextChapterIfNeeded(){

    if(!loggedUser){
        return;
    }

    const lastPages = {
        1: 38,
        2: 40,
        3: 23,
        4: 19,
        5: 1
    };

    const lastPageOfCurrentChapter =
        lastPages[currentChapter];

    if(!lastPageOfCurrentChapter){
        return;
    }

    if(currentPage < lastPageOfCurrentChapter){
        return;
    }

    const nextChapter =
        currentChapter + 1;

    try{

        await fetch(

            "http://127.0.0.1:8000/unlocks",

            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    user_id:loggedUser.id,

                    unlock_type:"chapter",

                    unlock_key:`cap${nextChapter}`

                })

            }

        );

        const rewardResponse = await fetch(

            `http://127.0.0.1:8000/users/${loggedUser.id}/chapters/${currentChapter}/finish`,

            {

                method:"POST"

            }

        );

        const rewardData =
            await rewardResponse.json();

        if(
            rewardData.success
            &&
            rewardData.unlocked_outfits
            &&
            rewardData.unlocked_outfits.length > 0
        ){

            const outfitNames =
                rewardData.unlocked_outfits
                .map((outfit) => outfit.name)
                .join(", ");

            alert(
                `Nova recompensa desbloqueada: ${outfitNames}`
            );

        }

        console.log(
            `Capítulo ${nextChapter} desbloqueado.`
        );

    }catch(error){

        console.log(
            "Erro ao desbloquear recompensas do capítulo:",
            error
        );

    }

}
/* =========================================
   CARREGAR PÁGINA
========================================= */

async function loadPage(page){

    try{

        const response = await fetch(
            `http://127.0.0.1:8000/chapter/${currentChapter}/page/${page}`
        );

        if(!response.ok){

            throw new Error("Página não encontrada");

        }

        const data = await response.json();

        const testImage = new Image();

        testImage.onload = function(){

            mangaImage.style.display = "block";

            const finishedBox =
                document.getElementById(
                    "chapter-finished"
                );

            if(finishedBox){

                finishedBox.classList.remove(
                    "active"
                );

            }

            mangaImage.src =
                data.image + `?v=${Date.now()}`;

            controlHiddenFragment();

            saveReadingProgress();

            window.scrollTo({

                top:0,

                behavior:"smooth"

            });

        };

        testImage.onerror = function(){

            showChapterFinished();

        };

        testImage.src =
            data.image + `?v=${Date.now()}`;

    }catch(error){

        showChapterFinished();

    }

}
function showChapterFinished(){

    const finishedBox =
        document.getElementById(
            "chapter-finished"
        );

    if(!finishedBox){
        return;
    }

    mangaImage.style.display =
        "none";

    finishedBox.classList.add(
        "active"
    );

    const nextChapterBtn =
        document.getElementById(
            "next-chapter-btn"
        );

    if(nextChapterBtn){

        nextChapterBtn.onclick =
        function(){

            const nextChapter =
                currentChapter + 1;

            window.location.href =
                `reader.html#cap=${nextChapter}`;

        };

    }

}

/* =========================================
   PRÓXIMA PÁGINA
========================================= */

function nextPage(){

    currentPage++;

    loadPage(currentPage);

}

/* =========================================
   PÁGINA ANTERIOR
========================================= */

function prevPage(){

    if(currentPage > 1){

        currentPage--;

        loadPage(currentPage);

    }

}

/* =========================================
   INICIAR LEITOR
========================================= */

async function canAccessCurrentChapter(){

    if(!loggedUser){

        return false;

    }

    if(currentChapter !== 0){

        return true;

    }

    try{

        const response = await fetch(
            `http://127.0.0.1:8000/unlocks/${loggedUser.id}`
        );

        const data = await response.json();

        if(!data.success){

            return false;

        }

        const unlockedKeys =
            data.unlocks
            .filter(unlock => unlock.unlock_type === "chapter")
            .map(unlock => unlock.unlock_key.trim());

        return unlockedKeys.includes("cap0");

    }catch(error){

        console.log(
            "Erro ao validar acesso ao Fragmento Oculto:",
            error
        );

        return false;

    }

}


async function startReader(){

    const canAccess =
        await canAccessCurrentChapter();

    if(!canAccess){

        alert("Este fragmento ainda está oculto.");

        window.location.href = "chapters.html";

        return;

    }

    loadPage(currentPage);

}


if(mangaImage){

    startReader();

}

/* =========================================
   MENU MOBILE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const menuToggle =
            document.getElementById("menu-toggle");

        const navMenu =
            document.getElementById("nav-menu");

        if(menuToggle && navMenu){

            menuToggle.addEventListener(
                "click",
                () => {

                    navMenu.classList.toggle(
                        "active"
                    );

                }
            );

        }

    }
);

/* =========================================
   CADASTRO DE USUÁRIO
========================================= */

const registerForm =
    document.getElementById("register-form");

if(registerForm){

    registerForm.addEventListener(
        "submit",
        async function(event){

            event.preventDefault();

            const nome =
                document.getElementById("nome").value;

            const apelido =
                document.getElementById("apelido").value;

            const email =
                document.getElementById("email").value;

            const telefone =
                document.getElementById("telefone").value;

            const senha =
                document.getElementById("senha").value;

            const confirmarSenha =
                document.getElementById("confirmar-senha").value;

            const message =
                document.getElementById("register-message");

            if(senha !== confirmarSenha){

                message.innerHTML =
                    "As senhas não coincidem.";

                return;

            }

            try{

                const response = await fetch(

                    "http://127.0.0.1:8000/users",

                    {

                        method:"POST",

                        headers:{
                            "Content-Type":"application/json"
                        },

                        body:JSON.stringify({

                            nome,
                            apelido,
                            email,
                            telefone,
                            senha

                        })

                    }

                );

                const data =
                    await response.json();

                message.innerHTML =
                    data.message;

                if(data.success){

                    setTimeout(() => {

                        window.location.href =
                            "login.html";

                    },2000);

                }

            }catch(error){

                message.innerHTML =
                    "Erro ao cadastrar usuário.";

            }

        }
    );

}

/* =========================================
   LOGIN
========================================= */

const loginForm =
    document.getElementById("login-form");

if(loginForm){

    loginForm.addEventListener(
        "submit",
        async function(event){

            event.preventDefault();

            const email =
                document.getElementById("login-email").value;

            const senha =
                document.getElementById("login-password").value;

            const message =
                document.getElementById("login-message");

            try{

                const response = await fetch(

                    "http://127.0.0.1:8000/login",

                    {

                        method:"POST",

                        headers:{
                            "Content-Type":"application/json"
                        },

                        body:JSON.stringify({

                            email,
                            senha

                        })

                    }

                );

                const data =
                    await response.json();

                message.innerHTML =
                    data.message;

                if(data.success){

                    localStorage.setItem(

                        "hiruiUser",

                        JSON.stringify(
                            data.user
                        )

                    );

                    setTimeout(() => {

                        window.location.href =
                            "index.html";

                    },1500);

                }

            }catch(error){

                message.innerHTML =
                    "Erro ao realizar login.";

            }

        }
    );

}

/* =========================================
   RECUPERAÇÃO DE SENHA
========================================= */

const showRecoveryFormButton =
    document.getElementById("show-recovery-form");

const passwordRecoveryForm =
    document.getElementById("password-recovery-form");

const passwordRecoveryMessage =
    document.getElementById("password-recovery-message");

if (showRecoveryFormButton && passwordRecoveryForm) {

    showRecoveryFormButton.addEventListener(
        "click",
        function () {

            const isHidden =
                passwordRecoveryForm.style.display === "none"
                ||
                passwordRecoveryForm.style.display === "";

            passwordRecoveryForm.style.display =
                isHidden ? "grid" : "none";

        }
    );

}

if (passwordRecoveryForm) {

    passwordRecoveryForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                document.getElementById("recovery-email").value;

            const telefone =
                document.getElementById("recovery-phone").value;

            if (passwordRecoveryMessage) {

                passwordRecoveryMessage.innerHTML =
                    "Enviando solicitação...";

            }

            try {

                const response = await fetch(

                    "http://127.0.0.1:8000/password-recovery/request",

                    {

                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({

                            email,
                            telefone

                        })

                    }

                );

                const data =
                    await response.json();

                if (passwordRecoveryMessage) {

                    passwordRecoveryMessage.innerHTML =
                        data.message || "Solicitação enviada.";

                }

                if (data.success) {

                    passwordRecoveryForm.reset();

                }

            } catch (error) {

                if (passwordRecoveryMessage) {

                    passwordRecoveryMessage.innerHTML =
                        "Erro ao enviar solicitação de recuperação.";

                }

            }

        }
    );

}

/* =========================================
   MOSTRAR USUÁRIO LOGADO NO MENU
========================================= */

const navMenu =
    document.getElementById("nav-menu");

if(loggedUser && navMenu){

    const loginLink =
        navMenu.querySelector('a[href="login.html"]');

    if(loginLink){

        loginLink.innerHTML =
            `${loggedUser.apelido} ▼`;

        loginLink.href =
            "#";

        loginLink.classList.add("logged-user-link");

        const dropdown = document.createElement("div");

        dropdown.className =
            "user-dropdown";

        dropdown.innerHTML = `

    <a href="profile.html" id="profile-btn">

        Perfil

    </a>

    <a href="#" id="logout-btn">

        Sair

    </a>

`;

        loginLink.parentElement.style.position =
            "relative";

        loginLink.parentElement.appendChild(
            dropdown
        );

        loginLink.addEventListener(
            "click",
            function(event){

                event.preventDefault();

                dropdown.classList.toggle(
                    "active"
                );

            }
        );

        document.addEventListener(
            "click",
            function(event){

                if(
                    !loginLink.contains(event.target)
                    &&
                    !dropdown.contains(event.target)
                ){

                    dropdown.classList.remove(
                        "active"
                    );

                }

            }
        );

        const logoutBtn =
            document.getElementById(
                "logout-btn"
            );

        logoutBtn.addEventListener(
            "click",
            function(event){

                event.preventDefault();

                localStorage.removeItem(
                    "hiruiUser"
                );

                window.location.reload();

            }
        );

    }

}
/* =========================================
   CONTINUAR LEITURA NA HOME
========================================= */

const continueSection =
    document.getElementById("continue-reading-section");

const continueTitle =
    document.getElementById("continue-reading-title");

const continueInfo =
    document.getElementById("continue-reading-info");

const continueButton =
    document.getElementById("continue-reading-btn");

async function loadReadingProgressHome(){

    if(!loggedUser || !continueSection){
        return;
    }

    try{

        const response = await fetch(
            `http://127.0.0.1:8000/reading-progress/${loggedUser.id}`
        );

        const data = await response.json();

        if(!data.success){
            return;
        }

        const chapter =
            data.progress.chapter;

        const page =
            data.progress.page;

        continueSection.classList.add("active");

        continueTitle.innerHTML =
            `Capítulo ${chapter}`;

        continueInfo.innerHTML =
            `Você parou na página ${page}.`;

        continueButton.onclick = function(){

            window.location.href =
                `reader.html#cap=${chapter}&page=${page}`;

        };

    }catch(error){

        console.log(
            "Erro ao carregar progresso na Home:",
            error
        );

    }

}

loadReadingProgressHome();
/* =========================================
   PROTEGER PÁGINAS INTERNAS
========================================= */

const protectedPages = [
    "chapters",
    "chapters.html",
    "characters",
    "characters.html",
    "gallery",
    "gallery.html",
    "universo",
    "universo.html",
    "cla",
    "cla.html",
    "reader",
    "reader.html",
    "profile",
    "profile.html"
];

const pagePath =
    window.location.pathname
    .split("/")
    .pop();

const userIsLogged =
    localStorage.getItem("hiruiUser") !== null;

if(
    protectedPages.includes(pagePath)
    &&
    !userIsLogged
){

    window.location.href =
        "login.html";

}/* =========================================
   DESBLOQUEAR CAPÍTULOS PELO BACKEND
========================================= */

const chapterCards =
    document.querySelectorAll(".locked-chapter");

async function loadChapterUnlocks(){

    if(!loggedUser || chapterCards.length === 0){
        return;
    }

    try{

        const response = await fetch(
            `http://127.0.0.1:8000/unlocks/${loggedUser.id}`
        );

        const data = await response.json();

        if(!data.success){
            return;
        }

        const unlockedKeys =
            data.unlocks
            .filter(unlock => unlock.unlock_type === "chapter")
            .map(unlock => unlock.unlock_key.trim());

        chapterCards.forEach(card => {

            const chapterNumber =
                card.getAttribute("data-chapter");

            const chapterKey =
                `cap${chapterNumber}`.trim();

            if(unlockedKeys.includes(chapterKey)){

                const chapterCard =
                    card.querySelector(".chapter-card");

                const lockBadge =
                    card.querySelector(".lock-badge");

                const chapterInfoParagraph =
                    card.querySelector(".chapter-info p");

                card.classList.remove("locked-chapter");

                card.style.cursor =
                    "pointer";

                card.onclick = function(){

                    window.location.href =
                        `reader.html#cap=${chapterNumber}`;

                };

                if(chapterCard){

                    chapterCard.classList.remove("locked");

                }

                if(lockBadge){

                    lockBadge.remove();

                }

                if(chapterInfoParagraph){

                    chapterInfoParagraph.innerHTML =
                        "Disponível para leitura.";

                }

            }

        });

    }catch(error){

        console.log(
            "Erro ao carregar desbloqueios:",
            error
        );

    }

}

loadChapterUnlocks();

// =========================================
// ADMIN ACCESS
// Mostra o link ADMIN apenas para o e-mail autorizado
// =========================================

const HIRUI_ADMIN_EMAIL = "raionorio0204@admin.com";

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

    return user.email.trim().toLowerCase() === HIRUI_ADMIN_EMAIL;

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

    const isAdminPage = currentPage.endsWith("admin.html");

    if (!isAdminPage) {

        return;

    }

    if (!isCurrentUserAdmin()) {

        alert("Acesso restrito ao administrador.");

        window.location.href = "index.html";

    }

}

document.addEventListener("DOMContentLoaded", function () {

    addAdminLinkToNavbar();

    protectAdminPage();

});