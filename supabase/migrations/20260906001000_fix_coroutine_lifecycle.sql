-- Correct the published legacy answer without changing the question identity,
-- attempts, notes, review state, tags, or any other solution fields.
update public.question_solutions as qs
set solution = jsonb_set(
  qs.solution,
  '{referenceAnswerMd}',
  to_jsonb($answer$
### 💡 核心总结
协程由启动它的 MonoBehaviour 和 Unity 的帧循环调度，但禁用组件与禁用宿主 GameObject 的行为并不相同。

### ⚙️ 底层机制 / 核心原理
- **机制 A**：仅设置 `MonoBehaviour.enabled = false` 不会自动停止该组件已经启动的协程。
- **机制 B**：禁用宿主 GameObject（`SetActive(false)`）或销毁宿主/组件会停止相关协程；重新激活 GameObject 不会自动续跑已经停止的协程。需要明确控制时，应在 `OnDisable` 等位置显式调用 `StopCoroutine` 或 `StopAllCoroutines`，并设计恢复方式。

### 🎮 游戏实战应用
剧情播放、延时特效和 UI 过渡经常使用协程。跨场景流程若依赖普通场景对象，场景卸载或对象销毁会中断流程；可以把明确需要跨场景存在的流程放到常驻对象上，同时仍要负责取消、退出和异常恢复，不能假定协程会自行安全结束。

### ⚠️ 高频追问 / 陷阱
- **追问**：禁用组件、禁用 GameObject、销毁对象，这三者对协程的影响是否一致？
- **陷阱**：把 `enabled = false` 与 `SetActive(false)` 混为一谈，或把协程当成独立线程。

### 最小验证
用每帧递增计数的协程分别测试 `enabled = false`、`SetActive(false)` 和 `Destroy`，记录停止与重新激活后的行为。

### 资料与适用范围
[Unity 6 StartCoroutine 官方说明](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/MonoBehaviour.StartCoroutine.html)，核验于 2026-09-06。
$answer$::text),
  true
)
from public.questions as q
where q.id = qs.question_id
  and q.legacy_id = 'q-021';
