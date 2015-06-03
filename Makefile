test:
	@./node_modules/.bin/mocha \
	        --harmony \
		--reporter spec \
		--timeout 20s

coverage:
	@./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- -u exports -R spec
	@open coverage/lcov-report/index.html

.PHONY: test coverage
