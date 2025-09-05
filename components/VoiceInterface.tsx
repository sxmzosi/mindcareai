import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Phone } from 'lucide-react';

interface VoiceInterfaceProps {
  onVoiceInput: (text: string) => void;
  onBookingRequest: () => void;
  lastResponse?: string;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ 
  onVoiceInput, 
  onBookingRequest, 
  lastResponse 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isClient, setIsClient] = useState(false);
  // Voice settings
  const [rate, setRate] = useState(0.98);
  const [pitch, setPitch] = useState(1.0);
  const [pauseMs, setPauseMs] = useState(140);
  const [longParagraphPauses, setLongParagraphPauses] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const speakingIndexRef = useRef<number>(0);
  const speakingSessionIdRef = useRef<number>(0);

  useEffect(() => {
    // Set client-side flag
    setIsClient(true);
    
    // Initialize speech synthesis
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      // Load voices when they become available
      const loadVoices = () => {
        const v = synthRef.current?.getVoices() || [];
        setVoices(v);
        if (!selectedVoiceName && v.length) {
          // pick preferred default
          const preferred = v.find(voice => (voice.name.includes('Samantha') || voice.name.includes('Karen') || voice.name.includes('Allison') || voice.name.includes('Ava') || voice.name.includes('Natural')) && voice.lang.startsWith('en'))
            || v.find(voice => voice.default && voice.lang.startsWith('en'))
            || v.find(voice => voice.lang.startsWith('en'))
            || v[0];
          if (preferred) setSelectedVoiceName(preferred.name);
        }
        console.log('Available voices:', v.map(vv => `${vv.name} (${vv.lang})`));
      };
      
      synthRef.current.onvoiceschanged = loadVoices;
      loadVoices(); // Initial load
    }
    
    // Check for microphone permissions
    if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          console.log('Microphone access granted');
        })
        .catch((err) => {
          console.warn('Microphone access denied:', err);
        });
    }
    
    // Initialize Speech Recognition (client-side only)
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence || 0.8;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript.trim();
            setConfidence(confidence);
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(interimTranscript || finalTranscript);

        if (finalTranscript.trim()) {
          console.log('Voice input received:', finalTranscript);
          onVoiceInput(finalTranscript.trim());
          setTranscript('');
          setTimeout(() => stopListening(), 100);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Initialize Speech Synthesis (client-side only)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [onVoiceInput]);

  useEffect(() => {
    if (lastResponse && voiceEnabled && synthRef.current && isClient) {
      console.log('Speaking response:', lastResponse.substring(0, 100) + '...');
      // Small delay to ensure speech synthesis is ready
      const timer = setTimeout(() => {
        // Cancel any ongoing queue/session before starting a new one
        synthRef.current?.cancel();
        isSpeaking && setIsSpeaking(false);
        speakingSessionIdRef.current += 1; // invalidate previous session
        speechQueueRef.current = [];
        speakingIndexRef.current = 0;
        speakResponse(lastResponse);
      }, 300);
      return () => clearTimeout(timer);
    } else if (!voiceEnabled && synthRef.current) {
      // Stop any ongoing speech when voice is disabled
      synthRef.current.cancel();
      setIsSpeaking(false);
      speechQueueRef.current = [];
      speakingIndexRef.current = 0;
    }
  }, [lastResponse, voiceEnabled, isClient]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setIsListening(true);
        setTranscript('');
        setConfidence(0);
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        alert('Could not start voice input. Please check microphone permissions.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Build sentence-level chunks with reasonable length for stable TTS
  const buildSpeechQueue = (text: string): string[] => {
    // Split by sentence boundaries and merge into chunks ~180-240 chars
    const rawSentences = text
      .split(/(?<=[\.\!\?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);

    const chunks: string[] = [];
    let current = '';
    const MAX_CHARS = 220;
    for (const sentence of rawSentences) {
      if ((current + ' ' + sentence).trim().length <= MAX_CHARS) {
        current = current ? current + ' ' + sentence : sentence;
      } else {
        if (current) chunks.push(current);
        current = sentence;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  };

  const speakQueue = (sessionId: number) => {
    if (!synthRef.current || !voiceEnabled) return;
    const queue = speechQueueRef.current;
    const idx = speakingIndexRef.current;
    if (idx >= queue.length) {
      setIsSpeaking(false);
      return;
    }

    const chunk = queue[idx];
    const utterance = new SpeechSynthesisUtterance(chunk);
    // Adaptive pacing
    const adaptiveRate = chunk.length > 200 ? Math.max(0.85, rate - 0.08) : chunk.length > 140 ? Math.max(0.9, rate - 0.03) : rate;
    utterance.rate = adaptiveRate;
    utterance.pitch = pitch;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    const availableVoices = synthRef.current.getVoices();
    const preferredVoice = (selectedVoiceName ? availableVoices.find(v => v.name === selectedVoiceName) : undefined)
      || availableVoices.find(v => (v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Allison') || v.name.includes('Ava') || v.name.includes('Natural')) && v.lang.startsWith('en'))
      || availableVoices.find(v => v.lang.startsWith('en') && v.default) || availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      if (sessionId !== speakingSessionIdRef.current) {
        // Stale session, cancel immediately
        synthRef.current?.cancel();
        return;
      }
      setIsSpeaking(true);
      console.log(`Speaking chunk ${idx + 1}/${queue.length} (len=${chunk.length})`);
    };

    utterance.onend = () => {
      if (sessionId !== speakingSessionIdRef.current) return; // stale
      speakingIndexRef.current += 1;
      // Natural pause between chunks; longer on paragraph-like chunks if enabled
      const basePause = pauseMs;
      const extra = longParagraphPauses && (chunk.length > 160 || /[\.!?]$/.test(chunk)) ? 180 : 0;
      setTimeout(() => speakQueue(sessionId), basePause + extra);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error (chunk):', event);
      // Skip to next chunk on error to avoid being stuck
      if (sessionId !== speakingSessionIdRef.current) return;
      speakingIndexRef.current += 1;
      setTimeout(() => speakQueue(sessionId), 80);
    };

    try {
      synthRef.current.cancel(); // ensure clean start
      synthRef.current.speak(utterance);
    } catch (e) {
      console.error('Failed to speak chunk:', e);
      speakingIndexRef.current += 1;
      setTimeout(() => speakQueue(sessionId), 80);
    }
  };

  const speakResponse = (text: string) => {
    if (!synthRef.current || !voiceEnabled || !text.trim() || !isClient) {
      console.log('Speech synthesis not ready or disabled:', {
        synthRef: !!synthRef.current,
        voiceEnabled,
        hasText: !!text.trim(),
        isClient
      });
      return;
    }
    // Cancel any ongoing speech
    synthRef.current.cancel();

    // Clean text for better speech synthesis
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
      .replace(/`(.*?)`/g, '$1') // Remove code blocks
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\n+/g, ' ') // Replace newlines with space; sentence logic will handle punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/⚠️|🚨|🫁|🔥|•/g, '') // Remove emojis and symbols
      .replace(/PROFESSIONAL SUPPORT:|IMMEDIATE RESOURCES:|RIGHT NOW:|GROUNDING TECHNIQUE:/g, '') // Remove section headers
      .trim();

    if (!cleanText) return;

    // Build queue and speak sequentially
    speechQueueRef.current = buildSpeechQueue(cleanText);
    speakingIndexRef.current = 0;
    const sessionId = ++speakingSessionIdRef.current;

    const startSpeaking = (voices?: SpeechSynthesisVoice[]) => {
      // If no voices loaded yet, we still proceed; browser will pick default
      speakQueue(sessionId);
    };

    const voicesNow = synthRef.current.getVoices();
    if (voicesNow.length === 0) {
      let attempts = 0;
      const maxAttempts = 10;
      const tryLoad = () => {
        const v = synthRef.current?.getVoices() || [];
        attempts++;
        if (v.length > 0 || attempts >= maxAttempts) {
          startSpeaking(v);
        } else {
          setTimeout(tryLoad, 100);
        }
      };
      // event + polling
      const onVoicesChanged = () => {
        const v = synthRef.current?.getVoices() || [];
        if (v.length > 0) {
          synthRef.current?.removeEventListener('voiceschanged', onVoicesChanged);
          startSpeaking(v);
        }
      };
      synthRef.current.addEventListener('voiceschanged', onVoicesChanged);
      setTimeout(tryLoad, 100);
    } else {
      startSpeaking(voicesNow);
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking && synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      speechQueueRef.current = [];
      speakingIndexRef.current = 0;
      speakingSessionIdRef.current += 1;
    }
  };

  const handleBookingClick = () => {
    onBookingRequest();
    if (voiceEnabled) {
      speakResponse("I'll help you find and book an appointment with a licensed therapist. Let me show you available options.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2 p-2">
      {/* Voice Status Display */}
      {(isListening || isSpeaking) && (
        <div className="flex items-center space-x-2">
          {isListening && (
            <div className="flex items-center space-x-1">
              <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-xs text-red-600">Listening</span>
            </div>
          )}
          {isSpeaking && (
            <div className="flex items-center space-x-1">
              <div className="animate-bounce w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600">Speaking</span>
            </div>
          )}
        </div>
      )}

      {/* Voice Controls */}
      <div className="flex items-center space-x-2">
        {/* Microphone Button */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isSpeaking}
          className={`p-2 rounded-full transition-all duration-200 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-red-500 hover:bg-red-600 text-white'
          } ${isSpeaking ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        {/* Voice Output Toggle */}
        <button
          onClick={toggleVoice}
          className={`p-2 rounded-full transition-all duration-200 ${
            voiceEnabled
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-400 hover:bg-gray-500 text-white'
          }`}
          title={voiceEnabled ? 'Disable voice output' : 'Enable voice output'}
        >
          {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Book Appointment Button */}
        <button
          onClick={handleBookingClick}
          className="flex items-center space-x-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-all duration-200"
          title="Book appointment with therapist"
        >
          <Phone size={14} />
          <span className="text-xs font-medium">Book</span>
        </button>
      </div>

      {/* Voice Settings */}
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
        <div className="col-span-1">
          <label className="block text-[10px] text-gray-600 mb-1">Voice</label>
          <select
            className="w-full text-xs border rounded px-2 py-1"
            value={selectedVoiceName}
            onChange={(e) => setSelectedVoiceName(e.target.value)}
          >
            {voices.filter(v => v.lang.startsWith('en')).map(v => (
              <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
            ))}
            {voices.filter(v => !v.lang.startsWith('en')).length > 0 && (
              <optgroup label="Other">
                {voices.filter(v => !v.lang.startsWith('en')).map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
        <div className="col-span-1">
          <label className="block text-[10px] text-gray-600 mb-1">Rate ({rate.toFixed(2)})</label>
          <input
            type="range"
            min={0.85}
            max={1.15}
            step={0.01}
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="col-span-1">
          <label className="block text-[10px] text-gray-600 mb-1">Pitch ({pitch.toFixed(2)})</label>
          <input
            type="range"
            min={0.8}
            max={1.3}
            step={0.01}
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="col-span-1">
          <label className="block text-[10px] text-gray-600 mb-1">Pause between sentences ({pauseMs}ms)</label>
          <input
            type="range"
            min={60}
            max={300}
            step={10}
            value={pauseMs}
            onChange={(e) => setPauseMs(parseInt(e.target.value, 10))}
            className="w-full"
          />
        </div>
        <div className="col-span-2 flex items-center space-x-2">
          <input
            id="longParagraphPauses"
            type="checkbox"
            checked={longParagraphPauses}
            onChange={(e) => setLongParagraphPauses(e.target.checked)}
          />
          <label htmlFor="longParagraphPauses" className="text-[10px] text-gray-600">Longer pauses after paragraphs</label>
        </div>
      </div>
    </div>
  );
};

export default VoiceInterface;
