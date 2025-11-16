#!/usr/bin/env node

import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import cors from 'cors'
import { watch } from 'chokidar'
import { readFile, writeFile, access } from 'fs/promises'
import { resolve, relative, join, basename } from 'path'
import { constants } from 'fs'
import chalk from 'chalk'
import {
  parseJSX,
  generateJSX,
  generateCompleteFile,
  updateExistingFile,
  extractComponentDependencies,
  getComponentImportMappings,
  extractComponentReturn,
  type FEElement,
  type ComponentIndex
} from '@lunagraph/codegen'
import { mergeWithClaude, isClaudeAvailable } from './claudeMerge.js'

const PORT = process.env.LUNAGRAPH_PORT || 4001
const PROJECT_ROOT = process.cwd()

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

// Load ComponentIndex.json
let componentIndex: ComponentIndex = {}
let useClaudeMerge = false

async function loadComponentIndex() {
  try {
    const indexPath = join(PROJECT_ROOT, '.lunagraph', 'ComponentIndex.json')
    const content = await readFile(indexPath, 'utf-8')
    componentIndex = JSON.parse(content)
    console.log(chalk.green('✓ Loaded ComponentIndex.json'))
  } catch (error) {
    console.warn(chalk.yellow('⚠ ComponentIndex.json not found. Run `lunagraph scan` first.'))
  }
}

async function checkClaudeAvailability() {
  useClaudeMerge = await isClaudeAvailable()
  if (useClaudeMerge) {
    console.log(chalk.green('✓ Claude CLI detected - using intelligent merge'))
  } else {
    console.log(chalk.yellow('⚠ Claude CLI not found - using deterministic merge'))
  }
}

// Enable CORS for all origins in development
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Store connected clients
const clients = new Set<any>()

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log(chalk.green('✓ Client connected'))
  clients.add(ws)

  ws.on('close', () => {
    console.log(chalk.yellow('- Client disconnected'))
    clients.delete(ws)
  })

  ws.on('error', (error) => {
    console.error(chalk.red('WebSocket error:'), error)
    clients.delete(ws)
  })
})

// Broadcast message to all connected clients
function broadcast(message: any) {
  const data = JSON.stringify(message)
  clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(data)
    }
  })
}

// Validate file path is within project root (security)
function validatePath(filePath: string): { valid: boolean; error?: string; absolutePath?: string } {
  try {
    const absolutePath = resolve(PROJECT_ROOT, filePath)
    const relativePath = relative(PROJECT_ROOT, absolutePath)

    // Prevent directory traversal attacks
    if (relativePath.startsWith('..') || relativePath.startsWith('/')) {
      return { valid: false, error: 'Path outside project root' }
    }

    return { valid: true, absolutePath }
  } catch (error) {
    return { valid: false, error: 'Invalid path' }
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', clients: clients.size })
})

// Read file and extract component return JSX + variables
app.get('/api/files/*', async (req, res) => {
  try {
    const filePath = (req.params as any)[0] as string
    const validation = validatePath(filePath)

    if (!validation.valid) {
      return res.status(403).json({
        success: false,
        error: validation.error
      })
    }

    console.log(chalk.blue('Reading file:'), filePath)

    const content = await readFile(validation.absolutePath!, 'utf-8')

    // Extract return JSX and variables
    const extracted = extractComponentReturn(content)

    if (!extracted) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract component return statement'
      })
    }

    res.json({
      success: true,
      filePath,
      returnJSX: extracted.returnJSX,
      variables: extracted.variables,
      initialValues: extracted.initialValues,
      props: extracted.props,
      raw: content
    })
  } catch (error) {
    console.error(chalk.red('Error reading file:'), error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

// Write FEElement tree to file
app.post('/api/files/*', async (req, res) => {
  try {
    const filePath = (req.params as any)[0] as string
    const validation = validatePath(filePath)

    if (!validation.valid) {
      return res.status(403).json({
        success: false,
        error: validation.error
      })
    }

    const { elements, stateContext } = req.body as {
      elements: FEElement[]
      stateContext?: Record<string, any>  // Mock values used during editing
    }

    if (!elements || !Array.isArray(elements)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid elements array'
      })
    }

    console.log(chalk.blue('Writing file:'), filePath)

    // Check if file exists
    let fileExists = false
    try {
      await access(validation.absolutePath!, constants.F_OK)
      fileExists = true
    } catch {
      fileExists = false
    }

    let generatedCode: string

    if (fileExists) {
      // Update existing file - preserve imports, exports, hooks, etc.
      console.log(chalk.blue('  → Updating existing file'))
      const existingCode = await readFile(validation.absolutePath!, 'utf-8')

      if (useClaudeMerge) {
        // Use Claude CLI for intelligent merging
        const generatedJSX = generateJSX(elements)

        // Get component import hints for Claude
        const componentDeps = extractComponentDependencies(elements)
        const componentImports = getComponentImportMappings(componentDeps, componentIndex)

        generatedCode = await mergeWithClaude({
          originalCode: existingCode,
          generatedJSX,
          filePath,
          componentImports,
          stateContext  // Pass state context to Claude
        })
      } else {
        // Fallback to deterministic AST manipulation
        generatedCode = updateExistingFile({
          existingCode,
          elements,
          componentIndex,
          targetFilePath: filePath
        })
      }
    } else {
      // Generate new file - create complete component
      console.log(chalk.blue('  → Creating new file'))

      // Extract component name from filename (e.g., MyComponent.tsx → MyComponent)
      const componentName = basename(filePath, '.tsx').replace(/\.tsx?$/, '')

      generatedCode = generateCompleteFile({
        componentName,
        elements,
        componentIndex,
        targetFilePath: filePath
      })
    }

    // Write to file
    await writeFile(validation.absolutePath!, generatedCode, 'utf-8')

    // Broadcast file change to all clients
    broadcast({
      type: 'file-updated',
      filePath,
      elements
    })

    res.json({
      success: true,
      filePath,
      code: generatedCode
    })
  } catch (error) {
    console.error(chalk.red('Error writing file:'), error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

// Start server
async function start() {
  // Load component index and check Claude availability
  await Promise.all([
    loadComponentIndex(),
    checkClaudeAvailability()
  ])

  server.listen(PORT, () => {
    console.log('')
    console.log(chalk.green.bold('🌙 Lunagraph Dev Server'))
    console.log(chalk.dim('─'.repeat(50)))
    console.log(chalk.cyan('HTTP Server:'), `http://localhost:${PORT}`)
    console.log(chalk.cyan('WebSocket:'), `ws://localhost:${PORT}`)
    console.log(chalk.cyan('Project Root:'), PROJECT_ROOT)
    console.log(chalk.cyan('Merge Strategy:'), useClaudeMerge ? 'Claude CLI (Intelligent)' : 'Deterministic (AST)')
    console.log(chalk.dim('─'.repeat(50)))
    console.log(chalk.gray('Waiting for connections...'))
    console.log('')
  })
}

start().catch(error => {
  console.error(chalk.red('Failed to start server:'), error)
  process.exit(1)
})

// Watch for file changes (like jsx-tool does)
const watcher = watch('**/*.{ts,tsx,js,jsx}', {
  ignored: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.lunagraph/**'],
  persistent: true,
  ignoreInitial: true,
  cwd: PROJECT_ROOT
})

watcher.on('change', (filePath) => {
  console.log(chalk.yellow('File changed:'), filePath)
  broadcast({
    type: 'file-changed',
    filePath
  })
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nShutting down...'))
  watcher.close()
  server.close(() => {
    console.log(chalk.green('Server closed'))
    process.exit(0)
  })
})
