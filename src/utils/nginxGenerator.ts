import { NginxSettings } from '../types';

/**
 * Sanitizes input values (domains, aliases, paths) to prevent Nginx directive injection and command execution risks.
 */
function sanitizeDomain(val: string | undefined | null, fallback: string): string {
  const cleaned = (val || '').trim().replace(/[^a-zA-Z0-9_.*-]/g, '');
  return cleaned || fallback;
}

function sanitizeServerAlias(val: string | undefined | null): string {
  return (val || '')
    .trim()
    .split(/\s+/)
    .map((alias) => alias.replace(/[^a-zA-Z0-9_.*-]/g, ''))
    .filter(Boolean)
    .join(' ');
}

function sanitizeUpstream(val: string | undefined | null, fallback: string): string {
  const cleaned = (val || '').trim().replace(/[^a-zA-Z0-9_.:/-]/g, '');
  return cleaned || fallback;
}

function sanitizePath(val: string | undefined | null, fallback: string): string {
  const cleaned = (val || '').trim().replace(/[^a-zA-Z0-9_.:/-]/g, '');
  return cleaned || fallback;
}

function sanitizePort(val: number | string | undefined | null, fallback: number): number {
  const parsed = typeof val === 'number' ? val : parseInt(String(val || ''), 10);
  if (isNaN(parsed) || parsed <= 0 || parsed > 65535) {
    return fallback;
  }
  return parsed;
}

