#!/usr/bin/env node
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ReelConfig } from './types.js'
import { runReel } from './runner.js'

const help = `Canvas Regression Reel 0.1.0

Usage:
  canvas-reel run [config] [--update] [--json]
  canvas-reel --help

Commands:
  run       Replay the configured inputs, capture canvas checkpoints, compare,
            and write a self-contained HTML reel.

Arguments:
  config    ESM config file (default: reel.config.mjs)

Options:
  --update  Intentionally create or replace every baseline
  --json    Print one JSON result to stdout (diagnostics go to stderr)
  --help    Show this help

Exit codes:
  0  All frames passed, or baselines were updated
  1  Changed/missing frame or run error
  2  Invalid command or config could not be loaded
`

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) { process.stdout.write(help); return }
  if (args[0] !== 'run') { process.stderr.write(help); process.exitCode = 2; return }
  const json = args.includes('--json')
  const update = args.includes('--update')
  const configArg = args.slice(1).find((arg) => !arg.startsWith('-')) ?? 'reel.config.mjs'
  const configPath = resolve(process.cwd(), configArg)
  let config: ReelConfig
  try {
    const module = await import(`${pathToFileURL(configPath).href}?t=${Date.now()}`)
    config = module.default
  } catch (error) {
    process.stderr.write(`Could not load ${configArg}: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 2
    return
  }
  let result
  try {
    result = await runReel(config, { update })
  } catch (error) {
    process.stderr.write(`Invalid run configuration: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 2
    return
  }
  if (json) process.stdout.write(`${JSON.stringify(result)}\n`)
  else {
    process.stdout.write(`${result.ok ? 'CLEAR' : 'CHANGE'} · ${result.checkpoints.length} checkpoint${result.checkpoints.length === 1 ? '' : 's'} · ${result.durationMs}ms\n`)
    for (const checkpoint of result.checkpoints) {
      process.stdout.write(`  ${checkpoint.status.padEnd(7)} ${checkpoint.name}  ${(checkpoint.changedPixelRatio * 100).toFixed(3)}%\n`)
    }
    process.stdout.write(`Report: ${result.reportPath}\n`)
  }
  if (!result.ok) process.exitCode = 1
}

void main()
