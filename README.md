# Kandarp's Voice-Enabled Resume Website - Deployment Guide

## 🎉 What You Have

A fully functional voice-enabled resume website with:
- ✅ Professional resume layout with all your information
- ✅ AI voice assistant powered by Claude API
- ✅ Real-time voice conversation (Web Speech API)
- ✅ Mobile responsive design
- ✅ Beautiful purple gradient theme

## 📁 Project Structure

```
kandarp-resume/
├── src/
│   ├── App.jsx          # Main resume component with voice AI
│   └── main.jsx         # React entry point
├── index.html           # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Build configuration
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🚀 Deployment Steps

### Step 1: Get Your Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Click "Get API Keys" or go to Settings → API Keys
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-...`)
6. **KEEP IT SAFE** - you'll need it for Step 4

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `kandarp-resume` (or any name you like)
3. Keep it **Public** (required for free Vercel)
4. **DO NOT** add README, .gitignore, or license (we already have them)
5. Click "Create repository"

### Step 3: Upload Your Code to GitHub

**Option A: Using GitHub Web Interface (Easiest)**

1. On your new GitHub repo page, click "uploading an existing file"
2. Drag and drop ALL files from your project folder:
   - src/ folder (with App.jsx and main.jsx inside)
   - index.html
   - package.json
   - vite.config.js
   - .gitignore
3. Add commit message: "Initial commit - Voice-enabled resume"
4. Click "Commit changes"

**Option B: Using Git Command Line**

```bash
# In your project folder, run:
git init
git add .
git commit -m "Initial commit - Voice-enabled resume"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kandarp-resume.git
git push -u origin main
```

### Step 4: Deploy to Vercel

1. Go to https://vercel.com/signup
2. Sign up with your **GitHub account** (this makes deployment automatic)
3. After signing up, click "Add New..." → "Project"
4. You'll see your GitHub repos - select `kandarp-resume`
5. Click "Import"

**IMPORTANT: Configure Environment Variables**

6. Before clicking "Deploy", scroll down to "Environment Variables"
7. Add this variable:
   - **Name:** `REACT_APP_ANTHROPIC_API_KEY`
   - **Value:** Paste your API key from Step 1 (the `sk-ant-...` key)
8. Click "Add"
9. Now click "Deploy"

### Step 5: Wait for Deployment (2-3 minutes)

You'll see a build log. When done, you'll see:
- 🎉 Congratulations!
- Your website URL: `https://kandarp-resume-xyz.vercel.app`

### Step 6: Test Your Voice Assistant

1. Visit your new website URL
2. Click the purple microphone button (bottom-right)
3. Allow microphone permissions when asked
4. Say your name when AI Kandarp asks
5. Ask questions like:
   - "Tell me about your current role"
   - "What projects have you built?"
   - "What's your experience with AI?"
   - "How can I reach you?"

## 🎨 Customization (Optional)

### Change Colors

Open `src/App.jsx` and find line 183:

```javascript
background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
```

Replace with your preferred gradient from https://uigradients.com/

### Update Content

All your resume content is in `src/App.jsx`. Search for any text and update it directly.

### Add Custom Domain

1. Buy a domain from Namecheap, GoDaddy, etc.
2. In Vercel dashboard → Your project → Settings → Domains
3. Add your custom domain
4. Follow Vercel's DNS instructions

## 🔧 Troubleshooting

### "Voice assistant not responding"

**Problem:** API key not set correctly

**Solution:**
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Make sure `REACT_APP_ANTHROPIC_API_KEY` is set with your correct API key
3. Redeploy: Settings → Deployments → click "..." on latest → Redeploy

### "Microphone not working"

**Problem:** Browser permissions

**Solution:**
1. Click the lock icon in browser address bar
2. Allow microphone access
3. Refresh the page

### "Build failed on Vercel"

**Problem:** Missing files

**Solution:**
1. Make sure you uploaded ALL files to GitHub
2. Check that `src/` folder contains `App.jsx` and `main.jsx`
3. Try redeploying in Vercel dashboard

## 💰 Costs

- **GitHub:** FREE
- **Vercel Hosting:** FREE (with limits, more than enough for personal site)
- **Anthropic API:** 
  - Free trial credits: $5 (covers ~1000 voice conversations)
  - After trial: Pay-as-you-go (~$0.003 per conversation)

## 📊 Monitoring Usage

Check your API usage at https://console.anthropic.com/settings/usage

## 🔄 Making Updates

After you edit files locally:

**Using GitHub Web:**
1. Go to your GitHub repo
2. Navigate to the file you want to edit
3. Click the pencil icon (Edit)
4. Make changes
5. Commit changes
6. Vercel auto-deploys in 1-2 minutes

**Using Git:**
```bash
git add .
git commit -m "Updated content"
git push
```

Vercel automatically redeploys every time you push to GitHub!

## 🎯 Next Steps

1. ✅ Share your website link on LinkedIn
2. ✅ Add it to your email signature
3. ✅ Put it on your business cards
4. ✅ Share on Twitter/X with #AIResume

## 📞 Need Help?

If something doesn't work:
1. Check the Troubleshooting section above
2. Check Vercel deployment logs (Dashboard → Your project → Deployments → View logs)
3. Make sure your API key is valid and has credits

## 🎉 You're Done!

Your voice-enabled resume is now live on the internet. Anyone can:
- Read your professional experience
- Talk to your AI assistant via voice
- Get your contact information
- Be impressed by your tech-forward approach

**Your site:** `https://your-project-name.vercel.app`

---

Built with ❤️ using React, Claude AI, and Web Speech API
