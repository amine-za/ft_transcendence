.PHONY: help all build up clean fclean status logs stop re

RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
PURPLE := \033[0;35m
CYAN := \033[0;36m
WHITE := \033[0;37m
BOLD := \033[1m
RESET := \033[0m

all: help

help:
	@echo "$(BOLD)$(CYAN)╔═══════════════════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(BOLD)$(CYAN)║$(RESET)                   $(BOLD)$(WHITE)ft_transcendence Development Commands$(RESET)                   $(BOLD)$(CYAN)║$(RESET)"
	@echo "$(BOLD)$(CYAN)╚═══════════════════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(BOLD)$(GREEN) Quick Start:$(RESET)"
	@echo "  $(YELLOW)make up$(RESET)        - Start all services"
	@echo "  $(YELLOW)make status$(RESET)    - Check container status"
	@echo "  $(YELLOW)make logs$(RESET)      - View application logs"
	@echo ""
	@echo "$(BOLD)$(BLUE)  Development:$(RESET)"
	@echo "  $(YELLOW)make build$(RESET)     - Build Docker images"
	@echo "  $(YELLOW)make stop$(RESET)      - Stop all services"
	@echo ""
	@echo "$(BOLD)$(PURPLE) Maintenance:$(RESET)"
	@echo "  $(YELLOW)make clean$(RESET)     - Clean containers and volumes"
	@echo "  $(YELLOW)make fclean$(RESET)    - Full cleanup (including images)"
	@echo "  $(YELLOW)make re$(RESET)        - Clean and restart"
	@echo ""

build:
	@echo "$(BOLD)$(BLUE)  Building ft_transcendence Docker images...$(RESET)"
	@docker-compose build
	@echo "$(GREEN) Images built successfully!$(RESET)"

up:
	@echo "$(BOLD)$(GREEN)╔═══════════════════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(BOLD)$(GREEN)║$(RESET) $(BOLD)$(WHITE) Starting ft_transcendence$(RESET) $(BOLD)$(GREEN)║$(RESET)"
	@echo "$(BOLD)$(GREEN)╚═══════════════════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(YELLOW)  Building and starting services...$(RESET)"
	@cp .env.example .env
	@python3 -c "import secrets; f=open('.env','r+'); c=f.read(); f.seek(0); f.write(c.replace('auto-generated-by-make-up', secrets.token_urlsafe(50))); f.truncate()" || python -c "import secrets; f=open('.env','r+'); c=f.read(); f.seek(0); f.write(c.replace('auto-generated-by-make-up', secrets.token_urlsafe(50))); f.truncate()" || true
	@docker-compose up --build -d
	@echo "$(GREEN) ft_transcendence started successfully!$(RESET)"
	@echo "$(CYAN) Frontend: https://localhost:443$(RESET)"
	@echo "$(CYAN)  Backend:  http://localhost:8000$(RESET)"
	@echo "$(CYAN)  Database: PostgreSQL (local)$(RESET)"

stop:
	@echo "$(BOLD)$(RED) Stopping ft_transcendence services...$(RESET)"
	@docker-compose down
	@echo "$(GREEN) Services stopped successfully!$(RESET)"

status:
	@echo "$(BOLD)$(BLUE) ft_transcendence Container Status$(RESET)"
	@echo "$(CYAN)═══════════════════════════════════════════════════════════════════════════$(RESET)"
	@docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

logs:
	@echo "$(BOLD)$(PURPLE) ft_transcendence Application Logs$(RESET)"
	@echo "$(CYAN)═══════════════════════════════════════════════════════════════════════════$(RESET)"
	@docker-compose logs -f --tail=50

logs-backend:
	@echo "$(BOLD)$(PURPLE) Backend Logs$(RESET)"
	@docker-compose logs -f backend

logs-frontend:
	@echo "$(BOLD)$(PURPLE) Frontend Logs$(RESET)"
	@docker-compose logs -f frontend

logs-db:
	@echo "$(BOLD)$(PURPLE) Database Logs$(RESET)"
	@docker-compose logs -f db

clean:
	@echo "$(BOLD)$(YELLOW) Cleaning up ft_transcendence containers and volumes...$(RESET)"
	@docker-compose down -v
	@echo "$(GREEN) Cleanup completed!$(RESET)"

fclean: clean
	@echo "$(BOLD)$(RED) Performing full cleanup (containers, networks, volumes, images)...$(RESET)"
	@docker system prune -a -f
	@echo "$(GREEN) Full cleanup completed!$(RESET)"

re: clean up