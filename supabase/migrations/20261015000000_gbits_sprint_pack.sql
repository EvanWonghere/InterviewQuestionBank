-- Original sprint training; not official exam questions. Local implementation approved 2026-10-15.
-- Prepared only: production application requires separate approval.
-- Atomic and insert-only: existing questions, solutions, tags and progress are never overwritten.
do $gbits_pack$
declare
 item jsonb; category_uuid uuid; question_uuid uuid; tag_uuid uuid; tag_name text;
 pack jsonb := $question_data$[
  {
    "id": "gbits-043",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "并查集：哪些合并真正减少分量",
    "question": "**来源边界：【预测考点·原创训练】。** 本题为备考覆盖预测，没有证据表明该具体考点已在所核看的吉比特卷中出现。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n8 个顶点最初各自独立。依次执行 union(1,2)、union(3,4)、union(2,3)、union(5,6)、union(1,4)、union(6,7)，union 仅在两点尚不连通时合并。最后有几个连通分量？",
    "answer": "### 参考回答\n选 B。有效合并 5 次，union(1,4) 是重复连接。最终为 {1,2,3,4}、{5,6,7}、{8}，共 3 个。\n\n- A（2）：把重复 union 也算作减少一次。\n- B（3）：正确。\n- C（4）：漏掉一次有效合并。\n- D（5）：不能把边数直接当分量数。\n\n### 评分点\n正确选择 B；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n合并两个已经同根的元素不会减少分量数。\n\n### 验证\nverify-a.py 用无向图 DFS 独立数连通块，结果 3。\n\n### 来源与适用范围\n[MIT OCW：Union-Find and Amortization](https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/d25d9d3ba96321326601c8f6dd073e60_MIT6_046JS15_Recitation3.pdf)。此链接是技术依据，不是吉比特出题证据。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "easy",
    "order": 221,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "预测考点·原创训练",
      "并查集"
    ],
    "sourceTitle": "MIT OCW：Union-Find and Amortization / 预测考点·原创训练",
    "sourceUrl": "https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/d25d9d3ba96321326601c8f6dd073e60_MIT6_046JS15_Recitation3.pdf",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "2"
        },
        {
          "id": "B",
          "text": "3"
        },
        {
          "id": "C",
          "text": "4"
        },
        {
          "id": "D",
          "text": "5"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 B。有效合并 5 次，union(1,4) 是重复连接。最终为 {1,2,3,4}、{5,6,7}、{8}，共 3 个。\n\n- A（2）：把重复 union 也算作减少一次。\n- B（3）：正确。\n- C（4）：漏掉一次有效合并。\n- D（5）：不能把边数直接当分量数。\n\n### 评分点\n正确选择 B；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n合并两个已经同根的元素不会减少分量数。\n\n### 验证\nverify-a.py 用无向图 DFS 独立数连通块，结果 3。\n\n### 来源与适用范围\n[MIT OCW：Union-Find and Amortization](https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/d25d9d3ba96321326601c8f6dd073e60_MIT6_046JS15_Recitation3.pdf)。此链接是技术依据，不是吉比特出题证据。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-044",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "AVL 插入：先双旋再单旋",
    "question": "**来源边界：【预测考点·原创训练】。** 本题为备考覆盖预测，没有证据表明该具体考点已在所核看的吉比特卷中出现。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n向空 AVL 树依次插入互异键 30、10、20、40、50。每次按普通二叉搜索树插入，再在最低失衡祖先处按标准 AVL 旋转恢复平衡。最后根键及基本旋转总次数分别是？一次左旋或右旋各计 1 次。",
    "answer": "### 参考回答\n选 D：根 20，共 3 次。插入 20 触发 30 处 LR：先左旋 10，再右旋 30。插入 40 不失衡；插入 50 在 30 处触发 RR，左旋 30。最终根 20，左子 10，右子 40（其左右为 30、50）。\n\n- A（30,1）：未执行首次 LR 双旋。\n- B（20,2）：漏计最后单旋。\n- C（40,3）：最后失衡点是 30，不是根 20。\n- D（20,3）：正确。\n\n### 评分点\n正确选择 D；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\nLR/RL 各由两次基本旋转组成；最低失衡点未必是根。\n\n### 验证\nverify-a.py 按高度差实现 AVL 插入，核对根、旋转数和每个节点平衡。\n\n### 来源与适用范围\n[NIST：AVL tree](https://xlinux.nist.gov/dads/HTML/avltree.html)。此链接是技术依据，不是吉比特出题证据。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "medium",
    "order": 222,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "预测考点·原创训练",
      "AVL树"
    ],
    "sourceTitle": "NIST：AVL tree / 预测考点·原创训练",
    "sourceUrl": "https://xlinux.nist.gov/dads/HTML/avltree.html",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "30，1"
        },
        {
          "id": "B",
          "text": "20，2"
        },
        {
          "id": "C",
          "text": "40，3"
        },
        {
          "id": "D",
          "text": "20，3"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 D：根 20，共 3 次。插入 20 触发 30 处 LR：先左旋 10，再右旋 30。插入 40 不失衡；插入 50 在 30 处触发 RR，左旋 30。最终根 20，左子 10，右子 40（其左右为 30、50）。\n\n- A（30,1）：未执行首次 LR 双旋。\n- B（20,2）：漏计最后单旋。\n- C（40,3）：最后失衡点是 30，不是根 20。\n- D（20,3）：正确。\n\n### 评分点\n正确选择 D；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\nLR/RL 各由两次基本旋转组成；最低失衡点未必是根。\n\n### 验证\nverify-a.py 按高度差实现 AVL 插入，核对根、旋转数和每个节点平衡。\n\n### 来源与适用范围\n[NIST：AVL tree](https://xlinux.nist.gov/dads/HTML/avltree.html)。此链接是技术依据，不是吉比特出题证据。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "D"
      ]
    }
  },
  {
    "id": "gbits-045",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "二分查找：半开区间的执行次数",
    "question": "**来源边界：【历年考点·原创变式】。** 风格依据为2018 提前批开发卷：可见题型与考点；仅考点类别有历年依据，题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n以下 C++17 程序只在循环体首行执行时计一次比较。它输出什么？\n\n```cpp\n#include <iostream>\nint main() {\n    int a[] = {2, 4, 6, 8, 10, 14, 16, 18, 20};\n    int l = 0, r = 9, checks = 0;\n    while (l < r) {\n        ++checks;\n        int m = l + (r - l) / 2;\n        if (a[m] < 12) l = m + 1;\n        else r = m;\n    }\n    std::cout << checks << ' ' << l << '\\n';\n}\n```",
    "answer": "### 参考回答\n选 A：`4 5`。mid 依次为 4、7、6、5；数组中首个不小于 12 的位置是下标 5（值 14）。\n\n- A（4 5）：正确。\n- B（3 4）：把应插入位置误写成前一元素。\n- C（3 5）：漏掉了一轮边界收缩。\n- D（2 6）：尚未收缩到唯一边界就停止。\n\n### 评分点\n正确选择 A；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\nr=n 是右开边界；找不到相等元素仍可得到合法插入位置。\n\n### 验证\nverify-a.py 从本题 JSON 提取原程序以 C++17 编译，实际输出 4 5。\n\n### 来源与适用范围\n[2018 提前批开发卷：可见题型与考点](https://www.nowcoder.com/exam/test/11251616/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n技术定义见 [NIST binary search](https://xlinux.nist.gov/dads/HTML/binarySearch.html)。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "medium",
    "order": 223,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "历年考点·原创变式",
      "二分查找"
    ],
    "sourceTitle": "2018 提前批开发卷：可见题型与考点 / 历年考点·原创变式",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11251616/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "4 5"
        },
        {
          "id": "B",
          "text": "3 4"
        },
        {
          "id": "C",
          "text": "3 5"
        },
        {
          "id": "D",
          "text": "2 6"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 A：`4 5`。mid 依次为 4、7、6、5；数组中首个不小于 12 的位置是下标 5（值 14）。\n\n- A（4 5）：正确。\n- B（3 4）：把应插入位置误写成前一元素。\n- C（3 5）：漏掉了一轮边界收缩。\n- D（2 6）：尚未收缩到唯一边界就停止。\n\n### 评分点\n正确选择 A；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\nr=n 是右开边界；找不到相等元素仍可得到合法插入位置。\n\n### 验证\nverify-a.py 从本题 JSON 提取原程序以 C++17 编译，实际输出 4 5。\n\n### 来源与适用范围\n[2018 提前批开发卷：可见题型与考点](https://www.nowcoder.com/exam/test/11251616/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n技术定义见 [NIST binary search](https://xlinux.nist.gov/dads/HTML/binarySearch.html)。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-046",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "小根堆删除：替换根后的下沉",
    "question": "**来源边界：【历年考点·原创变式】。** 风格依据为2025-04-24 研发笔经：部分单选、2 填空与 3 编程回忆；仅考点类别有历年依据，题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n小根堆以 0 下标数组表示为 [3,8,5,14,11,9,7]。删除最小值时，把最后元素移到根，长度减 1；随后反复与两个孩子中较小者交换，直到堆序恢复。最终数组是？",
    "answer": "### 参考回答\n选 C：把 7 移到根，与较小孩子 5 交换，得到 [5,8,7,14,11,9]，7≤其唯一孩子 9，结束。\n\n- A：根 7 大于孩子 5，尚未恢复。\n- B：虽也是合法堆，但不是题定下沉过程的结果。\n- C：正确。\n- D：没有使用最后元素填根，元素集合也错误。\n\n### 评分点\n正确选择 C；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n合法堆不唯一，但给定操作顺序的结果唯一；孩子下标为 2i+1、2i+2。\n\n### 验证\nverify-a.py 用 Python heapq.heapify/heappop 独立核对指定初堆删除结果，并核对元素多重集。\n\n### 来源与适用范围\n[2025-04-24 研发笔经：部分单选、2 填空与 3 编程回忆](https://www.nowcoder.com/feed/main/detail/f3ad63377c7b4bee94641bcb9eb6efc7?sourceSSR=enterprise)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "easy",
    "order": 224,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "历年考点·原创变式",
      "堆"
    ],
    "sourceTitle": "2025-04-24 研发笔经：部分单选、2 填空与 3 编程回忆 / 历年考点·原创变式",
    "sourceUrl": "https://www.nowcoder.com/feed/main/detail/f3ad63377c7b4bee94641bcb9eb6efc7?sourceSSR=enterprise",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "[7,8,5,14,11,9]"
        },
        {
          "id": "B",
          "text": "[5,7,8,14,11,9]"
        },
        {
          "id": "C",
          "text": "[5,8,7,14,11,9]"
        },
        {
          "id": "D",
          "text": "[5,8,9,14,11,3]"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 C：把 7 移到根，与较小孩子 5 交换，得到 [5,8,7,14,11,9]，7≤其唯一孩子 9，结束。\n\n- A：根 7 大于孩子 5，尚未恢复。\n- B：虽也是合法堆，但不是题定下沉过程的结果。\n- C：正确。\n- D：没有使用最后元素填根，元素集合也错误。\n\n### 评分点\n正确选择 C；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n合法堆不唯一，但给定操作顺序的结果唯一；孩子下标为 2i+1、2i+2。\n\n### 验证\nverify-a.py 用 Python heapq.heapify/heappop 独立核对指定初堆删除结果，并核对元素多重集。\n\n### 来源与适用范围\n[2025-04-24 研发笔经：部分单选、2 填空与 3 编程回忆](https://www.nowcoder.com/feed/main/detail/f3ad63377c7b4bee94641bcb9eb6efc7?sourceSSR=enterprise)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-047",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "归并两段有序数组的关键字比较",
    "question": "**来源边界：【预测考点·原创训练】。** 已读2023材料可见排序类，但未确认归并关键字比较这一具体操作；本题按预测训练处理。题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n将升序数组 L=[1,4,8]、R=[2,3,9,10] 归并。两边都未取尽时，只比较一次两边首个未取元素，取较小者；某边取尽后直接复制另一边剩余元素。恰好执行多少次这种关键字比较？",
    "answer": "### 参考回答\n选 B：比较为 (1,2)、(4,2)、(4,3)、(4,9)、(8,9)，共 5 次，此后直接复制 9、10。\n\n- A（4）：漏掉最后一次 8 与 9。\n- B（5）：正确。\n- C（6）：这是合并 7 元素的最坏上界，不是本例实际数。\n- D（7）：把每次输出都当作比较。\n\n### 评分点\n正确选择 B；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n归并的最坏比较数 m+n−1 不代表每个输入都达到上界。\n\n### 验证\nverify-a.py 独立用两指针记录比较轨迹，断言次数 5、输出严格有序且元素齐全。\n\n### 来源与适用范围\n[2023 技术卷：可见题型与考点](https://www.nowcoder.com/exam/test/55263940/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n技术定义见 [NIST merge sort](https://xlinux.nist.gov/dads/HTML/mergesort.html)。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "easy",
    "order": 225,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "预测考点·原创训练",
      "归并排序"
    ],
    "sourceTitle": "预测考点·原创训练 / 具体操作未由已读历年材料确认",
    "sourceUrl": "https://www.nowcoder.com/exam/test/55263940/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "4"
        },
        {
          "id": "B",
          "text": "5"
        },
        {
          "id": "C",
          "text": "6"
        },
        {
          "id": "D",
          "text": "7"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 B：比较为 (1,2)、(4,2)、(4,3)、(4,9)、(8,9)，共 5 次，此后直接复制 9、10。\n\n- A（4）：漏掉最后一次 8 与 9。\n- B（5）：正确。\n- C（6）：这是合并 7 元素的最坏上界，不是本例实际数。\n- D（7）：把每次输出都当作比较。\n\n### 评分点\n正确选择 B；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n归并的最坏比较数 m+n−1 不代表每个输入都达到上界。\n\n### 验证\nverify-a.py 独立用两指针记录比较轨迹，断言次数 5、输出严格有序且元素齐全。\n\n### 来源与适用范围\n[2023 技术卷：可见题型与考点](https://www.nowcoder.com/exam/test/55263940/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n技术定义见 [NIST merge sort](https://xlinux.nist.gov/dads/HTML/mergesort.html)。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-048",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "有向邻接表：平行边如何计数",
    "question": "**来源边界：【预测考点·原创训练】。** 本题为备考覆盖预测，没有证据表明该具体考点已在所核看的吉比特卷中出现。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n有向图顶点 1–4，允许平行边，不含自环。邻接表为 1:[2,2,3]，2:[3]，3:[1,4]，4:[]。每个表项代表一条独立有向边。顶点 2 的入度、顶点 3 的出度、全图边数依次是？",
    "answer": "### 参考回答\n选 D：顶点 2 从 1 收到两条平行边，入度 2；3 有指向 1、4 的两条边，出度 2；表项总数 3+1+2=6。\n\n- A（1,2,5）：错误去重平行边。\n- B（2,3,6）：把入度和出度混淆。\n- C（2,2,3）：有向边无需像无向邻接表那样除以 2。\n- D（2,2,6）：正确。\n\n### 评分点\n正确选择 D；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n有向邻接表每条边出现一次；题目明确平行边保留。\n\n### 验证\nverify-a.py 从边元组列表计数，并核对全图入度总和=出度总和=6。\n\n### 来源与适用范围\n[NIST：directed graph](https://xlinux.nist.gov/dads/HTML/directedGraph.html)。此链接是技术依据，不是吉比特出题证据。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "easy",
    "order": 226,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "预测考点·原创训练",
      "图的度数"
    ],
    "sourceTitle": "NIST：directed graph / 预测考点·原创训练",
    "sourceUrl": "https://xlinux.nist.gov/dads/HTML/directedGraph.html",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "1，2，5"
        },
        {
          "id": "B",
          "text": "2，3，6"
        },
        {
          "id": "C",
          "text": "2，2，3"
        },
        {
          "id": "D",
          "text": "2，2，6"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 D：顶点 2 从 1 收到两条平行边，入度 2；3 有指向 1、4 的两条边，出度 2；表项总数 3+1+2=6。\n\n- A（1,2,5）：错误去重平行边。\n- B（2,3,6）：把入度和出度混淆。\n- C（2,2,3）：有向边无需像无向邻接表那样除以 2。\n- D（2,2,6）：正确。\n\n### 评分点\n正确选择 D；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n有向邻接表每条边出现一次；题目明确平行边保留。\n\n### 验证\nverify-a.py 从边元组列表计数，并核对全图入度总和=出度总和=6。\n\n### 来源与适用范围\n[NIST：directed graph](https://xlinux.nist.gov/dads/HTML/directedGraph.html)。此链接是技术依据，不是吉比特出题证据。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "D"
      ]
    }
  },
  {
    "id": "gbits-049",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "出栈序列：数量相同也可能非法",
    "question": "**来源边界：【历年考点·原创变式】。** 风格依据为2023 技术卷：可见题型与考点；仅考点类别有历年依据，题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n元素按 1、2、3、4、5 的固定顺序依次入一个空栈；可在任意两次入栈之间弹出若干元素，每个元素恰好入栈、出栈一次。以下哪个不可能是完整出栈序列？",
    "answer": "### 参考回答\n选 C：要先弹出 3，栈中至少压入 1、2、3；弹出 3 后栈顶为 2，不能跳过 2 先弹出 1。\n\n- A：可入1,2→出2,1，入3,4→出4,3，入5→出5。\n- B：入1,2,3→出3,2,1，入4,5→出5,4。\n- C：不可能。\n- D：全部入栈后依次弹出即可。\n\n### 评分点\n正确选择 C；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n必须服从栈顶顺序；不能只检查是否为 1–5 的排列。\n\n### 验证\nverify-a.py 枚举全部合法 push/pop 交错的出栈序列集合，4 个候选中恰有 C 不在集合。\n\n### 来源与适用范围\n[2023 技术卷：可见题型与考点](https://www.nowcoder.com/exam/test/55263940/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "easy",
    "order": 227,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "历年考点·原创变式",
      "栈"
    ],
    "sourceTitle": "2023 技术卷：可见题型与考点 / 历年考点·原创变式",
    "sourceUrl": "https://www.nowcoder.com/exam/test/55263940/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "2,1,4,3,5"
        },
        {
          "id": "B",
          "text": "3,2,1,5,4"
        },
        {
          "id": "C",
          "text": "3,1,2,4,5"
        },
        {
          "id": "D",
          "text": "5,4,3,2,1"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 C：要先弹出 3，栈中至少压入 1、2、3；弹出 3 后栈顶为 2，不能跳过 2 先弹出 1。\n\n- A：可入1,2→出2,1，入3,4→出4,3，入5→出5。\n- B：入1,2,3→出3,2,1，入4,5→出5,4。\n- C：不可能。\n- D：全部入栈后依次弹出即可。\n\n### 评分点\n正确选择 C；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n必须服从栈顶顺序；不能只检查是否为 1–5 的排列。\n\n### 验证\nverify-a.py 枚举全部合法 push/pop 交错的出栈序列集合，4 个候选中恰有 C 不在集合。\n\n### 来源与适用范围\n[2023 技术卷：可见题型与考点](https://www.nowcoder.com/exam/test/55263940/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-050",
    "categoryId": "os-fundamentals",
    "type": "single_choice",
    "title": "非抢占 SJF：到达时间决定候选集",
    "question": "**来源边界：【历年考点·原创变式】。** 风格依据为2018 技术 A 卷：可见题型与考点；仅考点类别有历年依据，题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n单 CPU，无切换开销；作业只使用 CPU。A/B/C/D 的（到达时刻，运行时长）分别为 (0,6)、(1,2)、(2,1)、(3,3)。采用非抢占 SJF：CPU 空闲时，从已到达未完成作业中选运行时长最短者，开始后运行至结束。平均等待时间是多少？时间单位相同。",
    "answer": "### 参考回答\n选 C：执行 A[0,6)、C[6,7)、B[7,9)、D[9,12)。等待时间分别为 A=0、B=6、C=4、D=6，平均 16/4=4。\n\n- A（3）：把 A 尚未结束时到达的短作业提前运行。\n- B（3.5）：遗漏了部分等待。\n- C（4）：正确。\n- D（4.5）：不是本规则下等待总量；不可把周转时间当等待时间。\n\n### 评分点\n正确选择 C；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n非抢占 SJF 不能因新短任务到达而打断 A。\n\n### 验证\nverify-a.py 以到达/时长离散事件模拟，核对执行序列和等待总量。\n\n### 来源与适用范围\n[2018 技术 A 卷：可见题型与考点](https://www.nowcoder.com/exam/test/11252349/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n技术依据：[OSTEP CPU Scheduling](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf)。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "medium",
    "order": 228,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "历年考点·原创变式",
      "CPU调度"
    ],
    "sourceTitle": "2018 技术 A 卷：可见题型与考点 / 历年考点·原创变式",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252349/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "3"
        },
        {
          "id": "B",
          "text": "3.5"
        },
        {
          "id": "C",
          "text": "4"
        },
        {
          "id": "D",
          "text": "4.5"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 C：执行 A[0,6)、C[6,7)、B[7,9)、D[9,12)。等待时间分别为 A=0、B=6、C=4、D=6，平均 16/4=4。\n\n- A（3）：把 A 尚未结束时到达的短作业提前运行。\n- B（3.5）：遗漏了部分等待。\n- C（4）：正确。\n- D（4.5）：不是本规则下等待总量；不可把周转时间当等待时间。\n\n### 评分点\n正确选择 C；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n非抢占 SJF 不能因新短任务到达而打断 A。\n\n### 验证\nverify-a.py 以到达/时长离散事件模拟，核对执行序列和等待总量。\n\n### 来源与适用范围\n[2018 技术 A 卷：可见题型与考点](https://www.nowcoder.com/exam/test/11252349/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n技术依据：[OSTEP CPU Scheduling](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf)。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-051",
    "categoryId": "os-fundamentals",
    "type": "single_choice",
    "title": "分页地址翻译：页内偏移保持不变",
    "question": "**来源边界：【预测考点·原创训练】。** 本题为备考覆盖预测，没有证据表明该具体考点已在所核看的吉比特卷中出现。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n系统按字节寻址，页面大小为 1024 字节。某进程页表中虚页 0→物理页框5，1→9，2→3，且都有效。虚拟地址 2500 对应的物理地址是多少（十进制）？不考虑 TLB、缓存或权限异常。",
    "answer": "### 参考回答\n选 A：2500=2×1024+452，虚页号 2 映射页框 3，所以物理地址 3×1024+452=3524。\n\n- A（3524）：正确。\n- B（5572）：错误使用页框5。\n- C（3072）：丢失页内偏移452。\n- D（2500）：把虚拟地址直接当物理地址。\n\n### 评分点\n正确选择 A；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n页表只替换页号部分，偏移不变；1024 字节不等于十进制1000字节。\n\n### 验证\nverify-a.py 用 divmod 和逆向分解核对页号/偏移，结果 3524。\n\n### 来源与适用范围\n[OSTEP：Introduction to Paging](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf)。此链接是技术依据，不是吉比特出题证据。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "easy",
    "order": 229,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "预测考点·原创训练",
      "分页地址"
    ],
    "sourceTitle": "OSTEP：Introduction to Paging / 预测考点·原创训练",
    "sourceUrl": "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "3524"
        },
        {
          "id": "B",
          "text": "5572"
        },
        {
          "id": "C",
          "text": "3072"
        },
        {
          "id": "D",
          "text": "2500"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 A：2500=2×1024+452，虚页号 2 映射页框 3，所以物理地址 3×1024+452=3524。\n\n- A（3524）：正确。\n- B（5572）：错误使用页框5。\n- C（3072）：丢失页内偏移452。\n- D（2500）：把虚拟地址直接当物理地址。\n\n### 评分点\n正确选择 A；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n页表只替换页号部分，偏移不变；1024 字节不等于十进制1000字节。\n\n### 验证\nverify-a.py 用 divmod 和逆向分解核对页号/偏移，结果 3524。\n\n### 来源与适用范围\n[OSTEP：Introduction to Paging](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf)。此链接是技术依据，不是吉比特出题证据。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-052",
    "categoryId": "computer-networks",
    "type": "single_choice",
    "title": "UDP 数据报：MTU 内还剩多少应用字节",
    "question": "**来源边界：【预测考点·原创训练】。** 本题为备考覆盖预测，没有证据表明该具体考点已在所核看的吉比特卷中出现。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n一条路径的 IPv4 MTU 为 1500 字节（MTU 限制完整 IPv4 数据报长度，不含二层帧头）。IPv4 首部恰为 20 字节、UDP 首部 8 字节，无其他封装；要求一个 UDP 数据报在该路径不发生 IP 分片。最多能承载多少字节应用数据？",
    "answer": "### 参考回答\n选 B：1500−20−8=1472 字节。\n\n- A（1500）：未扣任何首部。\n- B（1472）：正确。\n- C（1480）：只扣 IPv4 首部，仍含 UDP 首部。\n- D（1460）：误按常见的 20 字节 TCP 首部计算。\n\n### 评分点\n正确选择 B；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n本题是 UDP，不是 TCP MSS；MTU 的计量边界已明确，不应额外扣二层头。\n\n### 验证\nverify-a.py 穷举应用长度 0–1600，满足 L+20+8≤1500 的最大值恰为1472。\n\n### 来源与适用范围\n[IETF RFC 768：UDP 首部与长度](https://www.rfc-editor.org/rfc/rfc768.html)。此链接是技术依据，不是吉比特出题证据。\nIPv4 首部/总长度定义另见 [RFC 791](https://www.rfc-editor.org/rfc/rfc791.html)。本题网络知识属于预测覆盖，不声称该具体 MTU 计算已出现。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "easy",
    "order": 230,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "预测考点·原创训练",
      "MTU与UDP"
    ],
    "sourceTitle": "IETF RFC 768：UDP 首部与长度 / 预测考点·原创训练",
    "sourceUrl": "https://www.rfc-editor.org/rfc/rfc768.html",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "1500"
        },
        {
          "id": "B",
          "text": "1472"
        },
        {
          "id": "C",
          "text": "1480"
        },
        {
          "id": "D",
          "text": "1460"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 B：1500−20−8=1472 字节。\n\n- A（1500）：未扣任何首部。\n- B（1472）：正确。\n- C（1480）：只扣 IPv4 首部，仍含 UDP 首部。\n- D（1460）：误按常见的 20 字节 TCP 首部计算。\n\n### 评分点\n正确选择 B；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n本题是 UDP，不是 TCP MSS；MTU 的计量边界已明确，不应额外扣二层头。\n\n### 验证\nverify-a.py 穷举应用长度 0–1600，满足 L+20+8≤1500 的最大值恰为1472。\n\n### 来源与适用范围\n[IETF RFC 768：UDP 首部与长度](https://www.rfc-editor.org/rfc/rfc768.html)。此链接是技术依据，不是吉比特出题证据。\nIPv4 首部/总长度定义另见 [RFC 791](https://www.rfc-editor.org/rfc/rfc791.html)。本题网络知识属于预测覆盖，不声称该具体 MTU 计算已出现。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-053",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "INNER JOIN：相同键不会自动去重",
    "question": "**来源边界：【预测考点·原创训练】。** 本题为备考覆盖预测，没有证据表明该具体考点已在所核看的吉比特卷中出现。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n表 A(k) 有三行 1、1、2；表 B(k) 有三行 1、1、3。无 NULL、无唯一约束。执行下列 SQL，结果行数是多少？\n\n```sql\nSELECT A.k FROM A INNER JOIN B ON A.k = B.k;\n```\n\n查询没有 DISTINCT。",
    "answer": "### 参考回答\n选 D：A 的每条 k=1 行匹配 B 的两条 k=1 行，得到 2×2=4 行。A.k=2 没有匹配。\n\n- A（1）：错误做了 DISTINCT。\n- B（2）：每条 A 行只匹配一条 B，漏掉重复匹配。\n- C（3）：把 A 的行数当输出行数。\n- D（4）：正确。\n\n### 评分点\n正确选择 D；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\nSQL 的普通 SELECT 保留重复结果；INNER JOIN 为每个匹配行对产生一行。\n\n### 验证\nverify-a.py 在独立内存 SQLite 建两表执行题面 SQL，核对 4 行；连接规则同时按 PostgreSQL 官方文档复核。\n\n### 来源与适用范围\n[PostgreSQL 官方：Joined Tables](https://www.postgresql.org/docs/current/queries-table-expressions.html)。此链接是技术依据，不是吉比特出题证据。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "easy",
    "order": 231,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "预测考点·原创训练",
      "SQL连接"
    ],
    "sourceTitle": "PostgreSQL 官方：Joined Tables / 预测考点·原创训练",
    "sourceUrl": "https://www.postgresql.org/docs/current/queries-table-expressions.html",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "1"
        },
        {
          "id": "B",
          "text": "2"
        },
        {
          "id": "C",
          "text": "3"
        },
        {
          "id": "D",
          "text": "4"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 D：A 的每条 k=1 行匹配 B 的两条 k=1 行，得到 2×2=4 行。A.k=2 没有匹配。\n\n- A（1）：错误做了 DISTINCT。\n- B（2）：每条 A 行只匹配一条 B，漏掉重复匹配。\n- C（3）：把 A 的行数当输出行数。\n- D（4）：正确。\n\n### 评分点\n正确选择 D；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\nSQL 的普通 SELECT 保留重复结果；INNER JOIN 为每个匹配行对产生一行。\n\n### 验证\nverify-a.py 在独立内存 SQLite 建两表执行题面 SQL，核对 4 行；连接规则同时按 PostgreSQL 官方文档复核。\n\n### 来源与适用范围\n[PostgreSQL 官方：Joined Tables](https://www.postgresql.org/docs/current/queries-table-expressions.html)。此链接是技术依据，不是吉比特出题证据。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "D"
      ]
    }
  },
  {
    "id": "gbits-054",
    "categoryId": "os-fundamentals",
    "type": "single_choice",
    "title": "计数信号量：唤醒不等于空出资源",
    "question": "**来源边界：【历年考点·原创变式】。** 风格依据为2018 提前批开发卷：可见题型与考点；仅考点类别有历年依据，题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n资源池初始有 2 份资源。P 操作若有空闲资源则立即取得一份，否则阻塞；V 归还一份资源，并把它直接交给最早等待者。按顺序发生：P1执行P、P2执行P、P3执行P、P1执行V、P4执行P。没有其他操作。此时持有资源的进程和等待者分别是？",
    "answer": "### 参考回答\n选 B：P1、P2 先取得两份；P3 等待。P1 的 V 将其资源交给 P3，因此 P4 仍需等待。持有者 P2/P3；等待者 P4。\n\n- A：忽略 P1 已经归还。\n- B：正确。\n- C：忽略等待的 P3 先获得资源。\n- D：误认为 V 只增加计数而不唤醒旧等待者。\n\n### 评分点\n正确选择 B；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\nV 可能把资源立即分配给等待者；不要混用不同教材的信号量负值记数实现。\n\n### 验证\nverify-a.py 用资源持有集合+FIFO 等待队列模拟，每一步核对持有数≤2，最终集合和队列唯一。\n\n### 来源与适用范围\n[2018 提前批开发卷：可见题型与考点](https://www.nowcoder.com/exam/test/11251616/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n技术依据：[OSTEP Semaphores](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf)；本题额外明确 FIFO 和直接交付语义。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "medium",
    "order": 232,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "历年考点·原创变式",
      "信号量"
    ],
    "sourceTitle": "2018 提前批开发卷：可见题型与考点 / 历年考点·原创变式",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11251616/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "P1、P2；P3、P4"
        },
        {
          "id": "B",
          "text": "P2、P3；P4"
        },
        {
          "id": "C",
          "text": "P2、P4；P3"
        },
        {
          "id": "D",
          "text": "仅P2；P3、P4"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 B：P1、P2 先取得两份；P3 等待。P1 的 V 将其资源交给 P3，因此 P4 仍需等待。持有者 P2/P3；等待者 P4。\n\n- A：忽略 P1 已经归还。\n- B：正确。\n- C：忽略等待的 P3 先获得资源。\n- D：误认为 V 只增加计数而不唤醒旧等待者。\n\n### 评分点\n正确选择 B；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\nV 可能把资源立即分配给等待者；不要混用不同教材的信号量负值记数实现。\n\n### 验证\nverify-a.py 用资源持有集合+FIFO 等待队列模拟，每一步核对持有数≤2，最终集合和队列唯一。\n\n### 来源与适用范围\n[2018 提前批开发卷：可见题型与考点](https://www.nowcoder.com/exam/test/11251616/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n技术依据：[OSTEP Semaphores](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf)；本题额外明确 FIFO 和直接交付语义。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-055",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "一次随机奖励的期望净收益",
    "question": "**来源边界：【历年考点·原创变式】。** 风格依据为2018 技术 A 卷：可见题型与考点；仅考点类别有历年依据，题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n一次游戏先支付 4 枚代币。独立投掷两枚公平六面骰：点数相同返还 12 枚；点数不同且和为 7 返还 6 枚；其余返还 0。两类返还互斥，不累计。每次的期望净收益是多少枚？",
    "answer": "### 参考回答\n选 A：36 个等可能有序结果中，对子 6 个，和为7有6个且没有对子。期望返还=(6×12+6×6)/36=3；净收益=3−4=−1。\n\n- A（−1）：正确。\n- B（0）：把净收益误算为盈亏平衡。\n- C（3）：是期望返还，未扣费用。\n- D（−2）：漏算和为7的奖励。\n\n### 评分点\n正确选择 A；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n骰子结果按有序对等可能；先扣成本，且互斥奖励不能重复累加。\n\n### 验证\nverify-a.py 穷举36个有序骰子结果，使用 Fraction 精确求和，净收益 −1。\n\n### 来源与适用范围\n[2018 技术 A 卷：可见题型与考点](https://www.nowcoder.com/exam/test/11252349/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "easy",
    "order": 233,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "历年考点·原创变式",
      "概率期望"
    ],
    "sourceTitle": "2018 技术 A 卷：可见题型与考点 / 历年考点·原创变式",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252349/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "−1"
        },
        {
          "id": "B",
          "text": "0"
        },
        {
          "id": "C",
          "text": "3"
        },
        {
          "id": "D",
          "text": "−2"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 A：36 个等可能有序结果中，对子 6 个，和为7有6个且没有对子。期望返还=(6×12+6×6)/36=3；净收益=3−4=−1。\n\n- A（−1）：正确。\n- B（0）：把净收益误算为盈亏平衡。\n- C（3）：是期望返还，未扣费用。\n- D（−2）：漏算和为7的奖励。\n\n### 评分点\n正确选择 A；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n骰子结果按有序对等可能；先扣成本，且互斥奖励不能重复累加。\n\n### 验证\nverify-a.py 穷举36个有序骰子结果，使用 Fraction 精确求和，净收益 −1。\n\n### 来源与适用范围\n[2018 技术 A 卷：可见题型与考点](https://www.nowcoder.com/exam/test/11252349/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-056",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "格路计数：必须经过补给点",
    "question": "**来源边界：【历年考点·原创变式】。** 风格依据为2018 技术 A 卷：可见题型与考点；仅考点类别有历年依据，题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n从整数格点 (0,0) 到 (5,4)，每步只可向右或向上移动 1。要求路径必须经过 (2,2)，路径以步序列区分。满足要求的路径有多少条？",
    "answer": "### 参考回答\n选 C：起点到补给点需2右2上，共 C(4,2)=6；补给点到终点需3右2上，共 C(5,2)=10。两段独立组合，6×10=60。\n\n- A（16）：把两段路径数相加。\n- B（30）：少算一半步序列。\n- C（60）：正确。\n- D（126）：C(9,4) 是所有路径，未要求经过补给点。\n\n### 评分点\n正确选择 C；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n必经点把路径分成可独立选择的两段，应相乘。\n\n### 验证\nverify-a.py 枚举全部9步中4个上移位置的126条路径，筛选经过(2,2)，恰60条。\n\n### 来源与适用范围\n[2018 技术 A 卷：可见题型与考点](https://www.nowcoder.com/exam/test/11252349/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "medium",
    "order": 234,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "历年考点·原创变式",
      "组合计数"
    ],
    "sourceTitle": "2018 技术 A 卷：可见题型与考点 / 历年考点·原创变式",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252349/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "16"
        },
        {
          "id": "B",
          "text": "30"
        },
        {
          "id": "C",
          "text": "60"
        },
        {
          "id": "D",
          "text": "126"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 C：起点到补给点需2右2上，共 C(4,2)=6；补给点到终点需3右2上，共 C(5,2)=10。两段独立组合，6×10=60。\n\n- A（16）：把两段路径数相加。\n- B（30）：少算一半步序列。\n- C（60）：正确。\n- D（126）：C(9,4) 是所有路径，未要求经过补给点。\n\n### 评分点\n正确选择 C；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n必经点把路径分成可独立选择的两段，应相乘。\n\n### 验证\nverify-a.py 枚举全部9步中4个上移位置的126条路径，筛选经过(2,2)，恰60条。\n\n### 来源与适用范围\n[2018 技术 A 卷：可见题型与考点](https://www.nowcoder.com/exam/test/11252349/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-057",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "模周期：两种事件首次同时触发",
    "question": "**来源边界：【历年考点·原创变式】。** 风格依据为2023 技术卷：可见题型与考点；仅考点类别有历年依据，题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n以整数秒计时。事件 A 在 t≡2 (mod 5) 的非负时刻触发；事件 B 在 t≡3 (mod 7) 的非负时刻触发。t=0 不触发任何事件。两者第一次同时触发的时刻是多少秒？",
    "answer": "### 参考回答\n选 D：A 的时刻为2、7、12、17…；其中17除以7余3，且此前均不满足，首次为17。之后每35秒重合。\n\n- A（10）：除以5余0，不满足A。\n- B（12）：除以7余5，不满足B。\n- C（3）：不满足A。\n- D（17）：正确。\n\n### 评分点\n正确选择 D；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n周期相乘35是重合间隔，初次时刻须考虑两个相位。\n\n### 验证\nverify-a.py 在一个最小公倍数周期0–34内穷举，交集恰为[17]。\n\n### 来源与适用范围\n[2023 技术卷：可见题型与考点](https://www.nowcoder.com/exam/test/55263940/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "easy",
    "order": 235,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "历年考点·原创变式",
      "模运算"
    ],
    "sourceTitle": "2023 技术卷：可见题型与考点 / 历年考点·原创变式",
    "sourceUrl": "https://www.nowcoder.com/exam/test/55263940/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "10"
        },
        {
          "id": "B",
          "text": "12"
        },
        {
          "id": "C",
          "text": "3"
        },
        {
          "id": "D",
          "text": "17"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 D：A 的时刻为2、7、12、17…；其中17除以7余3，且此前均不满足，首次为17。之后每35秒重合。\n\n- A（10）：除以5余0，不满足A。\n- B（12）：除以7余5，不满足B。\n- C（3）：不满足A。\n- D（17）：正确。\n\n### 评分点\n正确选择 D；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n周期相乘35是重合间隔，初次时刻须考虑两个相位。\n\n### 验证\nverify-a.py 在一个最小公倍数周期0–34内穷举，交集恰为[17]。\n\n### 来源与适用范围\n[2023 技术卷：可见题型与考点](https://www.nowcoder.com/exam/test/55263940/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "D"
      ]
    }
  },
  {
    "id": "gbits-058",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "真假命题：恰有一句为真",
    "question": "**来源边界：【历年考点·原创变式】。** 风格依据为2023 技术卷：可见题型与考点；仅考点类别有历年依据，题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\nA、B、C 三个箱子中恰有一个藏金币。箱 A 上写“金币在 B”；箱 B 上写“金币不在 C”；箱 C 上写“金币不在 B”。已知三句话恰有一句为真。金币在哪？",
    "answer": "### 参考回答\n选 B：若在A，真值为假/真/真，有2真；若在B，为真/真/假，有2真；若在C，为假/假/真，恰1真。\n\n- A（A箱）：有两句为真，不满足。\n- B（C箱）：正确。\n- C（B箱）：有两句为真，不满足。\n- D（无法确定）：穷尽三种位置后只有C成立。\n\n### 评分点\n正确选择 B；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n“恰有一句”为真不是“至少一句”；逐个假设位置比只凭语言直觉可靠。\n\n### 验证\nverify-a.py 穷举3种箱子位置，计算三个布尔式，唯一满足真值数=1的是C箱。\n\n### 来源与适用范围\n[2023 技术卷：可见题型与考点](https://www.nowcoder.com/exam/test/55263940/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "easy",
    "order": 236,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "历年考点·原创变式",
      "逻辑推理"
    ],
    "sourceTitle": "2023 技术卷：可见题型与考点 / 历年考点·原创变式",
    "sourceUrl": "https://www.nowcoder.com/exam/test/55263940/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "A箱"
        },
        {
          "id": "B",
          "text": "C箱"
        },
        {
          "id": "C",
          "text": "B箱"
        },
        {
          "id": "D",
          "text": "无法确定"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 B：若在A，真值为假/真/真，有2真；若在B，为真/真/假，有2真；若在C，为假/假/真，恰1真。\n\n- A（A箱）：有两句为真，不满足。\n- B（C箱）：正确。\n- C（B箱）：有两句为真，不满足。\n- D（无法确定）：穷尽三种位置后只有C成立。\n\n### 评分点\n正确选择 B；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n“恰有一句”为真不是“至少一句”；逐个假设位置比只凭语言直觉可靠。\n\n### 验证\nverify-a.py 穷举3种箱子位置，计算三个布尔式，唯一满足真值数=1的是C箱。\n\n### 来源与适用范围\n[2023 技术卷：可见题型与考点](https://www.nowcoder.com/exam/test/55263940/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-059",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "负数整数除法：余数跟谁的符号",
    "question": "**来源边界：【历年考点·原创变式】。** 风格依据为2018 提前批开发卷：可见题型与考点；仅考点类别有历年依据，题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n按 C++17，以下程序输出什么？所有运算均在 int 可表示范围内。\n\n```cpp\n#include <iostream>\nint main() {\n    int a = -17, b = 5;\n    std::cout << a / b << ' ' << a % b << '\\n';\n}\n```",
    "answer": "### 参考回答\n选 C：`-3 -2`。整数商向零截断，−17/5=−3；由 a=(a/b)×b+a%b 得余数−2。\n\n- A（−4 3）：这是向负无穷取整的商余，不是 C++17。\n- B（−3 2）：不满足商余恒等式。\n- C（−3 −2）：正确。\n- D（−4 −2）：既不满足商规则，也不满足恒等式。\n\n### 评分点\n正确选择 C；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n不要把 Python 的整除/取模规则直接套到 C++；本题除数非零，无最小负数除以−1。\n\n### 验证\nverify-a.py 提取原程序 C++17 编译实跑，输出 −3 −2；对 (商×除数+余数) 反算核对。\n\n### 来源与适用范围\n[2018 提前批开发卷：可见题型与考点](https://www.nowcoder.com/exam/test/11251616/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n语言依据：[C++ draft expr.mul](https://eel.is/c++draft/expr.mul)，该向零截断规则适用于 C++17。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "easy",
    "order": 237,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "历年考点·原创变式",
      "整数运算"
    ],
    "sourceTitle": "2018 提前批开发卷：可见题型与考点 / 历年考点·原创变式",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11251616/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "-4 3"
        },
        {
          "id": "B",
          "text": "-3 2"
        },
        {
          "id": "C",
          "text": "-3 -2"
        },
        {
          "id": "D",
          "text": "-4 -2"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 C：`-3 -2`。整数商向零截断，−17/5=−3；由 a=(a/b)×b+a%b 得余数−2。\n\n- A（−4 3）：这是向负无穷取整的商余，不是 C++17。\n- B（−3 2）：不满足商余恒等式。\n- C（−3 −2）：正确。\n- D（−4 −2）：既不满足商规则，也不满足恒等式。\n\n### 评分点\n正确选择 C；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n不要把 Python 的整除/取模规则直接套到 C++；本题除数非零，无最小负数除以−1。\n\n### 验证\nverify-a.py 提取原程序 C++17 编译实跑，输出 −3 −2；对 (商×除数+余数) 反算核对。\n\n### 来源与适用范围\n[2018 提前批开发卷：可见题型与考点](https://www.nowcoder.com/exam/test/11251616/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n语言依据：[C++ draft expr.mul](https://eel.is/c++draft/expr.mul)，该向零截断规则适用于 C++17。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-060",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "短路求值：没执行的自增",
    "question": "**来源边界：【预测考点·原创训练】。** 本题为备考覆盖预测，没有证据表明该具体考点已在所核看的吉比特卷中出现。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n按 C++17，程序输出什么？逻辑表达式分别在独立的完整表达式中，不存在未排序的读写冲突。\n\n```cpp\n#include <iostream>\nint main() {\n    int x = 0, y = 0;\n    bool a = (x++ != 0) && (++y != 0);\n    bool b = (x++ != 0) || (++y != 0);\n    std::cout << x << ' ' << y << ' ' << a << ' ' << b << '\\n';\n}\n```",
    "answer": "### 参考回答\n选 D：第一句 x++ 得0（假），右边 ++y 不执行，x=1,y=0,a=false。第二句 x++ 得1（真），右边 ++y 不执行，x=2,y=0,b=true。默认 bool 输出为0/1，所以 `2 0 0 1`。\n\n- A：把右操作数都执行，忽略短路。\n- B：漏算第二句对x的后置自增。\n- C：误把后置自增的表达式值当自增后的值。\n- D：正确。\n\n### 评分点\n正确选择 D；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n内置 &&/|| 保证先左后右且短路；本题没有重载运算符。\n\n### 验证\nverify-a.py 提取 JSON 内原程序以 C++17 编译运行，核对完整输出。\n\n### 来源与适用范围\n[C++ 标准草案：逻辑与和逻辑或](https://eel.is/c++draft/expr.log.and)。此链接是技术依据，不是吉比特出题证据。\n另见 [expr.log.or](https://eel.is/c++draft/expr.log.or)。这里只预测语言语义覆盖，不声称历年已出这段程序。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "medium",
    "order": 238,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "预测考点·原创训练",
      "短路求值"
    ],
    "sourceTitle": "C++ 标准草案：逻辑与和逻辑或 / 预测考点·原创训练",
    "sourceUrl": "https://eel.is/c++draft/expr.log.and",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "2 2 1 1"
        },
        {
          "id": "B",
          "text": "1 0 0 1"
        },
        {
          "id": "C",
          "text": "2 1 1 1"
        },
        {
          "id": "D",
          "text": "2 0 0 1"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 D：第一句 x++ 得0（假），右边 ++y 不执行，x=1,y=0,a=false。第二句 x++ 得1（真），右边 ++y 不执行，x=2,y=0,b=true。默认 bool 输出为0/1，所以 `2 0 0 1`。\n\n- A：把右操作数都执行，忽略短路。\n- B：漏算第二句对x的后置自增。\n- C：误把后置自增的表达式值当自增后的值。\n- D：正确。\n\n### 评分点\n正确选择 D；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n内置 &&/|| 保证先左后右且短路；本题没有重载运算符。\n\n### 验证\nverify-a.py 提取 JSON 内原程序以 C++17 编译运行，核对完整输出。\n\n### 来源与适用范围\n[C++ 标准草案：逻辑与和逻辑或](https://eel.is/c++draft/expr.log.and)。此链接是技术依据，不是吉比特出题证据。\n另见 [expr.log.or](https://eel.is/c++draft/expr.log.or)。这里只预测语言语义覆盖，不声称历年已出这段程序。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "D"
      ]
    }
  },
  {
    "id": "gbits-061",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "数组部分初始化与循环累积",
    "question": "**来源边界：【历年考点·原创变式】。** 风格依据为2018 提前批开发卷：可见题型与考点；仅考点类别有历年依据，题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n按 C++17，以下程序输出什么？\n\n```cpp\n#include <iostream>\nint main() {\n    int a[5] = {2, 4};\n    int s = 0;\n    for (int x : a) s = s * 2 + x;\n    std::cout << s << '\\n';\n}\n```",
    "answer": "### 参考回答\n选 A：a为[2,4,0,0,0]。s依次为2、8、16、32、64，输出64。\n\n- A（64）：正确。\n- B（8）：只处理前两项，忽略后续零仍会令s翻倍。\n- C（6）：误写成普通求和。\n- D（未定义行为）：数组余项会零初始化，不是未初始化局部标量。\n\n### 评分点\n正确选择 A；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n剩余元素为零，但循环仍会执行对应轮次。\n\n### 验证\nverify-a.py 从 JSON 提取代码 C++17 编译实跑，输出64。\n\n### 来源与适用范围\n[2018 提前批开发卷：可见题型与考点](https://www.nowcoder.com/exam/test/11251616/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n语言依据：[C++ draft aggregate initialization](https://eel.is/c++draft/dcl.init.aggr)。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "easy",
    "order": 239,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "历年考点·原创变式",
      "数组初始化"
    ],
    "sourceTitle": "2018 提前批开发卷：可见题型与考点 / 历年考点·原创变式",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11251616/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "64"
        },
        {
          "id": "B",
          "text": "8"
        },
        {
          "id": "C",
          "text": "6"
        },
        {
          "id": "D",
          "text": "未定义行为"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 A：a为[2,4,0,0,0]。s依次为2、8、16、32、64，输出64。\n\n- A（64）：正确。\n- B（8）：只处理前两项，忽略后续零仍会令s翻倍。\n- C（6）：误写成普通求和。\n- D（未定义行为）：数组余项会零初始化，不是未初始化局部标量。\n\n### 评分点\n正确选择 A；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n剩余元素为零，但循环仍会执行对应轮次。\n\n### 验证\nverify-a.py 从 JSON 提取代码 C++17 编译实跑，输出64。\n\n### 来源与适用范围\n[2018 提前批开发卷：可见题型与考点](https://www.nowcoder.com/exam/test/11251616/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n语言依据：[C++ draft aggregate initialization](https://eel.is/c++draft/dcl.init.aggr)。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-062",
    "categoryId": "rendering-graphics",
    "type": "single_choice",
    "title": "完全非弹性碰撞：动量守恒而动能减少",
    "question": "**来源边界：【预测考点·原创训练】。** 本题为备考覆盖预测，没有证据表明该具体考点已在所核看的吉比特卷中出现。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n光滑水平直线上，质量2 kg的小车以+3 m/s运动，质量1 kg的小车以−3 m/s运动，碰撞后粘在一起。忽略外力冲量。两车碰撞后共同速度与系统损失的动能分别为？",
    "answer": "### 参考回答\n选 B：总动量2×3+1×(−3)=3 kg·m/s，总质量3 kg，共同速度+1 m/s。初动能 0.5×2×9+0.5×1×9=13.5 J；末动能0.5×3×1=1.5 J，损失12 J。\n\n- A：错误把速度相加抵消而忽略质量。\n- B：正确。\n- C：把完全非弹性碰撞误当动能守恒。\n- D：使用了错误的共同速度。\n\n### 评分点\n正确选择 B；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n负速度带方向；动能用速度平方；无外力冲量保证动量守恒，不保证动能守恒。\n\n### 验证\nverify-a.py 用 Fraction 独立计算动量及初末动能，并反算共同运动动量，结果(+1,12)。\n\n### 来源与适用范围\n[OpenStax：Types of Collisions](https://openstax.org/books/university-physics-volume-1/pages/9-4-types-of-collisions)。此链接是技术依据，不是吉比特出题证据。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "medium",
    "order": 240,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "预测考点·原创训练",
      "力学预测"
    ],
    "sourceTitle": "OpenStax：Types of Collisions / 预测考点·原创训练",
    "sourceUrl": "https://openstax.org/books/university-physics-volume-1/pages/9-4-types-of-collisions",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "0 m/s，13.5 J"
        },
        {
          "id": "B",
          "text": "+1 m/s，12 J"
        },
        {
          "id": "C",
          "text": "+1 m/s，0 J"
        },
        {
          "id": "D",
          "text": "+2 m/s，7.5 J"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n选 B：总动量2×3+1×(−3)=3 kg·m/s，总质量3 kg，共同速度+1 m/s。初动能 0.5×2×9+0.5×1×9=13.5 J；末动能0.5×3×1=1.5 J，损失12 J。\n\n- A：错误把速度相加抵消而忽略质量。\n- B：正确。\n- C：把完全非弹性碰撞误当动能守恒。\n- D：使用了错误的共同速度。\n\n### 评分点\n正确选择 B；能按题目给定规则推导，解释其余选项为何不成立。\n\n### 易错点\n负速度带方向；动能用速度平方；无外力冲量保证动量守恒，不保证动能守恒。\n\n### 验证\nverify-a.py 用 Fraction 独立计算动量及初末动能，并反算共同运动动量，结果(+1,12)。\n\n### 来源与适用范围\n[OpenStax：Types of Collisions](https://openstax.org/books/university-physics-volume-1/pages/9-4-types-of-collisions)。此链接是技术依据，不是吉比特出题证据。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-063",
    "categoryId": "algorithms-datastructures",
    "type": "fill_blank",
    "title": "递归读树：返回值与共享游标",
    "question": "**来源边界：【历年考点·原创变式】。** 风格依据为2023 技术卷：可见题型与考点；仅考点类别有历年依据，题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n字符序列用先序表示二叉树，点号 . 表示空孩子。序列是完整合法编码；根深度为0。程序的三个输出整数分别是多少？按输出顺序填三空。\n\n```cpp\n#include <iostream>\n#include <string>\nint leafDepthSum = 0;\nint readTree(const std::string& s, int& p, int depth) {\n    char c = s[p];\n    ++p;\n    if (c == '.') {\n        return 0;\n    }\n    int left = readTree(s, p, depth + 1);\n    int right = readTree(s, p, depth + 1);\n    if (left == 0 && right == 0) {\n        leafDepthSum += depth;\n    }\n    return 1 + left + right;\n}\nint main() {\n    std::string s = \"AB..CD..E..\";\n    int p = 0;\n    int nodes = readTree(s, p, 0);\n    std::cout << nodes << ' ' << leafDepthSum << ' ' << p << '\\n';\n}\n```",
    "answer": "### 参考回答\n三个空依次为 **5、5、11**。树为A（左B；右C，C的左右为D和E），5个非空节点。叶B深度1，D/E深度2，所以叶深度和5。编码每个字符被读一次，总11字符，最后p=11。\n\n### 评分点\n结果各空正确；能说明状态如何逐步变化，且不混淆下标、引用或循环边界。\n\n### 易错点\np 是引用，左右递归共享消耗位置；空孩子也消耗一个点号；根深度是0。\n\n### 验证\nverify-a.py 对原 JSON C++17 程序实跑；另以 Python 独立解析树形，核对节点、叶深度、耗用字符。\n\n### 来源与适用范围\n[2023 技术卷：可见题型与考点](https://www.nowcoder.com/exam/test/55263940/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "medium",
    "order": 241,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "历年考点·原创变式",
      "递归轨迹"
    ],
    "sourceTitle": "2023 技术卷：可见题型与考点 / 历年考点·原创变式",
    "sourceUrl": "https://www.nowcoder.com/exam/test/55263940/summary",
    "payload": {
      "blanks": [
        {
          "id": "nodes",
          "label": "第1个整数：nodes"
        },
        {
          "id": "depth",
          "label": "第2个整数：leafDepthSum"
        },
        {
          "id": "cursor",
          "label": "第3个整数：p"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n三个空依次为 **5、5、11**。树为A（左B；右C，C的左右为D和E），5个非空节点。叶B深度1，D/E深度2，所以叶深度和5。编码每个字符被读一次，总11字符，最后p=11。\n\n### 评分点\n结果各空正确；能说明状态如何逐步变化，且不混淆下标、引用或循环边界。\n\n### 易错点\np 是引用，左右递归共享消耗位置；空孩子也消耗一个点号；根深度是0。\n\n### 验证\nverify-a.py 对原 JSON C++17 程序实跑；另以 Python 独立解析树形，核对节点、叶深度、耗用字符。\n\n### 来源与适用范围\n[2023 技术卷：可见题型与考点](https://www.nowcoder.com/exam/test/55263940/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "acceptedAnswers": {
        "nodes": [
          "5"
        ],
        "depth": [
          "5"
        ],
        "cursor": [
          "11"
        ]
      }
    }
  },
  {
    "id": "gbits-064",
    "categoryId": "cpp-basics",
    "type": "fill_blank",
    "title": "重叠数组窗口：原地修改如何传递",
    "question": "**来源边界：【历年考点·原创变式】。** 风格依据为2023 技术卷：可见题型与考点；仅考点类别有历年依据，题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\nrotateLeft 将指定窗口循环左移一位，并把移动后的首元素加到引用参数 total。两个窗口位于同一数组中。程序输出的两个整数分别是多少？\n\n```cpp\n#include <iostream>\nvoid rotateLeft(int* p, int n, int& total) {\n    int first = p[0];\n    for (int i = 0; i + 1 < n; ++i) {\n        p[i] = p[i + 1];\n    }\n    p[n - 1] = first;\n    total += p[0];\n}\nint weighted(const int* a, int n) {\n    int result = 0;\n    for (int i = 0; i < n; ++i) {\n        result += (i + 1) * a[i];\n    }\n    return result;\n}\nint main() {\n    int a[] = {2, 4, 6, 8, 10};\n    int total = 0;\n    rotateLeft(a + 1, 3, total);\n    rotateLeft(a, 4, total);\n    std::cout << total << ' ' << weighted(a, 5) << '\\n';\n}\n```",
    "answer": "### 参考回答\n依次填 **12、92**。首轮只旋转原数组下标1–3，得到[2,6,8,4,10]，total=6。第二轮旋转下标0–3，得到[6,8,4,2,10]，total=12。带权和=6+16+12+8+50=92。\n\n### 评分点\n结果各空正确；能说明状态如何逐步变化，且不混淆下标、引用或循环边界。\n\n### 易错点\n第二次操作读取的是第一次修改后的数组；p=a+1 不意味着复制子数组；total由引用累加。\n\n### 验证\nverify-a.py 编译 JSON 原程序；另用 Python 切片旋转模型核对每轮数组与加权和。\n\n### 来源与适用范围\n[2023 技术卷：可见题型与考点](https://www.nowcoder.com/exam/test/55263940/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "medium",
    "order": 242,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "历年考点·原创变式",
      "指针与引用轨迹"
    ],
    "sourceTitle": "2023 技术卷：可见题型与考点 / 历年考点·原创变式",
    "sourceUrl": "https://www.nowcoder.com/exam/test/55263940/summary",
    "payload": {
      "blanks": [
        {
          "id": "total",
          "label": "第1个整数：total"
        },
        {
          "id": "weighted",
          "label": "第2个整数：weighted"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n依次填 **12、92**。首轮只旋转原数组下标1–3，得到[2,6,8,4,10]，total=6。第二轮旋转下标0–3，得到[6,8,4,2,10]，total=12。带权和=6+16+12+8+50=92。\n\n### 评分点\n结果各空正确；能说明状态如何逐步变化，且不混淆下标、引用或循环边界。\n\n### 易错点\n第二次操作读取的是第一次修改后的数组；p=a+1 不意味着复制子数组；total由引用累加。\n\n### 验证\nverify-a.py 编译 JSON 原程序；另用 Python 切片旋转模型核对每轮数组与加权和。\n\n### 来源与适用范围\n[2023 技术卷：可见题型与考点](https://www.nowcoder.com/exam/test/55263940/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "acceptedAnswers": {
        "total": [
          "12"
        ],
        "weighted": [
          "92"
        ]
      }
    }
  },
  {
    "id": "gbits-065",
    "categoryId": "algorithms-datastructures",
    "type": "fill_blank",
    "title": "按层处理：队列长度快照与叶值和",
    "question": "**来源边界：【历年考点·原创变式】。** 风格依据为2018 技术 A 卷：可见题型与考点；仅考点类别有历年依据，题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n下列左右孩子下标数组描述一棵根为0的二叉树，−1表示无孩子。程序输出什么？按输出顺序填两空。\n\n```cpp\n#include <iostream>\n#include <queue>\n#include <algorithm>\nint main() {\n    const int left[] = {1, 3, -1, -1, -1, 6, -1};\n    const int right[] = {2, 4, 5, -1, -1, -1, -1};\n    const int value[] = {4, 2, 7, 5, 1, 3, 6};\n    std::queue<int> q;\n    q.push(0);\n    int maxWidth = 0, leafSum = 0;\n    while (!q.empty()) {\n        int count = static_cast<int>(q.size());\n        maxWidth = std::max(maxWidth, count);\n        for (int i = 0; i < count; ++i) {\n            int u = q.front();\n            q.pop();\n            if (left[u] == -1 && right[u] == -1) {\n                leafSum += value[u];\n            }\n            if (left[u] != -1) q.push(left[u]);\n            if (right[u] != -1) q.push(right[u]);\n        }\n    }\n    std::cout << maxWidth << ' ' << leafSum << '\\n';\n}\n```",
    "answer": "### 参考回答\n依次填 **3、12**。各层节点为[0]、[1,2]、[3,4,5]、[6]，层宽1/2/3/1，最大3。叶节点下标3、4、6，值5+1+6=12。\n\n### 评分点\n结果各空正确；能说明状态如何逐步变化，且不混淆下标、引用或循环边界。\n\n### 易错点\ncount 在每一层开始时固定；不能在 for 条件中持续读取变化的 q.size()。叶是左右孩子都为空。\n\n### 验证\nverify-a.py 编译 JSON 原程序；独立用深度优先遍历的 depth→count 统计层宽及叶和，而非重复队列实现。\n\n### 来源与适用范围\n[2018 技术 A 卷：可见题型与考点](https://www.nowcoder.com/exam/test/11252349/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "medium",
    "order": 243,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "历年考点·原创变式",
      "树遍历轨迹"
    ],
    "sourceTitle": "2018 技术 A 卷：可见题型与考点 / 历年考点·原创变式",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252349/summary",
    "payload": {
      "blanks": [
        {
          "id": "width",
          "label": "第1个整数：maxWidth"
        },
        {
          "id": "leaf",
          "label": "第2个整数：leafSum"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n依次填 **3、12**。各层节点为[0]、[1,2]、[3,4,5]、[6]，层宽1/2/3/1，最大3。叶节点下标3、4、6，值5+1+6=12。\n\n### 评分点\n结果各空正确；能说明状态如何逐步变化，且不混淆下标、引用或循环边界。\n\n### 易错点\ncount 在每一层开始时固定；不能在 for 条件中持续读取变化的 q.size()。叶是左右孩子都为空。\n\n### 验证\nverify-a.py 编译 JSON 原程序；独立用深度优先遍历的 depth→count 统计层宽及叶和，而非重复队列实现。\n\n### 来源与适用范围\n[2018 技术 A 卷：可见题型与考点](https://www.nowcoder.com/exam/test/11252349/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "acceptedAnswers": {
        "width": [
          "3"
        ],
        "leaf": [
          "12"
        ]
      }
    }
  },
  {
    "id": "gbits-066",
    "categoryId": "algorithms-datastructures",
    "type": "fill_blank",
    "title": "插入排序：移动次数与比较次数分开算",
    "question": "**来源边界：【历年考点·原创变式】。** 风格依据为2023 技术卷：可见题型与考点；仅考点类别有历年依据，题面、数值、选项、代码与答案均为本次原创。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n程序中的 moves 只统计向右挪动旧元素的赋值，checks 只统计执行 a[j] <= key 的次数，不包含 j >= 0 的条件判断。输出的两个整数分别是多少？\n\n```cpp\n#include <iostream>\nint main() {\n    int a[] = {5, 2, 4, 2, 1};\n    int moves = 0, checks = 0;\n    for (int i = 1; i < 5; ++i) {\n        int key = a[i];\n        int j = i - 1;\n        while (j >= 0) {\n            ++checks;\n            if (a[j] <= key) {\n                break;\n            }\n            a[j + 1] = a[j];\n            ++moves;\n            --j;\n        }\n        a[j + 1] = key;\n    }\n    std::cout << moves << ' ' << checks << '\\n';\n}\n```",
    "answer": "### 参考回答\n依次填 **8、10**。四轮 key=2/4/2/1 的移动次数为1/1/2/4，合计8；关键字比较次数1/2/3/4，合计10。最终[1,2,2,4,5]。\n\n### 评分点\n结果各空正确；能说明状态如何逐步变化，且不混淆下标、引用或循环边界。\n\n### 易错点\nkey 回填不计 moves；到 j<0 时没有再比较关键字；相等时停止，不额外移动相等元素。\n\n### 验证\nverify-a.py 从 JSON 提取 C++17 原程序实跑，并用独立逆序对计数核对 moves=8；对每轮 trace 核对 checks=10。\n\n### 来源与适用范围\n[2023 技术卷：可见题型与考点](https://www.nowcoder.com/exam/test/55263940/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "medium",
    "order": 244,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "历年考点·原创变式",
      "排序过程"
    ],
    "sourceTitle": "2023 技术卷：可见题型与考点 / 历年考点·原创变式",
    "sourceUrl": "https://www.nowcoder.com/exam/test/55263940/summary",
    "payload": {
      "blanks": [
        {
          "id": "moves",
          "label": "第1个整数：moves"
        },
        {
          "id": "checks",
          "label": "第2个整数：checks"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n依次填 **8、10**。四轮 key=2/4/2/1 的移动次数为1/1/2/4，合计8；关键字比较次数1/2/3/4，合计10。最终[1,2,2,4,5]。\n\n### 评分点\n结果各空正确；能说明状态如何逐步变化，且不混淆下标、引用或循环边界。\n\n### 易错点\nkey 回填不计 moves；到 j<0 时没有再比较关键字；相等时停止，不额外移动相等元素。\n\n### 验证\nverify-a.py 从 JSON 提取 C++17 原程序实跑，并用独立逆序对计数核对 moves=8；对每轮 trace 核对 checks=10。\n\n### 来源与适用范围\n[2023 技术卷：可见题型与考点](https://www.nowcoder.com/exam/test/55263940/summary)。此链接仅证明历年风格和考点，不证明本题为真题。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false,
      "acceptedAnswers": {
        "moves": [
          "8"
        ],
        "checks": [
          "10"
        ]
      }
    }
  },
  {
    "id": "gbits-067",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "阈值消除：删除后继续连锁",
    "question": "**来源边界：【预测考点·原创训练】。** 本题为备考覆盖预测，没有证据表明该具体考点已在所核看的吉比特卷中出现。不是历年原题复刻，也不代表今年考题或官方考纲。\n\n一串小写字母按如下确定规则消除：找到当前字符串中**最靠左的连续 k 个相同字符**，删除这 k 个（若一段超过 k 个，也只删其中最左 k 个）；重新从左找，直到无法删除。输出最终串，空串输出 EMPTY。\n\n### 输入\n第一行整数 k，2≤k≤10；第二行非空小写字母串 s，1≤|s|≤200000。\n\n### 输出\n一行最终字符串或 EMPTY。\n\n### 样例输入\n```text\n3\naabbbacccaa\n```\n\n### 样例输出\n```text\naa\n```\n\n### 样例说明\n先删 bbb 得 aaacccaa，再删最左 aaa 得 cccaa，再删 ccc 得 aa。请给出思路、复杂度和 C++17 实现。",
    "answer": "### 参考回答\n用栈保存处理前缀化简后的字符段（字符、计数），每段计数均小于 k。读到新字符与栈顶相同则计数+1，否则新建段；达到 k 就弹掉该段。弹出后，后续字符可以与暴露的旧段继续合并，覆盖连锁。\n\n不变式：处理任意前缀后，栈表示该前缀按规则删到不能再删的结果。加入一个字符只可能在末端产生新的一组 k 个相同字符，删掉它后，新的连接留待后续字符处理。因此与从左反复消除一致。\n\n时间 O(n)，每个字符只入栈/计数一次；输出总长≤n，额外空间 O(n)。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <string>\n#include <vector>\n#include <utility>\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    int k;\n    std::string s;\n    std::cin >> k >> s;\n    std::vector<std::pair<char, int>> st;\n    for (char c : s) {\n        if (!st.empty() && st.back().first == c) {\n            ++st.back().second;\n        } else {\n            st.push_back({c, 1});\n        }\n        if (st.back().second == k) st.pop_back();\n    }\n    std::string out;\n    for (auto item : st) out.append(item.second, item.first);\n    std::cout << (out.empty() ? \"EMPTY\" : out) << '\\n';\n}\n```\n\n### 评分点\n状态及转移正确；输入输出和边界齐全；复杂度满足约束；代码与题意一致。\n\n### 易错点\n不能只扫描原字符串一次后忽略删除形成的新相邻；不能一次删掉整段超过k的字符，本题只按k的倍数消除。\n\n### 验证\nverify-a.py 编译本题 JSON 中的参考实现，和直接反复扫描最左 k 连字符并删除的独立暴力算法对拍：二元串长度1–9、k=2–5全穷举，再加种子固定的随机串、样例和20万字符边界；故障探针将等于k改成大于k，应被样例/对拍捕获。\n\n### 来源与适用范围\n[NIST：stack（预测训练的技术依据）](https://xlinux.nist.gov/dads/HTML/stack.html)。此链接是技术依据，不是吉比特出题证据。\n本题算法与消除条件均为原创预测，不是2023括号题的复刻；栈机制可迁移，但本题需计数及连锁。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "medium",
    "order": 245,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "预测考点·原创训练",
      "栈与连锁消除"
    ],
    "sourceTitle": "NIST：stack（预测训练的技术依据） / 预测考点·原创训练",
    "sourceUrl": "https://xlinux.nist.gov/dads/HTML/stack.html",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写状态、边界和复杂度，再实现。\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n用栈保存处理前缀化简后的字符段（字符、计数），每段计数均小于 k。读到新字符与栈顶相同则计数+1，否则新建段；达到 k 就弹掉该段。弹出后，后续字符可以与暴露的旧段继续合并，覆盖连锁。\n\n不变式：处理任意前缀后，栈表示该前缀按规则删到不能再删的结果。加入一个字符只可能在末端产生新的一组 k 个相同字符，删掉它后，新的连接留待后续字符处理。因此与从左反复消除一致。\n\n时间 O(n)，每个字符只入栈/计数一次；输出总长≤n，额外空间 O(n)。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <string>\n#include <vector>\n#include <utility>\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    int k;\n    std::string s;\n    std::cin >> k >> s;\n    std::vector<std::pair<char, int>> st;\n    for (char c : s) {\n        if (!st.empty() && st.back().first == c) {\n            ++st.back().second;\n        } else {\n            st.push_back({c, 1});\n        }\n        if (st.back().second == k) st.pop_back();\n    }\n    std::string out;\n    for (auto item : st) out.append(item.second, item.first);\n    std::cout << (out.empty() ? \"EMPTY\" : out) << '\\n';\n}\n```\n\n### 评分点\n状态及转移正确；输入输出和边界齐全；复杂度满足约束；代码与题意一致。\n\n### 易错点\n不能只扫描原字符串一次后忽略删除形成的新相邻；不能一次删掉整段超过k的字符，本题只按k的倍数消除。\n\n### 验证\nverify-a.py 编译本题 JSON 中的参考实现，和直接反复扫描最左 k 连字符并删除的独立暴力算法对拍：二元串长度1–9、k=2–5全穷举，再加种子固定的随机串、样例和20万字符边界；故障探针将等于k改成大于k，应被样例/对拍捕获。\n\n### 来源与适用范围\n[NIST：stack（预测训练的技术依据）](https://xlinux.nist.gov/dads/HTML/stack.html)。此链接是技术依据，不是吉比特出题证据。\n本题算法与消除条件均为原创预测，不是2023括号题的复刻；栈机制可迁移，但本题需计数及连锁。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-068",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "一次破墙机会的网格最短路",
    "question": "**来源边界：【预测考点·原创训练】。** 本题为备考覆盖预测，没有证据表明该具体考点已在所核看的吉比特卷中出现。不是历年原题复刻，也不代表今年考题或官方考纲。\n\nn×m 网格中，. 为可走格，# 为墙。起点(1,1)、终点(n,m)均为 .。每步上下左右移动到相邻格，代价1。全程最多进入一格墙：进入它时使用唯一一次破墙机会。求最少移动步数，无法到达输出−1。可以选择不破墙；1×1的答案为0。\n\n### 输入\n首行 n m，1≤n,m≤200；后续 n 行各 m 个字符，仅含 . 和 #。\n\n### 输出\n一行最少步数或−1。\n\n### 样例输入\n```text\n3 4\n.#..\n###.\n....\n```\n\n### 样例输出\n```text\n5\n```\n\n### 样例说明\n可从(1,1)破开(2,1)，向下到(3,1)，再向右3步；共5步。请给出思路、复杂度和 C++17 实现。",
    "answer": "### 参考回答\nBFS 状态为(x,y,used)，used为是否已经使用破墙机会。走到普通格不改变used；走入墙使used+1，只允许≤1。两个 used 状态分别记录距离，不能仅对坐标记一次访问。所有移动边权为1，BFS首次弹出任一终点状态即得全局最短距离。\n\n总状态≤2nm，每状态至多4条边，时间 O(nm)、空间 O(nm)。距离最多2nm−1，int足够。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <string>\n#include <array>\n#include <queue>\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    int n, m;\n    std::cin >> n >> m;\n    std::vector<std::string> g(n);\n    for (auto& row : g) std::cin >> row;\n    std::vector<std::vector<std::array<int, 2>>> d(\n        n, std::vector<std::array<int, 2>>(m, {-1, -1}));\n    std::queue<std::array<int, 3>> q;\n    d[0][0][0] = 0;\n    q.push({0, 0, 0});\n    const int dx[] = {1, -1, 0, 0};\n    const int dy[] = {0, 0, 1, -1};\n    while (!q.empty()) {\n        auto cur = q.front(); q.pop();\n        int x = cur[0], y = cur[1], used = cur[2];\n        if (x == n - 1 && y == m - 1) {\n            std::cout << d[x][y][used] << '\\n';\n            return 0;\n        }\n        for (int dir = 0; dir < 4; ++dir) {\n            int nx = x + dx[dir], ny = y + dy[dir];\n            if (nx < 0 || nx >= n || ny < 0 || ny >= m) continue;\n            int next = used + (g[nx][ny] == '#');\n            if (next > 1 || d[nx][ny][next] != -1) continue;\n            d[nx][ny][next] = d[x][y][used] + 1;\n            q.push({nx, ny, next});\n        }\n    }\n    std::cout << -1 << '\\n';\n}\n```\n\n### 评分点\n状态及转移正确；输入输出和边界齐全；复杂度满足约束；代码与题意一致。\n\n### 易错点\n同一坐标“已破墙”和“未破墙”是不同状态；起点距离0而不是1。没有代价加权，不能照搬资源增减的逆向DP。\n\n### 验证\nverify-a.py 编译 JSON 参考实现；独立枚举“不拆或拆某一个墙格”后做普通二维最短路取最小值，与状态 BFS 对拍。穷举端点固定的1×1至3×3所有墙配置，再加固定种子随机网格及200×200边界。将破墙上限临时改为0的故障副本必须在样例失败。\n\n### 来源与适用范围\n[NIST：breadth-first search（预测训练技术依据）](https://xlinux.nist.gov/dads/HTML/breadthfirst.html)。此链接是技术依据，不是吉比特出题证据。\n至多破一墙是原创预测拓展；不是所核看的历年网格资源题复刻。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
    "difficulty": "medium",
    "order": 246,
    "tags": [
      "吉比特冲刺预测",
      "冲刺A卷",
      "预测考点·原创训练",
      "BFS状态扩展"
    ],
    "sourceTitle": "NIST：breadth-first search（预测训练技术依据） / 预测考点·原创训练",
    "sourceUrl": "https://xlinux.nist.gov/dads/HTML/breadthfirst.html",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写状态、边界和复杂度，再实现。\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nBFS 状态为(x,y,used)，used为是否已经使用破墙机会。走到普通格不改变used；走入墙使used+1，只允许≤1。两个 used 状态分别记录距离，不能仅对坐标记一次访问。所有移动边权为1，BFS首次弹出任一终点状态即得全局最短距离。\n\n总状态≤2nm，每状态至多4条边，时间 O(nm)、空间 O(nm)。距离最多2nm−1，int足够。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <string>\n#include <array>\n#include <queue>\nint main() {\n    std::ios::sync_with_stdio(false);\n    std::cin.tie(nullptr);\n    int n, m;\n    std::cin >> n >> m;\n    std::vector<std::string> g(n);\n    for (auto& row : g) std::cin >> row;\n    std::vector<std::vector<std::array<int, 2>>> d(\n        n, std::vector<std::array<int, 2>>(m, {-1, -1}));\n    std::queue<std::array<int, 3>> q;\n    d[0][0][0] = 0;\n    q.push({0, 0, 0});\n    const int dx[] = {1, -1, 0, 0};\n    const int dy[] = {0, 0, 1, -1};\n    while (!q.empty()) {\n        auto cur = q.front(); q.pop();\n        int x = cur[0], y = cur[1], used = cur[2];\n        if (x == n - 1 && y == m - 1) {\n            std::cout << d[x][y][used] << '\\n';\n            return 0;\n        }\n        for (int dir = 0; dir < 4; ++dir) {\n            int nx = x + dx[dir], ny = y + dy[dir];\n            if (nx < 0 || nx >= n || ny < 0 || ny >= m) continue;\n            int next = used + (g[nx][ny] == '#');\n            if (next > 1 || d[nx][ny][next] != -1) continue;\n            d[nx][ny][next] = d[x][y][used] + 1;\n            q.push({nx, ny, next});\n        }\n    }\n    std::cout << -1 << '\\n';\n}\n```\n\n### 评分点\n状态及转移正确；输入输出和边界齐全；复杂度满足约束；代码与题意一致。\n\n### 易错点\n同一坐标“已破墙”和“未破墙”是不同状态；起点距离0而不是1。没有代价加权，不能照搬资源增减的逆向DP。\n\n### 验证\nverify-a.py 编译 JSON 参考实现；独立枚举“不拆或拆某一个墙格”后做普通二维最短路取最小值，与状态 BFS 对拍。穷举端点固定的1×1至3×3所有墙配置，再加固定种子随机网格及200×200边界。将破墙上限临时改为0的故障副本必须在样例失败。\n\n### 来源与适用范围\n[NIST：breadth-first search（预测训练技术依据）](https://xlinux.nist.gov/dads/HTML/breadthfirst.html)。此链接是技术依据，不是吉比特出题证据。\n至多破一墙是原创预测拓展；不是所核看的历年网格资源题复刻。\n按本题明确条件作答；C++ 程序按 C++17。模拟中的编程题需对照参考实现自评，不在线编译，也不自动判 AC。",
      "rubricMd": "客观题按唯一答案判定；主观部分按参考回答中的评分点自评，不自动写入掌握度。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-069",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "const 引用看到的是快照吗",
    "question": "**【历年考点·原创变式】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 2023技术卷可见引用相关代码填空；本题原创比较别名与值快照。\n\n下面程序输出什么？\n```cpp\n#include <iostream>\nint main() {\n    int x = 2;\n    const int& observed = x;\n    int snapshot = observed;\n    x += 5;\n    std::cout << observed << \" \" << snapshot;\n}\n```",
    "answer": "### 参考回答\nobserved仍是x的别名，只是不能通过observed修改x；通过非const的x合法修改后读到7。snapshot是独立值2。A把引用当快照；C把值拷贝也当别名；D把只读访问路径误当对象被冻结。\n\n### 评分点\n- 正确选 B\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/55263940/summary)：2023技术卷可见引用相关代码填空；本题原创比较别名与值快照。\n\n[技术依据](https://eel.is/c++draft/dcl.ref)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
    "difficulty": "easy",
    "order": 247,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "历年考点·原创变式",
      "const引用观察"
    ],
    "sourceTitle": "2023技术卷可见引用相关代码填空；本题原创比较别名与值快照。",
    "sourceUrl": "https://www.nowcoder.com/exam/test/55263940/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "2 2"
        },
        {
          "id": "B",
          "text": "7 2"
        },
        {
          "id": "C",
          "text": "7 7"
        },
        {
          "id": "D",
          "text": "无法编译：const引用绑定后x不能修改"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nobserved仍是x的别名，只是不能通过observed修改x；通过非const的x合法修改后读到7。snapshot是独立值2。A把引用当快照；C把值拷贝也当别名；D把只读访问路径误当对象被冻结。\n\n### 评分点\n- 正确选 B\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/55263940/summary)：2023技术卷可见引用相关代码填空；本题原创比较别名与值快照。\n\n[技术依据](https://eel.is/c++draft/dcl.ref)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
      "rubricMd": "- 正确选 B\n- 能说明其他三个选项错误的原因",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-070",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "数组切片中的指针距离",
    "question": "**【预测考点·原创训练】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 历年材料可见数组与短程序，但未找到本题指针距离规则的直接题面证据。\n\n下面程序只在同一个数组内做指针运算，输出是什么？\n```cpp\n#include <iostream>\nint main() {\n    int a[] = {4, 7, 11, 16, 22};\n    int* p = a + 1;\n    int* q = a + 4;\n    std::cout << q - p << \" \" << *(p + 2);\n}\n```",
    "answer": "### 参考回答\n同数组指针相减得到元素个数3，p+2指向下标3的16。A把元素距离误当字节；B漏了一次偏移；D把端点算成闭区间数量。\n\n### 评分点\n- 正确选 C\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[题型或大类参考，非该具体考点的历史证据](https://www.nowcoder.com/exam/test/11251616/summary)：2018 提前批可见数组与短 C/C++ 程序计算；本题为明确同数组边界的原创变式。\n\n[技术依据](https://eel.is/c++draft/expr.add)。代码按 C++17；原题未明规则均以本题明确条件为准。本题标签为预测；以上历年材料只支持题型或大类，不能证明此具体考点曾考过。",
    "difficulty": "easy",
    "order": 248,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "预测考点·原创训练",
      "数组指针"
    ],
    "sourceTitle": "原创预测训练 / 数组指针",
    "sourceUrl": "https://eel.is/c++draft/expr.add",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "12 16"
        },
        {
          "id": "B",
          "text": "3 11"
        },
        {
          "id": "C",
          "text": "3 16"
        },
        {
          "id": "D",
          "text": "4 22"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n同数组指针相减得到元素个数3，p+2指向下标3的16。A把元素距离误当字节；B漏了一次偏移；D把端点算成闭区间数量。\n\n### 评分点\n- 正确选 C\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[题型或大类参考，非该具体考点的历史证据](https://www.nowcoder.com/exam/test/11251616/summary)：2018 提前批可见数组与短 C/C++ 程序计算；本题为明确同数组边界的原创变式。\n\n[技术依据](https://eel.is/c++draft/expr.add)。代码按 C++17；原题未明规则均以本题明确条件为准。本题标签为预测；以上历年材料只支持题型或大类，不能证明此具体考点曾考过。",
      "rubricMd": "- 正确选 C\n- 能说明其他三个选项错误的原因",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-071",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "函数内静态状态的连续调用",
    "question": "**【历年考点·原创变式】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 2017 技术卷与2018提前批可见 static 程序计算，两个样本有重叠，不作为独立频次证据。\n\n下面三次调用写在三个完整语句中，输出是什么？\n```cpp\n#include <iostream>\nint next(int step) {\n    static int total = 2;\n    total += step;\n    return total;\n}\nint main() {\n    int a = next(3);\n    int b = next(-1);\n    int c = next(a);\n    std::cout << a << \" \" << b << \" \" << c;\n}\n```",
    "answer": "### 参考回答\n静态total初始化一次，依次2→5→4→9。A每次重新从2起算；C最后忽略当前4；D忽略静态初值与累计效果。\n\n### 评分点\n- 正确选 B\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/6128323/summary)：2017 技术卷与2018提前批可见 static 程序计算，两个样本有重叠，不作为独立频次证据。\n\n[技术依据](https://eel.is/c++draft/stmt.dcl)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
    "difficulty": "easy",
    "order": 249,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "历年考点·原创变式",
      "static程序阅读"
    ],
    "sourceTitle": "2017 技术卷与2018提前批可见 static 程序计算，两个样本有重叠，不作为独立频次证据。",
    "sourceUrl": "https://www.nowcoder.com/exam/test/6128323/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "5 1 7"
        },
        {
          "id": "B",
          "text": "5 4 9"
        },
        {
          "id": "C",
          "text": "5 4 7"
        },
        {
          "id": "D",
          "text": "3 -1 5"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n静态total初始化一次，依次2→5→4→9。A每次重新从2起算；C最后忽略当前4；D忽略静态初值与累计效果。\n\n### 评分点\n- 正确选 B\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/6128323/summary)：2017 技术卷与2018提前批可见 static 程序计算，两个样本有重叠，不作为独立频次证据。\n\n[技术依据](https://eel.is/c++draft/stmt.dcl)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
      "rubricMd": "- 正确选 B\n- 能说明其他三个选项错误的原因",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-072",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "范围 for 中的值与引用",
    "question": "**【预测考点·原创训练】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 本题是根据基础知识作出的备考预测；未找到该具体考点在已核看吉比特历年题面的直接证据。\n\n下面程序输出什么？\n```cpp\n#include <iostream>\n#include <vector>\nint main() {\n    std::vector<int> a = {1, 2, 3};\n    for (auto x : a) x *= 2;\n    for (auto& x : a) x += 1;\n    std::cout << a[0] << \" \" << a[1] << \" \" << a[2];\n}\n```",
    "answer": "### 参考回答\n第一轮x为每个元素的值副本，不改a；第二轮x为元素引用，把a变成[2,3,4]。A错误认为第一轮也修改原元素；B忽略第二轮；D只执行了本来无效的翻倍。\n\n### 评分点\n- 正确选 C\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n证据标签为预测，不声称历史命中。\n\n[技术依据](https://eel.is/c++draft/stmt.ranged)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
    "difficulty": "easy",
    "order": 250,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "预测考点·原创训练",
      "范围for与引用"
    ],
    "sourceTitle": "原创预测训练 / 范围for与引用",
    "sourceUrl": "https://eel.is/c++draft/stmt.ranged",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "3 5 7"
        },
        {
          "id": "B",
          "text": "1 2 3"
        },
        {
          "id": "C",
          "text": "2 3 4"
        },
        {
          "id": "D",
          "text": "2 4 6"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n第一轮x为每个元素的值副本，不改a；第二轮x为元素引用，把a变成[2,3,4]。A错误认为第一轮也修改原元素；B忽略第二轮；D只执行了本来无效的翻倍。\n\n### 评分点\n- 正确选 C\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n证据标签为预测，不声称历史命中。\n\n[技术依据](https://eel.is/c++draft/stmt.ranged)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
      "rubricMd": "- 正确选 C\n- 能说明其他三个选项错误的原因",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-073",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "switch 的贯穿与 break",
    "question": "**【预测考点·原创训练】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 历年材料可见基础程序阅读，但未找到本题 switch 贯穿规则的直接题面证据。\n\n下面程序输出什么？\n```cpp\n#include <iostream>\nint score(int x) {\n    int s = 0;\n    switch (x) {\n        case 1: s += 2;\n        case 2: s += 3; break;\n        default: s = 9;\n    }\n    return s;\n}\nint main() {\n    int a = score(1);\n    int b = score(2);\n    int c = score(0);\n    std::cout << a << \" \" << b << \" \" << c;\n}\n```",
    "answer": "### 参考回答\ncase1没有break，先加2再贯穿case2加3，得5；case2直接得3；0走default得9。A擅自把case末尾当break；C越过已有break；D把case2也当作先走case1。\n\n### 评分点\n- 正确选 B\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[题型或大类参考，非该具体考点的历史证据](https://www.nowcoder.com/exam/test/11251616/summary)：2018提前批可见分支与循环等短程序阅读；本题原创训练switch贯穿。\n\n[技术依据](https://eel.is/c++draft/stmt.switch)。代码按 C++17；原题未明规则均以本题明确条件为准。本题标签为预测；以上历年材料只支持题型或大类，不能证明此具体考点曾考过。",
    "difficulty": "easy",
    "order": 251,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "预测考点·原创训练",
      "switch贯穿"
    ],
    "sourceTitle": "原创预测训练 / switch贯穿",
    "sourceUrl": "https://eel.is/c++draft/stmt.switch",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "2 3 9"
        },
        {
          "id": "B",
          "text": "5 3 9"
        },
        {
          "id": "C",
          "text": "14 12 9"
        },
        {
          "id": "D",
          "text": "5 5 9"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\ncase1没有break，先加2再贯穿case2加3，得5；case2直接得3；0走default得9。A擅自把case末尾当break；C越过已有break；D把case2也当作先走case1。\n\n### 评分点\n- 正确选 B\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[题型或大类参考，非该具体考点的历史证据](https://www.nowcoder.com/exam/test/11251616/summary)：2018提前批可见分支与循环等短程序阅读；本题原创训练switch贯穿。\n\n[技术依据](https://eel.is/c++draft/stmt.switch)。代码按 C++17；原题未明规则均以本题明确条件为准。本题标签为预测；以上历年材料只支持题型或大类，不能证明此具体考点曾考过。",
      "rubricMd": "- 正确选 B\n- 能说明其他三个选项错误的原因",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-074",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "按升序访问邻点的 BFS 队列",
    "question": "**【历年考点·原创变式】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 2023 技术卷可见图遍历类算法；本题原创固定扫描顺序的队列轨迹。\n\n无向图顶点0–5，边为(0,1),(0,3),(1,2),(1,4),(3,4),(4,5)。从0做BFS，顶点在**入队时**标记，各点邻点按编号升序扫描。出队顺序是哪一项？",
    "answer": "### 参考回答\n0先入1、3；1再入2、4；3遇到已入队4不重复；4入5。故0,1,3,2,4,5。A类似深度优先；C违反升序；D交换了2和4的入队顺序。\n\n### 评分点\n- 正确选 B\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/55263940/summary)：2023 技术卷可见图遍历类算法；本题原创固定扫描顺序的队列轨迹。\n\n[技术依据](https://algs4.cs.princeton.edu/41graph/BreadthFirstPaths.java.html)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
    "difficulty": "medium",
    "order": 252,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "历年考点·原创变式",
      "BFS队列"
    ],
    "sourceTitle": "2023 技术卷可见图遍历类算法；本题原创固定扫描顺序的队列轨迹。",
    "sourceUrl": "https://www.nowcoder.com/exam/test/55263940/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "0,1,2,4,3,5"
        },
        {
          "id": "B",
          "text": "0,1,3,2,4,5"
        },
        {
          "id": "C",
          "text": "0,3,1,4,2,5"
        },
        {
          "id": "D",
          "text": "0,1,3,4,2,5"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n0先入1、3；1再入2、4；3遇到已入队4不重复；4入5。故0,1,3,2,4,5。A类似深度优先；C违反升序；D交换了2和4的入队顺序。\n\n### 评分点\n- 正确选 B\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/55263940/summary)：2023 技术卷可见图遍历类算法；本题原创固定扫描顺序的队列轨迹。\n\n[技术依据](https://algs4.cs.princeton.edu/41graph/BreadthFirstPaths.java.html)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
      "rubricMd": "- 正确选 B\n- 能说明其他三个选项错误的原因",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-075",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "自底向上建堆后的数组",
    "question": "**【历年考点·原创变式】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 2018 B卷可见堆程序、2025回忆含小根堆题；仅用2018 B可见堆考点支持本变式。\n\n用下标从0开始的小根堆。初始数组[9,4,7,1,3]，从最后一个非叶结点向前逐个下沉；每次与较小的孩子交换，直到满足堆序。建堆结束数组是哪项？",
    "answer": "### 参考回答\ni=1时4与1交换得到[9,1,7,4,3]；i=0时9与1，再与3交换，得到[1,3,7,4,9]。C是其他合法堆但不是指定过程结果；B的根右孩子3来自不存在的交换；D结点4大于其孩子3，不满足堆序。\n\n### 评分点\n- 正确选 A\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/11252373/summary)：2018 B卷可见堆程序、2025回忆含小根堆题；仅用2018 B可见堆考点支持本变式。\n\n[技术依据](https://algs4.cs.princeton.edu/24pq/)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
    "difficulty": "medium",
    "order": 253,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "历年考点·原创变式",
      "自底向上建堆"
    ],
    "sourceTitle": "2018 B卷可见堆程序、2025回忆含小根堆题；仅用2018 B可见堆考点支持本变式。",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252373/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "[1,3,7,4,9]"
        },
        {
          "id": "B",
          "text": "[1,4,3,9,7]"
        },
        {
          "id": "C",
          "text": "[1,3,7,9,4]"
        },
        {
          "id": "D",
          "text": "[1,4,7,9,3]"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\ni=1时4与1交换得到[9,1,7,4,3]；i=0时9与1，再与3交换，得到[1,3,7,4,9]。C是其他合法堆但不是指定过程结果；B的根右孩子3来自不存在的交换；D结点4大于其孩子3，不满足堆序。\n\n### 评分点\n- 正确选 A\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/11252373/summary)：2018 B卷可见堆程序、2025回忆含小根堆题；仅用2018 B可见堆考点支持本变式。\n\n[技术依据](https://algs4.cs.princeton.edu/24pq/)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
      "rubricMd": "- 正确选 A\n- 能说明其他三个选项错误的原因",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-076",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "线性探测删除后的查找",
    "question": "**【历年考点·原创变式】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 2018 B卷可见散列查找；本题原创考线性探测删除标记，不复用旧题的泛谈冲突。\n\n散列表长7，h(k)=k mod 7，冲突向右循环探测。依次插入10、17、24，随后删除17。现在查找24时，以下哪种删除设计能保持查找正确，且仍允许“遇从未用过的槽就结束”？",
    "answer": "### 参考回答\n三键依次在3、4、5。删除槽4须留下墓碑，或另做重新散列；在题给查找规则下墓碑可跨过。A破坏哈希起点；B使查找在4过早结束；D原始起点3仍是10。\n\n### 评分点\n- 正确选 C\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/11252373/summary)：2018 B卷可见散列查找；本题原创考线性探测删除标记，不复用旧题的泛谈冲突。\n\n[技术依据](https://algs4.cs.princeton.edu/34hash/)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
    "difficulty": "medium",
    "order": 254,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "历年考点·原创变式",
      "线性探测删除"
    ],
    "sourceTitle": "2018 B卷可见散列查找；本题原创考线性探测删除标记，不复用旧题的泛谈冲突。",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252373/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "把槽3标记为从未用过"
        },
        {
          "id": "B",
          "text": "把槽4标记为从未用过"
        },
        {
          "id": "C",
          "text": "把槽4留下删除标记，查找继续跨过该标记"
        },
        {
          "id": "D",
          "text": "删除17后只检查24的哈希起点就能找到"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n三键依次在3、4、5。删除槽4须留下墓碑，或另做重新散列；在题给查找规则下墓碑可跨过。A破坏哈希起点；B使查找在4过早结束；D原始起点3仍是10。\n\n### 评分点\n- 正确选 C\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/11252373/summary)：2018 B卷可见散列查找；本题原创考线性探测删除标记，不复用旧题的泛谈冲突。\n\n[技术依据](https://algs4.cs.princeton.edu/34hash/)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
      "rubricMd": "- 正确选 C\n- 能说明其他三个选项错误的原因",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-077",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "非负加权图的最短距离",
    "question": "**【预测考点·原创训练】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 本题预测 Dijkstra 与加权最短路；不把历年出现图遍历当作该具体考点的直接证据。\n\n无向图有0–4共5个顶点，6条边。以下三元组为(端点u,端点v,权重w)：\n\n(0,1,4)、(0,2,1)、(2,1,2)、(1,3,1)、(2,3,7)、(3,4,3)。\n\n权重均非负，路径长度为沿途边权之和。用Dijkstra求从0到4的最短路径，其距离是多少？",
    "answer": "### 参考回答\n正确选A，最短路径0→2→1→3→4，总权重1+2+1+3=7。Dijkstra依次确定的最短距离为d(0)=0、d(2)=1、d(1)=3、d(3)=4、d(4)=7。B对应0→1→3→4，虽然边数更少却更重；C对应0→2→3→4；D只是到3的距离，尚未到终点4。\n\n### 评分点\n- 正确选 A\n- 按边权求和而不是按边数\n- 能通过松弛更新1和3的距离\n\n### 易错点\n无权BFS只保证最少边数；本题边权不同。Dijkstra要求非负边权，不能把第一次发现顶点时的暂定距离当成最终距离。\n\n### 验证\nverify-b.py读取本题实际边集，使用Floyd全点对动态规划及枚举全部简单路径两种独立模型，均得0到4距离7；并用错误答案临时副本确认检查会失败。\n\n### 来源与适用范围\n本题标签为预测；没有具体历年题面支持，不声称该Dijkstra过程题曾考过。[算法作者资料](https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/DijkstraUndirectedSP.html)明确非负加权无向图的适用范围。本题给定完整边集，按路径边权总和定义距离。",
    "difficulty": "medium",
    "order": 255,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "预测考点·原创训练",
      "Dijkstra加权最短路"
    ],
    "sourceTitle": "原创预测训练 / Dijkstra非负加权最短路",
    "sourceUrl": "https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/DijkstraUndirectedSP.html",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "7"
        },
        {
          "id": "B",
          "text": "8"
        },
        {
          "id": "C",
          "text": "11"
        },
        {
          "id": "D",
          "text": "4"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n正确选A，最短路径0→2→1→3→4，总权重1+2+1+3=7。Dijkstra依次确定的最短距离为d(0)=0、d(2)=1、d(1)=3、d(3)=4、d(4)=7。B对应0→1→3→4，虽然边数更少却更重；C对应0→2→3→4；D只是到3的距离，尚未到终点4。\n\n### 评分点\n- 正确选 A\n- 按边权求和而不是按边数\n- 能通过松弛更新1和3的距离\n\n### 易错点\n无权BFS只保证最少边数；本题边权不同。Dijkstra要求非负边权，不能把第一次发现顶点时的暂定距离当成最终距离。\n\n### 验证\nverify-b.py读取本题实际边集，使用Floyd全点对动态规划及枚举全部简单路径两种独立模型，均得0到4距离7；并用错误答案临时副本确认检查会失败。\n\n### 来源与适用范围\n本题标签为预测；没有具体历年题面支持，不声称该Dijkstra过程题曾考过。[算法作者资料](https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/DijkstraUndirectedSP.html)明确非负加权无向图的适用范围。本题给定完整边集，按路径边权总和定义距离。",
      "rubricMd": "- 正确选 A\n- 按边权求和而不是按边数\n- 能通过松弛更新1和3的距离",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-078",
    "categoryId": "os-fundamentals",
    "type": "single_choice",
    "title": "可抢占 SRTF 的平均等待时间",
    "question": "**【预测考点·原创训练】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 2018 A/B可见进程调度；这里只据此支持调度大类，不声称原卷使用本题的SRTF条件。\n\n单核**可抢占SRTF（最短剩余时间优先）**，调度开销为0。进程分别为P1(0,7)、P2(2,4)、P3(4,1)，括号为(到达时刻,所需CPU时间)，单位相同。任何新进程到达时，都从已到达且未完成的进程选择剩余时间最短者，可以立即抢占当前进程；剩余时间相同时先选到达更早者。\n\n等待时间=完成时刻−到达时刻−所需CPU时间。三个进程的平均等待时间是多少？",
    "answer": "### 参考回答\n正确选C。执行区间为[0,2)P1、[2,4)P2、[4,5)P3、[5,7)P2、[7,12)P1。三个完成时刻分别为12、7、5，等待时间依次12−0−7=5、7−2−4=1、5−4−1=0，平均(5+1+0)/3=2。A只计P1的5而漏P2等待；B多算等待；D为4也不满足各完成时刻与题给等待公式。\n\n### 评分点\n- 正确选 C\n- t=2和t=4均按更短剩余时间抢占\n- 等待时间包含被抢占后的等待\n\n### 易错点\n这是可抢占SRTF，不能照非抢占SJF让P1一直运行到7；也不能把首次开始时间减到达时间当全部等待时间。\n\n### 验证\nverify-b.py从本题实际进程参数提取到达/服务时间，逐CPU单位重选最短剩余进程，独立模拟完成时刻与平均等待2，并核对完整执行序列。错误答案临时副本必须被拒绝。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/11252373/summary)仅支持进程调度类别。本题的可抢占规则、数值与轨迹是原创训练。[OSTEP调度章节](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf)区分非抢占SJF与加入抢占的STCF/SRTF。规则以本题明示为准，未提供今年正式考试规则。",
    "difficulty": "medium",
    "order": 256,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "预测考点·原创训练",
      "SRTF抢占调度"
    ],
    "sourceTitle": "预测考点·原创训练 / 具体操作未由已读历年材料确认",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252373/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "5/3"
        },
        {
          "id": "B",
          "text": "8/3"
        },
        {
          "id": "C",
          "text": "2"
        },
        {
          "id": "D",
          "text": "4"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n正确选C。执行区间为[0,2)P1、[2,4)P2、[4,5)P3、[5,7)P2、[7,12)P1。三个完成时刻分别为12、7、5，等待时间依次12−0−7=5、7−2−4=1、5−4−1=0，平均(5+1+0)/3=2。A只计P1的5而漏P2等待；B多算等待；D为4也不满足各完成时刻与题给等待公式。\n\n### 评分点\n- 正确选 C\n- t=2和t=4均按更短剩余时间抢占\n- 等待时间包含被抢占后的等待\n\n### 易错点\n这是可抢占SRTF，不能照非抢占SJF让P1一直运行到7；也不能把首次开始时间减到达时间当全部等待时间。\n\n### 验证\nverify-b.py从本题实际进程参数提取到达/服务时间，逐CPU单位重选最短剩余进程，独立模拟完成时刻与平均等待2，并核对完整执行序列。错误答案临时副本必须被拒绝。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/11252373/summary)仅支持进程调度类别。本题的可抢占规则、数值与轨迹是原创训练。[OSTEP调度章节](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf)区分非抢占SJF与加入抢占的STCF/SRTF。规则以本题明示为准，未提供今年正式考试规则。",
      "rubricMd": "- 正确选 C\n- t=2和t=4均按更短剩余时间抢占\n- 等待时间包含被抢占后的等待",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-079",
    "categoryId": "computer-networks",
    "type": "single_choice",
    "title": "TCP 有效窗口内还能发多少新字节",
    "question": "**【历年考点·原创变式】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 2018 B卷与2023技术卷可见TCP基础；本题原创训练发送窗口与在途数据，不声称此数值题曾出现。\n\n忽略序号回绕。发送端最早未确认字节序号为1000，下一个从未发送过的字节序号为1600；当前用于限制发送的有效窗口大小已确定为900字节（可理解为题设已经取好流量/拥塞限制）。暂不重传且尚未收到新ACK，最多还能发送多少**新数据**字节？",
    "answer": "### 参考回答\n已发未确认字节数1600-1000=600；窗口总容量900，剩900-600=300。B把已占用量当剩余；C忽略在途数据；D把窗口与在途量相加。窗口右边界为1900（不含），新发范围1600–1899。\n\n### 评分点\n- 正确选 A\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/11252373/summary)：2018 B卷与2023技术卷可见TCP基础；本题原创训练发送窗口与在途数据，不声称此数值题曾出现。\n\n[技术依据](https://www.rfc-editor.org/rfc/rfc9293.html#section-3.3.1)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
    "difficulty": "medium",
    "order": 257,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "历年考点·原创变式",
      "TCP发送窗口"
    ],
    "sourceTitle": "2018 B卷与2023技术卷可见TCP基础；本题原创训练发送窗口与在途数据，不声称此数值题曾出现。",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252373/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "300"
        },
        {
          "id": "B",
          "text": "600"
        },
        {
          "id": "C",
          "text": "900"
        },
        {
          "id": "D",
          "text": "1500"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n已发未确认字节数1600-1000=600；窗口总容量900，剩900-600=300。B把已占用量当剩余；C忽略在途数据；D把窗口与在途量相加。窗口右边界为1900（不含），新发范围1600–1899。\n\n### 评分点\n- 正确选 A\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/11252373/summary)：2018 B卷与2023技术卷可见TCP基础；本题原创训练发送窗口与在途数据，不声称此数值题曾出现。\n\n[技术依据](https://www.rfc-editor.org/rfc/rfc9293.html#section-3.3.1)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
      "rubricMd": "- 正确选 A\n- 能说明其他三个选项错误的原因",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-080",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "索引树模型的容量",
    "question": "**【预测考点·原创训练】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 本题是根据基础知识作出的备考预测；未找到该具体考点在已核看吉比特历年题面的直接证据。\n\n某索引仅按以下抽象模型计数，不假定任何具体数据库实现：根到叶恰有3条边；每个内部结点恰有4个孩子；每个叶页能存32条索引记录。所有叶页满时能存多少条记录？",
    "answer": "### 参考回答\n3条边意味着叶页数4^3=64，记录64×32=2048。A把分支指数乘成3×4；B少算一层；D多算一层。这是给定模型容量，不等于真实B+树在任意数据下的容量或IO次数。\n\n### 评分点\n- 正确选 C\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n证据标签为预测，不声称历史命中。\n\n[技术依据](https://www.postgresql.org/docs/current/btree.html)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
    "difficulty": "easy",
    "order": 258,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "预测考点·原创训练",
      "数据库索引模型"
    ],
    "sourceTitle": "原创预测训练 / 数据库索引模型",
    "sourceUrl": "https://www.postgresql.org/docs/current/btree.html",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "384"
        },
        {
          "id": "B",
          "text": "512"
        },
        {
          "id": "C",
          "text": "2048"
        },
        {
          "id": "D",
          "text": "8192"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n3条边意味着叶页数4^3=64，记录64×32=2048。A把分支指数乘成3×4；B少算一层；D多算一层。这是给定模型容量，不等于真实B+树在任意数据下的容量或IO次数。\n\n### 评分点\n- 正确选 C\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n证据标签为预测，不声称历史命中。\n\n[技术依据](https://www.postgresql.org/docs/current/btree.html)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
      "rubricMd": "- 正确选 C\n- 能说明其他三个选项错误的原因",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-081",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "两次均匀抽样的最大值期望",
    "question": "**【历年考点·原创变式】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 2018 A卷可见概率与组合计数；本题原创离散最大值期望，原卷没有此具体分布的证据。\n\nX、Y独立且各自等概率取1、2、3、4。M=max(X,Y)，E[M]是多少？",
    "answer": "### 参考回答\n16个有序对等概率；M=k的对数为k²-(k-1)²=2k-1。因此E[M]=(1×1+2×3+3×5+4×7)/16=50/16=25/8。A是单次抽样均值；B把最大值简单取整；D对应52/16，权重求和错误。\n\n### 评分点\n- 正确选 C\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/11252349/summary)：2018 A卷可见概率与组合计数；本题原创离散最大值期望，原卷没有此具体分布的证据。\n\n[技术依据](https://seeing-theory.brown.edu/basic-probability/index.html)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
    "difficulty": "medium",
    "order": 259,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "历年考点·原创变式",
      "离散期望"
    ],
    "sourceTitle": "2018 A卷可见概率与组合计数；本题原创离散最大值期望，原卷没有此具体分布的证据。",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252349/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "5/2"
        },
        {
          "id": "B",
          "text": "3"
        },
        {
          "id": "C",
          "text": "25/8"
        },
        {
          "id": "D",
          "text": "13/4"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n16个有序对等概率；M=k的对数为k²-(k-1)²=2k-1。因此E[M]=(1×1+2×3+3×5+4×7)/16=50/16=25/8。A是单次抽样均值；B把最大值简单取整；D对应52/16，权重求和错误。\n\n### 评分点\n- 正确选 C\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/11252349/summary)：2018 A卷可见概率与组合计数；本题原创离散最大值期望，原卷没有此具体分布的证据。\n\n[技术依据](https://seeing-theory.brown.edu/basic-probability/index.html)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
      "rubricMd": "- 正确选 C\n- 能说明其他三个选项错误的原因",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-082",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "幂的模周期",
    "question": "**【历年考点·原创变式】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 2023技术卷可见模运算；此题原创组合两个幂周期。\n\n求 7^2027 + 3^2027 除以10的余数。",
    "answer": "### 参考回答\n7的末位周期7,9,3,1；2027 mod4=3，得3。3的周期3,9,7,1，第3项7，合10余0。B、C、D均与按4循环得到的3与7不符；可分别按2027次模乘独立排除，不能只看底数相加为10就断言任意指数都余0（偶数指数不是）。\n\n### 评分点\n- 正确选 A\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/55263940/summary)：2023技术卷可见模运算；此题原创组合两个幂周期。\n\n[技术依据](https://mathworld.wolfram.com/Congruence.html)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
    "difficulty": "easy",
    "order": 260,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "历年考点·原创变式",
      "模运算"
    ],
    "sourceTitle": "2023技术卷可见模运算；此题原创组合两个幂周期。",
    "sourceUrl": "https://www.nowcoder.com/exam/test/55263940/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "0"
        },
        {
          "id": "B",
          "text": "2"
        },
        {
          "id": "C",
          "text": "4"
        },
        {
          "id": "D",
          "text": "8"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n7的末位周期7,9,3,1；2027 mod4=3，得3。3的周期3,9,7,1，第3项7，合10余0。B、C、D均与按4循环得到的3与7不符；可分别按2027次模乘独立排除，不能只看底数相加为10就断言任意指数都余0（偶数指数不是）。\n\n### 评分点\n- 正确选 A\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/55263940/summary)：2023技术卷可见模运算；此题原创组合两个幂周期。\n\n[技术依据](https://mathworld.wolfram.com/Congruence.html)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
      "rubricMd": "- 正确选 A\n- 能说明其他三个选项错误的原因",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-083",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "相同任务分配到不同机器",
    "question": "**【历年考点·原创变式】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 2018 A卷可见组合计数；本题原创强调相同任务与机器可区分。\n\n5个完全相同任务分给3台不同机器，每台至少1个，任务不可分，顺序不计。分配方案数是多少？",
    "answer": "### 参考回答\n设xi≥1且x1+x2+x3=5，先各放1，余2个分3台；隔板法C(4,2)=6。B、C、D分别给出10、15、25，都不等于正整数解数6；允许空机器会得到C(7,2)=21，把任务当不同对象会得到150，二者也都不符合题意。可以枚举(1,1,3)的3个排列和(1,2,2)的3个排列直接排除所有干扰项。\n\n### 评分点\n- 正确选 A\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/11252349/summary)：2018 A卷可见组合计数；本题原创强调相同任务与机器可区分。\n\n[技术依据](https://mathworld.wolfram.com/StarsandBars.html)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
    "difficulty": "easy",
    "order": 261,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "历年考点·原创变式",
      "组合计数"
    ],
    "sourceTitle": "2018 A卷可见组合计数；本题原创强调相同任务与机器可区分。",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252349/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "6"
        },
        {
          "id": "B",
          "text": "10"
        },
        {
          "id": "C",
          "text": "15"
        },
        {
          "id": "D",
          "text": "25"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n设xi≥1且x1+x2+x3=5，先各放1，余2个分3台；隔板法C(4,2)=6。B、C、D分别给出10、15、25，都不等于正整数解数6；允许空机器会得到C(7,2)=21，把任务当不同对象会得到150，二者也都不符合题意。可以枚举(1,1,3)的3个排列和(1,2,2)的3个排列直接排除所有干扰项。\n\n### 评分点\n- 正确选 A\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/exam/test/11252349/summary)：2018 A卷可见组合计数；本题原创强调相同任务与机器可区分。\n\n[技术依据](https://mathworld.wolfram.com/StarsandBars.html)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
      "rubricMd": "- 正确选 A\n- 能说明其他三个选项错误的原因",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-084",
    "categoryId": "rendering-graphics",
    "type": "single_choice",
    "title": "单位法线上的完全镜面反射",
    "question": "**【预测考点·原创训练】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 本题是根据基础知识作出的备考预测；未找到该具体考点在已核看吉比特历年题面的直接证据。\n\n二维速度v=(3,-4)碰到水平墙，指向可行区域的单位法线n=(0,1)。完全弹性且无摩擦，使用r=v-2(v·n)n。反射速度r是多少？",
    "answer": "### 参考回答\nv·n=-4，减去(0,-8)得(3,4)。切向x保持，法向y反向。A额外反转切向；C未反射；D只反转切向。\n\n### 评分点\n- 正确选 B\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n证据标签为预测，不声称历史命中。\n\n[技术依据](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Vector3.Reflect.html)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
    "difficulty": "easy",
    "order": 262,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "预测考点·原创训练",
      "向量反射"
    ],
    "sourceTitle": "原创预测训练 / 向量反射",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Vector3.Reflect.html",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "(-3,4)"
        },
        {
          "id": "B",
          "text": "(3,4)"
        },
        {
          "id": "C",
          "text": "(3,-4)"
        },
        {
          "id": "D",
          "text": "(-3,-4)"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nv·n=-4，减去(0,-8)得(3,4)。切向x保持，法向y反向。A额外反转切向；C未反射；D只反转切向。\n\n### 评分点\n- 正确选 B\n- 能说明其他三个选项错误的原因\n\n### 易错点\n不要把手算顺序、标准保证和实现细节混为一谈。\n\n### 验证\n有代码的题由 verify-b.py 提取题干 C++17 编译执行；其余按解答所列独立计算核对。\n\n### 来源与适用范围\n证据标签为预测，不声称历史命中。\n\n[技术依据](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Vector3.Reflect.html)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
      "rubricMd": "- 正确选 B\n- 能说明其他三个选项错误的原因",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-085",
    "categoryId": "cpp-basics",
    "type": "fill_blank",
    "title": "三次局部反转后的数组输出",
    "question": "**【预测考点·原创训练】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 2024亲历仅确认两道程序输出填空，未公开程序；数组三次反转是原创预测考点。\n\n逐句执行下面程序，填写唯一一行输出（两个整数以空格隔开）。\n```cpp\n#include <iostream>\n#include <vector>\nusing namespace std;\nvoid reverseRange(vector<int>& a, int l, int r) {\n    while (l < r) {\n        int t = a[l];\n        a[l] = a[r];\n        a[r] = t;\n        ++l;\n        --r;\n    }\n}\nint main() {\n    vector<int> a = {2, 4, 6, 8, 10, 12};\n    int k = 2;\n    reverseRange(a, 0, k - 1);\n    reverseRange(a, k, static_cast<int>(a.size()) - 1);\n    reverseRange(a, 0, static_cast<int>(a.size()) - 1);\n    int value = 0;\n    for (int i = 0; i < 3; ++i) {\n        value = value * 10 + a[i] / 2;\n    }\n    cout << value << \" \" << a.back();\n}\n```",
    "answer": "### 参考回答\n输出 `345 4`。三次反转把前2项移到末尾：最终[6,8,10,12,2,4]，前三项除2依次3,4,5，拼成345。\n\n### 评分点\n- 数组最终顺序正确\n- 拼接结果与末尾值都正确\n\n### 易错点\n第二段反转不包含前k项；最后反转整个数组，不能把它误看成右移2位。\n\n### 验证\nverify-b.py直接提取题干代码，C++17编译执行并与acceptedAnswers逐项核对。\n\n### 来源与适用范围\n[题型或大类参考，非该具体考点的历史证据](https://www.nowcoder.com/feed/main/detail/5740c288da3140d3878f04dc3382073e)：2024客户端亲历明确两道程序输出填空，未公开原程序；本题仅仿照输出题型，数组反转内容为原创。\n\n[技术依据](https://eel.is/c++draft/expr.add)。代码按 C++17；原题未明规则均以本题明确条件为准。本题标签为预测；以上历年材料只支持题型或大类，不能证明此具体考点曾考过。",
    "difficulty": "medium",
    "order": 263,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "预测考点·原创训练",
      "数组程序阅读"
    ],
    "sourceTitle": "原创预测训练 / 数组程序阅读",
    "sourceUrl": "https://eel.is/c++draft/expr.add",
    "payload": {
      "blanks": [
        {
          "id": "out",
          "label": "整行输出"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n输出 `345 4`。三次反转把前2项移到末尾：最终[6,8,10,12,2,4]，前三项除2依次3,4,5，拼成345。\n\n### 评分点\n- 数组最终顺序正确\n- 拼接结果与末尾值都正确\n\n### 易错点\n第二段反转不包含前k项；最后反转整个数组，不能把它误看成右移2位。\n\n### 验证\nverify-b.py直接提取题干代码，C++17编译执行并与acceptedAnswers逐项核对。\n\n### 来源与适用范围\n[题型或大类参考，非该具体考点的历史证据](https://www.nowcoder.com/feed/main/detail/5740c288da3140d3878f04dc3382073e)：2024客户端亲历明确两道程序输出填空，未公开原程序；本题仅仿照输出题型，数组反转内容为原创。\n\n[技术依据](https://eel.is/c++draft/expr.add)。代码按 C++17；原题未明规则均以本题明确条件为准。本题标签为预测；以上历年材料只支持题型或大类，不能证明此具体考点曾考过。",
      "rubricMd": "- 数组最终顺序正确\n- 拼接结果与末尾值都正确",
      "explanationMd": "",
      "caseSensitive": false,
      "acceptedAnswers": {
        "out": [
          "345 4"
        ]
      }
    }
  },
  {
    "id": "gbits-086",
    "categoryId": "cpp-basics",
    "type": "fill_blank",
    "title": "过滤字符后重新计算连续段",
    "question": "**【预测考点·原创训练】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 2024亲历仅确认两道程序输出填空，未公开程序；过滤后分组计数是原创预测考点。\n\n填写下面程序的整行输出（三个整数以空格隔开）。引用参数 longest 会在函数内赋值。\n```cpp\n#include <iostream>\n#include <string>\nusing namespace std;\nstring compact(const string& s, char skip) {\n    string t;\n    for (char c : s) {\n        if (c != skip) t.push_back(c);\n    }\n    return t;\n}\nint groups(const string& s, int& longest) {\n    int count = 0;\n    int run = 0;\n    longest = 0;\n    for (int i = 0; i < static_cast<int>(s.size()); ++i) {\n        if (i == 0 || s[i] != s[i - 1]) {\n            ++count;\n            run = 1;\n        } else {\n            ++run;\n        }\n        if (run > longest) longest = run;\n    }\n    return count;\n}\nint main() {\n    string t = compact(\"a#abb##aa#b\", '#');\n    int best;\n    int n = groups(t, best);\n    cout << n << \" \" << best << \" \" << t.size();\n}\n```",
    "answer": "### 参考回答\n输出 `4 2 7`。过滤得到aabbaab，连续段依次aa、bb、aa、b，共4段；最长2，长度7。\n\n### 评分点\n- 先过滤再分段\n- 正确处理引用输出参数\n- 三个数正确\n\n### 易错点\n删掉字符可能把原本隔开的同字符连接起来；最长段不是某字符出现总次数。\n\n### 验证\nverify-b.py直接提取C++17代码运行。独立字符串分组模型核对4段、最长2、总长7。\n\n### 来源与适用范围\n[题型或大类参考，非该具体考点的历史证据](https://www.nowcoder.com/feed/main/detail/5740c288da3140d3878f04dc3382073e)：2024客户端亲历明确两道程序输出填空；没有原程序证据，本题只参考题型，字符串分组为原创。\n\n[技术依据](https://eel.is/c++draft/dcl.ref)。代码按 C++17；原题未明规则均以本题明确条件为准。本题标签为预测；以上历年材料只支持题型或大类，不能证明此具体考点曾考过。",
    "difficulty": "medium",
    "order": 264,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "预测考点·原创训练",
      "字符串程序阅读"
    ],
    "sourceTitle": "原创预测训练 / 字符串程序阅读",
    "sourceUrl": "https://eel.is/c++draft/dcl.ref",
    "payload": {
      "blanks": [
        {
          "id": "out",
          "label": "整行输出"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n输出 `4 2 7`。过滤得到aabbaab，连续段依次aa、bb、aa、b，共4段；最长2，长度7。\n\n### 评分点\n- 先过滤再分段\n- 正确处理引用输出参数\n- 三个数正确\n\n### 易错点\n删掉字符可能把原本隔开的同字符连接起来；最长段不是某字符出现总次数。\n\n### 验证\nverify-b.py直接提取C++17代码运行。独立字符串分组模型核对4段、最长2、总长7。\n\n### 来源与适用范围\n[题型或大类参考，非该具体考点的历史证据](https://www.nowcoder.com/feed/main/detail/5740c288da3140d3878f04dc3382073e)：2024客户端亲历明确两道程序输出填空；没有原程序证据，本题只参考题型，字符串分组为原创。\n\n[技术依据](https://eel.is/c++draft/dcl.ref)。代码按 C++17；原题未明规则均以本题明确条件为准。本题标签为预测；以上历年材料只支持题型或大类，不能证明此具体考点曾考过。",
      "rubricMd": "- 先过滤再分段\n- 正确处理引用输出参数\n- 三个数正确",
      "explanationMd": "",
      "caseSensitive": false,
      "acceptedAnswers": {
        "out": [
          "4 2 7"
        ]
      }
    }
  },
  {
    "id": "gbits-087",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "不同进制带符号长整数的精确比较",
    "question": "**【历年考点·原创变式】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 2024客户端第一手回忆包含不同进制数比较；带符号、前导零归一、超64位是本题原创预测拓展，不声称原题包含这些条件。\n\n精确比较两个不同进制的**带符号长整数**。每个数可带一个前导+或-，其后至少一位数字；也可不带符号，允许前导零。进制2–10，各位均为合法数字。去掉符号后1–200位。`-000`与`+0`都表示零。不能假设值能装进64位整数。\n\n### 输入\n首行T（1≤T≤100）。之后每行 `b1 s1 b2 s2`，分别为两个进制和对应整数串。\n\n### 输出\n每组一行 `<`、`=` 或 `>`。\n\n### 样例输入\n```text\n4\n2 -101 10 -4\n8 +0017 10 15\n2 -000 10 +0\n10 99999999999999999999 2 11111111\n```\n\n### 样例输出\n```text\n<\n=\n=\n>\n```\n\n请给出复杂度与C++17实现。",
    "answer": "### 参考回答\n先分离符号；把绝对值按value=value×base+digit逐位累积到自写非负大整数中。所有零统一为sign=0。异号按-1<0<1比较；同为正按绝对值比较，同为负反转绝对值结果。用10^9进位数组，单次小整数乘法中间值小于10^10，uint64_t足够。\n\n时间O(L²)，空间O(L)，L为数字长度上界，按每组计。\n\n### C++17参考实现\n```cpp\n#include <iostream>\n#include <string>\n#include <vector>\n#include <cstdint>\nusing namespace std;\nusing Big = vector<uint64_t>;\nconst uint64_t BASE = 1000000000ULL;\nstruct Number { int sign; Big magnitude; };\nNumber parse(string s, int base) {\n    int sign = 1;\n    size_t pos = 0;\n    if (s[0] == '+' || s[0] == '-') {\n        sign = s[0] == '-' ? -1 : 1;\n        pos = 1;\n    }\n    Big a(1, 0);\n    for (; pos < s.size(); ++pos) {\n        uint64_t carry = s[pos] - '0';\n        for (auto& x : a) {\n            uint64_t cur = x * base + carry;\n            x = cur % BASE;\n            carry = cur / BASE;\n        }\n        if (carry) a.push_back(carry);\n    }\n    while (a.size() > 1 && a.back() == 0) a.pop_back();\n    if (a.size() == 1 && a[0] == 0) sign = 0;\n    return {sign, a};\n}\nint compareMagnitude(const Big& a, const Big& b) {\n    if (a.size() != b.size()) return a.size() < b.size() ? -1 : 1;\n    for (int i = static_cast<int>(a.size()) - 1; i >= 0; --i)\n        if (a[i] != b[i]) return a[i] < b[i] ? -1 : 1;\n    return 0;\n}\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int t; cin >> t;\n    while (t--) {\n        int b1,b2; string s1,s2; cin >> b1 >> s1 >> b2 >> s2;\n        Number a=parse(s1,b1), b=parse(s2,b2);\n        int cmp;\n        if (a.sign != b.sign) cmp = a.sign < b.sign ? -1 : 1;\n        else if (a.sign == 0) cmp = 0;\n        else cmp = a.sign * compareMagnitude(a.magnitude,b.magnitude);\n        cout << (cmp < 0 ? \"<\" : cmp > 0 ? \">\" : \"=\") << '\\n';\n    }\n}\n```\n\n### 评分点\n- 不依赖64位能容纳整个数\n- 转换进制正确\n- 负数比较反向、负零归一正确\n- 前导零与相等情况正确\n\n### 易错点\n不能按原字符串长度比较不同进制；两负数绝对值越大反而越小；-0不能小于0。\n\n### 验证\nverify-b.py提取本参考代码，和Python任意精度int解析的独立模型做固定边界、固定种子随机对拍，并执行样例。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/feed/main/detail/5740c288da3140d3878f04dc3382073e)：2024客户端第一手回忆包含不同进制数比较；带符号、前导零归一、超64位是本题原创预测拓展，不声称原题包含这些条件。\n\n[技术依据](https://gmplib.org/manual/Integer-Functions)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
    "difficulty": "medium",
    "order": 265,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "历年考点·原创变式",
      "进制与大整数"
    ],
    "sourceTitle": "2024客户端第一手回忆包含不同进制数比较；带符号、前导零归一、超64位是本题原创预测拓展，不声称原题包含这些条件。",
    "sourceUrl": "https://www.nowcoder.com/feed/main/detail/5740c288da3140d3878f04dc3382073e",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：请实现 main，按题面标准输入输出。\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n先分离符号；把绝对值按value=value×base+digit逐位累积到自写非负大整数中。所有零统一为sign=0。异号按-1<0<1比较；同为正按绝对值比较，同为负反转绝对值结果。用10^9进位数组，单次小整数乘法中间值小于10^10，uint64_t足够。\n\n时间O(L²)，空间O(L)，L为数字长度上界，按每组计。\n\n### C++17参考实现\n```cpp\n#include <iostream>\n#include <string>\n#include <vector>\n#include <cstdint>\nusing namespace std;\nusing Big = vector<uint64_t>;\nconst uint64_t BASE = 1000000000ULL;\nstruct Number { int sign; Big magnitude; };\nNumber parse(string s, int base) {\n    int sign = 1;\n    size_t pos = 0;\n    if (s[0] == '+' || s[0] == '-') {\n        sign = s[0] == '-' ? -1 : 1;\n        pos = 1;\n    }\n    Big a(1, 0);\n    for (; pos < s.size(); ++pos) {\n        uint64_t carry = s[pos] - '0';\n        for (auto& x : a) {\n            uint64_t cur = x * base + carry;\n            x = cur % BASE;\n            carry = cur / BASE;\n        }\n        if (carry) a.push_back(carry);\n    }\n    while (a.size() > 1 && a.back() == 0) a.pop_back();\n    if (a.size() == 1 && a[0] == 0) sign = 0;\n    return {sign, a};\n}\nint compareMagnitude(const Big& a, const Big& b) {\n    if (a.size() != b.size()) return a.size() < b.size() ? -1 : 1;\n    for (int i = static_cast<int>(a.size()) - 1; i >= 0; --i)\n        if (a[i] != b[i]) return a[i] < b[i] ? -1 : 1;\n    return 0;\n}\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int t; cin >> t;\n    while (t--) {\n        int b1,b2; string s1,s2; cin >> b1 >> s1 >> b2 >> s2;\n        Number a=parse(s1,b1), b=parse(s2,b2);\n        int cmp;\n        if (a.sign != b.sign) cmp = a.sign < b.sign ? -1 : 1;\n        else if (a.sign == 0) cmp = 0;\n        else cmp = a.sign * compareMagnitude(a.magnitude,b.magnitude);\n        cout << (cmp < 0 ? \"<\" : cmp > 0 ? \">\" : \"=\") << '\\n';\n    }\n}\n```\n\n### 评分点\n- 不依赖64位能容纳整个数\n- 转换进制正确\n- 负数比较反向、负零归一正确\n- 前导零与相等情况正确\n\n### 易错点\n不能按原字符串长度比较不同进制；两负数绝对值越大反而越小；-0不能小于0。\n\n### 验证\nverify-b.py提取本参考代码，和Python任意精度int解析的独立模型做固定边界、固定种子随机对拍，并执行样例。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/feed/main/detail/5740c288da3140d3878f04dc3382073e)：2024客户端第一手回忆包含不同进制数比较；带符号、前导零归一、超64位是本题原创预测拓展，不声称原题包含这些条件。\n\n[技术依据](https://gmplib.org/manual/Integer-Functions)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
      "rubricMd": "- 不依赖64位能容纳整个数\n- 转换进制正确\n- 负数比较反向、负零归一正确\n- 前导零与相等情况正确",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-088",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "带一次半伤护盾的最低初始资源",
    "question": "**【历年考点·原创变式】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 2024客户端第一手回忆包含右/下网格最低初始资源；一次半伤护盾为原创预测拓展，不是历年原题条件。\n\nn×m整数格子，左上角起步，每次只能向右或向下，最终到右下角。初始资源为正整数；**起点和终点都必须结算**，进入每格把格子值加到资源上，结算后始终至少为1。\n\n你有一次可选护盾：在结算任意一个负值格子前使用，把该格损耗L减少为floor(L/2)，例如-5变成-2，-1变成0。护盾最多用一次，也可不用。求最小初始资源。\n\n### 输入\n首行n m（1≤n,m≤200）。随后n行，每行m个整数，-10^6≤a[i][j]≤10^6。\n\n### 输出\n最小初始资源，一个整数。\n\n### 样例输入\n```text\n2 2\n-5 -8\n-2 -3\n```\n\n### 样例输出\n```text\n8\n```\n\n最优向下再向右，在起点用护盾，累计资源变化-2,-4,-7，初值8恰好合法。\n",
    "answer": "### 参考回答\n逆向DP。dp[i][j][0]表示进入当前格前护盾已用完所需资源；dp[i][j][1]表示护盾尚可用。分别取右/下邻居相同状态的最小需求next[k]；不使用护盾时max(1,next[k]-a)。当前负格使用护盾则转入已用状态：max(1,next[0]-a/2)，与保留护盾取小。终点后需求设为1。\n\n时间O(nm)，空间O(nm)，使用long long。\n\n### C++17参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <array>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n,m; cin >> n >> m;\n    vector<vector<long long>> a(n, vector<long long>(m));\n    for (auto& row : a) for (auto& x : row) cin >> x;\n    const long long INF = (1LL << 60);\n    vector<vector<array<long long,2>>> dp(n, vector<array<long long,2>>(m));\n    for (int i=n-1; i>=0; --i) for (int j=m-1; j>=0; --j) {\n        long long next[2] = {INF, INF};\n        if (i==n-1 && j==m-1) next[0] = next[1] = 1;\n        else for (int k=0; k<2; ++k) {\n            if (i+1<n) next[k] = min(next[k], dp[i+1][j][k]);\n            if (j+1<m) next[k] = min(next[k], dp[i][j+1][k]);\n        }\n        dp[i][j][0] = max(1LL, next[0] - a[i][j]);\n        dp[i][j][1] = max(1LL, next[1] - a[i][j]);\n        if (a[i][j] < 0)\n            dp[i][j][1] = min(dp[i][j][1], max(1LL, next[0] - a[i][j]/2));\n    }\n    cout << dp[0][0][1] << '\\n';\n}\n```\n\n### 评分点\n- DP状态区分护盾可用/已用\n- 逆向需求与始终至少1正确\n- 起点、终点与负奇数半伤规则正确\n- 合并路径时分别按护盾状态选择后继\n\n### 易错点\n不能只求路径总和；中途资源也须正。C++17负数整数除法向零截断，负格a/2正好是负的floor(L/2)。\n\n### 验证\nverify-b.py枚举小网格所有右下路径及每个护盾位置，以前缀最小值算初值，对参考DP随机对拍；另验大规模边界。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/feed/main/detail/5740c288da3140d3878f04dc3382073e)：2024客户端第一手回忆包含右/下网格最低初始资源；一次半伤护盾为原创预测拓展，不是历年原题条件。\n\n[技术依据](https://eel.is/c++draft/expr.mul)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
    "difficulty": "medium",
    "order": 266,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "历年考点·原创变式",
      "二维动态规划"
    ],
    "sourceTitle": "2024客户端第一手回忆包含右/下网格最低初始资源；一次半伤护盾为原创预测拓展，不是历年原题条件。",
    "sourceUrl": "https://www.nowcoder.com/feed/main/detail/5740c288da3140d3878f04dc3382073e",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：请实现 main，按题面标准输入输出。\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n逆向DP。dp[i][j][0]表示进入当前格前护盾已用完所需资源；dp[i][j][1]表示护盾尚可用。分别取右/下邻居相同状态的最小需求next[k]；不使用护盾时max(1,next[k]-a)。当前负格使用护盾则转入已用状态：max(1,next[0]-a/2)，与保留护盾取小。终点后需求设为1。\n\n时间O(nm)，空间O(nm)，使用long long。\n\n### C++17参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <array>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n,m; cin >> n >> m;\n    vector<vector<long long>> a(n, vector<long long>(m));\n    for (auto& row : a) for (auto& x : row) cin >> x;\n    const long long INF = (1LL << 60);\n    vector<vector<array<long long,2>>> dp(n, vector<array<long long,2>>(m));\n    for (int i=n-1; i>=0; --i) for (int j=m-1; j>=0; --j) {\n        long long next[2] = {INF, INF};\n        if (i==n-1 && j==m-1) next[0] = next[1] = 1;\n        else for (int k=0; k<2; ++k) {\n            if (i+1<n) next[k] = min(next[k], dp[i+1][j][k]);\n            if (j+1<m) next[k] = min(next[k], dp[i][j+1][k]);\n        }\n        dp[i][j][0] = max(1LL, next[0] - a[i][j]);\n        dp[i][j][1] = max(1LL, next[1] - a[i][j]);\n        if (a[i][j] < 0)\n            dp[i][j][1] = min(dp[i][j][1], max(1LL, next[0] - a[i][j]/2));\n    }\n    cout << dp[0][0][1] << '\\n';\n}\n```\n\n### 评分点\n- DP状态区分护盾可用/已用\n- 逆向需求与始终至少1正确\n- 起点、终点与负奇数半伤规则正确\n- 合并路径时分别按护盾状态选择后继\n\n### 易错点\n不能只求路径总和；中途资源也须正。C++17负数整数除法向零截断，负格a/2正好是负的floor(L/2)。\n\n### 验证\nverify-b.py枚举小网格所有右下路径及每个护盾位置，以前缀最小值算初值，对参考DP随机对拍；另验大规模边界。\n\n### 来源与适用范围\n[历年风格与考点依据](https://www.nowcoder.com/feed/main/detail/5740c288da3140d3878f04dc3382073e)：2024客户端第一手回忆包含右/下网格最低初始资源；一次半伤护盾为原创预测拓展，不是历年原题条件。\n\n[技术依据](https://eel.is/c++draft/expr.mul)。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
      "rubricMd": "- DP状态区分护盾可用/已用\n- 逆向需求与始终至少1正确\n- 起点、终点与负奇数半伤规则正确\n- 合并路径时分别按护盾状态选择后继",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-089",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "最长无重复子串及最优起点数量",
    "question": "**【预测考点·原创训练】来源边界：本题为原创冲刺训练，不是真题原文，也不是今年已考题。** 本题是根据基础知识作出的备考预测；未找到该具体考点在已核看吉比特历年题面的直接证据。\n\n给定仅含小写英文字母的非空字符串，求不含重复字符的连续子串的最大长度L，并统计有多少个不同起始位置能得到长度L的不重复子串。相同内容但起始位置不同也分别计数。\n\n### 输入\n首行T（1≤T≤20）。随后每行一个字符串，单串长度1–200000，所有串长度之和≤400000。\n\n### 输出\n每组一行 `L count`。\n\n### 样例输入\n```text\n3\nabca\naaaa\nabcabcbb\n```\n\n### 样例输出\n```text\n3 2\n1 4\n3 4\n```\n",
    "answer": "### 参考回答\n维护当前无重复后缀[left,right]与每字符上次位置last。读入c时left=max(left,last[c]+1)，然后更新last。每个右端点的最长无重复后缀若刷新全局长度则计数重置1，相同则计数加1。每个最长子串有唯一右端点，故不会重复计数。\n\n时间O(|s|)，额外空间O(26)。\n\n### C++17参考实现\n```cpp\n#include <iostream>\n#include <string>\n#include <array>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int t; cin >> t;\n    while (t--) {\n        string s; cin >> s;\n        array<int,26> last; last.fill(-1);\n        int left=0, best=0, count=0;\n        for (int right=0; right<static_cast<int>(s.size()); ++right) {\n            int c=s[right]-'a';\n            left=max(left,last[c]+1);\n            last[c]=right;\n            int len=right-left+1;\n            if (len>best) { best=len; count=1; }\n            else if (len==best) ++count;\n        }\n        cout << best << ' ' << count << '\\n';\n    }\n}\n```\n\n### 评分点\n- left单调不后退，last初始化为-1\n- 更新全局最优时重置计数，相等累加\n- 起点计数而不是去重子串内容\n- 线性复杂度\n\n### 易错点\n看到重复字符时不能无条件left=last+1，否则abba会退回左边；同内容不同起点分别计数。\n\n### 验证\nverify-b.py独立枚举所有子串检查字符唯一性，核对最大长度和起点计数；包含单字母、全相同、重复回退陷阱与长串边界。\n\n### 来源与适用范围\n证据标签为预测，不声称历史命中。\n\n[C++数组容器语义](https://eel.is/c++draft/array.overview)；滑窗正确性证明见本解答，独立穷举结果见验证台账。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
    "difficulty": "medium",
    "order": 267,
    "tags": [
      "吉比特冲刺预测",
      "冲刺B卷",
      "预测考点·原创训练",
      "滑动窗口"
    ],
    "sourceTitle": "原创预测训练 / 滑动窗口",
    "sourceUrl": "https://eel.is/c++draft/array.overview",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：请实现 main，按题面标准输入输出。\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n维护当前无重复后缀[left,right]与每字符上次位置last。读入c时left=max(left,last[c]+1)，然后更新last。每个右端点的最长无重复后缀若刷新全局长度则计数重置1，相同则计数加1。每个最长子串有唯一右端点，故不会重复计数。\n\n时间O(|s|)，额外空间O(26)。\n\n### C++17参考实现\n```cpp\n#include <iostream>\n#include <string>\n#include <array>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int t; cin >> t;\n    while (t--) {\n        string s; cin >> s;\n        array<int,26> last; last.fill(-1);\n        int left=0, best=0, count=0;\n        for (int right=0; right<static_cast<int>(s.size()); ++right) {\n            int c=s[right]-'a';\n            left=max(left,last[c]+1);\n            last[c]=right;\n            int len=right-left+1;\n            if (len>best) { best=len; count=1; }\n            else if (len==best) ++count;\n        }\n        cout << best << ' ' << count << '\\n';\n    }\n}\n```\n\n### 评分点\n- left单调不后退，last初始化为-1\n- 更新全局最优时重置计数，相等累加\n- 起点计数而不是去重子串内容\n- 线性复杂度\n\n### 易错点\n看到重复字符时不能无条件left=last+1，否则abba会退回左边；同内容不同起点分别计数。\n\n### 验证\nverify-b.py独立枚举所有子串检查字符唯一性，核对最大长度和起点计数；包含单字母、全相同、重复回退陷阱与长串边界。\n\n### 来源与适用范围\n证据标签为预测，不声称历史命中。\n\n[C++数组容器语义](https://eel.is/c++draft/array.overview)；滑窗正确性证明见本解答，独立穷举结果见验证台账。代码按 C++17；原题未明规则均以本题明确条件为准。历年来源只支持考点类别，不能证明本原创条件曾考过。",
      "rubricMd": "- left单调不后退，last初始化为-1\n- 更新全局最优时重置计数，相等累加\n- 起点计数而不是去重子串内容\n- 线性复杂度",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-090",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "数组引用保留长度",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体推导或操作未由本次可见题面确认，按预测训练处理。\n\nC++17完整程序的输出是什么？\n\n```cpp\n#include <iostream>\nvoid change(int (&a)[4]) { a[2] = 9; }\nint main() {\n    int a[4] = {1, 2, 2, 4};\n    change(a);\n    std::cout << sizeof(a) / sizeof(a[0]) << ' ' << a[2];\n}\n```",
    "answer": "### 参考回答\nB\n\n正确B：引用绑定整个4元素数组，修改a[2]。A错误地忽略最后一个元素；C忽略引用修改；D数组引用合法。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测；该具体推导/操作未由可见历年题面确认。按题面规则自主推导并以独立模型验证。 技术依据：[C++17数组引用](https://timsong-cpp.github.io/cppwp/n4659/dcl.init.ref)。",
    "difficulty": "medium",
    "order": 268,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "数组引用",
      "代码阅读"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题自主推导与独立验证",
    "sourceUrl": "https://timsong-cpp.github.io/cppwp/n4659/dcl.init.ref",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "3 9"
        },
        {
          "id": "B",
          "text": "4 9"
        },
        {
          "id": "C",
          "text": "4 2"
        },
        {
          "id": "D",
          "text": "编译失败"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nB\n\n正确B：引用绑定整个4元素数组，修改a[2]。A错误地忽略最后一个元素；C忽略引用修改；D数组引用合法。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测；该具体推导/操作未由可见历年题面确认。按题面规则自主推导并以独立模型验证。 技术依据：[C++17数组引用](https://timsong-cpp.github.io/cppwp/n4659/dcl.init.ref)。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-091",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "mutable值捕获与闭包复制",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体考点未由本次已读历年材料确认，按预测训练处理。\n\nC++17完整程序的输出是什么？\n\n```cpp\n#include <iostream>\nint main() {\n    int x = 5;\n    auto f = [x]() mutable { return ++x; };\n    auto g = f;\n    std::cout << f() << ' ' << g() << ' ' << f() << ' ' << x;\n}\n```",
    "answer": "### 参考回答\nD\n\n正确D：f复制x=5，g复制f尚未调用时的状态；f第一次6，g第一次6，f第二次7，外部x仍5。A漏增量；C把所有状态共享；B误把g复制视作共享。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[本题为合理拓展预测；不主张历年考过](https://timsong-cpp.github.io/cppwp/n4659/expr.prim.lambda)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 269,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "Lambda",
      "代码阅读"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题为合理拓展预测；不主张历年考过",
    "sourceUrl": "https://timsong-cpp.github.io/cppwp/n4659/expr.prim.lambda",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "5 6 7 5"
        },
        {
          "id": "B",
          "text": "6 7 7 5"
        },
        {
          "id": "C",
          "text": "6 7 8 8"
        },
        {
          "id": "D",
          "text": "6 6 7 5"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nD\n\n正确D：f复制x=5，g复制f尚未调用时的状态；f第一次6，g第一次6，f第二次7，外部x仍5。A漏增量；C把所有状态共享；B误把g复制视作共享。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[本题为合理拓展预测；不主张历年考过](https://timsong-cpp.github.io/cppwp/n4659/expr.prim.lambda)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "D"
      ]
    }
  },
  {
    "id": "gbits-092",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "重载匹配与整型提升",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体考点未由本次已读历年材料确认，按预测训练处理。\n\nC++17完整程序的输出是什么？\n\n```cpp\n#include <iostream>\nvoid f(int) { std::cout << 'I'; }\nvoid f(double) { std::cout << 'D'; }\nint main() {\n    short s = 2;\n    f(s);\n    f(2.0);\n}\n```",
    "answer": "### 参考回答\nA\n\n正确A：short到int是整型提升，优于short到double的转换；double实参精确匹配double。B忽略第二次精确匹配；C颠倒优先级；D两次都有唯一最佳匹配。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[本题为合理拓展预测；不主张历年考过](https://timsong-cpp.github.io/cppwp/n4659/over.match.best)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 270,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "重载",
      "代码阅读"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题为合理拓展预测；不主张历年考过",
    "sourceUrl": "https://timsong-cpp.github.io/cppwp/n4659/over.match.best",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "ID"
        },
        {
          "id": "B",
          "text": "II"
        },
        {
          "id": "C",
          "text": "DI"
        },
        {
          "id": "D",
          "text": "编译失败"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nA\n\n正确A：short到int是整型提升，优于short到double的转换；double实参精确匹配double。B忽略第二次精确匹配；C颠倒优先级；D两次都有唯一最佳匹配。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[本题为合理拓展预测；不主张历年考过](https://timsong-cpp.github.io/cppwp/n4659/over.match.best)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-093",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "字符数组的容量和字符串长度",
    "question": "**来源边界：【历年考点·原创变式】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。考点依据：2018提前批：可见题面中的数组、字符串、static与整数算法；只使用已读到的考点类别，不复刻原文。\n\nC++17完整程序的输出是什么？\n\n```cpp\n#include <iostream>\n#include <cstring>\nint main() {\n    char a[] = \"frame\";\n    a[2] = '\\0';\n    std::cout << sizeof(a) << ' ' << std::strlen(a);\n}\n```",
    "answer": "### 参考回答\nD\n\n正确D：字面量含结尾空字符，a容量6；把a[2]写为空字符后，strlen从首字符数到第一个空字符为2。A把sizeof当strlen；B漏结尾空字符；C忽略修改。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_D_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018提前批：可见题面中的数组、字符串、static与整数算法](https://www.nowcoder.com/exam/test/11251616/summary)。 技术依据：[规范/官方说明](https://timsong-cpp.github.io/cppwp/n4659/c.strings)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 271,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "历年考点·原创变式",
      "字符串",
      "代码阅读"
    ],
    "sourceTitle": "历年考点·原创变式 / 2018提前批：可见题面中的数组、字符串、static与整数算法",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11251616/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "2 2"
        },
        {
          "id": "B",
          "text": "5 2"
        },
        {
          "id": "C",
          "text": "6 5"
        },
        {
          "id": "D",
          "text": "6 2"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nD\n\n正确D：字面量含结尾空字符，a容量6；把a[2]写为空字符后，strlen从首字符数到第一个空字符为2。A把sizeof当strlen；B漏结尾空字符；C忽略修改。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_D_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018提前批：可见题面中的数组、字符串、static与整数算法](https://www.nowcoder.com/exam/test/11251616/summary)。 技术依据：[规范/官方说明](https://timsong-cpp.github.io/cppwp/n4659/c.strings)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "D"
      ]
    }
  },
  {
    "id": "gbits-094",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "自动对象离开嵌套作用域",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体考点未由本次已读历年材料确认，按预测训练处理。\n\nC++17完整程序的输出是什么？\n\n```cpp\n#include <iostream>\nstruct Item {\n    int id;\n    ~Item() { std::cout << id << ' '; }\n};\nint main() {\n    Item a{1};\n    { Item b{2}; Item c{3}; }\n}\n```",
    "answer": "### 参考回答\nA\n\n正确A：内层先构造b再c，因此离开内层按c、b逆序析构，最后a。C按构造顺序；B内层次序错；D既把外层提前又错内层。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_A_VERIFICATION.md`。\n\n### 来源与适用范围\n[本题为合理拓展预测；不主张历年考过](https://timsong-cpp.github.io/cppwp/n4659/class.dtor)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 272,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "RAII",
      "代码阅读"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题为合理拓展预测；不主张历年考过",
    "sourceUrl": "https://timsong-cpp.github.io/cppwp/n4659/class.dtor",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "3 2 1"
        },
        {
          "id": "B",
          "text": "2 3 1"
        },
        {
          "id": "C",
          "text": "1 2 3"
        },
        {
          "id": "D",
          "text": "1 3 2"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nA\n\n正确A：内层先构造b再c，因此离开内层按c、b逆序析构，最后a。C按构造顺序；B内层次序错；D既把外层提前又错内层。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_A_VERIFICATION.md`。\n\n### 来源与适用范围\n[本题为合理拓展预测；不主张历年考过](https://timsong-cpp.github.io/cppwp/n4659/class.dtor)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-095",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "环形队列跨尾后的长度",
    "question": "**来源边界：【历年考点·原创变式】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。考点依据：2018技术B：可见题面中的环形队列、散列与最小生成树；只使用已读到的考点类别，不复刻原文。\n\n容量为8的数组实现环形队列，保留一个空位置区分满/空。head指向下一出队位置，tail指向下一入队位置。当前head=6、tail=2，队列中有多少元素？",
    "answer": "### 参考回答\nD\n\n正确D：(tail-head+8)%8=4，对应槽位6、7、0、1。A把tail当长度；B多减一次；C把head当长度。保留空位只影响最大容量7，不再从当前长度减1。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_D_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018技术B：可见题面中的环形队列、散列与最小生成树](https://www.nowcoder.com/exam/test/11252373/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 273,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "历年考点·原创变式",
      "环形队列"
    ],
    "sourceTitle": "历年考点·原创变式 / 2018技术B：可见题面中的环形队列、散列与最小生成树",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252373/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "2"
        },
        {
          "id": "B",
          "text": "3"
        },
        {
          "id": "C",
          "text": "6"
        },
        {
          "id": "D",
          "text": "4"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nD\n\n正确D：(tail-head+8)%8=4，对应槽位6、7、0、1。A把tail当长度；B多减一次；C把head当长度。保留空位只影响最大容量7，不再从当前长度减1。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_D_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018技术B：可见题面中的环形队列、散列与最小生成树](https://www.nowcoder.com/exam/test/11252373/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "D"
      ]
    }
  },
  {
    "id": "gbits-096",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "由先序和中序确定后序",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体推导或操作未由本次可见题面确认，按预测训练处理。\n\n一棵节点值互异的二叉树，先序为M G D J T P W，中序为D G J M P T W。后序是什么？",
    "answer": "### 参考回答\nC\n\n正确C：M为根；左子树G(D,J)，右子树T(P,W)；左右根得到D J G P W T M。B对子树用中序；A左右颠倒；D直接照抄先序。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_A_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测；该具体推导/操作未由可见历年题面确认。按题面规则自主推导并以独立模型验证。",
    "difficulty": "medium",
    "order": 274,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "二叉树",
      "遍历"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题自主推导与独立验证",
    "sourceUrl": "",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "J D G W P T M"
        },
        {
          "id": "B",
          "text": "D G J P T W M"
        },
        {
          "id": "C",
          "text": "D J G P W T M"
        },
        {
          "id": "D",
          "text": "M G D J T P W"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nC\n\n正确C：M为根；左子树G(D,J)，右子树T(P,W)；左右根得到D J G P W T M。B对子树用中序；A左右颠倒；D直接照抄先序。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_A_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测；该具体推导/操作未由可见历年题面确认。按题面规则自主推导并以独立模型验证。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-097",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "依赖图中的合法执行顺序",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体考点未由本次已读历年材料确认，按预测训练处理。\n\n有向无环图的边为A→C、B→C、C→D、B→E。以下哪项是合法拓扑序？",
    "answer": "### 参考回答\nB\n\n正确B：A/B均在C前、C在D前、B在E前。A违反B→C；C违反C→D；D违反B→E。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 275,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "拓扑排序"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题为合理拓展预测；不主张历年考过",
    "sourceUrl": "",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "A C B E D"
        },
        {
          "id": "B",
          "text": "B E A C D"
        },
        {
          "id": "C",
          "text": "B A D C E"
        },
        {
          "id": "D",
          "text": "E B A C D"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nB\n\n正确B：A/B均在C前、C在D前、B在E前。A违反B→C；C违反C→D；D违反B→E。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-098",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "三角图的唯一最小生成树",
    "question": "**来源边界：【历年考点·原创变式】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。考点依据：2018技术B：可见题面中的环形队列、散列与最小生成树；只使用已读到的考点类别，不复刻原文。\n\n无向连通图只有A、B、C三个顶点，边AB=2、BC=5、AC=9。其最小生成树总权值是多少？",
    "answer": "### 参考回答\nA\n\n正确A：选AB与BC，2+5=7。B和C为其余两棵树权值，均更大；D把三条边全选形成环。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018技术B：可见题面中的环形队列、散列与最小生成树](https://www.nowcoder.com/exam/test/11252373/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 276,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "历年考点·原创变式",
      "最小生成树"
    ],
    "sourceTitle": "历年考点·原创变式 / 2018技术B：可见题面中的环形队列、散列与最小生成树",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252373/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "7"
        },
        {
          "id": "B",
          "text": "11"
        },
        {
          "id": "C",
          "text": "14"
        },
        {
          "id": "D",
          "text": "16"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nA\n\n正确A：选AB与BC，2+5=7。B和C为其余两棵树权值，均更大；D把三条边全选形成环。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018技术B：可见题面中的环形队列、散列与最小生成树](https://www.nowcoder.com/exam/test/11252373/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-099",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "线性探测的碰撞轨迹",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体推导或操作未由本次可见题面确认，按预测训练处理。\n\n长度7的空散列表，h(k)=k mod 7，碰撞后逐槽加1并对7取模；依次插入10、17、24、5。查找24（含首次槽检查），需检查几个槽？",
    "answer": "### 参考回答\nC\n\n正确C：10在3、17在4、24在5；查24检查3、4、5共3次。A忽略冲突；B只数冲突次数；D把后来放在6的5也计入已成功查找。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测；该具体推导/操作未由可见历年题面确认。按题面规则自主推导并以独立模型验证。",
    "difficulty": "medium",
    "order": 277,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "散列",
      "线性探测"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题自主推导与独立验证",
    "sourceUrl": "",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "1"
        },
        {
          "id": "B",
          "text": "2"
        },
        {
          "id": "C",
          "text": "3"
        },
        {
          "id": "D",
          "text": "4"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nC\n\n正确C：10在3、17在4、24在5；查24检查3、4、5共3次。A忽略冲突；B只数冲突次数；D把后来放在6的5也计入已成功查找。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测；该具体推导/操作未由可见历年题面确认。按题面规则自主推导并以独立模型验证。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-100",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "BST删除的后继替换",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体考点未由本次已读历年材料确认，按预测训练处理。\n\nBST依次插入40、20、60、50、70、45、55，删除节点40，规定用其中序后继的值替换。替换根节点的值是什么？",
    "answer": "### 参考回答\nB\n\n正确B：后继为右子树最小值，沿60→50→45。A为左侧元素；C只走一次左边；D误以为右儿子就是后继。所有键互异。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 278,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "二叉搜索树"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题为合理拓展预测；不主张历年考过",
    "sourceUrl": "",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "20"
        },
        {
          "id": "B",
          "text": "45"
        },
        {
          "id": "C",
          "text": "50"
        },
        {
          "id": "D",
          "text": "60"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nB\n\n正确B：后继为右子树最小值，沿60→50→45。A为左侧元素；C只走一次左边；D误以为右儿子就是后继。所有键互异。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-101",
    "categoryId": "os-fundamentals",
    "type": "single_choice",
    "title": "时间片轮转的完成时间",
    "question": "**来源边界：【历年考点·原创变式】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。考点依据：2018技术A：可见题面中的概率、几何与调度；只使用已读到的考点类别，不复刻原文。\n\n单核CPU，P1/P2/P3在t=0按此顺序入队，CPU总需求分别为5、3、1。时间片2，无切换开销，无I/O/新进程。未完成进程放队尾。P2在什么时刻完成？",
    "answer": "### 参考回答\nD\n\n正确D：P1[0,2)，P2[2,4)，P3[4,5)完成，P1[5,7)，P2[7,8)完成，P1[8,9)。A忽略剩余1；B误用P1片段终点；C是全部完成时刻。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_D_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018技术A：可见题面中的概率、几何与调度](https://www.nowcoder.com/exam/test/11252349/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 279,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "历年考点·原创变式",
      "CPU调度"
    ],
    "sourceTitle": "历年考点·原创变式 / 2018技术A：可见题面中的概率、几何与调度",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252349/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "5"
        },
        {
          "id": "B",
          "text": "7"
        },
        {
          "id": "C",
          "text": "9"
        },
        {
          "id": "D",
          "text": "8"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nD\n\n正确D：P1[0,2)，P2[2,4)，P3[4,5)完成，P1[5,7)，P2[7,8)完成，P1[8,9)。A忽略剩余1；B误用P1片段终点；C是全部完成时刻。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_D_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018技术A：可见题面中的概率、几何与调度](https://www.nowcoder.com/exam/test/11252349/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "D"
      ]
    }
  },
  {
    "id": "gbits-102",
    "categoryId": "os-fundamentals",
    "type": "single_choice",
    "title": "LRU三页框的缺页次数",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体考点未由本次已读历年材料确认，按预测训练处理。\n\n初始页框均空，容量3。请求页序列为1,2,3,1,4,2,5，采用精确LRU，每次缺页计1次（含首次装入），缺页几次？",
    "answer": "### 参考回答\nC\n\n正确C：前三次缺页；访问1命中；4淘汰2，2淘汰3，5淘汰1，后三次也缺页，总6。A/B漏计初装或把被淘汰2判命中；D把访问1也判缺页。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 280,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "LRU",
      "页面置换"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题为合理拓展预测；不主张历年考过",
    "sourceUrl": "",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "4"
        },
        {
          "id": "B",
          "text": "5"
        },
        {
          "id": "C",
          "text": "6"
        },
        {
          "id": "D",
          "text": "7"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nC\n\n正确C：前三次缺页；访问1命中；4淘汰2，2淘汰3，5淘汰1，后三次也缺页，总6。A/B漏计初装或把被淘汰2判命中；D把访问1也判缺页。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-103",
    "categoryId": "computer-networks",
    "type": "single_choice",
    "title": "TCP累计确认遇到中间缺口",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体考点未由本次已读历年材料确认，按预测训练处理。\n\n忽略序号回绕，连接已建立，不考虑SYN/FIN。接收方下一个期望字节序号为1000，先收到字节1000–1099，再收到1200–1299，第二段之后要发送的累计ACK号是什么？",
    "answer": "### 参考回答\nA\n\n正确A：TCP累计ACK指下一个期望字节，1100–1199仍缺失；仅收到后面的段不能越过缺口。B是最后连续收到字节；C为乱序段起点；D错误跨过缺口。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[本题为合理拓展预测；不主张历年考过](https://www.rfc-editor.org/rfc/rfc9293.html)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 281,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "TCP",
      "累计确认"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题为合理拓展预测；不主张历年考过",
    "sourceUrl": "https://www.rfc-editor.org/rfc/rfc9293.html",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "1100"
        },
        {
          "id": "B",
          "text": "1099"
        },
        {
          "id": "C",
          "text": "1200"
        },
        {
          "id": "D",
          "text": "1300"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nA\n\n正确A：TCP累计ACK指下一个期望字节，1100–1199仍缺失；仅收到后面的段不能越过缺口。B是最后连续收到字节；C为乱序段起点；D错误跨过缺口。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[本题为合理拓展预测；不主张历年考过](https://www.rfc-editor.org/rfc/rfc9293.html)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-104",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "SQL聚合忽略NULL的范围",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体考点未由本次已读历年材料确认，按预测训练处理。\n\nPostgreSQL表t只有一列v，四行依次为NULL、0、0、7；SELECT COUNT(*), COUNT(v), SUM(v) FROM t; 结果是什么？",
    "answer": "### 参考回答\nA\n\n正确A：COUNT(*)计全部4行；COUNT(v)只计非NULL的3行；SUM忽略NULL得到7。C把NULL算入COUNT(v)；B忽略COUNT(*)中的NULL行；D把两个0当成同一行，只有DISTINCT才去重。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_A_VERIFICATION.md`。\n\n### 来源与适用范围\n[本题为合理拓展预测；不主张历年考过](https://www.postgresql.org/docs/current/functions-aggregate.html)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 282,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "数据库",
      "聚合",
      "NULL"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题为合理拓展预测；不主张历年考过",
    "sourceUrl": "https://www.postgresql.org/docs/current/functions-aggregate.html",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "4 3 7"
        },
        {
          "id": "B",
          "text": "3 3 7"
        },
        {
          "id": "C",
          "text": "4 4 7"
        },
        {
          "id": "D",
          "text": "4 2 7"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nA\n\n正确A：COUNT(*)计全部4行；COUNT(v)只计非NULL的3行；SUM忽略NULL得到7。C把NULL算入COUNT(v)；B忽略COUNT(*)中的NULL行；D把两个0当成同一行，只有DISTINCT才去重。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_A_VERIFICATION.md`。\n\n### 来源与适用范围\n[本题为合理拓展预测；不主张历年考过](https://www.postgresql.org/docs/current/functions-aggregate.html)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-105",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "不放回抽取的条件概率",
    "question": "**来源边界：【历年考点·原创变式】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。考点依据：2018技术A：可见题面中的概率、几何与调度；只使用已读到的考点类别，不复刻原文。\n\n袋中3红2蓝，均匀不放回抽2球，已知至少一红。两球都是红的条件概率是多少？",
    "answer": "### 参考回答\nB\n\n正确B：无序样本共C(5,2)=10；至少一红9种，双红C(3,2)=3种，3/9=1/3。A是无条件概率；C把两种颜色事件等概率化；D是单抽红概率。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018技术A：可见题面中的概率、几何与调度](https://www.nowcoder.com/exam/test/11252349/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 283,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "历年考点·原创变式",
      "条件概率"
    ],
    "sourceTitle": "历年考点·原创变式 / 2018技术A：可见题面中的概率、几何与调度",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252349/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "3/10"
        },
        {
          "id": "B",
          "text": "1/3"
        },
        {
          "id": "C",
          "text": "1/2"
        },
        {
          "id": "D",
          "text": "3/5"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nB\n\n正确B：无序样本共C(5,2)=10；至少一红9种，双红C(3,2)=3种，3/9=1/3。A是无条件概率；C把两种颜色事件等概率化；D是单抽红概率。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018技术A：可见题面中的概率、几何与调度](https://www.nowcoder.com/exam/test/11252349/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-106",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "独立命中恰好两次",
    "question": "**来源边界：【历年考点·原创变式】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。考点依据：2018技术A：可见题面中的概率、几何与调度；只使用已读到的考点类别，不复刻原文。\n\n四次独立攻击，每次命中概率1/3。恰好命中两次的概率是多少？",
    "answer": "### 参考回答\nD\n\n正确D：C(4,2)×(1/3)^2×(2/3)^2=24/81=8/27。A只计算一种固定命中位置；C遗漏未命中因素；B把单次未命中概率误当成恰好命中两次的概率。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018技术A：可见题面中的概率、几何与调度](https://www.nowcoder.com/exam/test/11252349/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 284,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "历年考点·原创变式",
      "二项分布"
    ],
    "sourceTitle": "历年考点·原创变式 / 2018技术A：可见题面中的概率、几何与调度",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252349/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "4/81"
        },
        {
          "id": "B",
          "text": "2/3"
        },
        {
          "id": "C",
          "text": "4/9"
        },
        {
          "id": "D",
          "text": "8/27"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nD\n\n正确D：C(4,2)×(1/3)^2×(2/3)^2=24/81=8/27。A只计算一种固定命中位置；C遗漏未命中因素；B把单次未命中概率误当成恰好命中两次的概率。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018技术A：可见题面中的概率、几何与调度](https://www.nowcoder.com/exam/test/11252349/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "D"
      ]
    }
  },
  {
    "id": "gbits-107",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "含边界区间的容斥计数",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体考点未由本次已读历年材料确认，按预测训练处理。\n\n1至120的整数（含端点）中，可以被4或6整除的有多少个？",
    "answer": "### 参考回答\nC\n\n正确C：floor(120/4)+floor(120/6)-floor(120/12)=30+20-10=40。B重复计公倍数；A计数依据错误；D只算4的倍数。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_A_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 285,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "容斥"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题为合理拓展预测；不主张历年考过",
    "sourceUrl": "",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "60"
        },
        {
          "id": "B",
          "text": "50"
        },
        {
          "id": "C",
          "text": "40"
        },
        {
          "id": "D",
          "text": "30"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nC\n\n正确C：floor(120/4)+floor(120/6)-floor(120/12)=30+20-10=40。B重复计公倍数；A计数依据错误；D只算4的倍数。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_A_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-108",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "由最大公约数与最小公倍数计数",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体考点未由本次已读历年材料确认，按预测训练处理。\n\n正整数a、b满足a<b，gcd(a,b)=6且lcm(a,b)=180。满足条件的数对(a,b)共有多少组？gcd表示最大公约数，lcm表示最小公倍数。",
    "answer": "### 参考回答\nD\n\n正确D：令a=6u、b=6v，得到uv=30且gcd(u,v)=1、u<v。四组互质因子对为(1,30)、(2,15)、(3,10)、(5,6)，对应(6,180)、(12,90)、(18,60)、(30,36)。A、B漏计合法因子对；C把(a,b)与(b,a)重复计数。仅用ab=1080不足以保证gcd和lcm条件。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 286,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "最大公约数与最小公倍数"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题为合理拓展预测；不主张历年考过",
    "sourceUrl": "",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "2"
        },
        {
          "id": "B",
          "text": "3"
        },
        {
          "id": "C",
          "text": "8"
        },
        {
          "id": "D",
          "text": "4"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nD\n\n正确D：令a=6u、b=6v，得到uv=30且gcd(u,v)=1、u<v。四组互质因子对为(1,30)、(2,15)、(3,10)、(5,6)，对应(6,180)、(12,90)、(18,60)、(30,36)。A、B漏计合法因子对；C把(a,b)与(b,a)重复计数。仅用ab=1080不足以保证gcd和lcm条件。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "D"
      ]
    }
  },
  {
    "id": "gbits-109",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "整数递推的模周期",
    "question": "**来源边界：【历年考点·原创变式】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。考点依据：2023技术卷：可见题面中的树、栈、排序、模运算、TCP与索引；只使用已读到的考点类别，不复刻原文。\n\na0=1，a(n+1)=(2a(n)+1) mod 7。a2026是多少？",
    "answer": "### 参考回答\nC\n\n正确C：序列从n=0起为1、3、0、1……周期3，2026 mod3=1，因此a2026=3。A错取n mod3=2；B把n当0或混淆下标；D不是轨迹中的状态。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2023技术卷：可见题面中的树、栈、排序、模运算、TCP与索引](https://www.nowcoder.com/exam/test/55263940/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 287,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "历年考点·原创变式",
      "模运算",
      "周期"
    ],
    "sourceTitle": "历年考点·原创变式 / 2023技术卷：可见题面中的树、栈、排序、模运算、TCP与索引",
    "sourceUrl": "https://www.nowcoder.com/exam/test/55263940/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "0"
        },
        {
          "id": "B",
          "text": "1"
        },
        {
          "id": "C",
          "text": "3"
        },
        {
          "id": "D",
          "text": "6"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nC\n\n正确C：序列从n=0起为1、3、0、1……周期3，2026 mod3=1，因此a2026=3。A错取n mod3=2；B把n当0或混淆下标；D不是轨迹中的状态。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2023技术卷：可见题面中的树、栈、排序、模运算、TCP与索引](https://www.nowcoder.com/exam/test/55263940/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-110",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "不同对象排列的不相邻条件",
    "question": "**来源边界：【历年考点·原创变式】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。考点依据：2018技术A：可见题面中的概率、几何与调度；只使用已读到的考点类别，不复刻原文。\n\n五个互不相同的对象A/B/C/D/E排成一行。A和B不相邻的排列数是多少？",
    "answer": "### 参考回答\nC\n\n正确C：总排列120；AB相邻用一块，内部两序，2×4!=48；不相邻120−48=72。A只取4!；B算相邻；D只减一种内部排列。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018技术A：可见题面中的概率、几何与调度](https://www.nowcoder.com/exam/test/11252349/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 288,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "历年考点·原创变式",
      "排列组合"
    ],
    "sourceTitle": "历年考点·原创变式 / 2018技术A：可见题面中的概率、几何与调度",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252349/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "24"
        },
        {
          "id": "B",
          "text": "48"
        },
        {
          "id": "C",
          "text": "72"
        },
        {
          "id": "D",
          "text": "96"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nC\n\n正确C：总排列120；AB相邻用一块，内部两序，2×4!=48；不相邻120−48=72。A只取4!；B算相邻；D只减一种内部排列。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018技术A：可见题面中的概率、几何与调度](https://www.nowcoder.com/exam/test/11252349/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-111",
    "categoryId": "rendering-graphics",
    "type": "single_choice",
    "title": "点到非单位法向平面的距离",
    "question": "**来源边界：【历年考点·原创变式】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。考点依据：2018技术A：可见题面中的概率、几何与调度；只使用已读到的考点类别，不复刻原文。\n\n三维欧氏空间，平面2x−y+2z−6=0，点P=(2,1,4)。点到平面的距离是多少？",
    "answer": "### 参考回答\nB\n\n正确B：代入分子|4−1+8−6|=5，法向长度sqrt(4+1+4)=3，距离5/3。A错误代入；C只取法向长度；D忘除法向长度。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018技术A：可见题面中的概率、几何与调度](https://www.nowcoder.com/exam/test/11252349/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 289,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "历年考点·原创变式",
      "平面",
      "法向量"
    ],
    "sourceTitle": "历年考点·原创变式 / 2018技术A：可见题面中的概率、几何与调度",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11252349/summary",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "1"
        },
        {
          "id": "B",
          "text": "5/3"
        },
        {
          "id": "C",
          "text": "3"
        },
        {
          "id": "D",
          "text": "5"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nB\n\n正确B：代入分子|4−1+8−6|=5，法向长度sqrt(4+1+4)=3，距离5/3。A错误代入；C只取法向长度；D忘除法向长度。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018技术A：可见题面中的概率、几何与调度](https://www.nowcoder.com/exam/test/11252349/summary)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-112",
    "categoryId": "rendering-graphics",
    "type": "single_choice",
    "title": "最近点在线段端点之外",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体考点未由本次已读历年材料确认，按预测训练处理。\n\n二维欧氏平面，线段A=(0,0)、B=(3,0)，P=(5,2)。P到线段AB的距离平方是多少？",
    "answer": "### 参考回答\nB\n\n正确B：投影参数t=5/3>1，线段最近点是B；距离平方(5−3)^2+2^2=8。A是到无限直线距离平方；C误取(3,0)与(0,2)差；D是到A距离平方。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 290,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "向量",
      "最近点"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题为合理拓展预测；不主张历年考过",
    "sourceUrl": "",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "4"
        },
        {
          "id": "B",
          "text": "8"
        },
        {
          "id": "C",
          "text": "13"
        },
        {
          "id": "D",
          "text": "29"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nB\n\n正确B：投影参数t=5/3>1，线段最近点是B；距离平方(5−3)^2+2^2=8。A是到无限直线距离平方；C误取(3,0)与(0,2)差；D是到A距离平方。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-113",
    "categoryId": "rendering-graphics",
    "type": "single_choice",
    "title": "叉积求三角形面积",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体推导或操作未由本次可见题面确认，按预测训练处理。\n\n二维点A=(1,1)、B=(5,2)、C=(2,4)，三角形面积是多少？",
    "answer": "### 参考回答\nA\n\n正确A：AB=(4,1)、AC=(1,3)，二维叉积=4×3−1×1=11；面积为绝对值一半11/2。B忘除2；C减法或坐标差错；D只取外包矩形一半。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测；该具体推导/操作未由可见历年题面确认。按题面规则自主推导并以独立模型验证。",
    "difficulty": "medium",
    "order": 291,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "叉积",
      "面积"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题自主推导与独立验证",
    "sourceUrl": "",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "11/2"
        },
        {
          "id": "B",
          "text": "11"
        },
        {
          "id": "C",
          "text": "5"
        },
        {
          "id": "D",
          "text": "6"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nA\n\n正确A：AB=(4,1)、AC=(1,3)，二维叉积=4×3−1×1=11；面积为绝对值一半11/2。B忘除2；C减法或坐标差错；D只取外包矩形一半。\n\n### 评分点\n选出唯一正确选项，并说明排除其他选项的理由。\n\n### 易错点\n按题目给定条件判断，不添加未声明的实现或概率假设。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测；该具体推导/操作未由可见历年题面确认。按题面规则自主推导并以独立模型验证。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-114",
    "categoryId": "cpp-basics",
    "type": "fill_blank",
    "title": "static状态与循环跳过",
    "question": "**来源边界：【历年考点·原创变式】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。考点依据：2018提前批：可见题面中的数组、字符串、static与整数算法；只使用已读到的考点类别，不复刻原文。\n\nC++17完整程序，填写最后输出的两个整数。\n\n```cpp\n#include <iostream>\nint next() {\n    static int value = 1;\n    int old = value;\n    ++value;\n    return old;\n}\nint main() {\n    int a[5] = {};\n    for (int i = 0; i < 5; ++i) {\n        int v = next();\n        if (v == 3) continue;\n        a[i] = v;\n    }\n    int sum = 0;\n    int count = 0;\n    for (int v : a) {\n        sum += v;\n        if (v != 0) ++count;\n    }\n    std::cout << sum << ' ' << count;\n}\n```",
    "answer": "### 参考回答\n输出为 `12 4`。\n\n`next`返回旧值再自增，五次返回1,2,3,4,5；跳过3后数组为1,2,0,4,5，总和12，非零数4。continue只跳过本次存储，不撤销函数调用。\n\n### 评分点\n写出完整输出；空格分隔各项。\n\n### 易错点\n逐步维护状态；中间值与最后输出不同，注意边界是否包含。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018提前批：可见题面中的数组、字符串、static与整数算法](https://www.nowcoder.com/exam/test/11251616/summary)。 技术依据：[规范/官方说明](https://timsong-cpp.github.io/cppwp/n4659/stmt.dcl)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 292,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "历年考点·原创变式",
      "static",
      "代码阅读"
    ],
    "sourceTitle": "历年考点·原创变式 / 2018提前批：可见题面中的数组、字符串、static与整数算法",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11251616/summary",
    "payload": {
      "blanks": [
        {
          "id": "output",
          "label": "完整输出"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n输出为 `12 4`。\n\n`next`返回旧值再自增，五次返回1,2,3,4,5；跳过3后数组为1,2,0,4,5，总和12，非零数4。continue只跳过本次存储，不撤销函数调用。\n\n### 评分点\n写出完整输出；空格分隔各项。\n\n### 易错点\n逐步维护状态；中间值与最后输出不同，注意边界是否包含。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018提前批：可见题面中的数组、字符串、static与整数算法](https://www.nowcoder.com/exam/test/11251616/summary)。 技术依据：[规范/官方说明](https://timsong-cpp.github.io/cppwp/n4659/stmt.dcl)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "acceptedAnswers": {
        "output": [
          "12 4"
        ]
      }
    }
  },
  {
    "id": "gbits-115",
    "categoryId": "algorithms-datastructures",
    "type": "fill_blank",
    "title": "无乘法溢出的整数平方根",
    "question": "**来源边界：【历年考点·原创变式】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。考点依据：2018提前批：可见题面中的数组、字符串、static与整数算法；只使用已读到的考点类别，不复刻原文。\n\nC++17完整程序，填写输出。\n\n```cpp\n#include <iostream>\nlong long root(long long n) {\n    long long lo = 1;\n    long long hi = n;\n    long long ans = 0;\n    while (lo <= hi) {\n        long long mid = lo + (hi - lo) / 2;\n        if (mid <= n / mid) {\n            ans = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return ans;\n}\nint main() {\n    long long n = 58;\n    std::cout << root(n);\n}\n```",
    "answer": "### 参考回答\n输出为 `7`。\n\n程序在[1,58]寻找最大的m使m≤58/m，等价于m²≤58；左侧可行时保留m并向右找，返回floor(sqrt(58))=7。除数m始终正数。\n\n### 评分点\n写出完整输出；空格分隔各项。\n\n### 易错点\n逐步维护状态；中间值与最后输出不同，注意边界是否包含。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018提前批：可见题面中的数组、字符串、static与整数算法](https://www.nowcoder.com/exam/test/11251616/summary)。 技术依据：[规范/官方说明](https://timsong-cpp.github.io/cppwp/n4659/expr.mul)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 293,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "历年考点·原创变式",
      "整数平方根",
      "二分"
    ],
    "sourceTitle": "历年考点·原创变式 / 2018提前批：可见题面中的数组、字符串、static与整数算法",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11251616/summary",
    "payload": {
      "blanks": [
        {
          "id": "output",
          "label": "完整输出"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n输出为 `7`。\n\n程序在[1,58]寻找最大的m使m≤58/m，等价于m²≤58；左侧可行时保留m并向右找，返回floor(sqrt(58))=7。除数m始终正数。\n\n### 评分点\n写出完整输出；空格分隔各项。\n\n### 易错点\n逐步维护状态；中间值与最后输出不同，注意边界是否包含。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018提前批：可见题面中的数组、字符串、static与整数算法](https://www.nowcoder.com/exam/test/11251616/summary)。 技术依据：[规范/官方说明](https://timsong-cpp.github.io/cppwp/n4659/expr.mul)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "acceptedAnswers": {
        "output": [
          "7"
        ]
      }
    }
  },
  {
    "id": "gbits-116",
    "categoryId": "algorithms-datastructures",
    "type": "fill_blank",
    "title": "快速幂的状态推进",
    "question": "**来源边界：【历年考点·原创变式】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。考点依据：2018提前批：可见题面中的数组、字符串、static与整数算法；只使用已读到的考点类别，不复刻原文。\n\nC++17完整程序，填写输出的最终结果。\n\n```cpp\n#include <iostream>\nlong long power(long long a, long long b, long long m) {\n    long long result = 1;\n    a %= m;\n    while (b > 0) {\n        if ((b & 1) != 0) {\n            result = result * a % m;\n        }\n        a = a * a % m;\n        b >>= 1;\n    }\n    return result;\n}\nint main() {\n    long long base = 7;\n    long long exponent = 13;\n    long long modulus = 19;\n    std::cout << power(base, exponent, modulus);\n}\n```",
    "answer": "### 参考回答\n输出为 `7`。\n\n计算7^13 mod19。每轮在指数当前位为1时乘当前底数，底数平方、指数右移；7^3 mod19=1，13 mod3=1，因此结果为7。\n\n### 评分点\n写出完整输出；空格分隔各项。\n\n### 易错点\n逐步维护状态；中间值与最后输出不同，注意边界是否包含。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018提前批：可见题面中的数组、字符串、static与整数算法](https://www.nowcoder.com/exam/test/11251616/summary)。 技术依据：[规范/官方说明](https://timsong-cpp.github.io/cppwp/n4659/expr.mul)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 294,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "历年考点·原创变式",
      "快速幂"
    ],
    "sourceTitle": "历年考点·原创变式 / 2018提前批：可见题面中的数组、字符串、static与整数算法",
    "sourceUrl": "https://www.nowcoder.com/exam/test/11251616/summary",
    "payload": {
      "blanks": [
        {
          "id": "output",
          "label": "完整输出"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n输出为 `7`。\n\n计算7^13 mod19。每轮在指数当前位为1时乘当前底数，底数平方、指数右移；7^3 mod19=1，13 mod3=1，因此结果为7。\n\n### 评分点\n写出完整输出；空格分隔各项。\n\n### 易错点\n逐步维护状态；中间值与最后输出不同，注意边界是否包含。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2018提前批：可见题面中的数组、字符串、static与整数算法](https://www.nowcoder.com/exam/test/11251616/summary)。 技术依据：[规范/官方说明](https://timsong-cpp.github.io/cppwp/n4659/expr.mul)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "acceptedAnswers": {
        "output": [
          "7"
        ]
      }
    }
  },
  {
    "id": "gbits-117",
    "categoryId": "algorithms-datastructures",
    "type": "fill_blank",
    "title": "按邻接矩阵执行DFS",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。已读材料不能确认这段DFS执行轨迹的具体考点，按预测训练处理。\n\nC++17完整程序：节点编号0–3，邻居按编号升序扫描，填写从0出发的访问输出（无空格）。\n\n```cpp\n#include <iostream>\nint edge[4][4] = {\n    {0, 1, 1, 0},\n    {0, 0, 0, 1},\n    {0, 0, 0, 1},\n    {0, 0, 0, 0}\n};\nbool visited[4] = {};\nvoid dfs(int u) {\n    visited[u] = true;\n    std::cout << u;\n    for (int v = 0; v < 4; ++v) {\n        if (edge[u][v] != 0 && !visited[v]) {\n            dfs(v);\n        }\n    }\n}\nint main() {\n    dfs(0);\n}\n```",
    "answer": "### 参考回答\n输出为 `0132`。\n\n先0，再最小未访问邻居1，再3。3没有出边，回到0后访问2，2→3但3已访问，停止。\n\n### 评分点\n写出完整输出；空格分隔各项。\n\n### 易错点\n逐步维护状态；中间值与最后输出不同，注意边界是否包含。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，图与扫描规则按题面定义；没有已核实的历年完整DFS程序证据。 技术依据：[规范/官方说明](https://timsong-cpp.github.io/cppwp/n4659/stmt.iter)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 295,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "DFS",
      "访问顺序"
    ],
    "sourceTitle": "预测考点·原创训练 / DFS程序轨迹；不主张历年考过",
    "sourceUrl": "https://timsong-cpp.github.io/cppwp/n4659/stmt.iter",
    "payload": {
      "blanks": [
        {
          "id": "output",
          "label": "完整输出"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n输出为 `0132`。\n\n先0，再最小未访问邻居1，再3。3没有出边，回到0后访问2，2→3但3已访问，停止。\n\n### 评分点\n写出完整输出；空格分隔各项。\n\n### 易错点\n逐步维护状态；中间值与最后输出不同，注意边界是否包含。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，图与扫描规则按题面定义；没有已核实的历年完整DFS程序证据。 技术依据：[规范/官方说明](https://timsong-cpp.github.io/cppwp/n4659/stmt.iter)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false,
      "acceptedAnswers": {
        "output": [
          "0132"
        ]
      }
    }
  },
  {
    "id": "gbits-118",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "批量补给后的区间资源查询",
    "question": "**来源边界：【历年考点·原创变式】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。考点依据：2025-04-24第一手笔经：区间减法/前缀和编程回忆；只使用已读到的考点类别，不复刻原文。\n\n有n个位置，初值a[i]。先执行m次更新：给闭区间[l,r]的每个位置加x（x可为负）。所有更新结束后，再回答q次闭区间和查询。更新与查询不交错。\n\n**输入**：第一行n m q；第二行n个初值；接下来m行l r x；再q行l r。1≤n,m,q≤200000，1≤l≤r≤n，|a[i]|、|x|≤10^6。\n\n**输出**：每个查询一行最终区间和，使用64位整数。\n\n**样例输入**\n```text\n5 2 3\n3 0 2 1 4\n2 5 3\n1 3 -2\n1 5\n2 3\n5 5\n```\n**样例输出**\n```text\n16\n4\n7\n```",
    "answer": "### 参考回答\n差分批量更新，再重建最终数组的前缀和。\n\n每次更新对diff[l]加x、diff[r+1]减x；累计diff得到每个位置的总增量。再前缀累加最终值，查询用pref[r]−pref[l−1]。\n\n**正确性**：一个更新仅在l开始生效，在r+1取消；累计差分因此恰好包含覆盖当前位置的更新。最终数组前缀相减正好得到查询区间。\n\n**复杂度**：O(n+m+q)时间，O(n)空间。最大最终绝对总和不超过200000×(10^6+200000×10^6)<4.1×10^16，long long足够。\n\n**参考实现**\n```cpp\n#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n, m, q; cin >> n >> m >> q;\n    vector<long long> a(n + 1), diff(n + 2), pref(n + 1);\n    for (int i = 1; i <= n; ++i) cin >> a[i];\n    for (int j = 0; j < m; ++j) {\n        int l, r; long long x; cin >> l >> r >> x;\n        diff[l] += x;\n        diff[r + 1] -= x;\n    }\n    long long cur = 0;\n    for (int i = 1; i <= n; ++i) {\n        cur += diff[i];\n        pref[i] = pref[i - 1] + a[i] + cur;\n    }\n    while (q--) {\n        int l, r; cin >> l >> r;\n        cout << pref[r] - pref[l - 1] << '\\n';\n    }\n}\n```\n\n### 评分点\n正确建模与边界、证明或解释正确性、满足复杂度，样例和边界均正确。\n\n### 易错点\n注意闭区间端点、64位累计值以及相等时的判断；本题不是在线判题。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2025-04-24第一手笔经：区间减法/前缀和编程回忆](https://www.nowcoder.com/feed/main/detail/f3ad63377c7b4bee94641bcb9eb6efc7?sourceSSR=enterprise)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 296,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "历年考点·原创变式",
      "差分",
      "前缀和",
      "原创条件"
    ],
    "sourceTitle": "历年考点·原创变式 / 2025-04-24第一手笔经：区间减法/前缀和编程回忆",
    "sourceUrl": "https://www.nowcoder.com/feed/main/detail/f3ad63377c7b4bee94641bcb9eb6efc7?sourceSSR=enterprise",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：按题意从标准输入读取，向标准输出写出答案。\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n差分批量更新，再重建最终数组的前缀和。\n\n每次更新对diff[l]加x、diff[r+1]减x；累计diff得到每个位置的总增量。再前缀累加最终值，查询用pref[r]−pref[l−1]。\n\n**正确性**：一个更新仅在l开始生效，在r+1取消；累计差分因此恰好包含覆盖当前位置的更新。最终数组前缀相减正好得到查询区间。\n\n**复杂度**：O(n+m+q)时间，O(n)空间。最大最终绝对总和不超过200000×(10^6+200000×10^6)<4.1×10^16，long long足够。\n\n**参考实现**\n```cpp\n#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n, m, q; cin >> n >> m >> q;\n    vector<long long> a(n + 1), diff(n + 2), pref(n + 1);\n    for (int i = 1; i <= n; ++i) cin >> a[i];\n    for (int j = 0; j < m; ++j) {\n        int l, r; long long x; cin >> l >> r >> x;\n        diff[l] += x;\n        diff[r + 1] -= x;\n    }\n    long long cur = 0;\n    for (int i = 1; i <= n; ++i) {\n        cur += diff[i];\n        pref[i] = pref[i - 1] + a[i] + cur;\n    }\n    while (q--) {\n        int l, r; cin >> l >> r;\n        cout << pref[r] - pref[l - 1] << '\\n';\n    }\n}\n```\n\n### 评分点\n正确建模与边界、证明或解释正确性、满足复杂度，样例和边界均正确。\n\n### 易错点\n注意闭区间端点、64位累计值以及相等时的判断；本题不是在线判题。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n[2025-04-24第一手笔经：区间减法/前缀和编程回忆](https://www.nowcoder.com/feed/main/detail/f3ad63377c7b4bee94641bcb9eb6efc7?sourceSSR=enterprise)。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-119",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "带固定冷却的最多活动",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体考点未由本次已读历年材料确认，按预测训练处理。\n\n一个角色可参加若干活动，每项占用半开区间[s,e)。完成一项后必须冷却c时间，下一项开始需s_next≥e_prev+c。第一项前不需冷却，最后一项后无需安排活动。所有活动等价值且不可拆分，求最多参加数量。\n\n**输入**：首行n c；之后n行s e。1≤n≤200000，0≤c≤10^9，0≤s<e≤10^9，整数。\n\n**输出**：最大数量。\n\n**样例输入**\n```text\n5 2\n0 3\n2 4\n5 6\n7 9\n8 10\n```\n**样例输出**\n```text\n3\n```",
    "answer": "### 参考回答\n按结束时刻升序，依次选择开始时刻不早于当前可用时刻的活动。\n\n样例可选[0,3)、[5,6)、[8,10)。固定c使结束时刻越早，可用时刻e+c也越早。\n\n**交换证明**：任一最优可行序列的首项可换成所有可选活动中最早结束的一项，它的结束及冷却终点不晚，后续活动仍可选。删除已选项与不兼容项后重复，得到最优数量。结束相同按任意次序不影响结果。\n\n**复杂度**：O(n log n)时间，O(n)空间。ready用long long。\n\n**参考实现**\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; long long cool; cin >> n >> cool;\n    vector<pair<long long,long long>> jobs;\n    for (int i = 0; i < n; ++i) {\n        long long s, e; cin >> s >> e;\n        jobs.push_back({e, s});\n    }\n    sort(jobs.begin(), jobs.end());\n    long long ready = 0;\n    int ans = 0;\n    for (auto [e, s] : jobs) {\n        if (s >= ready) {\n            ++ans;\n            ready = e + cool;\n        }\n    }\n    cout << ans << '\\n';\n}\n```\n\n### 评分点\n正确建模与边界、证明或解释正确性、满足复杂度，样例和边界均正确。\n\n### 易错点\n注意闭区间端点、64位累计值以及相等时的判断；本题不是在线判题。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 297,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "贪心",
      "区间调度",
      "固定冷却"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题为合理拓展预测；不主张历年考过",
    "sourceUrl": "",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：按题意从标准输入读取，向标准输出写出答案。\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n按结束时刻升序，依次选择开始时刻不早于当前可用时刻的活动。\n\n样例可选[0,3)、[5,6)、[8,10)。固定c使结束时刻越早，可用时刻e+c也越早。\n\n**交换证明**：任一最优可行序列的首项可换成所有可选活动中最早结束的一项，它的结束及冷却终点不晚，后续活动仍可选。删除已选项与不兼容项后重复，得到最优数量。结束相同按任意次序不影响结果。\n\n**复杂度**：O(n log n)时间，O(n)空间。ready用long long。\n\n**参考实现**\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n; long long cool; cin >> n >> cool;\n    vector<pair<long long,long long>> jobs;\n    for (int i = 0; i < n; ++i) {\n        long long s, e; cin >> s >> e;\n        jobs.push_back({e, s});\n    }\n    sort(jobs.begin(), jobs.end());\n    long long ready = 0;\n    int ans = 0;\n    for (auto [e, s] : jobs) {\n        if (s >= ready) {\n            ++ans;\n            ready = e + cool;\n        }\n    }\n    cout << ans << '\\n';\n}\n```\n\n### 评分点\n正确建模与边界、证明或解释正确性、满足复杂度，样例和边界均正确。\n\n### 易错点\n注意闭区间端点、64位累计值以及相等时的判断；本题不是在线判题。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-120",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "保持顺序的资源分组上限",
    "question": "**来源边界：【预测考点·原创训练】。** 本题题干、选项、数值与解答均为原创训练，不是官方原题，也不代表今年会考。该具体考点未由本次已读历年材料确认，按预测训练处理。\n\n给定n个非负任务耗费，必须保持原顺序，切成恰好k个非空连续组。每组耗费为组内之和，求所有组耗费最大值的最小可能值。任务不能拆分，也不能重新排序。\n\n**输入**：第一行n k；第二行n个a[i]。1≤k≤n≤200000，0≤a[i]≤10^9。\n\n**输出**：最小上限，64位整数。\n\n**样例输入**\n```text\n5 3\n4 0 7 2 5\n```\n**样例输出**\n```text\n7\n```",
    "answer": "### 参考回答\n二分最大组和上限，用从左到右尽量装满的贪心判定所需最少组数是否≤k。\n\n样例切为[4,0]、[7]、[2,5]，上限7。\n\n**判定正确性**：在非负前提下，当前组能纳入的最长前缀不会使后面需要更多组。任何同上限方案第一组不会结束得比它更晚；逐组交换可知贪心使用最少组。若最少组数≤k，因为k≤n，可以不断拆分含多个元素的组达到恰好k；非负数保证拆后组和不增。因此判定单调，最小可行上限可二分。\n\n**边界**：下界max(a)，上界sum(a)；全零时两界均0；k=n时结果max(a)。允许负数时该证明不成立，本题明确非负。\n\n**复杂度**：O(n log(sum(a)+1))时间，O(n)空间；sum最大2×10^14。\n\n**参考实现**\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <numeric>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n, k; cin >> n >> k;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    long long lo = *max_element(a.begin(), a.end());\n    long long hi = accumulate(a.begin(), a.end(), 0LL);\n    auto feasible = [&](long long cap) {\n        int groups = 1;\n        long long sum = 0;\n        for (long long x : a) {\n            if (sum + x > cap) { ++groups; sum = x; }\n            else sum += x;\n        }\n        return groups <= k;\n    };\n    while (lo < hi) {\n        long long mid = lo + (hi - lo) / 2;\n        if (feasible(mid)) hi = mid;\n        else lo = mid + 1;\n    }\n    cout << lo << '\\n';\n}\n```\n\n### 评分点\n正确建模与边界、证明或解释正确性、满足复杂度，样例和边界均正确。\n\n### 易错点\n注意闭区间端点、64位累计值以及相等时的判断；本题不是在线判题。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
    "difficulty": "medium",
    "order": 298,
    "tags": [
      "吉比特冲刺预测",
      "冲刺C卷",
      "预测考点·原创训练",
      "二分答案",
      "连续分组",
      "非负数组"
    ],
    "sourceTitle": "预测考点·原创训练 / 本题为合理拓展预测；不主张历年考过",
    "sourceUrl": "",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：按题意从标准输入读取，向标准输出写出答案。\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n二分最大组和上限，用从左到右尽量装满的贪心判定所需最少组数是否≤k。\n\n样例切为[4,0]、[7]、[2,5]，上限7。\n\n**判定正确性**：在非负前提下，当前组能纳入的最长前缀不会使后面需要更多组。任何同上限方案第一组不会结束得比它更晚；逐组交换可知贪心使用最少组。若最少组数≤k，因为k≤n，可以不断拆分含多个元素的组达到恰好k；非负数保证拆后组和不增。因此判定单调，最小可行上限可二分。\n\n**边界**：下界max(a)，上界sum(a)；全零时两界均0；k=n时结果max(a)。允许负数时该证明不成立，本题明确非负。\n\n**复杂度**：O(n log(sum(a)+1))时间，O(n)空间；sum最大2×10^14。\n\n**参考实现**\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <numeric>\nusing namespace std;\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n    int n, k; cin >> n >> k;\n    vector<long long> a(n);\n    for (auto &x : a) cin >> x;\n    long long lo = *max_element(a.begin(), a.end());\n    long long hi = accumulate(a.begin(), a.end(), 0LL);\n    auto feasible = [&](long long cap) {\n        int groups = 1;\n        long long sum = 0;\n        for (long long x : a) {\n            if (sum + x > cap) { ++groups; sum = x; }\n            else sum += x;\n        }\n        return groups <= k;\n    };\n    while (lo < hi) {\n        long long mid = lo + (hi - lo) / 2;\n        if (feasible(mid)) hi = mid;\n        else lo = mid + 1;\n    }\n    cout << lo << '\\n';\n}\n```\n\n### 评分点\n正确建模与边界、证明或解释正确性、满足复杂度，样例和边界均正确。\n\n### 易错点\n注意闭区间端点、64位累计值以及相等时的判断；本题不是在线判题。\n\n### 验证\n`python3 scripts/gbits-sprint/verify-c.py` 读取本题实际JSON，代码题以C++17编译运行；数学和结构题用独立计算，算法以独立暴力对拍。具体覆盖与限制见 `docs/GBITS_PAPER_C_VERIFICATION.md`。\n\n### 来源与适用范围\n本题为原创预测，数学/结构规则按题面定义，自主推导并用独立计算复核。 题面中给定的规则优先；代码按C++17。历年来源只证明所列考点曾可见，不证明本题或今年题型。",
      "rubricMd": "按参考回答中的建模、过程、边界与复杂度自查；算法由学习者自评，不自动判AC。",
      "explanationMd": "",
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
$gbits_pack$;
