#!/usr/bin/env node
// This file when run (i.e: npm run postbuild) will add a hash to these files: main.js, main.css, polyfills.js, vendor.js
// and will update index.html so that the script/link tags request those files with their corresponding hashes
// Based upon source: https://gist.github.com/haydenbr/7df417a8678efc404c820c61b6ffdd24
// Don't forget to: chmod 755 scripts/cache-busting.js

var fs = require('fs'),
    path = require('path'),
    cheerio = require('cheerio'),
    revHash = require('rev-hash');
const { exit } = require('process');
const { execSync } = require('child_process');

function exe(cmd){
  execSync(cmd, (error, stdout, stderr) => {
  if(error !== null){
    exit(error);
    return;
  }
  console.log(stdout);
  console.error(stderr);
})};
//exe('ls -l');

function findFile(dir,rgx){
  var files=fs.readdirSync(dir);
  for(var i=0;i<files.length;i++){
    if(rgx.test(path.join(dir,files[i]))){
      return path.join(dir,files[i]);
    }
  }
  return null;
}

var rootDir = path.resolve(__dirname, '../');
// var wwwRootDir = path.resolve(rootDir, 'platforms', 'browser', 'www');
var wwwRootDir = path.resolve(rootDir, 'www');
var buildDir = path.join(wwwRootDir, 'build');
var indexPath = path.join(wwwRootDir, 'index.html');
var serviceWorkerPath = path.join(wwwRootDir, 'service-worker.js');
//var oldSWPaths = path.join(wwwRootDir, 'service-worker.*.js');
//exe(`if [ -e ${oldSWPaths} ]; then rm ${oldSWPaths};fi`);

var cssPath = path.join(buildDir, 'main.css');
var cssFileHash = revHash(fs.readFileSync(cssPath));
var cssNewFileName = `main.${cssFileHash}.css`;
var cssNewPath = path.join(buildDir, cssNewFileName);
var cssNewRelativePath = path.join('build', cssNewFileName);

 var jsPath = path.join(buildDir, 'main.js');
 var jsHashedPath = findFile(buildDir,/main.*.js/);
 var jsFileHash;
 var jsNewFileName;
 if(jsPath == jsHashedPath && fs.existsSync(jsPath)){
   jsFileHash = revHash(fs.readFileSync(jsPath));
   jsNewFileName = `main.${jsFileHash}.js`;
 }
 else{
   jsPath = jsHashedPath;
   jsNewFileName = jsPath.replace(buildDir,'');
 }
// var jsNewFileName = `main.${jsFileHash}.js`;
var jsNewPath = path.join(buildDir, jsNewFileName);
var jsNewRelativePath = path.join('build', jsNewFileName);

var jsPolyfillsPath = path.join(buildDir, 'polyfills.js');
var jsPolyfillsFileHash = revHash(fs.readFileSync(jsPolyfillsPath));
var jsPolyfillsNewFileName = `polyfills.${jsPolyfillsFileHash}.js`;
var jsPolyfillsNewPath = path.join(buildDir, jsPolyfillsNewFileName);
var jsPolyfillsNewRelativePath = path.join('build', jsPolyfillsNewFileName);

var jsVendorPath = path.join(buildDir, 'vendor.js');
var jsVendorHashedPath = findFile(buildDir,/vendor.*.js/);
var jsVendorFileHash;
var jsVendorNewFileName;
if(jsVendorPath == jsVendorHashedPath && fs.existsSync(jsVendorPath)){
  jsVendorFileHash = revHash(fs.readFileSync(jsVendorPath));
  jsVendorNewFileName = `vendor.${jsVendorFileHash}.js`;
}
else{
  jsVendorPath = jsVendorHashedPath;
  jsVendorNewFileName = jsVendorPath.replace(buildDir,'');
}
// var jsVendorFileHash = revHash(fs.readFileSync(jsVendorPath));
// var jsVendorNewFileName = `vendor.${jsVendorFileHash}.js`;
var jsVendorNewPath = path.join(buildDir, jsVendorNewFileName);
var jsVendorNewRelativePath = path.join('build', jsVendorNewFileName);

var jsToolboxPath = path.join(buildDir, 'sw-toolbox.js');
var jsToolboxFileHash = revHash(fs.readFileSync(jsToolboxPath));
var jsToolboxNewFileName = `sw-toolbox.${jsToolboxFileHash}.js`;
var jsToolboxNewPath = path.join(buildDir, jsToolboxNewFileName);
var jsToolboxNewRelativePath = path.join('build', jsToolboxNewFileName);

// rename main.css to main.[hash].css
fs.renameSync(cssPath, cssNewPath);
if(fs.existsSync(cssPath+'.map'))
fs.renameSync(cssPath+'.map', cssNewPath+'.map');

// rename main.js to main.[hash].js
fs.renameSync(jsPath, jsNewPath);
if(fs.existsSync(jsPath+'.map'))
fs.renameSync(jsPath+'.map', jsNewPath+'.map');

// rename polyfills.js to polyfills.[hash].js
fs.renameSync(jsPolyfillsPath, jsPolyfillsNewPath);
if(fs.existsSync(jsPolyfillsPath+'.map'))
fs.renameSync(jsPolyfillsPath+'.map', jsPolyfillsNewPath+'.map');

// rename vendor.js to vendor.[hash].js
fs.renameSync(jsVendorPath, jsVendorNewPath);
if(fs.existsSync(jsVendorPath+'.map'))
fs.renameSync(jsVendorPath+'.map', jsVendorNewPath+'.map');

// rename sw-toolbox.js to sw-toolbox.[hash].js
fs.renameSync(jsToolboxPath, jsToolboxNewPath);
if(fs.existsSync(jsToolboxPath+'.map'))
fs.renameSync(jsToolboxPath+'.map', jsToolboxNewPath+'.map');

// update service-worker.js to load main.[hash].css
var swFile = fs.readFileSync(serviceWorkerPath, 'utf-8');
swFile = swFile.replace(/build\/main.css/mg,cssNewRelativePath)
.replace(/build\/main.js/mg,jsNewRelativePath)
.replace(/build\/polyfills.js/mg,jsPolyfillsNewRelativePath)
.replace(/build\/vendor.js/mg,jsVendorNewRelativePath)
.replace(/build\/sw-toolbox.js/mg,jsToolboxNewRelativePath);

fs.writeFileSync(serviceWorkerPath, swFile);

var swHash = revHash(fs.readFileSync(serviceWorkerPath));
fs.renameSync(serviceWorkerPath, serviceWorkerPath.replace(/\.js/,`.${swHash}.js`));


// update index.html to load main.[hash].css
$ = cheerio.load(fs.readFileSync(indexPath, 'utf-8'));

$('head link[href="build/main.css"]').attr('href', cssNewRelativePath);
$('body script[src="build/main.js"]').attr('src', jsNewRelativePath);
$('body script[src="build/polyfills.js"]').attr('src', jsPolyfillsNewRelativePath);
$('body script[src="build/vendor.js"]').attr('src', jsVendorNewRelativePath);
$('body script[src="build/sw-toolbox.js"]').attr('src', jsToolboxNewRelativePath);
const jsSWorker = $(`<script type="text/javascript">
   if (\'serviceWorker\' in navigator) {
      navigator.serviceWorker.register(\'service-worker.${swHash}.js\')
        .then(() => console.log(\'service worker installed\'))
        .catch(err => console.error(\'Error\', err));
    }
   </script>`);
$('head script').replaceWith(jsSWorker);

fs.writeFileSync(indexPath, $.html());