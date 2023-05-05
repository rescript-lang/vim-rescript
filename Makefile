.PHONY: test test-ci

MYVIM ?= nvim --headless

INMAKE := 1
export INMAKE

test:
	@$(MYVIM) -u ./test/test_all.vim

test-syntax:
	nvim -l test/test-syntax.lua
	git diff --name-only --exit-code -- 'test/syntax/*.res.txt'
