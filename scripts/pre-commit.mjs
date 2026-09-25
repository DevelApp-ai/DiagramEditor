import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const SECRET_PATTERNS = [
  /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /sk-[A-Za-z0-9]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/
];

function fail(message) {
  console.error('pre-commit: ' + message);
  process.exit(1);
}

const staged = execSync('git diff --cached --name-only --diff-filter=ACM')
  .toString()
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.length > 0);

for (const file of staged) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      fail('possible secret detected in ' + file + ' - remove it and revoke if it was ever valid');
    }
  }
}

const lintTargets = staged.filter(
  (file) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.config.js')
);

if (lintTargets.length > 0) {
  try {
    execSync('npx eslint ' + lintTargets.join(' '), { stdio: 'inherit' });
  } catch {
    fail('eslint failed on staged files');
  }
}

process.exit(0);
