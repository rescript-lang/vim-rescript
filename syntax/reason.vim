if exists("b:current_syntax")
  finish
endif

" Boolean
syntax keyword reasonBoolean true false

" Keywords
syntax keyword reasonKeyword let val rec nonrec type external mutable
syntax keyword reasonKeyword if else switch fun
syntax keyword reasonKeyword and as open include module
syntax keyword reasonKeyword for to downto while
syntax keyword reasonKeyword try exception assert

" Types
syntax keyword reasonType bool int float char string unit
syntax keyword reasonType list array option ref exn format

" Operators
syntax keyword reasonOperator mod land lor lxor lsl lsr asr
syntax keyword reasonOperator or

syntax match reasonOperator "\v\="

syntax match reasonOperator "\v\*"
syntax match reasonOperator "\v/"
syntax match reasonOperator "\v\+"
syntax match reasonOperator "\v-"

syntax match reasonOperator "\v\*\."
syntax match reasonOperator "\v/\."
syntax match reasonOperator "\v\+\."
syntax match reasonOperator "\v-\."

syntax match reasonOperator "\v\<"
syntax match reasonOperator "\v\<\="
syntax match reasonOperator "\v\>"
syntax match reasonOperator "\v\>\="

syntax match reasonOperator "\v\@"

syntax match reasonOperator "\v\!"
syntax match reasonOperator "\v\|"
syntax match reasonOperator "\v\&"

" Refs
syntax match reasonOperator "\v\:\="
syntax match reasonOperator "\v\^"

" Arrows / Pipes
syntax match reasonArrowPipe "\v\=\>"
syntax match reasonArrowPipe "\v\-\>"
syntax match reasonArrowPipe "\v\|\>"
syntax match reasonArrowPipe "\v\@\@"

" Comment
syntax region reasonComment start="//" end="$" contains=reasonTodo,@Spell
syntax region reasonComment start="/\*\s*" end="\*/" contains=@Spell,reasonComment,reasonTodo

syntax keyword reasonTodo contained TODO FIXME XXX NOTE

" Char
syntax match reasonChar "\v'\\.'|'.'"

syntax match reasonNumber "-\=\<\d\(_\|\d\)*[l|L|n]\?\>"
syntax match reasonNumber "-\=\<0[x|X]\(\x\|_\)\+[l|L|n]\?\>"
syntax match reasonNumber "-\=\<0[o|O]\(\o\|_\)\+[l|L|n]\?\>"
syntax match reasonNumber "-\=\<0[b|B]\([01]\|_\)\+[l|L|n]\?\>"
syntax match reasonFloat "-\=\<\d\(_\|\d\)*\.\?\(_\|\d\)*\([eE][-+]\=\d\(_\|\d\)*\)\=\>"

" Module / Constructor
syntax match reasonModuleOrVariant "\v<[A-Z][A-Za-z0-9_'$]*"
syntax match reasonPolyVariant "\v`[A-za-z][A-Za-z0-9_'$]*"
syntax match reasonModuleChain "\v<[A-Z][A-Za-z0-9_'$]*\."

" String
syntax match reasonUnicodeChar "\v\\u[A-Fa-f0-9]\{4}" contained
syntax match reasonEscapedChar "\v\\[\\"'ntbrf]" contained
syntax region reasonString start="\v\"" end="\v\"" contains=reasonEscapedQuote,reasonEscapedChar,reasonUnicodeChar

syntax region reasonString start="\v\{\|" end="\v\|\}"

syntax match reasonBsInterpolationVariable "\v\$[a-z_][A-Za-z0-0_'$]*" contained
syntax region reasonString start="\v\{j\|" end="\v\|j\}" contains=reasonBsInterpolationVariable


highlight default link reasonBoolean Boolean
highlight default link reasonKeyword Keyword
highlight default link reasonType Type
highlight default link reasonOperator Operator
highlight default link reasonArrowPipe Operator
highlight default link reasonComment Comment
highlight default link reasonTodo TODO
highlight default link reasonChar Character
highlight default link reasonNumber Number
highlight default link reasonFloat Float
highlight default link reasonModuleOrVariant Function
highlight default link reasonPolyVariant Function
highlight default link reasonModuleChain Macro
highlight default link reasonUnicodeChar Character
highlight default link reasonEscapedChar Character
highlight default link reasonString String
highlight default link reasonBsInterpolationVariable Macro

let b:current_syntax = "reason"
