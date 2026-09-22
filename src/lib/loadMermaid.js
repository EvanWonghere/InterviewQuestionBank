let mermaidModule;

/** Keep mermaid off the quiz homepage bundle until a diagram is actually shown. */
export function loadMermaid() {
  if (!mermaidModule) {
    mermaidModule = import('mermaid').then((mod) => {
      const mermaid = mod.default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        htmlLabels: false,
        theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default',
      });
      return mermaid;
    });
  }
  return mermaidModule;
}
