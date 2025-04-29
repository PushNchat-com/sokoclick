import { rmSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Root project directory
const projectRoot = join(__dirname, '..');

// PNPM specific paths
const nodeModulesPath = join(projectRoot, 'node_modules');
const pnpmStoreVirtualPath = join(nodeModulesPath, '.pnpm');

// Paths to clean
const paths = [
  // Standard Vite cache
  join(nodeModulesPath, '.vite'),
  join(nodeModulesPath, '.cache'),
  
  // Additional PNPM-specific locations
  join(projectRoot, '.vite'),
  join(projectRoot, 'node_modules/.vite'),
  join(projectRoot, 'node_modules/.cache'),
  
  // Browser caches
  join(projectRoot, '.vite-optimize-deps')
];

console.log('Cleaning Vite cache folders for PNPM project...');

// Delete each path
paths.forEach(path => {
  try {
    if (existsSync(path)) {
      rmSync(path, { recursive: true, force: true });
      console.log(`✓ Removed: ${path}`);
    } else {
      console.log(`● Path does not exist: ${path}`);
    }
  } catch (error) {
    console.error(`✗ Error removing ${path}:`, error.message);
  }
});

// Create empty .vite folder to ensure it exists with proper permissions
try {
  const viteFolder = join(nodeModulesPath, '.vite');
  if (!existsSync(viteFolder)) {
    const { mkdirSync } = await import('fs');
    mkdirSync(viteFolder, { recursive: true });
    console.log(`✓ Created empty .vite folder`);
  }
} catch (error) {
  console.error('✗ Error creating .vite folder:', error.message);
}

console.log('\nVite cache has been cleared.');
console.log('Now run your development server with: pnpm run dev --force'); 