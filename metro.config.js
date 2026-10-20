const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const config = getDefaultConfig(__dirname);
config.maxWorkers = 1;
config.cacheStores = [new FileStore({ root: path.resolve(__dirname, '.cache/metro') })];
module.exports = config;
