const fs=require('node:fs');
let html=fs.readFileSync('template.html','utf8');
for(const [marker,file] of [['/* STYLES */','style.css'],['/* ENGINE */','engine.js'],['/* APP */','app.js']])html=html.replace(marker,()=>fs.readFileSync(file,'utf8'));
fs.writeFileSync('index.html',html);
console.log('Built standalone game: index.html');
