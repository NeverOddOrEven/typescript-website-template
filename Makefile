
today := $(shell date "+%m%d%y")
sha1 := $(shell git rev-parse --short=5 HEAD)

packagename := $(today)-$(sha1)

tmp := $(shell mktemp -d)

run:
	@cd ./src && make dev

clean-1:
	@git diff-index --quiet HEAD
	@git clean -xdf

clean-2:
	@git diff-index --quiet HEAD
	@git clean -xdf

clean: clean-1

test: 
	@cd ./src && make test

archive:
	@rm -rf ./packages && mkdir -p ./packages
	@git archive --format 'tgz' --output ./packages/$(packagename).tgz HEAD

docker:
	@docker build -t "tsw/www:$(packagename)" .

package: clean-1 test clean-2 archive docker

publish: package
	scp -i $(WEBSITE_SSH_KEY) ./packages/$(packagename).tgz $(WEBSITE_SSH_HOST):~/
 
