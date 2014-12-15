"use strict";
var fs = require('fs');
var _ = require('underscore');
var $__0 = require('./util'),
    extractArray = $__0.extractArray,
    removeWrappingSpacing = $__0.removeWrappingSpacing;
var TypeDefRegex;
var DataDefRegex;
function initRegex() {
  var idRegex = '[A-Za-z_][A-Za-z_0-9]+';
  var typeDefRegex = 'define (%) = (\\[%(\\,[ ]*%)*\\])';
  var dataDefRegex = '(%) as (%|\\[%(\\,[ ]*%)*\\]|\\[\\.\\.\\.\\]) =';
  TypeDefRegex = new RegExp(typeDefRegex.replace(/%/g, idRegex));
  DataDefRegex = new RegExp(dataDefRegex.replace(/%/g, idRegex));
}
initRegex();
function LoTParser() {
  this.types = {};
  this.exports = {};
  this.buffer = [];
}
var Spacing = {type: 'Spacing'};
var Delimiter = {type: 'Delimiter'};
LoTParser.prototype = {
  name: null,
  mapping: null,
  mode: 'basicMode',
  intoBasicMode: function() {
    this.mode = 'basicMode';
  },
  intoTypeLoadedMode: function() {
    this.mode = 'typeLoadedMode';
  },
  intoInputMode: function() {
    this.mode = 'inputMode';
  },
  parseLine: function(line) {
    this[this.mode](line);
  }
};
LoTParser.prototype.basicMode = function(line) {
  if (line == Spacing)
    return;
  var matchTypeDef = TypeDefRegex.exec(line);
  if (matchTypeDef != null)
    return this.parseTypeDef(matchTypeDef);
  var matchDatadef = DataDefRegex.exec(line);
  if (matchDatadef != null) {
    this.parseDataDef(matchDatadef);
    return this.intoTypeLoadedMode();
  }
  throw 'unexpected line in basic mode';
};
LoTParser.prototype.typeLoadedMode = function(line) {
  if (line == Spacing)
    return this.intoBasicMode();
  if (line == Delimiter)
    return;
  this.pushField(line);
  return this.intoInputMode();
};
LoTParser.prototype.inputMode = function(line) {
  if (line == Delimiter) {
    this.parseBuffer();
    return this.intoTypeLoadedMode();
  }
  this.pushField(line);
};
LoTParser.prototype.parse = function(data) {
  var preprocessed = data.split('\n').map(removeWrappingSpacing).map((function(line) {
    return line.length ? line : Spacing;
  })).map((function(line) {
    return line != '---' ? line : Delimiter;
  }));
  try {
    var line;
    for (line = 0; line < preprocessed.length; line++)
      this.parseLine(preprocessed[line]);
  } catch (err) {
    throw {
      line: line + 1,
      error: err
    };
  }
};
LoTParser.prototype.parseTypeDef = function(match) {
  var name = match[1];
  var mapping = extractArray(match[2]);
  this.types[name] = mapping;
};
LoTParser.prototype.parseDataDef = function(match) {
  if (match[2] == '[...]')
    this.mapping = 'array';
  else if (match[2][0] == '[')
    this.mapping = extractArray(match[2]);
  else {
    var $mapping = this.types[match[2]];
    if (!$mapping)
      throw 'Type doesn\'t exist.';
    this.mapping = $mapping;
  }
  this.name = match[1];
  this.exports[match[1]] = [];
};
LoTParser.prototype.pushField = function(line) {
  this.buffer.push(line);
};
LoTParser.prototype.parseBuffer = function() {
  var $__1 = this,
      name = $__1.name,
      exports = $__1.exports,
      mapping = $__1.mapping,
      buffer = $__1.buffer;
  if (mapping instanceof Array) {
    if (mapping.length != buffer.length)
      throw 'Data definition hasn\'t finished.';
    exports[name].push(_.object(mapping, buffer));
  } else
    exports[name].concat(buffer);
  this.buffer = [];
  return this.intoTypeLoadedMode();
};
module.exports = function(data) {
  var parser = new LoTParser();
  parser.parse(data);
  return parser.exports;
};
