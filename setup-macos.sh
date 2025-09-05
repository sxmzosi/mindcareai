#!/bin/bash

# AI Therapist - macOS Setup Script
# This script sets up the AI Therapist application on macOS

set -e  # Exit on any error

echo "🍎 AI Therapist - macOS Setup Script"
echo "===================================="

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS only"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check and install Homebrew
if ! command_exists brew; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo "✅ Homebrew already installed"
fi

# Check and install Node.js
if ! command_exists node; then
    echo "📦 Installing Node.js..."
    brew install node
else
    echo "✅ Node.js already installed ($(node --version))"
fi

# Check and install Python (if needed for Flask backend)
if ! command_exists python3; then
    echo "📦 Installing Python..."
    brew install python
else
    echo "✅ Python already installed ($(python3 --version))"
fi

# Navigate to project directory
PROJECT_DIR="/Users/sakshamjoshi/Downloads/ai-therapist-main"
if [[ ! -d "$PROJECT_DIR" ]]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"
echo "📁 Working in: $(pwd)"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create Python virtual environment (optional, for Flask backend)
if [[ ! -d "venv" ]]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "🐍 Activating Python virtual environment..."
source venv/bin/activate

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create environment file if it doesn't exist
if [[ ! -f ".env.local" ]]; then
    echo "⚙️  Creating environment file..."
    cp .env.example .env.local
    echo ""
    echo "🔑 IMPORTANT: Please edit .env.local and add your Gemini API key:"
    echo "   GEMINI_API_KEY=your_actual_api_key_here"
    echo ""
    echo "   Get your API key from: https://makersuite.google.com/app/apikey"
    echo ""
else
    echo "✅ Environment file already exists"
fi

# Set proper permissions for macOS
echo "🔒 Setting proper file permissions..."
chmod +x setup-macos.sh
find . -name "*.sh" -exec chmod +x {} \;

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🚀 To start the application:"
echo "   1. Edit .env.local with your Gemini API key"
echo "   2. Run: npm run dev"
echo "   3. Open: http://localhost:3000"
echo ""
echo "🐍 For Flask backend (optional):"
echo "   1. source venv/bin/activate"
echo "   2. cd lib && python app.py"
echo ""
echo "🎯 Features available:"
echo "   • AI-powered therapeutic conversations"
echo "   • Voice input and output"
echo "   • Real-time stress monitoring"
echo "   • Appointment booking system"
echo ""
