#!/usr/bin/env node
import { Command } from 'commander'
import { createAuthCommand } from './commands/auth'

const program = new Command()

program
  .name('sdd')
  .description('仕様駆動開発ツール')
  .version('0.1.0')

program.addCommand(createAuthCommand())

program.parse()
