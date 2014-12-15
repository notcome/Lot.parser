function extractArray (str) {
  function work (str) {
    var i = 0;
    var datum;
    while(/[A-aZ-z0-9_]/.exec(str[i]) != null) {
      i ++;
      if (i >= str.length)
        break;
    }
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

exports.extractArray = extractArray;
exports.removeWrappingSpacing = removeWrappingSpacing;
