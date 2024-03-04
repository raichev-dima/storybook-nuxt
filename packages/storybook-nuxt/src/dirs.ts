import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'pathe'

export const distDir = dirname(fileURLToPath(import.meta.url))

export const runtimeDir = resolve(distDir, 'runtime')

export const packageDir = resolve(distDir, '..')

export const dirs = [distDir, packageDir, runtimeDir]
