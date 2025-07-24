import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChartRenderer } from './ChartRenderer';
import { ModelSelector } from './ModelSelector';
import { TypingIndicator } from './TypingIndicator';
import { FormattedResponse } from './FormattedResponse';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  chartData?: {
    type: 'bar' | 'line' | 'pie' | 'area';
    data: any[];
    title?: string;
    xKey?: string;
    yKey?: string;
    nameKey?: string;
    valueKey?: string;
  };
}

const GEMINI_API_KEY = 'AIzaSyAHLMNqcJIyRZ47_izGxu9yt4gwBHBSphI';

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<'gemini' | 'ollama'>('gemini');
  const [currentModel, setCurrentModel] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const parseChartData = (content: string) => {
    const chartMatch = content.match(/<CHART>([\s\S]*?)<\/CHART>/);
    if (chartMatch) {
      try {
        const chartConfig = JSON.parse(chartMatch[1].trim());
        const cleanContent = content.replace(/<CHART>[\s\S]*?<\/CHART>/, '').trim();
        return { content: cleanContent, chartData: chartConfig };
      } catch (error) {
        console.error('Error parsing chart data:', error);
        return { content };
      }
    }
    return { content };
  };

  const handleModelChange = (provider: 'gemini' | 'ollama', model?: string) => {
    setCurrentProvider(provider);
    if (model) {
      setCurrentModel(model);
    }
  };

  const callGeminiAPI = async (prompt: string) => {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Unexpected Gemini response format');
    }
  };

  const callOllamaAPI = async (prompt: string) => {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: currentModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.95,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const aiPrompt = `You are an AI search assistant inspired by Perplexity. Provide helpful, accurate, and well-structured answers. Be conversational and engaging while being informative.

When answering data-driven questions that would benefit from visualization, include a JSON chart configuration at the end of your response using this format:

<CHART>
{
  "type": "bar|line|pie|area",
  "title": "Chart Title", 
  "data": [
    {"name": "Category1", "value": 100},
    {"name": "Category2", "value": 200}
  ],
  "xKey": "name",
  "yKey": "value"
}
</CHART>

Question: ${currentInput}`;

      let rawContent: string;
      
      if (currentProvider === 'gemini') {
        rawContent = await callGeminiAPI(aiPrompt);
      } else {
        rawContent = await callOllamaAPI(aiPrompt);
      }
      
      const { content, chartData } = parseChartData(rawContent);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: content,
        timestamp: new Date(),
        chartData: chartData,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling AI API:', error);
      toast({
        title: "Error",
        description: `Failed to get response from ${currentProvider}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen max-w-6xl mx-auto gap-4">
      {/* Sidebar */}
      <div className="w-80 p-4 space-y-4">
        <ModelSelector 
          onModelChange={handleModelChange}
          currentProvider={currentProvider}
          disabled={isLoading}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-center p-6 border-b border-border/50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-xl blur-lg opacity-50 animate-pulse-glow"></div>
              <div className="relative bg-gradient-primary p-3 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                AI Search Engine
              </h1>
              <p className="text-sm text-muted-foreground">
                {currentProvider === 'gemini' ? 'Powered by Gemini 2.0 Flash' : `Using ${currentModel}`}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="glow-effect rounded-full"></div>
                  <div className="relative bg-gradient-primary p-4 rounded-full shadow-glow">
                    <Bot className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-2">What would you like to know?</h2>
                <p className="text-muted-foreground">Ask me anything and I'll provide detailed, helpful answers.</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-4 animate-fade-in ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <Avatar className="w-8 h-8 border-2 border-border/50">
                  <AvatarFallback className={message.type === 'user' ? 'bg-chat-user' : 'bg-gradient-primary'}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`chat-message ${message.type === 'user' ? 'chat-user' : 'chat-ai'}`}>
                  {message.type === 'user' ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    </div>
                  ) : (
                    <FormattedResponse content={message.content} />
                  )}
                  {message.chartData && (
                    <ChartRenderer chartData={message.chartData} />
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-4 animate-fade-in">
                <Avatar className="w-8 h-8 border-2 border-border/50">
                  <AvatarFallback className="bg-gradient-primary">
                    <Bot className="w-4 h-4 text-white" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="chat-message chat-ai">
                  <TypingIndicator message={`${currentProvider === 'gemini' ? 'Gemini' : 'Ollama'} is thinking...`} />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-6 border-t border-border/50">
          <div className="flex space-x-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-105"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};