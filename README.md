# 🚀 Edge Notes

> A minimalist, AI-powered digital garden for your thoughts. 🌱

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![AI Powered](https://img.shields.io/badge/AI-Powered-purple)

**Edge Notes** is a modern note-taking application built for speed and intelligence. Deployed on the edge with Cloudflare, it offers a seamless writing experience enhanced by advanced AI capabilities.
![alt text](059b785125aef215028ebf638fb8ae8b.png)

---

## 🌐 Access & Live Demo

👉 **Live App**: [https://edge-notes.kakarotodevadiga837.workers.dev/](https://edge-notes.kakarotodevadiga837.workers.dev/)

> **🇨🇳 Note for Users in China / 中国用户提示**:
> Due to network restrictions on `*.workers.dev` domains, you may need a **proxy/VPN** to access the live demo site smoothly.
> 由于 `*.workers.dev` 域名在中国大陆地区的访问限制，您可能需要使用**科学上网工具**才能正常访问演示网页。

---

## 📖 User Guide

### 1. � Secure Login
- Sign in securely using your **GitHub account**.
- We use stateless sessions (JWT) stored in HTTP-only cookies for maximum security.

### 2. 📝 Create & Edit
- Click the **"New Note"** button to start writing.
- Support for **Markdown** syntax (headers, lists, code blocks, etc.).
- Auto-saving interface ensuring you never lose your ideas.

### 3. ⚡ AI Spark
Stuck on a sentence? Hit the Spark button and let AI ignite your writing flow. (MiniMax M2 model):
- Click the **"✨ AI Spark"** button in the editor.
- **Choose a Style**:
  - 🤏 **Concise**: Make it short and sweet.
  - 🎓 **Academic**: Formal and scholarly tone.
  - 🗣️ **Colloquial**: Natural and friendly.
  - 👔 **Formal**: Professional business tone.
  - 🎨 **Custom**: Tell the AI exactly what you want! (e.g., "Rewrite this like Shakespeare")
- **Diff View**: Review changes in a GitHub-style "before & after" view before applying.
- **Quota**: 5 free AI sparks per day!

### 4. 🌍 Share with the World
- Toggle the **Public** switch to generate a unique sharing link.
- Send the link to friends or colleagues—they can view your note without logging in.

---

## ✨ Features Checklist

- [x] **Smart AI Polishing**: Context-aware text enhancement.
- [x] **Cloudflare D1 Database**: Edge-native SQLite database.
- [x] **Instant Search**: Find notes in milliseconds.
- [x] **Dark/Light Mode**: Adapts to your system preference.
- [x] **Responsive Design**: Works great on mobile and desktop.

---

## 🛠️ Tech Stack

Built with the latest and greatest web technologies:

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com/) (via OpenNext)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Auth**: GitHub OAuth + JWT

---

## 💻 Local Development

Want to run this locally? Follow these steps:

### 1. Clone & Install
```bash
git clone https://github.com/lorinefeng/Edge_notes.git
cd Edge_notes
npm install
```

### 2. Configure Environment
Create a `.dev.vars` file (do not commit it!):
```bash
# Auth (Get these from GitHub Developer Settings)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JWT_SECRET=your_jwt_secret

# AI Service (MiniMax/Anthropic)
ANTHROPIC_API_KEY=your_minimax_api_key
ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic
ANTHROPIC_MODEL=MiniMax-M2
```

### 3. Database Migration
```bash
npm run db:generate
npm run db:migrate:local
```

### 4. Run it!
```bash
npm run preview
```
Visit `http://localhost:8787` to see your local instance.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit PRs.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---
Made with ❤️ by the Edge Notes Team.
