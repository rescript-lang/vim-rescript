" Some useful resources:
" Highlighting: https://github.com/dominikduda/vim_current_word/blob/master/autoload/vim_current_word.vim

let s:matches = [] 

if !hlexists("RescriptHighlight")
  " TODO: make colors configurable
  hi link RescriptHighlight IncSearch
endif

function! rescript#highlight#HighlightWord(pos)
  "let id = matchadd('RescriptHighlight', '\S*\%#\S*', 5)
  let id = matchaddpos('RescriptHighlight', a:pos)
  let s:matches = add(s:matches, id)
  augroup RescriptHighlighting
    au!
    autocmd InsertEnter <buffer> call rescript#highlight#StopHighlighting()
    autocmd BufWinLeave <buffer> call rescript#highlight#StopHighlighting()
  augroup END
endfunction

function! rescript#highlight#StopHighlighting()
  for item in s:matches
    call matchdelete(item)
  endfor
  let s:matches = []

  augroup RescriptHighlighting
    au!
  augroup END
endfunction
