local cwd = vim.fn.getcwd()
local dir = '/test/syntax/'

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

      local loc = { line = number - 1, col = col }

      table.insert(locations, loc)
    end
  end

  for _, loc in ipairs(locations) do
    local item =
      vim.inspect_pos(bufnr, loc.line - 1, loc.col - 1, { syntax = true })
    loc.syntax = item.syntax
  end

  local fd = vim.loop.fs_open(path .. '.txt', 'w', 438)
  assert(vim.loop.fs_write(fd, vim.inspect(locations), 0))
  assert(vim.loop.fs_close(fd))
end

local files = { 'highlight.res' }

for _, file in ipairs(files) do
  main(file)
end
