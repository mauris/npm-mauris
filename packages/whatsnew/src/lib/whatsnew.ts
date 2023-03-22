import {
  sort as semverSort,
  inc as semverInc,
  prerelease as semverPrerelease,
  major as semverMajor,
  satisfies as semverSatisfies,
} from 'semver';
import * as npmAdapter from './package-managers/npm';

export type PackageManagerObject = {
  listDependencies: () => Promise<Record<string, { version: string }> | null>;
  getRegistryVersions: (packageName: string) => Promise<string[] | null>;
  applyPackageUpdate: (packageName: string, version: string) => Promise<void>;
};

export type BuiltInPackageManangerTypes = 'npm'; // | 'yarn';
export type PackageManager = BuiltInPackageManangerTypes | PackageManagerObject;

export type WhatsNewOptions = {
  dependencyName: string;
  packageManager?: PackageManager | undefined;
  allowPrerelease?: boolean | undefined;
  applyNextUpgradeStep?: boolean | undefined;
};

export type NormalizedWhatsNewOptions = {
  dependencyName: string;
  packageManager: PackageManager;
  allowPrerelease: boolean;
  applyNextUpgradeStep: boolean;
};

function normalizeOptions({
  packageManager = 'npm',
  allowPrerelease = false,
  applyNextUpgradeStep = false,
  ...otherOptions
}: WhatsNewOptions) {
  return {
    packageManager,
    allowPrerelease,
    applyNextUpgradeStep,
    ...otherOptions,
  };
}

const adapters: { [key in BuiltInPackageManangerTypes]: PackageManagerObject } =
  {
    npm: npmAdapter,
  };

function semverSearchLargestSatisfies(
  sortedList: string[],
  condition: string,
  _start = 0
) {
  let start = _start;
  let end = sortedList.length - 1;
  let result: string | null = null; // initialize result to -1
  let mid = -1;

  while (start <= end) {
    mid = Math.floor((start + end) / 2);

    if (
      semverSatisfies(sortedList[mid], condition, { includePrerelease: true })
    ) {
      result = sortedList[mid];
      start = mid + 1; // search in the right half of the array
    } else {
      // if the current element is greater than or equal to N, search in the left half of the array
      end = mid - 1;
    }
  }

  return [result, start - 1 < 0 ? -1 : start - 1] as const;
}

type SemverPartition = {
  major: number;
  start: string;
  end: string;
  range: string;
  versions: string[];
  next: SemverPartition | null;
};

export function semverMajorPartition(versions: string[]): SemverPartition[] {
  if (versions.length === 0) {
    return [];
  }
  let startIdx = 0;
  const result = [];
  let startVersion: string;
  let nextMajorVersion: string | null;

  while (startIdx < versions.length) {
    startVersion = versions[startIdx];
    const startVersionMajor = semverMajor(startVersion);
    nextMajorVersion = semverInc(startVersion, 'major');
    if (!nextMajorVersion) {
      return [];
    }
    const sortedList = semverSort(versions);
    const [, rangeEndPos] = semverSearchLargestSatisfies(
      sortedList,
      `<${startVersionMajor + 1}`,
      startIdx
    );
    const slice = sortedList.slice(startIdx, rangeEndPos + 1);
    const newPartition: SemverPartition = {
      major: startVersionMajor,
      start: slice[0],
      end: slice[slice.length - 1],
      range: `>=${slice[0]} <=${slice[slice.length - 1]}`,
      versions: slice,
      next: null,
    };
    if (
      result.length > 0 &&
      result[result.length - 1].major + 1 === startVersionMajor
    ) {
      result[result.length - 1].next = newPartition;
    }
    result.push(newPartition);
    startIdx = rangeEndPos + 1;
  }
  return result;
}

export const findPartitionSatisfies = (
  partitions: SemverPartition[],
  searchVersion: string
) => {
  for (let i = 0; i < partitions.length; i += 1) {
    if (semverSatisfies(searchVersion, partitions[i].range)) {
      return partitions[i];
    }
  }
  return null;
};

