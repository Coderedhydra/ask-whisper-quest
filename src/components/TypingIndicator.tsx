interface TypingIndicatorProps {
  message?: string;
}

export const TypingIndicator = ({ message = "AI is thinking..." }: TypingIndicatorProps) => {
  return (
    <div className="flex items-center space-x-3 p-4">
      <div className="flex space-x-1">
        <div 
          className="w-2 h-2 bg-primary rounded-full animate-thinking"
          style={{ animationDelay: '0ms' }}
        ></div>
        <div 
          className="w-2 h-2 bg-primary rounded-full animate-thinking"
          style={{ animationDelay: '200ms' }}
        ></div>
        <div 
          className="w-2 h-2 bg-primary rounded-full animate-thinking"
          style={{ animationDelay: '400ms' }}
        ></div>
      </div>
      <span className="text-sm text-muted-foreground animate-pulse">
        {message}
      </span>
    </div>
  );
};