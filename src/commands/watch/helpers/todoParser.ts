import commentPatterns from 'comment-patterns';
import escapeStringRegexp from 'escape-string-regexp';
import memoize from 'memoizee';

const TODO_PATTERN = 'TODO(?!:?\\s+T-\\d+):?\\s+(.*)';

// Find prefix to use to find comments based on the filePath (language type)
const fileCommentPrefixes = memoize(
  (filePath: string) => {
    let patterns: ReturnType<typeof commentPatterns> | null = null;

    try {
      patterns = commentPatterns(filePath);
    } catch (e) {
      return null;
    }

    if (!patterns) {
      return null;
    }

    const singleLineComments = patterns.singleLineComment ?? [];
    if (!singleLineComments.length) {
      return null;
    }

    return singleLineComments.reduce<Array<string>>((acc, {start}) => {
      if (start) {
        acc.push(start);
      }
      return acc;
    }, []);
  },
  {
    max: 100,
    maxAge: 10 * 60 * 1000, // 10 minutes
  },
);

// Create regex to use to find comments for specific prefixes
const fileCommentRegex = memoize(
  (...prefixes: Array<string>) => {
    const lineStartRegex = prefixes.map((prefix) => `(?:${escapeStringRegexp(prefix)})`).join('|');
    return new RegExp(`^(\\s*${lineStartRegex}\\s*)${TODO_PATTERN}`, 'i');
  },
  {
    max: 10,
    maxAge: 60 * 60 * 1000, // 1 hour
    length: false,
  },
);

class TodoParser {
  private filePath: string;

  static isFileSupported(filePath: string) {
    return fileCommentPrefixes(filePath) !== null;
  }

  constructor({filePath}: {filePath: string}) {
    this.filePath = filePath;
  }

  parse(line: string) {
    // Find regex to use to find todos in the file
    const prefixes = fileCommentPrefixes(this.filePath);
    if (!prefixes) {
      return null;
    }

    const regex = fileCommentRegex(...prefixes);
    const match = line.match(regex);
    if (!match?.length) {
      return null;
    }

    return {
      prefix: match[1],
      name: match[2],
    };
  }
}


export default TodoParser;
