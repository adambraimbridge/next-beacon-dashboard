export SHELL := /bin/bash
export PATH  := $(shell npm bin):$(PATH)
API_KEY := $(shell cat ~/.ftapi 2>/dev/null)
KEEN_PROJECT_ID := $(shell cat ~/.keen.io.project 2>/dev/null)
KEEN_READ_KEY := $(shell cat ~/.keen.io.read_key 2>/dev/null)

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
	export apikey=${API_KEY}; \
	export BASIC_AUTH="user:123"; \
		export KEEN_PROJECT_ID=$(KEEN_PROJECT_ID); \
		export KEEN_READ_KEY=$(KEEN_READ_KEY); \
		export DEBUG=*; nodemon server/app.js

test:
	next-build-tools verify

deploy:
	next-build-tools configure
	next-build-tools deploy
