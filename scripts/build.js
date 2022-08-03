#! /usr/bin/env node

import esbuild from 'esbuild';
import fs from 'fs';
import glob from 'glob';
import path from 'path';

const SRC_DIR = './src';
const DIST_DIR = './dist';

const entryPoints = [
  'src/index.ts',
];

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const external = Object.keys({
  ...(packageJson.dependencies || {}),
  ...(packageJson.devDependencies || {}),
  ...(packageJson.peerDependencies || {}),
});

const moveEntryPoints = async () => {
  const srcJsFiles = await new Promise((resolve) =>
    glob(path.join(DIST_DIR, SRC_DIR, '**', '*\\.js'), (err, results) => {
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


const compile = async () => {
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
      // loader: {
      //   '.ts': 'ts',
      //   '.png': 'file',
      //   '.jpg': 'file',
      //   '.svg': 'file',
      //   '.node': 'binary',
      //   '.wav': 'file',
      //   '.webmanifest': 'file',
      //   '.woff': 'file',
      //   '.woff2': 'file',
      // },
    });
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  await moveEntryPoints();
};

compile();
