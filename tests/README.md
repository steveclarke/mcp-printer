# MCP Printer Tests

Unit tests for the MCP Printer server, focusing on pure functions, configuration parsing, and security validation.

## Running Tests

```bash
# Run tests once
pnpm test

# Run tests in watch mode (re-runs on file changes)
pnpm test:watch

# Open Vitest UI (browser-based test interface)
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage
```

## Test Structure

### Unit Tests (`tests/unit/`)

- **`utils.test.ts`** - Pure utility functions
  - String parsing (`parseDelimitedString`)
  - Language mapping (`getLanguageFromExtension`)
  - HTML manipulation (`fixMultilineSpans`)
  - Response formatting (`formatPrintResponse`)

- **`file-detection.test.ts`** - File type detection logic
  - Markdown rendering detection (`shouldRenderToPdf`)
  - Code syntax highlighting detection (`shouldRenderCode`)
  - Extension handling and exclusions

- **`security.test.ts`** - Security validation
  - File path validation (`validateFilePath`)
  - Allowed/denied path enforcement
  - .env file blocking
  - Sensitive directory protection

- **`config.test.ts`** - Configuration parsing
  - Environment variable parsing
  - Default values
  - Boolean/array/path parsing
  - Configuration merging

## Coverage Goals

Current coverage targets (unit tests only):

- ✅ Pure functions: 90%+ coverage
- ✅ Security validation: High coverage on critical paths
- ✅ Configuration parsing: 100% coverage

Note: Integration-heavy code (server, tools, renderers) that depends on external systems (CUPS, Chrome, pandoc) is intentionally excluded from unit tests.

## Future Enhancements

Potential additions for comprehensive testing:

1. **Integration tests** - Mock external commands (lpr, lpstat, pandoc, chrome)
2. **Renderer tests** - Test markdown and code PDF generation with mocked Chrome
3. **Tool tests** - Test MCP tool implementations with mocked CUPS commands

## Test Helpers

The `tests/helpers/` directory is available for shared test utilities and fixtures as the test suite grows.

