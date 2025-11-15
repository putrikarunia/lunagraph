import { ComponentScanner } from '../scanner/component-scanner.js'
import * as path from 'path'

export async function scanCommand(options: { pattern?: string; output?: string }) {
  const cwd = process.cwd()
  const pattern = options.pattern || 'app/components/**/*.{ts,tsx}'
  const outputPath = options.output || path.join(cwd, '.lunagraph/ComponentIndex.json')
  const componentsPath = path.join(path.dirname(outputPath), 'components.ts')

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

    // Write both files
    await scanner.writeIndex(outputPath)
    await scanner.writeComponentsFile(componentsPath)

    console.log(`\n💾 Generated files:`)
    console.log(`   • ${outputPath}`)
    console.log(`   • ${componentsPath}`)

    console.log(`\n💡 Use in your editor page:`)
    console.log(`   import * as lunagraph from './.lunagraph/components'`)
    console.log(`   <LunagraphEditor {...lunagraph} />`)

  } catch (error) {
    console.error('❌ Error scanning components:', error)
    throw error
  }
}
