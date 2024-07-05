# Releasing

These are notes for maintainers and not pertinant for users of this library.

1. Commit all current changes
2. Run `npm audit` and fix as needed
3. Run `vpm version VERSION -m "Message ..."` ([docs](https://docs.npmjs.com/cli/v10/commands/npm-version))
4. Run `npm publish`