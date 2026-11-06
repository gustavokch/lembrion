// Models often open an explanation with its own label ("**Explanation:**"),
// which repeats the block title it is rendered under.
const LEADING_LABEL = /^\s*(?:\*\*|__|\*|_)?\s*(?:explanation|explicação|explicacao)\s*(?:\*\*|__|\*|_)?\s*:\s*(?:\*\*|__|\*|_)?\s*/i;

/** Remove a leading "Explanation:" / "Explicação:" label, bold or plain, from model text. */
export function stripExplanationLabel(text: string): string {
  return text.replace(LEADING_LABEL, '');
}
