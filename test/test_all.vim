" Original testing idea from:
" https://github.com/lervag/vimtex/blob/master/test/tests/test-paths/test.vim

set nocompatible
let &rtp = '.,' . &rtp

filetype plugin on

nnoremap q :qall!<cr>

" ---------- UTIL ------------------
" For formatting a list of qf errors to human readable strings
function! s:FormatErrorsToStrings(errors)
  let l:ret = []
  for l:err in a:errors
    let str = l:err.filename . " " . l:err.lnum . ":" . l:err.col . " -> " . l:err.text
    let l:ret = add(l:ret, str)
  endfor

  return l:ret
endfunction

if empty($INMAKE) | finish | endif

" ---------- TEST MAIN ------------------
" triggers the ftplugin loading
setfiletype rescript

function! InitTest()
  " This test fails if the initialization doesn't set the right
  " binary paths correctly (depending on the platform)

  if has('macunix')
    let l:platform = "darwin"
  elseif has('win32')
    let l:platform = "win32"
  elseif has('unix')
    let l:platform = "linux"
  endif

  call assert_equal("node_modules/bs-platform/" . l:platform . "/bsc.exe", g:resc_command)
  call assert_equal("node_modules/bs-platform/" . l:platform . "/bsb.exe", g:resb_command)
endfunction

function FormatErrorTest(fixtureName,...)
  " This test fails if given fixture .res file doesn't cause the same error as
  " defined in its .exp file
  "
  " fixtureName: name of the file in test/fixtures; e.g. 'let-binding' or 'spread'
  " writeFixture: bool. If 1, write a new fixture file
  let writeFixture= get(a:, 1, 0)

  let l:resFile = "test/fixtures/" . a:fixtureName . ".res"
  let l:expFile = "test/fixtures/" . a:fixtureName . ".exp"

  silent execute 'edit' l:resFile

  let ret = rescript#Format()
  let actual = s:FormatErrorsToStrings(ret.errors)
  let exp = readfile(l:expFile)

  if writeFixture == 1
    echo "WRITING NEW FIXTURE FILE: " . l:expFile
    let out = s:FormatErrorsToStrings(ret.errors)
    call writefile(out, l:expFile)
  endif

  call assert_equal(exp, actual, l:resFile . " and " . l:expFile . " do not match")

  execute 'bd!' l:resFile 
endfunction

function! FormatSuccessTest(fixtureName)
  " This test is successful if given fixture .res file formats successfully
  " fixtureName: name of the file in test/fixtures; e.g. 'let-binding' or 'spread'

  let l:resFile = "test/fixtures/" . a:fixtureName . ".res"

  silent execute 'edit' l:resFile

  let ret = rescript#Format()

  call assert_equal(0, ret.has_error, l:resFile . " should format correctly (but found " . len(ret.errors) . " errors)")

  execute 'bd!' l:resFile 
endfunction

" Call all the tests
call InitTest()

call FormatSuccessTest("should-format")

call FormatErrorTest("let-binding")
call FormatErrorTest("spread")
call FormatErrorTest("weird-numbers")

if len(v:errors) > 0
  echo printf(len(v:errors) . " tests failed\n")
  echo "--------ERROR RESULTS------------"
  for err in v:errors
    echo err
    echo "****"
  endfor
  cq
else
  echo "--------TESTS SUCCESSFUL------------"
endif

qa!
