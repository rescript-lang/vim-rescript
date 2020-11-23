# Changelog

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
