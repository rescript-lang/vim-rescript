[ANN] vim-rescript v3.0.0 release

Hi everyone!!!

We've just released the newest plugin for Vim. This release has some important changes.

We only provide the Vim runtime files that provide the following features:

1. Indentation
2. Syntax Highlight
3. Filetype detection
4. Commenting support (Neovim v10 (only) has a built-in commenting)

## Breaking Changes

- We removed the vendored server and native Vim commands (e.g `:RescriptBuild`, etc)

## Improvements

- Better syntax highlighting

The `rescript-language-server` server is a dedicated package published on NPM. Users must do
installation and setup to get all the features.

> If you are using [mason.nvim](https://github.com/williamboman/mason.nvim) you can install the ReScript Language Server using the command `MasonInstall rescript-language-server`. Also you can install LSP pre-release using `MasonInstall rescript-language-server@next --force`

> When installing LSP via `mason.nvim` the binary will be available inside Neovim only

Or install globally:

```sh
npm install -g @rescript/language-server
```

## Neovim LSP builtin users

Install nvim-lspconfig package.

```lua
local lspconfig = require('lspconfig')

lspconfig.rescriptls.setup{}
```

### How enable `incrementalTypechecking`?

```lua
lspconfig.rescriptls.setup{
  init_options = {
    extensionConfiguration = {
      incrementalTypechecking = {
        enabled = true
      },
    },
  },
}
```

For more details, see [server configuration](https://github.com/neovim/nvim-lspconfig/blob/master/doc/server_configurations.md#rescriptls)

## vim-coc users

Coc users can use LSP using `--stdio` or `--node-ipc` channel.

```json
"languageserver": {
  "rescript": {
    "enable": true,
    "module": "rescript-language-server",
    "args": ["--node-ipc"],
    "filetypes": ["rescript"],
    "rootPatterns": ["rescript.json", "bsconfig.json"]
  }
}
```

## ReScript grammar Tree-sitter

The Tree-sitter parser is now part of the `rescript-lang` organization, https://github.com/rescript-lang/tree-sitter-rescript.

It's been a while since Victor moved the repository. We still have to add support for the syntax changes introduced in v11. The parser has also been added to [`nvim-treesitter`](https://github.com/nvim-treesitter/nvim-treesitter), [PR](https://github.com/nvim-treesitter/nvim-treesitter/pull/6671).

The parser provides some important features in addition to highlight, indentation, language injection, folds and locals (used to extract keyword definitions, scopes, references, etc.).

You can install the parser with `TSInstall rescript`, more details [here](https://github.com/nvim-treesitter/nvim-treesitter?tab=readme-ov-file#modules)

The [nvim-treesitter-rescript](https://github.com/rescript-lang/nvim-treesitter-rescript) plugin is no longer needed and will be archived.
