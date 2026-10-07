import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const setupScriptPath = path.resolve(process.cwd(), 'public/setup.sh');

describe('setup.sh CLI Argument Validation Security', () => {
  it('accepts valid qdisc algorithm "fq"', async () => {
    const { stdout, stderr } = await execFileAsync('bash', [setupScriptPath, '--qdisc', 'fq', '--help']);
    assert.match(stdout, /Usage: sudo bash setup\.sh/);
  });

  it('accepts valid qdisc algorithm "cake"', async () => {
    const { stdout } = await execFileAsync('bash', [setupScriptPath, '--qdisc', 'cake', '--help']);
    assert.match(stdout, /Usage: sudo bash setup\.sh/);
  });

  it('rejects invalid qdisc values and command injection attempts', async () => {
    await assert.rejects(
      async () => {
        await execFileAsync('bash', [setupScriptPath, '--qdisc', 'fq; echo injected', '--help']);
      },
      (err: any) => {
        assert.equal(err.code, 1);
        assert.match(err.stderr, /Invalid qdisc algorithm: fq; echo injected/);
        return true;
      }
    );
  });

  it('rejects invalid SSH ports', async () => {
    await assert.rejects(
      async () => {
        await execFileAsync('bash', [setupScriptPath, '--ssh-port', '99999', '--help']);
      },
      (err: any) => {
        assert.equal(err.code, 1);
        assert.match(err.stderr, /Invalid SSH port/);
        return true;
      }
    );
  });

  it('rejects --qdisc missing argument cleanly', async () => {
    await assert.rejects(
      async () => {
        await execFileAsync('bash', [setupScriptPath, '--qdisc']);
      },
      (err: any) => {
        assert.equal(err.code, 1);
        assert.match(err.stderr, /Option --qdisc requires an argument/);
        return true;
      }
    );
  });

  it('rejects --ssh-port missing argument cleanly', async () => {
    await assert.rejects(
      async () => {
        await execFileAsync('bash', [setupScriptPath, '--ssh-port']);
      },
      (err: any) => {
        assert.equal(err.code, 1);
        assert.match(err.stderr, /Option --ssh-port requires a port number argument/);
        return true;
      }
    );
  });
});
