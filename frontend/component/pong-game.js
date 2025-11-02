import { getCookie} from "./func.js";
import { changeLanguage } from "../assets/js/script.js";
class PongGame extends HTMLElement {
    constructor() {
        super();
        this.canvas = null;
        this.ctx = null;
        this.ball = { x: 500, y: 250, radius: 10, dx: 8, dy: 8 };
        this.paddle1 = { x: 10, y: 200, width: 10, height: 120 };  
        this.paddle2 = { x: 980, y: 200, width: 10, height: 120 };  
        this.keys = {};
        this.paddleSpeed = 9;
        this.score1 = 0;
        this.score2 = 0;
        this.player1Name = '';
        this.player2Name = '';
        this.gameStarted = false;
        this.tournamentMode = false;
    
        window.onbeforeunload = () => {
            return "Are you sure you want to leave the game?";
        };
    }

    connectedCallback() {
        this.tournamentMode = localStorage.getItem('pongTournamentMode') === 'true';
        if (this.tournamentMode) {
            this.player1Name = String(localStorage.getItem('pongPlayer1Name') || 'Player 1');
            this.player2Name = String(localStorage.getItem('pongPlayer2Name') || 'Player 2');
            this.setupBackButtonHandling();
            this.startGame();
        } else {
            this.showRegistrationPopup();
        }
    }

    setupBackButtonHandling() {
        history.pushState(null, '', location.href);
        window.onpopstate = () => {
            history.pushState(null, '', location.href);
            this.returnToDashboard();
        };
    }

    showRegistrationPopup() {
        this.innerHTML = `
            <div class="game-content">
                <div class="login-container">
                    <h2 data-i18n="Player Registration">Player Registration</h2>
                    <div class="form-group">
                        <label data-i18n="First Player Name">First Player Name</label>
                        <input type="text" id="player1Name">
                        <label data-i18n="Second Player Name">Second Player Name</label>
                        <input type="text" id="player2Name">
                    </div>
                    <button class="btn" id="registerPlayers" data-i18n="Register">Register</button>
                </div>
            </div>
        `;
        changeLanguage(localStorage.getItem('preferredLanguage') || 'en');
        this.querySelector('#registerPlayers').addEventListener('click', this.registerPlayers.bind(this));
    }

    registerPlayers() {
        const player1Input = this.querySelector('#player1Name');
        const player2Input = this.querySelector('#player2Name');
        
        const player1Name = player1Input.value.trim();
        const player2Name = player2Input.value.trim();
        
        if (player1Name === '' || player2Name === '') {
            alert('Both players must enter a name.');
            return;
        }
    
        if (player1Name === player2Name) {
            alert('Player names must be different.');
            return;
        }
    
        this.player1Name = player1Name;
        this.player2Name = player2Name;
    
        localStorage.setItem('pongPlayer1Name', this.player1Name);
        localStorage.setItem('pongPlayer2Name', this.player2Name);
    
        this.showMatchmakingWindow();
    }

    showMatchmakingWindow() {
        this.innerHTML = `
            <div class="game-content">
                <div class="login-container">
                    <div class="popup">
                        <h2 class="signup-title" data-i18n="Matchmaking">Matchmaking</h2>
                        <div class="word">
                            <span data-i18n="Player 1: ">Player 1: </span>
                            <span>${this.player1Name}</span>
                        </div>
                        <div class="word">
                            <span data-i18n="Player 2: ">Player 2: </span>
                            <span>${this.player2Name}</span>
                        </div>
                        <button class="btn" id="startGame" data-i18n="Start Game">Start Game</button>
                    </div>
                </div>
            </div>
        `;
        changeLanguage(localStorage.getItem('preferredLanguage') || 'en');
        this.querySelector('#startGame').addEventListener('click', this.startGame.bind(this));
    }

