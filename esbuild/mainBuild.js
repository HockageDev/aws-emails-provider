const esbuild = require('esbuild')
const { findFiles } = require('./filterBaseDirectories')
// INSERT: pattern by directory to find entry points into baseDirectories array
const baseDirectories = ['src/handlers']

const entryPoints = findFiles(baseDirectories, '.js')

const baseOptions = {
  entryPoints: entryPoints,
  entryNames: '[dir]/[name]',
  bundle: true,
  platform: 'node',
  target: 'node18',
  outdir: 'dist',
  outbase: 'src',
}

const buildOptions = {
  main: {
    ...baseOptions,
    minify: true,
  },
  offline: {
    ...baseOptions,
    keepNames: true,
  },
}

esbuild.build(buildOptions[process.argv[2]]).catch(() => process.exit(1))
