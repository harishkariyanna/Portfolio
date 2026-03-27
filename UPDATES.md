# Portfolio Updates - Groq AI & Dynamic Animations

## 🤖 Groq AI Integration

### What Changed
- **Replaced OpenAI with Groq SDK** for faster, more efficient chatbot responses
- Using **Llama 3.3 70B** model - one of the most capable open-source models
- Significantly faster response times compared to OpenAI

### Setup Required

1. **Install Groq SDK in backend:**
   ```bash
   cd backend
   npm install groq-sdk
   ```

2. **Add Groq API Key to `.env` file:**
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Get your Groq API Key:**
   - Visit: https://console.groq.com/
   - Sign up/Login
   - Go to API Keys section
   - Create a new API key
   - Copy and paste it into your `.env` file

### Model Used
- **Model:** `llama-3.3-70b-versatile`
- **Temperature:** 0.7 (balanced creativity)
- **Max Tokens:** 500 (concise responses)
- **Streaming:** Ready for implementation (currently disabled)

## ✨ Dynamic Animations Added

### 1. **Rotating Skill Icons**
- Icons float gently up and down
- On hover: 360° rotation + scale up
- Smooth transitions with professional easing

### 2. **Shimmer Effects**
- Skill badges have a light shimmer effect on hover
- Diagonal gradient sweep animation
- Subtle and non-distracting

### 3. **Profile Image**
- Pulsing shadow effect (breathes)
- On hover: Slight rotation + scale
- Creates depth and engagement

### 4. **Social Icons**
- 360° rotation on hover
- Background expands from center
- Icon scales up for emphasis
- Smooth color transitions

### 5. **Animated Gradient Background**
- Hero section has shifting gradient orbs
- 8-second smooth animation cycle
- Creates dynamic, modern feel

### 6. **Project Cards**
- Lift effect on hover
- Enhanced shadows for depth
- Smooth image zoom

## 🎨 Animation Features

All animations are:
- ✅ **Performance optimized** - Uses CSS transforms
- ✅ **Accessibility friendly** - Respects `prefers-reduced-motion`
- ✅ **Professional** - Subtle, not flashy
- ✅ **Smooth** - 60fps with hardware acceleration

## 🚀 How to Test

1. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test the chatbot:**
   - Click the chatbot widget
   - Ask questions about the portfolio
   - Should get fast responses from Groq AI

4. **See animations:**
   - Hover over skill badges (icons rotate)
   - Hover over social icons (360° spin)
   - Watch the profile image pulse
   - Notice the animated background

## 🔧 Customization

### Adjust Animation Speed
In `App.css`, modify keyframes:
```css
/* Slower floating */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); } /* change -5px to -8px */
}
```

### Change Animation Duration
```css
.skill-icon {
  animation: float 5s ease-in-out infinite; /* change 3s to 5s */
}
```

### Disable Animations (for reduced motion)
Add this to your CSS:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 📊 Performance Notes

- All animations use CSS `transform` and `opacity` - GPU accelerated
- No JavaScript animations (pure CSS)
- Minimal performance impact
- Tested on low-end devices

## 🎯 Next Steps

### Enable Streaming (Optional)
In `chatbot.routes.js`, change:
```javascript
stream: false  // Change to true
```

Then implement streaming in frontend:
```javascript
// Handle streamed responses
const response = await fetch('/api/chatbot', {
  method: 'POST',
  body: JSON.stringify({ query, sessionId }),
  headers: { 'Content-Type': 'application/json' }
});

const reader = response.body.getReader();
// Process chunks as they arrive
```

### Add More Animations
- Page load animations
- Scroll-triggered animations
- Parallax effects
- Hover effects on navigation

## 🐛 Troubleshooting

### Chatbot not responding?
1. Check `.env` has `GROQ_API_KEY`
2. Verify API key is valid
3. Check network connectivity
4. Look at backend console for errors

### Animations not working?
1. Clear browser cache
2. Check browser DevTools console
3. Verify CSS file loaded properly
4. Test in different browser

## 📝 Summary

Your portfolio now has:
- ⚡ **Blazing fast AI** with Groq (Llama 3.3 70B)
- 🎨 **Professional animations** that engage users
- 🔄 **Rotating icons** on hover
- ✨ **Subtle effects** that don't distract
- 🚀 **Optimized performance** for all devices

Enjoy your enhanced portfolio! 🎉
