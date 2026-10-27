import { Glob } from 'bun';

/**
 * Two conventions the suite depends on, checked rather than documented.
 *
 * A raw selector in a step definition spreads the platform fork that
 * AppScreen exists to contain. A fixed pause turns the suite into a detector of
 * how fast the machine happens to be today.
 */
const FORBIDDEN = [
  {
    pattern: /\$\(|\$\$\(/,
    reason: 'raw element selector — address the element through a screen object',
  },
  {
    pattern: /\.pause\(/,
    reason: 'fixed pause — wait for an observable condition instead',
  },
];

const failures: string[] = [];

for await (const file of new Glob('step-definitions/**/*.ts').scan('.')) {
  const lines = (await Bun.file(file).text()).split('\n');

  lines.forEach((line, index) => {
    for (const { pattern, reason } of FORBIDDEN) {
      if (pattern.test(line)) {
        failures.push(`${file}:${index + 1}  ${reason}\n    ${line.trim()}`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error(`Step definition conventions violated:\n\n${failures.join('\n')}\n`);
  process.exit(1);
}

console.log('Step definition conventions hold.');
