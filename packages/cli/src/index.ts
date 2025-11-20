#!/usr/bin/env node

import { Command } from 'commander'
import { scanCommand } from './commands/scan.js'

const program = new Command()

program
  .name('lunagraph')
  .description('CLI tool for scanning and indexing React components')
  .version('0.1.0')

program
  .command('scan')
  .description('Scan for React components and generate index')
  .option('-p, --pattern <pattern>', 'Glob pattern to scan (overrides defaults)')
  .option('-o, --output <path>', 'Output path for ComponentIndex.json', '.lunagraph/ComponentIndex.json')
  .action(scanCommand)

program.parse()
