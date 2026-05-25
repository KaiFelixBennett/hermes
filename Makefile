# Hermes Local Stack — Unified Entry Point
# Works on Linux, macOS, and WSL2

SHELL := /bin/bash
.PHONY: setup start hermes claude-bridge litellm stop status help clean

## Default target shows help
.DEFAULT_GOAL := help

## Colors for output
GREEN  := \033[0;32m
CYAN   := \033[0;36m
YELLOW := \033[1;33m
NC     := \033[0m

## Paths
REPO_DIR := $(shell pwd)
CONFIG   := $(REPO_DIR)/hermes_config.yaml
LLAMA_LOG := /tmp/llama-server.log
LITELLM_LOG := /tmp/hermes-litellm.log

## Extract model config from YAML
MODEL_PATH := $(shell grep -A1 '^\s*path:' $(CONFIG) 2>/dev/null | head -1 | sed "s/.*path:\s*['\"]*//;s/['\"].*//" | tr -d ' ')
BACKEND    := $(shell grep -A1 '^\s*backend:' $(CONFIG) 2>/dev/null | head -1 | sed "s/.*backend:\s*['\"]*//;s/['\"].*//" | tr -d ' ')

##############################################################################
# Help
##############################################################################
help: ## Show this help
	@echo ""
	@echo -e "$(CYAN)Hermes Local Stack — Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-18s$(NC) %s\n", $$1, $$2}'
	@echo ""

##############################################################################
# Setup
##############################################################################
setup: ## Run the full one-command setup
	@if [ -f "$(REPO_DIR)/setup.sh" ]; then \
		bash $(REPO_DIR)/setup.sh; \
	else \
		echo "setup.sh not found. On Windows, use ./setup_hermes_local.ps1 instead."; \
	fi

##############################################################################
# Start Services
##############################################################################
start: llama hermes ## Start llama.cpp + Hermes (no Claude bridge)

hermes: check-llama ## Start Hermes Agent
	@echo -e "$(CYAN)[HERMES]$(NC) Starting Hermes Agent..."
	@hermes || { echo "Hermes not found. Run 'make setup' first."; exit 1; }

check-llama: ## Check if llama.cpp is running
	@curl -s http://127.0.0.1:8080/v1/models > /dev/null 2>&1 || { \
		echo -e "$(YELLOW)[WARN]$(NC) llama.cpp not reachable at port 8080"; \
		echo "     Starting llama.cpp first..."; \
		$(MAKE) llama-wait; \
	}

llama: ## Start llama.cpp server
	@if curl -s http://127.0.0.1:8080/v1/models > /dev/null 2>&1; then \
		echo -e "$(GREEN)[OK]$(NC)    llama.cpp is already running"; \
	else \
		echo -e "$(CYAN)[LLAMA]$(NC) Starting llama.cpp server..."; \
		if command -v llama-server > /dev/null 2>&1; then \
			llama-server \
				--model "$(MODEL_PATH)" \
				--host 127.0.0.1 \
				--port 8080 \
				--ctx-size 65536 \
				--threads $$(nproc 2>/dev/null || echo 4) \
				> $(LLAMA_LOG) 2>&1 & \
			echo $$! > /tmp/hermes-llama.pid; \
		else \
			echo "llama-server not found. Run 'make setup' first."; \
			exit 1; \
		fi; \
		$(MAKE) llama-wait; \
	fi

llama-wait: ## Wait for llama.cpp to be ready
	@for i in $$(seq 1 30); do \
		if curl -s http://127.0.0.1:8080/v1/models > /dev/null 2>&1; then \
			echo -e "$(GREEN)[OK]$(NC)    llama.cpp is ready"; \
			break; \
		fi; \
		if [ $$i -eq 30 ]; then \
			echo -e "$(RED)[ERROR]$(NC) llama.cpp failed to start. Check $(LLAMA_LOG)"; \
			exit 1; \
		fi; \
		sleep 2; \
	done

claude-bridge: check-llama litellm hermes ## Start everything including Claude Code bridge

litellm: ## Start LiteLLM proxy for Claude Code bridge
	@if curl -s http://127.0.0.1:4000 > /dev/null 2>&1; then \
		echo -e "$(GREEN)[OK]$(NC)    LiteLLM is already running on port 4000"; \
	else \
		echo -e "$(CYAN)[LITELLM]$(NC) Starting LiteLLM proxy..."; \
		if command -v litellm > /dev/null 2>&1; then \
			litellm --config $(REPO_DIR)/litellm.proxy.yaml \
				--port 4000 \
				> $(LITELLM_LOG) 2>&1 & \
			echo $$! > /tmp/hermes-litellm.pid; \
		else \
			python3 -m pip install litellm; \
			litellm --config $(REPO_DIR)/litellm.proxy.yaml \
				--port 4000 \
				> $(LITELLM_LOG) 2>&1 & \
			echo $$! > /tmp/hermes-litellm.pid; \
		fi; \
		echo -e "$(GREEN)[OK]$(NC)    LiteLLM started"; \
	fi

##############################################################################
# Stop Services
##############################################################################
stop: stop-llama stop-litellm ## Stop all services

stop-llama: ## Stop llama.cpp
	@if [ -f /tmp/hermes-llama.pid ]; then \
		kill $$(cat /tmp/hermes-llama.pid) 2>/dev/null || true; \
		rm -f /tmp/hermes-llama.pid; \
		echo -e "$(GREEN)[OK]$(NC)    llama.cpp stopped"; \
	else \
		pkill -f "llama-server" 2>/dev/null || true; \
		echo -e "$(YELLOW)[WARN]$(NC) No llama.cpp PID file found, tried pkill"; \
	fi

stop-litellm: ## Stop LiteLLM
	@if [ -f /tmp/hermes-litellm.pid ]; then \
		kill $$(cat /tmp/hermes-litellm.pid) 2>/dev/null || true; \
		rm -f /tmp/hermes-litellm.pid; \
		echo -e "$(GREEN)[OK]$(NC)    LiteLLM stopped"; \
	else \
		pkill -f "litellm" 2>/dev/null || true; \
		echo -e "$(YELLOW)[WARN]$(NC) No LiteLLM PID file found, tried pkill"; \
	fi

##############################################################################
# Status & Utilities
##############################################################################
status: ## Show service status
	@echo ""
	@echo -e "$(CYAN)Service Status$(NC)"
	@echo "─────────────"
	@echo -n "  llama.cpp:     "
	@if curl -s http://127.0.0.1:8080/v1/models > /dev/null 2>&1; then \
		echo -e "$(GREEN)running$(NC)"; \
	else \
		echo -e "$(YELLOW)not running$(NC)"; \
	fi
	@echo -n "  LiteLLM:       "
	@if curl -s http://127.0.0.1:4000 > /dev/null 2>&1; then \
		echo -e "$(GREEN)running$(NC)"; \
	else \
		echo -e "$(YELLOW)not running$(NC)"; \
	fi
	@echo -n "  Hermes:        "
	@if pgrep -f "hermes" > /dev/null 2>&1; then \
		echo -e "$(GREEN)running$(NC)"; \
	else \
		echo -e "$(YELLOW)not running$(NC)"; \
	fi
	@echo ""

clean: stop ## Clean up logs and temp files
	@rm -f $(LLAMA_LOG) $(LITELLM_LOG)
	@echo -e "$(GREEN)[OK]$(NC)    Cleaned up"
