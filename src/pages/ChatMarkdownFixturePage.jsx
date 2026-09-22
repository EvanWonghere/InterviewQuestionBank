import { ChatMarkdown } from '@/components/ai/ChatMarkdown';

const sample = [
  '**safe** 行内 $E=mc^2$ 与显示式：',
  '',
  '$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$',
  '',
  '```latex',
  '\\int_0^1 x\\,dx',
  '```',
  '',
  '```csharp',
  'public sealed class Box { public int Count { get; set; } }',
  '```',
  '',
  '```mermaid',
  'graph LR',
  '  A[预测] --> B[运行]',
  '  B --> C[解释]',
  '```',
].join('\n');

export default function ChatMarkdownFixturePage() {
  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <h1 className="type-display-sm mb-4" style={{ color: 'var(--text-primary)' }}>助手渲染夹具</h1>
      <p className="type-caption mb-4">本地核对公式、代码高亮和 Mermaid。不是题目，也不写入学习记录。</p>
      <article className="ai-message">
        <ChatMarkdown content={sample} />
      </article>
    </main>
  );
}
