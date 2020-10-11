""" RESCRIPT EDITOR SPEC:
""" https://github.com/rescript-lang/rescript-vscode/blob/master/CONTRIBUTING.md

" Util
" See: https://vi.stackexchange.com/questions/19056/how-to-create-preview-window-to-display-a-string
function! s:ShowInPreview(fname, fileType, lines)
    let l:command = "silent! pedit! +setlocal\\ " .
                  \ "buftype=nofile\\ nobuflisted\\ " .
                  \ "noswapfile\\ nonumber\\ " .
                  \ "filetype=" . a:fileType . " " . a:fname

    exe l:command

    if has('nvim')
        let l:bufNr = bufnr(a:fname)
        call nvim_buf_set_lines(l:bufNr, 0, -1, 0, a:lines)
    else
        call setbufline(a:fname, 1, a:lines)
    endif
endfunction

" Inits the plugin variables, e.g. finding all the necessary binaries
function! rescript#Init()
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
  let s:got_build_err = 0


  if !exists("g:rescript_type_hint_bin")
    let g:rescript_type_hint_bin = "bin.exe"
  endif


  " Not sure why, but adding a ".;" doesn't find bsconfig when
  " the editor was started without a specific file within the project
  let g:rescript_project_config = findfile("bsconfig.json")

  " Try to find the nearest .git folder instead
  if g:rescript_project_config == ""
    let g:rescript_project_root = finddir(".git/..", expand('%:p:h').';')
  else
    let g:rescript_project_root = fnamemodify(g:rescript_project_config, ":p:h")
  endif
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

    let l:errors = rescript#parsing#ParseCompilerErrorOutput(l:stderr)

    if !empty(l:errors)
      for l:err in l:errors
        let l:err.filename = @%
      endfor
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

function! rescript#TypeHint()
  call rescript#highlight#StopHighlighting()

  " Make sure we are type hinting on a written file
  if &mod == 1
    echo "write"
    write
  endif

  "let l:command = g:rescript_type_hint_bin . " dump " . @% 
  let l:command = g:rescript_type_hint_bin . " dump " . @%

  let out = system(l:command)

  if v:shell_error != 0
    echohl Error | echomsg "Type Info failed with exit code '" . v:shell_error . "'" | echohl None
    return
  endif

  let l:json = []
  try
    let l:json = json_decode(out)
  catch /.*/
    echo "No type info due to build error"
    return
  endtry

  let c_line = line(".")
  let c_col = col(".")  

  for item in l:json
    let start_line = item.range.start.line + 1
    let end_line = item.range.end.line + 1
    let start_col = item.range.start.character + 1
    let end_col = item.range.end.character

    if c_line >= start_line && c_line <= end_line
      if c_col >= start_col && c_col <= end_col
        let l:match = item
        break
      endif
    endif
  endfor

  if exists("l:match")
    if get(l:match, "hover") != 0
      let md_content = matchstr(l:match.hover, '```\zs.\{-}\ze```')
      if md_content == ""
        let md_content = l:match.hover
      endif

      let md_content = l:match.hover

      let text = split(md_content, "\n")
      let lines = extend(["Pos (l:c): " . c_line . ":" . c_col], text)
      "let lines = add(lines, string(l:json))

      call s:ShowInPreview("type-preview", "markdown", lines)

      " calculate pos for matchadd
      let start_line = item.range.start.line + 1
      let end_line = item.range.end.line + 1
      let start_col = item.range.start.character + 1
      let end_col = item.range.end.character

      let startPos = [start_line, start_col, end_col - start_col]
      let endPos = [end_line, end_col]

      let pos = [startPos, endPos]

      call rescript#highlight#HighlightWord(pos)
      return
    endif
  endif
  echo "No type info"
endfunction

function! rescript#BuildProject()
  let out = system(g:resb_command)

  if v:shell_error ==? 0
    echo "Build successfully"

    " Clear out qf list in case a previous build errors were fixed
    let s:got_build_err = 0
    call setqflist([])
    cclose
  else
    let compilerLogFile = g:rescript_project_root . "/lib/bs/.compiler.log" 

    let lines = readfile(compilerLogFile)
    let l:entries = rescript#parsing#ParseCompilerLogEntries(lines)
    if !empty(l:entries)
      let l:last = l:entries[len(l:entries)-1]
      let l:errors = rescript#parsing#ParseCompilerErrorOutput(l:last)

      if !empty(l:errors)
        let i = 0
        let errNum = -1
        while i < len(l:errors)
          let l:err = l:errors[i]
          if l:err.filename ==# expand("%:p")
            " cc is 1 based
            let errNum = i + 1
            break
          endif
          let i = i + 1
        endwhile
        call setqflist(l:errors, 'r')
        botright cwindow
        if errNum > -1
          execute ":cc " . errNum
        else
          cfirst
        endif
      endif

      let s:got_build_err = 1
      echohl Error | echomsg "ReScript build failed." | echohl None
    endif

  endif

  if s:got_build_err ==? 1
    return { 'has_error': 1, 'errors': l:errors }
  else
    return { 'has_error': 0, 'errors': [] }
  endif
endfunction


function! rescript#Info()
  let l:version = "ReScript version: " . rescript#DetectVersion()

  echo l:version
  echo "Detected Config File: " . g:rescript_project_config
  echo "Detected Project Root: " . g:rescript_project_root
  echo "ReScript Type Hint Binary: " . g:rescript_type_hint_bin
endfunction
