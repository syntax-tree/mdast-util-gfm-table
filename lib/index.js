/**
 * @import {Heading, InlineCode, Table, TableCell, TableRow} from 'mdast'
 * @import {Options as MarkdownTableOptions} from 'markdown-table'
 * @import {
 *   CompileContext,
 *   Extension as FromMarkdownExtension,
 *   Handle as FromMarkdownHandle,
 * } from 'mdast-util-from-markdown'
 * @import {
 *   Options as ToMarkdownExtension,
 *   Handle as ToMarkdownHandle,
 *   Info,
 *   Join,
 *   State
 * } from 'mdast-util-to-markdown'
 */

/**
 * @typedef Options
 *   Configuration.
 * @property {boolean | null | undefined} [tableCellPadding=true]
 *   Whether to add a space of padding between delimiters and cells (default:
 *   `true`).
 * @property {boolean | null | undefined} [tablePipeAlign=true]
 *   Whether to align the delimiters (default: `true`).
 * @property {MarkdownTableOptions['stringLength'] | null | undefined} [stringLength]
 *   Function to detect the length of table cell content, used when aligning
 *   the delimiters between cells (optional).
 */

import {ok as assert} from 'devlop'
import {markdownTable} from 'markdown-table'
import {defaultHandlers} from 'mdast-util-to-markdown'
import {toString} from 'mdast-util-to-string'
import {EXIT, visit} from 'unist-util-visit'

/**
 * Create an extension for `mdast-util-from-markdown` to enable GFM tables in
 * markdown.
 *
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-from-markdown` to enable GFM tables.
 */
export function gfmTableFromMarkdown() {
  return {
    enter: {
      table: enterTable,
      tableData: enterCell,
      tableHeader: enterCell,
      tableRow: enterRow
    },
    exit: {
      codeText: exitCodeText,
      table: exitTable,
      tableData: exit,
      tableHeader: exit,
      tableRow: exit
    }
  }
}

/**
 * Enter a table.
 *
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterTable(token) {
  const align = token._align
  assert(align, 'expected `_align` on table')
  // Trailing `position: undefined` keeps the table hidden class stable;
  // mdast-util-from-markdown's enter() patches the field to a real value
  // but the property already exists, so no shape transition fires.
  this.enter(
    {
      type: 'table',
      align: align.map(function (d) {
        return d === 'none' ? null : d
      }),
      children: [],
      position: undefined
    },
    token
  )
  this.data.inTable = true
}

/**
 * Exit a table.
 *
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitTable(token) {
  this.exit(token)
  this.data.inTable = undefined
}

/**
 * Enter a row.
 *
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterRow(token) {
  // See enterTable above for the rationale on the trailing position field.
  this.enter({type: 'tableRow', children: [], position: undefined}, token)
}

/**
 * Exit a row or cell.
 *
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exit(token) {
  this.exit(token)
}

/**
 * Enter a cell.
 *
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterCell(token) {
  // See enterTable above for the rationale on the trailing position field.
  this.enter({type: 'tableCell', children: [], position: undefined}, token)
}

/**
 * Exit code (text).
 *
 * Overwrites the default code text data handler to unescape escaped pipes
 * when they are in tables.
 *
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitCodeText(token) {
  let value = this.resume()

  if (this.data.inTable) {
    value = value.replace(/\\([\\|])/g, replace)
  }

  const node = this.stack[this.stack.length - 1]
  assert(node.type === 'inlineCode')
  node.value = value
  this.exit(token)
}

/**
 * Unescape an escaped pipe.
 *
 * @param {string} $0
 *   Whole match.
 * @param {string} $1
 *   Escaped character.
 * @returns {string}
 *   Replacement.
 */
function replace($0, $1) {
  // Pipes work, backslashes don’t (but can’t escape pipes).
  return $1 === '|' ? $1 : $0
}

/**
 * Create an extension for `mdast-util-to-markdown` to enable GFM tables in
 * markdown.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration.
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable GFM tables.
 */
