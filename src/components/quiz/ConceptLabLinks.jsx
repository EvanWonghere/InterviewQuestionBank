import labLinksByQuestion from '@/data/conceptLabLinks.generated.json';

export function getConceptLabLinks(question) {
  if (!question) return [];
  const ids = [question.legacyId, question.id].filter(Boolean);
  return ids.flatMap((id) => labLinksByQuestion[id] ?? []).filter((link, index, links) => (
    links.findIndex((candidate) => candidate.id === link.id) === index
  ));
}

export default function ConceptLabLinks({ question, compact = false }) {
  const base = import.meta.env.VITE_CONCEPT_LAB_URL;
  const links = getConceptLabLinks(question);
  if (!base || !links.length) return null;

  return (
    <aside className={compact ? 'mt-2' : 'mt-4 mb-4'}>
      <p className="type-caption">{compact ? '相关 ConceptLab 实验' : '用实验验证这个概念'}</p>
      <div className="flex flex-wrap gap-2">
        {links.map(({ id, title }) => (
          <a
            key={id}
            className="chip"
            href={`${base.replace(/\/$/, '')}/#/experiment/${encodeURIComponent(id)}`}
            target="_blank"
            rel="noreferrer"
          >
            {title} ↗
          </a>
        ))}
      </div>
    </aside>
  );
}
