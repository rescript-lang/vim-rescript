""" RESCRIPT EDITOR SPEC:
""" https://github.com/rescript-lang/rescript-vscode/blob/master/CONTRIBUTING.md

if has('macunix')
  let b:res_platform = "darwin"
elseif has('win32')
  let b:res_platform = "win32"
elseif has('unix')
  let b:res_platform = "linux"
endif

" Looks for the nearest node_modules directory
let g:res_bin_dir = finddir('node_modules', ".;") . "/bs-platform/" . b:res_platform

"if !exists("g:resc_command")
  let g:resc_command = g:res_bin_dir . "/bsc.exe"
"endif

"if !exists("g:resb_command")
  let g:resb_command = g:res_bin_dir . "/bsb.exe"
"endif

echo g:resb_command
echo g:resc_command

function! s:DeleteLines(start, end) abort
    silent! execute a:start . ',' . a:end . 'delete _'
endfunction

function! rescript#Format()
  let l:view = winsaveview()

  " Used for stderr tracking
  let l:stderr_tmpname = tempname()
  call writefile([], l:stderr_tmpname)

  " Used for the actual buffer content
  " this is needed to because bsc -format can't
  " consume code from stdin, so we need to dump
  " the content into a temporary file first
  let l:tmpname = tempname() . ".res"

  call writefile(getline(1, '$'), l:tmpname)

  " bsc -format myFile.res > tempfile
  let l:command = g:resc_command . " -format " . l:tmpname . " 2> " . l:stderr_tmpname

  let l:foo = readfile(l:tmpname)
  echo l:foo

  silent let l:out = systemlist(l:command) 
  echo l:command

  if v:shell_error == 0
    call s:DeleteLines(len(l:out), line('$'))
    call setline(1, l:out) 
  else
    echo "Format failed"
    let l:stderr = readfile(l:stderr_tmpname)
    echo l:stderr
    echo l:out
  endif

  call delete(l:stderr_tmpname)
  call delete(l:tmpname)

  call winrestview(l:view)
endfunction


