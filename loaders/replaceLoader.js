const { getOptions } = require('loader-utils');
module.exports = function (source) {
  const params = getOptions(this);
  return `${source.replace(params.name, 'world')} `;
};
