import fs from 'fs';
import path from 'path';
import {compile as gitIgnoreParserCompile} from 'gitignore-parser';
import watch from 'node-watch';

class GitRepo {
  private path: string

  constructor({path}: {path: string}) {
    this.path = path;
  }

  private async parseGitIgnore() {
    try {
      const gitignorePath = path.resolve(this.path, './.gitignore');
      const file = await fs.promises.readFile(gitignorePath, {
        encoding: 'utf-8',
      });

      return gitIgnoreParserCompile(file);
    } catch {
      return null;
    }
  }

  async watch(onChange: (filePath: string) => void) {
    const gitIgnore = await this.parseGitIgnore();
    return watch(this.path, {
      recursive: true,
    }, (eventType, filePath) => {
      if (eventType === 'update') {
        const relativePath = path.relative(this.path, filePath);
        if (!gitIgnore || gitIgnore.accepts(relativePath)) {
          onChange(filePath);
        } else {
          // Ignored
        }
      }
    });
  }
}

export default GitRepo
