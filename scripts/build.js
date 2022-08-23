#! /usr/bin/env node

import esbuild from 'esbuild';
import fs from 'fs';
import glob from 'glob';
import path from 'path';

// WARNING: Do not use relative path with `./` or it doesn't work on Windows
const SRC_DIR = 'src';
const DIST_DIR = 'dist';

const entryPoints = [
  'src/cli.ts',
  'src/watch.ts',
];

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const external = Object.keys({
  ...(packageJson.dependencies || {}),
  ...(packageJson.devDependencies || {}),
  ...(packageJson.peerDependencies || {}),
  ...(packageJson.optionalDependencies || {}),
});

const removeOutDir = async () => {
  await fs.promises.rm(DIST_DIR, {recursive: true, force: true});
}

const moveEntryPoints = async () => {
  const srcJsFiles = await new Promise((resolve) =>
    glob(path.join(DIST_DIR, SRC_DIR, '**', '*.js'), (err, results) => {
      resolve(results);
    }),
  );

  srcJsFiles.forEach((jsPath) => {
    const jsRelativePath = path.relative(path.join(DIST_DIR, SRC_DIR), jsPath);
    const outputPath = path.join(DIST_DIR, jsRelativePath);
    if (fs.existsSync(jsPath)) {
      fs.mkdirSync(path.dirname(outputPath), {recursive: true});
      fs.renameSync(jsPath, outputPath);
    }
  });

  await fs.promises.rm(path.resolve(DIST_DIR, SRC_DIR), {recursive: true});
};

// Define node env statically since we want this to be part of the build
// and not depend on the user's environment.
const define = {
  'process.env.NODE_ENV': `"${process.env.NODE_ENV ?? 'development'}"`,
  'process.env.HEIGHT_DEBUG': `${process.env.HEIGHT_DEBUG ?? 'false'}`,
};

const compile = async () => {
  // Remove the directory before building or moving files fails on Windows (does not override)
  await removeOutDir();

  try {
    await esbuild.build({
      entryPoints,
      bundle: true,
      outbase: './',
      external,
      outdir: DIST_DIR,
      platform: 'node',
      target: 'node16',
      format: 'esm',
      treeShaking: true,
      define,
    });
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  await moveEntryPoints();
};

compile();
