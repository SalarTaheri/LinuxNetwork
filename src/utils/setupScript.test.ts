import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { sanitizeSshPort, generateSetupFlags } from './setupScript';
import { SetupScriptSettings } from '../types';

const execFileAsync = promisify(execFile);
const setupScriptPath = path.resolve(process.cwd(), 'public/setup.sh');

describe('setup.sh CLI Argument Validation Security', () => {
  it('accepts valid qdisc algorithm "fq"', async () => {
    const { stdout } = await execFileAsync('bash', [setupScriptPath, '--qdisc', 'fq', '--help']);
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
});

describe('Setup Script Generator & Input Sanitization', () => {
  const defaultSettings: SetupScriptSettings = {
    enableBbr: true,
    enableBbr3: false,
    qdisc: 'fq',
    enableSysctlOpt: true,
    enableCustomSshPort: false,
    sshPort: 2222,
    disablePasswordAuth: false,
    enableFail2ban: true,
    enableUfw: false,
    enableDocker: true,
    enableDockerMirror: true,
    enableTools: true,
    enableZsh: false,
  };

  describe('sanitizeSshPort', () => {
    it('returns valid port numbers unchanged', () => {
      assert.equal(sanitizeSshPort(22), 22);
      assert.equal(sanitizeSshPort(2222), 2222);
      assert.equal(sanitizeSshPort(65535), 65535);
      assert.equal(sanitizeSshPort('8080'), 8080);
    });

    it('sanitizes out-of-range or invalid port values to fallback', () => {
      assert.equal(sanitizeSshPort(0), 22);
      assert.equal(sanitizeSshPort(-1), 22);
      assert.equal(sanitizeSshPort(70000), 22);
      assert.equal(sanitizeSshPort('invalid'), 22);
      assert.equal(sanitizeSshPort(null), 22);
      assert.equal(sanitizeSshPort(undefined, 2222), 2222);
    });
  });

  describe('generateSetupFlags', () => {
    it('generates expected flags for default settings', () => {
      const flags = generateSetupFlags(defaultSettings);
      assert.deepEqual(flags, ['--bbr', '--sysctl-opt', '--fail2ban', '--docker', '--docker-mirror', '--tools']);
    });

    it('sanitizes custom SSH port against out-of-range or invalid input', () => {
      const settings: SetupScriptSettings = {
        ...defaultSettings,
        enableCustomSshPort: true,
        sshPort: -100 as unknown as number,
      };
      const flags = generateSetupFlags(settings);
      assert.ok(flags.includes('--ssh-port 2222'), 'falls back to safe default port 2222');
    });

    it('sanitizes invalid qdisc to fq', () => {
      const settings: SetupScriptSettings = {
        ...defaultSettings,
        qdisc: 'invalid_qdisc; reboot' as unknown as 'fq',
      };
      const flags = generateSetupFlags(settings);
      assert.ok(!flags.some((f) => f.includes('invalid_qdisc')));
    });

    it('supports cake qdisc and bbr3 options', () => {
      const settings: SetupScriptSettings = {
        ...defaultSettings,
        enableBbr3: true,
        qdisc: 'cake',
      };
      const flags = generateSetupFlags(settings);
      assert.ok(flags.includes('--bbr3'));
      assert.ok(flags.includes('--qdisc cake'));
    });
  });
});
