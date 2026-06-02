const fs = require('fs');
const path = './client/src/utils/scanInsights.js';
let content = fs.readFileSync(path, 'utf8');

// Replace ternary string literals for 'hi' vs 'en' with just the 'en' string
// E.g. language === 'hi' ? 'Hindi string' : 'English string' -> 'English string'
// And language === 'hi' ? `Hindi template` : `English template`

content = content.replace(/language === 'hi'\s*\?\s*`[^`]+`\s*:\s*(`[^`]+`)/g, '$1');
content = content.replace(/language === 'hi'\s*\?\s*'[^']+'\s*:\s*('[^']+')/g, '$1');

// Arrays and objects
content = content.replace(/language === 'hi'\s*\?\s*\[([\s\S]*?)\]\s*:\s*\[([\s\S]*?)\]/g, '[$2]');
content = content.replace(/language === 'hi'\s*\?\s*\{([\s\S]*?)\}\s*:\s*\{([\s\S]*?)\}/g, '{$2}');

// Specific hardcoded patches
content = content.replace(/if \(language === 'hi'\) \{[\s\S]*?return 'target';\s*\}/g, '');

fs.writeFileSync(path, content, 'utf8');