# Retirement Calculator

เครื่องคำนวณวางแผนการเงินเกษียณอายุที่ทันสมัย - คำนวณเงินเกษียณ กองทุนสำรองเลี้ยงชีพ และโบนัส

🔗 **Live URL**: https://warintum.github.io/retirement-vite/

![Modern Dark UI](https://img.shields.io/badge/UI-Modern%20Dark-blueviolet)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss)

## ฟีเจอร์

- 📊 คำนวณเงินเกษียณอายุ (2 สูตร)
- 💰 คำนวณกองทุนสำรองเลี้ยงชีพ
- 🎁 คำนวณโบนัสรายปี
- 💾 บันทึกข้อมูลอัตโนมัติ (LocalStorage)
- 📱 รองรับ Responsive Design

## เทคโนโลยี

- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [Lucide Icons](https://lucide.dev/) - Icons

## การพัฒนา

```bash
# ติดตั้ง dependencies
npm install

# รัน dev server
npm run dev

# Build production
npm run build
```

## การ Deploy บน GitHub Pages

### วิธีที่ 1: ใช้ GitHub Actions (แนะนำ)

1. Push code ไปยัง repository ของคุณ
2. ไปที่ **Settings** > **Pages**
3. ในส่วน **Source** เลือก **GitHub Actions**
4. ทุกครั้งที่ push ไป branch `main` จะ deploy อัตโนมัติ

### วิธีที่ 2: Deploy ด้วย branch `gh-pages`

```bash
# ติดตั้ง gh-pages
npm install -D gh-pages

# เพิ่ม script ใน package.json
"scripts": {
  "deploy": "gh-pages -d dist"
}

# Build และ Deploy
npm run build
npm run deploy
```

### สำคัญ: ตั้งค่า Repository

ตรวจสอบว่าใน `vite.config.js` มีการตั้งค่า `base` ตามชื่อ repository:

```javascript
export default defineConfig({
  base: '/retirement-vite/',
  // ...
})
```

## License

MIT
