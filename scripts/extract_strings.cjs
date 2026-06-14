const fs = require('fs');
const path = require('path');

let extractedEn = {};
let extractedPl = {};

function cleanText(txt) {
    return txt.replace(/['"`]/g, '').trim();
}

function camelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
        if (+match === 0) return ""; 
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
    }).replace(/[^a-zA-Z0-9]/g, '');
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    const regex = /locale === 'pl' \? (['\`"])(.*?)\1 : (['\`"])(.*?)\3/g;
    
    content = content.replace(regex, (fullMatch, q1, pl, q2, en) => {
        let keyText = cleanText(en);
        let keyName = camelCase(keyText);
        if (keyName.length > 30) keyName = keyName.substring(0, 30);
        if (!keyName) keyName = "empty" + Math.floor(Math.random()*1000);
        
        extractedEn[keyName] = en;
        extractedPl[keyName] = pl;
        
        return `translate(locale, 'dynamic.${keyName}', customTranslations)`;
    });

    if(!content.includes("import { translate }")) {
      content = content.replace(/import \{ LocaleType/g, "import { translate }\nimport { LocaleType");
    }

    fs.writeFileSync(filePath, content, 'utf-8');
}

const filesToProcess = [
    '../src/components/GuiInterface.tsx',
    '../src/App.tsx'
];

filesToProcess.forEach(f => processFile(path.join(__dirname, f)));

fs.writeFileSync(path.join(__dirname, 'extracted_en.json'), JSON.stringify(extractedEn, null, 2));
fs.writeFileSync(path.join(__dirname, 'extracted_pl.json'), JSON.stringify(extractedPl, null, 2));

console.log("Done. Replaced files and dumped extractions.");

