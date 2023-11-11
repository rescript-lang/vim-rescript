.PHONY: test test-ci

test-syntax:
	nvim -l test/test-syntax.lua
	git diff --name-only --exit-code -- 'test/syntax/expected/*.res.txt'
