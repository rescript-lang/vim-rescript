[ANN] vim-rescript v3.0.0 release

Hi everyone!!!

We've just released the newest plugin for Vim. This release has some important changes.

We only provide the Vim runtime files that provide the following features:

1. Indentation
2. Syntax Highlight
3. Filetype detection
4. Commenting support (Neovim v10 has a built-in commenting)

## Breaking Changes

- We removed the vendored server and native Vim commands (e.g `:RescriptBuild`, etc)

## Improvements

- Better syntax highlighting

The `rescript-language-server` server is a dedicated package published on NPM. Users must do
installation and setup to get all the features.

> If you are using [mason.nvim](https://github.com/williamboman/mason.nvim) you can install the ReScript Language Server using the command `MasonInstall rescript-language-server`

```sh
npm install -g @rescript/language-server
```

## Neovim LSP builtin users

Install nvim-lspconfig package.

```lua
local lspconfig = require('lspconfig')

lspconfig.rescriptls.setup{}
```

For more details, see [server configuration](https://github.com/neovim/nvim-lspconfig/blob/master/doc/server_configurations.md#rescriptls)

## vim-coc users

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
