const fs = require('fs');


const data = fs.readFileSync('articles.txt', 'utf-8');


const lines = data.split('\n');
const htmlOutput = lines.map(line => {
    const match = line.match(/Art\. (\d+\.\d+) - (.*): (.+)/);
    if (match) {
        const id = match[1];
        const desc = match[2];
        const sancion = match[3];
        return `<li id="art-${id.replace('.', '-')}" class="flex items-center py-2" data-sancion="${sancion.trim()}"> <span>${line.trim()}</span> </li>`;
    }
    return "";  
}).join('\n');


fs.writeFileSync('output.html', htmlOutput);
