module.exports = function(config) {
  config.set({
    files: [
      {
        pattern: "index.js",
        mutated: true,
        included: false
      },
      "__tests__/*.js",
      "__tests__/data/*.json",
      "__tests__/__snapshots__/*.snap"
    ],
    testRunner: "jest",
    mutator: "javascript",
    transpilers: [],
    reporter: ["html", "clear-text", "progress"],
    coverageAnalysis: "off"
  });
};
