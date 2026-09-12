<div align="center">

# 🌐 LinuxNetwork.ir

**The Ultimate Linux Network & Kernel Tuning Toolbox**  
*جعبه‌ابزار تخصصی بهینه‌سازی شبکه، تیونینگ کرنل و کانفیگ خودکار لینوکس*

[![Live Website](https://img.shields.io/badge/Live-linuxnetwork.ir-10b981?style=for-the-badge&logo=cloudflare&logoColor=white)](https://linuxnetwork.ir)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Node Version](https://img.shields.io/badge/Node.js-%3E%3D22-green?style=for-the-badge&logo=node.js)](package.json)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](package.json)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](https://github.com/SalarTaheri/LinuxNetwork/pulls)

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-server-setup-one-liner">Quick Setup</a> •
  <a href="#-tools-overview">Tools Overview</a> •
  <a href="#-local-development">Development</a> •
  <a href="#-versioning--releases">Versioning</a> •
  <a href="#-توضیحات-فارسی">راهنمای فارسی</a> •
  <a href="#-license">License</a>
</p>

</div>

---

## ⚡ Quick Server Setup (One-Liner)

Hardening, BBR congestion control tuning, UFW/Firewalld, Docker with high-speed mirrors, and modern monitoring tools in a single command on **Ubuntu / Debian / RHEL / Rocky / AlmaLinux / CentOS / Fedora**:

```bash
curl -fsSL https://linuxnetwork.ir/setup.sh | sudo bash -s -- --bbr --sysctl-opt --tools
```

Or run interactively with full UI at [https://linuxnetwork.ir](https://linuxnetwork.ir).

---

## ✨ Features

- 🛠️ **Automated `setup.sh` Generator**:
  - Multi-distribution support (Debian, Ubuntu, RHEL, Rocky Linux, AlmaLinux, CentOS Stream, Fedora)
  - TCP BBR congestion control (v1 & v3) configuration
  - SSH hardening (custom port, password auth disable, public key enforce, SELinux policy)
  - Fail2ban intrusion prevention & UFW / Firewalld firewall setup
  - Automated Docker Engine installation with domestic mirror endpoints
  - Modern CLI toolchain (`btop`, `htop`, `iftop`, `zsh`, `ncdu`, `fastfetch`)
- 🚀 **Kernel & TCP/IP Tuning (`sysctl.conf`)**:
  - High-concurrency presets (Web servers, 100k+ connections)
  - Ultra low-latency presets (Gaming, financial feeds, VoIP)
  - High-throughput buffer tuning (10Gbps+ networks)
  - Reverse proxy & CDN edge optimization
  - Instant live terminal test commands & rollback instructions
- 🛡️ **Production-Ready Nginx Generator**:
  - Reverse Proxy with WebSocket upgrade support
  - Modern SSL/TLS profiles (Mozilla Modern/Intermediate, TLS 1.3)
  - HTTP/2 and experimental HTTP/3 (QUIC) configurations
  - Security headers (HSTS, CSP, X-Frame-Options, Permissions-Policy)
  - Rate limiting & Gzip/Brotli compression
- 🔒 **WireGuard VPN & Mesh Configurator**:
  - Instant Server & Client peer configurations
  - Cryptographic keypair generation via native browser `Web Crypto API`
  - Real-time QR Code generation for mobile clients
  - Optimal MTU calculation & Keepalive keep-ups
- 🧮 **CIDR Subnet Calculator**:
  - IPv4 network breakdown, netmask, wildcard mask, broadcast IP
  - Usable IP address range & capacity calculation
  - Binary representation and CIDR slice planner
- 🌐 **100% Client-Side & Privacy-First**:
  - All keys, certificates, and IP calculations are computed in the user's browser.
  - Zero sensitive data sent to any backend server.
- 📱 **Fully Responsive & Bilingual**:
  - Seamless Persian (فارسی RTL) and English (LTR) language support.

---

## 🧰 Tools Overview

| Tool | Route / Tab | Description |
| :--- | :--- | :--- |
| **Server Setup** | `/?tool=setup` | Generates a robust, production-tested bash script for new server provisioning. |
| **Sysctl Optimizer** | `/?tool=sysctl` | Visual Linux kernel network parameter tuning for maximum socket performance. |
| **Nginx Proxy** | `/?tool=nginx` | Clean, modular Nginx server block configs with SSL, cache, and proxy rules. |
| **WireGuard** | `/?tool=wireguard` | Fast WireGuard tunnel configs with client QR codes and interface routing. |
| **Subnet Calculator** | `/?tool=subnet` | Visual IPv4 CIDR network planner and host range calculator. |

---

## 💻 Tech Stack

- **Framework:** [React 19](https://react.dev/) + [Vite 6](https://vite.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Animations:** [Motion](https://motion.dev/)
- **Deployment:** [Cloudflare Workers & Static Assets](https://developers.cloudflare.com/workers/)

---

## 🚀 Local Development

### Prerequisites

- **Node.js**: `>= 22.0.0`
- **Package Manager**: `npm` (or `bun` / `pnpm`)

### Setup Instructions

```bash
# 1. Clone the repository
git clone https://github.com/SalarTaheri/LinuxNetwork.git
cd LinuxNetwork

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Build & Production Test

```bash
# Build for production
npm run build

# Preview build locally
npm run preview
```

### 🏷️ Versioning & Releases

This project follows automated semantic versioning with a single source of truth in `package.json`. Deployments to Cloudflare Workers are automated via GitHub Actions on Git tag push:

```bash
# 1. Bump version and generate git tag (e.g. 2.4.0 -> 2.4.1)
npm version patch   # or minor / major

# 2. Push commit and tag to GitHub to trigger automated deployment
git push origin main --tags
```

📖 For full details and rollback guides, see the [Versioning Guide](VERSIONING.md).

### Cloudflare Direct Deployment

```bash
# Deploy directly via Cloudflare Workers CLI
npm run deploy
```

---

## 🇮🇷 توضیحات فارسی

**LinuxNetwork.ir** یک جعبه‌ابزار رایگان، متن‌باز و مدرن برای مهندسان لینوکس، دواپس (DevOps)، سیس‌ادمین‌ها و توسعه‌دهندگان زیرساخت است. تمام پردازش‌ها، کلیدسازی‌ها و محاسبات به صورت محلی درون مرورگر (Client-Side) با Web Crypto API انجام می‌شوند و هیچ دیتایی سمت سرور ارسال نمی‌شود.

### امکانات برجسته:
1. **اسکریپت وان‌لاینر ستاپ سرور (`setup.sh`):** راه‌اندازی، امن‌سازی SSH، کانفیگ فایروال (UFW / Firewalld)، نصب Fail2ban، فعال‌سازی الگوریتم ازدحام شبکه BBR و نصب خودکار داکر به همراه میرورهای پرسرعت ایرانی روی اوبونتو، دبیان و خانواده ردهت (RHEL, Rocky, AlmaLinux, CentOS, Fedora).
2. **بهینه‌ساز کرنل (`sysctl.conf`):** تیونینگ پشته TCP/IP و پارامترهای شبکه لینوکس با الگوهای آماده (کانکشن بالا، تاخیر بسیار کم، پهنای‌باند بالا).
3. **پیکربندی حرفه‌ای Nginx:** تولید کانفیگ ریورس پروکسی همراه با SSL/TLS سخت‌گیرانه، HTTP/2 و HTTP/3، سوکت وب و ریت‌لیمیتینگ.
4. **کانفیگوراتور WireGuard:** تولید فوری جفت‌کلید، کانفیگ سرور و کلاینت به همراه تولید بارکد QR برای گوشی‌های هوشمند.
5. **ماشین‌حساب ساب‌نت (CIDR):** محاسبه محدوده IPهای قابل استفاده، نت‌ماسک، وایلدکارت و نمایش باینری.
6. **مدیریت یکپارچه نسخه‌ها و دیپلوی خودکار (CI/CD):** نسخه‌بندی خودکار با `npm version`، تزریق داینامیک نسخه به رابط کاربری، و استقرار آنی روی Cloudflare Workers با گیت‌هاب اکشن (مشاهده مستندات: [VERSIONING.md](VERSIONING.md)).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  Crafted with ❤️ by <a href="https://github.com/SalarTaheri">Salar Taheri</a> & the Linux Community
</div>
