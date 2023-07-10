/**
 * @typedef {import('mdast').Table} Table
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import stringWidth from 'string-width'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import {removePosition} from 'unist-util-remove-position'
import {gfmTable} from 'micromark-extension-gfm-table'
import {gfmTableFromMarkdown, gfmTableToMarkdown} from './index.js'
import * as mod from './index.js'

test('core', () => {
  assert.deepEqual(
    Object.keys(mod).sort(),
    ['gfmTableFromMarkdown', 'gfmTableToMarkdown'],
    'should expose the public api'
  )
})

test('gfmTableFromMarkdown', () => {
  assert.deepEqual(
    fromMarkdown('| a\n| -', {
      extensions: [gfmTable()],
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

  assert.deepEqual(
    fromMarkdown('| a | b | c | d |\n| - | :- | -: | :-: |', {
      extensions: [gfmTable()],
      mdastExtensions: [gfmTableFromMarkdown]
    }),
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
                    end: {line: 1, column: 5, offset: 4}
                  }
                },
                {
                  type: 'tableCell',
                  children: [
                    {
                      type: 'text',
                      value: 'b',
                      position: {
                        start: {line: 1, column: 7, offset: 6},
                        end: {line: 1, column: 8, offset: 7}
                      }
                    }
                  ],
                  position: {
                    start: {line: 1, column: 5, offset: 4},
                    end: {line: 1, column: 9, offset: 8}
                  }
                },
                {
                  type: 'tableCell',
                  children: [
                    {
                      type: 'text',
                      value: 'c',
                      position: {
                        start: {line: 1, column: 11, offset: 10},
                        end: {line: 1, column: 12, offset: 11}
                      }
                    }
                  ],
                  position: {
                    start: {line: 1, column: 9, offset: 8},
                    end: {line: 1, column: 13, offset: 12}
                  }
                },
                {
                  type: 'tableCell',
                  children: [
                    {
                      type: 'text',
                      value: 'd',
                      position: {
                        start: {line: 1, column: 15, offset: 14},
                        end: {line: 1, column: 16, offset: 15}
                      }
                    }
                  ],
                  position: {
                    start: {line: 1, column: 13, offset: 12},
                    end: {line: 1, column: 18, offset: 17}
                  }
                }
              ],
              position: {
                start: {line: 1, column: 1, offset: 0},
                end: {line: 1, column: 18, offset: 17}
              }
            }
          ],
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 2, column: 22, offset: 39}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 2, column: 22, offset: 39}
      }
    },
    'should support alignment'
  )

  let tree = fromMarkdown('| `\\|` |\n | --- |', {
    extensions: [gfmTable()],
    mdastExtensions: [gfmTableFromMarkdown]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
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

  tree = fromMarkdown('`\\|`', {
    extensions: [gfmTable()],
    mdastExtensions: [gfmTableFromMarkdown]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
    {
      type: 'root',
      children: [
        {type: 'paragraph', children: [{type: 'inlineCode', value: '\\|'}]}
      ]
    },
    'should not support an escaped pipe in code *not* in a table cell'
  )

  tree = fromMarkdown('| `\\\\|`\\\\` b |\n | --- | --- |', {
    extensions: [gfmTable()],
    mdastExtensions: [gfmTableFromMarkdown]
  })

  removePosition(tree, {force: true})

  assert.deepEqual(
    tree,
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
})

test('gfmTableToMarkdown', () => {
  assert.deepEqual(
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

  assert.deepEqual(
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

  assert.deepEqual(
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

  assert.deepEqual(
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

  assert.deepEqual(
    toMarkdown(minitable, {
      extensions: [gfmTableToMarkdown({tableCellPadding: false})]
    }),
    '|a|b | c |\n|-|:-|:-:|\n',
    'should support `tableCellPadding: false`'
  )

  assert.deepEqual(
    toMarkdown(minitable, {
      extensions: [gfmTableToMarkdown({tableCellPadding: true})]
    }),
    minitableDefault,
    'should support `tableCellPadding: true` (default)'
  )

  assert.deepEqual(
    toMarkdown(minitable, {
      extensions: [gfmTableToMarkdown({tablePipeAlign: false})]
    }),
    '| a | b | c |\n| - | :- | :-: |\n',
    'should support `tablePipeAlign: false`'
  )

  assert.deepEqual(
    toMarkdown(minitable, {
      extensions: [gfmTableToMarkdown({tablePipeAlign: true})]
    }),
    minitableDefault,
    'should support `tablePipeAlign: true` (default)'
  )

  assert.deepEqual(
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
              {type: 'tableCell', children: [{type: 'text', value: '🤔'}]}
            ]
          }
        ]
      },
      {extensions: [gfmTableToMarkdown({stringLength: stringWidth})]}
    ),
    '| a | 古 | 🤔 |\n| - | -- | -- |\n',
    'should support `stringLength`'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: '| a |\n| - |'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '\\| a |\n\\| - |\n',
    'should escape the leading pipe in what would start or continue a table'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a|\n-|'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    'a|\n\\-|\n',
    'should escape the leading dash in what could start a delimiter row (done by list dash)'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a\n:-'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    'a\n\\:-\n',
    'should escape the leading colon in what could start a delimiter row'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a\\b'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '`a\\b`\n',
    'should not escape a backslash in code in a table cell'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a\\\\b'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '`a\\\\b`\n',
    'should not escape an “escaped” backslash in code in a table cell'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a\\+b'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '`a\\+b`\n',
    'should not escape an “escaped” other punctuation character in code in a table cell'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'inlineCode', value: 'a|b'},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '`a|b`\n',
    'should not escape a pipe character in code *not* in a table cell'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a|b'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '`a\\|b`\n',
    'should escape a pipe character in code in a table cell'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'text', value: 'a\nb'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    'a&#xA;b\n',
    'should escape eols in a table cell'
  )

  assert.deepEqual(
    toMarkdown(
      {
        type: 'tableRow',
        children: [
          {type: 'tableCell', children: [{type: 'text', value: '<a>'}]},
          {type: 'tableCell', children: [{type: 'text', value: '*a'}]},
          {type: 'tableCell', children: [{type: 'text', value: '![]()'}]}
        ]
      },
      {extensions: [gfmTableToMarkdown()]}
    ),
    '| \\<a> | \\*a | !\\[]\\() |\n',
    'should escape phrasing characters in table cells'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'text', value: 'a|b'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    'a\\|b\n',
    'should escape pipes in a table cell'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a|b|c'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '`a\\|b\\|c`\n',
    'should escape multiple pipes in inline code in a table cell'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'text', value: 'a|b|c'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    'a\\|b\\|c\n',
    'should escape multiple pipes in a table cell'
  )

  assert.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a||b'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    '`a\\|\\|b`\n',
    'should escape adjacent pipes in inline code in a table cell'
  )
  assert.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'text', value: 'a||b'}]},
      {extensions: [gfmTableToMarkdown()]}
    ),
    'a\\|\\|b\n',
    'should escape adjacent pipes in a table cell'
  )
})
