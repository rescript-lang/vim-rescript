# vim-rescript

**This is the official vim plugin for ReScript.**

> If you are experiencing any troubles, open an issue or visit our [Forum](https://forum.rescript-lang.org) and ask for guidance.

## Features

- Syntax highlighting for ReSript files
- Filetype detection for `.res`, `.resi`
- Basic automatic indentation

See `:h rescript` for the detailed [helpfile](./doc/rescript.txt).

## Installation

`vim-rescript` can be installed either manually or by using your favourite plugin manager.

```vim
" vim-plug
Plug 'rescript-lang/vim-rescript'

" Vundle
Plugin 'rescript-lang/vim-rescript'

" NeoBundle
NeoBundle 'rescript-lang/vim-rescript'
```

```lua
-- Lazy.nvim
{ 'rescript-lang/vim-rescript' }
```

You can also pin your installation to specific tags (check our releases [here](https://github.com/rescript-lang/vim-rescript/releases)):

With Plug:

```vim
Plug 'rescript-lang/vim-rescript', {'tag': 'v2.1.0'}
```

With Lazy:

```lua
{ 'rescript-lang/vim-rescript', tag = "v2.1.0" }
```

## Setup LSP

First you need install the language server for ReScript from npm

```sh
npm install -g @rescript/language-server
```

The binary is called `rescript-language-server`

### Neovim

Install the [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig) package and setup the LSP

```lua
local lspconfig = require('lspconfig')

lspconfig.rescriptls.setup()
```

For more details, see [server configuration](https://github.com/neovim/nvim-lspconfig/blob/master/doc/server_configurations.md#rescriptls)

### COC (Vim or Neovim)

(`:h rescript-coc`)

After the installation, open your coc config (`:CocConfig`) and add the following configuration:

```json
"languageserver": {
  "rescript": {
    "enable": true,
    "module": "rescript-language-server",
    "args": ["--node-ipc"],
    "filetypes": ["rescript"],
    "rootPatterns": ["bsconfig.json", "rescript.json"]
  }
}
```

<!-- ### Configure omnicomplete Support -->

<!-- (`:h rescript-omnicomplete`) -->

<!-- We support auto-completion with Vim's builtin `omnifunc`, which is triggered with `C-x C-o` in insert mode to look for autocomplete candidates. -->

<!-- > While omnicomplete's dialog is open, use `C-n` / `C-p` to navigate to the next / previous item -->

<!-- ```vim -->
<!-- " Hooking up the ReScript autocomplete function -->
<!-- set omnifunc=rescript#Complete -->

<!-- " When preview is enabled, omnicomplete will display additional -->
<!-- " information for a selected item -->
<!-- set completeopt+=preview -->
<!-- ``` -->

## Credits

- [amirales](https://github.com/amiralies): Started the plugin w/ syntax & indent functionality