type UpgradeStep = { current: string; target: string; type: string };

export const getUpgradePlan = (
  currentVersion: string,
  startingPartition: SemverPartition
) => {
  const result: UpgradeStep[] = [];
  if (currentVersion !== startingPartition.end) {
    result.push({
      current: currentVersion,
      target: startingPartition.end,
      type: 'minor',
    });
  }
  let currentPartition = startingPartition;
  while (currentPartition.next) {
    result.push({
      current: currentPartition.end,
      target: currentPartition.next.start,
      type: 'major',
    });
    currentPartition = currentPartition.next;
    if (currentPartition.start !== currentPartition.end) {
      result.push({
        current: currentPartition.start,
        target: currentPartition.end,
        type: 'minor',
      });
    }
  }
  return result;
};

export function constructUpgradePlan(
  versions: string[],
  currentVersion: string,
  { allowPrerelease }: NormalizedWhatsNewOptions
) {
  let _versions = versions;
  if (!allowPrerelease) {
    _versions = _versions.filter(
      (version) => semverPrerelease(version) === null
    );
  }

  const partitions = semverMajorPartition(_versions);
  const currentVersionPartition = findPartitionSatisfies(
    partitions,
    currentVersion
  );

  if (currentVersionPartition === null) {
    return [];
  }

  const upgradePlan = getUpgradePlan(currentVersion, currentVersionPartition);
  return upgradePlan;
}

function formatNumerics(n: number, singular: string, plural = `${singular}s`) {
  return n > 1 ? `${n} ${plural}` : `${n} ${singular}`;
}

export function formatUpgradePlanAsString(
  dependencyName: string,
  currentVersion: string,
  upgradePlan: UpgradeStep[],
  { applyNextUpgradeStep }: NormalizedWhatsNewOptions
) {
  if (upgradePlan.length === 0) {
    return `\`${dependencyName}\` is at the latest version (${currentVersion}).\n  No upgrades available at this time.`;
  }

  const latestVersion = upgradePlan[upgradePlan.length - 1].target;

  return `\`${dependencyName}\` has a newer version available!
  installed: ${currentVersion}, latest: ${latestVersion}
  
To safely upgrade \`${dependencyName}\` while applying code migrations, this is the upgrade path of ${formatNumerics(
    upgradePlan.length,
    'step'
  )}:\n${upgradePlan
    .map(
      ({ current, target, type }) =>
        `  ${type === 'major' ? '!' : ' '} ${current} -> ${target}`
    )
    .join('\n')}

${applyNextUpgradeStep ? '' : 'No changes were made.'}`;
}

export async function whatsnew(options: WhatsNewOptions) {
  const normOptions = normalizeOptions(options);
  const { dependencyName, packageManager } = normOptions;

  const manager =
    typeof packageManager === 'string'
      ? adapters[packageManager]
      : packageManager;

  const dependencies = await manager.listDependencies();
  if (!dependencies || !(dependencyName in dependencies)) {
    // dependencies not found
    process.stderr.write(`Dependency \`${dependencyName}\` not found\n`);
    return;
  }
  const { version: currentVersion } = dependencies[dependencyName];

  const fetchedVersions = await manager.getRegistryVersions(dependencyName);
  if (!fetchedVersions) {
    // no versions found
    process.stderr.write(`No versions found for ${dependencyName}\n`);
    return;
  }

  const upgradePlan = constructUpgradePlan(
    fetchedVersions,
    currentVersion,
    normOptions
  );
  process.stdout.write(
    formatUpgradePlanAsString(
      dependencyName,
      currentVersion,
      upgradePlan,
      normOptions
    )
  );

  if (normOptions.applyNextUpgradeStep && upgradePlan.length > 0) {
    process.stdout.write(
      `Upgrading ${dependencyName} from ${upgradePlan[0].current} to ${upgradePlan[0].target}...`
    );
    await manager.applyPackageUpdate(dependencyName, upgradePlan[0].target);
  }
}
