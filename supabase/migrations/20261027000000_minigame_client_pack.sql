-- Generic minigame client study pack. Public, insert-only; production application requires separate approval.
-- Existing questions, solutions, tags and progress are never overwritten.
do $minigame_pack$
declare
 item jsonb; category_uuid uuid; question_uuid uuid; tag_uuid uuid; tag_name text;
 pack jsonb := $question_data$[
  {
    "id": "minigame-001",
    "categoryId": "computer-networks",
    "type": "short_answer",
    "title": "TypeScript 类型断言能验证接口数据吗？",
    "question": "网络响应是 `unknown`，你写了 `const data = response as { score: number }`，实际收到 `{ \"score\": \"100\" }`。编译成功能证明运行时字段有效吗？如何处理？\n\n**来源边界：**基于公开资料的通用训练场景，不代表具体岗位或实际面试原题。",
    "answer": "### 参考回答\n类型断言主要影响编译器，不对运行时数据做验证；字符串 `\"100\"` 不因为断言变为数值。先检查对象、字段类型和有效范围，再决定拒绝、转换或错误处理；转换也要定义失败行为。\n\n### 评分点\n- 说明类型断言只影响静态检查，不做运行时验证或数值转换。\n- 检查对象与字段的实际类型，区分 null、缺失与无效数字。\n- 明确拒绝或转换策略，并说明转换失败如何处理。\n- 用有效、字符串、null 和缺字段输入分别验证。\n\n### 追问与易错点\n- 类型断言不进行运行时检查，不要将字符串视为已变成 number。\n\n### 最小验证\n输入数字 `100`、字符串 `\"100\"`、`null`、缺字段分别运行；不能只验证 TypeScript 编译通过。\n\n### 资料与适用范围\n[TypeScript 类型断言](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)。本题为通用训练场景，不代表特定面试原题。",
    "difficulty": "medium",
    "order": 3001,
    "tags": [
      "数据类型",
      "计算机网络"
    ],
    "sourceTitle": "TypeScript 官方文档：类型断言",
    "sourceUrl": "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions",
    "payload": {},
    "solution": {
      "referenceAnswerMd": "### 参考回答\n类型断言主要影响编译器，不对运行时数据做验证；字符串 `\"100\"` 不因为断言变为数值。先检查对象、字段类型和有效范围，再决定拒绝、转换或错误处理；转换也要定义失败行为。\n\n### 评分点\n- 说明类型断言只影响静态检查，不做运行时验证或数值转换。\n- 检查对象与字段的实际类型，区分 null、缺失与无效数字。\n- 明确拒绝或转换策略，并说明转换失败如何处理。\n- 用有效、字符串、null 和缺字段输入分别验证。\n\n### 追问与易错点\n- 类型断言不进行运行时检查，不要将字符串视为已变成 number。\n\n### 最小验证\n输入数字 `100`、字符串 `\"100\"`、`null`、缺字段分别运行；不能只验证 TypeScript 编译通过。\n\n### 资料与适用范围\n[TypeScript 类型断言](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)。本题为通用训练场景，不代表特定面试原题。",
      "rubricMd": "- 说明类型断言只影响静态检查，不做运行时验证或数值转换。\n- 检查对象与字段的实际类型，区分 null、缺失与无效数字。\n- 明确拒绝或转换策略，并说明转换失败如何处理。\n- 用有效、字符串、null 和缺字段输入分别验证。",
      "explanationMd": "类型断言不进行运行时检查，不要将字符串视为已变成 number。",
      "caseSensitive": false
    }
  },
  {
    "id": "minigame-002",
    "categoryId": "design-patterns",
    "type": "short_answer",
    "title": "Laya 事件解绑为什么没生效？",
    "question": "假设一个 LayaAir 3.3 面板打开时调用 `on(type, caller, handler.bind(this))`，关闭时又用新一次 `handler.bind(this)` 调用 `off`。反复开关后出现重复回调，如何定位和修复？\n\n**来源边界：**基于公开资料的通用训练场景，不代表具体岗位或实际面试原题。",
    "answer": "### 参考回答\n两次 `bind` 产生不同函数对象；先确认同一分发器、事件类型、caller 和监听引用，再保存稳定回调引用，按打开/关闭或启用/禁用寿命成对处理。需要考虑对象池复用与多次注册，不依赖销毁自动解决所有外部订阅。\n\n### 评分点\n- 指出两次 bind 创建不同回调对象。\n- 解绑时核对同一分发器、事件类型、caller 与回调引用。\n- 按打开/关闭或启用/禁用处理注册和清理。\n- 考虑重复注册及池化复用并给出可复现检查。\n\n### 追问与易错点\n- 两次 bind 是不同引用，不能假设销毁本地节点会解除外部监听。\n\n### 最小验证\n打开→关闭→打开后触发一次，期待仅当前面板收到一次；把解绑故意改回新函数，验证残留能被测试发现。应按实际使用的 LayaAir 版本核对事件接口。\n\n### 资料与适用范围\n[LayaAir 3.3 Loader 继承的事件方法](https://layaair.com/3.x/api/3.3/classes/laya_net_Loader.Loader.html)。本题为通用训练场景，不代表特定面试原题。",
    "difficulty": "medium",
    "order": 3002,
    "tags": [
      "事件系统",
      "生命周期"
    ],
    "sourceTitle": "LayaAir 3.3 事件 API",
    "sourceUrl": "https://layaair.com/3.x/api/3.3/classes/laya_net_Loader.Loader.html",
    "payload": {},
    "solution": {
      "referenceAnswerMd": "### 参考回答\n两次 `bind` 产生不同函数对象；先确认同一分发器、事件类型、caller 和监听引用，再保存稳定回调引用，按打开/关闭或启用/禁用寿命成对处理。需要考虑对象池复用与多次注册，不依赖销毁自动解决所有外部订阅。\n\n### 评分点\n- 指出两次 bind 创建不同回调对象。\n- 解绑时核对同一分发器、事件类型、caller 与回调引用。\n- 按打开/关闭或启用/禁用处理注册和清理。\n- 考虑重复注册及池化复用并给出可复现检查。\n\n### 追问与易错点\n- 两次 bind 是不同引用，不能假设销毁本地节点会解除外部监听。\n\n### 最小验证\n打开→关闭→打开后触发一次，期待仅当前面板收到一次；把解绑故意改回新函数，验证残留能被测试发现。应按实际使用的 LayaAir 版本核对事件接口。\n\n### 资料与适用范围\n[LayaAir 3.3 Loader 继承的事件方法](https://layaair.com/3.x/api/3.3/classes/laya_net_Loader.Loader.html)。本题为通用训练场景，不代表特定面试原题。",
      "rubricMd": "- 指出两次 bind 创建不同回调对象。\n- 解绑时核对同一分发器、事件类型、caller 与回调引用。\n- 按打开/关闭或启用/禁用处理注册和清理。\n- 考虑重复注册及池化复用并给出可复现检查。",
      "explanationMd": "两次 bind 是不同引用，不能假设销毁本地节点会解除外部监听。",
      "caseSensitive": false
    }
  },
  {
    "id": "minigame-003",
    "categoryId": "project-practice",
    "type": "short_answer",
    "title": "帧定时器与时间定时器",
    "question": "LayaAir 3.3 中用 `frameLoop(60, ...)` 期待每秒执行一次；设备帧率变化后为什么节奏改变？面板关闭时要清理什么？\n\n**来源边界：**基于公开资料的通用训练场景，不代表具体岗位或实际面试原题。",
    "answer": "### 参考回答\n`frameLoop` 间隔按帧，不是秒；`loop` 时间参数和 `Timer.delta` 使用毫秒。若目标是真实时间间隔，应按项目暂停/缩放需求选择对应计时方式。清理须使用正确 Timer、caller 和回调；不能以 `clearAll` 推断外部事件、Promise 或原生计时器也已清理。\n\n### 评分点\n- 区分 frameLoop 的帧数和 loop 的毫秒间隔。\n- 说明 Timer.delta 的毫秒单位及帧率变化对帧计时的影响。\n- 按正确 Timer、caller 与回调清理，区分外部事件及其他计时器。\n- 解释暂停或启用后的验证与版本边界。\n\n### 追问与易错点\n- 帧数不是秒；clearAll 不自动清理其他发布者或 Promise。\n\n### 最小验证\n以 30 与 60 帧/秒分别计算 60 帧的理想时间；暂停、再启用与重复关闭分别测试。不要把理想帧数计算当设备实测。\n\n### 资料与适用范围\n[LayaAir 3.3 Timer](https://layaair.com/3.x/api/3.3/classes/laya_utils_Timer.Timer.html)。本题为通用训练场景，不代表特定面试原题。",
    "difficulty": "medium",
    "order": 3003,
    "tags": [
      "定时器",
      "对象生命周期"
    ],
    "sourceTitle": "LayaAir 3.3 Timer API",
    "sourceUrl": "https://layaair.com/3.x/api/3.3/classes/laya_utils_Timer.Timer.html",
    "payload": {},
    "solution": {
      "referenceAnswerMd": "### 参考回答\n`frameLoop` 间隔按帧，不是秒；`loop` 时间参数和 `Timer.delta` 使用毫秒。若目标是真实时间间隔，应按项目暂停/缩放需求选择对应计时方式。清理须使用正确 Timer、caller 和回调；不能以 `clearAll` 推断外部事件、Promise 或原生计时器也已清理。\n\n### 评分点\n- 区分 frameLoop 的帧数和 loop 的毫秒间隔。\n- 说明 Timer.delta 的毫秒单位及帧率变化对帧计时的影响。\n- 按正确 Timer、caller 与回调清理，区分外部事件及其他计时器。\n- 解释暂停或启用后的验证与版本边界。\n\n### 追问与易错点\n- 帧数不是秒；clearAll 不自动清理其他发布者或 Promise。\n\n### 最小验证\n以 30 与 60 帧/秒分别计算 60 帧的理想时间；暂停、再启用与重复关闭分别测试。不要把理想帧数计算当设备实测。\n\n### 资料与适用范围\n[LayaAir 3.3 Timer](https://layaair.com/3.x/api/3.3/classes/laya_utils_Timer.Timer.html)。本题为通用训练场景，不代表特定面试原题。",
      "rubricMd": "- 区分 frameLoop 的帧数和 loop 的毫秒间隔。\n- 说明 Timer.delta 的毫秒单位及帧率变化对帧计时的影响。\n- 按正确 Timer、caller 与回调清理，区分外部事件及其他计时器。\n- 解释暂停或启用后的验证与版本边界。",
      "explanationMd": "帧数不是秒；clearAll 不自动清理其他发布者或 Promise。",
      "caseSensitive": false
    }
  },
  {
    "id": "minigame-004",
    "categoryId": "project-practice",
    "type": "short_answer",
    "title": "资源失败与过期异步回调",
    "question": "LayaAir 3.3 面板打开后发起加载 A，关闭并重开发起 B，A 最后返回。两个请求都已完成就能更新面板吗？\n\n**来源边界：**基于公开资料的通用训练场景，不代表具体岗位或实际面试原题。",
    "answer": "### 参考回答\n该版本 `Loader.load` 单项失败可以返回 `null`；Promise 完成不等于资源有效。每次展示/请求带身份或版本，返回时检查资源、面板是否仍属于当前轮次；关闭时可以按能力取消请求，但仍需防过期结果。共享资源按所有权处理，不随意销毁。\n\n### 评分点\n- 说明 3.3 的 Loader.load 失败可能返回 null。\n- 解释请求或展示身份为何能阻止旧回调更新新页面。\n- 区分取消请求与结果有效性检查，处理资源所有权。\n- 覆盖失败、关闭及 A 晚于 B 返回等场景。\n\n### 追问与易错点\n- Promise 已完成不代表资源非空；取消也不能替代身份检查。\n\n### 最小验证\n让 B 先返回、A 后返回，A 不能覆盖 B；分别测试 `null`、关闭不重开、复用后重开。此处不推断其他引擎或版本有相同失败契约。\n\n### 资料与适用范围\n[LayaAir 3.3 Loader](https://layaair.com/3.x/api/3.3/classes/laya_net_Loader.Loader.html)。本题为通用训练场景，不代表特定面试原题。",
    "difficulty": "medium",
    "order": 3004,
    "tags": [
      "资源加载",
      "生命周期"
    ],
    "sourceTitle": "LayaAir 3.3 Loader API",
    "sourceUrl": "https://layaair.com/3.x/api/3.3/classes/laya_net_Loader.Loader.html",
    "payload": {},
    "solution": {
      "referenceAnswerMd": "### 参考回答\n该版本 `Loader.load` 单项失败可以返回 `null`；Promise 完成不等于资源有效。每次展示/请求带身份或版本，返回时检查资源、面板是否仍属于当前轮次；关闭时可以按能力取消请求，但仍需防过期结果。共享资源按所有权处理，不随意销毁。\n\n### 评分点\n- 说明 3.3 的 Loader.load 失败可能返回 null。\n- 解释请求或展示身份为何能阻止旧回调更新新页面。\n- 区分取消请求与结果有效性检查，处理资源所有权。\n- 覆盖失败、关闭及 A 晚于 B 返回等场景。\n\n### 追问与易错点\n- Promise 已完成不代表资源非空；取消也不能替代身份检查。\n\n### 最小验证\n让 B 先返回、A 后返回，A 不能覆盖 B；分别测试 `null`、关闭不重开、复用后重开。此处不推断其他引擎或版本有相同失败契约。\n\n### 资料与适用范围\n[LayaAir 3.3 Loader](https://layaair.com/3.x/api/3.3/classes/laya_net_Loader.Loader.html)。本题为通用训练场景，不代表特定面试原题。",
      "rubricMd": "- 说明 3.3 的 Loader.load 失败可能返回 null。\n- 解释请求或展示身份为何能阻止旧回调更新新页面。\n- 区分取消请求与结果有效性检查，处理资源所有权。\n- 覆盖失败、关闭及 A 晚于 B 返回等场景。",
      "explanationMd": "Promise 已完成不代表资源非空；取消也不能替代身份检查。",
      "caseSensitive": false
    }
  },
  {
    "id": "minigame-005",
    "categoryId": "rendering-graphics",
    "type": "short_answer",
    "title": "zIndex、层级与合批",
    "question": "LayaAir 3.3 的 2D 界面中，同一图集的图片被其他材质元素打断。团队考虑调整 `zIndex` 减少 DrawCall，怎样判断是否有效？\n\n**来源边界：**基于公开资料的通用训练场景，不代表具体岗位或实际面试原题。",
    "answer": "### 参考回答\n合批不仅取决于图集，也取决于相邻绘制顺序、材质和其他渲染条件；`zIndex` 会影响渲染排序，合适的排序可能改善相邻相容元素的合批，但不能保证必然合批，也可能改变遮挡。先在目标版本/构建中测量，再检查实际层级、视觉效果与 CPU 成本。\n\n### 评分点\n- 说明图集、材质、顺序等会影响合批。\n- 说明 zIndex 改变渲染排序且不保证必然合批。\n- 兼顾遮挡与 UI 层级，不为批次牺牲正确画面。\n- 在目标版本与设备比较 DrawCall、帧时间和画面。\n\n### 追问与易错点\n- zIndex 调整可能改变遮挡，也不保证所有同图集节点合批。\n\n### 最小验证\n准备有重叠与不重叠的混合素材，记录变更前后 DrawCall 与截图；不能只看编辑器树排序或只看数字。\n\n### 资料与适用范围\n[LayaAir 3.3 Sprite](https://layaair.com/3.3/doc/2D/displayObject/Sprite/readme.html)。本题为通用训练场景，不代表特定面试原题。",
    "difficulty": "medium",
    "order": 3005,
    "tags": [
      "2D渲染",
      "渲染优化"
    ],
    "sourceTitle": "LayaAir 3.3 Sprite 文档",
    "sourceUrl": "https://layaair.com/3.3/doc/2D/displayObject/Sprite/readme.html",
    "payload": {},
    "solution": {
      "referenceAnswerMd": "### 参考回答\n合批不仅取决于图集，也取决于相邻绘制顺序、材质和其他渲染条件；`zIndex` 会影响渲染排序，合适的排序可能改善相邻相容元素的合批，但不能保证必然合批，也可能改变遮挡。先在目标版本/构建中测量，再检查实际层级、视觉效果与 CPU 成本。\n\n### 评分点\n- 说明图集、材质、顺序等会影响合批。\n- 说明 zIndex 改变渲染排序且不保证必然合批。\n- 兼顾遮挡与 UI 层级，不为批次牺牲正确画面。\n- 在目标版本与设备比较 DrawCall、帧时间和画面。\n\n### 追问与易错点\n- zIndex 调整可能改变遮挡，也不保证所有同图集节点合批。\n\n### 最小验证\n准备有重叠与不重叠的混合素材，记录变更前后 DrawCall 与截图；不能只看编辑器树排序或只看数字。\n\n### 资料与适用范围\n[LayaAir 3.3 Sprite](https://layaair.com/3.3/doc/2D/displayObject/Sprite/readme.html)。本题为通用训练场景，不代表特定面试原题。",
      "rubricMd": "- 说明图集、材质、顺序等会影响合批。\n- 说明 zIndex 改变渲染排序且不保证必然合批。\n- 兼顾遮挡与 UI 层级，不为批次牺牲正确画面。\n- 在目标版本与设备比较 DrawCall、帧时间和画面。",
      "explanationMd": "zIndex 调整可能改变遮挡，也不保证所有同图集节点合批。",
      "caseSensitive": false
    }
  },
  {
    "id": "minigame-006",
    "categoryId": "rendering-graphics",
    "type": "short_answer",
    "title": "重复文字与 FontClip 的取舍",
    "question": "大量数字飘字造成性能压力，团队建议把部分 `Text` 换成图片或 `FontClip`。该怎样决定？\n\n**来源边界：**基于公开资料的通用训练场景，不代表具体岗位或实际面试原题。",
    "answer": "### 参考回答\n先确认热点和设备环境，再按字符集、内容变化、国际化、清晰度、布局、内存与渲染批次比较方案。字符有限且重复时可考虑图片字；动态文本可能仍需普通文本或其他方案。不要说 FontClip 一定零分配、一定更快或只要换组件就解决卡顿。\n\n### 评分点\n- 先定位真实热点，说明图像字和动态文字的适用边界。\n- 考虑字符集、本地化、清晰度与布局。\n- 讨论内存、分配和合批取舍，不保证替换必然更快。\n- 在同条件下测量帧时间、批次和视觉结果。\n\n### 追问与易错点\n- FontClip 不是普遍零分配或必然更快，需在目标环境比较。\n\n### 最小验证\n对固定数字与多语言动态文本分别做等量场景，记录帧时间、DrawCall、内存和画面；同设备同构建对照。\n\n### 资料与适用范围\n[LayaAir Sprite 3.3 动态合批说明](https://layaair.com/3.3/doc/2D/displayObject/Sprite/readme.html)；[公开项目采访摘要](https://ask.layaair.com/d/55711-dui-hua-zhao-yun-yu-a-dou-zhu-cheng-bao-kuan-bei-hou-de-ji-zhu-shi-jian)。本题为通用训练场景，不代表特定面试原题。",
    "difficulty": "medium",
    "order": 3006,
    "tags": [
      "2D渲染",
      "性能"
    ],
    "sourceTitle": "LayaAir 3.3 Sprite 文档",
    "sourceUrl": "https://layaair.com/3.3/doc/2D/displayObject/Sprite/readme.html",
    "payload": {},
    "solution": {
      "referenceAnswerMd": "### 参考回答\n先确认热点和设备环境，再按字符集、内容变化、国际化、清晰度、布局、内存与渲染批次比较方案。字符有限且重复时可考虑图片字；动态文本可能仍需普通文本或其他方案。不要说 FontClip 一定零分配、一定更快或只要换组件就解决卡顿。\n\n### 评分点\n- 先定位真实热点，说明图像字和动态文字的适用边界。\n- 考虑字符集、本地化、清晰度与布局。\n- 讨论内存、分配和合批取舍，不保证替换必然更快。\n- 在同条件下测量帧时间、批次和视觉结果。\n\n### 追问与易错点\n- FontClip 不是普遍零分配或必然更快，需在目标环境比较。\n\n### 最小验证\n对固定数字与多语言动态文本分别做等量场景，记录帧时间、DrawCall、内存和画面；同设备同构建对照。\n\n### 资料与适用范围\n[LayaAir Sprite 3.3 动态合批说明](https://layaair.com/3.3/doc/2D/displayObject/Sprite/readme.html)；[公开项目采访摘要](https://ask.layaair.com/d/55711-dui-hua-zhao-yun-yu-a-dou-zhu-cheng-bao-kuan-bei-hou-de-ji-zhu-shi-jian)。本题为通用训练场景，不代表特定面试原题。",
      "rubricMd": "- 先定位真实热点，说明图像字和动态文字的适用边界。\n- 考虑字符集、本地化、清晰度与布局。\n- 讨论内存、分配和合批取舍，不保证替换必然更快。\n- 在同条件下测量帧时间、批次和视觉结果。",
      "explanationMd": "FontClip 不是普遍零分配或必然更快，需在目标环境比较。",
      "caseSensitive": false
    }
  },
  {
    "id": "minigame-007",
    "categoryId": "project-practice",
    "type": "short_answer",
    "title": "小游戏平台回调与奖励幂等",
    "question": "假设项目通过平台接口播放激励广告，奖励由服务端裁定；用户关闭页面后旧回调才到，或同一次完成通知重复两次，如何避免错误 UI 与重复奖励？\n\n**来源边界：**基于公开资料的通用训练场景，不代表具体岗位或实际面试原题。",
    "answer": "### 参考回答\n业务依赖抽象能力、按真实平台 SDK 契约判定结果，区分成功、失败、取消和不支持。页面实例身份/请求版本用于忽略过期 UI 回调；需要可信奖励时由服务端按操作身份做持久幂等，按钮禁用只能改善体验。应按平台版本检验有效完成与超时语义。\n\n### 评分点\n- 隔离业务和平台接口，按目标 SDK 区分成功失败取消及不支持。\n- 使用请求或页面身份防止过期回调更新新界面。\n- 说明客户端按钮限制不足以保证服务端奖励幂等。\n- 对重复通知、取消和关闭重开提出可复现验收。\n\n### 追问与易错点\n- 客户端防连点不能保证奖励只结算一次，真实 SDK 契约需确认。\n\n### 最小验证\n同请求完成通知重复两次只授奖一次；页面关闭重开后旧回调不更新新界面；失败/取消不擅自发奖。仅为通用设计练习，不声称某平台或项目已有此接口。\n\n### 资料与适用范围\n[LayaAir 小游戏发布说明](https://www.layaair.com/3.x/doc/released/minigame/)。本题为通用训练场景，不代表特定面试原题。",
    "difficulty": "hard",
    "order": 3007,
    "tags": [
      "游戏网络",
      "架构设计"
    ],
    "sourceTitle": "LayaAir 小游戏发布说明",
    "sourceUrl": "https://www.layaair.com/3.x/doc/released/minigame/",
    "payload": {},
    "solution": {
      "referenceAnswerMd": "### 参考回答\n业务依赖抽象能力、按真实平台 SDK 契约判定结果，区分成功、失败、取消和不支持。页面实例身份/请求版本用于忽略过期 UI 回调；需要可信奖励时由服务端按操作身份做持久幂等，按钮禁用只能改善体验。应按平台版本检验有效完成与超时语义。\n\n### 评分点\n- 隔离业务和平台接口，按目标 SDK 区分成功失败取消及不支持。\n- 使用请求或页面身份防止过期回调更新新界面。\n- 说明客户端按钮限制不足以保证服务端奖励幂等。\n- 对重复通知、取消和关闭重开提出可复现验收。\n\n### 追问与易错点\n- 客户端防连点不能保证奖励只结算一次，真实 SDK 契约需确认。\n\n### 最小验证\n同请求完成通知重复两次只授奖一次；页面关闭重开后旧回调不更新新界面；失败/取消不擅自发奖。仅为通用设计练习，不声称某平台或项目已有此接口。\n\n### 资料与适用范围\n[LayaAir 小游戏发布说明](https://www.layaair.com/3.x/doc/released/minigame/)。本题为通用训练场景，不代表特定面试原题。",
      "rubricMd": "- 隔离业务和平台接口，按目标 SDK 区分成功失败取消及不支持。\n- 使用请求或页面身份防止过期回调更新新界面。\n- 说明客户端按钮限制不足以保证服务端奖励幂等。\n- 对重复通知、取消和关闭重开提出可复现验收。",
      "explanationMd": "客户端防连点不能保证奖励只结算一次，真实 SDK 契约需确认。",
      "caseSensitive": false
    }
  },
  {
    "id": "minigame-008",
    "categoryId": "project-practice",
    "type": "short_answer",
    "title": "AI 写的代码如何验证真正改到目标？",
    "question": "Agent 根据需求调整一个加载流程，报告测试全绿。你怎样判断它测到的是本次代码、覆盖了真实问题，且修改没有破坏其他流程？\n\n**来源边界：**基于公开资料的通用训练场景，不代表具体岗位或实际面试原题。",
    "answer": "### 参考回答\n先写可观察验收与原失败场景，明确被测版本、入口、数据与依赖；本人审查关键差异，分别运行目标测试和必要的端到端路径；检查实际运行的是新产物，测试数量非零。对新断言在隔离副本中做负向探针，看错误行为是否能被抓到并恢复；保留失败证据和未覆盖边界。\n\n### 评分点\n- 写明原失败场景、完成条件和被测版本/入口。\n- 检查测试数量、真实执行路径与新构建，审查关键变更。\n- 在隔离环境做负向探针并恢复，证明断言能捕获目标错误。\n- 说明自动化、必要端到端和未覆盖场景各自的范围。\n\n### 追问与易错点\n- 测试全绿或 Agent 自评不代表运行了新代码或验证了真实问题。\n\n### 最小验证\n故意使行为错误后，目标检查应失败；仅把代码同自身比较、运行旧构建、过滤出零测试都不能当有效验证。不要把所有测试都交给另一个 Agent 自我证明。\n\n### 资料与适用范围\n[Microsoft .NET 测试文档](https://learn.microsoft.com/en-us/dotnet/core/testing/)。本题为通用训练场景，不代表特定面试原题。",
    "difficulty": "medium",
    "order": 3008,
    "tags": [
      "性能证据",
      "项目框架"
    ],
    "sourceTitle": ".NET 官方测试文档",
    "sourceUrl": "https://learn.microsoft.com/en-us/dotnet/core/testing/",
    "payload": {},
    "solution": {
      "referenceAnswerMd": "### 参考回答\n先写可观察验收与原失败场景，明确被测版本、入口、数据与依赖；本人审查关键差异，分别运行目标测试和必要的端到端路径；检查实际运行的是新产物，测试数量非零。对新断言在隔离副本中做负向探针，看错误行为是否能被抓到并恢复；保留失败证据和未覆盖边界。\n\n### 评分点\n- 写明原失败场景、完成条件和被测版本/入口。\n- 检查测试数量、真实执行路径与新构建，审查关键变更。\n- 在隔离环境做负向探针并恢复，证明断言能捕获目标错误。\n- 说明自动化、必要端到端和未覆盖场景各自的范围。\n\n### 追问与易错点\n- 测试全绿或 Agent 自评不代表运行了新代码或验证了真实问题。\n\n### 最小验证\n故意使行为错误后，目标检查应失败；仅把代码同自身比较、运行旧构建、过滤出零测试都不能当有效验证。不要把所有测试都交给另一个 Agent 自我证明。\n\n### 资料与适用范围\n[Microsoft .NET 测试文档](https://learn.microsoft.com/en-us/dotnet/core/testing/)。本题为通用训练场景，不代表特定面试原题。",
      "rubricMd": "- 写明原失败场景、完成条件和被测版本/入口。\n- 检查测试数量、真实执行路径与新构建，审查关键变更。\n- 在隔离环境做负向探针并恢复，证明断言能捕获目标错误。\n- 说明自动化、必要端到端和未覆盖场景各自的范围。",
      "explanationMd": "测试全绿或 Agent 自评不代表运行了新代码或验证了真实问题。",
      "caseSensitive": false
    }
  }
]$question_data$::jsonb;
begin
 for item in select value from jsonb_array_elements(pack) loop
  select id into strict category_uuid from public.categories where slug=item->>'categoryId';
  question_uuid := null;
  insert into public.questions(legacy_id,category_id,type,title,prompt_md,difficulty,payload,source_title,source_url,status,visibility,sort_order)
  values(item->>'id',category_uuid,item->>'type',item->>'title',item->>'question',item->>'difficulty',item->'payload',item->>'sourceTitle',item->>'sourceUrl','published','public',(item->>'order')::integer)
  on conflict (legacy_id) do nothing returning id into question_uuid;
  if question_uuid is null then continue; end if;
  insert into public.question_solutions(question_id,solution) values(question_uuid,item->'solution');
  for tag_name in select jsonb_array_elements_text(item->'tags') loop
   insert into public.tags(name) values(tag_name) on conflict(name) do nothing;
   select id into strict tag_uuid from public.tags where name=tag_name;
   insert into public.question_tags(question_id,tag_id) values(question_uuid,tag_uuid);
  end loop;
 end loop;
end;
$minigame_pack$;
