export MOCHA=node_modules/mocha-phantomjs/bin/mocha-phantomjs

all: npm

test: unitary_test

npm:
	@npm install

unitary_test:
	@echo "Running unitary tests..."
	@LOG_LEVEL=error ${MOCHA} --timeout 10000 --reporter spec tests/models/editor.html

.PHONY: clean npm unitary_test
