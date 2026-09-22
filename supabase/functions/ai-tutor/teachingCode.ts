export type TraceParams = Record<string, string | number | boolean | undefined>;
export type TeachingLine = { text: string; key?: string; reveal?: boolean };
export type TeachingTrace = {
  caption: string;
  language: "cpp" | "csharp";
  lines: TeachingLine[];
  changedKeys: string[];
  changedLines: number[];
  eventLines: number[];
  activeLine: number;
  nodeId?: string;
};
const CAPTION = "教学片段，浏览器不编译；本机 JSON 和 WebGL 才是实测。";
type Spec = {
  language: "cpp" | "csharp";
  lines: TeachingLine[];
  eventLines: number[];
  eventNodes?: (string | undefined)[];
};
function changedKeysOf(lines: TeachingLine[], baseline: TraceParams, params: TraceParams) {
  const keys = new Set<string>();
  for (const line of lines) {
    if (line.key && baseline[line.key] !== undefined && baseline[line.key] !== params[line.key])
      keys.add(line.key);
  }
  return [...keys];
}
function finish(
  spec: Spec,
  params: TraceParams,
  baseline: TraceParams,
  step: number,
  eventCount?: number,
  focusKey?: string,
): TeachingTrace {
  let eventLines = spec.eventLines.slice();
  if (eventCount != null) {
    const last = eventLines.at(-1) ?? 0;
    while (eventLines.length < eventCount) eventLines.push(last);
    eventLines = eventLines.slice(0, eventCount);
  }
  const changedKeys = focusKey
    ? [focusKey]
    : changedKeysOf(spec.lines, baseline, params);
  const changedLines = spec.lines.flatMap((line, i) =>
    line.key && changedKeys.includes(line.key) ? [i] : [],
  );
  const clamped = Math.max(0, Math.min(step, Math.max(0, eventLines.length - 1)));
  const activeLine = eventLines[clamped] ?? 0;
  return {
    caption: CAPTION,
    language: spec.language,
    lines: spec.lines,
    changedKeys,
    changedLines,
    eventLines,
    activeLine,
    nodeId: spec.eventNodes?.[clamped],
  };
}
function dispatch(p: TraceParams): Spec {
  const invalid = p.static === "Derived" && p.dynamic === "Base";
  const virt = Boolean(p.virtual);
  const ov = virt && p.overrideKeyword !== false;
  const dyn = String(p.dynamic ?? "Derived");
  const st = String(p.static ?? "Base");
  const selected = invalid ? "invalid" : virt ? dyn : st;
  return {
    language: "cpp",
    lines: [
      {
        text: virt
          ? "struct Base { virtual const char* speak() const; };"
          : "struct Base { const char* speak() const; };",
        key: "virtual",
      },
      {
        text: virt
          ? ov
            ? "struct Derived : Base { const char* speak() const override; };"
            : "struct Derived : Base { const char* speak() const; };"
          : "struct Derived : Base { const char* speak() const; };",
        key: virt ? "overrideKeyword" : "virtual",
      },
      { text: `${dyn} object;`, key: "dynamic" },
      {
        text: invalid
          ? `Derived* p = &object; // 不能把 Base 对象当成 Derived*`
          : `${st}* p = &object;`,
        key: "static",
      },
      { text: "p->speak();" },
      {
        text: invalid
          ? "// 这个方向没有隐式转换，程序到不了调用"
          : `// 选中 ${selected}::speak`,
        reveal: true,
      },
    ],
    eventLines: [3, 2, 0, 1, 5],
    eventNodes: ["pointer", "object", virt && !invalid ? "vtable" : "call", "call", "call"],
  };
}
function layout(p: TraceParams): Spec {
  const virt = Boolean(p.virtual);
  return {
    language: "cpp",
    lines: [
      {
        text: virt
          ? "struct Item { virtual void tick(); int data; };"
          : "struct Item { int data; };",
        key: "virtual",
      },
      { text: `Item objects[${Number(p.objects ?? 3)}];`, key: "objects" },
      {
        text: virt
          ? "// 每个对象有 vptr；同类型共享一张虚表（示意，字节以 sizeof 为准）"
          : "// 没有虚函数时，对象里不必为分派准备 vptr",
        key: "virtual",
      },
      { text: "// 实际布局请导入本机 Clang 报告", reveal: true },
    ],
    eventLines: [0, 1, 2, 3],
  };
}
function lifetime(p: TraceParams): Spec {
  const slice = Boolean(p.slice);
  const phase = String(p.phase ?? "alive");
  const answer = phase === "alive" && !slice ? "Derived" : "Base";
  return {
    language: "cpp",
    lines: [
      { text: "struct Base { virtual const char* speak() const; Base(); ~Base(); };" },
      { text: "struct Derived : Base { const char* speak() const override; };" },
      {
        text: slice ? "Base sliced = derived; // 按值切掉派生部分" : "Base& ref = derived;",
        key: "slice",
      },
      { text: `// 观察阶段：${phase}`, key: "phase" },
      { text: slice ? "sliced.speak();" : "ref.speak();" },
      { text: `// 当前有效动态类型对应 ${answer}::speak`, reveal: true, key: "phase" },
    ],
    eventLines: [0, 1, 2, 5, 3],
    eventNodes: ["base", "derived", "derived", "base", "base"],
  };
}
function adjust(p: TraceParams): Spec {
  const base = String(p.base ?? "Right");
  const known = Boolean(p.known) || Boolean(p.final);
  return {
    language: "cpp",
    lines: [
      {
        text: Boolean(p.final)
          ? "struct Derived final : Left, Right {};"
          : "struct Derived : Left, Right {};",
        key: "final",
      },
      { text: `${base}* p = &object;`, key: "base" },
      {
        text: known
          ? "// 已知具体类型或 final 时，间接调用可能被优化掉；以汇编为准"
          : "// 动态类型未知时通常要经虚表间接调用",
        key: Boolean(p.final) ? "final" : "known",
      },
      {
        text: base === "Right" ? "// 转到 Right 子对象时 this 可能被调整" : "// 本示例 Left 位于对象起始，指针值不变",
        reveal: true,
        key: "base",
      },
    ],
    eventLines: [0, 1, 3, 2],
    eventNodes: ["whole", base === "Right" ? "right" : "left", "right", "whole"],
  };
}
function diamond(p: TraceParams): Spec {
  const left = Boolean(p.leftVirtual);
  const right = Boolean(p.rightVirtual);
  const shared = left && right;
  const access = String(p.access ?? "left");
  return {
    language: "cpp",
    lines: [
      { text: "struct Base { int value; };" },
      {
        text: left ? "struct Left : virtual Base {};" : "struct Left : Base {};",
        key: "leftVirtual",
      },
      {
        text: right ? "struct Right : virtual Base {};" : "struct Right : Base {};",
        key: "rightVirtual",
      },
      { text: "struct Most : Left, Right {};" },
      {
        text: access === "base" ? "Base* p = &most;" : access === "right" ? "Right* p = &most;" : "Left* p = &most;",
        key: "access",
      },
      {
        text:
          access === "base" && !shared
            ? "// 直接转为 Base 可能不明确：还留下两个 Base 子对象"
            : `// Base 子对象数：${shared ? 1 : 2}`,
        reveal: true,
      },
    ],
    eventLines: [1, 2, 5, 4],
    eventNodes: ["left", "right", shared ? "base" : "base-left", "diamond"],
  };
}
function virtualBase(p: TraceParams): Spec {
  const virt = Boolean(p.virtualBase);
  const most = String(p.mostDerived ?? "Diamond");
  const conflict =
    Boolean(p.conflictingOverrides) && virt && most === "Diamond";
  return {
    language: "cpp",
    lines: [
      {
        text: virt ? "struct Left : virtual Base {};" : "struct Left : Base {};",
        key: "virtualBase",
      },
      { text: `${most} object; // 最派生构造函数负责虚基类`, key: "mostDerived" },
      {
        text: Boolean(p.conflictingOverrides)
          ? "Left 与 Right 各自 override kind();"
          : "只有一条路径提供最终覆盖者",
        key: "conflictingOverrides",
      },
      {
        text: conflict
          ? "// 缺少唯一最终覆盖者，不能形成完整对象"
          : virt
            ? `// ${most} 直接初始化虚基类`
            : "// 普通基类沿所选路径初始化",
        reveal: true,
      },
    ],
    eventLines: [1, 2, 3],
    eventNodes: ["most", "override", "vbase"],
  };
}
function smartptr(p: TraceParams): Spec {
  const kind = String(p.kind ?? "unique");
  const extra = Boolean(p.extraShare);
  return {
    language: "cpp",
    lines: [
      {
        text:
          kind === "unique"
            ? "std::unique_ptr<T> owner(new T);"
            : kind === "shared"
              ? "std::shared_ptr<T> owner = std::make_shared<T>();"
              : "std::weak_ptr<T> owner = shared;",
        key: "kind",
      },
      {
        text: extra ? "std::shared_ptr<T> extra = owner;" : "// 没有第二个共享者",
        key: "extraShare",
      },
      { text: "owner.reset();" },
      {
        text:
          kind === "shared" && extra
            ? "// extra 仍保活对象"
            : "// 对象销毁；weak_ptr 不单独计数",
        reveal: true,
      },
    ],
    eventLines: [0, 1, 2, 3],
  };
}
function moveLab(p: TraceParams): Spec {
  const mode = String(p.mode ?? "copy");
  return {
    language: "cpp",
    lines: [
      { text: "Resource source;" },
      {
        text: mode === "move" ? "Resource target(std::move(source));" : "Resource target(source);",
        key: "mode",
      },
      { text: "// std::move 只改值类别，不保证发生移动" },
      {
        text: mode === "move" ? "// 教学模型：走移动构造" : "// 教学模型：走拷贝构造",
        reveal: true,
        key: "mode",
      },
    ],
    eventLines: [1, 2, 3],
  };
}
function vectorLab(p: TraceParams): Spec {
  return {
    language: "cpp",
    lines: [
      { text: `std::vector<int> v; v.reserve(${Number(p.capacity ?? 1)});`, key: "capacity" },
      { text: `for (int i = 0; i < ${Number(p.items ?? 8)}; ++i) v.push_back(i);`, key: "items" },
      { text: "// 模型按翻倍增长；增长因子不是标准保证", reveal: true },
    ],
    eventLines: [0, 2, 2],
  };
}
function deduction(p: TraceParams): Spec {
  const form = String(p.form ?? "auto");
  const decl: Record<string, string> = {
    auto: "auto y = x;",
    "auto-ref": "auto& y = x;",
    "const-ref": "const auto& y = x;",
    "decltype-value": "decltype(x) y = x;",
    "decltype-paren": "decltype((x)) y = x;",
  };
  const kind: Record<string, string> = {
    auto: "copy",
    "auto-ref": "mutable-ref",
    "const-ref": "const-ref",
    "decltype-value": "value",
    "decltype-paren": "lvalue-ref",
  };
  const answer = kind[form] ?? "copy";
  return {
    language: "cpp",
    lines: [
      { text: "int x = 1; // 左值" },
      { text: decl[form] ?? "auto y = x;", key: "form" },
      {
        text: Boolean(p.write) ? "y = 2; // 尝试写入" : "// 未写入，只比较推导类型",
        key: "write",
      },
      {
        text:
          answer === "mutable-ref"
            ? "// 可变引用：写入改原对象"
            : `// 教学分类：${answer}`,
        reveal: true,
      },
    ],
    eventLines: [1, 3, 2, 3],
  };
}
function buildLab(p: TraceParams): Spec {
  const failure = String(p.failure ?? "none");
  return {
    language: "cpp",
    lines: [
      { text: "// clang++ -E  预处理" },
      { text: "// clang++ -S  编译到汇编" },
      { text: "// clang++ -c  汇编到目标文件" },
      { text: "// clang++     链接", key: "optimization" },
      {
        text:
          failure === "none"
            ? `// -${String(p.optimization ?? "O0")} 改变生成代码，不改阶段名`
            : `// 在 ${failure} 阶段插入合成错误，后续阶段不运行`,
        reveal: true,
        key: "failure",
      },
    ],
    eventLines: [0, 4, 3, 4],
  };
}
function variance(p: TraceParams): Spec {
  const scenario = String(p.scenario ?? "variance");
  const shape = String(p.shape ?? "producer");
  const direction = String(p.direction ?? "up");
  const valueType = Boolean(p.valueType);
  const iface =
    shape === "producer"
      ? "interface IOut<out T> { T Get(); }"
      : shape === "consumer"
        ? "interface IIn<in T> { void Set(T value); }"
        : "interface IBox<T> { T Get(); void Set(T value); }";
  return {
    language: "csharp",
    lines: [
      { text: `// 场景：${scenario}`, key: "scenario" },
      { text: iface, key: "shape" },
      {
        text: direction === "up" ? "IOut<object> x = producerOfString;" : "IIn<string> x = consumerOfObject;",
        key: "direction",
      },
      {
        text: valueType ? "// 值类型不参与接口方差转换" : "// 方差转换只适用于引用类型",
        key: "valueType",
      },
      {
        text: Boolean(p.satisfies)
          ? "where T : IFoo, new()"
          : "where T : IFoo // 当前类型参数不满足",
        key: "satisfies",
      },
      { text: "// 教学模型只判断这次替换是否安全", reveal: true },
    ],
    eventLines: scenario === "variance" ? [0, 1, 3, 5, 5] : [0, 4, 4, 5],
  };
}
function eventsLab(p: TraceParams): Spec {
  const member = String(p.member ?? "event");
  const op = String(p.operation ?? "subscribe");
  const inside = Boolean(p.insidePublisher);
  const allowed = member === "delegate" || op === "subscribe" || inside;
  const stmt =
    op === "subscribe" ? "publisher.Changed += Handler;" : op === "assign" ? "publisher.Changed = Handler;" : "publisher.Changed();";
  return {
    language: "csharp",
    lines: [
      {
        text: member === "event" ? "public event Action Changed;" : "public Action Changed;",
        key: "member",
      },
      { text: inside ? "// 位于 Publisher 类型内部" : "// 位于外部调用者", key: "insidePublisher" },
      { text: stmt, key: "operation" },
      {
        text: allowed
          ? "// 这次操作对当前成员可见"
          : "// event 对外没有整体赋值或触发权限",
        reveal: true,
      },
    ],
    eventLines: [0, 2, 0, 3],
  };
}
function gcRoots(p: TraceParams): Spec {
  return {
    language: "csharp",
    lines: [
      { text: Boolean(p.root) ? "A a = root;" : "A a = null; // 根不再指向 A", key: "root" },
      { text: Boolean(p.ab) ? "a.B = b;" : "a.B = null;", key: "ab" },
      { text: Boolean(p.ba) ? "b.A = a; // 环不是根" : "b.A = null;", key: "ba" },
      { text: "GC.Collect();", reveal: true },
    ],
    eventLines: [0, 0, 1, 3],
  };
}
function gcEvents(p: TraceParams): Spec {
  return {
    language: "csharp",
    lines: [
      { text: "publisher.KeepAlive();" },
      {
        text: Boolean(p.subscribed) ? "publisher.Changed += subscriber.OnChanged;" : "publisher.Changed -= subscriber.OnChanged;",
        key: "subscribed",
      },
      {
        text: Boolean(p.local) ? "var local = subscriber; // 局部根" : "// 局部引用已离开作用域",
        key: "local",
      },
      { text: "// 订阅者是否仍被强引用", reveal: true },
    ],
    eventLines: [0, 1, 2, 3],
  };
}
function gcAlloc(p: TraceParams): Spec {
  const mode = String(p.mode ?? "boxing");
  const n = Number(p.iterations ?? 0);
  const work =
    mode === "pool"
      ? "pool.Rent(); pool.Return(item);"
      : mode === "new"
        ? "new Item();"
        : "object boxed = value;";
  return {
    language: "csharp",
    lines: [
      { text: "// 预热不计入工作负载" },
      { text: `for (int i = 0; i < ${n}; ++i) ${work}`, key: "mode" },
      { text: `// 迭代 ${n} 次`, key: "iterations" },
      { text: "// 模型分配次数见指标；真实字节用 .NET 对照", reveal: true },
    ],
    eventLines: [0, 1, 3, 3],
  };
}
function gcCollect(p: TraceParams): Spec {
  return {
    language: "csharp",
    lines: [
      { text: `// 运行时：${String(p.runtime ?? "Unity")}`, key: "runtime" },
      {
        text:
          String(p.runtime) === "Unity"
            ? `// 增量时间片大小 ${Number(p.slice ?? 1)}`
            : `GC.Collect(${Number(p.generation ?? 0)});`,
        key: String(p.runtime) === "Unity" ? "slice" : "generation",
      },
      { text: "// 这是教学切片，不是一次 Profiler 采样", reveal: true },
    ],
    eventLines: [0, 1, 1],
  };
}
function gcString(p: TraceParams): Spec {
  const mode = String(p.mode ?? "concat");
  const n = Number(p.pieces ?? 20);
  return {
    language: "csharp",
    lines: [
      {
        text:
          mode === "builder"
            ? `var sb = new StringBuilder();\nfor (int i = 0; i < ${n}; ++i) sb.Append(piece);`.replace("\n", " ")
            : `string s = ""; for (int i = 0; i < ${n}; ++i) s += piece;`,
        key: "mode",
      },
      { text: `// 片段数 ${n}`, key: "pieces" },
      {
        text: mode === "builder" ? "// 模型计 1 次缓冲分配" : "// 每次 + 都可能分配新字符串",
        reveal: true,
      },
    ],
    eventLines: [0, 2, 2],
  };
}
function locality(p: TraceParams): Spec {
  const layout = String(p.layout ?? "row");
  const size = Number(p.size ?? 16);
  return {
    language: "cpp",
    lines: [
      { text: `int m[${size}][${size}];`, key: "size" },
      {
        text:
          layout === "row"
            ? "for (i) for (j) sum += m[i][j]; // 行优先、连续"
            : "for (j) for (i) sum += m[i][j]; // 列优先、跨行",
        key: "layout",
      },
      { text: "// 触达次数是 64 字节行的教学估计", reveal: true },
    ],
    eventLines: [1, 2, 2, 2],
  };
}
function unityLife(p: TraceParams): Spec {
  const active = Boolean(p.active);
  return {
    language: "csharp",
    lines: [
      { text: `gameObject.SetActive(${active ? "true" : "false"});`, key: "active" },
      { text: "void Awake() {}  void OnEnable() {}  void Start() {}" },
      {
        text: active ? "// 激活：Awake → OnEnable → Start" : "// 失活：加载时不调用这三者",
        reveal: true,
      },
    ],
    eventLines: [0, 2, 2],
  };
}
function netPredict(p: TraceParams): Spec {
  const predict = Boolean(p.predict);
  return {
    language: "csharp",
    lines: [
      { text: `int latencyFrames = ${Number(p.latency ?? 6)};`, key: "latency" },
      {
        text: predict ? "ApplyInputLocally(); // 先显示预测" : "WaitForAuthority(); // 等权威快照",
        key: "predict",
      },
      {
        text: predict ? "// 画面落后 0 帧；错预测会在校正时回弹" : "// 画面大约落后一个延迟",
        reveal: true,
      },
    ],
    eventLines: [0, 1, 2],
  };
}
function renderLab(id: string, p: TraceParams): Spec {
  if (id === "render-atlas") {
    return {
      language: "cpp",
      lines: [
        { text: `Sprite sprites[${Number(p.sprites ?? 16)}];`, key: "sprites" },
        {
          text: Boolean(p.atlas) ? "BindTexture(atlas);" : "for (s : sprites) BindTexture(s.tex);",
          key: "atlas",
        },
        { text: "DrawSprites();", reveal: true },
      ],
      eventLines: [0, 1, 2, 2],
    };
  }
  if (id === "render-material") {
    return {
      language: "cpp",
      lines: [
        { text: `MeshRenderer objects[${Number(p.objects ?? 12)}];`, key: "objects" },
        {
          text: Boolean(p.unique) ? "each.material = new Material();" : "shared.material = oneMaterial;",
          key: "unique",
        },
        { text: "Draw();", reveal: true },
      ],
      eventLines: [0, 1, 2, 2],
    };
  }
  if (id === "render-state") {
    return {
      language: "cpp",
      lines: [
        { text: `for (obj : ${Number(p.objects ?? 1)} objects)`, key: "objects" },
        { text: `for (pass = 0; pass < ${Number(p.passes ?? 1)}; ++pass) SetPass();`, key: "passes" },
        { text: Boolean(p.sorted) ? "SortByMaterial();" : "DrawInSpawnOrder();", key: "sorted" },
        { text: "Draw();", reveal: true },
      ],
      eventLines: [0, 1, 3, 3],
    };
  }
  if (id === "render-overdraw") {
    return {
      language: "cpp",
      lines: [
        { text: `DrawTransparent(${Number(p.objects ?? 1)} quads);`, key: "objects" },
        { text: `// 分辨 ${Number(p.resolution ?? 1)}，重叠 ${Boolean(p.overlap)}`, key: "overlap" },
        { text: "// 像素着色次数看 GPU，网页只提交真实 draw", reveal: true },
      ],
      eventLines: [0, 1, 2, 2],
    };
  }
  return {
    language: "cpp",
    lines: [
      { text: `Mesh objects[${Number(p.objects ?? 24)}];`, key: "objects" },
      {
        text:
          Boolean(p.instanced) || p.mode === "instanced"
            ? "DrawInstanced(objects.length);"
            : "for (obj : objects) Draw(obj);",
        key: p.mode != null ? "mode" : "instanced",
      },
      { text: "// 等待本帧真实 WebGL2 命令计数", reveal: true },
    ],
    eventLines: [0, 1, 2, 2],
  };
}
function spatialLab(id: string, p: TraceParams): Spec {
  const method = id === "spatial-broadphase" ? String(p.method ?? "aabb") : id;
  const candidate =
    method === "brute"
      ? "if (true) candidates++; // 暴力：每对都是候选"
      : id === "spatial-grid"
        ? "InsertIntoCells(box); if (sameCell) candidates++;"
        : id === "spatial-quadtree" || id === "spatial-loose"
          ? "VisitOverlappingNodes(query); candidates++;"
          : "if (AabbOverlap(a, b)) candidates++;";
  return {
    language: "cpp",
    lines: [
      { text: candidate, key: id === "spatial-broadphase" ? "method" : id === "spatial-grid" ? "cellSize" : id === "spatial-loose" ? "looseFactor" : "capacity" },
      { text: "if (CircleOverlap(a, b)) hits++; // 精测，正确性基准" },
      { text: "// 橙线是相交，灰线是候选；不要把候选当碰撞", reveal: true },
    ],
    eventLines: [0, 1, 2],
  };
}
export function teachingTrace(
  id: string,
  params: TraceParams,
  options: {
    step?: number;
    baseline?: TraceParams;
    eventCount?: number;
    focusKey?: string;
  } = {},
): TeachingTrace {
  const p = params;
  const spec =
    id === "cpp-dispatch"
      ? dispatch(p)
      : id === "cpp-layout"
        ? layout(p)
        : id === "cpp-lifetime"
          ? lifetime(p)
          : id === "cpp-adjust"
            ? adjust(p)
            : id === "cpp-diamond"
              ? diamond(p)
              : id === "cpp-virtual-base"
                ? virtualBase(p)
                : id === "cpp-smartptr"
                  ? smartptr(p)
                  : id === "cpp-move"
                    ? moveLab(p)
                    : id === "cpp-vector"
                      ? vectorLab(p)
                      : id === "cpp-deduction"
                        ? deduction(p)
                        : id === "cpp-build"
                          ? buildLab(p)
                          : id === "cs-variance"
                            ? variance(p)
                            : id === "cs-events"
                              ? eventsLab(p)
                              : id === "gc-roots"
                                ? gcRoots(p)
                                : id === "gc-events"
                                  ? gcEvents(p)
                                  : id === "gc-alloc"
                                    ? gcAlloc(p)
                                    : id === "gc-collect"
                                      ? gcCollect(p)
                                      : id === "gc-string"
                                        ? gcString(p)
                                        : id === "mem-locality"
                                          ? locality(p)
                                          : id === "unity-lifecycle"
                                            ? unityLife(p)
                                            : id === "net-predict"
                                              ? netPredict(p)
                                              : id.startsWith("render-")
                                                ? renderLab(id, p)
                                                : id.startsWith("spatial-")
                                                  ? spatialLab(id, p)
                                                  : (() => {
                                                      throw new Error(`unimplemented lab ${id}`);
                                                    })();
  return finish(
    spec,
    p,
    options.baseline ?? {},
    options.step ?? 0,
    options.eventCount,
    options.focusKey,
  );
}
export function teachingExampleForCoach(
  id: string,
  params: TraceParams,
  phase: string,
): { caption: string; language: string; lines: string[]; changedLines: number[] } {
  const trace = teachingTrace(id, params, { baseline: {} });
  const hideReveal = phase === "predict";
  return {
    caption: trace.caption,
    language: trace.language,
    lines: trace.lines
      .filter((line) => !hideReveal || !line.reveal)
      .map((line) => line.text),
    changedLines: hideReveal
      ? trace.changedLines.filter((i) => !trace.lines[i]?.reveal)
      : trace.changedLines,
  };
}
