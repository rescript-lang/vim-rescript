# Contributing to vim-rescript

## Development

- Clone the repo
- `make test-syntax` to run the syntax tests, require Neovim >= 0.9.0

**Working within VIM**

First make sure to register your locally checked out vim-rescript project as a plugin within your vim configuration:

```vim
" vim-plug
Plug ~/Projects/vim-rescript
```

- Run `:PlugInstall` (you'll not see the plugin in the interactive vim-plug list, because it is a local project)
- You can open and edit functionality in any plugin file. After any changes, just run `:so %` in the same buffer to source the current file, then proceed to do your manual tests

### Syntax Tests

Syntax tests require Neovim >= 0.9.0

#### Adding new tests

- Create or edit a file at `test/syntax/` directory.
- Write some code and add a comment in the following format: `//^` below the code. The `^` indicates the capture location. Example:
  ```rescript
  let a = true
          //^
  ```
- Run `make test-syntax`
