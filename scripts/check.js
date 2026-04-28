const fs = require('fs');
const required = ['App.js', 'app.json', 'package.json', 'babel.config.js'];
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    process.exit(1);
  }
}
console.log('LegacyCoin Mobile Wallet scaffold check passed.');
