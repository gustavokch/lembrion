/**
 * Parse and validate the JSON question a model returns
 */

import { AIProvider, GeneratedQuestion } from '../../types/ai.types';
import { debugLog } from './debug';
import { createAIError } from './errors';
import { MULTIPLE_CHOICE_OPTION_COUNT } from './prompts/promptRegistry';

export type ParsedQuestion = Omit<GeneratedQuestion, 'metadata'>;

export interface ParsedEvaluation {
  feedback: string;
  score: number;
}

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

/**
 * Extract the question JSON from model output and check it against the shape the prompt
 * asks for. Invalid output throws a retryable INVALID_RESPONSE AIError, because a new
 * generation can succeed.
 */
export function parseQuestionResponse(
  content: string,
  type: GeneratedQuestion['type'],
  provider: AIProvider
): ParsedQuestion {
  const invalid = (detail: string) => invalidResponse(provider, detail);
  const optionalString = (value: unknown, field: string): string | undefined => {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string') throw invalid(`${field} must be a string`);
    return value;
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonFromResponse(content));
  } catch (error) {
    debugLog('Unparseable AI response:', content);
    throw invalid(error instanceof Error ? error.message : 'could not parse JSON');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw invalid('expected a JSON object');
  }
  const fields = parsed as Record<string, unknown>;

  const question = fields.question;
  if (typeof question !== 'string' || question.trim() === '') {
    throw invalid('question must be a non-empty string');
  }
  const difficulty = DIFFICULTIES.find(level => level === fields.difficulty);

  if (type === 'multipleChoice') {
    const options = fields.options;
    if (
      !Array.isArray(options) ||
      options.length !== MULTIPLE_CHOICE_OPTION_COUNT ||
      !options.every((option): option is string => typeof option === 'string' && option.trim() !== '')
    ) {
      throw invalid(`options must be an array of ${MULTIPLE_CHOICE_OPTION_COUNT} non-empty strings`);
    }

    const rawAnswer = fields.correctAnswer;
    const correctAnswer = typeof rawAnswer === 'string' && /^\s*\d+\s*$/.test(rawAnswer) ? Number(rawAnswer) : rawAnswer;
    if (typeof correctAnswer !== 'number' || !Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
      throw invalid(`correctAnswer must be an integer from 0 to ${options.length - 1}`);
    }

    return {
      question,
      type,
      options,
      correctAnswer,
      explanation: optionalString(fields.explanation, 'explanation'),
      difficulty,
    };
  }

  const rawCriteria = fields.evaluationCriteria;
  let evaluationCriteria: string[] | undefined;
  if (rawCriteria !== undefined && rawCriteria !== null) {
    if (!Array.isArray(rawCriteria) || !rawCriteria.every((criterion): criterion is string => typeof criterion === 'string')) {
      throw invalid('evaluationCriteria must be an array of strings');
    }
    evaluationCriteria = rawCriteria;
  }

  return {
    question,
    type,
    sampleAnswer: optionalString(fields.sampleAnswer, 'sampleAnswer'),
    evaluationCriteria,
    difficulty,
  };
}

/** A ```json fence at the start of a line, through the next line that starts with ``` */
const JSON_FENCE = /^[ \t]*```json[^\n]*\n([\s\S]*?)^[ \t]*```[ \t]*$/gm;

/**
 * Split evaluation output into the Markdown feedback and the score from its last
 * ```json {"score": n} block. The score is rounded and clamped to 0-100, and the block
 * is removed from the feedback. A missing block or a non-numeric score throws a
 * retryable INVALID_RESPONSE AIError.
 */
export function parseEvaluationResponse(content: string, provider: AIProvider): ParsedEvaluation {
  const verdict = Array.from(content.matchAll(JSON_FENCE)).pop();
  if (!verdict) {
    debugLog('Evaluation without a verdict block:', content);
    throw invalidResponse(provider, 'missing the ```json score block');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(verdict[1]);
  } catch {
    throw invalidResponse(provider, 'the score block is not valid JSON');
  }
  const score = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>).score : undefined;
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    throw invalidResponse(provider, 'score must be a number');
  }

  const start = verdict.index ?? 0;
  const feedback = (content.slice(0, start) + content.slice(start + verdict[0].length)).trim();
  return { feedback, score: Math.min(100, Math.max(0, Math.round(score))) };
}

function invalidResponse(provider: AIProvider, detail: string) {
  return createAIError(provider, `Invalid AI response: ${detail}`, 'INVALID_RESPONSE', undefined, true);
}

/**
 * Return the body of the ```json block, or the first balanced {...} object when the
 * model omitted the fence. A ``` only closes the block at the start of a line, so code
 * fences inside JSON strings do not end it early.
 */
function extractJsonFromResponse(content: string): string {
  const jsonStart = content.indexOf('```json');
  if (jsonStart === -1) {
    return extractFirstJsonObject(content);
  }

  const jsonContentStart = content.indexOf('\n', jsonStart) + 1;
  if (jsonContentStart === 0) {
    throw new Error('Malformed JSON code block - no newline after ```json');
  }

  let searchPos = jsonContentStart;
  while (searchPos < content.length) {
    const fence = content.indexOf('```', searchPos);
    if (fence === -1) {
      break;
    }
    const lineStart = content.lastIndexOf('\n', fence);
    if (content.substring(lineStart + 1, fence).trim() === '') {
      return content.substring(jsonContentStart, fence);
    }
    searchPos = fence + 3;
  }

  throw new Error('No closing ``` found for JSON code block');
}

function extractFirstJsonObject(content: string): string {
  const startIndex = content.indexOf('{');
  if (startIndex === -1) {
    throw new Error('No JSON object found in response');
  }

  let braceCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        return content.substring(startIndex, i + 1);
      }
    }
  }

  throw new Error('No matching closing brace found for JSON object');
}
