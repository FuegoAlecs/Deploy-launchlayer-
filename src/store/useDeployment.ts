import { create } from 'zustand';
import { ethers, BrowserProvider, JsonRpcSigner } from 'ethers';
import { supabase } from '../lib/supabase';

interface DeployedContract {
  address: string;
  name: string;
  abi: any[];
  networkId: number;
  type: 'injected' | 'vm' | 'launchlayer';
}

interface CloudWallet {
    id: string;
    name: string;
    wallet_address: string;
    created_at: string;
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
  environment: 'injected' | 'vm' | 'launchlayer';

  // Cloud Wallet State
  cloudWallets: CloudWallet[];
  isLoadingWallets: boolean;
  selectedCloudWalletId: string | null;

  setEnvironment: (env: 'injected' | 'vm' | 'launchlayer') => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  addDeployedContract: (contract: DeployedContract) => void;
  removeDeployedContract: (address: string) => void;
  refreshBalance: () => Promise<void>;

  // Cloud Wallet Actions
  fetchCloudWallets: () => Promise<void>;
  selectCloudWallet: (walletId: string) => void;
  setChainId: (chainId: number) => void; // For manual network selection in cloud mode
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
  environment: 'injected',

  cloudWallets: [],
  isLoadingWallets: false,
  selectedCloudWalletId: null,

  setEnvironment: (env) => {
      set({ environment: env });

      if (env === 'vm') {
          set({
              account: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
              balance: '100.0',
              chainId: 1337,
              provider: null,
              signer: null,
              error: null
          });
      } else if (env === 'launchlayer') {
          get().disconnectWallet();
          get().fetchCloudWallets();
          set({ chainId: 11155111 }); // Default to Sepolia
      } else {
          get().disconnectWallet();
      }
  },

  setChainId: (chainId) => {
      set({ chainId });
      // TODO: In future, trigger balance refresh for cloud wallet on this chain
  },

  fetchCloudWallets: async () => {
      set({ isLoadingWallets: true, error: null });
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("You must be logged in to use LaunchLayer Wallets.");

          const { data, error } = await supabase
              .from('dev_wallets')
              .select('id, name, wallet_address, created_at')
              .eq('user_id', user.id);

          if (error) throw error;

          set({ cloudWallets: data || [] });

          // Auto-select first wallet if available
          if (data && data.length > 0) {
              get().selectCloudWallet(data[0].id);
          }

      } catch (err: any) {
          console.error("Error fetching wallets:", err);
          set({ error: err.message });
      } finally {
          set({ isLoadingWallets: false });
      }
  },

  selectCloudWallet: (walletId) => {
      const wallet = get().cloudWallets.find(w => w.id === walletId);
      if (wallet) {
          set({
              selectedCloudWalletId: walletId,
              account: wallet.wallet_address,
              balance: '...' // We will fetch balance when we have a provider context or in the UI
          });
      }
  },

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
      balance: '0',
      // Reset Cloud Wallet State too
      selectedCloudWalletId: null
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
