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

  it('restricts backup directory (0700) and backup file (0600) permissions to prevent information disclosure', async () => {
    // Extract and run backup_file in isolation with a test target file
    const testScript = `
      set -euo pipefail
      TEST_DIR=$(mktemp -d /tmp/ln_test_sec_XXXXXX)
      trap 'rm -rf "$TEST_DIR"' EXIT
      BACKUP_DIR="$TEST_DIR/backup"
      TARGET_FILE="$TEST_DIR/sshd_config"
      echo "Port 22" > "$TARGET_FILE"
      chmod 644 "$TARGET_FILE"
      log_info() { :; }

      # Source backup_file function from setup.sh
      eval "$(sed -n '/^backup_file() {/,/^}/p' "${setupScriptPath}")"

      # Execute backup_file on target
      backup_file "$TARGET_FILE"

      # Verify directory permissions are 0700 (drwx------)
      DIR_PERM=$(stat -c "%a" "$BACKUP_DIR" 2>/dev/null || stat -f "%OLp" "$BACKUP_DIR")
      # Verify backup file permissions are 0600 (-rw-------)
      FILE_PERM=$(stat -c "%a" "$BACKUP_DIR/sshd_config.bak" 2>/dev/null || stat -f "%OLp" "$BACKUP_DIR/sshd_config.bak")

      echo "$DIR_PERM $FILE_PERM"
    `;

    const { stdout } = await execFileAsync('bash', ['-c', testScript]);
    assert.match(stdout.trim(), /^700 600$/);
  });
});
