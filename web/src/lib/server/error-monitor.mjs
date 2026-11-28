import { sendCode, diagnosticTags } from '../telemetry-envelope.mjs';
const last = new Map();
export async function reportServiceError(code, durationMs) {
  // Vercel central runtime logs; no request, error message, SQL or credentials.
  const context = {durationMs};
  console.error('[nutrivn]', code, diagnosticTags(code,context));
  if (!process.env.SENTRY_DSN) return;
  const now = Date.now();
  if (now - (last.get(code) || 0) < 60000) return;
  last.set(code, now);
  await sendCode(process.env.SENTRY_DSN,code,process.env.VERCEL_ENV,context);
}
