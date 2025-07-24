interface FormattedResponseProps {
  content: string;
}

export const FormattedResponse = ({ content }: FormattedResponseProps) => {
  // Split content into sections based on common patterns
  const formatContent = (text: string) => {
    // Split by double newlines for paragraphs
    const sections = text.split('\n\n');
    
    return sections.map((section, index) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return null;

      // Check for headers (lines starting with # or ending with :)
      if (trimmedSection.match(/^#{1,3}\s/) || trimmedSection.match(/^[A-Z][^:]*:$/)) {
        return (
          <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-foreground">
            {trimmedSection.replace(/^#{1,3}\s/, '').replace(/:$/, '')}
          </h3>
        );
      }

      // Check for bullet points
      if (trimmedSection.match(/^[-•*]\s/)) {
        const items = trimmedSection.split('\n').filter(line => line.trim());
        return (
          <ul key={index} className="list-disc list-inside space-y-1 mb-4 text-foreground/90">
            {items.map((item, itemIndex) => (
              <li key={itemIndex} className="text-sm leading-relaxed">
                {item.replace(/^[-•*]\s/, '')}
              </li>
            ))}
          </ul>
        );
      }

      // Check for numbered lists
      if (trimmedSection.match(/^\d+\.\s/)) {
        const items = trimmedSection.split('\n').filter(line => line.trim());
        return (
          <ol key={index} className="list-decimal list-inside space-y-1 mb-4 text-foreground/90">
            {items.map((item, itemIndex) => (
              <li key={itemIndex} className="text-sm leading-relaxed">
                {item.replace(/^\d+\.\s/, '')}
              </li>
            ))}
          </ol>
        );
      }

      // Check for code blocks
      if (trimmedSection.includes('```')) {
        const codeMatch = trimmedSection.match(/```(\w+)?\n?([\s\S]*?)```/);
        if (codeMatch) {
          return (
            <div key={index} className="my-4">
              <pre className="bg-secondary/50 border border-border/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm font-mono text-foreground/90">
                  {codeMatch[2]}
                </code>
              </pre>
            </div>
          );
        }
      }

      // Regular paragraph
      return (
        <p key={index} className="text-sm leading-relaxed text-foreground/90 mb-3">
          {trimmedSection}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <div className="space-y-2">
        {formatContent(content)}
      </div>
    </div>
  );
};