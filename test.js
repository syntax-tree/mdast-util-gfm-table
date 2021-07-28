/**
 * @typedef {import('mdast').Table} Table
 */

import test from 'tape'
import stringWidth from 'string-width'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import {removePosition} from 'unist-util-remove-position'
import {gfmTable} from 'micromark-extension-gfm-table'
import {gfmTableFromMarkdown, gfmTableToMarkdown} from './index.js'

test('markdown -> mdast', (t) => {
  t.deepEqual(
    fromMarkdown('| a\n| -', {
      extensions: [gfmTable],
      mdastExtensions: [gfmTableFromMarkdown]
    }),
    {
      type: 'root',
      children: [
        {
          type: 'table',
          align: [null],
          children: [
            {
              type: 'tableRow',
              children: [
                {
                  type: 'tableCell',
                  children: [
                    {
                      type: 'text',
                      value: 'a',
                      position: {
                        start: {line: 1, column: 3, offset: 2},
                        end: {line: 1, column: 4, offset: 3}
                      }
                    }
                  ],
                  position: {
                    start: {line: 1, column: 1, offset: 0},
                    end: {line: 1, column: 4, offset: 3}
                  }
                }
              ],
              position: {
                start: {line: 1, column: 1, offset: 0},
                end: {line: 1, column: 4, offset: 3}
              }
            }
          ],
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 2, column: 4, offset: 7}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 2, column: 4, offset: 7}
      }
    },
    'should support tables'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('| `\\|` |\n | --- |', {
        extensions: [gfmTable],
        mdastExtensions: [gfmTableFromMarkdown]
      }),
      true
    ),
    {
      type: 'root',
      children: [
        {
          type: 'table',
          align: [null],
          children: [
            {
              type: 'tableRow',
              children: [
                {
                  type: 'tableCell',
                  children: [{type: 'inlineCode', value: '|'}]
                }
              ]
            }
          ]
        }
      ]
    },
    'should support an escaped pipe in code in a table cell'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('`\\|`', {
        extensions: [gfmTable],
        mdastExtensions: [gfmTableFromMarkdown]
      }),
      true
    ),
    {
      type: 'root',
      children: [
        {type: 'paragraph', children: [{type: 'inlineCode', value: '\\|'}]}
      ]
    },
    'should not support an escaped pipe in code *not* in a table cell'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('| `\\\\|`\\\\` b |\n | --- | --- |', {
        extensions: [gfmTable],
        mdastExtensions: [gfmTableFromMarkdown]
      }),
      true
    ),
    {
      type: 'root',
      children: [
        {
          type: 'table',
          align: [null, null],
          children: [
            {
              type: 'tableRow',
              children: [
                {type: 'tableCell', children: [{type: 'text', value: '`\\'}]},
                {
                  type: 'tableCell',
                  children: [
                    {type: 'inlineCode', value: '\\\\'},
                    {type: 'text', value: ' b'}
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    'should not support an escaped escape in code in a table cell'
  )

  t.end()
})

test('mdast -> markdown', (t) => {
  t.deepEqual(
    toMarkdown(
      {
        type: 'tableCell',
        children: [
          {type: 'text', value: 'a '},
          {type: 'emphasis', children: [{type: 'text', value: 'b'}]},
          {type: 'text', value: ' c.'}
        ]
      },
      {extensions: [gfmTableToMarkdown()]}
    ),
    'a *b* c.\n',
    'should serialize a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'tableRow',
        children: [
          {type: 'tableCell', children: [{type: 'text', value: 'a'}]},
          {
            type: 'tableCell',
            children: [
              {type: 'text', value: 'b '},
              {type: 'emphasis', children: [{type: 'text', value: 'c'}]},
              {type: 'text', value: ' d.'}
            ]
          }
        ]
      },
      {extensions: [gfmTableToMarkdown()]}
    ),
    '| a | b *c* d. |\n',
    'should serialize a table row'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'table',
        children: [
          {
            type: 'tableRow',
            children: [
              {type: 'tableCell', children: [{type: 'text', value: 'a'}]},
              {
                type: 'tableCell',
                children: [
                  {type: 'text', value: 'b '},
                  {type: 'emphasis', children: [{type: 'text', value: 'c'}]},
                  {type: 'text', value: ' d.'}
                ]
              }
            ]
          },
          {
            type: 'tableRow',
            children: [
              {type: 'tableCell', children: [{type: 'text', value: 'e'}]},
              {type: 'tableCell', children: [{type: 'inlineCode', value: 'f'}]}
            ]
          }
        ]
      },
      {extensions: [gfmTableToMarkdown()]}
    ),
    '| a | b *c* d. |\n| - | -------- |\n| e | `f`      |\n',
    'should serialize a table'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'table',
        align: [null, 'left', 'center', 'right'],
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
              {type: 'tableCell', children: [{type: 'text', value: 'aaa'}]},
              {type: 'tableCell', children: [{type: 'text', value: 'bbb'}]},
              {type: 'tableCell', children: [{type: 'text', value: 'ccc'}]},
              {type: 'tableCell', children: [{type: 'text', value: 'ddd'}]}
            ]
          }
        ]
      },
      {extensions: [gfmTableToMarkdown()]}
    ),
    '| a   | b   |  c  |   d |\n| --- | :-- | :-: | --: |\n| aaa | bbb | ccc | ddd |\n',
    'should align cells'
  )

  /** @type {Table} */
  const minitable = {
    type: 'table',
    align: [null, 'left', 'center', 'right'],
    children: [
      {
        type: 'tableRow',
        children: [
          {type: 'tableCell', children: [{type: 'text', value: 'a'}]},
          {type: 'tableCell', children: [{type: 'text', value: 'b'}]},
          {type: 'tableCell', children: [{type: 'text', value: 'c'}]}
        ]
      }
    ]
  }

  const minitableDefault = toMarkdown(minitable, {
    extensions: [gfmTableToMarkdown()]
  })

  t.deepEqual(
    toMarkdown(minitable, {
      extensions: [gfmTableToMarkdown({tableCellPadding: false})]
    }),
    '|a|b | c |\n|-|:-|:-:|\n',
    'should support `tableCellPadding: false`'
  )

  t.deepEqual(
    toMarkdown(minitable, {
      extensions: [gfmTableToMarkdown({tableCellPadding: true})]
    }),
    minitableDefault,
    'should support `tableCellPadding: true` (default)'
  )

  t.deepEqual(
    toMarkdown(minitable, {
      extensions: [gfmTableToMarkdown({tablePipeAlign: false})]
    }),
    '| a | b | c |\n| - | :- | :-: |\n',
    'should support `tablePipeAlign: false`'
  )

  t.deepEqual(
    toMarkdown(minitable, {
      extensions: [gfmTableToMarkdown({tablePipeAlign: true})]
    }),
    minitableDefault,
    'should support `tablePipeAlign: true` (default)'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'table',
        align: [],
        children: [
          {
            type: 'tableRow',
            children: [
              {type: 'tableCell', children: [{type: 'text', value: 'a'}]},
              {type: 'tableCell', children: [{type: 'text', value: '古'}]},
              {
                type: 'tableCell',
                children: [{type: 'text', value: '\u001B[1m古\u001B[22m'}]
              },
              {type: 'tableCell', children: [{type: 'text', value: '🤔'}]}
            ]
          }
        ]
      },
      {extensions: [gfmTableToMarkdown({stringLength: stringWidth})]}
    ),
    '| a | 古 | \u001B[1m古\u001B[22m | 🤔 |\n| - | -- | -- | -- |\n',
    'should support `stringLength`'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: '| a |\n| - |'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '\\| a |\n\\| - |\n',
    'should escape the leading pipe in what would start or continue a table'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a|\n-|'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    'a|\n\\-|\n',
    'should escape the leading dash in what could start a delimiter row (done by list dash)'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a\n:-'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    'a\n\\:-\n',
    'should escape the leading colon in what could start a delimiter row'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a\\b'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '`a\\b`\n',
    'should not escape a backslash in code in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a\\\\b'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '`a\\\\b`\n',
    'should not escape an “escaped” backslash in code in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a\\+b'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '`a\\+b`\n',
    'should not escape an “escaped” other punctuation character in code in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'inlineCode', value: 'a|b'},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '`a|b`\n',
    'should not escape a pipe character in code *not* in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a|b'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '`a\\|b`\n',
    'should escape a pipe character in code in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'text', value: 'a\nb'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    'a&#xA;b\n',
    'should escape eols in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'text', value: 'a|b'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    'a\\|b\n',
    'should escape pipes in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a|b|c'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '`a\\|b\\|c`\n',
    'should escape multiple pipes in inline code in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'text', value: 'a|b|c'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    'a\\|b\\|c\n',
    'should escape multiple pipes in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a||b'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '`a\\|\\|b`\n',
    'should escape adjacent pipes in inline code in a table cell'
  )
  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'text', value: 'a||b'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    'a\\|\\|b\n',
    'should escape adjacent pipes in a table cell'
  )

  t.end()
})
