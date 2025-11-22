import { create } from 'zustand';
import { ethers, BrowserProvider, JsonRpcSigner } from 'ethers';

interface DeployedContract {
  address: string;
  name: string;
  abi: any[];
  networkId: number;
}

interface DeploymentState {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  balance: string;
  isConnecting: boolean;
  error: string | null;
  deployedContracts: DeployedContract[];

  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  addDeployedContract: (contract: DeployedContract) => void;
  removeDeployedContract: (address: string) => void;
  refreshBalance: () => Promise<void>;
}

export const useDeployment = create<DeploymentState>((set, get) => ({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  balance: '0',
  isConnecting: false,
  error: null,
  deployedContracts: [],

  connectWallet: async () => {
    set({ isConnecting: true, error: null });
    try {
      if (!window.ethereum) {
        throw new Error("No wallet found. Please install MetaMask.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      const signer = await provider.getSigner();
      const balance = await provider.getBalance(accounts[0]);

      set({
        provider,
        signer,
        account: accounts[0],
        chainId: Number(network.chainId),
        balance: ethers.formatEther(balance),
        isConnecting: false
      });

      // Setup listeners
      window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
          if (newAccounts.length === 0) {
              get().disconnectWallet();
          } else {
              // Re-connect to update signer/balance
              get().connectWallet();
          }
      });

      window.ethereum.on('chainChanged', () => {
          window.location.reload();
      });

    } catch (err: any) {
      set({ error: err.message, isConnecting: false });
    }
  },

  disconnectWallet: () => {
    set({
      provider: null,
      signer: null,
      account: null,
      chainId: null,
      balance: '0'
    });
  },

  addDeployedContract: (contract) => {
    set((state) => ({
      deployedContracts: [...state.deployedContracts, contract]
    }));
  },

  removeDeployedContract: (address) => {
      set((state) => ({
          deployedContracts: state.deployedContracts.filter(c => c.address !== address)
      }));
  },

  refreshBalance: async () => {
      const { provider, account } = get();
      if (provider && account) {
          const balance = await provider.getBalance(account);
          set({ balance: ethers.formatEther(balance) });
      }
  }
}));
