
test:
	@./node_modules/.bin/mocha \
		--harmony-generators \
		--require co-mocha \
		--reporter spec \
		--timeout 20s

.PHONY: test
