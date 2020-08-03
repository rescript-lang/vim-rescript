if exists("b:current_syntax")
  finish
endif

" Boolean
syntax keyword bsBoolean true false

" Keywords
syntax keyword bsKeyword let val rec nonrec type external mutable
syntax keyword bsKeyword if else switch fun
syntax keyword bsKeyword and as open include module
syntax keyword bsKeyword for to downto while
syntax keyword bsKeyword try catch exception assert

" Types
syntax keyword bsType bool int float char string unit
syntax keyword bsType list array option ref exn format

" Operators
syntax keyword bsOperator mod land lor lxor lsl lsr asr
syntax keyword bsOperator or

syntax match bsOperator "\v\="

syntax match bsOperator "\v\*"
syntax match bsOperator "\v/"
syntax match bsOperator "\v\+"
syntax match bsOperator "\v-"

syntax match bsOperator "\v\*\."
syntax match bsOperator "\v/\."
syntax match bsOperator "\v\+\."
syntax match bsOperator "\v-\."

syntax match bsOperator "\v\<"
syntax match bsOperator "\v\<\="
syntax match bsOperator "\v\>"
syntax match bsOperator "\v\>\="

syntax match bsOperator "\v\@"

syntax match bsOperator "\v\!"
syntax match bsOperator "\v\|"
syntax match bsOperator "\v\&"

" Refs
syntax match bsOperator "\v\:\="

" Arrows / Pipes
syntax match bsArrowPipe "\v\=\>"
syntax match bsArrowPipe "\v\-\>"
syntax match bsArrowPipe "\v\|\>"
syntax match bsArrowPipe "\v\@\@"

" Comment
syntax region bsComment start="//" end="$" contains=bsTodo,@Spell
syntax region bsComment start="/\*\s*" end="\*/" contains=@Spell,bsComment,bsTodo

syntax keyword bsTodo contained TODO FIXME XXX NOTE

" Char
syntax match bsChar "\v'\\.'|'.'"

syntax match bsNumber "-\=\<\d\(_\|\d\)*[l|L|n]\?\>"
syntax match bsNumber "-\=\<0[x|X]\(\x\|_\)\+[l|L|n]\?\>"
syntax match bsNumber "-\=\<0[o|O]\(\o\|_\)\+[l|L|n]\?\>"
syntax match bsNumber "-\=\<0[b|B]\([01]\|_\)\+[l|L|n]\?\>"
syntax match bsFloat "-\=\<\d\(_\|\d\)*\.\?\(_\|\d\)*\([eE][-+]\=\d\(_\|\d\)*\)\=\>"

" Module / Constructor
syntax match bsModuleOrVariant "\v<[A-Z][A-Za-z0-9_'$]*"
syntax match bsPolyVariant "\v#[A-za-z][A-Za-z0-9_'$]*"
syntax match bsModuleChain "\v<[A-Z][A-Za-z0-9_'$]*\."

" String
syntax match bsUnicodeChar "\v\\u[A-Fa-f0-9]\{4}" contained
syntax match bsEscapedChar "\v\\[\\"'ntbrf]" contained
syntax region bsString start="\v\"" end="\v\"" contains=bsEscapedQuote,bsEscapedChar,bsUnicodeChar

syntax match bsInterpolationVariable "\v\$[a-z_][A-Za-z0-0_'$]*" contained
syntax region bsString start="\v`" end="\v`" contains=bsInterpolationVariable
syntax region bsString start="\v[a-z]`" end="\v`" contains=bsInterpolationVariable


highlight default link bsBoolean Boolean
highlight default link bsKeyword Keyword
highlight default link bsType Type
highlight default link bsOperator Operator
highlight default link bsArrowPipe Operator
highlight default link bsComment Comment
highlight default link bsTodo TODO
highlight default link bsChar Character
highlight default link bsNumber Number
highlight default link bsFloat Float
highlight default link bsModuleOrVariant Function
highlight default link bsPolyVariant Function
highlight default link bsModuleChain Macro
highlight default link bsUnicodeChar Character
highlight default link bsEscapedChar Character
highlight default link bsString String
highlight default link bsInterpolationVariable Macro

let b:current_syntax = "bucklescript"
