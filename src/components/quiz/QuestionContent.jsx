import Markdown from '@/components/common/Markdown';

/**
 * @param {{ content: string }} props
 */
export default function QuestionContent({ content }) {
  return <Markdown content={content} />;
}
