import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateNginxConfig, generateNginxOneLiner } from './nginxGenerator';
import { NginxSettings } from '../types';

const defaultSettings: NginxSettings = {
  domain: 'api.example.com',
  serverAlias: 'www.example.com example.com',
  upstreamType: 'http',
  upstreamAddress: '127.0.0.1:8080',
  listenPort: 80,
  enableSsl: true,
  sslCertPath: '/etc/letsencrypt/live/api.example.com/fullchain.pem',
  sslKeyPath: '/etc/letsencrypt/live/api.example.com/privkey.pem',
  enableHttp2: true,
  enableWebsockets: true,
  clientMaxBodySize: 50,
  enableGzip: true,
  enableRealIpHeaders: true,
  proxyTimeout: 'standard',
  proxyBuffering: 'enabled',
  enableSecurityHeaders: true,
};

describe('Nginx Generator', () => {
  it('generates standard Nginx config correctly', () => {
    const config = generateNginxConfig(defaultSettings, 'en');
    assert.match(config, /server_name api\.example\.com www\.example\.com example\.com;/);
    assert.match(config, /ssl_certificate \/etc\/letsencrypt\/live\/api\.example\.com\/fullchain\.pem;/);
    assert.match(config, /client_max_body_size 50M;/);
    assert.match(config, /proxy_pass http:\/\/backend_upstream;/);
  });

  it('handles empty/undefined/null settings gracefully without crashing', () => {
    const emptySettings = {
      ...defaultSettings,
      domain: '',
      serverAlias: undefined as unknown as string,
      upstreamAddress: null as unknown as string,
      sslCertPath: '',
      sslKeyPath: undefined as unknown as string,
    };
    const config = generateNginxConfig(emptySettings, 'en');
    assert.match(config, /server_name api\.example\.com;/);
    assert.match(config, /server 127\.0\.0\.1:8000/);
  });

  it('sanitizes domain against Nginx directive injection and newlines', () => {
    const maliciousSettings: NginxSettings = {
      ...defaultSettings,
      domain: 'example.com;\n    return 301 http://evil.com;\n    #',
    };
    const config = generateNginxConfig(maliciousSettings, 'en');
    assert.doesNotMatch(config, /return 301 http:\/\/evil\.com;/);
    assert.match(config, /server_name example\.comreturn301httpevil\.com/);
  });

  it('sanitizes serverAlias against directive injection', () => {
    const maliciousSettings: NginxSettings = {
      ...defaultSettings,
      serverAlias: 'alias.com; location /hack { root /; }',
    };
    const config = generateNginxConfig(maliciousSettings, 'en');
    assert.doesNotMatch(config, /location \/hack/);
    assert.match(config, /server_name api\.example\.com alias\.com location hack root;/);
  });

  it('sanitizes upstreamAddress against injection', () => {
    const maliciousSettings: NginxSettings = {
      ...defaultSettings,
      upstreamAddress: '127.0.0.1:8080;\n  server 10.0.0.1:9000;',
    };
    const config = generateNginxConfig(maliciousSettings, 'en');
    assert.match(config, /server 127\.0\.0\.1:8080server10\.0\.0\.1:9000 max_fails=3/);
  });

  it('sanitizes sslCertPath and sslKeyPath against path injection', () => {
    const maliciousSettings: NginxSettings = {
      ...defaultSettings,
      sslCertPath: '/etc/cert.pem; drop table;',
      sslKeyPath: '/etc/key.pem"\n  return 500;',
    };
    const config = generateNginxConfig(maliciousSettings, 'en');
    assert.match(config, /ssl_certificate \/etc\/cert\.pemdroptable;/);
    assert.match(config, /ssl_certificate_key \/etc\/key\.pemreturn500;/);
  });

  it('generates valid one-liner script', () => {
    const config = generateNginxConfig(defaultSettings, 'en');
    const oneLiner = generateNginxOneLiner('api.example.com', config);
    assert.ok(oneLiner.includes('sudo bash -c'));
    assert.ok(oneLiner.includes('sites-available/api.example.com.conf'));
    assert.ok(oneLiner.includes('nginx -t && systemctl reload nginx'));
  });

  it('escapes single quotes in one-liner script to prevent syntax errors and breakout', async () => {
    const configWithSingleQuotes = `# Custom config with 'single quotes' & special chars\nserver { listen 80; }`;
    const oneLiner = generateNginxOneLiner('api.example.com', configWithSingleQuotes);

    assert.ok(oneLiner.includes("'\\''single quotes'\\''"));

    // Verify bash syntax validation (-n flag) without requiring root/sudo
    const scriptWithoutSudo = oneLiner.replace(/^sudo /, '');
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execFileAsync = promisify(execFile);

    const { stderr } = await execFileAsync('bash', ['-n', '-c', scriptWithoutSudo]);
    assert.equal(stderr, '');
  });
});
