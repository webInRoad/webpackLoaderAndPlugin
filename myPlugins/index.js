const MyPlugin = require('./my-plugin');
const Compiler = require('./compiler');

const myPlugin = new MyPlugin();

const options = {
  plugins: [myPlugin],
};

const compiler = new Compiler();

for (const plugin of options.plugins) {
  if (typeof plugin === 'function') {
    plugin.call(compiler, compiler);
  } else {
    plugin.apply(compiler);
  }
}
compiler.run();
