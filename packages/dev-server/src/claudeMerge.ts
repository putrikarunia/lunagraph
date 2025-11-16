import { spawn } from 'child_process'
import chalk from 'chalk'

export interface ClaudeMergeOptions {
  originalCode: string
  generatedJSX: string
  filePath: string
  componentImports?: Array<{ component: string; importPath: string }>
  stateContext?: Record<string, any>  // Mock values used during snapshot rendering
}

/**
 * Use Claude CLI to intelligently merge generated JSX into existing file
 * Preserves: logic, expressions, styling approach, imports, hooks
 */
export async function mergeWithClaude(options: ClaudeMergeOptions): Promise<string> {
  const { originalCode, generatedJSX, filePath, componentImports, stateContext } = options

  let importsSection = ''
  if (componentImports && componentImports.length > 0) {
    importsSection = `\n\nCOMPONENT IMPORTS NEEDED:
The new JSX uses these components. Add imports for any that are missing:
${componentImports.map(({ component, importPath }) => `- ${component} from '${importPath}'`).join('\n')}
`
  }

  let stateContextSection = ''
  if (stateContext && Object.keys(stateContext).length > 0) {
    const stateLines = Object.entries(stateContext)
      .map(([key, value]) => `  ${key} = ${JSON.stringify(value)}`)
      .join('\n')
    stateContextSection = `\n\nIMPORTANT - SNAPSHOT RENDERING CONTEXT:
The JSX below is a RENDERED SNAPSHOT with these mock values:
${stateLines}

This means:
- Any dynamic expressions ({variables}, loops, conditionals) were evaluated with the above values
- The JSX shows what the component looked like when rendered with this specific state
- DO NOT treat this as literal code to copy - treat it as a visual reference of what changed
`
  }

  const prompt = `I'm working on the file: ${filePath}

CONTEXT: A user visually edited this component in Lunagraph editor. The JSX below is a RENDERED SNAPSHOT (not the source code to use directly).

ORIGINAL FILE (with all logic):
\`\`\`tsx
${originalCode}
\`\`\`

EDITED SNAPSHOT (rendered output after user's visual edits):
\`\`\`jsx
${generatedJSX}
\`\`\`${stateContextSection}${importsSection}

YOUR TASK:
Compare the original file with the edited snapshot to understand what the user changed visually, then apply those changes to the original code while preserving ALL dynamic behavior.

CRITICAL RULES:
1. **PRESERVE ALL DYNAMIC CODE**: Keep all JSX expressions, loops, conditionals, variable interpolations exactly as they are
   - The snapshot shows evaluated output - find the corresponding patterns in the original and update them
   - Never replace dynamic code with static hardcoded values

2. **IDENTIFY VISUAL CHANGES**: Look for differences between what the original would render vs the snapshot
   - Style changes (colors, sizes, spacing, etc.)
   - Text content changes
   - Added/removed elements
   - Structural changes to layout

3. **APPLY TO SOURCE**: Update the original code to produce the edited output when rendered
   - If styles changed, update className or style attributes in the source
   - If text changed, update the text in the source (but keep any expressions)
   - If structure changed, modify the JSX structure (but keep loops/conditionals)

4. **MATCH PROJECT STYLE** (CRITICAL):
   - The snapshot will often have inline styles (style={{"color":"#ff0000"}}) because that's how the visual editor works
   - Analyze the original file's styling approach:
     * If original uses Tailwind classes (text-green-600, bg-blue-500, etc.) → convert inline styles to equivalent Tailwind classes
     * If original uses inline styles → keep inline styles
     * If original uses CSS modules → keep CSS modules
   - Example: snapshot has style={{"color":"#ff0000"}} but original uses className="text-green-600"
     → Update to className="text-red-600", REMOVE the inline style attribute
   - Common Tailwind conversions:
     * color: #ff0000 → text-red-600 (or text-red-500/700 based on shade)
     * backgroundColor → bg-{color}-{shade}
     * padding/margin → p-/m-{size}
   - Never mix inline styles with Tailwind unless the original already does

5. **PRESERVE EVERYTHING ELSE**: Keep imports, state, hooks, functions, event handlers, formatting unchanged

6. Output ONLY the complete updated file code. No markdown fences, no explanations.`

  console.log(chalk.blue('  → Using Claude to merge changes...'))

  try {
    const result = await executeClaude(prompt)
    console.log(chalk.green('  ✓ Claude merge complete'))
    return result
  } catch (error) {
    console.error(chalk.red('  ✗ Claude merge failed:'), error)
    throw error
  }
}

/**
 * Execute Claude CLI command and return response
 */
function executeClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use Sonnet - Haiku fails to follow "output only code" instruction
    const claude = spawn('claude', [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    })

    let stdout = ''
    let stderr = ''

    claude.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    claude.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    claude.on('error', (error) => {
      reject(new Error(`Failed to spawn claude CLI: ${error.message}`))
    })

    claude.on('close', (code) => {
      if (code === 0) {
        // Claude might wrap response in markdown code blocks
        const cleaned = cleanClaudeResponse(stdout)
        resolve(cleaned)
      } else {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`))
      }
    })

    // Send prompt via stdin
    claude.stdin.write(prompt)
    claude.stdin.end()
  })
}

/**
 * Clean up Claude's response - remove markdown fences if present
 */
function cleanClaudeResponse(response: string): string {
  // Remove markdown code fences if present
  const fenceMatch = response.match(/```(?:tsx?|jsx?)?\n([\s\S]*?)```/)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }

  // Remove leading/trailing whitespace
  return response.trim()
}

/**
 * Check if Claude CLI is available
 */
export async function isClaudeAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const claude = spawn('which', ['claude'], {
      stdio: 'pipe',
      shell: true
    })

    claude.on('close', (code) => {
      resolve(code === 0)
    })

    claude.on('error', () => {
      resolve(false)
    })
  })
}
