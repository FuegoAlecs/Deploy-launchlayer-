/// <reference lib="webworker" />

// We need a wrapper to make solc-js work in the browser.
// Since we can't easily npm install 'solc/wrapper' inside a web worker without a bundler handling the worker specifically,
// We will use a pre-bundled worker approach or just put the wrapper logic here.

// For this MVP, I will use a robust pattern:
// 1. Load the binary.
// 2. Use the low-level `compileStandard` if available, or `solidity_compile`.

const ctx: Worker = self as any;

ctx.onmessage = (event) => {
  const { id, type, payload } = event.data;

  if (type === 'load-version') {
    importScripts(payload.url);
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const solc = self.Module;
    // Initialize if needed
    ctx.postMessage({ id, type: 'version-loaded', payload: { version: payload.version } });
  }

  if (type === 'compile') {
    try {
        // @ts-ignore
        const solc = self.Module;

        // This is a simplified wrapper for standard JSON input/output
        const inputStr = JSON.stringify({
            language: 'Solidity',
            sources: payload.sources,
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['*']
                    }
                }
            }
        });

        // Current solc binaries expose 'solidity_compile' via cwrap or direct export depending on version
        // Newer emscripten builds might be different.

        let outputStr;
        if (solc.cwrap) {
            const compile = solc.cwrap('solidity_compile', 'string', ['string', 'number']);
            outputStr = compile(inputStr, null); // callbacks not supported in this simple version
        } else {
            // Fallback for some versions
             throw new Error("Compiler interface not compatible");
        }

        ctx.postMessage({ id, type: 'compile-result', payload: JSON.parse(outputStr) });

    } catch (e: any) {
        ctx.postMessage({ id, type: 'error', payload: e.toString() });
    }
  }
};
