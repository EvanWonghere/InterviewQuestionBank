const experiments={
 'q-040':[['cpp-dispatch','观察动态分派'],['cpp-lifetime','验证构造与切片']],
 'q-045':[['cpp-layout','观察对象与虚表'],['cpp-adjust','验证多继承调整']],
 'q-039':[['cpp-smartptr','观察智能指针所有权']],
 'q-038':[['cpp-smartptr','对比 unique / shared / weak']],
 'q-046':[['cpp-move','对照拷贝与移动']],
 'q-132':[['cpp-move','观察移动是否发生']],
 'q-043':[['cpp-vector','观察扩容与指针失效']],
 'q-044':[['cpp-vector','验证插入后的失效']],
 'q-002':[['gc-roots','追踪可达性'],['gc-events','定位事件保留'],['gc-collect','对照 GC 模型'],['gc-string','对照加号拼接']],
 'q-003':[['gc-string','测量字符串拼接分配']],
 'q-018':[['gc-alloc','测量装箱与分配']],
 'q-063':[['gc-events','检查对象保留']],
 'q-136':[['mem-locality','比较行优先与列优先']],
 'q-011':[['mem-locality','观察缓存行触达']],
 'q-007':[['render-state','观察材质与提交'],['render-batch','比较实例化与状态准备'],['render-atlas','观察纹理绑定']],
 'q-013':[['render-atlas','对比独立纹理与图集']],
 'q-032':[['render-draws','实际运行 DrawCall 实验'],['render-overdraw','观察过度绘制']],
 'q-009':[['render-material','对照材质实例与合批']],
 'q-174':[['render-batch','检验 SRP Batcher 的边界'],['render-material','看独立材质如何打断合批']],
 'q-016':[['unity-lifecycle','验证失活时的 Start']],
 'q-021':[['unity-lifecycle','对照生命周期顺序']],
 'q-098':[['net-predict','观察延迟与预测']],
 'q-050':[['net-predict','看校正回弹的前提']],
};
export default function ConceptLabLinks({question}){
 const base=import.meta.env.VITE_CONCEPT_LAB_URL;
 const links=experiments[question.legacyId??question.id];
 // Opt-in until the independent lab has been published; no dead production link.
 if(!base||!links)return null;
 return <aside className="mt-4 mb-4"><p className="type-caption">用实验验证这个概念</p><div className="flex flex-wrap gap-2">{links.map(([id,title])=><a key={id} className="chip" href={`${base.replace(/\/$/,'')}/#/experiment/${id}`} target="_blank" rel="noreferrer">{title} ↗</a>)}</div></aside>;
}
