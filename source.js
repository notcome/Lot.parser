/*
 * three modes
 * 1. basic mode
 * 2. type loaded mode
 * 3. input mode
 *
 * basic mode << spacing, type definition, data definition :
 * spacing: do nothing
 * type definition: add new type, do nothing
 * data defintion: set up, into type loaded mode
 *
 * type loaoded mode << spacing, delimiter, *
 * spacing: into basic mode
 * delimiter: do nothing
 * *: into input mode, push self into buffer
 *
 * input mode << delimiter, *
 * delimiter: push field, into type loaded mode
 * *: push self into buffer
 */

"use strict";

var fs = require('fs');
var _ = require('underscore');
var { extractArray, removeWrappingSpacing } =
  require('./util');

var TypeDefRegex = /define ([A-z]+) = (\[[A-z]+(\,[ ]*[A-z]+)*\])/
var DataDefRegex = /([A-z]+) as ([A-z]+|\[[A-z]+(\,[ ]*[A-z]+)*\]|\[\.\.\.\]) =/;

function LoTParser () {
  this.types = {};
  this.exports = {};
}

const Spacing = { type: 'Spacing' };
const Delimiter = { type: 'Delimiter' };

LoTParser.prototype = {
  types: {},
  exports: {},
  name: null,
  mapping: null,
  buffer: [],

  mode: 'basicMode',
  intoBasicMode: function () { this.mode = 'basicMode'; },
  intoTypeLoadedMode: function () { this.mode = 'typeLoadedMode'; },
  intoInputMode: function () { this.mode = 'inputMode'; },

  parseLine: function (line) { this[this.mode](line); }
}

LoTParser.prototype.basicMode = function (line) {
  if (line == Spacing)
    return;

  let matchTypeDef = TypeDefRegex.exec(line);
  if (matchTypeDef != null)
    return this.parseTypeDef(matchTypeDef);

  let matchDatadef = DataDefRegex.exec(line);
  if (matchDatadef != null) {
    this.parseDataDef(matchDatadef);
    return this.intoTypeLoadedMode();
  }

  throw 'unexpected line in basic mode';
}

LoTParser.prototype.typeLoadedMode = function (line) {
  if (line == Spacing)
    return this.intoBasicMode();

  if (line == Delimiter)
    return;

  this.pushField(line);
  return this.intoInputMode();
}

LoTParser.prototype.inputMode = function (line) {
  if (line == Delimiter) {
    this.parseBuffer();
    return this.intoTypeLoadedMode();
  }

  this.pushField(line);
}

LoTParser.prototype.parse = function (data) {
  let preprocessed = data
  .split('\n')
  .map(removeWrappingSpacing)
  .map(line => line.length ? line : Spacing)
  .map(line => line != '---' ? line : Delimiter)

  try {
    var line;
    for (line = 0; line < preprocessed.length; line ++)
      this.parseLine(preprocessed[line]);
  } catch (err) {
    throw {
      line: line + 1,
      error: err
    };
  }
}

LoTParser.prototype.parseTypeDef = function (match) {
  let name = match[1];
  let mapping = extractArray(match[2]);
  this.types[name] = mapping;
}

LoTParser.prototype.parseDataDef = function (match) {
  if (match[2] == '[...]')
    this.mapping = 'array';
  else if (match[2][0] == '[')
    this.mapping = extractArray(match[2]);
  else {
    let $mapping = this.types[match[2]];
    if (!$mapping)
      throw 'Type doesn\'t exist.';
    this.mapping = $mapping;
  }

  this.name = match[1];
  this.exports[match[1]] = [];
}

LoTParser.prototype.pushField = function (line) {
  this.buffer.push(line);
}

LoTParser.prototype.parseBuffer = function () {
  let {name, exports, mapping, buffer} = this;

  if (mapping instanceof Array) {
    if (mapping.length != buffer.length)
      throw 'Data definition hasn\'t finished.';

    exports[name].push(_.object(mapping, buffer));
  }
  else
    exports[name].concat(buffer);

  this.buffer = [];
  return this.intoTypeLoadedMode();
}

module.exports = function (data) {
  var parser = new LoTParser();
  parser.parse(data);
  return parser.exports;
}