    startGame() {
        this.innerHTML = `
            <div class="game-content">
                <div id="gameArea">
                    <div class="score-container" id="scoreBoard">
                        <span class="btn" id="player1Score">${this.player1Name}: 0</span> -
                        <span class="btn" id="player2Score">${this.player2Name}: 0</span>
                    </div>
                    <canvas id="pongCanvas" width="1000" height="500"></canvas>
                </div>
            </div>
        `;

        this.canvas = this.querySelector('#pongCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        this.gameStarted = true;
        this.gameLoop();
        if (this.tournamentMode) {
            this.setupBackButtonHandling();
        }
    }

    handleKeyDown(e) {
        this.keys[e.key] = true;
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    update() {
        if (this.keys['w'] && this.paddle1.y > 0) this.paddle1.y -= this.paddleSpeed;
        if (this.keys['s'] && this.paddle1.y < this.canvas.height - this.paddle1.height) this.paddle1.y += this.paddleSpeed;
        if (this.keys['ArrowUp'] && this.paddle2.y > 0) this.paddle2.y -= this.paddleSpeed;
        if (this.keys['ArrowDown'] && this.paddle2.y < this.canvas.height - this.paddle2.height) this.paddle2.y += this.paddleSpeed;

        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        if (this.ball.y - this.ball.radius < 0) {
            this.ball.y = this.ball.radius;
            this.ball.dy *= -1;
        } else if (this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.y = this.canvas.height - this.ball.radius;
            this.ball.dy *= -1;
        }

        if (this.checkPaddleCollision(this.ball, this.paddle1)) {
            this.ball.x = this.paddle1.x + this.paddle1.width + this.ball.radius;
            this.handlePaddleCollision(this.ball, this.paddle1);
        } else if (this.checkPaddleCollision(this.ball, this.paddle2)) {
            this.ball.x = this.paddle2.x - this.ball.radius;
            this.handlePaddleCollision(this.ball, this.paddle2);
        }

        if (this.ball.x < 0) {
            this.score2++;
            this.resetBall();
        } else if (this.ball.x > this.canvas.width) {
            this.score1++;
            this.resetBall();
        }

        this.updateScoreDisplay();

        if (this.score1 >= 3 || this.score2 >= 3) {
            this.showWinnerPopup();
        }
    }

    checkPaddleCollision(ball, paddle) {
        let closestX = Math.max(paddle.x, Math.min(ball.x, paddle.x + paddle.width));
        let closestY = Math.max(paddle.y, Math.min(ball.y, paddle.y + paddle.height));
        
        let distanceX = ball.x - closestX;
        let distanceY = ball.y - closestY;
        
        let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared <= (ball.radius * ball.radius);
    }

    handlePaddleCollision(ball, paddle) {
        const paddleCenter = paddle.y + paddle.height / 2;
        const collisionPoint = ball.y - paddleCenter;
        const normalizedCollisionPoint = collisionPoint / (paddle.height / 2);
        
        const speed = 8;
        const maxAngle = Math.PI / 4;
        const angle = normalizedCollisionPoint * maxAngle;
        
        const direction = (paddle === this.paddle1) ? 1 : -1;
        
        ball.dx = Math.cos(angle) * speed * direction;
        ball.dy = Math.sin(angle) * speed;
    }

    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        
        const speed = 8;
        const angle = (Math.random() - 0.5) * Math.PI / 4;
        this.ball.dx = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
        this.ball.dy = Math.sin(angle) * speed;
    }

    updateScoreDisplay() {
        const player1ScoreElement = this.querySelector('#player1Score');
        const player2ScoreElement = this.querySelector('#player2Score');
        
        if (player1ScoreElement && player2ScoreElement) {
            player1ScoreElement.textContent = `${this.player1Name}: ${this.score1}`;
            player2ScoreElement.textContent = `${this.player2Name}: ${this.score2}`;
        }
    }

    draw() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = 'white';
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();

        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
        this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);

        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    gameLoop() {
        if (!this.gameStarted) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    showWinnerPopup() {
        this.gameStarted = false;
        const winner = this.score1 >= 3 ? this.player1Name : this.player2Name;
        
        if (this.tournamentMode) {
            window.onpopstate = null;
            window.dispatchEvent(new CustomEvent('pongGameEnd', { detail: winner }));
            window.location.hash = '#tournament';
        } else {
            this.innerHTML = `
                <div class="game-content">
                    <div class="login-container">
                        <h2 class="login-title">Game Over</h2>
                        <div style="margin: 20px 0;">
                            <div class="word">
                                <span>${winner}</span>
                                <span data-i18n=" wins!"> wins!</span>
                            </div>
                        </div>
                        <button class="btn" id="restartGame" data-i18n="Play Again" style="margin: 10px;">Play Again</button>
                        <button class="btn" id="returnToDashboard" data-i18n="Return to Dashboard" style="margin: 10px;">Return to Dashboard</button>
                    </div>
                </div>
            `;
            changeLanguage(localStorage.getItem('preferredLanguage') || 'en');
            this.querySelector('#restartGame').addEventListener('click', this.restartGame.bind(this));
            this.querySelector('#returnToDashboard').addEventListener('click', this.returnToDashboard.bind(this));
        }
    }

    restartGame() {
        this.score1 = 0;
        this.score2 = 0;
        this.resetBall();
        this.startGame();
    }

    returnToDashboard() {
        localStorage.removeItem('pongPlayer1Name');
        localStorage.removeItem('pongPlayer2Name');
        localStorage.removeItem('pongTournamentMode');
        window.onbeforeunload = null;
        window.onpopstate = null;
        window.location.hash = '#dashboard';
    }
}

customElements.define('pong-game', PongGame);