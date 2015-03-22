export SHELL := /bin/bash
export PATH  := $(shell npm bin):$(PATH)
API_KEY := $(shell cat ~/.ftapi 2>/dev/null)

install:
	origami-build-tools install --verbose

build:
	gulp build

run:
	export apikey=${API_KEY}; \
	export BASIC_AUTH="user:123"; \
		export KEEN_PROJECT_ID=`cat .keen.io.project`; \
		export KEEN_READ_KEY=`cat .keen.io.read_key`; \
		export DEBUG=*; nodemon server/app

deploy:
	next-build-tools configure
	next-build-tools deploy
