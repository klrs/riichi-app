This is the frontend package for the riichi-app software. It's meant to run on the user's browser. It's a Vite project, React with TypeScript.

This AGENTS.md file should always be applied when writing code for the `frontend` package in the monorepo!

## Best Practices

Use heavy type safety. DON'T use `any` unless absolutely needed! When writing functions, use the arrow syntax instead of the method syntax.

Write e2e tests for various features you code. E2E tests should be written with Playwright, and should be placed in the `@frontend/e2e` directory. If you need to mock e.g. API calls, use MSW library for this. The mocks are located in the `@frontend/e2e/mocks`

The frontend should be ALWAYS built as a mobile-first application. This means designing the layout and components with mobile screens in mind.

## Writing tests

For any new features you add, you should

## Validation

To validate your work, ALWAYS run the following commands before finishing up on new code or feature:

```
npm run build
npm run lint
npm run format:check
npm run test:e2e
```

If issues are found, fix them. Formatting issues can be fixed with `npm run format`.
