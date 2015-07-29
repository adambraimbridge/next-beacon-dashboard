TEST_HOST := "ft-beacon-branch-${CIRCLE_BUILD_NUM}"

.PHONY: test

install:
	origami-build-tools install --verbose

build:
	nbt build

build-production:
	nbt build
	nbt about

clean:
	git clean -fxd

run:
	export PORT=5028; \
	nbt run --local

test: build-production
	nbt verify --skip-layout-checks

deploy:
	nbt configure --no-splunk
	nbt deploy-hashed-assets
	nbt deploy --docker

watch:
	nbt build --dev --watch

provision:
	nbt provision ${TEST_HOST}
	nbt configure ft-next-beacon-dashboard ${TEST_HOST} --overrides "NODE_ENV=branch" --no-splunk
	nbt deploy-hashed-assets
	nbt deploy ${TEST_HOST} --skip-enable-preboot --docker
	
tidy:
	nbt destroy ${TEST_HOST}
