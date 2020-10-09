# vim-rescript

## Features

- Syntax highlighting for ReSript files
- Filetype detection for `.res`, `.resi`
- Basic automatic indentation
- Formatting `.res` files
- Utility commands for building your project

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
## Commands

```
:RescriptFormat
  Formats the current buffer

:RescriptBuild
  [Experimental] builds your current project

:RescriptTypeHint
  [Experimental] Uses the g:rescript_type_hint_bin executable to extract type information of the current file and displays the right type hint for the current cursor position

:RescriptInfo
  [Experimental] Opens a preview buffer with the current rescript plugin state
```

## Type Hint Window

This plugin uses a preview buffer to render madk

## Key Mappings

```viml
" Note that <buffer> allows us to use different commands with the same keybindings depending
" on the filetype. This is useful if to override your e.g. ALE bindings while working on
" ReScript projects.
autocmd FileType rescript nnoremap <silent> <buffer> <localleader>r :RescriptFormat<CR>
autocmd FileType rescript nnoremap <silent> <buffer> <localleader>t :RescriptTypeHint<CR>
autocmd FileType rescript nnoremap <silent> <buffer> <localleader>b :RescriptBuild<CR>
```

## Development

- Clone the repo
- `npm install` dependencies
- `make test` to run the tests

For all the specs about editor integration & the ReScript platform, check out the [CONTRIBUTING](https://github.com/rescript-lang/rescript-vscode/blob/master/CONTRIBUTING.md) file of the rescript-vscode reference implementation.

## Credits

- [amirales](https://github.com/amiralies): Started the plugin w/ syntax & indent functionality
