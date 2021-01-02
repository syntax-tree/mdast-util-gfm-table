var test = require('tape')
var stringWidth = require('string-width')
var fromMarkdown = require('mdast-util-from-markdown')
var toMarkdown = require('mdast-util-to-markdown')
var removePosition = require('unist-util-remove-position')
var syntax = require('micromark-extension-gfm-table')
var table = require('.')

test('markdown -> mdast', function (t) {
  t.deepEqual(
    fromMarkdown('| a\n| -', {
      extensions: [syntax],
      mdastExtensions: [table.fromMarkdown]
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
        extensions: [syntax],
        mdastExtensions: [table.fromMarkdown]
      }),
      true
    ).children[0],
    {
      type: 'table',
      align: [null],
      children: [
        {
          type: 'tableRow',
          children: [
            {type: 'tableCell', children: [{type: 'inlineCode', value: '|'}]}
          ]
        }
      ]
    },
    'should support an escaped pipe in code in a table cell'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('`\\|`', {
        extensions: [syntax],
        mdastExtensions: [table.fromMarkdown]
      }),
      true
    ).children[0],
    {type: 'paragraph', children: [{type: 'inlineCode', value: '\\|'}]},
    'should not support an escaped pipe in code *not* in a table cell'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('| `\\\\|`\\\\` b |\n | --- | --- |', {
        extensions: [syntax],
        mdastExtensions: [table.fromMarkdown]
      }),
      true
    ).children[0],
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
    },
    'should not support an escaped escape in code in a table cell'
  )

  t.end()
})

test('mdast -> markdown', function (t) {
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
      {extensions: [table.toMarkdown()]}
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
      {extensions: [table.toMarkdown()]}
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
      {extensions: [table.toMarkdown()]}
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
      {extensions: [table.toMarkdown()]}
    ),
    '| a   | b   |  c  |   d |\n| --- | :-- | :-: | --: |\n| aaa | bbb | ccc | ddd |\n',
    'should align cells'
  )

  var minitable = {
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

  var minitableDefault = toMarkdown(minitable, {
    extensions: [table.toMarkdown()]
  })

  t.deepEqual(
    toMarkdown(minitable, {
      extensions: [table.toMarkdown({tableCellPadding: false})]
    }),
    '|a|b | c |\n|-|:-|:-:|\n',
    'should support `tableCellPadding: false`'
  )

  t.deepEqual(
    toMarkdown(minitable, {
      extensions: [table.toMarkdown({tableCellPadding: true})]
    }),
    minitableDefault,
    'should support `tableCellPadding: true` (default)'
  )

  t.deepEqual(
    toMarkdown(minitable, {
      extensions: [table.toMarkdown({tablePipeAlign: false})]
    }),
    '| a | b | c |\n| - | :- | :-: |\n',
    'should support `tablePipeAlign: false`'
  )

  t.deepEqual(
    toMarkdown(minitable, {
      extensions: [table.toMarkdown({tablePipeAlign: true})]
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
      {extensions: [table.toMarkdown({stringLength: stringWidth})]}
    ),
    '| a | 古 | \u001B[1m古\u001B[22m | 🤔 |\n| - | -- | -- | -- |\n',
    'should support `stringLength`'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: '| a |\n| - |'}]},
      {extensions: [table.toMarkdown()]}
    ),
    '\\| a |\n\\| - |\n',
    'should escape the leading pipe in what would start or continue a table'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a|\n-|'}]},
      {extensions: [table.toMarkdown()]}
    ),
    'a|\n\\-|\n',
    'should escape the leading dash in what could start a delimiter row (done by list dash)'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'paragraph', children: [{type: 'text', value: 'a\n:-'}]},
      {extensions: [table.toMarkdown()]}
    ),
    'a\n\\:-\n',
    'should escape the leading colon in what could start a delimiter row'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a\\b'}]},
      {extensions: [table.toMarkdown()]}
    ),
    '`a\\b`\n',
    'should not escape a backslash in code in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a\\\\b'}]},
      {extensions: [table.toMarkdown()]}
    ),
    '`a\\\\b`\n',
    'should not escape an “escaped” backslash in code in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a\\+b'}]},
      {extensions: [table.toMarkdown()]}
    ),
    '`a\\+b`\n',
    'should not escape an “escaped” other punctuation character in code in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'inlineCode', value: 'a|b'},
      {extensions: [table.toMarkdown()]}
    ),
    '`a|b`\n',
    'should not escape a pipe character in code *not* in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a|b'}]},
      {extensions: [table.toMarkdown()]}
    ),
    '`a\\|b`\n',
    'should escape a pipe character in code in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'text', value: 'a\nb'}]},
      {extensions: [table.toMarkdown()]}
    ),
    'a&#xA;b\n',
    'should escape eols in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'text', value: 'a|b'}]},
      {extensions: [table.toMarkdown()]}
    ),
    'a\\|b\n',
    'should escape pipes in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a|b|c'}]},
      {extensions: [table.toMarkdown()]}
    ),
    '`a\\|b\\|c`\n',
    'should escape multiple pipes in inline code in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'text', value: 'a|b|c'}]},
      {extensions: [table.toMarkdown()]}
    ),
    'a\\|b\\|c\n',
    'should escape multiple pipes in a table cell'
  )

  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'inlineCode', value: 'a||b'}]},
      {extensions: [table.toMarkdown()]}
    ),
    '`a\\|\\|b`\n',
    'should escape adjacent pipes in inline code in a table cell'
  )
  t.deepEqual(
    toMarkdown(
      {type: 'tableCell', children: [{type: 'text', value: 'a||b'}]},
      {extensions: [table.toMarkdown()]}
    ),
    'a\\|\\|b\n',
    'should escape adjacent pipes in a table cell'
  )

  t.end()
})
