const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting advanced model optimization with Draco compression...');

const MODELS_DIR = path.join(__dirname, '../../public/models-external');
const BACKUP_DIR = path.join(__dirname, '../../archives/original_models_backup');

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Get all GLB files
const modelFiles = fs.readdirSync(MODELS_DIR).filter(file => file.endsWith('.glb'));

console.log(`📁 Models to optimize: ${modelFiles.length}`);

function getFileSizeMB(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024 / 1024).toFixed(2);
}

modelFiles.forEach((modelFile, index) => {
  const inputPath = path.join(MODELS_DIR, modelFile);
  const backupPath = path.join(BACKUP_DIR, modelFile);
  const tempPath = path.join(MODELS_DIR, `${path.parse(modelFile).name}_optimized.glb`);
  
  const originalSizeMB = getFileSizeMB(inputPath);
  
  console.log(`\n${index + 1}/${modelFiles.length}: Optimizing ${modelFile} (${originalSizeMB}MB)`);
  
  try {
    // Create backup
    fs.copyFileSync(inputPath, backupPath);
    console.log('  ✓ Backup created');
    
    // Try aggressive Draco compression with gltf-pipeline
    console.log('  ⚡ Applying aggressive Draco compression...');
    
    const command = `npx gltf-pipeline -i "${inputPath}" -o "${tempPath}" --draco.compressionLevel 10 --draco.quantizePositionBits 14 --draco.quantizeNormalBits 10 --draco.quantizeTexcoordBits 12`;
    execSync(command, { stdio: 'inherit' });
    
    // Replace original file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(inputPath);
      fs.renameSync(tempPath, inputPath);
      
      const optimizedSizeMB = getFileSizeMB(inputPath);
      const reductionPercent = ((originalSizeMB - optimizedSizeMB) / originalSizeMB * 100).toFixed(1);
      
      console.log(`  ✅ Success: ${originalSizeMB}MB → ${optimizedSizeMB}MB (-${reductionPercent}%)`);
    } else {
      throw new Error('Optimized file was not created');
    }
    
  } catch (error) {
    console.error(`  ❌ Error optimizing ${modelFile}:`, error.message);
    // Restore from backup if error
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, inputPath);
      console.log('  ↶ Restored original from backup');
    }
  }
});

console.log('\n🎉 Optimization completed!');
console.log('💾 Originals saved in:', BACKUP_DIR);
