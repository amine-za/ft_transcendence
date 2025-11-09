import { changeLanguage } from "../assets/js/script.js";
import {getCookie} from "./func.js";
class verify extends HTMLElement{
    connectedCallback(){
        this.innerHTML = `
            <div class="game-content">
                <div class="login-container">
                    <h1 class="login-title" data-i18n="Confirm"></h1>
                    <form action="#" method="POST" class="login-form">
                        <div class="form-group">
                            <label for="otp" data-i18n="one time password"></label>
                            <input type="text" id="otp" name="otp" required>
                        </div>
                        <div class="form-group">
                            <h3><a type="submit" class="login-btn" id="log" data-i18n="Confirm"></a></h3>
                        </div>
                        <div class="form-group">
                        </div>
                    </form>
                </div>
            </div>
        `;
        changeLanguage(localStorage.getItem('preferredLanguage') || 'en');
        let otp = document.getElementById("otp");
        let submitBuuton = document.getElementById("log");
        submitBuuton.addEventListener('click', async function(event)
        {
            console.log(otp.value);
            event.preventDefault();
            if (otp.value == "")
            {
                alert("please fill all fields");
                return;
            }
            const res = await fetch("/confirm/", 
            {
                method: "POST",
                headers:
                {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify
                ({
                    otp: otp.value,
                    username: getCookie('username'),
                })
            });
            if (res.ok) 
            {
                const data = await res.json();
                // Backend already sets access_token and refresh_token cookies
                document.cookie = `username=${data.username}; path=/; SameSite=None; Secure`;
                document.cookie = `language=${data.language}; path=/; Secure; SameSite=Lax`;
                window.location.hash = "#dashboard";
            } 
            else 
            {
                return res.json().then(data => 
                {
                    alert(data.detail);
                });
            }
        })
    }
}
customElements.define('verify-component', verify);