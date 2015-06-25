GIT_HASH := $(shell git rev-parse --short HEAD)
TEST_HOST := "ft-radiator-branch-${GIT_HASH}"
TEST_URL := "http://ft-radiator-branch-${GIT_HASH}.herokuapp.com/__gtg"

.PHONY: test

install:
	origami-build-tools install --verbose

build:
	nbt build

clean:
	git clean -fxd

# Note: Environment variables can be found at ~/.next-development-keys.json
# https://github.com/Financial-Times/next-build-tools/blob/master/tasks/download-development-keys.js
run:
	export PORT=5028; \
	nbt run --local

test:
	nbt verify --skip-layout-checks
	nbt build

deploy:
	nbt deploy-hashed-assets
	nbt deploy

watch:
	nbt build --dev --watch
