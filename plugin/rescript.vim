if !get(g:, 'vim_rescript_enabled', 1)
    finish
endif
let g:loaded_vim_rescript = 1

command! RescriptFormat call rescript#Format() 
command! RescriptBuild call rescript#BuildProject() 
command! RescriptBuildWorld call rescript#BuildProject("-make-world")
command! RescriptCleanWorld call rescript#BuildProject("-clean-world")
command! RescriptTypeHint call rescript#TypeHint()
command! RescriptInfo call rescript#Info()
command! RescriptJumpToDefinition call rescript#JumpToDefinition()
command! RescriptUpgradeFromReason call rescript#ReasonToRescript()

call rescript#Init()
