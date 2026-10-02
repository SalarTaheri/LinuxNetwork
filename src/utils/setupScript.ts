import { SetupScriptSettings } from '../types';

/**
 * Sanitizes and validates the SSH port number.
 * Restricts port to integer between 1 and 65535, defaulting to fallback if invalid.
 */
export function sanitizeSshPort(val: number | string | undefined | null, fallback = 22): number {
  const parsed = typeof val === 'number' ? val : parseInt(String(val || ''), 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
    return fallback;
  }
  return parsed;
}

/**
 * Generates sanitized CLI flags for the setup script generator.
 * Enforces strict input validation on user parameters.
 */
export function generateSetupFlags(settings: SetupScriptSettings): string[] {
  const flags: string[] = [];

  if (settings.enableBbr3) {
    flags.push('--bbr3');
  } else if (settings.enableBbr) {
    flags.push('--bbr');
  }

  const allowedQdisc = settings.qdisc === 'cake' ? 'cake' : 'fq';
  if (allowedQdisc !== 'fq') {
    flags.push(`--qdisc ${allowedQdisc}`);
  }

  if (settings.enableSysctlOpt) {
    flags.push('--sysctl-opt');
  }

  if (settings.enableCustomSshPort) {
    const safePort = sanitizeSshPort(settings.sshPort, 2222);
    flags.push(`--ssh-port ${safePort}`);
  }

  if (settings.disablePasswordAuth) {
    flags.push('--disable-pwd-auth');
  }

  if (settings.enableFail2ban) {
    flags.push('--fail2ban');
  }

  if (settings.enableUfw) {
    flags.push('--ufw');
  }

  if (settings.enableDocker) {
    flags.push('--docker');
    if (settings.enableDockerMirror) {
      flags.push('--docker-mirror');
    }
  }

  if (settings.enableTools) {
    flags.push('--tools');
  }

  if (settings.enableZsh) {
    flags.push('--zsh');
  }

  return flags;
}
