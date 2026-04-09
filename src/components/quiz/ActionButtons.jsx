import { useProgressStore } from '@/store/progressStore';

const BUTTON_CONFIG = [
  {
    status: 'mastered',
    label: '已掌握',
    labelActive: '取消已掌握',
    base: 'border-emerald-200/80 bg-emerald-100/70 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/18',
    active: 'border-emerald-300 bg-emerald-200/80 text-emerald-800 dark:border-emerald-400/60 dark:bg-emerald-500/25 dark:text-emerald-100',
  },
  {
    status: 'review',
    label: '需复习',
    labelActive: '取消需复习',
    base: 'border-amber-200/80 bg-amber-100/70 text-amber-700 hover:bg-amber-100 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/18',
    active: 'border-amber-300 bg-amber-200/80 text-amber-800 dark:border-amber-400/60 dark:bg-amber-500/25 dark:text-amber-100',
  },
  {
    status: 'wrong',
    label: '加入错题本',
    labelActive: '移出错题本',
    base: 'border-rose-200/80 bg-rose-100/70 text-rose-700 hover:bg-rose-100 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/18',
    active: 'border-rose-300 bg-rose-200/80 text-rose-800 dark:border-rose-400/60 dark:bg-rose-500/25 dark:text-rose-100',
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
    <div className="mt-4 flex flex-wrap gap-2">
      {BUTTON_CONFIG.map(({ status, label, labelActive, base, active }) => {
        const isActive = current === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => handleClick(status)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-95 ${isActive ? active : base}`}
            title={isActive ? '点击取消选中' : `点击标记为「${label}」`}
          >
            {isActive ? labelActive : label}
          </button>
        );
      })}
    </div>
  );
}
