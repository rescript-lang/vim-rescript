local cwd = vim.fn.getcwd()
local dir = '/test/syntax/'
local expected_dir = '/test/syntax/expected'

local FILES = { 'highlight.res' }

local function main(file)
  -- Load syntax file
  local path = cwd .. dir .. file

  vim.cmd.edit(path)
  vim.cmd.source(cwd .. '/syntax/rescript.vim')

  local bufnr = vim.api.nvim_get_current_buf()
  local lines = vim.api.nvim_buf_get_lines(bufnr, 0, -1, true)

  local pattern = '//^'
  local locations = {}

  for number, line in ipairs(lines) do
    local is_start_pattern = vim.startswith(vim.trim(line), pattern)
    local is_valid = number - 1 > 0
      and not vim.startswith(vim.trim(lines[number - 1]), pattern)

    if is_start_pattern and is_valid then
      local start_match, _ = string.find(line, pattern)

      local col = start_match - 1 + string.len(pattern)

      local item =
        vim.inspect_pos(bufnr, number - 2, col - 2, { syntax = true })

      table.insert(
        locations,
        { row = item.row, col = item.col, syntax = item.syntax }
      )
    end
  end

  local output_file = cwd .. expected_dir .. '/' .. file .. '.txt'

  local fd = vim.loop.fs_open(output_file, 'w', 438)
  vim.loop.fs_write(fd, vim.inspect(locations), 0)
  vim.loop.fs_close(fd)
end

for _, file in ipairs(FILES) do
  main(file)
end
