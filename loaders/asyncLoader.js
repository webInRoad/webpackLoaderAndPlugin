const fs = require('fs');
const path = require('path');
module.exports = function (source) {
  const callback = this.async();
  fs.readFileSync(
    path.resolve(__dirname, '../src/async.txt'),
    'utf-8',
    (error, content) => {
      if (error) {
        callback(error, '');
      }
      callback(null, content);
    }
  );
};
