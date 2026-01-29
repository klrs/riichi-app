This is the API for the riichi-app project. This is a Python package meant to run the YOLO model to recognize tiles, and to provide an easy-to-use JSON web API for the frontend that inputs the images of hands and other information related to the live game session.

## Commands

This is an uv project, so please use the uv commands to manage dependencies and to start the app.

For installing the repo dependencies use `uv sync`.

For adding a new dependency, use `uv add <dependency>`. This dependency will appear in the @pyproject.toml file. NEVER install dependencies outside uv.

For removing a dependency, use `uv remove <dependency>`.

To start the project, use `uv run main.py`.
