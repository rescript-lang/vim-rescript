test-syntax:
	nvim -l test/test-syntax.lua
	git diff --exit-code -- 'test/syntax/expected/*.res.txt'
