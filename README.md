# vim-rescript

## Features

- Syntax highlighting for ReSript files
- Filetype detection for `.res`, `.resi`
- Basic automatic indentation
- Formatting `.res` files

## Installation

`vim-rescript` can be installed manually or your favourite plugin manager.

Plugin manager examples:

```viml
" Using vim-plug
Plug 'amiralies/vim-rescript'

" Using Vundle
Plugin 'amiralies/vim-rescript'

" Using NeoBundle
NeoBundle 'amiralies/vim-rescript'
```

## Key Mappings

This plugin doesn't come with builtin keymappings. This section should give you an idea on how to create your own keybindings.

```viml
autocmd FileType rescript nnoremap <buffer> <localleader>r :call rescript#Format()<CR>
```

## Development

- Clone the repo
- `npm install` dependencies
- `make test` to run the tests
