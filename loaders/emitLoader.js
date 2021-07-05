const { interpolateName } = require('loader-utils');
const path = require('path');
module.exports = function (source) {
  const url = interpolateName(this, '[name].[ext]', { source });
  console.info(url, 'url');
  this.emitFile(path.join(__dirname, url), source);
  this.callback(null, source);
};
