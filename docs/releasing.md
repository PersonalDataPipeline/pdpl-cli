# Releasing

These are notes for maintainers and not pertinent for users of this library.

1. Commit all current changes
2. Make sure to `git commit` and `git push` all in-flight changes
3. `npm audit` and fix as needed
4. `npm run check-updates` to look for updates; focus on production
5. `npm run pre-commit` to make sure the compiled files are up to date
6. `npm exec oclif readme -- --readme-path='./docs/commands.md'` to update command documentation
7. `npm version VERSION -m "vX.X.X"` ([docs](https://docs.npmjs.com/cli/v10/commands/npm-version)) to update version in both files and create a tag in git
8. `git push --follow-tags`
9. Run `npm publish`