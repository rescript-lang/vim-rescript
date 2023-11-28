" Since Neovim 0.8 rescript is detected by vim.filetype API
if has('nvim-0.8')
    finish
endif
au BufRead,BufNewFile *.res set filetype=rescript
au BufRead,BufNewFile *.resi set filetype=rescript
