if !get(g:, 'vim_rescript_enabled', 1)
    finish
endif

if exists("b:did_ftplugin")
    finish
endif
let b:did_ftplugin = 1

call rescript#Init()
