This is the API for the riichi-app project. This is a Python package meant to run the YOLO model to recognize tiles, and to provide an easy-to-use JSON web API for the frontend that inputs the images of hands and other information related to the live game session.

## Commands

This is an uv project, so please use the uv commands to manage dependencies and to start the app.

For installing the repo dependencies use `uv sync`.

For adding a new dependency, use `uv add <dependency>`. This dependency will appear in the @pyproject.toml file. NEVER install dependencies outside uv.

For removing a dependency, use `uv remove <dependency>`.

To start the project, use `uv run main.py`.

## Best Practices

### Tests

For all code modules you add, make sure to add unit tests for them. For the tests place them to the same dir as the actual files themselves. Use the format `test_<file>.py`.

### Type Safety (Strict)

Write Python with maximum static type safety.

Fully annotate all functions, methods, and public variables.

Avoid Any; treat it as unsafe.

Prefer precise types, TypedDict, Protocol, Literal, and dataclasses.

Use Python 3.11+ typing syntax.

Code must pass strict static type checking.

Do not rely on dynamic typing, monkey patching, or runtime attribute creation.
