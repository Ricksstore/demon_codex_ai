export interface IReplaceLineText {
  /** If cell in notebook */
  cell?: number;
  /** Zero-based Line that we are replacing */
  line: number;
  /** New text for the line */
  text: string;
}

/**
 * Data structure for problems that we automatically fix with code actions
 */
export type AutoFixProblem = IReplaceLineText[];
