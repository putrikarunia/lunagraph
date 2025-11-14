import { ComponentScanner } from '../scanner/component-scanner.js'
import * as path from 'path'

export async function scanCommand(options: { pattern?: string; output?: string }) {
  const cwd = process.cwd()
  const pattern = options.pattern || 'app/components/**/*.{ts,tsx}'
  const outputPath = options.output || path.join(cwd, '.lunagraph/ComponentIndex.json')

  console.log('🔍 Scanning for React components...')
  console.log(`   Directory: ${cwd}`)
  console.log(`   Pattern: ${pattern}`)

  try {
    const scanner = new ComponentScanner(cwd)
    const index = await scanner.scan(pattern)

    const componentCount = Object.keys(index).length
    console.log(`\n✅ Found ${componentCount} components`)

    // Display found components
    if (componentCount > 0) {
      console.log('\n📦 Components:')
      Object.entries(index).forEach(([name, info]) => {
        console.log(`   • ${name} (${info.path})`)
      })
    }

    // Write to file
    await scanner.writeIndex(outputPath)
    console.log(`\n💾 Component index saved to: ${outputPath}`)
    console.log(`\n💡 Import it in your editor page:`)
    console.log(`   import componentIndex from '@/.lunagraph/ComponentIndex.json'`)

  } catch (error) {
    console.error('❌ Error scanning components:', error)
    throw error
  }
}
