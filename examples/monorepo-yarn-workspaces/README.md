# yarn workspaces monorepo example

This example setup is using the `yarn workspace` feature in combination with ReScript's `pinned-dependencies`.

**Expected IDE plugin behavior:**

When the editor is opened in one of the subprojects `app` or `common`, the editor extension should correctly detect the `bsc` and `bsb` binary in the monorepo root's `node_modules` directory.

```
cd app
nvim .
```

## Setup

```
cd examples/monorepo-yarn-workspaces
yarn

# Build the full project
cd app
yarn run build
```