export function gfmTableToMarkdown(options) {
  const settings = options || {}
  const {
    tableCellPadding: padding,
    tablePipeAlign: alignDelimiters,
    stringLength
  } = settings
  const around = padding ? ' ' : '|'

  return {
    handlers: {
      inlineCode: inlineCodeWithTable,
      table: handleTable,
      tableCell: handleTableCell,
      tableRow: handleTableRow
    },
    join: [joinTable],
    unsafe: [
      {character: '\r', inConstruct: 'tableCell'},
      {character: '\n', inConstruct: 'tableCell'},
      // A pipe, when followed by a tab or space (padding), or a dash or colon
      // (unpadded delimiter row), could result in a table.
      {atBreak: true, character: '|', after: '[\t :-]'},
      // A pipe in a cell must be encoded.
      {character: '|', inConstruct: 'tableCell'},
      // A colon must be followed by a dash, in which case it could start a
      // delimiter row.
      {atBreak: true, character: ':', after: '-'},
      // A delimiter row can also start with a dash, when followed by more
      // dashes, a colon, or a pipe.
      // This is a stricter version than the built in check for lists, thematic
      // breaks, and setex heading underlines though:
      // <https://github.com/syntax-tree/mdast-util-to-markdown/blob/51a2038/lib/unsafe.js#L57>
      {atBreak: true, character: '-', after: '[:|-]'}
    ]
  }

  /**
   * Serialize a table.
   *
   * @type {ToMarkdownHandle}
   * @param {Table} node
   *   Table.
   */
  function handleTable(node, _, state, info) {
    const matrix = handleTableAsData(node, state, info)
    const head = matrix[0]

    if (head) {
      let columns = node.align ? node.align.length : 0
      let index = -1

      if (!columns) {
        while (++index < matrix.length) {
          if (matrix[index].length > columns) columns = matrix[index].length
        }
      }

      while (head.length < columns) head.push('')
    }

    return serializeData(matrix, node.align)
  }

  /**
   * This function isn’t really used normally, because we handle rows at the
   * table level.
   * But, if someone passes in a table row, this ensures we make somewhat sense.
   *
   * @type {ToMarkdownHandle}
   * @param {TableRow} node
   *   Row.
   */
  function handleTableRow(node, _, state, info) {
    const row = handleTableRowAsData(node, state, info)
    const value = serializeData([row])
    // `markdown-table` will always add an align row
    return value.slice(0, value.indexOf('\n'))
  }

  /**
   * Serialize a cell.
   *
   * @type {ToMarkdownHandle}
   * @param {TableCell} node
   *   Cell.
   */
  function handleTableCell(node, _, state, info) {
    const exit = state.enter('tableCell')
    const subexit = state.enter('phrasing')
    const value = state.containerPhrasing(node, {
      ...info,
      before: around,
      after: around
    })
    subexit()
    exit()
    return value
  }

  /**
   * Serialize serialized cells as a table.
   *
   * @param {Array<Array<string>>} matrix
   *   Serialized cells.
   * @param {Array<string | null | undefined> | null | undefined} [align]
   *   Alignment.
   * @returns {string}
   *   Result.
   */
  function serializeData(matrix, align) {
    return markdownTable(matrix, {
      align,
      alignDelimiters,
      fillRows: false,
      padding,
      stringLength
    })
  }

  /**
   * Serialize the cells of a table.
   *
   * @param {Table} node
   *   Table.
   * @param {State} state
   *   State.
   * @param {Info} info
   *   Info.
   * @returns {Array<Array<string>>}
   *   Serialized cells.
   */
  function handleTableAsData(node, state, info) {
    const {children} = node
    let index = -1
    /** @type {Array<Array<string>>} */
    const result = []
    const subexit = state.enter('table')

    while (++index < children.length) {
      result[index] = handleTableRowAsData(children[index], state, info)
    }

    subexit()

    return result
  }

  /**
   * Serialize the cells of a row.
   *
   * @param {TableRow} node
   *   Row.
   * @param {State} state
   *   State.
   * @param {Info} info
   *   Info.
   * @returns {Array<string>}
   *   Serialized cells.
   */
  function handleTableRowAsData(node, state, info) {
    const {children} = node
    let index = -1
    /** @type {Array<string>} */
    const result = []
    const subexit = state.enter('tableRow')

    while (++index < children.length) {
      // Note: the positional info as used here is incorrect.
      // Making it correct would be impossible due to aligning cells?
      // And it would need copy/pasting `markdown-table` into this project.
      result[index] = handleTableCell(children[index], node, state, info)
    }

    subexit()

    return result
  }

  /**
   * Serialize inline code, escaping pipes in tables.
   *
   * @type {ToMarkdownHandle}
   * @param {InlineCode} node
   *   Inline code.
   */
  function inlineCodeWithTable(node, parent, state) {
    const value = defaultHandlers.inlineCode(node, parent, state)

    if (!state.stack.includes('tableCell')) return value

    // In a cell, the backslash before a pipe is dropped, also in code.
    // GitHub keeps a pipe in the cell when any backslash precedes it,
    // but micromark only when an odd number do,
    // as it sees `\\` as an escaped backslash
    // (see <https://github.com/github/cmark-gfm/issues/277>).
    /** @type {Array<string>} */
    const result = []
    let start = 0
    let index = value.indexOf('|')

    while (index !== -1) {
      let before = index

      while (before > start && value.charCodeAt(before - 1) === 92 /* `\` */) {
        before--
      }

      result.push(value.slice(start, index))
      if ((index - before) % 2 === 0) result.push('\\')
      start = index
      index = value.indexOf('|', index + 1)
    }

    result.push(value.slice(start))

    return result.join('')
  }
}

/**
 * Join a table and the flow after it.
 *
 * In a tight list item there are no blank lines between flow,
 * but text right after a table would be read as rows of it.
 *
 * @type {Join}
 */
function joinTable(left, right, parent, state) {
  if (
    left.type === 'table' &&
    parent.type === 'listItem' &&
    parent.spread === false &&
    (right.type === 'definition' ||
      (right.type === 'heading' && formatHeadingAsSetext(right, state)) ||
      right.type === 'paragraph' ||
      right.type === 'table')
  ) {
    return 1
  }
}

/**
 * Check whether a heading is serialized as a setext heading,
 * like `mdast-util-to-markdown` does.
 *
 * @param {Heading} node
 *   Heading.
 * @param {State} state
 *   Info passed around.
 * @returns {boolean}
 *   Whether the heading is serialized as a setext heading.
 */
function formatHeadingAsSetext(node, state) {
  let literalWithBreak = false

  visit(node, function (node) {
    if (
      node.type === 'break' ||
      ('value' in node && /\r?\n|\r/.test(node.value))
    ) {
      literalWithBreak = true
      return EXIT
    }
  })

  return Boolean(
    (!node.depth || node.depth < 3) &&
    toString(node) &&
    (state.options.setext || literalWithBreak)
  )
}
