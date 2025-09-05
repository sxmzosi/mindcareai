# AI Therapist - macOS Setup Guide

A comprehensive AI-powered therapeutic chat application with voice interaction and appointment booking, optimized for macOS.

## 🍎 macOS-Specific Features

- **Native Speech Recognition**: Uses Web Speech API with Safari/Chrome compatibility
- **Homebrew Integration**: Automated dependency management
- **Apple Silicon Support**: Optimized for M1/M2/M3 Macs
- **macOS Voice Synthesis**: Natural voice output using system voices

## 🚀 Quick Setup for macOS

### Option 1: Automated Setup (Recommended)
```bash
# Navigate to project directory
cd /Users/sakshamjoshi/Downloads/ai-therapist-main

# Run the automated setup script
./setup-macos.sh
```

### Option 2: Manual Setup
```bash
# 1. Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Node.js
brew install node

# 3. Install Python (for Flask backend)
brew install python

# 4. Navigate to project
cd /Users/sakshamjoshi/Downloads/ai-therapist-main

# 5. Install dependencies
npm install

# 6. Set up Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 7. Configure environment
cp .env.example .env.local
# Edit .env.local with your Gemini API key
```

## 🔑 API Key Setup

1. Get your Gemini API key from: https://makersuite.google.com/app/apikey
2. Edit `.env.local`:
```bash
GEMINI_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

## 🎯 Running the Application

### Frontend Only (Next.js)
```bash
npm run dev
# Open http://localhost:3000
```

### Full Stack (Frontend + Python Backend)
```bash
# Terminal 1 - Backend
source venv/bin/activate
cd lib
python app.py

# Terminal 2 - Frontend
npm run dev
```

## 🎤 Voice Features (macOS Optimized)

### Browser Compatibility
- **Safari**: Full support for speech recognition and synthesis
- **Chrome**: Full support with enhanced voice options
- **Firefox**: Limited support (synthesis only)

### Voice Settings
- **Input**: Click microphone button or use keyboard shortcut
- **Output**: Automatic speech synthesis with natural voices
- **Languages**: English (US) optimized, other languages supported

## 📱 macOS-Specific Shortcuts

- **⌘ + Enter**: Send message
- **⌘ + M**: Toggle microphone
- **⌘ + S**: Toggle voice output
- **⌘ + B**: Open booking interface

## 🛠 Troubleshooting macOS Issues

### Node.js Issues
```bash
# If node command not found after Homebrew install
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Permission Issues
```bash
# Fix file permissions
sudo chown -R $(whoami) /Users/sakshamjoshi/Downloads/ai-therapist-main
chmod +x setup-macos.sh
```

### Voice Recognition Issues
1. Check Safari/Chrome microphone permissions
2. Go to System Preferences > Security & Privacy > Microphone
3. Enable browser access

### Python Virtual Environment
```bash
# If venv activation fails
python3 -m pip install --upgrade pip
python3 -m venv venv --clear
source venv/bin/activate
```

## 📊 Performance Optimization (macOS)

### For Apple Silicon Macs (M1/M2/M3)
```bash
# Use native ARM64 Node.js
arch -arm64 brew install node

# Verify architecture
node -p "process.arch"  # Should show 'arm64'
```

### Memory Management
- **Recommended RAM**: 8GB minimum, 16GB optimal
- **Storage**: 2GB free space required
- **Browser**: Chrome recommended for best performance

## 🔧 Development Tools (macOS)

### Recommended Extensions
- **VS Code**: ES7+ React/Redux/React-Native snippets
- **Chrome DevTools**: React Developer Tools
- **Safari**: Web Inspector for debugging

### Build Tools
```bash
# Install Xcode Command Line Tools (if needed)
xcode-select --install

# Verify installation
gcc --version
```

## 📋 Project Structure (macOS Paths)

```
/Users/sakshamjoshi/Downloads/ai-therapist-main/
├── components/              # React components
│   ├── VoiceInterface.tsx   # Voice input/output
│   ├── AppointmentBooking.tsx # Booking system
│   └── LiveStressMeter.tsx  # Stress monitoring
├── pages/                   # Next.js pages
│   ├── api/                 # API routes
│   └── index.tsx           # Main application
├── lib/                     # Python backend
├── types/                   # TypeScript definitions
├── setup-macos.sh          # macOS setup script
└── README-macOS.md         # This file
```

## 🚨 Security Notes (macOS)

- **Microphone Access**: Required for voice input
- **API Keys**: Stored locally in `.env.local`
- **HTTPS**: Required for voice features in production
- **Firewall**: Configure for local development ports

## 📞 Support

For macOS-specific issues:
1. Check Console.app for system logs
2. Verify browser permissions
3. Test with different browsers
4. Check network connectivity

## 🎉 Features Available

✅ **Conversational Therapy Chatbot**
- Evidence-based therapeutic responses
- Empathetic dialogue patterns
- Crisis detection and support

✅ **Voice Input & Output**
- Real-time speech recognition
- Natural voice synthesis
- Hands-free interaction

✅ **Appointment Booking**
- Therapist directory search
- Availability management
- Crisis priority handling

✅ **Real-time Monitoring**
- Live stress level tracking
- Emotional state analysis
- Visual feedback system
