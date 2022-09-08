import {parseGitIgnore} from '@heightapp/update-todos';
import watch from 'node-watch';

import path from 'path';

class GitRepo {
  private path: string;

  constructor(options: {path: string}) {
    this.path = options.path;
  }

  async watch(onChange: (filePath: string) => void) {
    const gitIgnore = await parseGitIgnore(this.path);
    return watch(
      this.path,
      {
        recursive: true,
      },
      (eventType, filePath) => {
        if (eventType === 'update') {
          const relativePath = path.relative(this.path, filePath);
          if (!gitIgnore || gitIgnore.accepts(relativePath)) {
            onChange(filePath);
          } else {
            // Ignored
          }
        }
      },
    );
  }
}

export default GitRepo;
