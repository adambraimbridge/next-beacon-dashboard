GIT_HASH := $(shell git rev-parse --short HEAD)
TEST_HOST := "ft-radiator-branch-${GIT_HASH}"
TEST_URL := "http://ft-radiator-branch-${GIT_HASH}.herokuapp.com/__gtg"
KEEN_PROJECT := $(shell cat ~/.KEEN_PROJECT 2>/dev/null)
KEEN_READ_KEY := $(shell cat ~/.KEEN_READ_KEY 2>/dev/null)

.PHONY: test

install:
	origami-build-tools install --verbose

build:
	nbt build

clean:
	git clean -fxd

run:
	export S3O_PUBLIC_KEY=`cat ~/.s3o_public_key`; \
	export KEEN_PROJECT=${KEEN_PROJECT}; \
	export KEEN_READ_KEY=${KEEN_READ_KEY}; \
	export PORT=5028; \
	export BEACON_API_KEY=abc123; \
	nbt run --local

test:
	nbt verify --skip-layout-checks
	nbt build

deploy:
	nbt deploy-hashed-assets
	nbt deploy

watch:
	nbt build --dev --watch




# "HOSTEDGRAPHITE_APIKEY": "36f8dbd4-19ee-43d9-af56-67c3cce0cee4",
# 			"KEEN_API_URL": "https://api.keen.io:443",
# 			"S3O_PUBLIC_KEY": "MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAu37tyRosqi5m22+/DFpmBG3ySwa7F1mOKSGi5ALineHWO3Pa9JIjxVl9wqj0zGuOJJZlDfWMILEEphe3l3xb+iiMhEuUceqkL21fJx4toy3buGhM/9VL72CYLl2aUGCqu+Q2qXNtxhqC6TrB+AU9g4RUlrjmI8VcCAhhgGMkX6z5mcI3mB5S/fNZL73RSEenDnHUNz1As6Km4glvzBZLu2axWijs+Y1b1U/ilYiUu8mchha2S1LSKdA6wLt6zrE0EH7zCve91Yzpypw/MpfPYVmDrzYRA/z04f88nowGA9b+DJfgIpPSvmyhlgpbYqhnDRwCEMniIoayPkFR4oFONQrLT8ARDk56PHSTmCb7BVQTnrzRbJMV0nVln+eHensryFhA/PBCoxowPjH2jPDWgiM5M0HHqtPFG+307uSSBTAzM1gdKAdim2M9ivICKpXS1yP/O9dVtWtA0rsuiKU+vKtLPk3tSX9rpopbIH9C6w8shnMGcyVyckugVz2T6s4gySTtDNLHIugc6n2bDSPlMaZ+uWlrHtZeWBbxvs1ZlwYnfAs1Ohi9xdTuO1Q4DKUvcVxmhglufn5bASJ5MLd6sJaeNnuuAoUSKw6/8B8Eh1whvHy583t17oA43SPZbfxAj622yi73kT15YmwsO7DDjtfV1ME+qsDrt3sFYtRNDlsCAwEAAQ==",
# 			"BEACON_API_KEY": "ef09df5c-defe-4ec9-b79a-5a47e006498c",
# 			"KEEN_READ_KEY": "e6a84805d809660015224f8ddd0f9cac85549a518342a9186b3009674bfd2064ad47eb28d86fe72d94defb436995c572ce3dee1247333ae7ca0925fdb99847de04855af279fc6bd2ee6b1fe5b088022d5982b4867d83940c2aa1c7b8d4d6ba9208f450b62c1566fd1aacb36c25d4e2cd",
# 			"NODE_ENV": "production",
# 			"KEEN_PROJECT": "5486efb559949a0a311510fa",
# 			"RAVEN_URL": "https://7af6b8242d434b6688d17a99edcd013d:6ed420d1010f4bb5a71c61c8ce4b7f28@app.getsentry.com/35343",
# 			"apikey": "MXyodGaGug22biWWCk5ZXkgus6AzLmXf"
