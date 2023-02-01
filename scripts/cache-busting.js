#!/usr/bin/env node
// This file when run (i.e: npm run postbuild) will add a hash to these files: main.js, main.css, polyfills.js, vendor.js
// and will update index.html so that the script/link tags request those files with their corresponding hashes
// Based upon source: https://gist.github.com/haydenbr/7df417a8678efc404c820c61b6ffdd24
// It is now heavily rewritten by Christoffer Björkskog.
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

// Helper function for finding the hash in an already hashed file.
function findHash(filePath) {
  let pathParts = filePath.split('/');
  const filename = pathParts.pop();
  const folderPath = pathParts.join('/');
  const fileParts = filename.split('.');

  const buildFiles = fs.readdirSync(folderPath);

  for (buildFile of buildFiles) {
    const buildFileParts = buildFile.split('.');
    if (buildFileParts.length == 3 && buildFileParts[0] === fileParts[0] && buildFileParts[2] == fileParts[1]) {
      return buildFileParts[1];
    }
  }
}

function getHash(filename, folderPath) {
  let files = fs.readdirSync(folderPath);
  let filePath = path.join(folderPath, filename);

  let theFileIsAlreadyHashed = !files.includes(filename);
  let fileHash = null;
  if (!theFileIsAlreadyHashed) {
    // console.log(filename + " is not yet hashed");
    fileHash = revHash(fs.readFileSync(filePath));
    // console.log("new hash is " + fileHash);
  } else {
    fileHash = findHash(filePath);
    if (!fileHash) {
      console.log("\n\n\n" + filename  + " does not exist. please run build.\n\n\n");
      process.exit();
    }
    // console.log(filename + " is already hashed", filePath);
    // console.log("existing hash is " + fileHash);
  }
  return [fileHash, theFileIsAlreadyHashed];
}

var rootDir = path.resolve(__dirname, '../');
var wwwRootDir = path.resolve(rootDir, 'www');
var indexPath = path.join(wwwRootDir, 'index.html');

let f = {};

for (let filename of ['common.js', 'main.js', 'polyfills.js', 'runtime.js', 'scripts.js', 'styles.css']) {
  let filePath = path.join(wwwRootDir, filename);
  let relativePath = path.join(filename);

  let [file, fileExtension] = filename.split('.');
  let fileBase = file.split('/').pop();
  let [fileHash, theFileIsAlreadyHashed] = getHash(filename, wwwRootDir);

  let newFilename = `${fileBase}.${fileHash}.${fileExtension}`;
  let newPath = path.join(wwwRootDir, newFilename);
  let newRelativePath = path.join(newFilename);

  f[filename] = {
    'path' : filePath,
    'hash' : fileHash,
    'alreadyHashed' :  theFileIsAlreadyHashed,
    'base' : fileBase,
    'extenstion' : fileExtension,
    'unhashedFilename': filename,
    'newFilename' : newFilename,
    'newPath' : newPath,
    'newRelativePath' : newRelativePath,
    'relativePath': relativePath,
    'selector': fileExtension == 'css' ? `head link[href="${relativePath}"]` : `body script[src="${relativePath}"]`,
    'attr': fileExtension == 'css' ? 'href' : 'src' // if there will be more than js and css, we will refactor this into a function
  }

  // console.log("new sw path", newServiceWorkerPath);
  // update index.html to load base.[hash].ext
  $ = cheerio.load(fs.readFileSync(indexPath, 'utf-8'));
  $(f[filename].selector).attr(f[filename].attr, f[filename].newRelativePath);
  fs.writeFileSync(indexPath, $.html());

  // rename actual file
  if (!f[filename].alreadyHashed) {
    // console.log("will now create hasn file for " + filename + "\n" + f[filename].path + "\n" + f[filename].newPath + "\n\n");
    if(fs.existsSync(f[filename].path) && !fs.existsSync(f[filename].newPath)) {
      console.log(`Cache bursting ${filename} => ${f[filename].newFilename}`);
      fs.renameSync(f[filename].path, f[filename].newPath);
    }
    if(fs.existsSync(f[filename].path + '.map') && !fs.existsSync(f[filename].newPath + '.map') ) {
      console.log(`Cache bursting ${filename}.map => ${f[filename].newFilename}.map`);
      fs.renameSync(f[filename].path + '.map', f[filename].newPath + '.map');
    }
  }
}

return;