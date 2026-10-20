const {
  DatabaseSync
} = require('node:sqlite');
const {
  readFileSync
} = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {
  transformSync
} = require('@babel/core');
function repository() {
  const native = new DatabaseSync(':memory:');
  const adapter = {
    execAsync: async sql => native.exec(sql),
    runAsync: async (sql, ...args) => native.prepare(sql).run(...args),
    getFirstAsync: async (sql, ...args) => native.prepare(sql).get(...args),
    getAllAsync: async (sql, ...args) => native.prepare(sql).all(...args)
  };
  adapter.withTransactionAsync = async fn => {
    native.exec('BEGIN');
    try {
      await fn();
      native.exec('COMMIT');
    } catch (e) {
      native.exec('ROLLBACK');
      throw e;
    }
  };
  // Load the actual split modules with a fresh module cache for each database.
  // Only expo-sqlite is replaced; repository imports and transactions are real.
  const modules = new Map();
  function load(filename) {
    if (filename.endsWith('.cjs')) return require(filename);
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = {
      exports: {}
    };
    modules.set(filename, module);
    const source = readFileSync(filename, 'utf8');
    const {
      code
    } = transformSync(source, {
      filename,
      babelrc: false,
      configFile: false,
      plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')]
    });
    const localRequire = specifier => {
      if (specifier === 'expo-sqlite') return {
        openDatabaseAsync: async () => adapter
      };
      if (!specifier.startsWith('.')) return require(specifier);
      const base = path.resolve(path.dirname(filename), specifier);
      return load(require.resolve(base));
    };
    new vm.Script(`(function(require,module,exports){${code}\n})`, {
      filename
    }).runInThisContext()(localRequire, module, module.exports);
    return module.exports;
  }
  const api = {
    ...load(path.join(__dirname, '../../src/database/index.js')),
    ...load(path.join(__dirname, '../../src/repositories/index.js'))
  };
  return {
    api,
    close: () => native.close()
  };
}
module.exports = {
  repository
};
