
build:
	./node_modules/.bin/gulp build

run:
	export KEEN_PROJECT_ID=`cat .keen.io.project`; export KEEN_READ_KEY=`cat .keen.io.read_key`; export DEBUG=*; nodemon server/app
