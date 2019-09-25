import fs from 'fs-extra';
import yaml from 'js-yaml';
import chalk from 'chalk';
import zip from 'lodash.zip';
import { flags } from '@oclif/command';
import { File } from 'parse-diff';

import BaseCommand from '../base';
import logger from '../utils/logger';
import { TUTURE_YML_PATH, DIFF_PATH } from '../config';
import { Diff, Step, Tuture } from '../types';

type RawDiff = {
  commit: string;
  diff: File[];
};

// Markdown template for code blocks.
const codeBlock = (file: File) => {
  const lang = file.to ? file.to.split('.').slice(-1)[0] : '';
  const changes = file.chunks[0].changes;
  const code = changes
    ? changes.map((change) => change.content.slice(1)).join('\n')
    : '';

  return `
\`\`\`${lang}
${code}
\`\`\``;
};

// Markdown template for a Diff object.
const diffTmpl = (diff: Diff, file: File) => `
${diff.explain ? diff.explain.pre || '' : ''}
${codeBlock(file)}
${diff.explain ? diff.explain.post || '' : ''}`;

// Markdown template for a single Step.
const stepTmpl = (step: Step, files: File[]) => `
## ${step.name}

${step.explain ? step.explain.pre || '' : ''}
${zip(step.diff, files)
  .map((zipObj) => {
    const [diff, file] = zipObj;
    return diff && file && diff.display ? diffTmpl(diff, file) : '';
  })
  .join('')}
${step.explain ? step.explain.post || '' : ''}`;

// Markdown template for the whole tutorial.
const tutorialTmpl = (tuture: Tuture, rawDiffs: RawDiff[]) => `# ${tuture.name}

${tuture.description || ''}
${zip(tuture.steps, rawDiffs)
  .map((zipObj) => {
    const [step, rawDiff] = zipObj;
    return step && rawDiff ? stepTmpl(step, rawDiff.diff) : '';
  })
  .join('\n')}`;

export default class Build extends BaseCommand {
  static description = 'Build tutorial into a markdown document';

  static flags = {
    help: flags.help({ char: 'h' }),
    out: flags.string({
      char: 'o',
      description: 'name of output file',
    }),
  };

  async run() {
    const { flags } = this.parse(Build);

    if (!fs.existsSync(TUTURE_YML_PATH) || !fs.existsSync(DIFF_PATH)) {
      logger.log(
        'error',
        `You are not in a Tuture tutorial. Run ${chalk.bold(
          'tuture init',
        )} to initialize one.`,
      );
      this.exit(1);
    }

    const tuture: Tuture = yaml.safeLoad(
      fs.readFileSync(TUTURE_YML_PATH).toString(),
    );
    const rawDiff: RawDiff[] = JSON.parse(
      fs.readFileSync(DIFF_PATH).toString(),
    );

    if (rawDiff.length === 0) {
      logger.log(
        'warning',
        'No commits yet. Target tutorial will have empty content.',
      );
    }

    const tutorial = tutorialTmpl(tuture, rawDiff);
    const dest = flags.out || 'tutorial.md';
    fs.writeFileSync(dest, tutorial);

    logger.log('success', `Tutorial has been written to ${chalk.bold(dest)}`);
  }
}