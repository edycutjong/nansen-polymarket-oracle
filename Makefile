.PHONY: all install dev build clean test coverage typecheck lint ci start

# Run all quality checks
ci:
	npm run ci
all: install build

# Install dependencies
install:
	npm install

# Run the CLI in development mode (e.g. `make dev ARGS="scan"`)
dev:
	npm run dev -- $(ARGS)

# Build the TypeScript project
build:
	npm run build

# Clean the dist folder
clean:
	rm -rf dist

# Run all unit tests
test:
	npm run test

# Run tests and generate coverage report
coverage:
	npm run test:coverage

# Run TypeScript compilation checks
typecheck:
	npm run typecheck

# Run linter
lint:
	npm run lint

# Run the built CLI (e.g. `make start ARGS="analyze m1"`)
start:
	npm run start -- $(ARGS)
