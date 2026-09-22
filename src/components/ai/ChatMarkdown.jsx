import { Children, Component, useEffect, useId, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { highlightOptions } from '@/lib/markdownHighlight';
import { loadMermaid } from '@/lib/loadMermaid';
import { normalizeChatMath } from '@/lib/normalizeChatMath';

function languageFromClass(className) {
  const match = String(className || '').match(/language-([^\s]+)/);
  return match?.[1] ?? '';
}

function textFromNode(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join('');
  if (node.props?.children != null) return textFromNode(node.props.children);
  return '';
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="ai-copy-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? '已复制' : '复制'}
    </button>
  );
}

function MermaidDiagram({ source, complete }) {
  const reactId = useId().replace(/:/g, '');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!complete) {
      setSvg('');
      setError('');
      return undefined;
    }
    let cancelled = false;
    loadMermaid()
      .then((mermaid) => mermaid.render(`mermaid-${reactId}`, source))
      .then((result) => {
        if (!cancelled) {
          setSvg(result.svg);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSvg('');
          setError(err instanceof Error ? err.message : '绘制失败');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [complete, reactId, source]);

  if (!complete || error || !svg) {
    return (
      <div className="ai-mermaid">
        {error ? <p className="type-caption" role="status">无法绘制这张图：{error}</p> : null}
        {!complete ? <p className="type-caption" role="status">示意图将在回复完成后绘制</p> : null}
        <pre><code>{source}</code></pre>
      </div>
    );
  }
  return <div className="ai-mermaid" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Pre({ children, streaming }) {
  const child = Children.toArray(children)[0];
  const className = child?.props?.className ?? '';
  const lang = languageFromClass(className);
  const source = textFromNode(child).replace(/\n$/, '');
  if (lang === 'mermaid') return <MermaidDiagram source={source} complete={!streaming} />;
  return (
    <div className="ai-code-block">
      <div className="ai-code-toolbar">
        <span className="type-micro">{lang || 'code'}</span>
        <CopyButton text={source} />
      </div>
      <pre>{children}</pre>
    </div>
  );
}

class MarkdownErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.source !== this.props.source && this.state.failed) this.setState({ failed: false });
  }

  render() {
    if (this.state.failed) return <pre className="ai-markdown-fallback">{this.props.source}</pre>;
    return this.props.children;
  }
}

/**
 * @param {{ content: string, streaming?: boolean }} props
 */
export function ChatMarkdown({ content, streaming = false }) {
  const source = normalizeChatMath(content ?? '');
  return (
    <MarkdownErrorBoundary source={content}>
      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, [rehypeHighlight, highlightOptions]]}
          skipHtml
          components={{
            img: ({ alt }) => <span>[图片未自动加载：{alt || '图片'}]</span>,
            a: ({ href, children }) => {
              if (!href || /^(javascript|data|vbscript):/i.test(href)) return <span>{children}</span>;
              return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
            },
            pre: ({ children }) => <Pre streaming={streaming}>{children}</Pre>,
          }}
        >
          {source}
        </ReactMarkdown>
      </div>
    </MarkdownErrorBoundary>
  );
}
