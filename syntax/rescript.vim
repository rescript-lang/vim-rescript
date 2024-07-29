if exists("b:current_syntax")
  finish
endif

" See https://github.com/rescript-lang/vim-rescript/issues/14
syntax sync minlines=600

" Boolean
syntax keyword resBoolean true false

" Keywords
syntax keyword resKeyword let rec type external mutable lazy private of with
syntax keyword resKeyword if else switch when
syntax keyword resKeyword and as module constraint import export
syntax keyword resInclude open include
syntax keyword resRepeat for to downto while in
syntax keyword resException try catch exception assert
syntax keyword resKeyword async await

" Types
syntax keyword resType bool int float char string unit promise dict result
syntax keyword resType array option ref exn format
syntax match resType "list{\@!"

" Operators
syntax keyword resOperator mod land lor lxor lsl lsr asr
syntax keyword resOperator or

syntax match resOperator "\v\="

syntax match resOperator "\v\*"
syntax match resOperator "\v/"
syntax match resOperator "\v\+"
syntax match resOperator "\v-"

syntax match resOperator "\v\*\."
syntax match resOperator "\v/\."
syntax match resOperator "\v\+\."
syntax match resOperator "\v-\."

syntax match resOperator "\v\<"
syntax match resOperator "\v\<\="
syntax match resOperator "\v\>"
syntax match resOperator "\v\>\="

syntax match resOperator "\v\@"

syntax match resOperator "\v\!"
syntax match resOperator "\v\&"
syntax match resOperator "\v\:\>"
syntax match resOperator "\v\.\.\."

" Delimiter
syntax match resDelimiter "\v\|"

" Refs
syntax match resOperator "\v\:\="

" Arrows / Pipes
syntax match resArrowPipe "\v\=\>"
syntax match resArrowPipe "\v\-\>"
syntax match resArrowPipe "\v\|\>"
syntax match resArrowPipe "\v\@\@"

" Builtin functions
syntax match resFunction "list{\@="

" Comment
syntax region resSingleLineComment start="//" end="$" contains=resTodo,@Spell
syntax region resMultiLineComment start="/\*\s*" end="\*/" contains=@Spell,resTodo,resMultiLineComment

syntax keyword resTodo contained TODO FIXME XXX NOTE

" Char
syntax match resChar "\v'\\.'|'.'"

syntax match resNumber "-\=\<\d\(_\|\d\)*[l|L|n]\?\>"
syntax match resNumber "-\=\<0[x|X]\(\x\|_\)\+[l|L|n]\?\>"
syntax match resNumber "-\=\<0[o|O]\(\o\|_\)\+[l|L|n]\?\>"
syntax match resNumber "-\=\<0[b|B]\([01]\|_\)\+[l|L|n]\?\>"
syntax match resFloat "-\=\<\d\(_\|\d\)*\.\?\(_\|\d\)*\([eE][-+]\=\d\(_\|\d\)*\)\=\>"

" Module / Constructor
syntax match resModuleOrVariant "\v<[A-Z][A-Za-z0-9_'$]*"
syntax match resModuleChain "\v<[A-Z][A-Za-z0-9_'$]*\."

" Attribute
syntax match resAttribute "\v(\@|\@\@)([a-zA-z][A-Za-z0-9_']*)(\.([a-zA-z])[A-Za-z0-9_']*)*"

" Extension
syntax match resExtension "\v(\%|\%\%)([a-zA-z][A-Za-z0-9_']*)(\.([a-zA-z])[A-Za-z0-9_']*)*"

" String
syntax match resUnicodeChar "\v\\u[A-Fa-f0-9]\{4}" contained
syntax match resStringEscapeSeq "\v\\[\\"ntbrf]" contained
syntax match resInterpolatedStringEscapeSeq "\v\\[\\`ntbrf]" contained

syntax region resString start="\v\"" end="\v\"" contains=resStringEscapeSeq,resUnicodeChar

" Custom Operator
syntax region resCustomOperator start="\v\\\"" end="\v\""

" Interpolation
syntax match resInterpolationVariable "\v\$[a-z_][A-Za-z0-0_'$]*" contained
syntax region resInterpolationBlock matchgroup=resInterpolationDelimiters start="\v\$\{" end="\v\}" contained contains=TOP
syn region  resString start=+`+  skip=+\\\\\|\\`+  end=+`+	contains=resInterpolationBlock,resInterpolationVariable,resInterpolatedStringEscapeSeq

" Polymorphic variants
syntax match resPolyVariant "\v#[A-za-z][A-Za-z0-9_'$]*"
syntax match resPolyVariant "\v#[0-9]+"
syntax match resPolyVariant "\v#\".*\""
syntax match resPolyVariant "\v#\\\".*\""

" Errors
syn match    resBraceErr   "}"
syn match    resBrackErr   "\]"
syn match    resParenErr   ")"
syn match    resArrErr     "|]"

" Enclosing delimiters
syn region   resNone transparent matchgroup=resEncl start="(" matchgroup=resEncl end=")" contains=ALLBUT,resParenErr
syn region   resNone transparent matchgroup=resEncl start="{" matchgroup=resEncl end="}"  contains=ALLBUT,resBraceErr
syn region   resNone transparent matchgroup=resEncl start="\[" matchgroup=resEncl end="\]" contains=ALLBUT,resBrackErr
syn region   resNone transparent matchgroup=resEncl start="\[|" matchgroup=resEncl end="|\]" contains=ALLBUT,resArrErr

highlight default link resBoolean Boolean
highlight default link resKeyword Keyword
highlight default link resInclude Include
highlight default link resException Exception
highlight default link resRepeat Repeat
highlight default link resType Type
highlight default link resOperator Operator
highlight default link resArrowPipe Operator
highlight default link resDelimiter Operator
highlight default link resSingleLineComment Comment
highlight default link resMultiLineComment Comment
highlight default link resTodo TODO
highlight default link resChar Character
highlight default link resNumber Number
highlight default link resFloat Float
highlight default link resModuleOrVariant Function
highlight default link resPolyVariant Function
highlight default link resModuleChain Macro
highlight default link resUnicodeChar Character
highlight default link resStringEscapeSeq Character
highlight default link resInterpolatedStringEscapeSeq Character
highlight default link resString String
highlight default link resInterpolationDelimiters Macro
highlight default link resInterpolationVariable Macro
highlight default link resAttribute PreProc
highlight default link resExtension PreProc
highlight default link resEncl Keyword
highlight default link resFunction Function
highlight default link resCustomOperator String

let b:current_syntax = "rescript"
