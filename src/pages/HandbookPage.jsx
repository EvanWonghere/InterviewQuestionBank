import { useState } from 'react';
import { Link } from 'react-router-dom';
import PixelPet from '@/components/pet/PixelPet';
import {
  STAGE_MAX_SIZE, HEARTS_PER_STAGE, BASE_XP, MISS_XP, COMBO_STEP, COMBO_CAP, LEVELS,
  HINT_CARDS, HINT_CARD_COMBO, REVIVE_SCORE, PATROL_SIZE, FREEZE_EVERY, FREEZE_MAX,
  BOSS_HP, BOSS_QUESTIONS, BOSS_DAILY_LIMIT, RATING_DAMAGE, ACHIEVEMENTS,
} from '@/lib/gameRules';
import '@/components/game/game.css';
import '@/components/game/handbook.css';

const RATING_LABEL = { 0: '重来', 3: '困难', 4: '良好', 5: '简单' };

const SECTIONS = [
  { id: 'stages', title: '关卡与星星' },
  { id: 'hearts', title: '心、连击与提示卡' },
  { id: 'patrol', title: '巡检与连签' },
  { id: 'boss', title: '章末 Boss 与弱点副本' },
  { id: 'xp', title: '经验与职级' },
  { id: 'pet', title: '小芽' },
  { id: 'achievements', title: '成就' },
];

function Section({ id, title, children }) {
  return (
    <section id={id} className="handbook-section">
      <h2 className="type-display-sm mb-3" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      <div className="type-body" style={{ color: 'var(--text-secondary)' }}>{children}</div>
    </section>
  );
}

