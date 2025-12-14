import React, { useState, useEffect, useRef } from 'react';
import { ViewState, ResultData } from './types';
import { generateAIResponse } from './services/gemini';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [result, setResult] = useState<ResultData | null>(null);
  
  // Input state
  const [inputText, setInputText] = useState('');
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [hasSpeech, setHasSpeech] = useState(false);

  // Auto-focus ref
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setHasSpeech(true);
    }
  }, []);

  // --- Logic Handlers ---

  const handleDailyClick = async () => {
    setView('LOADING');
    try {
      const data = await generateAIResponse("Give me one meaningful task for my shop today.");
      setResult({ answer: data.answer });
      setView('RESULT');
    } catch (e) {
      console.error(e);
      setView('HOME');
    }
  };

  const handleSubmit = async (overrideText?: string) => {
    const textToSubmit = overrideText || inputText;
    if (!textToSubmit.trim()) return;
    
    // If we are already in result view, this is a follow-up
    const context = view === 'RESULT' && result ? result.answer : undefined;

    setView('LOADING');
    try {
      const data = await generateAIResponse(textToSubmit, context);
      setResult({ answer: data.answer });
      setView('RESULT');
      setInputText('');
    } catch (e) {
      console.error(e);
      setView('HOME');
    }
  };

  const handleDone = () => {
    setResult(null);
    setInputText('');
    setView('HOME');
  };

  const startListening = () => {
    if (!hasSpeech) return;
    try {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.start();
      setIsListening(true);
      
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        // If in Input view, append. If in Result view, set input.
        setInputText(prev => prev && view === 'INPUT_PROBLEM' ? prev + " " + text : text);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } catch (e) {
      setIsListening(false);
    }
  };

  // --- Components ---

  const Header = () => (
    <div className="mb-12 text-center opacity-90">
      <h1 className="text-xl font-semibold tracking-wide text-primary uppercase text-opacity-80">
        A-R-I-H-A-N-T-E
      </h1>
    </div>
  );

  // VIEW 1: HOME
  if (view === 'HOME') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-surface max-w-md mx-auto w-full">
        <Header />
        
        <div className="w-full space-y-5">
          <button
            onClick={handleDailyClick}
            className="w-full bg-primary text-white text-lg font-medium py-6 px-6 rounded-2xl shadow-lg active:scale-95 hover:shadow-xl transition-all flex items-center justify-between group"
          >
            <span>Aaj kya karna hai</span>
            <span className="opacity-50 group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <button
            onClick={() => setView('INPUT_PROBLEM')}
            className="w-full bg-white text-primary border border-gray-200 text-lg font-medium py-6 px-6 rounded-2xl shadow-sm active:scale-95 hover:border-gray-300 transition-all flex items-center justify-between"
          >
            <span>Problem hai</span>
            <span className="text-gray-400">+</span>
          </button>
        </div>
      </div>
    );
  }

  // VIEW 2: INPUT (PROBLEM)
  if (view === 'INPUT_PROBLEM') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-surface max-w-md mx-auto w-full">
        <div className="w-full mb-6">
          <button 
            onClick={() => setView('HOME')} 
            className="text-gray-400 text-sm font-medium hover:text-primary mb-4"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-semibold text-primary mb-2">What is the problem?</h2>
          <p className="text-gray-500">Explain briefly. I will fix it.</p>
        </div>

        <div className="w-full relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full bg-white border-none rounded-2xl p-6 text-lg text-primary shadow-soft resize-none focus:ring-2 focus:ring-gray-200 outline-none h-48 placeholder-gray-300"
            placeholder="Type here..."
            autoFocus
          />
          {hasSpeech && (
            <button 
              onClick={startListening}
              className={`absolute bottom-4 right-4 p-3 rounded-full transition-all ${isListening ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:text-primary'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
            </button>
          )}
        </div>

        <button
          onClick={() => handleSubmit()}
          disabled={!inputText.trim()}
          className="w-full mt-6 bg-primary text-white py-5 rounded-2xl font-medium shadow-lg disabled:opacity-30 disabled:shadow-none transition-all"
        >
          Solve
        </button>
      </div>
    );
  }

  // VIEW 3: LOADING
  if (view === 'LOADING') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-surface">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    );
  }

  // VIEW 4: RESULT (With Follow-up)
  return (
    <div className="min-h-screen flex flex-col justify-between p-6 bg-surface max-w-md mx-auto w-full py-8 sm:py-12">
      <Header />

      {/* Result Card */}
      <div className="bg-white rounded-3xl p-8 shadow-float w-full flex-1 mb-6 border border-gray-50 flex flex-col justify-center">
        <p className="text-xl sm:text-2xl text-primary font-medium leading-relaxed">
          {result?.answer}
        </p>
      </div>

      {/* Follow-up & Done Section */}
      <div className="w-full space-y-4">
        
        {/* Follow-up Input */}
        <div className="relative">
          <input 
            type="text"
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Ask a follow-up question..."
            className="w-full bg-white border border-gray-200 text-primary rounded-xl py-4 pl-4 pr-12 focus:ring-2 focus:ring-gray-200 focus:border-transparent outline-none placeholder-gray-400 shadow-sm"
          />
          <button 
            onClick={() => handleSubmit()}
            disabled={!inputText.trim()}
            className="absolute right-2 top-2 bottom-2 text-primary font-bold px-3 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
        </div>

        {/* Done Button */}
        <button
          onClick={handleDone}
          className="w-full bg-primary text-white font-semibold py-5 rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default App;