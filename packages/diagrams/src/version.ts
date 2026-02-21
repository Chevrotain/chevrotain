// needs a separate module as this is required inside productive code
// and also in the entry point (api.ts).
// A separate file avoids cyclic dependencies and bundler errors.
// TODO: this version is never updated
// TODO: consider reading it from the package.json directly?
export const VERSION = "11.1.1";
