// Learn more https://docs.expo.io/guides/customizing-metro

/** @type {import('expo/metro-config').MetroConfig} */
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("db");

module.exports = config;
