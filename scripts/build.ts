import { rm } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dir, '..');
const output = path.join(root, 'dist');
// The output directory is fixed beneath this repository.
await rm(output, { recursive: true, force: true });
const entries = [
  'cli.ts',
  ...Array.from(new Bun.Glob('src/**/*.ts').scanSync(root)),
];
const result = await Bun.build({
  entrypoints: entries.map((entry) => path.join(root, entry)),
  root,
  outdir: output,
  target: 'node',
  format: 'cjs',
  external: ['*'],
  sourcemap: 'external',
  naming: '[dir]/[name].[ext]',
});
if (!result.success)
  throw new AggregateError(result.logs, 'Package build failed');
const declarations = Bun.spawn(
  [
    process.execPath,
    'node_modules/typescript/bin/tsc',
    '-p',
    'tsconfig.build.json',
  ],
  { cwd: root, stdout: 'inherit', stderr: 'inherit' },
);
process.exitCode = await declarations.exited;
