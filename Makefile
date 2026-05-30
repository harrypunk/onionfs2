.PHONY: help build-front build-agent build-all run-front run-agent run-all stop-front stop-agent stop-all

REGISTRY ?= git.blackpink.io/onionfs
FRONT_PORT ?= 3001
AGENT_PORT ?= 3000
BUN_VERSION := 1.3.13

help:
	@echo "Available targets:"
	@echo "  build-front     Build $(REGISTRY)/frontend image"
	@echo "  build-agent     Build $(REGISTRY)/storeagent image"
	@echo "  build-all       Build both images"
	@echo "  run-front       Run frontend container (host:$(FRONT_PORT) -> container:3000)"
	@echo "  run-agent       Run storeagent container (host:$(AGENT_PORT) -> container:3000)"
	@echo "  run-all         Run both containers"
	@echo "  push-front      Push frontend image"
	@echo "  push-agent      Push storeagent image"
	@echo "  push-all        Push both images"
	@echo "  stop-front      Stop frontend container"
	@echo "  stop-agent      Stop storeagent container"
	@echo "  stop-all        Stop both containers"
	@echo ""
	@echo "Override ports: FRONT_PORT=8080 AGENT_PORT=8081 make run-all"
	@echo "Override registry: REGISTRY=other.registry make build-all"

build-front:
	docker build --build-arg BUN_VERSION=$(BUN_VERSION) -f apps/frontend/Dockerfile -t $(REGISTRY)/frontend .

build-agent:
	docker build --build-arg BUN_VERSION=$(BUN_VERSION) -f apps/storeagent/Dockerfile -t $(REGISTRY)/storeagent .

build-all: build-front build-agent

run-front:
	docker run -d --name onionfs-front -p $(FRONT_PORT):3000 --rm $(REGISTRY)/frontend

run-agent:
	docker run -d --name onionfs-agent -p $(AGENT_PORT):3000 --rm $(REGISTRY)/storeagent

run-all: run-agent run-front

stop-front:
	docker stop onionfs-front

stop-agent:
	docker stop onionfs-agent

push-front:
	docker push $(REGISTRY)/frontend

push-agent:
	docker push $(REGISTRY)/storeagent

push-all: push-front push-agent

stop-all: stop-agent stop-front
