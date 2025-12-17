import clsx from "clsx";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

interface MarkdownProps {
  readonly children?: string | null;
  readonly className?: string;
}

const components: Components = {
  ul: ({ className, ...props }) => (
    <ul
      className={clsx("list-disc list-outside pl-5 space-y-1", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={clsx("list-decimal list-outside pl-5 space-y-1", className)}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li
      className={clsx("text-sm leading-relaxed text-current", className)}
      {...props}
    />
  ),
};

export function Markdown({ children, className }: MarkdownProps) {
  if (!children) return null;

  return (
    <div className={clsx("prose prose-sm max-w-none", className)}>
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  );
}
