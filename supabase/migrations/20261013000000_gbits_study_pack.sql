-- Reviewed training pack, not an official G-bits paper. Production release approved by the user on 2026-10-13.
-- Atomic and insert-only: existing questions, solutions, tags and progress are never overwritten.
do $gbits_pack$
declare
 item jsonb; category_uuid uuid; question_uuid uuid; tag_uuid uuid; tag_name text;
 pack jsonb := $question_data$[
  {
    "id": "gbits-001",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "循环引用：哪个改动能释放对象？",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\nA 与 B 各持有指向对方的 shared_ptr；外部强引用全部 reset 后仍未析构。哪个方案能消除这个强引用环？",
    "answer": "### 参考回答\nweak_ptr 不增加强引用计数；用 lock 临时取得有效的共享所有权。外部强引用归零时才能析构。const、get 均不消除环。\n\n### 评分点\n- 正确选择 B\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/util.smartptr.weak)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 179,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "智能指针"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://eel.is/c++draft/util.smartptr.weak",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "改成 const shared_ptr"
        },
        {
          "id": "B",
          "text": "把不拥有对象的一条反向边改为 weak_ptr，访问时 lock"
        },
        {
          "id": "C",
          "text": "改成裸指针并永不释放"
        },
        {
          "id": "D",
          "text": "仅对其中一条 shared_ptr 调用 get"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nweak_ptr 不增加强引用计数；用 lock 临时取得有效的共享所有权。外部强引用归零时才能析构。const、get 均不消除环。\n\n### 评分点\n- 正确选择 B\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/util.smartptr.weak)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-002",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "构造函数中的虚调用",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n阅读 C++17：\n```cpp\nstruct B { B(){f();} virtual void f(){std::cout<<\"B\";} };\nstruct D:B { void f() override {std::cout<<\"D\";} };\nint main(){D d;}\n```\n假设已包含 iostream，输出是什么？",
    "answer": "### 参考回答\n构造 B 子对象期间虚调用选择 B 中的最终覆盖函数，不派发到尚未构造的 D；输出 B。\n\n### 评分点\n- 正确选择 A\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/class.cdtor)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 180,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "虚函数",
      "代码阅读"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://eel.is/c++draft/class.cdtor",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "B"
        },
        {
          "id": "B",
          "text": "D"
        },
        {
          "id": "C",
          "text": "BD"
        },
        {
          "id": "D",
          "text": "一定是未定义行为"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n构造 B 子对象期间虚调用选择 B 中的最终覆盖函数，不派发到尚未构造的 D；输出 B。\n\n### 评分点\n- 正确选择 A\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/class.cdtor)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-003",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "基类指针 delete：虚析构的前提",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n传统 C++17 delete 表达式中，B 析构非虚，D 公有继承 B。执行 B* p=new D; delete p; 应如何判断？",
    "answer": "### 参考回答\n经基类指针删除派生对象要求基类有虚析构，否则是未定义行为，不能写成确定输出。\n\n### 评分点\n- 正确选择 C\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/expr.delete)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 181,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "析构",
      "未定义行为"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://eel.is/c++draft/expr.delete",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "保证只调用 B 析构"
        },
        {
          "id": "B",
          "text": "保证调用 D 再 B 析构"
        },
        {
          "id": "C",
          "text": "未定义行为"
        },
        {
          "id": "D",
          "text": "只要 D 没有字段就安全"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n经基类指针删除派生对象要求基类有虚析构，否则是未定义行为，不能写成确定输出。\n\n### 评分点\n- 正确选择 C\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/expr.delete)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-004",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "vector 扩容后的迭代器",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\nv 为 vector<int>，p 指向其首元素。一次 push_back 确实触发了存储重分配。以下哪个说法正确？",
    "answer": "### 参考回答\n重分配使原存储的指针、引用与迭代器失效。未重分配的末尾插入则是另一套规则。\n\n### 评分点\n- 正确选择 B\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/vector.modifiers)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 182,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "vector",
      "迭代器"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://eel.is/c++draft/vector.modifiers",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "p 仍可用"
        },
        {
          "id": "B",
          "text": "p 和原来的所有元素引用/迭代器失效"
        },
        {
          "id": "C",
          "text": "仅 end 失效"
        },
        {
          "id": "D",
          "text": "失效与否只看元素是否 int"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n重分配使原存储的指针、引用与迭代器失效。未重分配的末尾插入则是另一套规则。\n\n### 评分点\n- 正确选择 B\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/vector.modifiers)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-005",
    "categoryId": "cpp-basics",
    "type": "single_choice",
    "title": "reserve 和 resize 的差异",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\nvector<int> v; v.reserve(8); 紧接着以下哪个说法成立？",
    "answer": "### 参考回答\nreserve 只预留存储，不构造 8 个元素；size 仍为 0，下标写入越界。标准不要求容量恰好等于请求值。\n\n### 评分点\n- 正确选择 C\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/vector.capacity)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 183,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "vector"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://eel.is/c++draft/vector.capacity",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "size()==8"
        },
        {
          "id": "B",
          "text": "可以直接写 v[7]"
        },
        {
          "id": "C",
          "text": "size()==0，capacity()>=8"
        },
        {
          "id": "D",
          "text": "capacity() 必须恰为 8"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nreserve 只预留存储，不构造 8 个元素；size 仍为 0，下标写入越界。标准不要求容量恰好等于请求值。\n\n### 评分点\n- 正确选择 C\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/vector.capacity)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-006",
    "categoryId": "cpp-basics",
    "type": "multiple_choice",
    "title": "const 指针与引用：选出正确说法",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n按 C++17 规则选择所有正确说法。",
    "answer": "### 参考回答\nconst int* 限定所指值，int* const 限定指针自身。引用赋值修改被引用对象，不重新绑定。\n\n### 评分点\n- 正确选择 A、B\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/dcl.ptr)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 184,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "const",
      "引用"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://eel.is/c++draft/dcl.ptr",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "const int* p 禁止经 p 修改所指 int"
        },
        {
          "id": "B",
          "text": "int* const p 初始化后不能重新指向另一对象"
        },
        {
          "id": "C",
          "text": "引用可以用赋值重新绑定到另一对象"
        },
        {
          "id": "D",
          "text": "const int* 自身指针值永远不可修改"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nconst int* 限定所指值，int* const 限定指针自身。引用赋值修改被引用对象，不重新绑定。\n\n### 评分点\n- 正确选择 A、B\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/dcl.ptr)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A",
        "B"
      ]
    }
  },
  {
    "id": "gbits-007",
    "categoryId": "cpp-basics",
    "type": "multiple_choice",
    "title": "new、malloc 与 RAII：选出正确说法",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n按 C++17 规则选择所有正确说法。",
    "answer": "### 参考回答\n分配与对象生命周期是两层概念。new[]/delete[]、malloc/free 应配对；RAII 在作用域结束和异常展开时释放所拥有资源。\n\n### 评分点\n- 正确选择 A、B、D\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/expr.new)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 185,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "内存管理",
      "RAII"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://eel.is/c++draft/expr.new",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "new T 通常包含分配与构造 T"
        },
        {
          "id": "B",
          "text": "malloc(sizeof(T)) 不调用 T 的构造函数"
        },
        {
          "id": "C",
          "text": "new[] 分配的数组可用普通 delete 释放"
        },
        {
          "id": "D",
          "text": "拥有动态资源的对象宜用析构和 RAII 管理"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n分配与对象生命周期是两层概念。new[]/delete[]、malloc/free 应配对；RAII 在作用域结束和异常展开时释放所拥有资源。\n\n### 评分点\n- 正确选择 A、B、D\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/expr.new)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A",
        "B",
        "D"
      ]
    }
  },
  {
    "id": "gbits-008",
    "categoryId": "cpp-basics",
    "type": "multiple_choice",
    "title": "STL 的复杂度与线程安全",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n选出所有正确说法。",
    "answer": "### 参考回答\n复杂度需区分平均、最坏和摊还；共享所有权不替对象数据提供互斥。\n\n### 评分点\n- 正确选择 A、B、D\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/unord.req)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 186,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "STL",
      "复杂度"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://eel.is/c++draft/unord.req",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "unordered_map 查询平均 O(1)，最坏可 O(n)"
        },
        {
          "id": "B",
          "text": "map 查询有对数复杂度保证"
        },
        {
          "id": "C",
          "text": "shared_ptr 的控制块安全意味着所指对象任意读写都安全"
        },
        {
          "id": "D",
          "text": "vector 末尾插入通常摊还 O(1)，一次扩容可 O(n)"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n复杂度需区分平均、最坏和摊还；共享所有权不替对象数据提供互斥。\n\n### 评分点\n- 正确选择 A、B、D\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://eel.is/c++draft/unord.req)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A",
        "B",
        "D"
      ]
    }
  },
  {
    "id": "gbits-009",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "小根堆插入 87",
    "question": "**来源边界：历史题意改写。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n小根堆的层序数组为 [1,11,18,36,89,28,21,78]。在末尾插入 87 并按标准上浮，最终数组为？",
    "answer": "### 参考回答\n0 起始下标 8 的父节点是下标 3，其值 36。87>=36，不需上浮，直接追加。\n\n### 评分点\n- 正确选择 B\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 187,
    "tags": [
      "吉比特专项",
      "历史题意改写",
      "堆"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 历史题意改写",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/question/company",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "[1,11,18,36,87,28,21,78,89]"
        },
        {
          "id": "B",
          "text": "[1,11,18,36,89,28,21,78,87]"
        },
        {
          "id": "C",
          "text": "[1,11,18,87,89,28,21,78,36]"
        },
        {
          "id": "D",
          "text": "必须将全数组排序"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n0 起始下标 8 的父节点是下标 3，其值 36。87>=36，不需上浮，直接追加。\n\n### 评分点\n- 正确选择 B\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-010",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "完全二叉树数组下标",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n完全二叉树使用 0 起始下标。下标 i 的左孩子、右孩子分别是？",
    "answer": "### 参考回答\n0 起始数组左孩子 2i+1、右孩子 2i+2；i>0 时父节点 floor((i-1)/2)。缺失孩子须检查越界。\n\n### 评分点\n- 正确选择 B\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 188,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "二叉树"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/question/company",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "2i、2i+1"
        },
        {
          "id": "B",
          "text": "2i+1、2i+2"
        },
        {
          "id": "C",
          "text": "i+1、i+2"
        },
        {
          "id": "D",
          "text": "i/2、i/2+1"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n0 起始数组左孩子 2i+1、右孩子 2i+2；i>0 时父节点 floor((i-1)/2)。缺失孩子须检查越界。\n\n### 评分点\n- 正确选择 B\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-011",
    "categoryId": "algorithms-datastructures",
    "type": "multiple_choice",
    "title": "排序的保证：选出正确说法",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n讨论通常实现：自顶向下归并、原地堆排序、直接插入排序。选择所有正确说法。",
    "answer": "### 参考回答\n归并处理相等值的规则决定稳定性；堆排序最坏 O(n log n)；插入排序已排序时仅线性扫描；任意比较排序的最坏下界为 Ω(n log n)。\n\n### 评分点\n- 正确选择 A、B、C\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 189,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "排序"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/question/company",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "归并时相等元素先取左侧可保证稳定性"
        },
        {
          "id": "B",
          "text": "堆排序最坏时间 O(n log n)"
        },
        {
          "id": "C",
          "text": "插入排序在已排序输入上可 O(n)"
        },
        {
          "id": "D",
          "text": "比较排序在任意输入上都可 O(n) 完成"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n归并处理相等值的规则决定稳定性；堆排序最坏 O(n log n)；插入排序已排序时仅线性扫描；任意比较排序的最坏下界为 Ω(n log n)。\n\n### 评分点\n- 正确选择 A、B、C\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A",
        "B",
        "C"
      ]
    }
  },
  {
    "id": "gbits-012",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "渐进增长：2^n 与 n^100",
    "question": "**来源边界：历史题意改写。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n当 n 趋于无穷，n^100 / 2^n 趋于什么？",
    "answer": "### 参考回答\n取自然对数得到 100 ln n-n ln 2，趋于负无穷，所以原比值趋于 0。有限 n 时多项式可能很大，不能代入几组数代替极限。\n\n### 评分点\n- 正确选择 A\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/interview)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 190,
    "tags": [
      "吉比特专项",
      "历史题意改写",
      "渐进分析"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 历史题意改写",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/interview",
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
          "text": "无穷"
        },
        {
          "id": "D",
          "text": "取决于 n 的奇偶"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n取自然对数得到 100 ln n-n ln 2，趋于负无穷，所以原比值趋于 0。有限 n 时多项式可能很大，不能代入几组数代替极限。\n\n### 评分点\n- 正确选择 A\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/interview)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A"
      ]
    }
  },
  {
    "id": "gbits-013",
    "categoryId": "algorithms-datastructures",
    "type": "multiple_choice",
    "title": "哈希冲突：选出正确说法",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n选择所有正确说法。",
    "answer": "### 参考回答\n开放寻址中直接置空可能截断探测链，应使用墓碑或安全重建；哈希相同不保证键相等。\n\n### 评分点\n- 正确选择 A、B、D\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 191,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "哈希"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/question/company",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "线性探测可能发生主聚集"
        },
        {
          "id": "B",
          "text": "链地址法允许同一桶保存多个元素"
        },
        {
          "id": "C",
          "text": "开放寻址删除元素时总可以直接把槽置为空"
        },
        {
          "id": "D",
          "text": "即使使用哈希表，也必须比较键以确认相等"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n开放寻址中直接置空可能截断探测链，应使用墓碑或安全重建；哈希相同不保证键相等。\n\n### 评分点\n- 正确选择 A、B、D\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A",
        "B",
        "D"
      ]
    }
  },
  {
    "id": "gbits-014",
    "categoryId": "os-fundamentals",
    "type": "single_choice",
    "title": "进程与线程的共享边界",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n同一进程内两个普通线程，以下哪个通常各自独立？",
    "answer": "### 参考回答\n线程共享进程地址空间和多种资源，各自具有栈与执行上下文；栈地址仍在共享地址空间内，别的线程并非绝对无法访问。\n\n### 评分点\n- 正确选择 C\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-intro.pdf)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 192,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "线程"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://pages.cs.wisc.edu/~remzi/OSTEP/threads-intro.pdf",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "地址空间"
        },
        {
          "id": "B",
          "text": "打开文件资源"
        },
        {
          "id": "C",
          "text": "用户栈与寄存器上下文"
        },
        {
          "id": "D",
          "text": "只读代码"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n线程共享进程地址空间和多种资源，各自具有栈与执行上下文；栈地址仍在共享地址空间内，别的线程并非绝对无法访问。\n\n### 评分点\n- 正确选择 C\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-intro.pdf)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-015",
    "categoryId": "os-fundamentals",
    "type": "single_choice",
    "title": "用户态进入内核态",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n哪个操作通常需要通过系统调用请求内核服务？",
    "answer": "### 参考回答\n普通计算与函数调用可在用户态完成。对文件描述符的 read 请求进入内核；库缓冲命中时一次高层读取未必每次都调用 read。\n\n### 评分点\n- 正确选择 C\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://pages.cs.wisc.edu/~remzi/OSTEP/intro.pdf)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 193,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "系统调用"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://pages.cs.wisc.edu/~remzi/OSTEP/intro.pdf",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "整数相加"
        },
        {
          "id": "B",
          "text": "局部数组下标计算"
        },
        {
          "id": "C",
          "text": "请求内核从文件描述符读取数据"
        },
        {
          "id": "D",
          "text": "调用只计算乘法的普通函数"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n普通计算与函数调用可在用户态完成。对文件描述符的 read 请求进入内核；库缓冲命中时一次高层读取未必每次都调用 read。\n\n### 评分点\n- 正确选择 C\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://pages.cs.wisc.edu/~remzi/OSTEP/intro.pdf)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-016",
    "categoryId": "os-fundamentals",
    "type": "multiple_choice",
    "title": "虚拟内存：选出正确说法",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n选择所有正确说法。",
    "answer": "### 参考回答\n页表进行转换，TLB 缓存转换。合法页可能按需分配或换入；非法访问则另行处理。\n\n### 评分点\n- 正确选择 A、B、D\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 194,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "虚拟内存"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "TLB 用来缓存地址转换结果"
        },
        {
          "id": "B",
          "text": "缺页可能来自尚未建立的合法映射，并不总是程序错误"
        },
        {
          "id": "C",
          "text": "虚拟地址直接等于物理地址"
        },
        {
          "id": "D",
          "text": "进程通常拥有各自的虚拟地址空间"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n页表进行转换，TLB 缓存转换。合法页可能按需分配或换入；非法访问则另行处理。\n\n### 评分点\n- 正确选择 A、B、D\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A",
        "B",
        "D"
      ]
    }
  },
  {
    "id": "gbits-017",
    "categoryId": "computer-networks",
    "type": "single_choice",
    "title": "TCP TIME_WAIT 的职责",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\nTCP 通常由主动关闭端进入 TIME_WAIT。哪个解释正确？",
    "answer": "### 参考回答\nTIME_WAIT 与关闭可靠性、旧连接报文寿命有关。主动关闭是常见路径，同时关闭也可能两端进入；端口复用政策由系统具体实现决定。\n\n### 评分点\n- 正确选择 B\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.rfc-editor.org/rfc/rfc9293.html)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 195,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "TCP"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://www.rfc-editor.org/rfc/rfc9293.html",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "让服务器永久不再使用该端口"
        },
        {
          "id": "B",
          "text": "支持末次 ACK 丢失时重传回应，并让旧报文在网络中消退"
        },
        {
          "id": "C",
          "text": "保证应用已经把数据写入磁盘"
        },
        {
          "id": "D",
          "text": "说明发生了死锁"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nTIME_WAIT 与关闭可靠性、旧连接报文寿命有关。主动关闭是常见路径，同时关闭也可能两端进入；端口复用政策由系统具体实现决定。\n\n### 评分点\n- 正确选择 B\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.rfc-editor.org/rfc/rfc9293.html)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-018",
    "categoryId": "computer-networks",
    "type": "multiple_choice",
    "title": "TCP 字节流：选出正确说法",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n选择所有正确说法。",
    "answer": "### 参考回答\nTCP 保证有序字节流，不保留应用 send 的消息边界。长度协议还需校验最大包长并保存未接收完整的数据。\n\n### 评分点\n- 正确选择 A、B、D\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.rfc-editor.org/rfc/rfc9293.html)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 196,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "TCP",
      "粘包"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://www.rfc-editor.org/rfc/rfc9293.html",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "TCP 需要应用自己定义消息边界"
        },
        {
          "id": "B",
          "text": "两次 send 不保证对应两次 recv"
        },
        {
          "id": "C",
          "text": "recv 一次成功必然返回完整业务包"
        },
        {
          "id": "D",
          "text": "可以使用长度字段处理业务包拆分与合并"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nTCP 保证有序字节流，不保留应用 send 的消息边界。长度协议还需校验最大包长并保存未接收完整的数据。\n\n### 评分点\n- 正确选择 A、B、D\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.rfc-editor.org/rfc/rfc9293.html)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "A",
        "B",
        "D"
      ]
    }
  },
  {
    "id": "gbits-019",
    "categoryId": "algorithms-datastructures",
    "type": "single_choice",
    "title": "联合索引的最左前缀",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\nMySQL 8.4，表上只有索引 (name,sex,age)。只问能否构成该索引普通连续最左前缀查找（排除 skip scan、覆盖扫描与成本选型），哪组条件可以？",
    "answer": "### 参考回答\nname、(name,sex)、(name,sex,age) 是连续最左前缀。WHERE 书写顺序不决定前缀。未满足普通前缀不等于索引在所有执行计划里完全无用，应看 EXPLAIN。\n\n### 评分点\n- 正确选择 C\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 197,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "MySQL",
      "联合索引"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "sex=1 AND age=20"
        },
        {
          "id": "B",
          "text": "age=20"
        },
        {
          "id": "C",
          "text": "name='A' AND sex=1"
        },
        {
          "id": "D",
          "text": "只有 age 的范围条件"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nname、(name,sex)、(name,sex,age) 是连续最左前缀。WHERE 书写顺序不决定前缀。未满足普通前缀不等于索引在所有执行计划里完全无用，应看 EXPLAIN。\n\n### 评分点\n- 正确选择 C\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "C"
      ]
    }
  },
  {
    "id": "gbits-020",
    "categoryId": "unity-core",
    "type": "single_choice",
    "title": "冲量改变速度",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n忽略外力和旋转，质量 m=2 kg，初始速度 v=(1,0,0) m/s，一次冲量 J=(0,6,0) kg·m/s。最终速度为？",
    "answer": "### 参考回答\nJ=Δp=mΔv，v_new=v+J/m=(1,3,0)。冲量不是持续力，不额外再乘时间步。原回忆没有完整代码，这里是重新给定数值的练习。\n\n### 评分点\n- 正确选择 B\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/interview)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 198,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "冲量",
      "向量"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/interview",
    "payload": {
      "options": [
        {
          "id": "A",
          "text": "(1,6,0)"
        },
        {
          "id": "B",
          "text": "(1,3,0)"
        },
        {
          "id": "C",
          "text": "(0,3,0)"
        },
        {
          "id": "D",
          "text": "(2,6,0)"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nJ=Δp=mΔv，v_new=v+J/m=(1,3,0)。冲量不是持续力，不额外再乘时间步。原回忆没有完整代码，这里是重新给定数值的练习。\n\n### 评分点\n- 正确选择 B\n- 能解释错误选项依赖的前提\n\n### 追问与易错点\n先写适用条件，再判断；不要把实现习惯当语言或协议保证。\n\n### 最小验证\n逐个解释选项；涉及代码时使用 C++17 编译器复核。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/interview)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "correctOptionIds": [
        "B"
      ]
    }
  },
  {
    "id": "gbits-021",
    "categoryId": "algorithms-datastructures",
    "type": "fill_blank",
    "title": "lowbit：127 与 128",
    "question": "**来源边界：历史题意改写。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n对正整数 x，f(x)=x & (-x)。求 f(127) 与 f(128)，输入范围确保取负不溢出。",
    "answer": "### 参考回答\n127 的二进制末位为 1，所以 lowbit=1；128 只有第 7 位为 1，所以 lowbit=128。\n\n### 评分点\n- 每个空的结果正确\n- 手推一轮并说明整数/下标边界\n\n### 追问与易错点\n不要对有符号溢出或负数移位编造确定结果。\n\n### 最小验证\n手推后用 C++17 验证输出。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "easy",
    "order": 199,
    "tags": [
      "吉比特专项",
      "历史题意改写",
      "位运算"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 历史题意改写",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/question/company",
    "payload": {
      "blanks": [
        {
          "id": "a",
          "label": "f(127)"
        },
        {
          "id": "b",
          "label": "f(128)"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n127 的二进制末位为 1，所以 lowbit=1；128 只有第 7 位为 1，所以 lowbit=128。\n\n### 评分点\n- 每个空的结果正确\n- 手推一轮并说明整数/下标边界\n\n### 追问与易错点\n不要对有符号溢出或负数移位编造确定结果。\n\n### 最小验证\n手推后用 C++17 验证输出。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "acceptedAnswers": {
        "a": [
          "1"
        ],
        "b": [
          "128"
        ]
      }
    }
  },
  {
    "id": "gbits-022",
    "categoryId": "algorithms-datastructures",
    "type": "fill_blank",
    "title": "v &= v-1 的循环次数",
    "question": "**来源边界：历史题意改写。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n```cpp\nunsigned int v=22, cnt=0;\nwhile(v){v &= v-1; ++cnt;}\n```\n填写 cnt 和循环结束时 v。",
    "answer": "### 参考回答\n22=10110₂，每次清除最低位的 1，顺序 22→20→16→0，共 3 次。\n\n### 评分点\n- 每个空的结果正确\n- 手推一轮并说明整数/下标边界\n\n### 追问与易错点\n不要对有符号溢出或负数移位编造确定结果。\n\n### 最小验证\n手推后用 C++17 验证输出。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "easy",
    "order": 200,
    "tags": [
      "吉比特专项",
      "历史题意改写",
      "位运算",
      "代码阅读"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 历史题意改写",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/question/company",
    "payload": {
      "blanks": [
        {
          "id": "a",
          "label": "cnt"
        },
        {
          "id": "b",
          "label": "v"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n22=10110₂，每次清除最低位的 1，顺序 22→20→16→0，共 3 次。\n\n### 评分点\n- 每个空的结果正确\n- 手推一轮并说明整数/下标边界\n\n### 追问与易错点\n不要对有符号溢出或负数移位编造确定结果。\n\n### 最小验证\n手推后用 C++17 验证输出。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "acceptedAnswers": {
        "a": [
          "3"
        ],
        "b": [
          "0"
        ]
      }
    }
  },
  {
    "id": "gbits-023",
    "categoryId": "algorithms-datastructures",
    "type": "fill_blank",
    "title": "按堆下标做中序遍历",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n0 起始数组 [1,2,3,4,5,6,7] 表示完全二叉树；递归访问左孩子 2i+1、节点自身、右孩子 2i+2。请填写中序输出，数字之间用一个空格。",
    "answer": "### 参考回答\n左子树输出 4 2 5，然后根 1，右子树输出 6 3 7。层序数组不是中序数组。\n\n### 评分点\n- 每个空的结果正确\n- 手推一轮并说明整数/下标边界\n\n### 追问与易错点\n不要对有符号溢出或负数移位编造确定结果。\n\n### 最小验证\n手推后用 C++17 验证输出。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "easy",
    "order": 201,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "二叉树",
      "代码阅读"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/question/company",
    "payload": {
      "blanks": [
        {
          "id": "a",
          "label": "中序序列"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n左子树输出 4 2 5，然后根 1，右子树输出 6 3 7。层序数组不是中序数组。\n\n### 评分点\n- 每个空的结果正确\n- 手推一轮并说明整数/下标边界\n\n### 追问与易错点\n不要对有符号溢出或负数移位编造确定结果。\n\n### 最小验证\n手推后用 C++17 验证输出。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "acceptedAnswers": {
        "a": [
          "4 2 5 1 6 3 7"
        ]
      }
    }
  },
  {
    "id": "gbits-024",
    "categoryId": "algorithms-datastructures",
    "type": "fill_blank",
    "title": "指针按值传参与引用传参",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n```cpp\nvoid f(int* p){*p=7; p=nullptr;}\nvoid g(int& x){x+=2;}\nint x=3; int* p=&x; f(p); g(x);\n```\n填写最终 x，以及 p 是否仍等于 &x（填 yes/no）。",
    "answer": "### 参考回答\nf 的 p 是指针值副本，*p 改了 x，重设局部 p 不影响调用者；g 通过引用再加 2，最终 x=9，调用者 p 未变。\n\n### 评分点\n- 每个空的结果正确\n- 手推一轮并说明整数/下标边界\n\n### 追问与易错点\n不要对有符号溢出或负数移位编造确定结果。\n\n### 最小验证\n手推后用 C++17 验证输出。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "easy",
    "order": 202,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "参数传递",
      "代码阅读"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/question/company",
    "payload": {
      "blanks": [
        {
          "id": "a",
          "label": "x"
        },
        {
          "id": "b",
          "label": "p==&x"
        }
      ]
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\nf 的 p 是指针值副本，*p 改了 x，重设局部 p 不影响调用者；g 通过引用再加 2，最终 x=9，调用者 p 未变。\n\n### 评分点\n- 每个空的结果正确\n- 手推一轮并说明整数/下标边界\n\n### 追问与易错点\n不要对有符号溢出或负数移位编造确定结果。\n\n### 最小验证\n手推后用 C++17 验证输出。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false,
      "acceptedAnswers": {
        "a": [
          "9"
        ],
        "b": [
          "yes"
        ]
      }
    }
  },
  {
    "id": "gbits-025",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "三类括号匹配",
    "question": "**来源边界：历史题意改写。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n逐行判断仅含 ()[]{} 的非空字符串是否完全匹配。\n\n### 输入\n首行 T，1≤T≤10；之后 T 行字符串，长度 1–100。\n\n### 输出\n每组一行 yes 或 no。\n\n### 样例输入\n```text\n3\n([]){}\n([)]\n(\n```\n\n### 样例输出\n```text\nyes\nno\nno\n```\n\n请给出思路、复杂度和 C++17 代码。",
    "answer": "### 参考回答\n用栈保存未闭合左括号。右括号必须匹配栈顶，结束时栈必须为空。\n\n复杂度：每组 O(L) 时间、O(L) 空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int T; cin>>T; while(T--){string s,st;cin>>s;bool ok=true;\n for(char c:s){if(c=='('||c=='['||c=='{')st+=c;else{\n char want=c==')'?'(':c==']'?'[':'{';\n if(st.empty()||st.back()!=want){ok=false;break;}st.pop_back();}}\n cout<<(ok&&st.empty()?\"yes\":\"no\")<<'\\n';}\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n只统计括号数量会错过 ([)]。\n\n### 最小验证\n检查单左括号、单右括号、嵌套、并列与 ([)]。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "easy",
    "order": 203,
    "tags": [
      "吉比特专项",
      "历史题意改写",
      "栈"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 历史题意改写",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/question/company",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写思路和边界，再实现 main\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n用栈保存未闭合左括号。右括号必须匹配栈顶，结束时栈必须为空。\n\n复杂度：每组 O(L) 时间、O(L) 空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int T; cin>>T; while(T--){string s,st;cin>>s;bool ok=true;\n for(char c:s){if(c=='('||c=='['||c=='{')st+=c;else{\n char want=c==')'?'(':c==']'?'[':'{';\n if(st.empty()||st.back()!=want){ok=false;break;}st.pop_back();}}\n cout<<(ok&&st.empty()?\"yes\":\"no\")<<'\\n';}\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n只统计括号数量会错过 ([)]。\n\n### 最小验证\n检查单左括号、单右括号、嵌套、并列与 ([)]。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-026",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "最小非空连续子数组和",
    "question": "**来源边界：历史题意改写。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n求至少含一个元素的连续子数组的最小和。\n\n### 输入\n首行 n，1≤n≤200000；次行 n 个整数，|a[i]|≤10^9。\n\n### 输出\n输出最小和，使用 64 位整数。\n\n### 样例输入\n```text\n5\n3 -4 2 -3 5\n```\n\n### 样例输出\n```text\n-5\n```\n\n请给出思路、复杂度和 C++17 代码。",
    "answer": "### 参考回答\ncur 是以当前元素结束的最小非空子数组和，转移 cur=min(a[i],cur+a[i])；best 记录全局最小。\n\n复杂度：O(n) 时间、O(1) 额外空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int n;cin>>n; long long x;cin>>x;long long cur=x,best=x;\n for(int i=1;i<n;++i){cin>>x;cur=min(x,cur+x);best=min(best,cur);}cout<<best<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n不能初始化答案为 0，否则全正数输入错误。\n\n### 最小验证\n全正数 [5,2]→2；单元素 [-7]→-7；大规模和验证 long long。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://leetcode.cn/discuss/post/3564677/ji-bi-te-bi-shi-by-anleeos-7tjd/)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "easy",
    "order": 204,
    "tags": [
      "吉比特专项",
      "历史题意改写",
      "DP"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 历史题意改写",
    "sourceUrl": "https://leetcode.cn/discuss/post/3564677/ji-bi-te-bi-shi-by-anleeos-7tjd/",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写思路和边界，再实现 main\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\ncur 是以当前元素结束的最小非空子数组和，转移 cur=min(a[i],cur+a[i])；best 记录全局最小。\n\n复杂度：O(n) 时间、O(1) 额外空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int n;cin>>n; long long x;cin>>x;long long cur=x,best=x;\n for(int i=1;i<n;++i){cin>>x;cur=min(x,cur+x);best=min(best,cur);}cout<<best<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n不能初始化答案为 0，否则全正数输入错误。\n\n### 最小验证\n全正数 [5,2]→2；单元素 [-7]→-7；大规模和验证 long long。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://leetcode.cn/discuss/post/3564677/ji-bi-te-bi-shi-by-anleeos-7tjd/)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-027",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "前缀和：多次区间查询",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n给定数组，回答闭区间 [l,r] 的元素和。\n\n### 输入\nn q（各 1–200000）；n 个整数（绝对值≤10^9）；之后 q 行 l r，1≤l≤r≤n。\n\n### 输出\n每个查询一行整数。\n\n### 样例输入\n```text\n5 3\n2 -1 3 0 4\n1 5\n2 4\n3 3\n```\n\n### 样例输出\n```text\n8\n2\n3\n```\n\n请给出思路、复杂度和 C++17 代码。",
    "answer": "### 参考回答\np[0]=0，p[i] 为前 i 个元素和；区间和=p[r]-p[l-1]。调研只有方法标签，本题查询规则为补充。\n\n复杂度：O(n+q) 时间、O(n) 空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int n,q;cin>>n>>q;vector<long long> p(n+1);\n for(int i=1;i<=n;++i){long long x;cin>>x;p[i]=p[i-1]+x;}\n while(q--){int l,r;cin>>l>>r;cout<<p[r]-p[l-1]<<'\\n';}\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n不要混用 0/1 起始区间；和可能超出 int。\n\n### 最小验证\n整段、单元素、负数、l=1。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/interview)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "easy",
    "order": 205,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "前缀和"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/interview",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写思路和边界，再实现 main\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\np[0]=0，p[i] 为前 i 个元素和；区间和=p[r]-p[l-1]。调研只有方法标签，本题查询规则为补充。\n\n复杂度：O(n+q) 时间、O(n) 空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int n,q;cin>>n>>q;vector<long long> p(n+1);\n for(int i=1;i<=n;++i){long long x;cin>>x;p[i]=p[i-1]+x;}\n while(q--){int l,r;cin>>l>>r;cout<<p[r]-p[l-1]<<'\\n';}\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n不要混用 0/1 起始区间；和可能超出 int。\n\n### 最小验证\n整段、单元素、负数、l=1。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/interview)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-028",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "01 串按 1…10 循环切分",
    "question": "**来源边界：回忆题训练改写。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n从串首依次取长度 1,2,…,10,1,2,… 的块，把每块按二进制转为十进制；剩余长度不足下一块时丢弃剩余字符。\n\n### 输入\n一行非空 01 串，长度≤100000。\n\n### 输出\n首行块数，次行结果，以一个空格分隔，无尾随空格。\n\n### 样例输入\n```text\n110101\n```\n\n### 样例输出\n```text\n3\n1 2 5\n```\n\n请给出思路、复杂度和 C++17 代码。",
    "answer": "### 参考回答\n记录当前位置与当前块长度。按位乘 2 加当前位；长度到 10 后回到 1。\n\n复杂度：O(L) 时间、O(L) 输出存储。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n string s;cin>>s;vector<int> a;size_t pos=0;int len=1;\n while(pos+len<=s.size()){int x=0;for(int j=0;j<len;++j)x=x*2+(s[pos+j]-'0');a.push_back(x);pos+=len;len=len%10+1;}\n cout<<a.size()<<'\\n';for(size_t i=0;i<a.size();++i){if(i)cout<<' ';cout<<a[i];}cout<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n不能把末尾不足长度的块照样输出。\n\n### 最小验证\n全零、长度 1、长度 2、恰好 55 位与 56 位。\n\n### 资料与适用范围\n[回忆题训练改写所依据的资料](https://www.nowcoder.com/discuss/800011502500544512)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "easy",
    "order": 206,
    "tags": [
      "吉比特专项",
      "回忆题训练改写",
      "字符串",
      "模拟"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 回忆题训练改写",
    "sourceUrl": "https://www.nowcoder.com/discuss/800011502500544512",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写思路和边界，再实现 main\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n记录当前位置与当前块长度。按位乘 2 加当前位；长度到 10 后回到 1。\n\n复杂度：O(L) 时间、O(L) 输出存储。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n string s;cin>>s;vector<int> a;size_t pos=0;int len=1;\n while(pos+len<=s.size()){int x=0;for(int j=0;j<len;++j)x=x*2+(s[pos+j]-'0');a.push_back(x);pos+=len;len=len%10+1;}\n cout<<a.size()<<'\\n';for(size_t i=0;i<a.size();++i){if(i)cout<<' ';cout<<a[i];}cout<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n不能把末尾不足长度的块照样输出。\n\n### 最小验证\n全零、长度 1、长度 2、恰好 55 位与 56 位。\n\n### 资料与适用范围\n[回忆题训练改写所依据的资料](https://www.nowcoder.com/discuss/800011502500544512)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-029",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "删除一段连续子串后匹配",
    "question": "**来源边界：回忆题训练改写。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n允许从 a 删除一段连续子串（可为空或整串），判断能否得到 b；字符大小写敏感。\n\n### 输入\nT≤100；每组两行分别是 a 和 b，可为空；单串长度≤100000，总长度≤200000。\n\n### 输出\n每组输出 YES 或 NO。\n\n### 样例输入\n```text\n3\nabcXYZdef\nabcdef\nabc\nabc\nabc\nacb\n```\n\n### 样例输出\n```text\nYES\nYES\nNO\n```\n\n请给出思路、复杂度和 C++17 代码。",
    "answer": "### 参考回答\n得到的 b 必须是 a 的一个前缀加一个后缀。求最多匹配前缀 p，再从后匹配至多 |b|-p 位；若覆盖 b 即可。\n\n复杂度：O(|a|+|b|) 时间、O(1) 额外空间（不计输入）。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int T;cin>>T;string a,b;getline(cin,a);\n while(T--){getline(cin,a);getline(cin,b);if(b.size()>a.size()){cout<<\"NO\\n\";continue;}\n size_t p=0;while(p<b.size()&&a[p]==b[p])++p;\n size_t s=0;while(s<b.size()-p&&a[a.size()-1-s]==b[b.size()-1-s])++s;\n cout<<(p+s==b.size()?\"YES\":\"NO\")<<'\\n';}\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n这是删一段，不是任意删除多个字符；空串输入需 getline。\n\n### 最小验证\n相同串、b 为空、a 更短、只删首/尾以及 abc→acb。\n\n### 资料与适用范围\n[回忆题训练改写所依据的资料](https://www.nowcoder.com/discuss/800011502500544512)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 207,
    "tags": [
      "吉比特专项",
      "回忆题训练改写",
      "双指针",
      "字符串"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 回忆题训练改写",
    "sourceUrl": "https://www.nowcoder.com/discuss/800011502500544512",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写思路和边界，再实现 main\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n得到的 b 必须是 a 的一个前缀加一个后缀。求最多匹配前缀 p，再从后匹配至多 |b|-p 位；若覆盖 b 即可。\n\n复杂度：O(|a|+|b|) 时间、O(1) 额外空间（不计输入）。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int T;cin>>T;string a,b;getline(cin,a);\n while(T--){getline(cin,a);getline(cin,b);if(b.size()>a.size()){cout<<\"NO\\n\";continue;}\n size_t p=0;while(p<b.size()&&a[p]==b[p])++p;\n size_t s=0;while(s<b.size()-p&&a[a.size()-1-s]==b[b.size()-1-s])++s;\n cout<<(p+s==b.size()?\"YES\":\"NO\")<<'\\n';}\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n这是删一段，不是任意删除多个字符；空串输入需 getline。\n\n### 最小验证\n相同串、b 为空、a 更短、只删首/尾以及 abc→acb。\n\n### 资料与适用范围\n[回忆题训练改写所依据的资料](https://www.nowcoder.com/discuss/800011502500544512)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-030",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "用户名注册校验",
    "question": "**来源边界：回忆题训练改写。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n依次处理注册申请：长度须为 6–12，字符须全为 ASCII 英文字母，名称区分大小写且成功注册后不能重复。错误优先级为长度、字符、重复；失败申请不入集合。输出词与优先级为本训练补充。\n\n### 输入\nn≤100000；随后 n 个非空用户名（空白分隔，每个≤100字符）。\n\n### 输出\n分别输出 LENGTH、CHAR、DUPLICATE 或 OK。\n\n### 样例输入\n```text\n5\nAlicea\nabc\nAlicea\nAlice1\nalicea\n```\n\n### 样例输出\n```text\nOK\nLENGTH\nDUPLICATE\nCHAR\nOK\n```\n\n请给出思路、复杂度和 C++17 代码。",
    "answer": "### 参考回答\n一次扫描校验字符，仅合法名称插入集合，使用插入结果检测重复。\n\n复杂度：平均 O(总字符数) 时间、O(成功名称总长度) 空间；哈希最坏不保证线性。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int n;cin>>n;unordered_set<string> seen;\n while(n--){string s;cin>>s;if(s.size()<6||s.size()>12){cout<<\"LENGTH\\n\";continue;}\n bool ok=true;for(char c:s)if(!((c>='a'&&c<='z')||(c>='A'&&c<='Z')))ok=false;\n if(!ok)cout<<\"CHAR\\n\";else if(!seen.insert(s).second)cout<<\"DUPLICATE\\n\";else cout<<\"OK\\n\";}\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n不能自动忽略大小写，不能让失败的申请占用名称。\n\n### 最小验证\n长度 5/6/12/13，数字与下划线，大小写，连续重复。\n\n### 资料与适用范围\n[回忆题训练改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "easy",
    "order": 208,
    "tags": [
      "吉比特专项",
      "回忆题训练改写",
      "哈希",
      "模拟"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 回忆题训练改写",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/question/company",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写思路和边界，再实现 main\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n一次扫描校验字符，仅合法名称插入集合，使用插入结果检测重复。\n\n复杂度：平均 O(总字符数) 时间、O(成功名称总长度) 空间；哈希最坏不保证线性。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int n;cin>>n;unordered_set<string> seen;\n while(n--){string s;cin>>s;if(s.size()<6||s.size()>12){cout<<\"LENGTH\\n\";continue;}\n bool ok=true;for(char c:s)if(!((c>='a'&&c<='z')||(c>='A'&&c<='Z')))ok=false;\n if(!ok)cout<<\"CHAR\\n\";else if(!seen.insert(s).second)cout<<\"DUPLICATE\\n\";else cout<<\"OK\\n\";}\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n不能自动忽略大小写，不能让失败的申请占用名称。\n\n### 最小验证\n长度 5/6/12/13，数字与下划线，大小写，连续重复。\n\n### 资料与适用范围\n[回忆题训练改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-031",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "走格子：最小初始行动力",
    "question": "**来源边界：历史题意改写。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n从左上到右下，只能右移或下移。进入每格时加上格值（包含起点、终点），每次加完后行动力必须至少为 1。求最小正整数初值。\n\n### 输入\nm n，1≤m,n≤200；之后 m 行 n 个整数，|K|≤100000。\n\n### 输出\n一行最小初值。\n\n### 样例输入\n```text\n3 3\n-2 -3 3\n-5 -10 1\n10 30 -5\n```\n\n### 样例输出\n```text\n7\n```\n\n请给出思路、复杂度和 C++17 代码。",
    "answer": "### 参考回答\n从终点逆推进入格子前所需最少行动力：need=max(1,min(need右,need下)-K)。终点后虚拟需求设为 1，其余边界为无穷。\n\n复杂度：O(mn) 时间、O(n) DP 空间，参考实现额外存储 O(mn) 网格。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int m,n;cin>>m>>n;vector<vector<long long>> a(m,vector<long long>(n));for(auto& row:a)for(auto& x:row)cin>>x;\n const long long INF=numeric_limits<long long>::max()/4;vector<long long> dp(n+1,INF);dp[n-1]=1;\n for(int i=m-1;i>=0;--i){for(int j=n-1;j>=0;--j)dp[j]=max(1LL,min(dp[j],dp[j+1])-a[i][j]);}\n cout<<dp[0]<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n最大化路径总和不保证中途活着；起点格也要计入。\n\n### 最小验证\n单格 -5→6、单格 +5→1、单行、样例与中途大负值。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 209,
    "tags": [
      "吉比特专项",
      "历史题意改写",
      "DP"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 历史题意改写",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/question/company",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写思路和边界，再实现 main\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n从终点逆推进入格子前所需最少行动力：need=max(1,min(need右,need下)-K)。终点后虚拟需求设为 1，其余边界为无穷。\n\n复杂度：O(mn) 时间、O(n) DP 空间，参考实现额外存储 O(mn) 网格。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int m,n;cin>>m>>n;vector<vector<long long>> a(m,vector<long long>(n));for(auto& row:a)for(auto& x:row)cin>>x;\n const long long INF=numeric_limits<long long>::max()/4;vector<long long> dp(n+1,INF);dp[n-1]=1;\n for(int i=m-1;i>=0;--i){for(int j=n-1;j>=0;--j)dp[j]=max(1LL,min(dp[j],dp[j+1])-a[i][j]);}\n cout<<dp[0]<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n最大化路径总和不保证中途活着；起点格也要计入。\n\n### 最小验证\n单格 -5→6、单格 +5→1、单行、样例与中途大负值。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-032",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "两个整数的二进制不同位",
    "question": "**来源边界：历史题意改写。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n计算两个非负 32 位整数二进制表示中不同位的数量，补齐到 32 位。\n\n### 输入\n一行 a b，0≤a,b≤2^32-1。\n\n### 输出\n一行数量。\n\n### 样例输入\n```text\n22 33\n```\n\n### 样例输出\n```text\n5\n```\n\n请给出思路、复杂度和 C++17 代码。",
    "answer": "### 参考回答\n异或把不同位变为 1，再清除最低位的 1 计数。读取到无符号 64 位，避免 32 位有符号范围问题。\n\n复杂度：O(32) 时间、O(1) 空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n unsigned long long a,b;cin>>a>>b;auto x=a^b;int ans=0;while(x){x&=x-1;++ans;}cout<<ans<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n先明确位宽与符号；不是十进制不同数字个数。\n\n### 最小验证\n相等→0；0 与 4294967295→32；22 与 33→5。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "easy",
    "order": 210,
    "tags": [
      "吉比特专项",
      "历史题意改写",
      "位运算"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 历史题意改写",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/question/company",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写思路和边界，再实现 main\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n异或把不同位变为 1，再清除最低位的 1 计数。读取到无符号 64 位，避免 32 位有符号范围问题。\n\n复杂度：O(32) 时间、O(1) 空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n unsigned long long a,b;cin>>a>>b;auto x=a^b;int ans=0;while(x){x&=x-1;++ans;}cout<<ans<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n先明确位宽与符号；不是十进制不同数字个数。\n\n### 最小验证\n相等→0；0 与 4294967295→32；22 与 33→5。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-033",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "区间素数计数",
    "question": "**来源边界：历史题意改写。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n统计闭区间 [M,N] 中素数数量。\n\n### 输入\n一行 M N，1≤M≤N≤1000000。\n\n### 输出\n一行数量。\n\n### 样例输入\n```text\n2 10\n```\n\n### 样例输出\n```text\n4\n```\n\n请给出思路、复杂度和 C++17 代码。",
    "answer": "### 参考回答\n埃氏筛，从每个素数 i 的 i² 起标记倍数；最后统计闭区间。\n\n复杂度：O(N log log N) 时间、O(N) 空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int m,n;cin>>m>>n;vector<bool> prime(n+1,true);prime[0]=false;if(n>=1)prime[1]=false;\n for(int i=2;i<=n/i;++i)if(prime[i])for(int j=i*i;j<=n;j+=i)prime[j]=false;\n int ans=0;for(int x=m;x<=n;++x)ans+=prime[x];cout<<ans<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n1 不是素数；从 i² 开始时注意乘法溢出（本范围安全）。\n\n### 最小验证\n[1,1]→0、[2,2]→1、[14,16]→0。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "easy",
    "order": 211,
    "tags": [
      "吉比特专项",
      "历史题意改写",
      "筛法"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 历史题意改写",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/question/company",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写思路和边界，再实现 main\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n埃氏筛，从每个素数 i 的 i² 起标记倍数；最后统计闭区间。\n\n复杂度：O(N log log N) 时间、O(N) 空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int m,n;cin>>m>>n;vector<bool> prime(n+1,true);prime[0]=false;if(n>=1)prime[1]=false;\n for(int i=2;i<=n/i;++i)if(prime[i])for(int j=i*i;j<=n;j+=i)prime[j]=false;\n int ans=0;for(int x=m;x<=n;++x)ans+=prime[x];cout<<ans<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n1 不是素数；从 i² 开始时注意乘法溢出（本范围安全）。\n\n### 最小验证\n[1,1]→0、[2,2]→1、[14,16]→0。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-034",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "线性时间求排序后相邻最大差",
    "question": "**来源边界：历史题意改写。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n不实际排序，求数组升序排序后相邻元素的最大差；n=1 或全部相同时为 0。\n\n### 输入\nn≤200000；n 个整数，0≤a[i]≤10^9。\n\n### 输出\n一行最大差。\n\n### 样例输入\n```text\n4\n3 6 9 1\n```\n\n### 样例输出\n```text\n3\n```\n\n请给出思路、复杂度和 C++17 代码。",
    "answer": "### 参考回答\n桶宽 w=max(1,floor((max-min)/(n-1)))。桶内最大差<w，而全局最大差至少为平均间隔，所以答案来自相邻非空桶之间，只需桶内最小/最大。桶数 O(n)。\n\n复杂度：O(n) 时间、O(n) 空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int n;cin>>n;vector<long long>a(n);for(auto&x:a)cin>>x;if(n<2){cout<<0<<'\\n';return 0;}\n auto mm=minmax_element(a.begin(),a.end());long long lo=*mm.first,hi=*mm.second;if(lo==hi){cout<<0<<'\\n';return 0;}\n long long w=max(1LL,(hi-lo)/(n-1));int count=int((hi-lo)/w+1);\n vector<long long> mn(count,hi+1),mx(count,-1);\n for(auto x:a){int k=int((x-lo)/w);mn[k]=min(mn[k],x);mx[k]=max(mx[k],x);}\n long long ans=0,prev=lo;for(int k=0;k<count;++k)if(mx[k]>=0){ans=max(ans,mn[k]-prev);prev=mx[k];}cout<<ans<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n跳过空桶；不能把输入的相邻差当排序后的相邻差。\n\n### 最小验证\nn=1、全相同、重复值、大空桶；随机与排序后差分对拍。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "hard",
    "order": 212,
    "tags": [
      "吉比特专项",
      "历史题意改写",
      "桶",
      "数学"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 历史题意改写",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/question/company",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写思路和边界，再实现 main\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n桶宽 w=max(1,floor((max-min)/(n-1)))。桶内最大差<w，而全局最大差至少为平均间隔，所以答案来自相邻非空桶之间，只需桶内最小/最大。桶数 O(n)。\n\n复杂度：O(n) 时间、O(n) 空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int n;cin>>n;vector<long long>a(n);for(auto&x:a)cin>>x;if(n<2){cout<<0<<'\\n';return 0;}\n auto mm=minmax_element(a.begin(),a.end());long long lo=*mm.first,hi=*mm.second;if(lo==hi){cout<<0<<'\\n';return 0;}\n long long w=max(1LL,(hi-lo)/(n-1));int count=int((hi-lo)/w+1);\n vector<long long> mn(count,hi+1),mx(count,-1);\n for(auto x:a){int k=int((x-lo)/w);mn[k]=min(mn[k],x);mx[k]=max(mx[k],x);}\n long long ans=0,prev=lo;for(int k=0;k<count;++k)if(mx[k]>=0){ans=max(ans,mn[k]-prev);prev=mx[k];}cout<<ans<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n跳过空桶；不能把输入的相邻差当排序后的相邻差。\n\n### 最小验证\nn=1、全相同、重复值、大空桶；随机与排序后差分对拍。\n\n### 资料与适用范围\n[历史题意改写所依据的资料](https://www.nowcoder.com/enterprise/760/question/company)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-035",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "多模式匹配：是否含任一模式",
    "question": "**来源边界：回忆题训练改写。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n给出若干小写英文字母模式串；对每个待查串判断是否包含至少一个模式。按完整子串匹配，不是子序列。\n\n### 输入\nP Q，各≤100000；P 个非空模式（每个≤25，总长≤200000）；Q 个非空文本（每个≤999，总长≤2000000）。\n\n### 输出\n每个文本输出 YES 或 NO。\n\n### 样例输入\n```text\n3 3\nhe\nshe\nhers\nushers\nabc\nhehe\n```\n\n### 样例输出\n```text\nYES\nNO\nYES\n```\n\n请给出思路、复杂度和 C++17 代码。",
    "answer": "### 参考回答\n构建 Trie，再按 BFS 建 fail 与完整转移，沿 fail 传播终止标记。每个文本从根开始扫描，任一节点命中即 YES。\n\n复杂度：字母表固定 26，O(26S+T) 时间、O(26S) 空间，S 为模式总长、T 为文本总长。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int P,Q;cin>>P>>Q;\n struct Node{array<int,26> go{};int fail=0;bool hit=false;};vector<Node> tr(1);\n for(int k=0;k<P;++k){string s;cin>>s;int v=0;for(char c:s){int x=c-'a';if(!tr[v].go[x]){int u=int(tr.size());tr[v].go[x]=u;tr.emplace_back();}v=tr[v].go[x];}tr[v].hit=true;}\n queue<int> qu;for(int x=0;x<26;++x)if(tr[0].go[x])qu.push(tr[0].go[x]);\n while(!qu.empty()){int v=qu.front();qu.pop();tr[v].hit=tr[v].hit||tr[tr[v].fail].hit;\n for(int x=0;x<26;++x){int u=tr[v].go[x];if(u){tr[u].fail=tr[tr[v].fail].go[x];qu.push(u);}else tr[v].go[x]=tr[tr[v].fail].go[x];}}\n while(Q--){string s;cin>>s;int v=0;bool hit=false;for(char c:s){v=tr[v].go[c-'a'];hit=hit||tr[v].hit;}cout<<(hit?\"YES\":\"NO\")<<'\\n';}\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n不传播 fail 命中会漏掉后缀模式；不要为每个文本重建自动机。\n\n### 最小验证\n重复模式、一个模式是另一个后缀、跨多次 fail、无命中；小规模与暴力 find 对拍。\n\n### 资料与适用范围\n[回忆题训练改写所依据的资料](https://leetcode.cn/discuss/post/3564677/ji-bi-te-bi-shi-by-anleeos-7tjd/)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "hard",
    "order": 213,
    "tags": [
      "吉比特专项",
      "回忆题训练改写",
      "AC自动机",
      "字符串"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 回忆题训练改写",
    "sourceUrl": "https://leetcode.cn/discuss/post/3564677/ji-bi-te-bi-shi-by-anleeos-7tjd/",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写思路和边界，再实现 main\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n构建 Trie，再按 BFS 建 fail 与完整转移，沿 fail 传播终止标记。每个文本从根开始扫描，任一节点命中即 YES。\n\n复杂度：字母表固定 26，O(26S+T) 时间、O(26S) 空间，S 为模式总长、T 为文本总长。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int P,Q;cin>>P>>Q;\n struct Node{array<int,26> go{};int fail=0;bool hit=false;};vector<Node> tr(1);\n for(int k=0;k<P;++k){string s;cin>>s;int v=0;for(char c:s){int x=c-'a';if(!tr[v].go[x]){int u=int(tr.size());tr[v].go[x]=u;tr.emplace_back();}v=tr[v].go[x];}tr[v].hit=true;}\n queue<int> qu;for(int x=0;x<26;++x)if(tr[0].go[x])qu.push(tr[0].go[x]);\n while(!qu.empty()){int v=qu.front();qu.pop();tr[v].hit=tr[v].hit||tr[tr[v].fail].hit;\n for(int x=0;x<26;++x){int u=tr[v].go[x];if(u){tr[u].fail=tr[tr[v].fail].go[x];qu.push(u);}else tr[v].go[x]=tr[tr[v].fail].go[x];}}\n while(Q--){string s;cin>>s;int v=0;bool hit=false;for(char c:s){v=tr[v].go[c-'a'];hit=hit||tr[v].hit;}cout<<(hit?\"YES\":\"NO\")<<'\\n';}\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n不传播 fail 命中会漏掉后缀模式；不要为每个文本重建自动机。\n\n### 最小验证\n重复模式、一个模式是另一个后缀、跨多次 fail、无命中；小规模与暴力 find 对拍。\n\n### 资料与适用范围\n[回忆题训练改写所依据的资料](https://leetcode.cn/discuss/post/3564677/ji-bi-te-bi-shi-by-anleeos-7tjd/)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-036",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "怪物刷新与技能冷却",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n训练补齐规则：给出 n 个怪物出现时刻（均≤T）；每次施法击杀一个已出现怪物。首次可在 t=0 施法；两次施法间隔至少 C。没有怪物时可以等到下一只出现，同刻先刷新后施法。判断能否在包含 T 的时限内击杀全部怪物。\n\n### 输入\nn C T，1≤n≤200000，1≤C≤10^9，0≤T≤10^12；随后 n 个出现时刻，可未排序。\n\n### 输出\n可以输出 YES，否则 NO。\n\n### 样例输入\n```text\n3 4 9\n1 2 9\n```\n\n### 样例输出\n```text\nYES\n```\n\n请给出思路、复杂度和 C++17 代码。",
    "answer": "### 参考回答\n怪物按出现时刻排序，逐只取最早可施法时间 max(出现时刻,下一次可施法时刻)。尽早击杀不会让后续更晚，是这组简化规则的最优策略。\n\n复杂度：O(n log n) 时间、O(n) 存储。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int n;long long c,T;cin>>n>>c>>T;vector<long long>a(n);for(auto&x:a)cin>>x;sort(a.begin(),a.end());\n long long next=0,last=0;for(auto t:a){last=max(t,next);next=last+c;}cout<<(last<=T?\"YES\":\"NO\")<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n此题没有持续伤害、血量、过期或多技能；原回忆缺少这些细节，不把本训练结论外推。\n\n### 最小验证\n同刻多怪、首怪很晚、击杀恰在 T、T+1 失败。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/interview)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 214,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "事件模拟",
      "贪心"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/interview",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写思路和边界，再实现 main\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n怪物按出现时刻排序，逐只取最早可施法时间 max(出现时刻,下一次可施法时刻)。尽早击杀不会让后续更晚，是这组简化规则的最优策略。\n\n复杂度：O(n log n) 时间、O(n) 存储。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int n;long long c,T;cin>>n>>c>>T;vector<long long>a(n);for(auto&x:a)cin>>x;sort(a.begin(),a.end());\n long long next=0,last=0;for(auto t:a){last=max(t,next);next=last+c;}cout<<(last<=T?\"YES\":\"NO\")<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n此题没有持续伤害、血量、过期或多技能；原回忆缺少这些细节，不把本训练结论外推。\n\n### 最小验证\n同刻多怪、首怪很晚、击杀恰在 T、T+1 失败。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/interview)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-037",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "副本资源分配：0/1 装备升级",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n训练补齐规则：n 件装备，每件最多升级一次，消耗 c[i] 资源并增加 v[i] 战力。总资源 B，允许剩余资源，求最大战力增量。\n\n### 输入\nn B，1≤n≤1000，1≤B≤10000，nB≤10^7；随后 n 行 c v，1≤c≤B，1≤v≤10^9。\n\n### 输出\n一行最大增量。\n\n### 样例输入\n```text\n3 5\n2 4\n3 5\n4 7\n```\n\n### 样例输出\n```text\n9\n```\n\n请给出思路、复杂度和 C++17 代码。",
    "answer": "### 参考回答\ndp[b] 表示预算不超过 b 的最大增量。遍历每件装备时预算倒序，防止同一件装备被重复选择。\n\n复杂度：O(nB) 时间、O(B) 空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int n,B;cin>>n>>B;vector<long long>dp(B+1);\n while(n--){int c;long long v;cin>>c>>v;for(int b=B;b>=c;--b)dp[b]=max(dp[b],dp[b-c]+v);}cout<<dp[B]<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n按价值/消耗比贪心不保证 0/1 背包最优；正序会变成完全背包。\n\n### 最小验证\n某件恰耗完、两小件优于一大件、只能选一次、战力累加溢出 int。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/interview)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 215,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "背包",
      "DP"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/interview",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写思路和边界，再实现 main\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\ndp[b] 表示预算不超过 b 的最大增量。遍历每件装备时预算倒序，防止同一件装备被重复选择。\n\n复杂度：O(nB) 时间、O(B) 空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int n,B;cin>>n>>B;vector<long long>dp(B+1);\n while(n--){int c;long long v;cin>>c>>v;for(int b=B;b>=c;--b)dp[b]=max(dp[b],dp[b-c]+v);}cout<<dp[B]<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n按价值/消耗比贪心不保证 0/1 背包最优；正序会变成完全背包。\n\n### 最小验证\n某件恰耗完、两小件优于一大件、只能选一次、战力累加溢出 int。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/interview)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-038",
    "categoryId": "algorithms-datastructures",
    "type": "algorithm",
    "title": "分绳围图形：最大化最小面积",
    "question": "**来源边界：回忆题训练改写。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n训练补齐规则：总绳长 L 分给 n 人。a[i]=0 表示可围圆，a[i]≥3 表示必须围正 a[i] 边形；各段绳长可为实数，无损耗。最大化所有面积中的最小值。\n\n### 输入\n首行 n L，1≤n≤100000，0<L≤10^9；次行 n 个 a[i]，取 0 或 3–1000000。π=acos(-1)。\n\n### 输出\n最优最小面积，保留 5 位小数。\n\n### 样例输入\n```text\n1 4\n4\n```\n\n### 样例输出\n```text\n1.00000\n```\n\n请给出思路、复杂度和 C++17 代码。",
    "answer": "### 参考回答\n若周长 p，圆面积 p²/(4π)，正 a 边形面积 p²/[4a tan(π/a)]，记系数 k[i]。保证每人面积≥s 至少需总绳长 sqrt(s)·Σ1/sqrt(k[i])，令其等于 L 得最优 s。\n\n复杂度：O(n) 时间、O(1) 额外空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int n;long double L;cin>>n>>L;long double pi=acosl(-1.0L),sum=0;\n for(int i=0;i<n;++i){int a;cin>>a;long double k=a==0?1/(4*pi):1/(4*(long double)a*tanl(pi/a));sum+=1/sqrtl(k);}\n long double s=(L/sum)*(L/sum);cout<<fixed<<setprecision(5)<<s<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n原回忆未完整给出图形范围，正多边形规则是本训练明确限定；平均分绳一般不最优。\n\n### 最小验证\n一个正方形 L=4→1；一个圆 L=2π→π；两相同正方形均分，混合圆/三角形。\n\n### 资料与适用范围\n[回忆题训练改写所依据的资料](https://www.nowcoder.com/enterprise/760/interview)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "hard",
    "order": 216,
    "tags": [
      "吉比特专项",
      "回忆题训练改写",
      "数学",
      "建模"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 回忆题训练改写",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/interview",
    "payload": {
      "language": "cpp",
      "starterCode": "// C++17：先写思路和边界，再实现 main\n"
    },
    "solution": {
      "referenceAnswerMd": "### 参考回答\n若周长 p，圆面积 p²/(4π)，正 a 边形面积 p²/[4a tan(π/a)]，记系数 k[i]。保证每人面积≥s 至少需总绳长 sqrt(s)·Σ1/sqrt(k[i])，令其等于 L 得最优 s。\n\n复杂度：O(n) 时间、O(1) 额外空间。\n\n### C++17 参考实现\n```cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\n#include <limits>\n#include <cmath>\n#include <iomanip>\n#include <queue>\n#include <array>\n#include <unordered_set>\nusing namespace std;\nint main(){\n ios::sync_with_stdio(false); cin.tie(nullptr);\n int n;long double L;cin>>n>>L;long double pi=acosl(-1.0L),sum=0;\n for(int i=0;i<n;++i){int a;cin>>a;long double k=a==0?1/(4*pi):1/(4*(long double)a*tanl(pi/a));sum+=1/sqrtl(k);}\n long double s=(L/sum)*(L/sum);cout<<fixed<<setprecision(5)<<s<<'\\n';\n}\n```\n\n### 评分点\n- 状态与算法正确\n- 输入输出与边界正确\n- 复杂度符合规模\n- 能独立写出实现并通过最小验证\n\n### 追问与易错点\n原回忆未完整给出图形范围，正多边形规则是本训练明确限定；平均分绳一般不最优。\n\n### 最小验证\n一个正方形 L=4→1；一个圆 L=2π→π；两相同正方形均分，混合圆/三角形。\n\n### 资料与适用范围\n[回忆题训练改写所依据的资料](https://www.nowcoder.com/enterprise/760/interview)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-039",
    "categoryId": "algorithms-datastructures",
    "type": "short_answer",
    "title": "事务读异常：根据时间线区分",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\nT1 读到 T2 未提交的余额；T1 同一事务两次读同一行，期间 T2 提交修改；T1 两次查询同一条件，期间 T2 提交新增匹配行。分别叫什么异常？MySQL InnoDB 的可重复读是否能简单说成“一定有幻读”？",
    "answer": "### 参考回答\n依次是脏读、不可重复读、幻读。SQL 隔离现象表和具体数据库实现要区分；InnoDB 可重复读下普通一致性读使用快照，锁定范围读可用 next-key 锁，所以不能机械地断言一定出现幻读。\n\n### 评分点\n- 三种异常区分\n- 区分快照读与锁定读\n- 不把隔离等级名等同具体实现\n\n### 追问与易错点\n同一行值变化与结果集合变化要区分；事务与 autocommit 前提要写清。\n\n### 最小验证\n用两个数据库会话按时间线测试，注明隔离等级与 SELECT 是否 FOR UPDATE。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 217,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "MySQL",
      "事务"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html",
    "payload": {},
    "solution": {
      "referenceAnswerMd": "### 参考回答\n依次是脏读、不可重复读、幻读。SQL 隔离现象表和具体数据库实现要区分；InnoDB 可重复读下普通一致性读使用快照，锁定范围读可用 next-key 锁，所以不能机械地断言一定出现幻读。\n\n### 评分点\n- 三种异常区分\n- 区分快照读与锁定读\n- 不把隔离等级名等同具体实现\n\n### 追问与易错点\n同一行值变化与结果集合变化要区分；事务与 autocommit 前提要写清。\n\n### 最小验证\n用两个数据库会话按时间线测试，注明隔离等级与 SELECT 是否 FOR UPDATE。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-040",
    "categoryId": "unity-core",
    "type": "engineering",
    "title": "客户端方向：战斗场景资源加载",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n已有登录场景，进入含地图、角色、特效与 UI 的战斗场景。设计加载状态、依赖、进度、失败/取消和退出后的释放。允许用 Unity Addressables 举例，限定单机资源加载流程。",
    "answer": "### 参考回答\n状态可为校验清单→下载/读取依赖→异步加载→实例化与预热→激活→运行→退出释放。保存句柄所有权与引用计数；清楚区分下载进度、加载进度和可交互首帧。失败报告具体资源与重试边界，取消后清理已成功加载句柄；跨场景常驻资源由独立所有者保留。主线程激活/实例化分批避免尖峰，按预算验证峰值内存。\n\n### 评分点\n- 完整状态与依赖链\n- 每个句柄有所有者与释放路径\n- 失败/取消可恢复\n- 定义首帧与内存验收\n\n### 追问与易错点\n释放引用不保证内存瞬时下降；不允许多个页面随意重复释放共享句柄。\n\n### 最小验证\n小场景测试首次/缓存加载、缺资源、加载中返回、重复进出三次，记录峰值与释放后的引用。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/MemoryManagement.html)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 218,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "资源加载",
      "客户端设计"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/MemoryManagement.html",
    "payload": {},
    "solution": {
      "referenceAnswerMd": "### 参考回答\n状态可为校验清单→下载/读取依赖→异步加载→实例化与预热→激活→运行→退出释放。保存句柄所有权与引用计数；清楚区分下载进度、加载进度和可交互首帧。失败报告具体资源与重试边界，取消后清理已成功加载句柄；跨场景常驻资源由独立所有者保留。主线程激活/实例化分批避免尖峰，按预算验证峰值内存。\n\n### 评分点\n- 完整状态与依赖链\n- 每个句柄有所有者与释放路径\n- 失败/取消可恢复\n- 定义首帧与内存验收\n\n### 追问与易错点\n释放引用不保证内存瞬时下降；不允许多个页面随意重复释放共享句柄。\n\n### 最小验证\n小场景测试首次/缓存加载、缺资源、加载中返回、重复进出三次，记录峰值与释放后的引用。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/MemoryManagement.html)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-041",
    "categoryId": "rendering-graphics",
    "type": "engineering",
    "title": "客户端方向：渲染与 UI 卡顿诊断",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n战斗中打开背包后帧耗时升高。设计一条证据驱动的排查路径，区分 UI 重建、主线程提交与 GPU 填充瓶颈，不要求画完整引擎架构。",
    "answer": "### 参考回答\n先固定设备、分辨率与场景，记录 CPU/GPU 帧时间和尖峰。沿输入→UI 更新/布局→几何与批次→渲染提交→GPU 着色与混合排查。分别做关闭动态布局、降低透明层/分辨率、隔离复杂材质的小实验。结合 Profiler/Frame Debugger 判断因果，再选择拆 Canvas、减少频繁布局更新、合批或减少 overdraw，并复测副作用。\n\n### 评分点\n- 区分 CPU/GPU 瓶颈\n- 按渲染与 UI 流程找证据\n- 单变量实验\n- 同设备条件前后复测\n\n### 追问与易错点\nDraw Call 少不保证 GPU 快；CPU 侧等待 GPU 不能简单当 CPU 算力不足。\n\n### 最小验证\n以同一录制片段或操作序列采样前后帧耗时，不凭编辑器肉眼下结论。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://docs.unity3d.com/6000.0/Documentation/Manual/Profiler.html)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 219,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "渲染管线",
      "UI",
      "客户端设计"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://docs.unity3d.com/6000.0/Documentation/Manual/Profiler.html",
    "payload": {},
    "solution": {
      "referenceAnswerMd": "### 参考回答\n先固定设备、分辨率与场景，记录 CPU/GPU 帧时间和尖峰。沿输入→UI 更新/布局→几何与批次→渲染提交→GPU 着色与混合排查。分别做关闭动态布局、降低透明层/分辨率、隔离复杂材质的小实验。结合 Profiler/Frame Debugger 判断因果，再选择拆 Canvas、减少频繁布局更新、合批或减少 overdraw，并复测副作用。\n\n### 评分点\n- 区分 CPU/GPU 瓶颈\n- 按渲染与 UI 流程找证据\n- 单变量实验\n- 同设备条件前后复测\n\n### 追问与易错点\nDraw Call 少不保证 GPU 快；CPU 侧等待 GPU 不能简单当 CPU 算力不足。\n\n### 最小验证\n以同一录制片段或操作序列采样前后帧耗时，不凭编辑器肉眼下结论。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://docs.unity3d.com/6000.0/Documentation/Manual/Profiler.html)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
      "explanationMd": "",
      "caseSensitive": false
    }
  },
  {
    "id": "gbits-042",
    "categoryId": "unity-core",
    "type": "engineering",
    "title": "客户端方向：可取消定时器",
    "question": "**来源边界：考点训练变式。** 根据用户提供的 2026-10-13 调研摘要整理；本题题面、选项、样例和解答为训练编写，不是官方原卷逐字稿。\n\n为单机战斗设计 10000 个一次性或周期任务，要求可取消、不因帧率变化漏触发，并说明同帧超多任务的策略。限定只在主线程执行回调。",
    "answer": "### 参考回答\n用最小堆按截止时间排序，单调时钟到达任务截止时出堆。取消可用 id→条目/代次映射配合惰性删除。循环任务明确按原截止时间推进还是按实际触发时间推进，以及追赶/合并策略。每帧回调设预算，剩余任务延后并统计延迟；回调中新建/取消任务使用安全队列或有效性检查。区别游戏时间与真实时间，暂停由需求选择。\n\n### 评分点\n- 截止时间与堆复杂度\n- 取消/过期条目可识别\n- 周期任务的漂移策略\n- 超预算、暂停与回调重入\n\n### 追问与易错点\n每帧递减计时器会受累计误差和遍历成本影响；无限追赶可能阻塞主线程。\n\n### 最小验证\n模拟长帧、暂停、取消后 id 复用、回调里取消别的任务与同刻 10000 任务。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/interview)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
    "difficulty": "medium",
    "order": 220,
    "tags": [
      "吉比特专项",
      "考点训练变式",
      "定时器",
      "客户端设计"
    ],
    "sourceTitle": "用户提供的吉比特调研摘要 / 考点训练变式",
    "sourceUrl": "https://www.nowcoder.com/enterprise/760/interview",
    "payload": {},
    "solution": {
      "referenceAnswerMd": "### 参考回答\n用最小堆按截止时间排序，单调时钟到达任务截止时出堆。取消可用 id→条目/代次映射配合惰性删除。循环任务明确按原截止时间推进还是按实际触发时间推进，以及追赶/合并策略。每帧回调设预算，剩余任务延后并统计延迟；回调中新建/取消任务使用安全队列或有效性检查。区别游戏时间与真实时间，暂停由需求选择。\n\n### 评分点\n- 截止时间与堆复杂度\n- 取消/过期条目可识别\n- 周期任务的漂移策略\n- 超预算、暂停与回调重入\n\n### 追问与易错点\n每帧递减计时器会受累计误差和遍历成本影响；无限追赶可能阻塞主线程。\n\n### 最小验证\n模拟长帧、暂停、取消后 id 复用、回调里取消别的任务与同刻 10000 任务。\n\n### 资料与适用范围\n[考点训练变式所依据的资料](https://www.nowcoder.com/enterprise/760/interview)。C++ 题按 C++17；算法题按本题补齐的输入范围与规则。算法在此提交思路/代码后自评，不在线编译或自动判 AC。",
      "rubricMd": "每个评分点 1 分；核心状态、边界或复杂度错误应选“重来”或“困难”。",
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
