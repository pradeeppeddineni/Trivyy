/**
 * 8-layer AI pull request reviewer (CI-4). Fetches the PR diff, asks the
 * Anthropic API to review it across eight layers, and posts the result as a PR
 * comment. Invoked by .github/workflows/pr-review.yml.
 *
 * Required env: GITHUB_TOKEN, GITHUB_REPOSITORY (owner/repo), PR_NUMBER,
 * ANTHROPIC_API_KEY. The API key comes from a GitHub Actions secret (SEC-1).
 */

const { GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, ANTHROPIC_API_KEY } = process.env;

const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

const LAYERS = [
  'Functional correctness — does the change do what it claims, including edge cases?',
  'Security — input validation, authz, secrets, injection, data exposure (OWASP).',
  'Backend standards — thin handlers, service layer, error handling, no leaks.',
  'Frontend standards — explicit loading/empty/error/success states, design tokens.',
  'Test quality — tests added with the code, meaningful assertions, coverage.',
  'Database standards — migrations only, snake_case, indexing, no N+1.',
  'API contract — validated input (zod), clear JSON errors, documented endpoints.',
  'Domain checks — trivia rules: locked question sets, fair scoring, soft-deletes.',
];

function requireEnv() {
  const missing = ['GITHUB_TOKEN', 'GITHUB_REPOSITORY', 'PR_NUMBER', 'ANTHROPIC_API_KEY'].filter(
    (key) => !process.env[key],
  );
  if (missing.length > 0) {
    throw new Error(`Missing required env: ${missing.join(', ')}`);
  }
}

async function fetchDiff() {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3.diff',
      'User-Agent': 'trivyy-pr-review',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch PR diff: ${res.status}`);
  }
  return res.text();
}

async function review(diff) {
  // Keep the prompt within a sane size; truncate very large diffs.
  const truncated = diff.length > 100_000 ? `${diff.slice(0, 100_000)}\n...[truncated]` : diff;
  const layerList = LAYERS.map((layer, i) => `${i + 1}. ${layer}`).join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content:
            `You are the Trivyy PR reviewer. Review the diff across these eight layers:\n${layerList}\n\n` +
            `For each layer, give a brief verdict and only flag real, actionable issues ` +
            `(cite file and line). End with an overall PASS or REQUEST CHANGES.\n\n` +
            `Diff:\n\`\`\`diff\n${truncated}\n\`\`\``,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.content?.map((block) => block.text).join('') ?? 'No review content returned.';
}

async function postComment(body) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'trivyy-pr-review',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ body: `## 🤖 8-layer PR review\n\n${body}` }),
    },
  );
  if (!res.ok) {
    throw new Error(`Failed to post comment: ${res.status}`);
  }
}

async function main() {
  requireEnv();
  const diff = await fetchDiff();
  const result = await review(diff);
  await postComment(result);
  console.log('Posted PR review.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
