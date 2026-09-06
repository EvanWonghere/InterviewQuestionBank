-- Additive question pack. Apply with the existing migrations using a database administrator.
-- One DO statement is atomic. Re-running skips existing legacy IDs, including their solutions/tags.
-- The reviewed pack is published with the deployment authorized on 2026-09-06.
do $quality_pack$
declare
  item jsonb;
  category_uuid uuid;
  question_uuid uuid;
  tag_uuid uuid;
  tag_name text;
  pack jsonb := $question_data$[
  {
    "id": "q-149",
    "categoryId": "unity-core",
    "title": "Canvas 三种渲染模式与 UI 空间选型",
    "question": "游戏同时有全屏菜单、受摄像机影响的HUD和角色头顶血条。请比较 Screen Space Overlay、Screen Space Camera、World Space，并给出选型理由。",
    "answer": "### 参考回答\nOverlay 将 UI 叠在场景画面上，不依赖场景相机渲染；Camera 模式使用指定相机与平面距离；World Space 把 Canvas 作为世界中的平面。菜单通常用 Overlay，需要相机参与的界面考虑 Camera，场景内标牌可用 World Space。头顶血条也可投影到屏幕 UI，选型取决于遮挡、透视、数量和交互需求。\n\n### 评分点（每项 1 分）\n- 区分三种模式的相机关系\n- 能解释世界空间与屏幕空间\n- 给出场景与取舍\n\n### 追问与易错点\nWorld Space 血条一定被墙挡住吗？不能只凭模式断言，还取决于材质深度测试与渲染配置。Screen Space UI 的 Transform 数值也不能直接当世界对象坐标用。\n\n### 最小验证\n建三个 Canvas，移动相机、改变分辨率，记录三个界面的变化；额外测试遮挡材质。\n\n### 资料与适用范围\n- [官方资料：canvas](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/class-Canvas.html)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "UI空间",
      "Canvas",
      "基础口述"
    ],
    "difficulty": "easy",
    "order": 149,
    "sourceTitle": "Unity / Android 官方文档",
    "sourceUrl": "https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/class-Canvas.html"
  },
  {
    "id": "q-150",
    "categoryId": "unity-core",
    "title": "RectTransform 的锚点、轴心与 anchoredPosition",
    "question": "父面板尺寸变化时，为什么设置了相同 anchoredPosition 的两个按钮会移动不同？解释 anchorMin/anchorMax、pivot、position 和 anchoredPosition。",
    "answer": "### 参考回答\nanchorMin/anchorMax 用父 RectTransform 中的归一化位置定义锚点；pivot 是自身矩形的归一化轴心。position 是轴心的世界位置，localPosition 相对父变换原点，anchoredPosition 相对锚点参考位置。锚点分离时参考位置与 pivot 有关；拉伸布局下 sizeDelta 是相对锚点跨度的尺寸差，不总是实际宽高。\n\n### 评分点（每项 1 分）\n- 区分父空间锚点与自身pivot\n- 区分世界/父局部/锚点参考位置\n- 说明拉伸时sizeDelta语义\n\n### 追问与易错点\n把 anchoredPosition 直接赋为屏幕像素为什么只在某个分辨率碰巧正确？还忽略了缩放和锚点参考系。\n\n### 最小验证\n一个按钮锚定左上，一个横向拉伸；改变父宽度和pivot，对照 rect.size、sizeDelta、localPosition 与 anchoredPosition。\n\n### 资料与适用范围\n- [官方资料：rect](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/RectTransform-anchoredPosition.html)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "UI空间",
      "RectTransform",
      "锚点"
    ],
    "difficulty": "medium",
    "order": 150,
    "sourceTitle": "Unity / Android 官方文档",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/RectTransform-anchoredPosition.html"
  },
  {
    "id": "q-151",
    "categoryId": "unity-core",
    "title": "屏幕点转 UI 局部坐标：相机参数与命中判定",
    "question": "拖拽 UI 时调用 ScreenPointToLocalPointInRectangle。Overlay 下 cam 应传什么？Camera/World Space 下如何选择？返回 true 是否说明点在矩形内部？",
    "answer": "### 参考回答\n该方法把屏幕点投射到目标 RectTransform 所在平面，输出目标自身的局部坐标。Overlay 传 null；其他模式使用与此次 UI 交互匹配的相机，指针按下/拖拽通常从 PointerEventData.pressEventCamera 获取。true 只代表命中平面，不代表位于矩形内，区域限制还需 rect.Contains(localPoint) 等检查。\n\n### 评分点（每项 1 分）\n- Overlay使用null\n- 选择UI事件对应相机而非固定Camera.main\n- 区分平面命中与矩形内命中\n\n### 追问与易错点\n若把目标父面板的局部点赋给 anchoredPosition，仍要处理锚点参考位置，不能无条件直接赋值。\n\n### 最小验证\n在矩形外点击并打印返回值与rect.Contains结果；用两台相机、非默认pivot重复拖拽，定位偏移来自哪个空间。\n\n### 资料与适用范围\n- [官方资料：convert](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/RectTransformUtility.ScreenPointToLocalPointInRectangle.html)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "UI空间",
      "坐标转换",
      "拖拽"
    ],
    "difficulty": "medium",
    "order": 151,
    "sourceTitle": "Unity / Android 官方文档",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/RectTransformUtility.ScreenPointToLocalPointInRectangle.html"
  },
  {
    "id": "q-152",
    "categoryId": "unity-core",
    "title": "世界坐标跟随到屏幕 UI 的血条",
    "question": "角色由场景相机渲染，血条位于 Overlay Canvas。给出从角色世界坐标到血条位置的步骤，并处理角色在相机背后的情况。",
    "answer": "### 参考回答\n先用渲染角色的场景相机 WorldToScreenPoint 得到像素点，检查返回 z（与相机的距离）并对背后目标隐藏；若需要严格可见性还要检查视口范围与裁剪面。再用 RectTransformUtility 将屏幕点转到血条父 RectTransform 的局部空间；Overlay 的第二次转换使用 null。在明确父子关系后设置局部位置，若使用 anchoredPosition 则补偿锚点参考位置。\n\n### 评分点（每项 1 分）\n- 分清场景投影相机与UI转换相机\n- 处理背后目标与屏幕边界\n- 将点转换到实际父RectTransform空间\n\n### 追问与易错点\n屏幕范围内不代表没有被墙遮挡；要另外选择射线或其他遮挡策略。多相机/分屏时不能固定使用全屏尺寸。\n\n### 最小验证\n用旋转相机让角色经过屏幕边缘和相机背后；切换宽高比、Canvas缩放和父panel pivot，验证标记始终对齐。\n\n### 资料与适用范围\n- [官方资料：world](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Camera.WorldToScreenPoint.html)\n- [官方资料：convert](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/RectTransformUtility.ScreenPointToLocalPointInRectangle.html)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "UI空间",
      "世界坐标",
      "血条"
    ],
    "difficulty": "medium",
    "order": 152,
    "sourceTitle": "Unity / Android 官方文档",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Camera.WorldToScreenPoint.html"
  },
  {
    "id": "q-153",
    "categoryId": "unity-core",
    "title": "Canvas Scaler、分辨率与安全区",
    "question": "UI 在16:9正常，在超宽屏和刘海屏被挤压或遮挡。Canvas Scaler 的参考分辨率和 Match Width Or Height 各解决什么？Safe Area 是否自动生效？",
    "answer": "### 参考回答\nScale With Screen Size 根据参考分辨率和匹配策略计算整体缩放；Match 选择宽高缩放的权衡，不替代锚点与布局。安全区是额外的屏幕可用矩形，需要将 Screen.safeArea 映射到 UI 容器。对覆盖整个屏幕的根Canvas可以按屏幕宽高归一化设置安全区容器锚点；分屏、非全屏viewport或特殊父容器必须先转换到对应空间。\n\n### 评分点（每项 1 分）\n- 区分缩放与布局职责\n- 解释宽高匹配取舍\n- 说明Safe Area需要应用且坐标有前提\n\n### 追问与易错点\n参考分辨率不意味着锁定运行分辨率。不能给所有机型写死顶部像素偏移。\n\n### 最小验证\n在16:9、超宽、竖屏各截一张图，改变模拟安全区；检查边缘按钮可见且可点击。\n\n### 资料与适用范围\n- [官方资料：scaler](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/script-CanvasScaler.html)\n- [官方资料：safe](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Screen-safeArea.html)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "UI适配",
      "CanvasScaler",
      "安全区"
    ],
    "difficulty": "medium",
    "order": 153,
    "sourceTitle": "Unity / Android 官方文档",
    "sourceUrl": "https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/script-CanvasScaler.html"
  },
  {
    "id": "q-154",
    "categoryId": "unity-core",
    "title": "UI 看得见但点不到：如何排查",
    "question": "World Space Canvas 中按钮显示正常却收不到点击。请按输入、射线、遮挡和响应给出排查顺序。",
    "answer": "### 参考回答\n先确认 EventSystem 与项目输入方案对应的输入模块正常，随后检查 GraphicRaycaster、相关事件相机与Canvas配置。再检查 Graphic.raycastTarget、CanvasGroup.blocksRaycasts/interactable，以及透明全屏Graphic是否拦截。最后检查按钮interactable、脚本监听和具体射线结果。视觉透明与不参与射线是不同属性。\n\n### 评分点（每项 1 分）\n- 沿输入到事件接收链定位\n- 检查GraphicRaycaster和相机\n- 区分透明、射线阻挡与可交互\n\n### 追问与易错点\n为什么全透明Image也可能挡住按钮？它仍可能启用raycastTarget；不要看到alpha为0就排除。\n\n### 最小验证\n调用EventSystem.RaycastAll记录命中排序；逐个禁用可疑遮挡层，保留导致问题的最小场景。\n\n### 资料与适用范围\n- [官方资料：event](https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/script-GraphicRaycaster.html)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "UI事件",
      "Raycast",
      "排错"
    ],
    "difficulty": "medium",
    "order": 154,
    "sourceTitle": "Unity / Android 官方文档",
    "sourceUrl": "https://docs.unity3d.com/Packages/com.unity.ugui@2.0/manual/script-GraphicRaycaster.html"
  },
  {
    "id": "q-155",
    "categoryId": "unity-core",
    "title": "UI 拖拽坐标排错实验",
    "question": "在含 Canvas Scaler、非中心 pivot 的父面板里实现可拖拽图标，要求按下时不跳、跨分辨率不漂移。先说明状态与验收，再写伪代码。",
    "answer": "### 参考回答\n按下时将指针转到父面板局部坐标，保存图标轴心与该局部点的偏移；拖拽时使用同一相机和同一父空间重新转换，加上偏移后设置局部位置。若改父节点、坐标系或相机，必须重新定义偏移。布局系统驱动的位置可能覆盖赋值，要明确拖拽对象是否脱离布局控制。\n\n### 评分点（每项 1 分）\n- 保存局部空间偏移避免跳变\n- 整个拖拽统一父空间与相机\n- 定义边界/布局/缩放验收\n\n### 追问与易错点\n不要把屏幕delta直接累加到anchoredPosition来假定所有Canvas模式都适用；简单除scaleFactor也不是旋转World Space的通用解。\n\n### 最小验证\n测试四角按下、父节点缩放、旋转World Space、1920×1080与窄屏；每项记录期望与实际，不要求依赖大项目。\n\n### 资料与适用范围\n- [官方资料：convert](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/RectTransformUtility.ScreenPointToLocalPointInRectangle.html)\n- [官方资料：rect](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/RectTransform-anchoredPosition.html)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "UI空间",
      "工程练习",
      "拖拽",
      "场景设计"
    ],
    "difficulty": "hard",
    "order": 155,
    "sourceTitle": "Unity / Android 官方文档",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/RectTransformUtility.ScreenPointToLocalPointInRectangle.html"
  },
  {
    "id": "q-156",
    "categoryId": "unity-core",
    "title": "Unity Windows 构建产物：为什么不能只发 exe",
    "question": "同事只拷走 Game.exe，另一台电脑无法启动。请解释 exe、UnityPlayer.dll、Game_Data、脚本后端相关产物和调试符号的角色。",
    "answer": "### 参考回答\nexe 通常提供程序入口，UnityPlayer.dll 承载Unity本机引擎代码，Game_Data保存运行所需数据。脚本与运行时部分随Mono/IL2CPP、架构和Unity版本变化；例如Windows IL2CPP常见GameAssembly.dll。调试符号用于定位崩溃，不能把它与必需运行文件混为一谈。交付应按本次构建的完整输出及依赖验证，不能从记忆中随意删文件。\n\n### 评分点（每项 1 分）\n- 区分入口、引擎、数据\n- 承认后端/平台/版本差异\n- 说明运行依赖与符号的用途\n\n### 追问与易错点\nGameAssembly.dll与UnityPlayer.dll职责是否一样？不一样；前者通常与生成的脚本本机代码/IL2CPP有关，后者是引擎。旧版文件清单不能当Unity 6所有配置的保证。\n\n### 最小验证\n构建后保存目录树、版本/平台/后端，复制完整目录到干净目录启动；在副本中去掉一个依赖观察日志，测试后恢复。\n\n### 资料与适用范围\n- [官方资料：windows](https://docs.unity3d.com/cn/2021.3/Manual/WindowsStandaloneBinaries.html)\n- [官方资料：il2cpp](https://docs.unity3d.com/6000.0/Documentation/Manual/scripting-backends-il2cpp.html)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "打包产物",
      "Windows",
      "发布"
    ],
    "difficulty": "easy",
    "order": 156,
    "sourceTitle": "Unity / Android 官方文档",
    "sourceUrl": "https://docs.unity3d.com/cn/2021.3/Manual/WindowsStandaloneBinaries.html"
  },
  {
    "id": "q-157",
    "categoryId": "unity-core",
    "title": "C# 到 IL2CPP Player 的编译链",
    "question": "从Unity项目里的C#脚本到IL2CPP可执行程序，中间经历什么？为什么IL2CPP不能简单理解成把.cs直接改名为.cpp？",
    "answer": "### 参考回答\nC#先编译为托管程序集与IL；构建过程中按配置进行托管代码裁剪，IL2CPP将IL转换为C++，再由目标平台本机工具链编译链接，最后与引擎和数据组成Player。资源导入/打包是另外一部分。生成了本机代码不代表不再存在托管对象生命周期或GC。\n\n### 评分点（每项 1 分）\n- 说清C#→IL→C++→本机代码\n- 区分代码链与资源打包\n- 知道IL2CPP仍有托管内存管理\n\n### 追问与易错点\nIL2CPP一定更快或更小吗？不能保证，要根据构建配置、代码路径和设备测量；它也不让运行时动态生成代码天然可行。\n\n### 最小验证\n比较同场景可用后端的构建时间、产物与运行行为；记录Unity版本、架构与裁剪等级，不跨配置直接下结论。\n\n### 资料与适用范围\n- [官方资料：il2cpp](https://docs.unity3d.com/6000.0/Documentation/Manual/scripting-backends-il2cpp.html)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "打包产物",
      "IL2CPP",
      "AOT"
    ],
    "difficulty": "medium",
    "order": 157,
    "sourceTitle": "Unity / Android 官方文档",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/Manual/scripting-backends-il2cpp.html"
  },
  {
    "id": "q-158",
    "categoryId": "unity-core",
    "title": "APK、AAB 与导出 Gradle 项目",
    "question": "Unity Android构建可以得到APK、AAB或Gradle项目，它们分别用来做什么？AAB可以像APK一样直接安装吗？",
    "answer": "### 参考回答\nAPK是可安装的软件包；AAB是发布格式，包含生成设备所需APK的代码与资源，商店或bundletool可据此生成适配设备的APK。Gradle项目是导出的Android工程，需要继续构建和签名才得到交付包。签名、ABI、资源分包等都会影响具体产物。不能把AAB文件直接当APK安装。\n\n### 评分点（每项 1 分）\n- 区分安装包、发布包和工程\n- 说明AAB生成设备APK的流程\n- 提及签名与ABI并避免混淆\n\n### 追问与易错点\n把扩展名.aab改成.apk为什么没用？内容结构与交付流程不同。安装下载体积与磁盘上AAB大小也不等价。\n\n### 最小验证\n分别导出Gradle工程与APK/AAB，记录各自后续步骤；只在自己的测试设备或测试渠道验证安装。\n\n### 资料与适用范围\n- [官方资料：android](https://docs.unity3d.com/6000.0/Documentation/Manual/android-BuildProcess.html)\n- [官方资料：aab](https://developer.android.com/guide/app-bundle)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "打包产物",
      "Android",
      "APK",
      "AAB"
    ],
    "difficulty": "easy",
    "order": 158,
    "sourceTitle": "Unity / Android 官方文档",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/Manual/android-BuildProcess.html"
  },
  {
    "id": "q-159",
    "categoryId": "unity-core",
    "title": "Editor 正常，IL2CPP 构建反射失败",
    "question": "某配置通过字符串类型名反射实例化，在Editor正常，IL2CPP包里找不到类型或方法。你如何区分代码裁剪、AOT限制与资源缺失？",
    "answer": "### 参考回答\n先用同一输入在目标Player保留完整错误与堆栈，判断缺的是托管类型/成员、泛型实例代码还是资源。静态分析未识别的反射引用可能被裁剪，按需使用Preserve或link.xml保留；AOT泛型实例等限制需要显式引用或调整设计。资源路径/大小写/内容构建失败是另一条排查线。不要一开始就把全部程序集永久保留。\n\n### 评分点（每项 1 分）\n- 从异常与日志定位缺失对象\n- 区分裁剪与AOT代码生成\n- 给最小保留或设计修正并复测\n\n### 追问与易错点\n降低裁剪等级让问题消失只能提供线索，不能证明所有AOT问题都能靠link.xml解决。\n\n### 最小验证\n建立只含反射路径的最小例子，对照裁剪设置；加入最小保留后构建目标平台，检查功能与包体变化。\n\n### 资料与适用范围\n- [官方资料：strip](https://docs.unity3d.com/6000.0/Documentation/Manual/managed-code-stripping.html)\n- [官方资料：il2cpp](https://docs.unity3d.com/6000.0/Documentation/Manual/scripting-backends-il2cpp.html)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "构建排错",
      "反射",
      "裁剪"
    ],
    "difficulty": "medium",
    "order": 159,
    "sourceTitle": "Unity / Android 官方文档",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/Manual/managed-code-stripping.html"
  },
  {
    "id": "q-160",
    "categoryId": "unity-core",
    "title": "Player、资源包与存档目录的边界",
    "question": "Unity Player、AssetBundle/Addressables内容、StreamingAssets、persistentDataPath分别是什么？更新资源是否就能更新任意C#逻辑？",
    "answer": "### 参考回答\nPlayer包含运行程序、引擎及本次构建内容；AssetBundle是可加载的资源容器，Addressables提供寻址、依赖与内容管理流程。StreamingAssets用于随包保留特定文件，读取方式因平台而异，不能统一假设为可写普通目录。persistentDataPath用于运行期持久数据，具体位置随平台而变。资源更新不会天然替换AOT本机代码；代码更新必须另有明确方案与平台条件。\n\n### 评分点（每项 1 分）\n- 区分程序、资源与用户数据\n- 说明StreamingAssets的平台差异\n- 不把资源更新等同代码更新\n\n### 追问与易错点\nAndroid StreamingAssets可能位于压缩包内；把存档写进它为什么不可靠？应使用适当的持久数据位置。\n\n### 最小验证\n画出构建时和运行时的文件流，记录一个配置、一个纹理与一个存档分别由谁生成、加载和更新。\n\n### 资料与适用范围\n- [官方资料：stream](https://docs.unity3d.com/6000.0/Documentation/Manual/StreamingAssets.html)\n- [官方资料：il2cpp](https://docs.unity3d.com/6000.0/Documentation/Manual/scripting-backends-il2cpp.html)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "打包产物",
      "资源管理",
      "存档"
    ],
    "difficulty": "medium",
    "order": 160,
    "sourceTitle": "Unity / Android 官方文档",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/Manual/StreamingAssets.html"
  },
  {
    "id": "q-161",
    "categoryId": "unity-core",
    "title": "构建包体突然增大：如何用证据定位",
    "question": "同一平台的新版本包体增加200MB。你会先检查什么，如何证明优化没有删除必需内容？",
    "answer": "### 参考回答\n先固定平台、架构、压缩、开发构建与符号设置，确认比较的是同一种体积口径。用BuildReport等构建信息比较资源类型和文件贡献，再查纹理/音频导入、重复资源依赖与额外ABI等差异。只修改一个已定位因素，重新构建并运行场景、动态加载和资源缺失验收，保留前后报告。\n\n### 评分点（每项 1 分）\n- 统一比较口径\n- 按报告定位最大贡献\n- 单项修改并验证资源完整性\n\n### 追问与易错点\n不能用包体下降推断运行内存同比下降；压缩体积、安装体积和解压后运行内存是不同指标。\n\n### 最小验证\n保存两个版本构建报告与目录体积表，选最大差异项解释来源；没有实际数据时只能写排查计划，不能编造优化百分比。\n\n### 资料与适用范围\n- [官方资料：build](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Build.Reporting.BuildReport.html)\n- [官方资料：android](https://docs.unity3d.com/6000.0/Documentation/Manual/android-BuildProcess.html)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "构建排错",
      "性能证据",
      "包体"
    ],
    "difficulty": "medium",
    "order": 161,
    "sourceTitle": "Unity / Android 官方文档",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Build.Reporting.BuildReport.html"
  },
  {
    "id": "q-162",
    "categoryId": "os-fundamentals",
    "title": "操作系统的作用：游戏为什么需要它",
    "question": "不要只列进程、内存、文件系统名词。请用“启动一个游戏、同时播放声音并保存进度”解释操作系统解决了什么问题。",
    "answer": "### 参考回答\n操作系统为程序提供可用的抽象并管理共享硬件：进程/线程获得CPU执行机会，虚拟地址空间支持内存管理与隔离，文件和设备接口支持持久数据与I/O，权限与保护机制限制相互干扰。游戏通过库和系统接口请求服务；引擎负责场景、物理等领域能力，不替代OS的通用资源管理。\n\n### 评分点（每项 1 分）\n- 说出抽象、资源管理和保护\n- 把CPU/内存/I/O对应到游戏行为\n- 区分OS与游戏引擎职责\n\n### 追问与易错点\n没有桌面界面就没有OS吗？不是，GUI不是定义。无OS程序也能在裸机运行，但必须自行承担所需硬件管理，不能说任何程序都绝对需要完整OS。\n\n### 最小验证\n用任务管理器或活动监视器观察自己的游戏进程、线程、内存和文件I/O，把每项现象对应到一个OS职责。\n\n### 资料与适用范围\n- [官方资料：os](https://pages.cs.wisc.edu/~remzi/OSTEP/intro.pdf)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "操作系统作用",
      "基础口述",
      "资源管理"
    ],
    "difficulty": "easy",
    "order": 162,
    "sourceTitle": "OSTEP 教材",
    "sourceUrl": "https://pages.cs.wisc.edu/~remzi/OSTEP/intro.pdf"
  },
  {
    "id": "q-163",
    "categoryId": "os-fundamentals",
    "title": "系统调用、用户态与内核态",
    "question": "游戏保存文件时，普通函数调用与系统调用有什么区别？为什么应用不能任意修改设备或别的进程内存？",
    "answer": "### 参考回答\n普通函数调用通常在当前权限级执行；系统调用通过受控入口请求内核服务，内核检查权限和参数并访问受保护资源。库函数可能包装、缓存或合并这些请求，不一定每次调用都进入内核。用户/内核权限划分配合地址空间保护，减少程序破坏系统和其他进程的机会。\n\n### 评分点（每项 1 分）\n- 说明受控服务入口与检查\n- 区分库函数和系统调用\n- 关联权限和隔离\n\n### 追问与易错点\n一次系统调用一定切换到另一个进程吗？不一定。权限模式切换与调度到另一个线程/进程是不同概念。\n\n### 最小验证\n画出“游戏保存API→运行库→OS文件接口→文件系统/设备”的路径；记录哪些步骤可能被缓冲，不把逻辑路径当每次固定执行序列。\n\n### 资料与适用范围\n- [官方资料：syscall](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf)\n- [官方资料：io](https://pages.cs.wisc.edu/~remzi/OSTEP/file-intro.pdf)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "系统调用",
      "用户态",
      "内核态"
    ],
    "difficulty": "medium",
    "order": 163,
    "sourceTitle": "OSTEP 教材",
    "sourceUrl": "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf"
  },
  {
    "id": "q-164",
    "categoryId": "os-fundamentals",
    "title": "从双击游戏到首帧：OS 与 Unity 的分工",
    "question": "从双击桌面游戏到显示首帧，操作系统和Unity分别做了哪些事？说明这是一条概念流程，不要求背所有平台的固定顺序。",
    "answer": "### 参考回答\n概念上OS处理启动请求、建立进程与地址空间、装载所需可执行映像和依赖，并调度初始执行；程序入口继续初始化运行时和引擎，创建窗口/图形上下文、加载配置与首场景，进入游戏循环并提交渲染工作。具体先后、动态库装载和初始化细节依平台后端变化。首帧慢可能来自文件I/O、解压、资源初始化等，需要分段测量。\n\n### 评分点（每项 1 分）\n- 划分OS装载与引擎初始化\n- 说明进程/内存/调度的角色\n- 不把概念流程当固定平台实现\n\n### 追问与易错点\n“exe已经启动”不代表首场景已加载；操作系统也不会替Unity执行所有Awake和Start语义。\n\n### 最小验证\n用启动日志给入口后可观察阶段加时间戳；分别记录场景加载与首帧，不把无法观察的OS阶段编造为测量数据。\n\n### 资料与适用范围\n- [官方资料：process](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf)\n- [官方资料：windows](https://docs.unity3d.com/cn/2021.3/Manual/WindowsStandaloneBinaries.html)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "操作系统作用",
      "启动流程",
      "项目口述"
    ],
    "difficulty": "medium",
    "order": 164,
    "sourceTitle": "OSTEP 教材",
    "sourceUrl": "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf"
  },
  {
    "id": "q-165",
    "categoryId": "os-fundamentals",
    "title": "主线程阻塞与 CPU 忙：卡顿如何区分",
    "question": "游戏卡住时CPU占用不高，能否排除性能问题？对比主线程计算过重、同步读盘、等待锁和等待GPU。",
    "answer": "### 参考回答\n低总CPU占用不代表关键线程没有延迟：它可能阻塞于I/O、锁或GPU同步；也可能单核繁忙而总体平均不高。先看主线程时间线与等待位置，再关联工作线程、文件I/O和GPU时间。OS调度决定线程何时获得CPU，但不能把所有等待都归因于操作系统调度。\n\n### 评分点（每项 1 分）\n- 区分运行与等待\n- 不使用总CPU均值排除单线程瓶颈\n- 根据时间线和等待链定位\n\n### 追问与易错点\n把同步调用放后台就一定修好吗？若主线程立即Wait/Join，仍会等待；若在后台调用不允许的Unity API还会引入正确性问题。\n\n### 最小验证\n在独立练习程序分别加入忙循环、sleep和锁竞争，比较线程状态与CPU；实际项目需Profiler证据后才采取优化。\n\n### 资料与适用范围\n- [官方资料：os](https://pages.cs.wisc.edu/~remzi/OSTEP/intro.pdf)\n- [官方资料：syscall](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "线程调度",
      "阻塞",
      "性能排错"
    ],
    "difficulty": "medium",
    "order": 165,
    "sourceTitle": "OSTEP 教材",
    "sourceUrl": "https://pages.cs.wisc.edu/~remzi/OSTEP/intro.pdf"
  },
  {
    "id": "q-166",
    "categoryId": "os-fundamentals",
    "title": "保存成功与持久化：断电后数据一定还在吗",
    "question": "写存档函数返回成功后立刻断电，为什么仍可能丢失数据？操作系统在文件缓存和持久化中扮演什么角色？",
    "answer": "### 参考回答\n数据可能先进入运行库或OS缓存，返回成功不必然意味着已写到持久介质。可靠存档需明确写入、刷新、替换与恢复策略；临时文件写完整并校验后再替换主文件，可以降低留下半份文件的风险，但原子可见性与断电持久性不是同一保证，具体依文件系统与平台API。备份和启动校验用于恢复，不代表绝对不会丢。\n\n### 评分点（每项 1 分）\n- 区分缓存与持久介质\n- 区分原子替换和断电持久性\n- 给出校验/备份/恢复思路\n\n### 追问与易错点\nJSON序列化成功只证明生成了数据，不证明可靠落盘；不能承诺一次普通Flush在所有平台都防断电。\n\n### 最小验证\n在写入、替换前后注入进程退出，验证旧档/新档/备份恢复；明确进程终止测试不能完全模拟断电。\n\n### 资料与适用范围\n- [官方资料：io](https://pages.cs.wisc.edu/~remzi/OSTEP/file-intro.pdf)\n\n核验于 2026-09-06。Unity 题以 Unity 6 / uGUI 为主；旧版资料只支撑稳定概念，平台文件布局以实际版本、后端和构建报告为准。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "操作系统作用",
      "文件系统",
      "存档恢复"
    ],
    "difficulty": "medium",
    "order": 166,
    "sourceTitle": "OSTEP 教材",
    "sourceUrl": "https://pages.cs.wisc.edu/~remzi/OSTEP/file-intro.pdf"
  },
  {
    "id": "q-167",
    "categoryId": "unity-core",
    "title": "PlayerLoop 如何驱动游戏一帧",
    "question": "不背生命周期表：Unity如何组织一帧中的脚本、物理、动画与渲染相关工作？为什么给脚本设置执行顺序不能替代全部引擎阶段管理？",
    "answer": "### 参考回答\nPlayerLoop是引擎更新系统的阶段结构，MonoBehaviour回调只是其中部分工作。固定步长更新与帧更新有不同节奏，其他子系统在各自阶段推进。Script Execution Order用于指定脚本事件函数的相对次序，不是任意重排所有引擎子系统。扩展PlayerLoop应保留已有必要系统，并处理重复注册与退出恢复；具体阶段以当前版本的循环结构和Profiler为准。\n\n### 评分点（每项 1 分）\n- 理解回调是循环的一部分\n- 区分固定步与帧更新\n- 说明脚本顺序的边界和定制风险\n\n### 追问与易错点\n为什么一个自定义PlayerLoop只留下自己的Update会让游戏异常？你可能删掉了引擎必需阶段。不要假定所有组件实例的回调次序都被固定。\n\n### 最小验证\n打印GetCurrentPlayerLoop返回的阶段树，在Update/LateUpdate加ProfilerMarker对照时间线；实验后恢复原循环。\n\n### 资料与适用范围\n- [官方资料：loop](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/LowLevel.PlayerLoop.html)\n\n核验于 2026-09-06。Unity机制以Unity 6为主，Addressables引用的1.21文档仅用于说明基本生命周期，物理题参考PhysX 5.4.1的3D机制；自研Transform题是设计练习，不代表Unity内部实现。最小验证尚需学习者实际执行。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "引擎原理",
      "PlayerLoop",
      "帧循环"
    ],
    "difficulty": "medium",
    "order": 167,
    "sourceTitle": "Unity 官方文档 / PhysX（具体见答案）",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/LowLevel.PlayerLoop.html"
  },
  {
    "id": "q-168",
    "categoryId": "unity-core",
    "title": "固定时间步为什么仍会卡顿，为什么不等于确定性",
    "question": "渲染掉到20FPS时，FixedUpdate为何可能一帧调用多次？固定dt能否保证两台机器的物理结果逐位一致？",
    "answer": "### 参考回答\n固定更新按模拟时间间隔推进，而不是每个渲染帧恰好一次；渲染变慢时可能补多个固定步，也有帧不需要固定步。大量补步又会加重CPU负担，因此要关注步长、最大允许时间与负载。固定dt使积分步长更一致，但跨平台浮点、执行顺序、物理实现等仍可能不同，不能单凭FixedUpdate宣称确定性。\n\n### 评分点（每项 1 分）\n- 解释一帧零次或多次固定步\n- 说明补步与负载反馈\n- 区分固定步和跨平台确定性\n\n### 追问与易错点\nRigidbody插值主要改善显示平滑度，并不会增加物理解算精度或保证联网确定性。输入采集频率也不应简单等同物理步频率。\n\n### 最小验证\n记录每帧FixedUpdate次数，在不同渲染上限下比较；再讨论同输入回放如何校验状态哈希，未测多平台就不宣称一致。\n\n### 资料与适用范围\n- [官方资料：fixed](https://docs.unity3d.com/6000.0/Documentation/Manual/fixed-updates.html)\n\n核验于 2026-09-06。Unity机制以Unity 6为主，Addressables引用的1.21文档仅用于说明基本生命周期，物理题参考PhysX 5.4.1的3D机制；自研Transform题是设计练习，不代表Unity内部实现。最小验证尚需学习者实际执行。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "引擎原理",
      "时间步",
      "物理"
    ],
    "difficulty": "hard",
    "order": 168,
    "sourceTitle": "Unity 官方文档 / PhysX（具体见答案）",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/Manual/fixed-updates.html"
  },
  {
    "id": "q-169",
    "categoryId": "unity-core",
    "title": "Unity 对象为何出现“假 null”",
    "question": "Destroy一个GameObject并等到销毁完成后，为什么 obj == null 与 ReferenceEquals(obj, null) 可能结果不同？C# GC和Destroy分别处理什么？",
    "answer": "### 参考回答\nUnityEngine.Object存在托管对象与对应本机对象的关系。本机对象销毁后，托管引用可能仍存在；Unity重载的==还检查本机对象状态，而ReferenceEquals只比较托管引用。因此“Unity判空为真”不代表托管引用已经清空。Destroy处理引擎对象销毁，GC负责不可达托管对象回收，两者不是一个动作。\n\n### 评分点（每项 1 分）\n- 区分托管引用与本机对象\n- 解释重载==与ReferenceEquals差异\n- 区分Destroy和GC\n\n### 追问与易错点\n?.与??不调用Unity重载的==，不能把它们无条件当作Unity对象存活检查。普通C#类也不能套用这套判空语义。\n\n### 最小验证\n保留GameObject引用，Destroy后等待下一帧，再输出两种比较；分别观察访问Unity属性与普通托管字段，不用DestroyImmediate替代运行时流程。\n\n### 资料与适用范围\n- [官方资料：object](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Object-operator_eq.html)\n\n核验于 2026-09-06。Unity机制以Unity 6为主，Addressables引用的1.21文档仅用于说明基本生命周期，物理题参考PhysX 5.4.1的3D机制；自研Transform题是设计练习，不代表Unity内部实现。最小验证尚需学习者实际执行。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "引擎原理",
      "对象生命周期",
      "托管与原生"
    ],
    "difficulty": "medium",
    "order": 169,
    "sourceTitle": "Unity 官方文档 / PhysX（具体见答案）",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Object-operator_eq.html"
  },
  {
    "id": "q-170",
    "categoryId": "unity-core",
    "title": "Unity 资源引用为何依赖 GUID 与 fileID",
    "question": "同一张图从Assets/A移动到Assets/B后引用通常还在，但丢掉.meta重导入后可能断。GUID和local fileID各表示什么？",
    "answer": "### 参考回答\nUnity编辑器为资源维护GUID，.meta保存相关标识与导入设置；资源文件内部还可能有多个对象，用local fileID区分。序列化资源引用常通过GUID与本地标识定位，保留.meta的移动可以保持身份，丢失后重新生成GUID会破坏旧引用。运行期InstanceID是另一种身份，不应该被当作跨会话持久存档键。\n\n### 评分点（每项 1 分）\n- 区分资源文件身份与子对象身份\n- 解释保留meta的重要性\n- 区分编辑器引用与运行期ID\n\n### 追问与易错点\n只重命名文件不总是安全，关键是是否同步维护meta及引用；不能用绝对磁盘路径代替所有资源身份。\n\n### 最小验证\n在独立样例中引用一张Sprite，用AssetDatabase.TryGetGUIDAndLocalFileIdentifier打印标识，移动时保留meta并比较；破坏实验只在副本进行。\n\n### 资料与适用范围\n- [官方资料：guid](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/AssetDatabase.TryGetGUIDAndLocalFileIdentifier.html)\n\n核验于 2026-09-06。Unity机制以Unity 6为主，Addressables引用的1.21文档仅用于说明基本生命周期，物理题参考PhysX 5.4.1的3D机制；自研Transform题是设计练习，不代表Unity内部实现。最小验证尚需学习者实际执行。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "引擎原理",
      "资源管线",
      "GUID"
    ],
    "difficulty": "medium",
    "order": 170,
    "sourceTitle": "Unity 官方文档 / PhysX（具体见答案）",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/AssetDatabase.TryGetGUIDAndLocalFileIdentifier.html"
  },
  {
    "id": "q-171",
    "categoryId": "unity-core",
    "title": "序列化中的共享引用为什么可能变成两份对象",
    "question": "两个字段指向同一个普通Serializable类实例。Unity默认内联序列化并重新加载后，还能假设它们ReferenceEquals为真吗？SerializeReference解决什么，又不解决什么？",
    "answer": "### 参考回答\n普通可序列化类默认按字段内容内联保存，重建后两个字段可能各自得到副本，共享身份不被保留。SerializeReference以宿主内的托管引用记录支持共享引用、null、多态和图结构。其引用身份属于宿主序列化范围，不是跨所有资产的全局共享机制；跨宿主共享配置通常考虑UnityEngine.Object资产引用，例如ScriptableObject。\n\n### 评分点（每项 1 分）\n- 区分按值内联与托管引用\n- 理解共享/多态/环的需求\n- 说明宿主范围与资产引用的区别\n\n### 追问与易错点\n只加Serializable并不等于完整保存对象图；Inspector看到相同字段值也不证明引用相同。\n\n### 最小验证\n分别用普通字段与SerializeReference保存两个指向同实例的字段，保存重载后比较ReferenceEquals和修改传播；再测试两个宿主。\n\n### 资料与适用范围\n- [官方资料：serial](https://docs.unity3d.com/6000.0/Documentation/Manual/script-serialization-rules.html)\n\n核验于 2026-09-06。Unity机制以Unity 6为主，Addressables引用的1.21文档仅用于说明基本生命周期，物理题参考PhysX 5.4.1的3D机制；自研Transform题是设计练习，不代表Unity内部实现。最小验证尚需学习者实际执行。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "引擎原理",
      "序列化",
      "对象图"
    ],
    "difficulty": "hard",
    "order": 171,
    "sourceTitle": "Unity 官方文档 / PhysX（具体见答案）",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/Manual/script-serialization-rules.html"
  },
  {
    "id": "q-172",
    "categoryId": "unity-core",
    "title": "场景加载停在 0.9：激活门与异步队列",
    "question": "LoadSceneAsync后设置allowSceneActivation=false，代码一直等isDone再允许激活，为什么无法结束？此时启动UnloadSceneAsync可能发生什么？",
    "answer": "### 参考回答\n关闭激活时场景加载进度可停在0.9，isDone保持false；若必须先等isDone才开门就形成逻辑等待环。应该在准备阶段就绪且业务条件满足时允许激活，再等待完成。Unity文档还说明被延迟的场景激活会阻塞相关AsyncOperation队列，因此不能假设后发卸载操作会独立完成。\n\n### 评分点（每项 1 分）\n- 解释0.9与isDone的含义\n- 识别等待环并给出激活顺序\n- 说明后续异步场景操作的队列影响\n\n### 追问与易错点\nprogress/0.9可以用作准备阶段展示，但不是精确剩余时间；不能把所有异步API都推断为同一调度队列。\n\n### 最小验证\n在两个最小场景记录progress/isDone与激活按钮，尝试激活前发起卸载并观察顺序；修正后验证连续切换。\n\n### 资料与适用范围\n- [官方资料：activation](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/AsyncOperation-allowSceneActivation.html)\n\n核验于 2026-09-06。Unity机制以Unity 6为主，Addressables引用的1.21文档仅用于说明基本生命周期，物理题参考PhysX 5.4.1的3D机制；自研Transform题是设计练习，不代表Unity内部实现。最小验证尚需学习者实际执行。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "引擎原理",
      "场景加载",
      "异步状态机"
    ],
    "difficulty": "medium",
    "order": 172,
    "sourceTitle": "Unity 官方文档 / PhysX（具体见答案）",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/AsyncOperation-allowSceneActivation.html"
  },
  {
    "id": "q-173",
    "categoryId": "unity-core",
    "title": "Addressables 释放后内存为何没有立刻下降",
    "question": "两个资源共享同一个Bundle，释放其中一个handle后内存没明显减少，是泄漏吗？再讨论手动Instantiate一个已加载Prefab后能否立即释放加载句柄。",
    "answer": "### 参考回答\nAddressables引用计数用于追踪加载与释放，不等于每个对象立即对应一次物理内存回收；同Bundle其他资源或依赖仍被使用时，Bundle可能继续驻留，分配器也未必立刻向OS归还内存。Object.Instantiate产生的克隆不会自动为Addressables加载操作增加独立引用，应保持依赖存活直到所有使用者结束，或使用配套实例化/释放接口并明确所有权。\n\n### 评分点（每项 1 分）\n- 区分引用计数与实际内存驻留\n- 沿共享Bundle/依赖定位\n- 说明手动克隆不自动增加Addressables引用\n\n### 追问与易错点\n复制handle结构体也不代表获得新的拥有权。只调用GC.Collect不会替代Addressables.Release；反复释放再立即重载还可能产生抖动。\n\n### 最小验证\n构造同Bundle两资源，分别加载/释放并看Profiler依赖；再保留Prefab克隆观察正确的句柄持有期。说明测试采用的Addressables包版本。\n\n### 资料与适用范围\n- [官方资料：address](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/MemoryManagement.html)\n\n核验于 2026-09-06。Unity机制以Unity 6为主，Addressables引用的1.21文档仅用于说明基本生命周期，物理题参考PhysX 5.4.1的3D机制；自研Transform题是设计练习，不代表Unity内部实现。最小验证尚需学习者实际执行。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "引擎原理",
      "资源依赖",
      "引用计数"
    ],
    "difficulty": "medium",
    "order": 173,
    "sourceTitle": "Unity 官方文档 / PhysX（具体见答案）",
    "sourceUrl": "https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/MemoryManagement.html"
  },
  {
    "id": "q-174",
    "categoryId": "unity-core",
    "title": "SRP Batcher 为什么不一定减少 Draw Call",
    "question": "开启SRP Batcher后Draw Call数量基本没变，但CPU渲染耗时下降，是否说明它无效？它和GPU Instancing解决的是同一个问题吗？",
    "answer": "### 参考回答\nSRP Batcher主要降低兼容Shader绘制间的CPU状态准备开销，不要求把所有对象合成一个Draw Call。GPU Instancing则允许满足条件的实例通过实例化绘制提交。两者关注的成本与约束不同，应对照Shader兼容性、材质/变体、实际提交与CPU时间判断，不能仅凭Draw Call计数评估所有优化。\n\n### 评分点（每项 1 分）\n- 说明SRP Batcher优化CPU准备成本\n- 区分Instancing的实例化提交\n- 给出基于时间而非单一计数的验证\n\n### 追问与易错点\n材质数量减少不自动证明GPU更快；过度绘制、像素Shader和带宽瓶颈仍可能主导。具体兼容条件以管线版本为准。\n\n### 最小验证\n在同场景切换SRP Batcher，查看Frame Debugger中batch原因及CPU渲染耗时，再独立测试Instancing，不同时改变多个开关。\n\n### 资料与适用范围\n- [官方资料：srp](https://docs.unity3d.com/6000.0/Documentation/Manual/SRPBatcher.html)\n\n核验于 2026-09-06。Unity机制以Unity 6为主，Addressables引用的1.21文档仅用于说明基本生命周期，物理题参考PhysX 5.4.1的3D机制；自研Transform题是设计练习，不代表Unity内部实现。最小验证尚需学习者实际执行。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "引擎原理",
      "渲染提交",
      "SRPBatcher"
    ],
    "difficulty": "medium",
    "order": 174,
    "sourceTitle": "Unity 官方文档 / PhysX（具体见答案）",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/Manual/SRPBatcher.html"
  },
  {
    "id": "q-175",
    "categoryId": "unity-core",
    "title": "设计 Transform 层级的缓存失效机制",
    "question": "如果自己实现一个小引擎，父节点变化后如何更新子节点worldMatrix？比较每次递归重算、立即更新全部后代、dirty/version按需更新。",
    "answer": "### 参考回答\n列向量约定下world=parentWorld×local。每次查询递归计算简单但重复工作多；修改时立即传播让读快，却可能在同帧多次修改时反复算；dirty标记或父版本比较可延迟到需要时重算。必须覆盖本地变化、父变化、重设父级、根节点与循环检测。这里是自研方案比较，不宣称Unity内部一定使用某一种结构。\n\n### 评分点（每项 1 分）\n- 明确矩阵约定及组合顺序\n- 比较写入传播与读取计算成本\n- 覆盖reparent与循环等失效边界\n\n### 追问与易错点\n只改父矩阵却未让子缓存失效会产生旧位置；重设父级要先决定保持世界变换还是局部变换。非均匀缩放下旋转/分解还有额外边界。\n\n### 最小验证\n做三层树，父节点连续改十次后查询叶节点，统计重算次数；与无缓存结果比较，再测试reparent及非法成环。\n\n### 资料与适用范围\n- [官方资料：matrix](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Transform-localToWorldMatrix.html)\n\n核验于 2026-09-06。Unity机制以Unity 6为主，Addressables引用的1.21文档仅用于说明基本生命周期，物理题参考PhysX 5.4.1的3D机制；自研Transform题是设计练习，不代表Unity内部实现。最小验证尚需学习者实际执行。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "引擎原理",
      "Transform",
      "缓存失效"
    ],
    "difficulty": "hard",
    "order": 175,
    "sourceTitle": "Unity 官方文档 / PhysX（具体见答案）",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Transform-localToWorldMatrix.html"
  },
  {
    "id": "q-176",
    "categoryId": "unity-core",
    "title": "Job 依赖、安全与内存所有权",
    "question": "两个Job读写同一NativeArray，主线程还需要结果。为什么用了NativeArray不代表线程安全？什么时候Complete，什么时候Dispose？",
    "answer": "### 参考回答\nNativeContainer提供可供Job使用的本机内存和安全机制，但正确访问仍依赖读写声明、JobHandle依赖和生命周期管理。读写冲突必须建立依赖，主线程访问结果前需确保相关Job完成；释放内存不能早于最后使用者完成，可使用支持的依赖式释放。Schedule后立即Complete可能抵消并行收益，应该让独立工作在等待前推进。\n\n### 评分点（每项 1 分）\n- 用依赖表达读写先后\n- 在主线程消费前同步\n- 使Dispose发生在最后使用结束后\n\n### 追问与易错点\n关闭安全检查不会让数据竞争变正确；Burst负责编译优化，不会替你修复所有权错误。也不能随意从Job访问普通Unity对象API。\n\n### 最小验证\n先设计读写依赖图，再运行两Job样例；故意漏依赖观察安全报错，修正后对照串行结果并测调度开销。\n\n### 资料与适用范围\n- [官方资料：jobs](https://docs.unity3d.com/6000.0/Documentation/Manual/job-system-native-container.html)\n\n核验于 2026-09-06。Unity机制以Unity 6为主，Addressables引用的1.21文档仅用于说明基本生命周期，物理题参考PhysX 5.4.1的3D机制；自研Transform题是设计练习，不代表Unity内部实现。最小验证尚需学习者实际执行。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "引擎原理",
      "JobSystem",
      "内存所有权"
    ],
    "difficulty": "medium",
    "order": 176,
    "sourceTitle": "Unity 官方文档 / PhysX（具体见答案）",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/Manual/job-system-native-container.html"
  },
  {
    "id": "q-177",
    "categoryId": "unity-core",
    "title": "从场景对象到 GPU 工作：引擎渲染前端做什么",
    "question": "顶点着色器执行前，引擎如何决定提交哪些对象、以什么顺序和状态绘制？为什么CPU提交完成不等于GPU已画完？",
    "answer": "### 参考回答\n渲染前端根据相机和场景确定可见集合，选取绘制Pass与资源，按需要排序并生成绘制命令；透明排序、状态切换成本和画面正确性需要共同考虑。图形后端通过平台API提交工作，GPU可与CPU异步推进，因此CPU本帧提交时间与GPU执行时间不是同一指标。具体线程与队列安排取决于引擎、管线和平台。\n\n### 评分点（每项 1 分）\n- 说明剔除/排序/Pass/资源准备\n- 区分CPU提交与GPU执行\n- 不把API Draw调用等同即时完成\n\n### 追问与易错点\n为什么透明物体不能一律按材质排序？混合顺序会影响结果。Render Thread等待也可能是同步或呈现节奏，不能只凭marker名字归因。\n\n### 最小验证\n固定相机，使用Frame Debugger查绘制事件，再对照CPU/GPU profiler；分别增加对象数量与屏幕覆盖，比较哪侧成本变化。\n\n### 资料与适用范围\n- [官方资料：pipeline](https://docs.unity3d.com/6000.0/Documentation/Manual/render-pipelines-overview.html)\n- [官方资料：srp](https://docs.unity3d.com/6000.0/Documentation/Manual/SRPBatcher.html)\n\n核验于 2026-09-06。Unity机制以Unity 6为主，Addressables引用的1.21文档仅用于说明基本生命周期，物理题参考PhysX 5.4.1的3D机制；自研Transform题是设计练习，不代表Unity内部实现。最小验证尚需学习者实际执行。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "引擎原理",
      "渲染前端",
      "CPU与GPU"
    ],
    "difficulty": "medium",
    "order": 177,
    "sourceTitle": "Unity 官方文档 / PhysX（具体见答案）",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/Manual/render-pipelines-overview.html"
  },
  {
    "id": "q-178",
    "categoryId": "unity-core",
    "title": "物理引擎的 broad phase、narrow phase 与求解",
    "question": "为什么碰撞检测不直接对场景中每两个物体做精确形状测试？说明粗筛、精测和接触求解的区别，以及trigger是否等于完全免费。",
    "answer": "### 参考回答\n直接两两精测会产生大量候选对。Broad phase用包围体和空间结构筛选可能相交的对；narrow phase对候选形状计算接触信息；solver再结合质量、约束等求解响应。Trigger可报告重叠而不产生通常的接触响应，但仍有检测与事件成本。具体结构和算法由引擎版本与配置决定，不能把某一种树当所有实现。\n\n### 评分点（每项 1 分）\n- 区分候选筛选与精确接触\n- 区分检测与响应求解\n- 说明过滤和trigger仍有成本\n\n### 追问与易错点\n碰撞层过滤可以减少不必要配对；刚体睡眠、CCD和物理步长各解决不同问题。Unity 2D与3D使用不同物理系统，不能直接套用全部PhysX细节。\n\n### 最小验证\n在独立3D场景固定物体数，分别修改空间分布和碰撞层，观察物理时间与接触数；再与trigger配置对照，不把它当2D实测。\n\n### 资料与适用范围\n- [官方资料：physics](https://nvidia-omniverse.github.io/PhysX/physx/5.4.1/docs/RigidBodyCollision.html)\n\n核验于 2026-09-06。Unity机制以Unity 6为主，Addressables引用的1.21文档仅用于说明基本生命周期，物理题参考PhysX 5.4.1的3D机制；自研Transform题是设计练习，不代表Unity内部实现。最小验证尚需学习者实际执行。自评：全部核心评分点闭卷答出后才记独立通过，使用提示需另记。",
    "tags": [
      "引擎原理",
      "物理引擎",
      "碰撞检测"
    ],
    "difficulty": "medium",
    "order": 178,
    "sourceTitle": "Unity 官方文档 / PhysX（具体见答案）",
    "sourceUrl": "https://nvidia-omniverse.github.io/PhysX/physx/5.4.1/docs/RigidBodyCollision.html"
  }
]$question_data$::jsonb;
begin
  insert into public.categories(slug, name, sort_order)
  values ('unity-core', 'Unity 核心', 2), ('os-fundamentals', '操作系统', 7)
  on conflict (slug) do nothing;

  for item in select value from jsonb_array_elements(pack) loop
    select id into strict category_uuid from public.categories where slug = item->>'categoryId';
    question_uuid := null;
    insert into public.questions(legacy_id, category_id, type, title, prompt_md, difficulty,
      payload, source_title, source_url, status, visibility, sort_order)
    values(item->>'id', category_uuid, 'short_answer', item->>'title', item->>'question',
      item->>'difficulty', '{}'::jsonb, item->>'sourceTitle', item->>'sourceUrl',
      'published', 'public', (item->>'order')::integer)
    on conflict (legacy_id) do nothing returning id into question_uuid;
    if question_uuid is null then continue; end if;

    insert into public.question_solutions(question_id, solution)
    values(question_uuid, jsonb_build_object('referenceAnswerMd', item->>'answer', 'rubricMd', '', 'explanationMd', ''));
    for tag_name in select jsonb_array_elements_text(item->'tags') loop
      insert into public.tags(name) values(tag_name) on conflict(name) do nothing;
      select id into strict tag_uuid from public.tags where name = tag_name;
      insert into public.question_tags(question_id, tag_id) values(question_uuid, tag_uuid);
    end loop;
  end loop;
end;
$quality_pack$;
