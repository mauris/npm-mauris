import { readFile, writeFile } from 'fs/promises';
import { spawn } from '../utils/spawn';

type DependencyOutput = {
  version: string;
  name: string;
  dependencies: Record<string, { version: string }>;
};

export async function listDependencies() {
  const { stdout: npmListOutput, code } = await spawn('npm', [
    'ls',
    '--json',
    '--depth=0',
  ]);

  let result: DependencyOutput | null = null;
  if (code === null || code > 0) {
    return null;
  }
  try {
    result = JSON.parse(npmListOutput) as DependencyOutput;
  } catch (e) {
    // error
  }

  return result?.dependencies ?? null;
}

export async function getRegistryVersions(packageName: string) {
  const { stdout: npmListOutput, code } = await spawn('npm', [
    'view',
    '--json',
    packageName,
    'versions',
  ]);

  let result: string[] | null = null;
  if (code === null || code > 0) {
    return null;
  }
  try {
    result = JSON.parse(npmListOutput) as string[];
  } catch (e) {
    // error
  }

  return result;
}

async function readAndParseJson<T>(filePath: string) {
  const buffer = await readFile(filePath, 'utf-8');
  return JSON.parse(buffer) as T;
}

interface PackageDefinition {
  name: string;
  version: string;
  devDependencies?: {
    [key: string]: string;
  };
  dependencies?: {
    [key: string]: string;
  };
}

export async function applyPackageUpdate(packageName: string, version: string) {
  const packageDef = await readAndParseJson<PackageDefinition>(
    './package.json'
  );
  if (packageDef.dependencies && packageName in packageDef.dependencies) {
    packageDef.dependencies[packageName] = version;
  }
  if (packageDef.devDependencies && packageName in packageDef.devDependencies) {
    packageDef.devDependencies[packageName] = version;
  }

  await writeFile('./package.json', JSON.stringify(packageDef, undefined, 2));

  const { stdout: npmStdout, code } = await spawn('npm', ['install']);
  if (code === null || code > 0) {
    return;
  }

  process.stdout.write(npmStdout);
}
