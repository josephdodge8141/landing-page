'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const { fuzzyMatch, ideaMatches, validateContent } = require('../public/app.js')

const publicDirectory = path.join(__dirname, '..', 'public')
const tags = JSON.parse(fs.readFileSync(path.join(publicDirectory, 'tags.json'), 'utf8'))
const ideas = JSON.parse(fs.readFileSync(path.join(publicDirectory, 'ideas.json'), 'utf8'))

test('content conforms to the tag and idea schema', () => {
  assert.doesNotThrow(() => validateContent(tags, ideas))
  assert.equal(new Set(tags).size, tags.length)
  assert.ok(tags.every((tag) => typeof tag === 'string' && tag.length > 0))
})

test('fuzzy search accepts exact text, typos, and ordered characters', () => {
  assert.equal(fuzzyMatch('example', 'An example idea'), true)
  assert.equal(fuzzyMatch('exampel', 'An example idea'), true)
  assert.equal(fuzzyMatch('xmpl', 'An example idea'), true)
  assert.equal(fuzzyMatch('missing', 'An example idea'), false)
})

test('selected tags use OR matching', () => {
  const idea = { title: 'One', body: '<p>Body</p>', tags: ['idea'], date: '2026-08-26' }
  assert.equal(ideaMatches(idea, { query: '', tags: ['thought', 'idea'] }), true)
  assert.equal(ideaMatches(idea, { query: '', tags: ['thought', 'project'] }), false)
})

test('date range boundaries are inclusive', () => {
  const idea = { title: 'One', body: '<p>Body</p>', tags: ['idea'], date: '2026-08-26' }
  assert.equal(ideaMatches(idea, { query: '', tags: [], from: '2026-08-26', to: '2026-08-26' }), true)
  assert.equal(ideaMatches(idea, { query: '', tags: [], from: '2026-08-27', to: '' }), false)
  assert.equal(ideaMatches(idea, { query: '', tags: [], from: '', to: '2026-08-25' }), false)
})
