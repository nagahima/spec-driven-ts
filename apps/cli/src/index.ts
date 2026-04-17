#!/usr/bin/env node
import { Command } from 'commander'
import { createAuthCommand } from './commands/auth'
import { createSpecCommand } from './commands/spec'
import { createTaskCommand } from './commands/task'

const program = new Command()

program
  .name('sdd')
  .description('仕様駆動開発ツール')
  .version('0.1.0')

program.addCommand(createAuthCommand())
program.addCommand(createSpecCommand())
program.addCommand(createTaskCommand())

program.parse()
