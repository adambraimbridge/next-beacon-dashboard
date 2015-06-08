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

run:
	export S3O_PUBLIC_KEY=`cat ~/.s3o_public_key`; \
	export PORT=5028; \
	export BEACON_API_KEY=abc123; \
	nbt run

test:
	nbt verify --skip-layout-checks
	nbt build

deploy:
	nbt deploy-hashed-assets
	nbt deploy

watch:
	nbt build --dev --watch
