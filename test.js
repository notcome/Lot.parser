var lot = require('./');
var fs = require('fs');

var testData = fs.readFileSync('./test.lot', 'utf8');

try {
  var result = lot(testData);
  console.log(result);
}
catch (err) {
  console.log(err);
}
