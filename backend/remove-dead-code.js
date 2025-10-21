const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/pages/Processing.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Remove the entire Data Upload section (line 629-726)
const dataUploadStart = content.indexOf('      {/* Data Upload - REMOVED: Now handled in AnalysisSetup page */}');
if (dataUploadStart !== -1) {
  const dataUploadEnd = content.indexOf('      )}', dataUploadStart) + 10;
  content = content.substring(0, dataUploadStart) + content.substring(dataUploadEnd);
}

// Remove the entire Prompt Selection section (line 793-940)
const promptStart = content.indexOf('      {/* Prompt Selection - REMOVED: Now handled in AnalysisSetup page */}');
if (promptStart !== -1) {
  const promptEnd = content.indexOf('      )}', promptStart) + 10;
  content = content.substring(0, promptStart) + content.substring(promptEnd);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✓ Dead code removed from Processing.tsx');

