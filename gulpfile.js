const { series, src, dest } = require("gulp");
const concat = require("gulp-concat");

function concatScripts() {
  return src(["src/simpleFingerprintCollector.js", "src/fingerprint/*.js"])
    .pipe(concat("simpleFingerprintCollector.js"))
    .pipe(dest("./dist"));
}

exports.concat = concatScripts;
