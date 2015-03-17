export SHELL := /bin/bash
export PATH  := $(shell npm bin):$(PATH)

install:
	origami-build-tools install --verbose

build:
	gulp build

run:
	export BASIC_AUTH=`user:123` \
		export KEEN_PROJECT_ID=`cat .keen.io.project`; \
		export KEEN_READ_KEY=`cat .keen.io.read_key`; \
		export DEBUG=*; nodemon server/app

deploy:
	haikro build deploy \
		--app ft-next-beacon-dashboard \
		--heroku-token $(HEROKU_AUTH_TOKEN) \
		--commit `git rev-parse HEAD` \
		--debug
