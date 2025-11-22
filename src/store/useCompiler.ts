import { create } from 'zustand';

interface CompiledContract {
  name: string; // e.g., "Storage"
  fileName: string; // e.g., "Storage.sol"
  abi: any[];
  bytecode: string;
}

interface CompilerState {
  compiledContracts: Record<string, CompiledContract>; // Key: "fileName:contractName"
  errors: any[];
  isCompiling: boolean;

  setCompiling: (isCompiling: boolean) => void;
  setCompilationResult: (fileName: string, data: any) => void;
  setErrors: (errors: any[]) => void;
  reset: () => void;
}

export const useCompiler = create<CompilerState>((set) => ({
  compiledContracts: {},
  errors: [],
  isCompiling: false,

  setCompiling: (isCompiling) => set({ isCompiling }),

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setCompilationResult: (_fileName, data) => {
      // Parse solc output to extract contracts
      const contracts: Record<string, CompiledContract> = {};

      if (data.contracts) {
        Object.entries(data.contracts).forEach(([fName, fileContracts]: [string, any]) => {
             Object.entries(fileContracts).forEach(([contractName, contractData]: [string, any]) => {
                 contracts[`${fName}:${contractName}`] = {
                     name: contractName,
                     fileName: fName,
                     abi: contractData.abi,
                     bytecode: contractData.evm.bytecode.object
                 };
             });
        });
      }

      set({
          compiledContracts: contracts,
          errors: data.errors || []
      });
  },

  setErrors: (errors) => set({ errors }),

  reset: () => set({ compiledContracts: {}, errors: [] })
}));
