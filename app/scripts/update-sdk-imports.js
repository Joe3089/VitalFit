#!/usr/bin/env node

/**
 * Script to update all SDK imports to use the middleware version
 *
 * This will replace:
 *   import vitalFitApi from '@/services/vitalfitSdk'
 * With:
 *   import vitalFitApi from '@/services'
 */

const fs = require('fs');
const path = require('path');

// Recursively find all .ts and .tsx files
const findFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and .git directories
      if (file !== 'node_modules' && file !== '.git' && file !== '.expo') {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
};

// Check if file contains the old import
const hasOldImport = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.includes("from '@/services/vitalfitSdk'") ||
           content.includes('from "@/services/vitalfitSdk"');
  } catch {
    return false;
  }
};

// Update a single file
const updateFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Replace both single and double quotes
    content = content.replace(
      /from ['"]@\/services\/vitalfitSdk['"]/g,
      "from '@/services'"
    );

    // Only write if something changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    return false;
  }
};

// Main execution
const main = () => {
  console.log('🔍 Finding files with old SDK imports...\n');

  const rootDir = path.join(__dirname, '..');
  const allFiles = findFiles(rootDir);
  const filesToUpdate = allFiles.filter(hasOldImport);

  if (filesToUpdate.length === 0) {
    console.log('✅ No files need updating!');
    console.log('   All imports are already using the middleware version.');
    return;
  }

  console.log(`Found ${filesToUpdate.length} files to update:\n`);

  let updatedCount = 0;

  filesToUpdate.forEach((file) => {
    const relativePath = path.relative(rootDir, file);
    const updated = updateFile(file);
    if (updated) {
      console.log(`  ✓ Updated: ${relativePath}`);
      updatedCount++;
    } else {
      console.log(`  - Skipped: ${relativePath}`);
    }
  });

  console.log(`\n✨ Updated ${updatedCount} of ${filesToUpdate.length} files!`);
  console.log('\n📝 What changed:');
  console.log(`   from '@/services/vitalfitSdk'  →  from '@/services'`);
  console.log('\n🎉 All SDK calls now have automatic token refresh!');
  console.log('\n📚 Next steps:');
  console.log('   1. Test your app to make sure everything works');
  console.log('   2. Ask your backend dev to implement the /auth/refresh endpoint');
  console.log('   3. Enjoy automatic token refresh! 🚀');
};

main();
