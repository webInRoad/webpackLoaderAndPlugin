const { getOptions } = require('loader-utils');
module.exports = function (source) {
  const params = getOptions(this);
  // throw new Error('出错了');
  // return `${source.replace(params.name, 'world')} `;
  this.callback(null, `${source.replace(params.name, 'world')} `);
};
