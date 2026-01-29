This is the frontend package for the riichi-app software. It's meant to run on the user's browser. It's a Vite project, React with TypeScript.

## Best Practices

Use heavy type safety. DON'T use `any` unless absolutely needed! When writing functions, use the arrow syntax instead of the method syntax.

## Validation

To validate your work, ALWAYS run the following commands:

```
npm run lint
npm run format:check
npm run test:e2e
```

If issues are found, fix them. Formatting issues can be fixed with `npm run format`.
