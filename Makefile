
test:
	@./node_modules/.bin/mocha \
		--require should \
		--reporter spec \
		--timeout 20s

.PHONY: test
