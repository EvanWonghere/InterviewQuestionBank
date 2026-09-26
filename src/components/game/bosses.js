import { categorySlug } from '@/lib/gameRules';

// Hand-written interviewer lines per chapter; no model call.
const BOSSES = {
  'csharp-basics': { name: 'C# 面试官', taunt: '先说说，装箱发生在哪一行？' },
  'unity-core': { name: 'Unity 主程', taunt: '生命周期的调用顺序，背熟了吗？' },
  'rendering-graphics': { name: '图形程序', taunt: '一帧里的 Draw Call 都是从哪来的？' },
  'algorithms-datastructures': { name: '算法面试官', taunt: '先别写代码，复杂度是多少？' },
  'project-practice': { name: '项目负责人', taunt: '这个方案上线以后出过事故吗？' },
  'cpp-basics': { name: 'C++ 面试官', taunt: '这段代码是不是未定义行为？' },
  'os-fundamentals': { name: '系统面试官', taunt: '进程和线程，你先挑一个讲。' },
  'computer-networks': { name: '网络面试官', taunt: '三次握手，第三次能省吗？' },
  'design-patterns': { name: '架构师', taunt: '这里为什么不用单例？' },
};
export const bossFor = (category) => BOSSES[categorySlug(category)] ?? { name: `${category.name} 面试官`, taunt: '我们开始吧。' };
