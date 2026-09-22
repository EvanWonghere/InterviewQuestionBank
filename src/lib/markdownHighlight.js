import csharp from 'highlight.js/lib/languages/csharp';
import cpp from 'highlight.js/lib/languages/cpp';
import c from 'highlight.js/lib/languages/c';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import glsl from 'highlight.js/lib/languages/glsl';

export const highlightOptions = {
  languages: {
    csharp,
    cpp,
    c,
    javascript,
    typescript,
    python,
    sql,
    json,
    bash,
    glsl,
  },
  aliases: {
    csharp: ['cs', 'c#'],
    cpp: ['c++', 'cxx', 'cc'],
    javascript: ['js'],
    typescript: ['ts'],
    bash: ['sh', 'shell', 'zsh'],
  },
  plainText: ['math', 'latex', 'tex', 'mermaid'],
};
