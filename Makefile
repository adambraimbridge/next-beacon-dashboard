export SHELL := /bin/bash
export PATH  := $(shell npm bin):$(PATH)

build:
	cp bower_components/rickshaw/rickshaw.css static/
	gulp build

run:
	export KEEN_PROJECT_ID=`cat .keen.io.project`; export KEEN_READ_KEY=`cat .keen.io.read_key`; export DEBUG=*; nodemon server/app

deploy:
	haikro build deploy \
		--app ft-next-beacon-dashboard \
		--heroku-token `heroku auth:token` \
		--commit `git rev-parse HEAD`