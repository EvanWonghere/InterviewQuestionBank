import { useProgressStore } from '@/store/progressStore';

const BUTTON_CONFIG = [
  {
    status: 'mastered',
    label: '已掌握',
    labelActive: '取消已掌握',
    base: 'border-green-500 text-green-700 hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-950',
    active: 'border-green-500 bg-green-500 text-white dark:border-green-600 dark:bg-green-600',
  },
  {
    status: 'review',
    label: '需复习',
    labelActive: '取消需复习',
    base: 'border-amber-500 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950',
    active: 'border-amber-500 bg-amber-500 text-white dark:border-amber-600 dark:bg-amber-600',
  },
  {
    status: 'wrong',
    label: '加入错题本',
    labelActive: '移出错题本',
    base: 'border-red-500 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950',
    active: 'border-red-500 bg-red-500 text-white dark:border-red-600 dark:bg-red-600',
  },
];

/**
 * @param {{ questionId: string }} props
 */
export default function ActionButtons({ questionId }) {
  const setProgress = useProgressStore((s) => s.setProgress);
  const current = useProgressStore((s) => s.getProgress(questionId));

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
