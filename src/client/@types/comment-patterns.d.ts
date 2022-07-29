declare module 'comment-patterns' {
  export default function commentPatterns(
    filename: string,
  ):
    | {
        name?: string;
        nameMatchers?: Array<string>;
        multiLineComment?: Array<{
          start?: RegExp;
          middle?: string;
          end?: string;
          apidoc?: boolean;
        }>;
        singleLineComment?: Array<{
          start?: string;
        }>;
      }
    | undefined
    | null;
}
