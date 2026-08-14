/**
 * Validate an uploaded JSON payload against the canonical pct6-tune v1 schema.
 * Used when a user uploads pct6-tune-compliant JSON directly (rather than a
 * raw .pct6, which we decode ourselves and therefore trust).
 */
import Ajv2020, { type ErrorObject } from "ajv/dist/2020";
import schema from "./schema.json";
import type { DecodedTune } from "./types";

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateFn = ajv.compile(schema);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: DecodedTune;
}

function formatError(e: ErrorObject): string {
  const path = e.instancePath || "(root)";
  return `${path} ${e.message ?? "is invalid"}`;
}

export function validateTuneJson(input: unknown): ValidationResult {
  const valid = validateFn(input);
  if (valid) {
    return { valid: true, errors: [], data: input as unknown as DecodedTune };
  }
  const errors = (validateFn.errors ?? []).slice(0, 12).map(formatError);
  return { valid: false, errors };
}
