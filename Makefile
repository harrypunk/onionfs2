.PHONY: build-all run-all push-all stop-all helm-package helm-push

REGISTRY ?= git.blackpink.io/onionfs
BUN_VERSION := 1.3.13
HELM_REGISTRY ?= $(REGISTRY)

# App configs: name, dockerfile, port
FRONT_NAME := frontend
FRONT_FILE := apps/frontend/Dockerfile
FRONT_PORT := 3001

AGENT_NAME := storeagent
AGENT_FILE := apps/storeagent/Dockerfile
AGENT_PORT := 3000

# Generate per-app rules from template
# Args: 1=app key, 2=image name, 3=dockerfile, 4=port
define APP_RULES
build-$(1):
	docker build --build-arg BUN_VERSION=$(BUN_VERSION) -f $(3) -t $(REGISTRY)/$(2) .

run-$(1):
	docker run -d --name onionfs-$(1) -p $(4):3000 --rm $(REGISTRY)/$(2)

stop-$(1):
	docker stop onionfs-$(1)

push-$(1):
	docker push $(REGISTRY)/$(2)
endef

$(eval $(call APP_RULES,front,$(FRONT_NAME),$(FRONT_FILE),$(FRONT_PORT)))
$(eval $(call APP_RULES,agent,$(AGENT_NAME),$(AGENT_FILE),$(AGENT_PORT)))

# Aggregate targets
build-all: build-front build-agent
run-all: run-agent run-front
push-all: push-front push-agent
stop-all: stop-agent stop-front

# Helm chart packaging and OCI publish
helm-package:
	helm package ./helm --destination build/

helm-push: helm-package
	helm push build/onionfs-*.tgz oci://$(HELM_REGISTRY)
