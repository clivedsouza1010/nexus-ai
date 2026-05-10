import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../services/aiService';
import { Mic, MicOff, Send, XSquare, CheckCircle2 } from 'lucide-react';
import { TranscriptMessage } from '../types';
import { toast } from 'sonner';

// Type definitions for Web Speech API as it's not fully typed in standard DOM lib yet
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function LiveInterview() {
  const navigate = useNavigate();
  const currentSession = useAppStore(state => state.currentSession);
  const updateCurrentSession = useAppStore(state => state.updateCurrentSession);
  const addTranscriptMessage = useAppStore(state => state.addTranscriptMessage);
  const endInterviewAndSave = useAppStore(state => state.endInterviewAndSave);

  const scrollRef = useRef<HTMLDivElement>(null);

  const [isListening, setIsListening] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechSynthesisActive, setSpeechSynthesisActive] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  useEffect(() => {
    if (!currentSession) {
      navigate('/');
      return;
    }

    if (currentSession.status === 'pending') {
      startInterview();
    }
    
    // Initialize Speech Recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimTranscript(interim);
        if (final) {
           handleCandidateInput(final);
        }
      };
      recognition.onerror = (e: any) => {
        console.error("Speech recognition error", e);
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };
      
      setRecognitionInstance(recognition);
    } else {
      toast.error("Speech Recognition is not supported in this browser.");
    }

    return () => {
      window.speechSynthesis.cancel(); // Stop playing audio on unmount
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [currentSession]);

  // Auto scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      const scrollEl = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollEl) {
          scrollEl.scrollTop = scrollEl.scrollHeight;
      }
    }
  }, [currentSession?.transcript, interimTranscript]);

  const startInterview = async () => {
    updateCurrentSession({ status: 'in-progress' });
    setIsProcessingAI(true);
    try {
      const question = await aiService.generateFirstQuestion(currentSession!);
      await handleAIResponse(question);
    } catch (e) {
      toast.error("Failed to start interview.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleCandidateInput = async (text: string) => {
    if (!text.trim()) return;
    
    const newMessage: TranscriptMessage = {
      id: Date.now().toString(),
      speaker: 'candidate',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };
    
    addTranscriptMessage(newMessage);
    
    // Stop recording while AI thinks
    if (recognitionInstance && isListening) {
      recognitionInstance.stop();
    }

    setIsProcessingAI(true);
    try {
      const nextAiText = await aiService.generateNextQuestionOrFeedback(
        currentSession!,
        [...(currentSession!.transcript || []), newMessage]
      );
      await handleAIResponse(nextAiText);
    } catch (e) {
      toast.error("Failed to generate AI response");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleAIResponse = async (text: string) => {
    const aiMessage: TranscriptMessage = {
      id: Date.now().toString(),
      speaker: 'interviewer',
      text,
      timestamp: new Date().toISOString()
    };
    addTranscriptMessage(aiMessage);
    playAIVoice(text);
  };

  const playAIVoice = (text: string) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a good english voice
    const voices = window.speechSynthesis.getVoices();
    const goodVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices[0];
    if (goodVoice) utterance.voice = goodVoice;
    
    utterance.rate = 0.95; // Slightly slower for clarity
    
    utterance.onstart = () => setSpeechSynthesisActive(true);
    utterance.onend = () => {
      setSpeechSynthesisActive(false);
      // Automatically resume listening if they haven't explicitly stopped it?
      // For better UX, might want to let them click the button, but continuous is nice.
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const toggleMic = () => {
    if (isListening) {
      recognitionInstance?.stop();
    } else {
      recognitionInstance?.start();
    }
  };

  const handleEndInterview = async () => {
    if (isListening) recognitionInstance?.stop();
    window.speechSynthesis.cancel();
    
    toast.info("Generating your interview report... Please wait.");
    setIsProcessingAI(true);
    
    try {
      const report = await aiService.generateInterviewReport(currentSession!, currentSession!.transcript);
      endInterviewAndSave(report);
      navigate('/report');
    } catch(e) {
      toast.error("Error generating report.");
      setIsProcessingAI(false);
    }
  };

  if (!currentSession) return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden relative font-sans">
      
      {/* Atmosphere Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[100px] rounded-full"></div>
      </div>

      <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-8 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
            <span className="text-[10px] font-mono text-white/50 tracking-widest uppercase">Live Process</span>
          </div>
        </div>
      </header>

      {/* Visual Avatar / Audio Waveform Area */}
      <div className="w-full max-w-4xl flex-1 flex flex-col items-center justify-center relative z-10 mb-8 pt-8">
        
        <div className="relative flex items-center justify-center">
          {/* AI Avatar Glowing Orb */}
          <div className={`absolute w-96 h-96 blur-[80px] rounded-full transition-colors duration-700 ${speechSynthesisActive ? 'bg-cyan-500/20' : 'bg-cyan-500/5'}`}></div>
          <div className="w-72 h-72 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-xl bg-black/20 p-8 shadow-[inset_0_0_50px_rgba(255,255,255,0.05)] relative z-10">
            <div className={`w-full h-full rounded-full border-4 flex items-center justify-center relative overflow-hidden transition-all duration-300 ${speechSynthesisActive ? 'border-cyan-400' : 'border-cyan-400/30'}`}>
              
              <span className="text-4xl text-white/50 tracking-widest font-light z-10">AI</span>
              
              {speechSynthesisActive && (
                <div className="absolute flex items-end gap-1 opacity-70 z-0">
                  <div className="w-1 h-12 bg-cyan-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-20 bg-blue-400 rounded-full opacity-60"></div>
                  <div className="w-1 h-32 bg-cyan-200 rounded-full"></div>
                  <div className="w-1 h-24 bg-blue-400 rounded-full opacity-60"></div>
                  <div className="w-1 h-12 bg-cyan-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 text-center max-w-xl z-20">
            <p className="text-cyan-400 text-[10px] font-mono mb-3 tracking-[0.2em] uppercase">
              {speechSynthesisActive ? 'Interviewer Speaking...' : isProcessingAI ? 'Analyzing...' : 'Ready'}
            </p>
            <h2 className="text-2xl font-light leading-relaxed text-white/90">
              {currentSession.role} <span className="text-white/40">@</span> {currentSession.company}
            </h2>
        </div>
      </div>

       {/* Transcript & Controls Area */}
      <div className="w-full max-w-4xl h-[400px] bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10 z-10 relative">
        <ScrollArea ref={scrollRef} className="flex-1 p-6">
           <div className="space-y-6">
              {currentSession.transcript.map(msg => (
                <div key={msg.id} className={`flex ${msg.speaker === 'interviewer' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                    msg.speaker === 'interviewer' 
                    ? 'bg-cyan-900/20 text-cyan-50 rounded-tl-sm border border-cyan-500/30 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]' 
                    : 'bg-white/5 text-white/90 rounded-tr-sm border border-white/10'
                  }`}>
                    <p className={`text-[10px] font-mono mb-2 uppercase tracking-widest ${msg.speaker === 'interviewer' ? 'text-cyan-400/80' : 'text-white/40'}`}>
                      {msg.speaker === 'interviewer' ? 'Interviewer' : 'You'}
                    </p>
                    <p className="leading-relaxed whitespace-pre-wrap text-[15px]">{msg.text}</p>
                  </div>
                </div>
              ))}
              {interimTranscript && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl px-5 py-4 bg-white/5 text-white/60 rounded-tr-sm border border-white/10 italic">
                    <p className="text-[10px] font-mono mb-2 uppercase tracking-widest text-white/40">You (Transcribing...)</p>
                    <p className="leading-relaxed whitespace-pre-wrap text-[15px]">{interimTranscript}</p>
                  </div>
                </div>
              )}
           </div>
        </ScrollArea>
        
        {/* Live Response Bar / Controls */}
        <div className="h-24 px-8 py-4 border-t border-white/10 bg-black/60 flex items-center justify-between gap-8 z-10">
          
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-[10px] text-white/40 uppercase mb-1 font-semibold font-mono tracking-widest">
              {isListening ? 'Microphone Active' : 'Microphone Off'}
            </div>
            <div className={`text-sm line-clamp-2 ${isListening ? 'text-cyan-400/80 italic' : 'text-white/50'}`}>
              {interimTranscript || (isListening ? "Listening to your response..." : "Click the microphone to start speaking or let AI ask the next question.")}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="rounded-xl px-5 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all hover:border-red-500/40"
              onClick={handleEndInterview}
              disabled={isProcessingAI && !isListening}
            >
              <span className="text-[11px] font-semibold uppercase tracking-widest">End Session</span>
            </Button>
            
            <Button 
              onClick={toggleMic}
              className={`rounded-xl w-14 h-14 p-0 transition-all duration-300 border ${
                isListening 
                ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)] animate-pulse' 
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white'
              }`}
              disabled={isProcessingAI && !isListening}
            >
               {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-5 h-5" />}
            </Button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
