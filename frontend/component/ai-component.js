import { getCookie} from "./func.js";
import { changeLanguage } from "../assets/js/script.js";

class AiComponent extends HTMLElement {
    constructor() {
        super();
        this.canvas = null;
        this.ctx = null;
        this.ball = { 
            x: 500, 
            y: 250, 
            radius: 10, 
            dx: 5, 
            dy: 5,
            speed: 5
        };
        this.paddle1 = { x: 10, y: 200, width: 10, height: 120 };
        this.paddle2 = { x: 980, y: 200, width: 10, height: 120 };
        this.keys = {};
        this.paddleSpeed = 14;
        this.score1 = 0;
        this.score2 = 0;
        this.playerName = '';
        this.gameStarted = false;
        this.lastAIUpdate = 0;
        this.predictedBallY = 250;
        this.difficultyLevel = 0.65;
        this.hitCount = 0;
    }

    connectedCallback() {
        this.showPlayerRegistration();
    }

    showPlayerRegistration() {
        this.innerHTML = `
            <div class="game-content">
                <div class="login-container">
                    <h2 data-i18n="Player Registration">Player Registration</h2>
                    <div class="form-group">
                        <span data-i18n="Enter Your Name:">Enter Your Name:</span>
                        <input type="text" id="playerName">
                    </div>
                    <button class="btn" id="startGame" data-i18n="Start Game">Start Game</button>
                </div>
            </div>
        `;
        changeLanguage(localStorage.getItem('preferredLanguage') || 'en');
        this.querySelector('#startGame').addEventListener('click', () => {
            const nameInput = this.querySelector('#playerName');
            const playerName = nameInput.value.trim();
            if (playerName) {
                this.playerName = playerName;
                this.initializeGame();
            } else {
                alert('Please enter your name.');
            }
        });
    }

    initializeGame() {
        this.innerHTML = `
            <div class="game-content">
                <div id="gameArea">
                    <div class="score-container" id="scoreBoard">
                        <span class="btn" id="player1Score">${this.playerName}: 0</span> -
                        <span class="btn" id="player2Score">AI: 0</span>
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
    }

    handleKeyDown(e) {
        this.keys[e.key] = true;
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    updateAI() {
        const now = Date.now();
        if (now - this.lastAIUpdate >= 1500) {
            this.predictBallPosition();
            this.lastAIUpdate = now;
        }

        const paddleCenter = this.paddle2.y + this.paddle2.height / 2;
        const targetY = this.predictedBallY;

        const randomError = (Math.random() - 0.5) * 100 * (1 - this.difficultyLevel);
        const adjustedTargetY = targetY + randomError;

        const aiPaddleSpeed = this.paddleSpeed * 0.8;

        if (Math.abs(paddleCenter - adjustedTargetY) > 30) {
            if (paddleCenter < adjustedTargetY && this.paddle2.y < this.canvas.height - this.paddle2.height) {
                this.paddle2.y += aiPaddleSpeed;
            } else if (paddleCenter > adjustedTargetY && this.paddle2.y > 0) {
                this.paddle2.y -= aiPaddleSpeed;
            }
        }
    }

    predictBallPosition() {
        if (this.ball.dx > 0 && this.ball.x > this.canvas.width / 2) {
            let futureX = this.ball.x;
            let futureY = this.ball.y;
            let futureDy = this.ball.dy;
            
            const predictionError = (Math.random() - 0.5) * 50;
            
            while (futureX < this.paddle2.x) {
                futureX += this.ball.dx;
                futureY += futureDy;
                
                if (futureY < 0 || futureY > this.canvas.height) {
                    futureDy *= -1;
                }
            }
            
            this.predictedBallY = futureY + predictionError;
        }
    }

    update() {
        if (this.keys['w'] && this.paddle1.y > 0) {
            this.paddle1.y -= this.paddleSpeed;
        }
        if (this.keys['s'] && this.paddle1.y < this.canvas.height - this.paddle1.height) {
            this.paddle1.y += this.paddleSpeed;
        }

        this.updateAI();

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
            this.hitCount++;
            if (this.hitCount % 4 === 0 && Math.abs(this.ball.dx) < 10) {
                const currentSpeed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
                const speedIncrease = 0.5;
                this.ball.dx *= (currentSpeed + speedIncrease) / currentSpeed;
                this.ball.dy *= (currentSpeed + speedIncrease) / currentSpeed;
            }
        } else if (this.checkPaddleCollision(this.ball, this.paddle2)) {
            this.ball.x = this.paddle2.x - this.ball.radius;
            this.handlePaddleCollision(this.ball, this.paddle2);
            this.hitCount++;
            if (this.hitCount % 4 === 0 && Math.abs(this.ball.dx) < 10) {
                const currentSpeed = Math.sqrt(this.ball.dx * this.ball.dx + this.ball.dy * this.ball.dy);
                const speedIncrease = 0.5;
                this.ball.dx *= (currentSpeed + speedIncrease) / currentSpeed;
                this.ball.dy *= (currentSpeed + speedIncrease) / currentSpeed;
            }
        }

        if (this.ball.x < 0) {
            this.score2++;
            this.resetBall();
        } else if (this.ball.x > this.canvas.width) {
            this.score1++;
            this.resetBall();
        }

        this.updateScoreDisplay();

        if (this.score1 >= 5 || this.score2 >= 5) {
            this.showWinnerPopup();
        }
    }

    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        const speed = 5;
        const angle = (Math.random() - 0.5) * Math.PI / 4;
        this.ball.dx = Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1);
        this.ball.dy = Math.sin(angle) * speed;
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
        
        const maxAngle = Math.PI / 4;
        const angle = normalizedCollisionPoint * maxAngle;
        
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = Math.cos(angle) * speed * (ball.dx > 0 ? -1 : 1);
        ball.dy = Math.sin(angle) * speed;
    }

    updateScoreDisplay() {
        const player1ScoreElement = this.querySelector('#player1Score');
        const player2ScoreElement = this.querySelector('#player2Score');
        
        if (player1ScoreElement && player2ScoreElement) {
            player1ScoreElement.textContent = `${this.playerName}: ${this.score1}`;
            player2ScoreElement.textContent = `AI: ${this.score2}`;
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
        const winner = this.score1 >= 5 ? this.playerName : 'AI';
        this.innerHTML = `
            <div class="game-content">
                <div class="login-container">
                    <h2 class="login-title" data-i18n="Game Over">Game Over</h2>
                    <div style="margin: 20px 0;">
                        <span class="word">${winner}</span>
                        <span class="word" data-i18n=" wins!"> wins!</span>
                    </div>
                    <button class="btn" id="restartGame" data-i18n="Play Again" style="margin: 10px;">Play Again</button>
                    <button class="btn" id="returnToDashboard" data-i18n="Return to Dashboard" style="margin: 10px;">Return to Dashboard</button>
                </div>
            </div>
        `;
        changeLanguage(localStorage.getItem('preferredLanguage') || 'en');
        this.querySelector('#restartGame').addEventListener('click', () => {
            this.score1 = 0;
            this.score2 = 0;
            this.resetBall();
            this.initializeGame();
        });
        this.querySelector('#returnToDashboard').addEventListener('click', () => {
            window.location.hash = '#dashboard';
        });
    }
}

customElements.define('ai-component', AiComponent);