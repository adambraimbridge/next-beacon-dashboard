export SHELL := /bin/bash
export PATH  := $(shell npm bin):$(PATH)
API_KEY := $(shell cat ~/.ftapi 2>/dev/null)
KEEN_PROJECT_ID := $(shell cat ~/.keen.io.project 2>/dev/null)
KEEN_READ_KEY := $(shell cat ~/.keen.io.read_key 2>/dev/null)
S3O_PUBLIC_KEY := $(shell cat ~/.s3o_public_key 2>/dev/null)

install:
	origami-build-tools install

build:
	gulp build

run:
ifeq ($(API_KEY),)
	@echo "You need an ft api v1 key to run ths app, speak to someone from the Next team."
	exit 1
endif
ifeq ($(KEEN_PROJECT_ID),)
	@echo "You need a KEEN_PROJECT_ID to run this app, speak to someone from the Next team."
	exit 1
endif
ifeq ($(KEEN_READ_KEY),)
	@echo "You need a KEEN_READ_KEY to run this app, speak to someone from the Next team."
	exit 1
endif
# The Staff Single Sign On (S3O) public key is available at https://s3o.ft.com/publickey.
ifeq ($(S3O_PUBLIC_KEY),)
	@echo "You need a S3O_PUBLIC_KEY to run this app, speak to someone from the Next team."
	exit 1
endif
	export apikey=${API_KEY}; \
	export BASIC_AUTH="user:123"; \
	export KEEN_PROJECT_ID=$(KEEN_PROJECT_ID); \
	export KEEN_READ_KEY=$(KEEN_READ_KEY); \
	export S3O_PUBLIC_KEY=$(S3O_PUBLIC_KEY); \
	export DEBUG=*; nodemon server/app.js

test: build
	next-build-tools verify

deploy:
	next-build-tools configure
	next-build-tools deploy
