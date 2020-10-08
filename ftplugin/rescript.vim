""" RESCRIPT EDITOR SPEC:
""" https://github.com/rescript-lang/rescript-vscode/blob/master/CONTRIBUTING.md

" Inits the plugin variables, e.g. finding all the necessary binaries
function! s:Init()
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

  " Needed for state tracking of the formatting error state
  let s:got_format_err = 0
endfunction


function! s:DeleteLines(start, end) abort
    silent! execute a:start . ',' . a:end . 'delete _'
endfunction

function! rescript#DetectVersion()
  let l:command = g:resc_command . " -version"

  silent let l:output = system(l:command)

  let l:version_list = matchlist(l:output, '.* \([0-9]\+\.[0-9]\+\.[0-9]\+\) .*')

  if len(l:version_list) < 2
    let s:rescript_version = "0"
  else
    let s:rescript_version = l:version_list[1]
  endif
  
  return s:rescript_version
endfunction

function! s:ParseDiagnosticLocation(stderr, filename)
  " See: https://github.com/rescript-lang/rescript-vscode/blob/master/server/src/utils.ts#L53
  " stderr: stderr output with the diagnostic error lines
  " filename: the real filename handled here (instead of temp filename)
  "
  " returns: a list of error tokens
  let l:errors = []

  let l:i = 0

  let l:filedata = []
  let text = ""

  " used for file preview: 2 spaces = start of error message
  let spaces = 0

  " syntax_error, filedata, file_preview , error_msg
  let mode = "syntax_error"

  let l:last = len(a:stderr) - 1

  while l:i < len(a:stderr)
    let l:line = a:stderr[l:i]

    if mode ==? "syntax_error"
      if trim(l:line) ==# "Syntax error!"
        let mode = "filedata"
        let text = ""
      endif
    elseif mode ==? "filedata"
      let l:tokens = matchlist(l:line, '.*\.res \([0-9]\+\):\([0-9]\+\).*')
      if !empty(l:tokens)
        let l:filedata = l:tokens
        let mode = "file_preview"
      endif 
    elseif mode ==? "file_preview"
      if trim(l:line) == ""
        let spaces += 1
      endif
      if spaces == 2
        let mode = "error_msg"
        let spaces = 0
      endif
    elseif mode ==? "error_msg"
      if l:i == l:last || trim(a:stderr[l:i+1]) ==# "Syntax error!"
        if !empty(l:filedata)
          call add(l:errors, {"filename": a:filename,
                \"bufnr": bufnr(a:filename),
                \"lnum": l:filedata[1],
                \"col": l:filedata[2],
                \"type": "E",
                \"text": text})
          let l:filedata = []
        endif
        let text = ""
        let mode = "syntax_error"
      else
        let str = substitute(l:line, '^\s*\(.\{-}\)\s*$', '\1', '')
        if str != ""
          if text == ""
            let text = str
          else
            let text = text . " " . str
          endif
        endif
      endif

    endif
    let l:i += 1

  endwhile
  return l:errors

  for l:line in a:stderr
    " TODO: not sure if we can represent col:row -colEnd:rowEnd w/ quickfix
    " we leave it out for now
    let l:tokens = matchlist(l:line, '.*\.res \([0-9]\+\):\([0-9]\+\).*')
    if !empty(l:tokens)
      call add(l:errors, {"filename": a:filename,
            \"bufnr": bufnr(a:filename),
            \"lnum":	tokens[1],
            \"col":	tokens[2],
            \"type": "E",
            \"text":	"Syntax error"})
    endif
  endfor

  return []
  "return l:errors
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
  let l:command = g:resc_command . " -color never -format " . l:tmpname . " 2> " . l:stderr_tmpname

  silent let l:out = systemlist(l:command) 

  let l:stderr = readfile(l:stderr_tmpname)
  if v:shell_error ==? 0
    call s:DeleteLines(len(l:out), line('$'))
    call setline(1, l:out) 

    " Clear out location list in case a previous syntax error was fixed
    let s:got_format_err = 0
    call setqflist([])
    cclose
  else
    let l:stderr = readfile(l:stderr_tmpname)

    let l:errors = s:ParseDiagnosticLocation(l:stderr, @%)

    if !empty(l:errors)
      call setqflist(l:errors, 'r')
      botright cwindow
      cfirst
    endif

    let s:got_format_err = 1
    echohl Error | echomsg "rescript format returned an error" | echohl None
  endif

  call delete(l:stderr_tmpname)
  call delete(l:tmpname)

  call winrestview(l:view)

  if s:got_format_err ==? 1
    return { 'has_error': 1, 'errors': l:errors }
  else
    return { 'has_error': 0, 'errors': [] }
  endif
endfunction

call s:Init()

if exists(':RescriptFormat') != 2
  command RescriptFormat call rescript#Format() 
endif
