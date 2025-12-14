import { changeLanguage } from "../assets/js/script.js";
class signin extends HTMLElement{
    connectedCallback(){

        this.innerHTML = `
        <div class="game-content">
            <div class="login-container">
                <h1 class="login-title" data-i18n="Login"></h1>
                <form action="#" method="POST" class="login-form">
                    <div class="form-group">
                        <label for="username" data-i18n="Username"></label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password" data-i18n="Password"></label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <div class="form-group">
                        <h3><a type="submit" class="login-btn" id="log" data-i18n="Login"></a></h3>
                    </div>
                    <div class="form-group">
                        <h3><a type="submit" class="login-btn" id="intra" data-i18n="intra login"></a></h3>
                    </div>
                    <p style="margin-top: 1.5em;">
                        <span class="login-link" data-i18n="Create an account"></span>
                        <a href="#signup" style="color:#4CAF50;" data-i18n="SignUp"></a>
                    </p>
                </form>
            </div>
        </div>
        `;
        changeLanguage(localStorage.getItem('preferredLanguage') || 'en');
        let user = document.getElementById("username");
        let pass = document.getElementById("password");
        let submitBuuton = document.getElementById("log");
        let intraButton = document.getElementById("intra");
        
        submitBuuton.addEventListener('click', async function(event)
        {
            event.preventDefault();
            if (user.value == "" || pass.value == "")
            {
                alert("please fill all fields");
                return;
            }

            const res = await fetch("/login/", 
            {
                method: "POST",
                headers:
                {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify
                ({
                    username: user.value, 
                    password: pass.value,
                })
            });
            
            if (res.ok) 
            {
                const data = await res.json();
                document.cookie = `username=${user.value}; path=/; SameSite=None; Secure`;
                
                if (data.requires_2fa) 
                {
                    changeLanguage(data.language || 'en');
                    window.location.hash = "#verify";
                } 
                else 
                {
                    // Backend already sets access_token and refresh_token cookies
                    document.cookie = `language=${data.language}; path=/; Secure; SameSite=Lax`;
                    changeLanguage(data.language);
                    window.location.hash = "#dashboard";
                }
            } 
            else 
            {
                return res.json().then(data => 
                {
                    alert(data.detail);
                });
            }
        })
        intraButton.addEventListener('click', async function(event) {
            event.preventDefault();
            window.location.href = "/login42/";
        });
    }
}
customElements.define('signin-component', signin);