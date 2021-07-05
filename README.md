# webpackLoaderAndPlugin
# 手写 loader
## 什么是 loader?

> loader 用于对模块的源代码进行转换。loader 可以使你在 import 或 "load(加载)" 模块时预处理文件。因此，loader 类似于其他构建工具中“任务(task)”，并提供了处理前端构建步骤的得力方式。loader 可以将文件从不同的语言（如 TypeScript）转换为 JavaScript 或将内联图像转换为 data URL。loader 甚至允许你直接在 JavaScript 模块中 import CSS 文件！

对于 webpack 来说，一切资源皆是模块，但由于 webpack 默认只支持 es5 的 js 以及 json，像是 es6+， react，css 等都要由 loader 来转化处理。

##  loader 代码结构
loader 只是一个导出为函数的 js 模块。

```javascript
module.exports = function(source, map) {
	return source;
}
```
其中 source 表示匹配上的文件资源字符串，map 表示 SourceMap。

**注意：** 不要写成箭头函数，因为 loader 内部的属性和方法，需要通过 this 进行调用，比如默认开启 loader 缓存，配制 this.cacheable(false) 来关掉缓存

## 同步 loader
**需求：** 替换 js 里的某个字符串

**实现：**
新建个 replaceLoader.js:
```javascript
module.exports = function (source) {
  return `${source.replace('hello', 'world')} `;
};
```
webpack.config.js：

```javascript
const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'main.js',
  },
  module: {
    rules: [{ test: /\.js$/, use: './loaders/replaceLoader.js' }],
  },
};
```

## 传递参数
上面的 replaceLoader 是固定将某个字符串(hello)替换掉，实际场景中更多的是通过参数传入，即

webpack.config.js：

