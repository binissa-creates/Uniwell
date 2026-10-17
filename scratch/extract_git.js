const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function readObject(hash) {
  const dir = hash.slice(0, 2);
  const file = hash.slice(2);
  const objPath = path.join('c:\\Projects\\Uniwell\\.git\\objects', dir, file);
  if (!fs.existsSync(objPath)) {
    // Check packfiles
    return null;
  }
  const compressed = fs.readFileSync(objPath);
  const decompressed = zlib.inflateSync(compressed);
  const nullIdx = decompressed.indexOf(0);
  const header = decompressed.slice(0, nullIdx).toString('utf8');
  const [type, size] = header.split(' ');
  const content = decompressed.slice(nullIdx + 1);
  return { type, size: Number(size), content };
}

const commitObj = readObject('12e90b3775a6d8a32430149819ced6c2c21fa471');
console.log('Commit:', commitObj ? commitObj.content.toString('utf8').slice(0, 200) : 'packfile');
