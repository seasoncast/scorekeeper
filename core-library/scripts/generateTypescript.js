const fs = require('fs');
const path = require('path');

function generateTypescript(jsonFilePath) {
  const jsonContent = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  const className = path.basename(jsonFilePath, '.json');

  let tsContent = `import Editor, { IAction } from '../../Editor';\n`;
  tsContent += `import { Team, Player, Position } from '../../../types';\n\n`;
  tsContent += `export default class ${className} extends Editor {\n`;

  // Generate config
  if (jsonContent.config) {
    tsContent += `  config = ${JSON.stringify(
      jsonContent.config,
      null,
      2
    )};\n\n`;
  }

  // Generate rules
  if (jsonContent.rules) {
    tsContent += `  rules = ${JSON.stringify(jsonContent.rules, null, 2)};\n\n`;
  }

  // Generate actions
  tsContent += `  actions: { [key: string]: IAction } = {\n`;
  Object.entries(jsonContent.actions).forEach(([actionName, action]) => {
    tsContent += `    ${actionName}: {\n`;
    tsContent += `      name: "${actionName}",\n`;
    Object.entries(action).forEach(([key, value]) => {
      if (key !== 'name') {
        tsContent += `      ${key}: ${JSON.stringify(value)},\n`;
      }
    });
    tsContent += `    },\n`;
  });
  tsContent += `  };\n\n`;

  // Generate functions automatically from actions
  Object.keys(jsonContent.actions).forEach((actionName) => {
    const functionName = actionName
      .toLowerCase()
      .replace(/_(.)/g, (match, group1) => group1.toUpperCase());
    const action = jsonContent.actions[actionName];
    const argsList = action.args
      .map((arg) => `${arg.id}?: ${arg.type}`)
      .join(', ');

    tsContent += `  async ${functionName}(args: { ${argsList} }) {\n`;
    tsContent += `    this.sportEvent.updateStats(async (stats) => {\n`;
    tsContent += `      return await this.parseAction(\n`;
    tsContent += `        stats,\n`;
    tsContent += `        this.actions['${actionName}'],\n`;
    tsContent += `        args\n`;
    tsContent += `      );\n`;
    tsContent += `    });\n`;
    tsContent += `  }\n\n`;
  });

  tsContent += `}\n`;

  const generatedFolder = path.join(path.dirname(jsonFilePath), 'generated');
  if (!fs.existsSync(generatedFolder)) {
    fs.mkdirSync(generatedFolder);
  }

  const tsFilePath = path.join(generatedFolder, `${className}.ts`);
  fs.writeFileSync(tsFilePath, tsContent);
  console.log(`Generated ${tsFilePath}`);
}

function generateIndex(sportsFolder) {
  const generatedFolder = path.join(sportsFolder, 'generated');
  const files = fs
    .readdirSync(generatedFolder)
    .filter((file) => file.endsWith('.ts') && file !== 'index.ts');

  let indexContent = '';
  files.forEach((file) => {
    const className = path.basename(file, '.ts');
    indexContent += `export { default as ${className} } from './${className}';\n`;
  });

  const indexPath = path.join(generatedFolder, 'index.ts');
  fs.writeFileSync(indexPath, indexContent);
  console.log(`Generated ${indexPath}`);
}

function processAllJsonFiles() {
  const sportsFolder = path.join(__dirname, '..', 'src', 'lib', 'sports');

  fs.readdirSync(sportsFolder).forEach((file) => {
    if (path.extname(file) === '.json') {
      const jsonFilePath = path.join(sportsFolder, file);
      generateTypescript(jsonFilePath);
    }
  });

  generateIndex(sportsFolder);
}

// Usage
processAllJsonFiles();
