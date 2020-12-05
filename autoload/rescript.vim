""" RESCRIPT EDITOR SPEC:


let s:rescript_plugin_dir = expand('<sfile>:p:h:h')

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
    let b:rescript_arch = "darwin"
  elseif has('win32')
    let b:rescript_arch = "win32"
  elseif has('unix')
    let b:rescript_arch = "linux"
  endif

  " Looks for the nearest node_modules directory
  let l:res_bin_dir = finddir('node_modules', ".;") . "/bs-platform/" . b:rescript_arch

  "if !exists("g:rescript_compile_exe")
  let g:rescript_compile_exe = l:res_bin_dir . "/bsc.exe"
  "endif

  "if !exists("g:rescript_build_exe")
  let g:rescript_build_exe = l:res_bin_dir . "/bsb.exe"
  "endif

  " Needed for state tracking of the formatting error state
  let s:got_format_err = 0
  let s:got_build_err = 0

  if !exists("g:rescript_editor_support_exe")
    let g:rescript_editor_support_exe = s:rescript_plugin_dir . "/rescript-vscode/extension/server/" . b:rescript_arch . "/rescript-editor-support.exe"
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

function! rescript#GetRescriptVscodeVersion()
  let l:out = readfile(s:rescript_plugin_dir . "/rescript-vscode/extension/package.json")

  try
    let l:json = json_decode(l:out)
    return l:json.version
  catch /.*/
    echo "Could not find rescript-vscode version"
    return "?"
  endtry
endfunction

function! rescript#DetectVersion()
  let l:command = g:rescript_compile_exe . " -version"

  silent let l:output = system(l:command)

  let l:version_list = matchlist(l:output, '.* \([0-9]\+\.[0-9]\+\.[0-9]\+.*\) (.*')

  if len(l:version_list) < 2
    let s:rescript_version = "0"
  else
    let s:rescript_version = l:version_list[1]
  endif

  
  return s:rescript_version
endfunction

function! rescript#Format()
  let l:ext = expand("%:e")

  if matchstr(l:ext, 'resi\?') == ""
    echo "Current buffer is not a .res / .resi file... Do nothing."
    return
  endif

  let l:view = winsaveview()

  " Used for stderr tracking
  let l:stderr_tmpname = tempname()
  call writefile([], l:stderr_tmpname)

  " Used for the actual buffer content
  " this is needed to because bsc -format can't
  " consume code from stdin, so we need to dump
  " the content into a temporary file first
  let l:tmpname = tempname() . "." . l:ext

  call writefile(getline(1, '$'), l:tmpname)

  " bsc -format myFile.res > tempfile
  let l:command = g:rescript_compile_exe . " -color never -format " . l:tmpname . " 2> " . l:stderr_tmpname

  silent let l:out = systemlist(l:command) 

  let l:stderr = readfile(l:stderr_tmpname)

  if v:shell_error ==? 0
    call s:DeleteLines(len(l:out), line('$'))
    call setline(1, l:out) 

    " Make sure syntax highlighting doesn't break
    syntax sync fromstart

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

  let l:command = g:rescript_editor_support_exe . " dump " . @%

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
    " In case our hover involves a reference, resolve that first
    let l:matches = matchlist(get(l:match, "hover", ""), '#\(\d\+\)')
    if len(l:matches) > 0
      let l:index = l:matches[1]
      let l:match = get(l:json, l:index)
    endif

    if get(l:match, "hover", "") != ""
      let md_content = l:match.hover

      let text = split(md_content, "\n")
      let lines = extend(["Pos (l:c): " . c_line . ":" . c_col], text)

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

function! rescript#JumpToDefinition()
  call rescript#highlight#StopHighlighting()

  " Make sure we are type hinting on a written file
  if &mod == 1
    echo "write"
    write
  endif

  let l:command = g:rescript_editor_support_exe . " dump " . @%

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
    if has_key(l:match, "definition")
      let l:def = l:match.definition

      if has_key(l:def, "uri")
        execute ":e " . l:def.uri
      endif

      let start_line = l:def.range.start.line + 1
      let start_col = l:def.range.start.character + 1
      let end_line = l:def.range.end.line + 1
      let end_col = l:def.range.end.character
      call cursor(start_line, start_col)

      let startPos = [start_line, start_col, end_col - start_col]
      let endPos = [end_line, end_col]
      let pos = [startPos, endPos]

      " If pos doesn't point to start: 0,0 and end: 0,0
      if pos != [[1, 1, -1], [1, 0]]
        call rescript#highlight#HighlightWord(pos)
      endif

      return
    endif
  endif
  echo "No definition found"
endfunction


" Item kind: https://github.com/cristianoc/reason-language-server/blob/dumpLocations/src/lsp/NewCompletions.re#L265
" value: 12
" type: 22
" attribute: 5
" constructor: 4
" filemodule: 9
" module: 9

let s:completeKinds = {
      \'12': "v",
      \'22': "t",
      \'5': "a",
      \'4': "c",
      \'9': "m",
      \}

function! rescript#Complete(findstart, base)
  let c_line = line(".")
  let c_col = col(".")

  if a:findstart
    return c_col
  endif

  let l:ext = expand("%:e")

  let l:tmpname = tempname() . "." . l:ext
  call writefile(getline(1, '$'), l:tmpname)

  let l:command = g:rescript_editor_support_exe . " complete " . @% . ":" . ( c_line - 1) . ":" . (c_col - 1) . " " . l:tmpname

  let out = system(l:command)

  let l:json = []
  try
    let l:json = json_decode(out)
  catch /.*/
    echo "No completion results"
    return
  endtry

  if type(l:json) != v:t_list
    echo "No completion results"
    return []
  endif

  let l:ret = []

  for item in l:json
    ":h complete-items
    let l:kind = get(s:completeKinds, string(item.kind), "v")

    let entry = { 'word': item.label, 'kind': l:kind, 'info': item.documentation.value }

    let l:ret = add(l:ret, entry)
  endfor

  call delete(l:tmpname)
  return l:ret
endfunction

function! rescript#BuildProject()
  let out = system(g:rescript_build_exe)

  " We don't rely too heavily on exit codes. If there's a compiler.log,
  " then there is either an error or a warning, so we rely on the existence
  " of the compiler.log as the source of truth instead
  let compilerLogFile = g:rescript_project_root . "/lib/bs/.compiler.log"
  let compilerLogExists = !empty(glob(compilerLogFile))

  if v:shell_error ==? 0 && compilerLogExists ==? 0
    let s:got_build_err = 0
  elseif v:shell_error ==? 2
    echo out
  else
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
      else
        " If we couldn't parse any proper errors, show the compiler log in a
        " preview instead
        call s:ShowInPreview("compiler-log", "text", split(out, "\n"))
      endif

      let s:got_build_err = 1
    else
      " basically empty compiler.log without entries
      let s:got_build_err = 0
    endif

  endif

  if s:got_build_err ==? 1
    echohl Error | echomsg "ReScript build failed." | echohl None
    return { 'has_error': 1, 'errors': l:errors }
  else
    echo "Build successful"

    " In case there was an open preview window that could
    " be stale by now
    pclose

    " Clear out qf list in case a previous build errors were fixed
    call setqflist([])
    cclose

    return { 'has_error': 0, 'errors': [] }
  endif
endfunction

function! rescript#ReasonToRescript()
  let l:ext = expand("%:e")

  if l:ext !=# "re" && l:ext !=# "rei"
    echo "Current buffer is not a .re / .rei file... Do nothing."
    return
  endif
  let l:command = g:rescript_compile_exe . " -format " . @%

  silent let l:out = systemlist(l:command)
  if v:shell_error ==? 0
    let l:target_ext = l:ext ==# "re" ? "res" : "resi"
    let l:res_file = expand("%:p:r") . "." . target_ext
    let l:original_file = expand("%:t")
    execute "silent! botright vsplit " . l:res_file
    let l:out = ["// This file was automatically converted to ReScript from '" .l:original_file . "'" ,
          \ "// Check the output and make sure to delete the original file"] + l:out
    call setline(1, l:out)
    echo "Reformatted successfully"
  else
    echo "Could not reformat Reason file to ReScript"
  endif
endfunction


function! rescript#Info()
  let l:version = "ReScript version: " . rescript#DetectVersion()

  echo l:version
  echo "Detected Config File: " . g:rescript_project_config
  echo "Detected Project Root: " . g:rescript_project_root
  echo "Detected rescript_editor_support_exe: " . g:rescript_editor_support_exe
  echo "Detected rescript_compile_exe: " . g:rescript_compile_exe
  echo "Detected rescript_build_exe: " . g:rescript_build_exe
  echo "Using rescript-vscode version: " . rescript#GetRescriptVscodeVersion()
endfunction
