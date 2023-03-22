import { spawn as nodeSpawn } from 'node:child_process';

type SpawnResult = {
  stdout: string;
  stderr: string;
  code: number | null;
};

export function spawn(command: string, programArgs: string[] = []) {
  return new Promise<SpawnResult>((resolve) => {
    const childProcess = nodeSpawn(command, programArgs, { shell: true });

    const result: SpawnResult = {
      stdout: '',
      stderr: '',
      code: null,
    };

    childProcess.stdout.on('data', (data) => {
      result.stdout = `${result.stdout}${data}`;
    });

    childProcess.stderr.on('data', (data) => {
      result.stderr = `${result.stderr}${data}`;
    });

    childProcess.on('close', (code) => {
      result.code = code;
      resolve(result);
    });
  });
}
