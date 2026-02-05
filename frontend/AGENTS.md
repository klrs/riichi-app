This is the frontend package for the riichi-app software. It's meant to run on the user's browser. It's a Vite project, React with TypeScript.

## Best Practices

Use heavy type safety. DON'T use `any` unless absolutely needed! When writing functions, use the arrow syntax instead of the method syntax.

Write e2e tests for various features you code. E2E tests should be written with Playwright, and should be placed in the `@frontend/e2e` directory. If you need to mock e.g. API calls, use MSW library for this. The mocks are located in the `@frontend/e2e/mocks`

## Validation

To validate your work, ALWAYS run the following commands:

```
npm run build
npm run lint
npm run format:check
npm run test:e2e
```

If issues are found, fix them. Formatting issues can be fixed with `npm run format`.
