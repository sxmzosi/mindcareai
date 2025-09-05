import React, { useState, useRef } from 'react';
import { Mic, MicOff, Upload, Volume2, VolumeX } from 'lucide-react';

interface ASRInterfaceProps {
  onVoiceInput: (text: string) => void;
  lastResponse?: string;
}

const ASRInterface: React.FC<ASRInterfaceProps> = ({ onVoiceInput, lastResponse }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  React.useEffect(() => {
    if (lastResponse && voiceEnabled && synthRef.current) {
      speakResponse(lastResponse);
    }
  }, [lastResponse, voiceEnabled]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        processAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Option 1: Use OpenAI Whisper API (requires API key)
      // const formData = new FormData();
      // formData.append('file', audioBlob, 'audio.wav');
      // formData.append('model', 'whisper-1');
      
      // const response = await fetch('/api/transcribe', {
      //   method: 'POST',
      //   body: formData,
      // });
      
      // For now, simulate transcription (replace with actual ASR service)
      setTimeout(() => {
        const mockTranscription = "I'm feeling anxious about my upcoming presentation at work.";
        onVoiceInput(mockTranscription);
        setIsProcessing(false);
      }, 2000);
      
    } catch (error) {
      console.error('Transcription error:', error);
      setIsProcessing(false);
      alert('Failed to transcribe audio. Please try again.');
    }
  };

  const speakResponse = (text: string) => {
    if (synthRef.current && voiceEnabled) {
      synthRef.current.cancel();
      
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/#{1,6}\s/g, '')
        .replace(/\n+/g, '. ');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Samantha') || 
        voice.name.includes('Karen') || 
        (voice.lang.startsWith('en') && voice.name.includes('Female'))
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking && synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
      {/* Status Display */}
      <div className="text-center">
        {isRecording && (
          <div className="flex items-center space-x-2 text-red-600">
            <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium">Recording...</span>
          </div>
        )}
        {isProcessing && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium">Processing audio...</span>
          </div>
        )}
        {isSpeaking && (
          <div className="flex items-center space-x-2 text-green-600">
            <div className="animate-bounce w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">Speaking...</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        {/* Record Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || isSpeaking}
          className={`p-4 rounded-full transition-all duration-200 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-red-500 hover:bg-red-600 text-white'
          } ${(isProcessing || isSpeaking) ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {/* Voice Output Toggle */}
        <button
          onClick={toggleVoice}
          className={`p-3 rounded-full transition-all duration-200 ${
            voiceEnabled
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-400 hover:bg-gray-500 text-white'
          }`}
          title={voiceEnabled ? 'Disable voice output' : 'Enable voice output'}
        >
          {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* Instructions */}
      <div className="text-center text-xs text-gray-600 max-w-md">
        <p className="mb-2">
          <strong>ASR Mode:</strong> Click and hold to record your voice, release to process.
        </p>
        <div className="text-xs text-gray-500">
          <p><strong>Features:</strong></p>
          <ul className="text-left list-disc list-inside space-y-1">
            <li>Works in all modern browsers</li>
            <li>No Web Speech API dependency</li>
            <li>Records audio for server-side processing</li>
            <li>Compatible with external ASR services</li>
          </ul>
        </div>
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <strong>Note:</strong> Currently using mock transcription. 
          To enable real ASR, configure Whisper API or similar service in the backend.
        </div>
      </div>
    </div>
  );
};

export default ASRInterface;
