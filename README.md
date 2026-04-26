# vim-rescript

Vim runtime files for ReScript.

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
-- vim.pack builtin, require neovim 0.12+
vim.pack.add { 'https://github.com/rescript-lang/vim-rescript' }

-- Lazy.nvim
{ 'rescript-lang/vim-rescript', ft = 'rescript' }
```

You can also pin your installation to specific tags (check our releases [here](https://github.com/rescript-lang/vim-rescript/releases)):

With Plug:

```vim
Plug 'rescript-lang/vim-rescript', {'tag': 'v3.0.0'}
```

With [Lazy.nvim](https://github.com/folke/lazy.nvim):

```lua
{ 'rescript-lang/vim-rescript', tag = "v3.0.0" }
```

## Setup LSP

First you need install the language server for ReScript from npm

> **Note**
> If you are using [mason.nvim](https://github.com/williamboman/mason.nvim) you can install the ReScript Language Server using the command `MasonInstall rescript-language-server`

Or intall using npm:

```sh
npm install -g @rescript/language-server
```

The binary is called `rescript-language-server`

### Neovim LSP builtin

Install the [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig) package and setup the LSP

```lua
vim.lsp.config("rescriptls", {})
vim.lsp.enable("rescriptls")
```

For more details, see [server configuration](https://github.com/neovim/nvim-lspconfig/blob/master/doc/configs.md#rescriptls)

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
    "rootPatterns": ["rescript.json", "bsconfig.json"]
  }
}
```

## Tree Sitter

[Tree-sitter](https://tree-sitter.github.io/tree-sitter/) is a parser generator tool and incremental parsing library. Unlike regex-based syntax highlighting, Tree-sitter builds a full concrete syntax tree for a source file and updates it incrementally as you type. In Neovim, this enables more accurate, context-aware highlighting, smarter text objects, and structural navigation — none of which are possible with pattern matching alone.

### Syntax Highlighting Mechanisms in Neovim

Neovim supports three distinct highlighting mechanisms that can be used independently or layered on top of each other:

1. **Regex-based syntax (`:h syntax`)** — The classic Vim approach. Syntax rules are defined as regex patterns in `.vim` files. This is what `vim-rescript` provides by default and works in both Vim and Neovim without any additional dependencies.

2. **Tree-sitter (`:h treesitter`)** — Available since Neovim 0.5. Uses a parsed AST instead of regex patterns, producing more precise and context-aware highlighting. Requires a compiled parser for each language. This plugin ships Tree-sitter highlight queries in the `queries/rescript/` directory, which Neovim loads automatically once a ReScript parser is installed.

3. **LSP semantic tokens (`:h lsp-semantic_tokens`)** — Available since Neovim 0.9. The language server sends token data with semantic information about each symbol (e.g. distinguishing a local variable from a type alias or a module name). These are applied on top of Tree-sitter or regex highlights and provide the highest level of semantic accuracy.

When all three are active, they layer in that order: regex forms the base, Tree-sitter overrides it with structural context, and LSP semantic tokens refine it further with type information from the compiler.

### Installing the ReScript Parser

Neovim does not ship a ReScript parser. You need to install one separately.

[`nvim-treesitter`](https://github.com/nvim-treesitter/nvim-treesitter) is archived, meaning it no longer receives updates, but it still works and remains the most common way to install and manage parsers. Install it as a regular plugin.

Now, overwrite the parser config information to install the latest version of parser.

```lua
---@type ParserInfo
local rescript_parser = {
  install_info = {
    revision = 'v6.0.0',
    url = 'https://github.com/rescript-lang/tree-sitter-rescript',
    queries = 'queries/'
  },
}

vim.api.nvim_create_autocmd('User', {
  pattern = 'TSUpdate',
  callback = function()
    require('nvim-treesitter.parsers').rescript = rescript_parser
  end,
})

require('nvim-treesitter.parsers').rescript = rescript_parser
```

Now, open nvim and install using the command `TSInstall rescript`. Once a parser is installed, Neovim loads the Tree-sitter queries from this plugin automatically when you open a `.res` or `.resi` file.

## Credits

- [amirales](https://github.com/amiralies): Started the plugin w/ syntax & indent functionality