export default function HandbookPage() {
  const [active, setActive] = useState(SECTIONS[0].id);

  const goTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      <section className="mb-10">
        <p className="type-eyebrow mb-4" style={{ color: 'var(--apple-blue)' }}>闯关手册</p>
        <h1 className="type-display-lg mb-3" style={{ color: 'var(--text-primary)' }}>规则都在这里，怎么玩不用猜</h1>
        <p className="type-body-lg max-w-xl" style={{ color: 'var(--text-tertiary)' }}>
          关卡、星星、经验、Boss 和成就的全部数字都来自代码里的同一份规则，这里只是把它们讲清楚。
        </p>
      </section>

      <div className="handbook-layout">
        <nav className="handbook-toc" aria-label="手册目录">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`handbook-toc-link${active === s.id ? ' is-active' : ''}`}
              onClick={() => goTo(s.id)}
            >
              {s.title}
            </button>
          ))}
        </nav>

        <div className="handbook-sections">
          <Section id="stages" title="关卡与星星">
            <p>每个分类按难度从易到难排序，拆成每关最多 {STAGE_MAX_SIZE} 题的若干关。章内的关卡按顺序解锁，章与章之间可以自由跳。</p>
            <p className="mt-3">每题当场最多拿 2 星：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>答错，或自评「重来」：0 星，扣 1 颗心。</li>
              <li>自评「困难」，或作答前问过小芽：1 星。</li>
              <li>一次答对，或自评「良好」「简单」且没用提示：2 星。</li>
            </ul>
            <p className="mt-3">第 3 颗星不能当场拿到，要等之后在另一个自然日再复习通过一次才会点亮。</p>
            <p className="mt-3">关卡本身也有星：通关 1 星；不掉心通关 2 星；关内每题都是 3 星时 3 星。</p>
          </Section>

          <Section id="hearts" title="心、连击与提示卡">
            <p>每关有 {HEARTS_PER_STAGE} 颗心，答出 0 星扣 1 颗，心用完这关失败，但答题记录仍然算数。</p>
            <p className="mt-3">连续答出 2 星会叠连击，每级连击给 2 星答题加 {Math.round(COMBO_STEP * 100)}% 经验，最多加到 {Math.round(COMBO_CAP * 100)}%。</p>
            <p className="mt-3">提示卡（管理员）：每关 {HINT_CARDS} 张，连击第一次到 {HINT_CARD_COMBO} 时再送 1 张。作答前问小芽会花掉一张。</p>
            <p className="mt-3">追问复活（管理员）：扣心之后，如果这题的追问评分不低于 {REVIVE_SCORE} 分，就补回 1 颗心，每关只能触发一次，复活过的关不算无伤。</p>
          </Section>

          <Section id="patrol" title="巡检与连签">
            <p>巡检收集到期该复习的题，每次最多 {PATROL_SIZE} 题，不扣心，是点亮第 3 颗星的主要方式。</p>
            <p className="mt-3">当天只要答过一题就算签到。连签每满 {FREEZE_EVERY} 天送 1 张补签卡，最多攒 {FREEZE_MAX} 张，漏签的一天会自动用卡补上。</p>
          </Section>

          <Section id="boss" title="章末 Boss 与弱点副本">
            <p>本章每关都拿到至少 2 星后解锁 Boss。一场战斗 {BOSS_QUESTIONS} 题，面试官有 {BOSS_HP} 点血。</p>
            <p className="mt-3">有 AI 时（管理员）：伤害是每题最高 AI 评分的一半，追问拿到更高分算暴击，结束后有面试官战报。</p>
            <p className="mt-3">没有 AI 时按自评算伤害：</p>
            <table className="handbook-table type-body">
              <thead>
                <tr><th>自评</th><th>伤害</th></tr>
              </thead>
              <tbody>
                {Object.entries(RATING_DAMAGE).map(([quality, damage]) => (
                  <tr key={quality}><td>{RATING_LABEL[quality] ?? quality}</td><td>{damage}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3">每天最多挑战 {BOSS_DAILY_LIMIT} 场。</p>
            <p className="mt-3">弱点副本：从你失误最多的标签里抽 5 题，3 颗心，随时可以打。</p>
          </Section>

          <Section id="xp" title="经验与职级">
            <p>每题的经验按历史最高星计算：难度基础分乘以星级系数，1 星六成、2 星全额、3 星在全额之外再加 1.5 倍基础分。</p>
            <table className="handbook-table type-body">
              <thead>
                <tr><th>难度</th><th>基础分（2 星）</th></tr>
              </thead>
              <tbody>
                <tr><td>简单</td><td>{BASE_XP.easy}</td></tr>
                <tr><td>中等</td><td>{BASE_XP.medium}</td></tr>
                <tr><td>困难</td><td>{BASE_XP.hard}</td></tr>
              </tbody>
            </table>
            <p className="mt-3">每次失误额外 +{MISS_XP} 经验，历史最高星不会因为后来复习失败而降低，经验也就不会倒扣。再加上连击奖励，就是这题这次拿到的经验。</p>
            <table className="handbook-table type-body">
              <thead>
                <tr><th>职级</th><th>经验门槛</th></tr>
              </thead>
              <tbody>
                {LEVELS.map((level) => (
                  <tr key={level.name}><td>{level.name}</td><td>{level.xp}</td></tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section id="pet" title="小芽">
            <p>小芽跟着职级长大：LV1–2 是小芽，LV3–4 长出双叶，LV5 起开花。待复习的题堆到 10 道以上时会打蔫。</p>
            <div className="handbook-pet-row">
              <div className="handbook-pet-item">
                <PixelPet form="sprout" mood="idle" size={48} />
                <span className="type-caption" style={{ color: 'var(--text-tertiary)' }}>小芽 LV1–2</span>
              </div>
              <div className="handbook-pet-item">
                <PixelPet form="twin" mood="idle" size={48} />
                <span className="type-caption" style={{ color: 'var(--text-tertiary)' }}>双叶 LV3–4</span>
              </div>
              <div className="handbook-pet-item">
                <PixelPet form="bloom" mood="idle" size={48} />
                <span className="type-caption" style={{ color: 'var(--text-tertiary)' }}>开花 LV5+</span>
              </div>
              <div className="handbook-pet-item">
                <PixelPet form="droop" mood="idle" size={48} />
                <span className="type-caption" style={{ color: 'var(--text-tertiary)' }}>打蔫</span>
              </div>
            </div>
            <p className="mt-3">小芽可以随意拖动，默认松手后贴到最近的一侧，菜单里能关掉吸附。点一下能看今日任务和这本手册。主动提醒只在进度总览和闯关地图出现，同一种提醒每天最多一次，可以在它的菜单里关掉。地图页的安静模式会关掉它的动效和粒子。</p>
          </Section>

          <Section id="achievements" title="成就">
            <ul className="space-y-3">
              {ACHIEVEMENTS.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span
                    className="game-pixel type-caption-bold flex-none rounded-md px-2 py-1"
                    style={{ background: 'var(--game-star-soft)', color: 'var(--game-mint-deep)' }}
                  >
                    {a.badge}
                  </span>
                  <span>
                    <span className="type-body-emphasis" style={{ color: 'var(--text-primary)' }}>{a.name}</span>
                    <span className="type-body" style={{ color: 'var(--text-secondary)' }}> — {a.description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <div>
            <Link to="/map" className="btn-blue-outline">返回闯关地图</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
