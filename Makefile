TEST_HOST := "ft-beacon-branch-${CIRCLE_BUILD_NUM}"

.PHONY: test

install:
	npm install
	origami-build-tools install --verbose

clean:
	rm -rf bower_components
	rm -rf node_modules

verify:
	nbt verify --skip-layout-checks

test: verify

build:
	nbt build --dev

build-watch:
	nbt build --dev --watch

build-production:
	nbt build

run:
	export PORT=5028; nbt run --local

deploy:
	nbt configure --no-splunk
	nbt deploy-hashed-assets
	nbt deploy

watch:
	nbt build --dev --watch

provision:
	nbt provision ${TEST_HOST}
	nbt configure ft-next-beacon-dashboard ${TEST_HOST} --overrides "NODE_ENV=branch" --no-splunk
	nbt deploy-hashed-assets
	nbt deploy ${TEST_HOST} --skip-enable-preboot

tidy:
	nbt destroy ${TEST_HOST}
