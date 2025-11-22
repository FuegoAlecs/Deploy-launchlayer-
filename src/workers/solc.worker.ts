/// <reference lib="webworker" />

const ctx: Worker = self as any;

ctx.onmessage = (event) => {
  const { id, type, payload } = event.data;

  if (type === 'load-version') {
    importScripts(payload.url);
    // @ts-ignore
    const solc = self.Module;

    // Emscripten module loading logic
    if (typeof solc === 'function') {
        // It's a factory function, we need to wait for it
        // @ts-ignore
        solc().then((instance: any) => {
             // @ts-ignore
             self.solcInstance = instance;
             ctx.postMessage({ id, type: 'version-loaded', payload: { version: payload.version } });
        });
    } else {
        // It's already an instance or older version style
        // @ts-ignore
        self.solcInstance = solc;
        ctx.postMessage({ id, type: 'version-loaded', payload: { version: payload.version } });
    }
  }

  if (type === 'compile') {
    try {
        // @ts-ignore
        const solc = self.solcInstance;

        if (!solc) throw new Error("Compiler not loaded");

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

        let outputStr;
        if (solc.cwrap) {
            const compile = solc.cwrap('solidity_compile', 'string', ['string', 'number']);
            outputStr = compile(inputStr, null);
        } else {
             throw new Error("Compiler interface not compatible");
        }

        ctx.postMessage({ id, type: 'compile-result', payload: JSON.parse(outputStr) });

    } catch (e: any) {
        ctx.postMessage({ id, type: 'error', payload: e.toString() });
    }
  }
};
