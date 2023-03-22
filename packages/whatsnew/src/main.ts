#!/usr/bin/env node

import { Command } from 'commander';
import { whatsnew, WhatsNewOptions } from '.';

const program = new Command('whatsnew');
program
  .option(
    '--prerelease',
    'Allow prereleases to be considered in the upgrade path'
  )
  .option('--apply', 'Apply the next upgrade step if available')
  .option(
    '--pkgmgr <packageManager>',
    'The package manager (e.g. `npm`) to use. If not set, whatsnew will autodetect the package manager to use.'
  )
  .argument('<dependency>', 'Name of the dependency to be checked')
  .action((dependencyName, options) => {
    const whatsnewOptions: WhatsNewOptions = {
      dependencyName,
      packageManager: options.pkgmgr,
      allowPrerelease: options.prerelease,
      applyNextUpgradeStep: options.apply,
    };

    whatsnew(whatsnewOptions);
  });

program.parse();
