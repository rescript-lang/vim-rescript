## 1.0.8
Fixes:
- Diagnostics display for long lines.

Features:
- Full support for the newest `rescript` npm package!
- Highlight type parameters.

## 1.0.7

Fixes:
- Highlighting for some decorators and keywords.
- Various hover & autocomplete opportunities.

Features:
- Autocomplete for `->` pipe!
- Autocomplete for decorators such as `@module` and `@val` and `@deprecated`.
- Autocomplete for labels `func(~...)`.
- Support for the upcoming `rescript` npm package.

## 1.0.6

Fixes:
- Diagnostics crashing when a file's range isn't found (advice: use fewer ppxes that cause these bugs!). See [#77](https://github.com/rescript-lang/rescript-vscode/issues/77).
- Weird behaviors when project path contains white space.
- Proper audit of the windows bugs. Windows is now officially first-class!

Syntax colors:
- Highlight operators for default VSCode dark+ theme. This means slightly less diverse highlight for the other themes that previously already highlighted operators.
- Worked with [One Dark Pro](https://marketplace.visualstudio.com/items?itemName=zhuangtongfa.Material-theme) and [Mariana Pro](https://marketplace.visualstudio.com/items?itemName=rickynormandeau.mariana-pro). We now officially recommend these 2 themes, in addition to the existing recommendations in README.
- Highlight deprecated elements using the deprecation scopes.
- JSX bracket highlight fix (still no color; before, some parts were erroneously highlighted).

## 1.0.5

Features:
- Custom folding. See README.
- Support for doc strings when hovering on modules.
- Jump to type definition for types defined in inner modules.

Fixes:
- Properly highlight nested comments.
- Windows diagnostics!
- Removed a potential infinite loop issue in autocomplete.
- Don't autocomplete `open MyModule` inside line comments.
- Don't print parentheses as in `A()` for 0-ary variants.

## 1.0.4

- Some diagnostics watcher staleness fix.
- Various type hover fixes.
- Monorepo/yarn workspace support.

## 1.0.2

- All the usual features (type hint, autocomplete) now work on `bsconfig.json` too!
- Snippets, to ease a few syntaxes.
- Improved highlighting for polymorphic variants. Don't abuse them please.

## 1.0.1

- Fix temp file creation logic.

## 1.0.0

Official first release!