function sanitizeNumber(val: number | string | undefined | null, fallback: number, min = 1, max = 10240): number {
  const parsed = typeof val === 'number' ? val : parseInt(String(val || ''), 10);
  if (isNaN(parsed) || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
}

export function generateNginxConfig(settings: NginxSettings, lang: 'fa' | 'en'): string {
  const isFa = lang === 'fa';
  const domain = sanitizeDomain(settings.domain, 'api.example.com');
  const serverAlias = sanitizeServerAlias(settings.serverAlias);
  const upstream = sanitizeUpstream(settings.upstreamAddress, '127.0.0.1:8000');
  const listenPort = sanitizePort(settings.listenPort, 80);
  const clientMaxBodySize = sanitizeNumber(settings.clientMaxBodySize, 50, 1, 10240);

  const lines: string[] = [
    '# ==========================================================================',
    `# LinuxNetwork.ir - Nginx Reverse Proxy Config for ${domain}`,
    '# Target File: /etc/nginx/sites-available/' + domain.replace(/[^a-zA-Z0-9_.-]/g, '_') + '.conf',
    '# ==========================================================================',
    '',
  ];

  // Upstream block
  lines.push('upstream backend_upstream {');
  if (settings.upstreamType === 'unix') {
    lines.push(`    server ${upstream.startsWith('unix:') ? upstream : 'unix:' + upstream} fail_timeout=0;`);
  } else {
    lines.push(`    server ${upstream.replace(/^https?:\/\//, '')} max_fails=3 fail_timeout=10s;`);
    lines.push('    keepalive 32;');
  }
  lines.push('}');
  lines.push('');

  // HTTP to HTTPS redirect if SSL enabled
  if (settings.enableSsl) {
    lines.push('server {');
    lines.push(`    listen 80;`);
    lines.push(`    listen [::]:80;`);
    lines.push(`    server_name ${domain}${serverAlias ? ' ' + serverAlias : ''};`);
    lines.push('');
    lines.push('    # ACME-challenge for Certbot SSL Renewal');
    lines.push('    location ^~ /.well-known/acme-challenge/ {');
    lines.push('        default_type "text/plain";');
    lines.push('        root /var/www/html;');
    lines.push('        allow all;');
    lines.push('    }');
    lines.push('');
    lines.push('    location / {');
    lines.push('        return 301 https://$host$request_uri;');
    lines.push('    }');
    lines.push('}');
    lines.push('');
  }

  // Primary Server Block
  lines.push('server {');
  if (settings.enableSsl) {
    lines.push(`    listen 443 ssl${settings.enableHttp2 ? ' http2' : ''};`);
    lines.push(`    listen [::]:443 ssl${settings.enableHttp2 ? ' http2' : ''};`);
  } else {
    lines.push(`    listen ${listenPort};`);
    lines.push(`    listen [::]:${listenPort};`);
  }
  lines.push(`    server_name ${domain}${serverAlias ? ' ' + serverAlias : ''};`);
  lines.push('');

  // SSL Certificates and Parameters
  if (settings.enableSsl) {
    const cert = sanitizePath(settings.sslCertPath, `/etc/letsencrypt/live/${domain}/fullchain.pem`);
    const key = sanitizePath(settings.sslKeyPath, `/etc/letsencrypt/live/${domain}/privkey.pem`);

    lines.push('    # SSL Certificates (Lets Encrypt / Custom)');
    lines.push(`    ssl_certificate ${cert};`);
    lines.push(`    ssl_certificate_key ${key};`);
    lines.push('    ssl_protocols TLSv1.2 TLSv1.3;');
    lines.push('    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;');
    lines.push('    ssl_prefer_server_ciphers off;');
    lines.push('    ssl_session_cache shared:SSL:10m;');
    lines.push('    ssl_session_timeout 1d;');
    lines.push('    ssl_session_tickets off;');
    lines.push('    ssl_stapling on;');
    lines.push('    ssl_stapling_verify on;');
    lines.push('    resolver 1.1.1.1 8.8.8.8 valid=300s;');
    lines.push('    resolver_timeout 5s;');
    lines.push('');
  }

  // Security Headers
  if (settings.enableSecurityHeaders) {
    lines.push('    # Security Headers');
    if (settings.enableSsl) {
      lines.push('    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;');
    }
    lines.push('    add_header X-Frame-Options "SAMEORIGIN" always;');
    lines.push('    add_header X-Content-Type-Options "nosniff" always;');
    lines.push('    add_header X-XSS-Protection "1; mode=block" always;');
    lines.push('    add_header Referrer-Policy "strict-origin-when-cross-origin" always;');
    lines.push('');
  }

  // Client Body Size
  lines.push(`    # Maximum Allowed Request Payload Size`);
  lines.push(`    client_max_body_size ${clientMaxBodySize}M;`);
  lines.push('    client_body_buffer_size 128k;');
  lines.push('');

  // Gzip Compression
  if (settings.enableGzip) {
    lines.push('    # Gzip Compression');
    lines.push('    gzip on;');
    lines.push('    gzip_vary on;');
    lines.push('    gzip_proxied any;');
    lines.push('    gzip_comp_level 5;');
    lines.push('    gzip_min_length 256;');
    lines.push('    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;');
    lines.push('');
  }

  // Timeouts configuration
  let connectTimeout = '10s';
  let sendTimeout = '30s';
  let readTimeout = '60s';
  if (settings.proxyTimeout === 'short') {
    connectTimeout = '5s';
    sendTimeout = '10s';
    readTimeout = '15s';
  } else if (settings.proxyTimeout === 'long') {
    connectTimeout = '60s';
    sendTimeout = '300s';
    readTimeout = '300s';
  }

  lines.push('    # Reverse Proxy Location');
  lines.push('    location / {');
  lines.push('        proxy_pass http://backend_upstream;');
  lines.push('        proxy_http_version 1.1;');
  lines.push('');

  // Headers
  if (settings.enableRealIpHeaders) {
    lines.push('        # Client Real IP & Forwarded Headers');
    lines.push('        proxy_set_header Host $host;');
    lines.push('        proxy_set_header X-Real-IP $remote_addr;');
    lines.push('        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;');
    lines.push('        proxy_set_header X-Forwarded-Proto $scheme;');
    lines.push('        proxy_set_header X-Forwarded-Host $host;');
    lines.push('        proxy_set_header X-Forwarded-Port $server_port;');
    lines.push('');
  }

  // WebSockets
  if (settings.enableWebsockets) {
    lines.push('        # WebSocket Upgrade Headers');
    lines.push('        proxy_set_header Upgrade $http_upgrade;');
    lines.push('        proxy_set_header Connection "upgrade";');
    lines.push('');
  } else {
    lines.push('        proxy_set_header Connection "";');
    lines.push('');
  }

  // Buffering
  if (settings.proxyBuffering === 'disabled' || settings.proxyBuffering === 'stream') {
    lines.push('        # Streaming / Real-time Buffering Disabled');
    lines.push('        proxy_buffering off;');
    lines.push('        proxy_request_buffering off;');
    lines.push('        proxy_cache off;');
  } else {
    lines.push('        # High Throughput Buffering');
    lines.push('        proxy_buffering on;');
    lines.push('        proxy_buffer_size 16k;');
    lines.push('        proxy_buffers 8 64k;');
    lines.push('        proxy_busy_buffers_size 128k;');
  }
  lines.push('');

  // Timeouts
  lines.push(`        proxy_connect_timeout ${connectTimeout};`);
  lines.push(`        proxy_send_timeout ${sendTimeout};`);
  lines.push(`        proxy_read_timeout ${readTimeout};`);
  lines.push('    }');
  lines.push('}');

  return lines.join('\n');
}

export function generateNginxOneLiner(domain: string, configText: string): string {
  const safeName = (domain || 'reverse-proxy').replace(/[^a-zA-Z0-9_.-]/g, '_');
  const safeConfig = (configText || '').trim().replace(/'/g, "'\\''");
  return `sudo bash -c 'cat << "EOF" > /etc/nginx/sites-available/${safeName}.conf
${safeConfig}
EOF
ln -sf /etc/nginx/sites-available/${safeName}.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx'`;
}
