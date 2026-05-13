import { useState, useCallback, useRef } from 'react';

const useVoice = (language = 'en-US') => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    recognitionRef.current.lang = language;
    recognitionRef.current.start();
    setIsListening(true);
    setTranscript('');
  }, [language]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const speak = useCallback((text, voiceName = null) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;

    if (voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === voiceName);
      if (selectedVoice) utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [language]);

  return { isListening, transcript, startListening, stopListening, speak };
};

export default useVoice;
