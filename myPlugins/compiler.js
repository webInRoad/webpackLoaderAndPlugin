const { SyncHook, AsyncSeriesHook } = require('tapable');

module.exports = class Compiler {
  constructor() {
    this.hooks = {
      add: new SyncHook(), // 无参同步
      reduce: new SyncHook(['arg']), // 有参同步
      fetchNum: new AsyncSeriesHook(['arg1', 'arg2']), // 异步 hook
    };
  }
  run() {
    this.add();
    this.reduce(20);
    this.fetchNum('async', 'hook');
  }
  add() {
    this.hooks.add.call();
  }
  reduce(num) {
    this.hooks.reduce.call(num);
  }
  fetchNum() {
    this.hooks.fetchNum.promise(...arguments).then(
      () => {},
      (error) => console.info(error)
    );
  }
};
