# vim-rescript

This is the official vim plugin for baseline ReScript functionality withoutthe need of any third party plugins.

Its experimental features rely on the ReScript _type hint binary_ that is currently WIP (which is also used in rescript-vscode). More details on how to compile and configure this binary can be found in the Installation section.

The plugin provides essential features such as filtetype detection and syntax highlighting, and was designed to work in a `coc-vim` setup as well.

See `:h rescript` for the detailed helpfile.

## Requirements

Plugin works with projects based on `bs-platform@8.3` or later

## Features

**Enabled on load:**
- Syntax highlighting for ReSript files
- Filetype detection for `.res`, `.resi`
- Basic automatic indentation

**Additonal Functions:**
- Formatting `.res` files
- Convert existing `.re` /`.rei` files to `.res` /`.resi`

**Experimental:**
- Type Hinting for current cursor position
- Build command utilities
- Display syntax error / build error diagnostics in VIM quickfix
- Autocompletion w/ Vim's omnicomplete

## Installation

`vim-rescript` can be installed manually or your favourite plugin manager.

Plugin manager examples:

```viml
" Using vim-plug
Plug 'ryyppy/vim-rescript'

" Using Vundle
Plugin 'ryyppy/vim-rescript'

" Using NeoBundle
NeoBundle 'ryyppy/vim-rescript'
```

### Building the type hint binary

> Note: The following extra step will go away after we did a full release of our toolchain

We are currently using a forked version of RLS to be able to do type-hinting (without using an LSP client actually). To build the binary, do the following:

```
cd ~/Projects

git clone https://github.com/cristianoc/reason-language-server.git
git checkout dumpLocations

# You will need esy to build the project
esy
```

After a successful build, you will find a binary at path `_esy/default/build/install/default/bin/Bin`. To make things easier, we will symlink it:

```
cd ~/Projects/reason-language-server
ln -s bin.exe _esy/default/build/install/default/bin/Bin
```

Now open your vimrc file and add following line:

```
let g:rescript_type_hint_bin = "~/Projects/reason-language-server/bin.exe"
```

#### Testing the type hint binary

That's it! Now you should be able to use `RescriptTypeHint` on a `.res` file:

- Within a ReScript project, create a new `myfile.res`
- Add `let a = ""`
- Move your cursor above the empty string `""`
- Type `:RescriptTypeHint`. A preview window will open to show the type information

## Commands

```
:RescriptFormat
  Formats the current buffer

:UpgradeFromReason
  Reads from the current .re / .res file, and creates an equivalent .res / .resi file in the
  same path. Make sure to delete the original .re file before building.

:RescriptBuild
  [Experimental] builds your current project

:RescriptTypeHint
  [Experimental] Uses the g:rescript_type_hint_bin executable to extract type information of the current file and displays the right type hint for the current cursor position

:RescriptJumpToDefinition
  [Experimental] Uses the g:rescript_type_hint_bin executable to jump to the original definition of the entity on the current position

:RescriptInfo
  [Experimental] Opens a preview buffer with the current rescript plugin state
```

## Key Mappings

```viml
" Note that <buffer> allows us to use different commands with the same keybindings depending
" on the filetype. This is useful if to override your e.g. ALE bindings while working on
" ReScript projects.
autocmd FileType rescript nnoremap <silent> <buffer> <localleader>r :RescriptFormat<CR>
autocmd FileType rescript nnoremap <silent> <buffer> <localleader>t :RescriptTypeHint<CR>
autocmd FileType rescript nnoremap <silent> <buffer> <localleader>b :RescriptBuild<CR>
autocmd FileType rescript nnoremap <silent> <buffer> gd :RescriptJumpToDefinition<CR>
```

## Autocompletion

This plugin supports auto-completion with Vim's builtin `omnifunc`, that is triggered with `C-x C-o` in insert mode to look for autocomplete candidates.

> While omnicomplete's dialog is open, use `C-n` / `C-p` to navigated to the next / previous item

```viml
" Hooking up the Rescript autocomplete function
set omnifunc=rescript#Complete


" When preview is enabled, then omnicomplete will display additional
" infos for a selected item 
set completeopt+=preview
```

## Development

- Clone the repo
- `npm install` dependencies
- `make test` to run the tests

**Working within VIM**

First make sure to register your locally checked out vim-rescript project as a plugin within your vim configuration:

```
" vim-plug
`Plug ~/Projects/vim-rescript`
```

- Run `:PlugInstall` (you'll not see the plugin in the interactive vim-plug list, because it is a local project)
- You can open and edit functionality in any plugin file. After any changes, just run `:so %` in the same buffer to source the current file, then proceed to do your manual tests

**Integration Specs:**
For all the informal specs about editor integration & the ReScript platform, check out the [CONTRIBUTING](https://github.com/rescript-lang/rescript-vscode/blob/master/CONTRIBUTING.md) file of the rescript-vscode reference implementation.

## Credits

- [amirales](https://github.com/amiralies): Started the plugin w/ syntax & indent functionality
