" Links to the reference implementation:
" - https://github.com/rescript-lang/rescript-vscode/blob/master/server/src/utils.ts
" - https://github.com/rescript-lang/rescript-vscode/blob/master/CONTRIBUTING.md
"


" Parses all syntax errors from the output of the ReScript syntax parser
"
" Every parsed filepath will be replaced with {filename} (useful for replacing
" temporary filenames)
"
" It returns a list of dicts containing the error information. Those dicts
" follow the same format as documented in |setqflist()|
function! rescript#parsing#ParseSyntaxParserOutput(stderr, filename)
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
      let l:tokens = matchlist(l:line, '.*\.res\s*:*\([0-9]\+\):\([0-9]\+\).*')
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
endfunction



function! rescript#parsing#ParseCompilerErrorOutput(output)
  " output: compiler output provided via .compiler.log
  " returns: a list of error tokens
  let l:errors = []

  let l:i = 0

  let item = {
        \'filedata': [],
        \'is_warning': 0,
        \'preview': "",
        \'text': ""}

  let l:filedata = []
  let text = ""

  " used for file preview: 2 spaces = start of error message
  let spaces = 0

  " warn_or_error, filedata, file_preview , error_msg
  let mode = "start_token"

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
      if l:i == l:last || trim(a:stderr[l:i+1]) ==# "We've found a bug for you!"
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
endfunction
