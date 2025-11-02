import { CheckAuthenticated } from "./func.js";
import { getCookie} from "./func.js";
import { changeLanguage } from "../assets/js/script.js";
import { deleteCookie } from "./func.js";

class dashboard extends HTMLElement
{
    async connectedCallback()
    {
        const username = getCookie('username') || 'Guest';

        const res = await fetch("/get2fa/",
        {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username
            })
        })
        const fda = await res.json();
        let fa = false;
        if (fda.fact === "t")
            fa = true;
        console.log("2fa = ", fa, fda.fact);

        this.innerHTML = `
            <!-- Navbar -->
            <nav class="navbar navbar-expand-lg navbar-dark fixed-top" style="background-color: #000000; padding: 15px 20px;">
                <div class="container-fluid">
                    <a class="navbar-brand" href="#" style="color: rgb(255, 254, 254);">Ping Pong</a>
                    <button
                        class="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                        aria-controls="navbarNav"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto align-items-center">
                            <li class="nav-item me-3">
                                <span class="navbar-text text-white fw-bold">${username}</span>
                            </li>
                            <li class="nav-item me-3">
                                <button class="btn btn-sm btn-outline-light" id="2fa">
                                    ${fa ? '2FA Enabled' : '2FA Disabled'}
                                </button>
                            </li>
                            <li class="nav-item dropdown me-3">
                                <button class="btn btn-sm btn-outline-light dropdown-toggle" 
                                        id="languageDropdown" 
                                        data-bs-toggle="dropdown" 
                                        aria-expanded="false">
                                    Language
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="languageDropdown">
                                    <li><a class="dropdown-item" href="#" id="English">English (EN)</a></li>
                                    <li><a class="dropdown-item" href="#" id="Arabic">العربية (AR)</a></li>
                                    <li><a class="dropdown-item" href="#" id="Spanish">Español (ES)</a></li>
                                    <li><a class="dropdown-item" href="#" id="Japanese">日本語 (JP)</a></li>
                                    <li><a class="dropdown-item" href="#" id="Tamazight">Tamazight (TMZ)</a></li>
                                </ul>
                            </li>
                            <li class="nav-item">
                                <button class="btn btn-sm btn-danger" id="log" data-i18n="Logout">Logout</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <div class="main-container">
                <div class="dashboard">
                    <div class="elements">
                        <a href="#multiplayer" class="btn" data-i18n="Multiplayer">Multiplayer</a>
                        <a href="#tournament" class="btn" data-i18n="Pong Tournament">Pong Tournament</a>
                        <a href="#pong" class="btn" data-i18n="Play Pong">Play Pong</a>  
                        <a href="#ai" class="btn" data-i18n="AI Mode">AI Mode</a>
                    </div>
                </div>
            </div>
        `;

        changeLanguage(localStorage.getItem('preferredLanguage') || 'en');
        await CheckAuthenticated();

        let submitBuuton = document.getElementById("log");
        let english = document.getElementById("English");
        let arabic = document.getElementById("Arabic");
        let spanish = document.getElementById("Spanish");
        let japanese = document.getElementById("Japanese");
        let tamazight = document.getElementById("Tamazight");
        let faButton = document.getElementById("2fa");

        // Language change handlers
        const languages = [
            { element: english, code: 'en' },
            { element: arabic, code: 'ar' },
            { element: spanish, code: 'es' },
            { element: japanese, code: 'jap' },
            { element: tamazight, code: 'tmz' }
        ];

        languages.forEach(({ element, code }) => {
            element.addEventListener('click', async function(event) {
                event.preventDefault();
                
                const res = await fetch("/lang/", {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        language: code
                    })
                });
                
                document.cookie = `language=${code}; path=/; Secure; SameSite=Lax`;
                changeLanguage(code);
            });
        });

        let lang = getCookie('language');
        if (lang) {
            changeLanguage(lang);
        }

        // 2FA toggle handler
        faButton.addEventListener('click', async function(event) {
            event.preventDefault();
            fa = !fa;

            let c = fa ? "t" : "f";
            faButton.innerHTML = fa ? '2FA Enabled' : '2FA Disabled';

            const res = await fetch("/set2fa/", {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    fact: c
                })
            });
        });

        // Logout handler
        submitBuuton.addEventListener('click', async function(event) {
            event.preventDefault();
            
            const res = await fetch("/logout/", {
                method: "POST",
            }).then(response => {
                if (response.ok) {
                    deleteCookie('access');
                    deleteCookie('refresh');
                    deleteCookie('username');
                    deleteCookie('language');
                    localStorage.clear();
                    window.location.hash = "#signin";
                } else {
                    throw new Error("Logout failed");
                }
            })
            .catch(error => {
                console.error(error);
            });
        });
    }

    clearTournamentData() {
        localStorage.removeItem('pongTournamentState');
        localStorage.removeItem('pongTournamentMode');
        localStorage.removeItem('pongPlayer1Name');
        localStorage.removeItem('pongPlayer2Name');
    }
}

customElements.define('dashboard-component', dashboard);