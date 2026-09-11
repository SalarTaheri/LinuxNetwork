# راهنمای جامع دیپلوی روی Cloudflare Pages (linuxnetwork.ir)

تمام فایل‌ها و تنظیمات مورد نیاز برای دیپلوی مستقیم روی **Cloudflare Pages** در این پروژه پیاده‌سازی و آماده شده است.

---

## ۱. تنظیمات اعمال‌شده در پروژه

1. **`public/_redirects`**:
   - روتینگ SPA لینوکس‌نتورک را کنترل می‌کند (`/* -> /index.html 200`) تا در صورت رفرش یا باز کردن مسیرهای مختلف، خطای ۴۰۴ ایجاد نشود.
   - دسترسی مستقیم به اسکریپت `setup.sh` و `standalone.html` را بدون بازنویسی حفظ می‌کند.

2. **`public/_headers`**:
   - برای آدرس `https://linuxnetwork.ir/setup.sh` هدر `Content-Type: text/x-shellscript; charset=utf-8` و `Access-Control-Allow-Origin: *` را تنظیم می‌کند تا دستور وان‌لاینر `curl -fsSL https://linuxnetwork.ir/setup.sh | sudo bash` بدون مشکل اجرا شود.
   - کش دارایی‌های استاتیک (`/assets/*`) را به صورت ۱ ساله (`immutable`) ست می‌کند.
   - هدرهای امنیتی `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` را اعمال می‌کند.

3. **`wrangler.toml`**:
   - نام پروژه را `linuxnetwork-ir` و دایرکتوری بیلد را `dist` مشخص کرده است.

4. **`.nvmrc` و `package.json`**:
   - نسخه Node.js را روی `20` قفل کرده است تا کلودفلر از آخرین نسخه LTS استفاده کند.

---

## ۲. روش اول: دیپلوی خودکار از طریق GitHub / GitLab (پیشنهادی)

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
