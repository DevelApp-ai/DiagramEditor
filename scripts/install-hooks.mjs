import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('.git/hooks', { recursive: true });
writeFileSync('.git/hooks/pre-commit', '#!/bin/sh\nexec node scripts/pre-commit.mjs\n');
chmodSync('.git/hooks/pre-commit', 0o755);
console.log('pre-commit hook installed');
