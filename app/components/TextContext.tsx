import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const TextContent = ({ text }: { text: string; }) => {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        img({ src, alt, ...props }) {
          return (
            <span className="flex rounded-xl max-w-full overflow-hidden">
              <img className="w-full" src={src} alt={alt} {...props} />
            </span>
          );
        },
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return match ? (
            <SyntaxHighlighter
              PreTag="div"
              language={match[1]}
              style={atomDark}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code {...props} className={className}>
              {children}
            </code>
          );
        },
      }}
    >
      {text}
    </Markdown>
  );
};
