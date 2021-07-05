class MyPlugin {
  apply(compiler) {
    compiler.hooks.add.tap('add', () => console.info('add'));
    compiler.hooks.reduce.tap('reduce', (num) => console.info(num));
    compiler.hooks.fetchNum.tapPromise('fetch tapAsync', (num1, num2) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log(`tapPromise to ${num1} ${num2}`);
          resolve();
        }, 1000);
      });
    });
  }
}
module.exports = MyPlugin;
