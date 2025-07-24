import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Bot, Globe, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
  };
}

interface ModelSelectorProps {
  onModelChange: (provider: 'gemini' | 'ollama', model?: string) => void;
  currentProvider: 'gemini' | 'ollama';
  disabled?: boolean;
}

export const ModelSelector = ({ onModelChange, currentProvider, disabled }: ModelSelectorProps) => {
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean>(false);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [selectedOllamaModel, setSelectedOllamaModel] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkOllamaAvailability = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setOllamaAvailable(true);
        setOllamaModels(data.models || []);
        if (data.models && data.models.length > 0 && !selectedOllamaModel) {
          setSelectedOllamaModel(data.models[0].name);
        }
        toast({
          title: "Ollama Connected",
          description: `Found ${data.models?.length || 0} local models`,
        });
      } else {
        setOllamaAvailable(false);
        setOllamaModels([]);
      }
    } catch (error) {
      setOllamaAvailable(false);
      setOllamaModels([]);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkOllamaAvailability();
  }, []);

  const handleProviderChange = (provider: 'gemini' | 'ollama') => {
    if (provider === 'ollama' && selectedOllamaModel) {
      onModelChange(provider, selectedOllamaModel);
    } else {
      onModelChange(provider);
    }
  };

  const handleOllamaModelChange = (modelName: string) => {
    setSelectedOllamaModel(modelName);
    if (currentProvider === 'ollama') {
      onModelChange('ollama', modelName);
    }
  };

  return (
    <Card className="p-4 bg-card/50 border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">AI Models</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={checkOllamaAvailability}
          disabled={isChecking || disabled}
          className="h-7 px-2"
        >
          <Settings className="w-3 h-3" />
        </Button>
      </div>

      <div className="space-y-3">
        {/* Gemini Option */}
        <div className="flex items-center justify-between">
          <Button
            variant={currentProvider === 'gemini' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleProviderChange('gemini')}
            disabled={disabled}
            className="flex-1 justify-start"
          >
            <Globe className="w-4 h-4 mr-2" />
            Gemini 2.0 Flash
            <Badge variant="secondary" className="ml-2 text-xs">Cloud</Badge>
          </Button>
        </div>

        {/* Ollama Option */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Button
              variant={currentProvider === 'ollama' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleProviderChange('ollama')}
              disabled={disabled || !ollamaAvailable}
              className="flex-1 justify-start"
            >
              <Bot className="w-4 h-4 mr-2" />
              Ollama Local
              {ollamaAvailable ? (
                <CheckCircle className="w-3 h-3 ml-2 text-green-500" />
              ) : (
                <AlertCircle className="w-3 h-3 ml-2 text-yellow-500" />
              )}
            </Button>
          </div>

          {/* Ollama Models Dropdown */}
          {ollamaAvailable && ollamaModels.length > 0 && (
            <select
              value={selectedOllamaModel}
              onChange={(e) => handleOllamaModelChange(e.target.value)}
              disabled={disabled || currentProvider !== 'ollama'}
              className="w-full px-3 py-1.5 text-xs bg-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {ollamaModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} ({(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)
                </option>
              ))}
            </select>
          )}

          {/* Status Messages */}
          {!ollamaAvailable && (
            <p className="text-xs text-muted-foreground">
              Install Ollama locally to use offline models
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};