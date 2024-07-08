# Releasing

These are notes for maintainers and not pertinent for users of this library.

1. Commit all current changes
2. Make sure to `git commit` and `git push` all in-flight changes
3. Run `npm audit` and fix as needed
4. Run `npm run check-updates` to look for updates; focus on production
5. Run `npm run pre-commit`
6. Run `npm version VERSION -m "Message ..."` ([docs](https://docs.npmjs.com/cli/v10/commands/npm-version))
7. `git push --follow-tags`
8. Run `npm run publish`