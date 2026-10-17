const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function readLooseObject(gitDir, hash) {
  const dir = hash.slice(0, 2);
  const file = hash.slice(2);
  const objPath = path.join(gitDir, 'objects', dir, file);
  if (!fs.existsSync(objPath)) return null;
  const compressed = fs.readFileSync(objPath);
  const decompressed = zlib.inflateSync(compressed);
  const nullIdx = decompressed.indexOf(0);
  const header = decompressed.slice(0, nullIdx).toString('utf8');
  const [type, size] = header.split(' ');
  const content = decompressed.slice(nullIdx + 1);
  return { type, size: Number(size), content };
}

function parseTree(buf) {
  const entries = [];
  let i = 0;
  while (i < buf.length) {
    const spaceIdx = buf.indexOf(0x20, i);
    const mode = buf.slice(i, spaceIdx).toString('utf8');
    const nullIdx = buf.indexOf(0x00, spaceIdx);
    const name = buf.slice(spaceIdx + 1, nullIdx).toString('utf8');
    const sha = buf.slice(nullIdx + 1, nullIdx + 21).toString('hex');
    entries.push({ mode, name, sha });
    i = nullIdx + 21;
  }
  return entries;
}

const gitDir = 'c:\\Projects\\Uniwell\\.git';
const rootTree = parseTree(readLooseObject(gitDir, 'e8238afe0ce21fd584244c2aad552a2fcfa8deea').content);
const frontendEntry = rootTree.find(e => e.name === 'frontend');
const frontendTree = parseTree(readLooseObject(gitDir, frontendEntry.sha).content);
const srcEntry = frontendTree.find(e => e.name === 'src');
const srcTree = parseTree(readLooseObject(gitDir, srcEntry.sha).content);
const pagesEntry = srcTree.find(e => e.name === 'pages');
const pagesTree = parseTree(readLooseObject(gitDir, pagesEntry.sha).content);
const adminDashboardEntry = pagesTree.find(e => e.name === 'AdminDashboard.jsx');

console.log('AdminDashboard blob SHA:', adminDashboardEntry.sha);
const blob = readLooseObject(gitDir, adminDashboardEntry.sha);
console.log('AdminDashboard length:', blob.content.length);
fs.writeFileSync('c:\\Projects\\Uniwell\\frontend\\src\\pages\\AdminDashboard.jsx', blob.content);
console.log('Successfully restored AdminDashboard.jsx!');
