#!/usr/bin/env node

/**
 * Build script for compiling AssemblyScript games to WASM
 */

import {spawn} from 'child_process'
import {readdir, mkdir} from 'fs/promises'
import {join, basename, dirname} from 'path'
import {fileURLToPath} from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const wasmExamplesDir = join(__dirname, '../src/wasm/examples')
const wasmOutputDir = join(__dirname, '../dist/wasm')

async function buildWasm() {
  console.log('🔨 Building WASM game modules...')
  
  // Ensure output directory exists
  await mkdir(wasmOutputDir, {recursive: true})
  
  // Find all TypeScript files in examples directory
  const files = await readdir(wasmExamplesDir)
  const tsFiles = files.filter(f => f.endsWith('.ts'))
  
  if (tsFiles.length === 0) {
    console.log('No TypeScript files found in examples directory')
    return
  }
  
  // Build each TypeScript file
  for (const file of tsFiles) {
    const inputPath = join(wasmExamplesDir, file)
    const outputName = basename(file, '.ts') + '.wasm'
    const outputPath = join(wasmOutputDir, outputName)
    
    console.log(`  Building ${file} -> ${outputName}`)
    
    await new Promise((resolve, reject) => {
      const asc = spawn('npx', [
        'asc',
        inputPath,
        '-o', outputPath,
        '--optimize',
        '--noAssert',
        '--runtime', 'minimal',
        '--exportRuntime',
        '--exportTable'
      ])
      
      asc.stdout.on('data', data => {
        console.log(`    ${data.toString().trim()}`)
      })
      
      asc.stderr.on('data', data => {
        console.error(`    ❌ ${data.toString().trim()}`)
      })
      
      asc.on('close', code => {
        if (code === 0) {
          console.log(`    ✅ Successfully built ${outputName}`)
          resolve()
        } else {
          reject(new Error(`Failed to build ${file}`))
        }
      })
    }).catch(err => {
      console.error(`    ⚠️  Failed to build ${file}: ${err.message}`)
      console.log('    Make sure AssemblyScript is installed: npm install --save-dev assemblyscript')
    })
  }
  
  console.log('✨ WASM build complete!')
}

// Run the build
buildWasm().catch(console.error)