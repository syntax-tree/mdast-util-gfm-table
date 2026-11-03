# mdast-util-gfm-table

[![Build][badge-build-image]][badge-build-url]
[![Coverage][badge-coverage-image]][badge-coverage-url]
[![Downloads][badge-downloads-image]][badge-downloads-url]
[![Size][badge-size-image]][badge-size-url]

[mdast][github-mdast] extensions to parse and serialize [GFM][spec-gfm] tables.

## Contents

* [What is this?](#what-is-this)
* [When to use this](#when-to-use-this)
* [Install](#install)
* [Use](#use)
* [API](#api)
  * [`gfmTableFromMarkdown`](#gfmtablefrommarkdown)
  * [`gfmTableToMarkdown(options?)`](#gfmtabletomarkdownoptions)
  * [`Options`](#options)
* [Examples](#examples)
  * [Example: `stringLength`](#example-stringlength)
* [HTML](#html)
* [Syntax](#syntax)
* [Syntax tree](#syntax-tree)
  * [Nodes](#nodes)
  * [Enumeration](#enumeration)
  * [Content model](#content-model)
* [Types](#types)
* [Compatibility](#compatibility)
* [Related](#related)
* [Contribute](#contribute)
* [License](#license)

## What is this?

This package contains two extensions that add support for GFM table syntax in
markdown to [mdast][github-mdast].
These extensions plug into
[`mdast-util-from-markdown`][github-mdast-util-from-markdown]
(to support parsing tables in markdown into a syntax tree) and
[`mdast-util-to-markdown`][github-mdast-util-to-markdown]
(to support serializing tables in syntax trees to markdown).

## When to use this

You can use these extensions when you are working with
`mdast-util-from-markdown` and `mdast-util-to-markdown` already.

When working with `mdast-util-from-markdown`, you must combine this package
with [`micromark-extension-gfm-table`][github-micromark-extension-gfm-table].

When you don’t need a syntax tree, you can use [`micromark`][github-micromark]
directly with `micromark-extension-gfm-table`.

When you are working with syntax trees and want all of GFM, use
[`mdast-util-gfm`][github-mdast-util-gfm] instead.

All these packages are used in [`remark-gfm`][github-remark-gfm], which
focusses on making it easier to transform content by abstracting these
internals away.

This utility does not handle how markdown is turned to HTML.
That’s done by [`mdast-util-to-hast`][github-mdast-util-to-hast].

## Install

This package is [ESM only][github-gist-esm].
In Node.js (version 16+), install with [npm][npmjs-install]:

```sh
npm install mdast-util-gfm-table
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {gfmTableFromMarkdown, gfmTableToMarkdown} from 'https://esm.sh/mdast-util-gfm-table@2?bundle'
</script>
```

## Use

Say our document `example.md` contains:

```markdown
| a | b | c | d |
| - | :- | -: | :-: |
| e | f |
| g | h | i | j | k |
```

…and our module `example.js` looks as follows:

```js
import fs from 'node:fs/promises'
import {gfmTable} from 'micromark-extension-gfm-table'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {gfmTableFromMarkdown, gfmTableToMarkdown} from 'mdast-util-gfm-table'
import {toMarkdown} from 'mdast-util-to-markdown'

const doc = await fs.readFile('example.md')

const tree = fromMarkdown(doc, {
  extensions: [gfmTable()],
  mdastExtensions: [gfmTableFromMarkdown()]
})

console.log(tree)

const out = toMarkdown(tree, {extensions: [gfmTableToMarkdown()]})

console.log(out)
```

…now running `node example.js` yields (positional info removed for brevity):

```js
{
  type: 'root',
  children: [
    {
      type: 'table',
      align: [null, 'left', 'right', 'center'],
      children: [
        {
          type: 'tableRow',
          children: [
            {type: 'tableCell', children: [{type: 'text', value: 'a'}]},
            {type: 'tableCell', children: [{type: 'text', value: 'b'}]},
            {type: 'tableCell', children: [{type: 'text', value: 'c'}]},
            {type: 'tableCell', children: [{type: 'text', value: 'd'}]}
          ]
        },
        {
          type: 'tableRow',
          children: [
            {type: 'tableCell', children: [{type: 'text', value: 'e'}]},
            {type: 'tableCell', children: [{type: 'text', value: 'f'}]}
          ]
        },
        {
          type: 'tableRow',
          children: [
            {type: 'tableCell', children: [{type: 'text', value: 'g'}]},
            {type: 'tableCell', children: [{type: 'text', value: 'h'}]},
            {type: 'tableCell', children: [{type: 'text', value: 'i'}]},
            {type: 'tableCell', children: [{type: 'text', value: 'j'}]},
            {type: 'tableCell', children: [{type: 'text', value: 'k'}]}
          ]
        }
      ]
    }
  ]
}
```

```markdown
| a | b  |  c |  d  |
| - | :- | -: | :-: |
| e | f  |
| g | h  |  i |  j  | k |
```

## API

This package exports the identifiers
[`gfmTableFromMarkdown`][api-gfm-table-from-markdown] and
[`gfmTableToMarkdown`][api-gfm-table-to-markdown].
There is no default export.

### `gfmTableFromMarkdown`

Create an extension for
[`mdast-util-from-markdown`][github-mdast-util-from-markdown]
to enable GFM tables in markdown.

###### Returns

Extension for `mdast-util-from-markdown` to enable GFM tables
([`FromMarkdownExtension`][github-mdast-util-from-markdown-extension]).

### `gfmTableToMarkdown(options?)`

Create an extension for
[`mdast-util-to-markdown`][github-mdast-util-to-markdown]
to enable GFM tables in markdown.

###### Parameters

* `options` ([`Options`][api-options], optional)
  — configuration

###### Returns

Extension for `mdast-util-to-markdown` to enable GFM tables
([`ToMarkdownExtension`][github-mdast-util-to-markdown-options]).

### `Options`

Configuration (TypeScript type).

###### Fields

* `tableCellPadding` (`boolean`, default: `true`)
  — whether to add a space of padding between delimiters and cells
* `tablePipeAlign` (`boolean`, default: `true`)
  — whether to align the delimiters
* `stringLength` (`((value: string) => number)`, default: `s => s.length`)
  — function to detect the length of table cell content, used when aligning
  the delimiters between cells

## Examples

### Example: `stringLength`

It’s possible to align tables based on the visual width of cells.
First, let’s show the problem:

```js
import {gfmTable} from 'micromark-extension-gfm-table'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {gfmTableFromMarkdown, gfmTableToMarkdown} from 'mdast-util-gfm-table'
import {toMarkdown} from 'mdast-util-to-markdown'

const doc = `| Alpha | Bravo |
| - | - |
| 中文 | Charlie |
| 👩‍❤️‍👩 | Delta |`

const tree = fromMarkdown(doc, {
  extensions: [gfmTable()],
  mdastExtensions: [gfmTableFromMarkdown()]
})

console.log(toMarkdown(tree, {extensions: [gfmTableToMarkdown()]}))
```

The above code shows how these utilities can be used to format markdown.
The output is as follows:

```markdown
| Alpha    | Bravo   |
| -------- | ------- |
| 中文       | Charlie |
| 👩‍❤️‍👩 | Delta   |
```

To improve the alignment of these full-width characters and emoji, pass a
`stringLength` function that calculates the visual width of cells.
One such algorithm is [`string-width`][github-string-width].
It can be used like so:

```diff
@@ -2,6 +2,7 @@ import {gfmTable} from 'micromark-extension-gfm-table'
 import {fromMarkdown} from 'mdast-util-from-markdown'
 import {gfmTableFromMarkdown, gfmTableToMarkdown} from 'mdast-util-gfm-table'
 import {toMarkdown} from 'mdast-util-to-markdown'
+import stringWidth from 'string-width'

 const doc = `| Alpha | Bravo |
 | - | - |
@@ -13,4 +14,8 @@ const tree = fromMarkdown(doc, {
   mdastExtensions: [gfmTableFromMarkdown()]
 })

-console.log(toMarkdown(tree, {extensions: [gfmTableToMarkdown()]}))
+console.log(
+  toMarkdown(tree, {
+    extensions: [gfmTableToMarkdown({stringLength: stringWidth})]
+  })
+)
```

The output of our code with these changes is as follows:

```markdown
| Alpha | Bravo   |
| ----- | ------- |
| 中文  | Charlie |
| 👩‍❤️‍👩    | Delta   |
```

## HTML

This utility does not handle how markdown is turned to HTML.
That’s done by [`mdast-util-to-hast`][github-mdast-util-to-hast].

## Syntax

See [Syntax in
`micromark-extension-gfm-table`][github-micromark-extension-gfm-table-syntax].

## Syntax tree

The following interfaces are added to **[mdast][github-mdast]** by this utility.

### Nodes

#### `Table`

```idl
interface Table <: Parent {
  type: 'table'
  align: [alignType]?
  children: [TableContent]
}
```

**Table** (**[Parent][github-mdast-parent]**) represents two-dimensional data.

**Table** can be used where **[flow][api-flow-content]** content is expected.
Its content model is **[table][api-table-content]** content.

The *[head][github-unist-head]* of the node represents the labels of the
columns.

An `align` field can be present.
If present, it must be a list of **[alignTypes][api-align-type]**.
It represents how cells in columns are aligned.

For example, the following markdown:

```markdown
| foo | bar |
| :-- | :-: |
| baz | qux |
```

Yields:

```js
{
  type: 'table',
  align: ['left', 'center'],
  children: [
    {
      type: 'tableRow',
      children: [
        {
          type: 'tableCell',
          children: [{type: 'text', value: 'foo'}]
        },
        {
          type: 'tableCell',
          children: [{type: 'text', value: 'bar'}]
        }
      ]
    },
    {
      type: 'tableRow',
      children: [
        {
          type: 'tableCell',
          children: [{type: 'text', value: 'baz'}]
        },
        {
          type: 'tableCell',
          children: [{type: 'text', value: 'qux'}]
        }
      ]
    }
  ]
}
```

#### `TableRow`

```idl
interface TableRow <: Parent {
  type: "tableRow"
  children: [RowContent]
}
```

**TableRow** (**[Parent][github-mdast-parent]**) represents a row of cells in
a table.

**TableRow** can be used where **[table][api-table-content]** content is
expected.
Its content model is **[row][api-row-content]** content.

If the node is a *[head][github-unist-head]*,
it represents the labels of the columns for its parent **[Table][api-table]**.

For an example, see **[Table][api-table]**.

#### `TableCell`

```idl
interface TableCell <: Parent {
  type: "tableCell"
  children: [PhrasingContent]
}
```

**TableCell** (**[Parent][github-mdast-parent]**) represents a header cell in
a **[Table][api-table]**, if its parent is a *[head][github-unist-head]*,
or a data cell otherwise.

**TableCell** can be used where **[row][api-row-content]** content is expected.
Its content model is **[phrasing][github-mdast-phrasing-content]** content
excluding **[Break][github-mdast-break]** nodes.

For an example, see **[Table][api-table]**.

### Enumeration

#### `alignType`

```idl
enum alignType {
  'center' | 'left' | 'right' | null
}
```

**alignType** represents how phrasing content is aligned
([\[CSSTEXT\]][spec-css-text]).

* **`'left'`**: See the [`left`][spec-css-text-align-left] value of the
  `text-align` CSS property
* **`'right'`**: See the [`right`][spec-css-text-align-right] value of the
  `text-align` CSS property
* **`'center'`**: See the [`center`][spec-css-text-align-center] value of
  the `text-align` CSS property
* **`null`**: phrasing content is aligned as defined by the host environment

### Content model

#### `FlowContent` (GFM table)

```idl
type FlowContentGfm = Table | FlowContent
```

#### `TableContent`

```idl
type TableContent = TableRow
```

**Table** content represent the rows in a table.

#### `RowContent`

```idl
type RowContent = TableCell
```

**Row** content represent the cells in a row.

## Types

This package is fully typed with [TypeScript][].
It exports the additional type [`Options`][api-options].

The `Table`, `TableRow`, and `TableCell` types of the mdast nodes are exposed
from `@types/mdast`.

## Compatibility

Projects maintained by the unified collective are compatible with maintained
versions of Node.js.

When we cut a new major release, we drop support for unmaintained versions of
Node.
This means we try to keep the current release line, `mdast-util-gfm-table@^2`,
compatible with Node.js 16.

This utility works with `mdast-util-from-markdown` version 2+ and
`mdast-util-to-markdown` version 2+.

## Related

* [`remark-gfm`][github-remark-gfm]
  — remark plugin to support GFM
* [`mdast-util-gfm`][github-mdast-util-gfm]
  — same but all of GFM (autolink literals, footnotes, strikethrough, tables,
  tasklists)
* [`micromark-extension-gfm-table`][github-micromark-extension-gfm-table]
  — micromark extension to parse GFM tables

## Contribute

See [`contributing.md`][health-contributing] in
[`syntax-tree/.github`][health] for ways to get started.
See [`support.md`][health-support] for ways to get help.

This project has a [code of conduct][health-coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][file-license] © [Titus Wormer][wooorm]

<!-- Definitions -->

[api-align-type]: #aligntype

[api-flow-content]: #flowcontent-gfm-table

[api-gfm-table-from-markdown]: #gfmtablefrommarkdown

[api-gfm-table-to-markdown]: #gfmtabletomarkdownoptions

[api-options]: #options

[api-row-content]: #rowcontent

[api-table]: #table

[api-table-content]: #tablecontent

[badge-build-image]: https://github.com/syntax-tree/mdast-util-gfm-table/workflows/main/badge.svg

[badge-build-url]: https://github.com/syntax-tree/mdast-util-gfm-table/actions

[badge-coverage-image]: https://img.shields.io/codecov/c/github/syntax-tree/mdast-util-gfm-table.svg

[badge-coverage-url]: https://codecov.io/github/syntax-tree/mdast-util-gfm-table

[badge-downloads-image]: https://img.shields.io/npm/dm/mdast-util-gfm-table.svg

[badge-downloads-url]: https://www.npmjs.com/package/mdast-util-gfm-table

[badge-size-image]: https://img.shields.io/bundlejs/size/mdast-util-gfm-table

[badge-size-url]: https://bundlejs.com/?q=mdast-util-gfm-table

[esmsh]: https://esm.sh

[file-license]: license

[github-gist-esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[github-mdast]: https://github.com/syntax-tree/mdast

[github-mdast-break]: https://github.com/syntax-tree/mdast#break

[github-mdast-parent]: https://github.com/syntax-tree/mdast#parent

[github-mdast-phrasing-content]: https://github.com/syntax-tree/mdast#phrasingcontent

[github-mdast-util-from-markdown]: https://github.com/syntax-tree/mdast-util-from-markdown

[github-mdast-util-from-markdown-extension]: https://github.com/syntax-tree/mdast-util-from-markdown#extension

[github-mdast-util-gfm]: https://github.com/syntax-tree/mdast-util-gfm

[github-mdast-util-to-hast]: https://github.com/syntax-tree/mdast-util-to-hast

[github-mdast-util-to-markdown]: https://github.com/syntax-tree/mdast-util-to-markdown

[github-mdast-util-to-markdown-options]: https://github.com/syntax-tree/mdast-util-to-markdown#options

[github-micromark]: https://github.com/micromark/micromark

[github-micromark-extension-gfm-table]: https://github.com/micromark/micromark-extension-gfm-table

[github-micromark-extension-gfm-table-syntax]: https://github.com/micromark/micromark-extension-gfm-table#syntax

[github-remark-gfm]: https://github.com/remarkjs/remark-gfm

[github-string-width]: https://github.com/sindresorhus/string-width

[github-unist-head]: https://github.com/syntax-tree/unist#head

[health]: https://github.com/syntax-tree/.github

[health-coc]: https://github.com/syntax-tree/.github/blob/main/code-of-conduct.md

[health-contributing]: https://github.com/syntax-tree/.github/blob/main/contributing.md

[health-support]: https://github.com/syntax-tree/.github/blob/main/support.md

[npmjs-install]: https://docs.npmjs.com/cli/install

[spec-css-text]: https://drafts.csswg.org/css-text/

[spec-css-text-align-center]: https://drafts.csswg.org/css-text/#valdef-text-align-center

[spec-css-text-align-left]: https://drafts.csswg.org/css-text/#valdef-text-align-left

[spec-css-text-align-right]: https://drafts.csswg.org/css-text/#valdef-text-align-right

[spec-gfm]: https://github.github.com/gfm/

[typescript]: https://www.typescriptlang.org

[wooorm]: https://wooorm.com
