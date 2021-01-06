# Changelog

## master

## 1.2.0

** Improvements: **

- Upgrade to `rescript-vscode@1.4.0` (see changes [here](https://github.com/rescript-lang/rescript-vscode/blob/1.0.4/HISTORY.md#104))
- Add proper monorepo support (`e.g. yarn workspaces`)
  - Detects `bsb` / `bsc` correctly for each file separately and finds the right (sub-)project context
  - Heuristic for detecting the binaries: For the current file, find the nearest `node_modules/bs-platform` folder for the binaries
  - Adds an `augroup RescriptAutoProjectEnv` that sets the environment on every `.res` / `.resi` related read / write / new file event
  - Will also update the environment on each `format` and `build` call to make it sync up for all non-rescript buffers
  - On each env update, it updates the local working directory to the updated project root path as well
- Add new commands `:RescriptBuildWorld` and `:RescriptCleanWorld` for cleaning / building all sources + dependencies

** Bugfixes **

- Fixes issue with long template strings breaking the syntax highlighting
- Fixes an issue where `:RescriptBuild` would fail in non-rescript buffers due to a wrongly scoped script variable (was buffer only)

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
