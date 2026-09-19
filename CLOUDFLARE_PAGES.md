# راهنمای جامع دیپلوی روی Cloudflare Pages (linuxnetwork.ir)

تمام فایل‌ها و تنظیمات مورد نیاز برای دیپلوی مستقیم روی **Cloudflare Pages** در این پروژه پیاده‌سازی و آماده شده است.

---

## ۱. تنظیمات اعمال‌شده در پروژه

1. **روتینگ SPA و دارایی‌های استاتیک**:
   - در `wrangler.toml` با تنظیم `not_found_handling = "single-page-application"` کنترل می‌شود تا در صورت رفرش یا باز کردن مسیرهای مختلف خطای ۴۰۴ ایجاد نشود و فایل‌های استاتیک نظیر `setup.sh` و `standalone.html` مستقیماً سرو شوند.

2. **`public/_headers`**:
   - برای آدرس `https://linuxnetwork.ir/setup.sh` هدر `Content-Type: text/x-shellscript; charset=utf-8` و `Access-Control-Allow-Origin: *` را تنظیم می‌کند تا دستور وان‌لاینر `curl -fsSL https://linuxnetwork.ir/setup.sh | sudo bash` بدون مشکل اجرا شود.
   - کش دارایی‌های استاتیک (`/assets/*`) را به صورت ۱ ساله (`immutable`) ست می‌کند.
   - هدرهای امنیتی `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` را اعمال می‌کند.

3. **`wrangler.toml`**:
   - نام ورکر را `linuxnetwork` و دایرکتوری دارایی‌ها را `dist` مشخص کرده است.

4. **`.nvmrc` و `package.json`**:
   - نسخه Node.js را روی `22` تنظیم کرده است تا با آخرین نسخه ابزار Wrangler سازگار باشد.

---

## ۲. دیپلوی خودکار با GitHub Actions (با Merge به Main یا ارسال Tag)

گردش کار اکشن‌های گیت‌هاب در مسیر `.github/workflows/deploy.yml` تنظیم شده است. با تایید و Merge شدن هر Pull Request روی شاخه اصلی (`main`) یا پوش هر تگ جدید که با `v` شروع شود (مانند `v1.0.0`)، پروژه به‌طور خودکار بیلد شده و روی Cloudflare دیپلوی می‌گردد.

### ۱. تنظیم سکرت‌ها در گیت‌هاب (Repository Secrets)
وارد ریپازیتوری در گیت‌هاب شوید:
`Settings` ➔ `Secrets and variables` ➔ `Actions` ➔ دکمه `New repository secret`

دو متغیر زیر را اضافه کنید:
1. **`CLOUDFLARE_API_TOKEN`**:
   - در پنل کلودفلر وارد پروفایل خود شوید: `My Profile` ➔ `API Tokens` ➔ `Create Token`
   - الگوی **Edit Cloudflare Workers** را انتخاب کرده یا توکنی با دسترسی `Account > Workers Scripts: Edit` ایجاد کنید.
2. **`CLOUDFLARE_ACCOUNT_ID`**:
   - در داشبورد کلودفلر در صفحه اصلی یا بخش `Workers & Pages`، در سایدبار سمت راست کادر `Account ID` را کپی کنید.

### ۲. غیرفعال‌سازی بیلد خودکار در داشبورد کلودفلر (جهت جلوگیری از تداخل)
چون قبلاً ریپازیتوری را مستقیماً در داشبورد کلودفلر متصل کرده‌اید، با هر کامیت به `main` ممکن است کلودفلر دیپلوی بزند. برای اینکه فقط نسخه‌های تگ‌خورده دیپلوی شوند:
1. در داشبورد کلودفلر به بخش پروژه خود بروید.
2. وارد `Settings` ➔ `Builds & deployments` شوید.
3. بیلد خودکار را **Pause** یا قطع (Disconnect) کنید تا مدیریت نسخه‌ها کاملاً در اختیار GitHub Actions باشد.

### ۳. نحوه ایجاد و انتشار نسخه جدید
برای دیپلوی نسخه جدید، کافیست یک تگ گیت ثبت و پوش کنید:

```bash
# روش اول: ثبت مستقیم تگ
git tag v1.0.0
git push origin v1.0.0

# روش دوم: با دستور خودکار npm version
npm version patch   # نسخه‌های بعدی: minor یا major
git push origin main --tags
```

همچنین می‌توانید از تب **Actions** در گیت‌هاب دکمه **Run workflow** را بزنید تا به‌صورت دستی دیپلوی انجام شود.

---

## ۳. روش دستی از طریق داشبورد گیت‌هاب / گیت‌لب (Cloudflare Pages Git Integration)

1. مخزن گیت این پروژه را به اکانت گیت‌هاب خود پوش (`git push`) کنید.
2. وارد پنل **Cloudflare Dashboard** شوید و از منوی سمت چپ به بخش **Compute (Workers & Pages)** > **Pages** بروید.
3. روی دکمه **Connect to Git** کلیک کرده و مخزن این پروژه را انتخاب کنید.
4. در بخش **Build Settings**:
   - **Framework Preset**: انتخاب `Vite` (یا `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (خالی یا اسلش)
5. در بخش **Environment variables (advanced)** (اختیاری):
   - کلید: `NODE_VERSION` | مقدار: `20`
6. روی **Save and Deploy** کلیک کنید. ظرف کمتر از یک دقیقه پروژه بیلد و لایو می‌شود!

---

## ۳. روش دوم: دیپلوی مستقیم با CLI (Wrangler)

بدون نیاز به گیت‌هاب، می‌توانید از ترمینال سیستم خود با ابزار رسمی کلودفلر پروژه را مستقیماً دیپلوی کنید:

```bash
# ۱. بیلد پروژه
npm run build

# ۲. ورود به حساب کلودفلر (تنها بار اول)
npx wrangler login

# ۳. ارسال و دیپلوی فولدر dist روی Cloudflare Pages
npx wrangler pages deploy dist --project-name=linuxnetwork-ir
```

---

## ۴. اتصال دامنه اختصاصی `linuxnetwork.ir`

1. در داشبورد کلودفلر، وارد پروژه Pages ساخته‌شده شوید.
2. به تب **Custom domains** بروید و روی **Set up a custom domain** کلیک کنید.
3. نام دامنه را وارد کنید:
   - `linuxnetwork.ir`
   - و در صورت تمایل ساب‌دامین `www.linuxnetwork.ir`
4. کلودفلر به صورت خودکار رکوردهای DNS (CNAME) و گواهینامه رایگان SSL/TLS (با پشتیبانی از HTTP/2 و HTTP/3) را فعال می‌کند.
5. پس از فعال شدن، اجرای دستور زیر در هر سرور لینوکسی به صورت آنی فعال خواهد بود:
   ```bash
   curl -fsSL https://linuxnetwork.ir/setup.sh | sudo bash -s -- --bbr --sysctl-opt --tools
   ```