```javascript
const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'main.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        // 通过 options 参数传参
        use: [
          {
            loader: './loaders/replaceLoader.js',
            options: {
              name: 'hello',
            },
          },
        ],
        // 通过字符串来传参
        // use: './loaders/replaceLoader.js?name=hello'
      },
    ],
  },
};

```
以上两种传参方式，如果使用 query 属性来获取参数，就会出现字符串传参获取到的是字符串， options 传参获取到的是对象格式，不好处理。这里推荐使用 [loader-utils](https://github.com/webpack/loader-utils) 库来处理。

这里使用 getOptions 来接收参数

```javascript
const { getOptions } = require('loader-utils');
module.exports = function (source) {
  const params = getOptions(this);
  return `${source.replace(params.name, 'world')} `;
};

```

## 异常处理
第一种： loader 内直接通过 throw 抛出

```javascript
const { getOptions } = require('loader-utils');
module.exports = function (source) {
  const params = getOptions(this);
  throw new Error('出错了');
};
```
第二种： 通过 this.callback 传递错误

```javascript
this.callback({
    //当无法转换原内容时，给 Webpack 返回一个 Error
    error: Error | Null,
    //转换后的内容
    content: String | Buffer,
    //转换后的内容得出原内容的Source Map（可选）
    sourceMap?: SourceMap,
    //原内容生成 AST语法树（可选）
    abstractSyntaxTree?: AST 
})
```
第一个参数表示错误信息，当传递 null 时，作用跟前面的直接 return 个字符串作用类似，更建议采用这种方式返回内容
```javascript
const { getOptions } = require('loader-utils');
module.exports = function (source) {
  const params = getOptions(this);
  this.callback(new Error("出错了"), `${source.replace(params.name, 'world')} `);
};

```
## 异步处理
当遇到要处理异步需求时，比如获取文件，此时通过 this.async() 告知 webpack 当前 loader 是异步运行。

```javascript
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

```
其中 callback 是跟上面 this.callback 一样的用法。

## 文件输出
通过 this.emitFile 进行文件写入。

```javascript
const { interpolateName } = require('loader-utils');
const path = require('path');
module.exports = function (source) {
  const url = interpolateName(this, '[name].[ext]', { source });
  this.emitFile(url, source);
  this.callback(null, source);
};

```
## resolveLoader
上述设置 loader 时将整个文件路径都配置了，这样写多了，是有些麻烦的，可以通过 resolveLoader 定义 loader 的查找文件路径。

```javascript
const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'main.js',
  },
  resolveLoader: { modules: ['./loaders/', 'node_modules'] },
  module: {
    rules: [
      {
        test: /\.js$/,
        // 通过 options 参数传参
        use: [
          {
            loader: 'asyncLoader.js',
          },
          {
            loader: 'emitLoader.js',
          },
          {
            loader: 'replaceLoader.js',
            options: {
              name: 'hello',
            },
          },
        ],
        // 通过字符串来传参
        // use: './loaders/replaceLoader.js?name=hello'
      },
    ],
  },
};

```
# plugin 工作机制
在手写 plugin 之前，先讲下 webpack 里 plugin 的工作机制，方便后续的讲解。

在 webpack.js 有如下代码：
```javascript
compiler = new Compiler(options.context);
compiler.options = options;
if (options.plugins && Array.isArray(options.plugins)) {
	for (const plugin of options.plugins) {
		if (typeof plugin === "function") {
			plugin.call(compiler, compiler);
		} else {
			plugin.apply(compiler);
		}
	}
}
```
可以看到会遍历 options.plugins 并依次调用 apply 方法，当然如果 plugin 是个函数的话，会调用 call，官网推荐将 plugin 定义成类。

## Tapable
上面代码上可以看到创建了个 Compiler 实例，将传递给各个 plugin。那么 Compiler 到底是做什么的？

进入 Compiler.js 与 Compilation.js ，可以看到这两个类都继承自 Tapable 
```javascript
class Compiler extends Tapable {}
class Compilation extends Tapable {}
```
Tapable 是一个类似于 Node.js 的 EventEmitter 的库，主要是控制钩子函数的发布与订阅,控制着 webpack 的插件系统。
Tapable 库暴露了很多 Hook（钩子）类，其中既有同步 Hook,比如 SyncHook;也有异步 Hook，比如 AsyncSeriesHook。
new 一个 hook 获取我们需要的钩子，该方法接收数组参数 options，非必传。
比如：
```javascript
const hook1 = new SyncHook(["arg1", "arg2", "arg3"]);
```
## hook 钩子的绑定与执行
同步与异步 hook 的绑定与执行是不一样的：
|Async*（异步）   | Sync* (同步)  |
|------|---------|
| 绑定：tapAsync/tapPromise/tap | 绑定:tap  |
| 执行：callAsync/promise | 执行:call |

```javascript
const hook1 = new SyncHook(["arg1", "arg2", "arg3"]); 
//绑定事件到webapck事件流 
hook1.tap('hook1', (arg1, arg2, arg3) => console.log(arg1, arg2, arg3)) //1,2,3 
//执行绑定的事件 
hook1.call(1,2,3)
```
## 模拟插件执行
模拟个 Compiler.js

```javascript
const { SyncHook, AsyncSeriesHook } = require('tapable');

module.exports = class Compiler {
  constructor() {
    this.hooks = {
      add: new SyncHook(), // 无参同步
      reduce: new SyncHook(['arg']), // 有参同步
      fetchNum: new AsyncSeriesHook(['arg1', 'arg2']), // 异步 hook
    };
  }
  // 入口执行函数
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

```
自定义个 plugin，绑定上面定义的几个 hook

```javascript
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

```
模拟执行

```javascript
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

```
具体代码见 [MyPlugins](https://github.com/webInRoad/webpackLoaderAndPlugin/tree/main/myPlugins)
## Compiler 与 Compliation
Compiler：编译管理器，webpack 启动后会创建 compiler 对象，该对象一直存活直到结束退出。
Compliation： 单次编辑过程的管理器，比如 watch = true 时，运行过程中只有一个 compiler 但每次文件变更触发重新编译时，都会创建一个新的 compilation 对象

# 手写 plugin
有了上面的讲解，现在来手写 plugin
## 什么是 plugin

> 插件是 webpack 的支柱功能。webpack 自身也是构建于你在 webpack 配置中用到的相同的插件系统之上！
> 插件目的在于解决 loader 无法实现的其他事。

插件类似于 React， Vue 里的生命周期，就是个某个时间点会触发，比如 emit 钩子：输出 asset 到 output 目录之前执行;done 钩子：在编译完成时执行。

## plugin 代码结构
plugin 就是个类，该类里有个 apply 方法，方法会接收 compiler 参数
**插件定义：**
```javascript
class DemoPlugin {
  // 插件名称
  apply(compiler) {
    // 定义个 apply 方法
    // 同步的 hook ,采用 tap,第二个函数参数只有 compilation 参数
    compiler.hooks.compile.tap('demo plugin', (compilation) => {
      //插件的 hooks
      console.info(compilation); // 插件处理逻辑
    });
  }
}
module.exports = DemoPlugin;
```
**插件使用：**
```javascript
plugins: [ new DemoPlugin() ]
```
## 传递参数
在类的 constructor 里接收即可
**接收参数：**
```javascript
class DemoPlugin {
  constructor(options) {
    this.options = options;
  }
  // 插件名称
  apply(compiler) {
    // 定义个 apply 方法
    // 同步的 hook ,采用 tap,第二个函数参数只有 compilation 参数
    compiler.hooks.compile.tap('demo plugin', (compilation) => {
      //插件的 hooks
      console.info(this.options); // 插件处理逻辑
    });
  }
}
module.exports = DemoPlugin;
```
**传递参数：**

```javascript
plugins: [new DemoPlugin({ name: 'zhangsan' })],
```

## 文件写入
webpack 在 emit 阶段，会将 compliation.assets 文件写入磁盘。所以可以使用 compilation.assets 对象设置要写入的文件。

```javascript
class CopyRightWebpackPlugin {
  apply(compiler) {
    // 异步的 hook ,采用 tap,第二个函数参数有 compilation 跟 cb 参数,一定要调用 cb()
    compiler.hooks.emit.tapAsync(
      'CopyrightWebpackPlugin',
      (compilation, cb) => {
        compilation.assets['copyright.txt'] = {
          source() {
            return 'copyright by webInRoad';
          },
          size() {
            return 11;
          },
        };
        cb();
      }
    );
  }
}
module.exports = CopyRightWebpackPlugin;

```