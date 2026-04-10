import { useProgressStore } from '@/store/progressStore';

const BUTTON_CONFIG = [
  {
    status: 'mastered',
    label: '已掌握',
    labelActive: '已掌握 ✓',
    className: 'btn-status btn-status-mastered',
  },
  {
    status: 'review',
    label: '需复习',
    labelActive: '需复习 ✓',
    className: 'btn-status btn-status-review',
  },
  {
    status: 'wrong',
    label: '加入错题本',
    labelActive: '已加入错题本 ✓',
    className: 'btn-status btn-status-wrong',
  },
];

/**
 * @param {{ questionId: string }} props
 */
export default function ActionButtons({ questionId }) {
  const setProgress = useProgressStore((s) => s.setProgress);
  const current = useProgressStore((s) => s.progress[questionId]);

  const handleClick = (status) => {
    setProgress(questionId, current === status ? null : status);
  };

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {BUTTON_CONFIG.map(({ status, label, labelActive, className }) => {
        const isActive = current === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => handleClick(status)}
            className={`${className} ${isActive ? 'is-active' : ''}`}
            title={isActive ? '点击取消选中' : `点击标记为「${label}」`}
          >
            <span className="dot" />
            {isActive ? labelActive : label}
          </button>
        );
      })}
    </div>
  );
}
