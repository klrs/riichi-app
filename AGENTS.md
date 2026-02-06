This is a monorepo for the riichi-app project. The riichi-app is a collection of tools to track and aid with live Riichi Mahjong game sessions.

Currently the monorepo includes the following packages:

- `model`, an Python and uv package for training the model
- `api`, an Python and uv package for being the web JSON api for a frontend package to come
- `frontend`, a TypeScript Vite React project for the browser web app

For whatever package you are working with, read the respective AGENTS.md file located in each package root for extra instructions.

The riichi-app is currently deployed with Kamal to a virtual private server. Kamal configuration can be found on @config/deploy.yml.
