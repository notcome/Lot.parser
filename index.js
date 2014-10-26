var TypeDefRegex = /define ([A-z]+) = (\[[A-z]+(\,[ ]*[A-z]+)*\])/
var DataDefRegex = /([A-z]+) as ([A-z]+|\[[A-z]+(\,[ ]*[A-z]+)*\]) =/;

function LoTParser () {
  this.types = {};
  this.exports = {};
}

LoTParser.prototype = {
  tryPushOrThrow: function () {
    if (!this.buffer)
      return;
    if (this.buffer.length == 0)
      return;

    if (this.mapping.length == this.buffer.length)
      this.pushObject();
    else
      throw new Error("Data definition hasn't finished.");
  },

  pushNullField: function () { this.buffer.push(null); },
  pushField: function (line) { this.buffer.push(line); },

  pushObject: function () {
    var obj = {};
    for (var i = 0; i < this.buffer.length; i ++)
      obj[this.mapping[i]] = this.buffer[i];

    this.exports[this.name].push(obj);
    delete this.buffer;
  },

  parseLine: function () {
    this.tryPushOrThrow();
    this.buffer = [];
  },

  parseTypeDef: function (match) {
    this.tryPushOrThrow();

    var name = match[1];
    var mapping = extractArray(match[2]);
    this.types[name] = mapping;
  },

  setUpDataDef: function (match) {
    this.tryPushOrThrow();

    if (match[2][0] == '[')
      this.mapping = extractArray(match[2]);
    else {
      var mappingOp = this.types[match[2]];
      if (!mappingOp)
        throw new Error("Type doesn't exist.");
      this.mapping = mappingOp;
    }

    this.name = match[1];
    this.exports[match[1]] = [];
  }
}

LoTParser.prototype.parse = function (data) {
  var self = this;

  data
  .split  ('\n')
  .map    (removeWrappingSpacing)
  .filter (function (line) { return line.length; })
  .forEach(function (line) {
    var match;

    match = TypeDefRegex.exec(line);
    if (match != null)
      return self.parseTypeDef(match);

    match = DataDefRegex.exec(line);
    if (match != null)
      return self.setUpDataDef(match);

    if (line == '---')
      return self.parseLine();

    if (line == '?')
      return self.pushNullField();

    self.pushField(line);
  });
};


function extractArray (str) {
  function work (str) {
    var i = 0;
    var datum;
    while (str[i] >= 'A' && str[i] <= 'z')
      i ++;
    datum = str.slice(0, i);

    if (i == str.length)
      return datum;

    i ++;
    while (str[i] == ' ' || str[i] == '\t')
      i ++;
    return [datum].concat(work(str.slice(i)));
  }

  return work(str.slice(1, -1));
}

function removeWrappingSpacing (line) {
  var preSp = 0;
  while (line[preSp] == ' ' || line[preSp] == '\t')
    preSp ++;
  
  var sufSp = line.length - 1;
  while (line[sufSp] == ' ' || line[sufSp] == '\t')
    sufSp --;
  sufSp ++;

  return line.slice(preSp, sufSp);
}

module.exports = function (data) {
  var parser = new LoTParser();
  parser.parse(data);
  return parser.exports;
}
