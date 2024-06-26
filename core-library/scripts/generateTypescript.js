const fs = require('fs');
const path = require('path');

function generateTypescript(jsonFilePath) {
  const jsonContent = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  const className = path.basename(jsonFilePath, '.json');
  
  let tsContent = `import Editor, { IAction } from '../Editor';\n\n`;
  tsContent += `export default class ${className} extends Editor {\n`;
  
  // Generate actions
  tsContent += `  actions: { [key: string]: IAction } = ${JSON.stringify(jsonContent.actions, null, 2)};\n\n`;
  
  // Generate functions
  jsonContent.functions.forEach(func => {
    const argsList = Object.entries(func.args)
      .map(([key, type]) => `${key}${func.optional.includes(key) ? '?' : ''}: ${type}`)
      .join(', ');
    
    tsContent += `  ${func.name}(args: { ${argsList} }) {\n`;
    tsContent += `    this.sportEvent.updateStats((stats) => {\n`;
    tsContent += `      return this.parseAction(\n`;
    tsContent += `        stats,\n`;
    tsContent += `        this.actions['${className.toUpperCase()}_${func.name.toUpperCase()}'],\n`;
    tsContent += `        args\n`;
    tsContent += `      );\n`;
    tsContent += `    });\n`;
    tsContent += `  }\n\n`;
  });
  
  tsContent += `}\n`;
  
  const tsFilePath = jsonFilePath.replace('.json', '.ts');
  fs.writeFileSync(tsFilePath, tsContent);
  console.log(`Generated ${tsFilePath}`);
}

function processAllJsonFiles() {
  const sportsFolder = path.join(__dirname, '..', 'src', 'lib', 'sports');
  
  fs.readdirSync(sportsFolder).forEach(file => {
    if (path.extname(file) === '.json') {
      const jsonFilePath = path.join(sportsFolder, file);
      generateTypescript(jsonFilePath);
    }
  });
}

// Usage
processAllJsonFiles();
