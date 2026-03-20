const webpack = require('webpack');
const config = require('./webpack.config.js')({ production: true }, {});

webpack(config, (err, stats) => {
  if (err) { console.error(err); process.exit(1); }
  const info = stats.toJson();
  if (stats.hasErrors()) {
    info.errors.forEach(e => console.error(e.message));
    process.exit(1);
  }
  if (stats.hasWarnings()) {
    info.warnings.slice(0, 3).forEach(w => console.warn(w.message));
  }
  console.log(stats.toString({ colors: true, modules: false, chunks: false }));
  console.log('\nBuild complete.');
});
