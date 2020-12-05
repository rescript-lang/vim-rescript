# Changelog

## 1.1.0

**Improvements:**

- Add detected `rescript-vscode` plugin version for `:RescriptInfo`
- Upgrades to `rescript-vscode-1.0.1` with improved editor-support ([see changelog](https://github.com/rescript-lang/rescript-editor-support/blob/master/Changes.md#release-101-of-rescript-vscode))
- Improved syntax highlighting for ReScript decorators

**Breaking Changes:**

- Moved `rescript-vscode-1.0.0` to `rescript-vscode` (make sure to update your coc-vim config to point to the new path!)


## 1.0.1

- Fixes installation issues that required an additional `npm install` in the rescript-vscode vendor folder

## 1.0.0 "Zero Config"

- Vendor rescript-vscode-1.0.0 lsp + rescript-editor-support
- Fixes issue where certain compiler versions could not be detected (x.x.x-dev.y)
- `:RescriptInfo` now outputs more relevant executable paths for debugging purposes
- Updates `rescript#Complete()` to handle the new data format introduced in editor-support 1.0.0

**Breaking Changes:**

- `g:rescript_type_hint_bin` renamed to `g:rescript_editor_support_exe`
- `g:resc_command` renamed to `g:rescript_compile_exe`
- `g:resb_command` renamed to `g:rescript_build_exe`


## 0.0.0 "Experimental"
