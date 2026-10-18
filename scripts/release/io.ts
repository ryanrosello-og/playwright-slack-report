import assert from 'node:assert/strict';
import { appendFile } from 'node:fs/promises';

export async function command(
  args: string[],
  cwd = process.cwd(),
  env = process.env,
) {
  const child = Bun.spawn(args, {
    cwd,
    env,
    stdout: 'pipe',
    stderr: 'inherit',
  });
  const output = await new Response(child.stdout).text();
  assert.equal(await child.exited, 0, `${args[0]} ${args[1]} failed`);
  return output.trim();
}

export async function json(
  url: string,
  init: RequestInit = {},
  allow404 = false,
  request = fetch,
): Promise<any> {
  const response = await request(url, {
    ...init,
    signal: AbortSignal.timeout(30000),
  });
  if (allow404 && response.status === 404) return undefined;
  assert(response.ok, `Request failed: ${response.status} ${url}`);
  return response.status === 204 ? undefined : response.json();
}

export async function output(key: string, value: string) {
  assert(!value.includes('\n'), 'Workflow outputs must be single-line values');
  if (process.env.GITHUB_OUTPUT)
    await appendFile(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  else console.log(`${key}=${value}`);
}

export async function summary(message: string) {
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY)
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
}
