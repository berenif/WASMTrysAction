#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const projectRoot = process.cwd();
const wasmProjectPath = join(projectRoot, 'roguelike-wasm');
const outputPath = join(projectRoot, 'docs', 'wasm');

console.log('🎮 Building Roguelike WASM Module...\n');

// Check if Rust project exists
if (!existsSync(wasmProjectPath)) {
  console.error('❌ Rust project not found at:', wasmProjectPath);
  process.exit(1);
}

try {
  // Source cargo env and build
  console.log('📦 Building with wasm-pack...');
  execSync(
    `source /usr/local/cargo/env 2>/dev/null || true && cd "${wasmProjectPath}" && wasm-pack build --target web --out-dir "${outputPath}"`,
    { stdio: 'inherit', shell: '/bin/bash' }
  );
  
  console.log('\n✅ WASM module built successfully!');
  console.log(`📁 Output location: ${outputPath}`);
  console.log('\n🚀 To run the game:');
  console.log('   1. cd docs');
  console.log('   2. python3 -m http.server 8080');
  console.log('   3. Open http://localhost:8080 in your browser');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}