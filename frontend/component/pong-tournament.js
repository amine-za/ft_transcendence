import { changeLanguage } from "../assets/js/script.js";
import { getCookie} from "./func.js";

class PongTournament extends HTMLElement {
    constructor() {
        super();
        this.players = [];
        this.brackets = [];
        this.currentRound = 0;
        this.currentMatch = null;
    }

    connectedCallback() {
        if (this.loadTournamentState()) {
            this.showCurrentState();
        } else {
            this.showParticipantCountForm();
        }
    }

    showParticipantCountForm() {
        this.innerHTML = `
            <style>
                label {
                    font-size: 1.2em;
                    margin-bottom: 5px;
                    display: inline;
                }
            </style>
            <div class="game-content">
                <div class="login-container">
                    <h2 data-i18n="Pong Tournament Setup">Pong Tournament Setup</h2>
                    <form id="participantCountForm">
                        <label for="participantCount" data-i18n="Number of Participants">Number of Participants</label>
                        <input type="number" id="participantCount" min="2" max="8" required>
                        <button class="btn" id="registerPlayers" type="submit" data-i18n="Next">Next</button>
                    </form>
                </div>
            </div>
        `;
        changeLanguage(localStorage.getItem('preferredLanguage') || 'en');
        this.querySelector('#participantCountForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const count = parseInt(this.querySelector('#participantCount').value);
            this.showRegistrationForm(count);
        });
    }

    showRegistrationForm(count) {
        let inputs = '';
        for (let i = 1; i <= count; i++) {
            inputs += `<input type="text" id="player${i}" placeholder="Player ${i} Name" required><br>`;
        }
        this.innerHTML = `
            <div class="game-content">
                <div class="tournament-container">
                    <h2 data-i18n="Player Registration">Player Registration</h2>
                    <form id="registrationForm">
                        ${inputs}
                        <button class="btn" id="registerPlayers" type="submit" data-i18n="Start Tournament">Start Tournament</button>
                    </form>
                </div>
            </div>
        `;
        changeLanguage(localStorage.getItem('preferredLanguage') || 'en');
        this.querySelector('#registrationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.players = Array.from({ length: count }, (_, i) => this.querySelector(`#player${i+1}`).value.trim());
            this.startTournament();
        });
    }

    startTournament() {
        localStorage.removeItem('previousWinner'); 
        this.brackets = [this.createInitialBracket(this.players)];
        this.currentRound = 0;
        this.saveTournamentState();
        this.playNextMatch();
    }

    createInitialBracket(players) {
        const shuffled = players.sort(() => 0.5 - Math.random());
        const bracket = [];
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                bracket.push([shuffled[i], shuffled[i + 1]]);
            } else {
                bracket.push([shuffled[i]]);
            }
        }
        return bracket;
    }

    playNextMatch() {
        if (this.brackets[this.currentRound].every(match => match.length === 1)) {
            if (this.brackets[this.currentRound].length === 1) {
                this.declareTournamentWinner(this.brackets[this.currentRound][0][0]);
                return;
            }
            this.currentRound++;
            this.brackets[this.currentRound] = this.createNextRoundBracket(this.brackets[this.currentRound - 1]);
        }
      
        this.currentMatch = this.brackets[this.currentRound].find(match => match.length === 2);
        if (this.currentMatch) {
            this.showMatchmaking(this.currentMatch[0], this.currentMatch[1]);
        } else {
            this.playNextMatch();
        }
    }
      
    createNextRoundBracket(previousRound) {
        const winners = previousRound.filter(match => match.length === 1).map(match => match[0]);
        const nextRound = [];
        for (let i = 0; i < winners.length; i += 2) {
            if (i + 1 < winners.length) {
                nextRound.push([winners[i], winners[i + 1]]);
            } else {
                nextRound.push([winners[i]]);
            }
        }
        return nextRound;
    }

    showMatchmaking(player1, player2) {
        const previousWinner = localStorage.getItem('previousWinner');
        this.innerHTML = `
            <style>
                .form-group p {
                    font-size: 2em;
                    font-weight: bold;
                    text-align: center;
                    color: #ffffff;
                    background: rgba(0, 0, 0, 0.5);
                    padding: 10px;
                    border-radius: 8px;
                    margin: 10px 0;
                }
                .previous-winner {
                    font-size: 1.5em;
                    font-weight: bold;
                    text-align: center;
                    color: #ffd700;
                    background: rgba(50, 50, 50, 0.8);
                    padding: 10px;
                    border: 2px solid #ffd700;
                    border-radius: 8px;
                    margin-top: 15px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
                }
            </style>
            <div class="game-content">
                <div class="login-container">
                    <h2 data-i18n="Next Match">Next Match</h2>
                    <div class="form-group">
                        <p>${player1} vs ${player2}</p>
                        ${previousWinner ? `<div class="previous-winner">
                        <span data-i18n="Last Winner: ">Last Winner: </span>
                        <span>${previousWinner}</span></div>` : ''}
                    </div>
                    <button class="btn" id="startMatch" data-i18n="Start Match">Start Match</button>
                </div>
            </div>
        `;
        changeLanguage(localStorage.getItem('preferredLanguage') || 'en');
        this.querySelector('#startMatch').addEventListener('click', () => this.startMatch(player1, player2));
    }

    startMatch(player1, player2) {
        localStorage.setItem('pongPlayer1Name', String(player1));
        localStorage.setItem('pongPlayer2Name', String(player2));
        localStorage.setItem('pongTournamentMode', 'true');
        window.location.hash = '#pong';

        window.addEventListener('pongGameEnd', this.onMatchEnd.bind(this), { once: true });
    }

    onMatchEnd(event) {
        const winner = event.detail;
    
        localStorage.setItem('previousWinner', winner);
    
        this.brackets[this.currentRound] = this.brackets[this.currentRound].map(match => 
            match.includes(this.currentMatch[0]) || match.includes(this.currentMatch[1]) ? [winner] : match
        );
        this.currentMatch = null;
        this.saveTournamentState();
        this.showMatchResult(winner);
    }

    showMatchResult(winner) {
        this.innerHTML = `
            <div class="game-content">
                <div class="login-container">
                    <h2 data-i18n="Match Result">Match Result</h2>
                    <span class="word">${winner}</span>
                    <span class="word" data-i18n=" wins the match!"> wins the match!</span><br>
                    <button class="btn" id="nextMatch" data-i18n="Next Match">Next Match</button>
                </div>
            </div>
        `;
        changeLanguage(localStorage.getItem('preferredLanguage') || 'en');
        this.querySelector('#nextMatch').addEventListener('click', () => this.playNextMatch());
    }

    declareTournamentWinner(winner) {
        this.innerHTML = `
            <style>
                .login-container {
                    text-align: center;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 40px;
                    border-radius: 10px;
                    max-width: 500px;
                }

                .login-container h2 {
                    font-size: 2em;
                    margin-bottom: 20px;
                    color: #ffffff;
                }

                .login-container .word {
                    font-size: 1.6em;
                    font-weight: bold;
                    color: #ffd700;
                    margin: 10px 0;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    display: inline-block;
                }    
            </style>
            <div class="game-content">
                <div class="login-container">
                    <h2 class="login-title" data-i18n="Tournament Ended">Tournament Ended</h2>
                    <div class="word">${winner}</div>
                    <div class="word" data-i18n=" is the tournament champion!"> is the tournament champion!</div>
                    <button class="btn" id="newTournament" data-i18n="Start New Tournament">Start New Tournament</button>
                    <button class="btn" id="returnToDashboard" data-i18n="Return to Dashboard">Return to Dashboard</button>
                </div>
            </div>
        `;
        changeLanguage(localStorage.getItem('preferredLanguage') || 'en');
        this.querySelector('#newTournament').addEventListener('click', () => {
            this.clearTournamentState();
            this.showParticipantCountForm();
        });
        this.querySelector('#returnToDashboard').addEventListener('click', () => {
            this.clearTournamentState();
            window.location.hash = '#dashboard';
        });
    }

    saveTournamentState() {
        const state = {
            players: this.players,
            brackets: this.brackets,
            currentRound: this.currentRound,
            currentMatch: this.currentMatch
        };
        localStorage.setItem('pongTournamentState', JSON.stringify(state));
    }

    loadTournamentState() {
        const savedState = localStorage.getItem('pongTournamentState');
        if (savedState) {
            const state = JSON.parse(savedState);
            Object.assign(this, state);
            return true;
        }
        return false;
    }

    clearTournamentState() {
        localStorage.removeItem('pongTournamentState');
        localStorage.removeItem('pongTournamentMode');
        localStorage.removeItem('pongPlayer1Name');
        localStorage.removeItem('pongPlayer2Name');
        localStorage.removeItem('previousWinner');
    }

    showCurrentState() {
        if (this.currentMatch) {
            this.showMatchmaking(this.currentMatch[0], this.currentMatch[1]);
        } else {
            this.playNextMatch();
        }
    }
}

customElements.define('pong-tournament', PongTournament);