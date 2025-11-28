import React from 'react';
import { useDeployment } from '../../store/useDeployment';
import { useCompiler } from '../../store/useCompiler';
import { useTerminal } from '../../store/useTerminal';
import { Wallet, RefreshCw, AlertCircle, Sparkles, Cloud, Globe } from 'lucide-react';
import { ethers, ContractFactory } from 'ethers';
import { supabase } from '../../lib/supabase';
import { ContractInstance } from './ContractInstance';
import { clsx } from 'clsx';

// Extended Chain definitions with Testnet/Mainnet flags
const CHAINS = [
    { id: 1, name: 'Ethereum Mainnet', isTestnet: false },
    { id: 11155111, name: 'Sepolia', isTestnet: true },
    { id: 5, name: 'Goerli', isTestnet: true },

    { id: 10, name: 'Optimism Mainnet', isTestnet: false },
    { id: 11155420, name: 'Optimism Sepolia', isTestnet: true },

    { id: 42161, name: 'Arbitrum One', isTestnet: false },
    { id: 421614, name: 'Arbitrum Sepolia', isTestnet: true },

    { id: 137, name: 'Polygon Mainnet', isTestnet: false },
    { id: 80001, name: 'Mumbai', isTestnet: true },

    { id: 8453, name: 'Base Mainnet', isTestnet: false },
    { id: 84532, name: 'Base Sepolia', isTestnet: true },

    { id: 56, name: 'BSC Mainnet', isTestnet: false },
    { id: 97, name: 'BSC Testnet', isTestnet: true },

    { id: 43114, name: 'Avalanche C-Chain', isTestnet: false },
    { id: 43113, name: 'Avalanche Fuji', isTestnet: true },

    { id: 250, name: 'Fantom Opera', isTestnet: false },
    { id: 4002, name: 'Fantom Testnet', isTestnet: true },

    { id: 81457, name: 'Blast Mainnet', isTestnet: false },
    { id: 168587773, name: 'Blast Sepolia', isTestnet: true },

    { id: 59144, name: 'Linea Mainnet', isTestnet: false },
    { id: 59141, name: 'Linea Testnet', isTestnet: true },

    { id: 534352, name: 'Scroll Mainnet', isTestnet: false },
    { id: 534351, name: 'Scroll Sepolia', isTestnet: true },

    { id: 324, name: 'zkSync Era Mainnet', isTestnet: false },
    { id: 300, name: 'zkSync Era Sepolia', isTestnet: true },
];

export const getRpcForChain = (chainId: number): string => {
   const rpcMap: Record<number, string> = {
        1: "https://eth.llamarpc.com",
        11155111: "https://rpc.sepolia.org",
        5: "https://rpc.ankr.com/eth_goerli",
        137: "https://polygon-rpc.com",
        80001: "https://rpc-mumbai.maticvigil.com",
        42161: "https://arb1.arbitrum.io/rpc",
        421614: "https://sepolia-rollup.arbitrum.io/rpc",
        10: "https://mainnet.optimism.io",
        11155420: "https://sepolia.optimism.io",
        8453: "https://mainnet.base.org",
        84532: "https://sepolia.base.org",
        56: "https://binance.llamarpc.com",
        97: "https://data-seed-prebsc-1-s1.binance.org:8545",
        43114: "https://api.avax.network/ext/bc/C/rpc",
        43113: "https://api.avax-test.network/ext/bc/C/rpc",
        250: "https://rpc.ftm.tools",
        4002: "https://rpc.testnet.fantom.network",
        81457: "https://rpc.blast.io",
        168587773: "https://sepolia.blast.io",
        59144: "https://rpc.linea.build",
        59141: "https://rpc.goerli.linea.build",
        534352: "https://rpc.scroll.io",
        534351: "https://sepolia-rpc.scroll.io",
        324: "https://mainnet.era.zksync.io",
        300: "https://sepolia.era.zksync.dev"
   };
   return rpcMap[chainId] || "https://rpc.sepolia.org";
};

export function DeployPanel() {
  const {
      connectWallet, disconnectWallet, account, balance, chainId, isConnecting, error,
      deployedContracts, addDeployedContract, environment, setEnvironment,
      cloudWallets, isLoadingWallets, selectedCloudWalletId, selectCloudWallet, setChainId
  } = useDeployment();
  const { compiledContracts } = useCompiler();
  const { addLog } = useTerminal();

  const [selectedContract, setSelectedContract] = React.useState<string>('');
  const [constructorArgs, setConstructorArgs] = React.useState<Record<string, string>>({});
  const [isDeploying, setIsDeploying] = React.useState(false);
  const [deployError, setDeployError] = React.useState<string | null>(null);
  const [isDebugging, setIsDebugging] = React.useState(false);
  const [aiSuggestion, setAiSuggestion] = React.useState<string | null>(null);
  const [gasEstimate, setGasEstimate] = React.useState<string | null>(null);

  // New UI States
  const [showTestnets, setShowTestnets] = React.useState(true); // Default to testnets for safety

  // Auto-select first contract
  React.useEffect(() => {
      const keys = Object.keys(compiledContracts);
      if (keys.length > 0 && !selectedContract) {
          setSelectedContract(keys[0]);
      }
  }, [compiledContracts, selectedContract]);

  // Gas Estimation Hook
  React.useEffect(() => {
      const estimate = async () => {
          if (!selectedContract || !account) return;
          setGasEstimate(null);

          try {
              const contractData = compiledContracts[selectedContract];

              let provider: ethers.Provider | null = null;

              if (environment === 'injected' && window.ethereum) {
                   provider = new ethers.BrowserProvider(window.ethereum);
              } else if (environment === 'launchlayer' && chainId) {
                   // Map to a read-only provider for estimation
                   const rpc = getRpcForChain(chainId);
                   provider = new ethers.JsonRpcProvider(rpc);
              }

              if (provider) {
                   const factory = new ContractFactory(contractData.abi, contractData.bytecode);
                   const deployInputs = contractData.abi.find(item => item.type === 'constructor')?.inputs || [];
                   const args = deployInputs.map((input: any) => constructorArgs[input.name] || '');
                   const deployTx = await factory.getDeployTransaction(...args);

                   const estimate = await provider.estimateGas({
                       ...deployTx,
                       from: account // Estimate as if from the user
                   });

                   // Get gas price
                   const feeData = await provider.getFeeData();
                   const gasPrice = feeData.gasPrice || 1000000000n; // fallback 1 gwei

                   const cost = estimate * gasPrice;
                   setGasEstimate(ethers.formatEther(cost));
              }
          } catch (err) {
              console.log("Gas estimation failed:", err);
          }
      };

      const timer = setTimeout(estimate, 500); // Debounce
      return () => clearTimeout(timer);
  }, [selectedContract, constructorArgs, account, environment, chainId]);


  const handleDebug = async () => {
    if (!selectedContract) return;

    setIsDebugging(true);
    setAiSuggestion(null);
    addLog(`Starting AI Analysis for ${compiledContracts[selectedContract].name}...`, 'info', 'AI');

    try {
        const contractData = compiledContracts[selectedContract];
        const response = await supabase.functions.invoke('ai-review-deployment', {
            body: {
                contractName: contractData.name,
                abi: contractData.abi,
                bytecode: contractData.bytecode,
            }
        });

        if (response.error) {
            throw new Error(response.error.message);
        }

        const suggestion = response.data.message || response.data.analysis || "AI Analysis Complete.";
        setAiSuggestion(suggestion);
        addLog(`AI Analysis complete.`, 'success', 'AI');

    } catch (err: any) {
        console.error('AI Debug Error:', err);
        setAiSuggestion(`Error: ${err.message}`);
        addLog(`AI Analysis failed: ${err.message}`, 'error', 'AI');
    } finally {
        setIsDebugging(false);
    }
  };

  const getNetworkName = (id: string | null) => {
    if (!id) return '';
    const chain = CHAINS.find(c => c.id === Number(id));
    return chain ? chain.name : 'Unknown Network';
  };

  const handleDeploy = async () => {
      if (!selectedContract || !account) return;

      setIsDeploying(true);
      setDeployError(null);

      const contractData = compiledContracts[selectedContract];
      addLog(`Initiating deployment for ${contractData.name}...`, 'info', 'Deploy');

      try {
          let address: string = '';

          // Resolve args
          const deployInputs = contractData.abi.find(item => item.type === 'constructor')?.inputs || [];
          const args = deployInputs.map((input: any) => constructorArgs[input.name] || '');

          if (environment === 'injected') {
              const provider = new ethers.BrowserProvider(window.ethereum);
              const signer = await provider.getSigner();
              const factory = new ContractFactory(contractData.abi, contractData.bytecode, signer);

              addLog(`Sending transaction via MetaMask...`, 'info', 'Deploy');
              const contract = await factory.deploy(...args);

              const tx = contract.deploymentTransaction();
              if (tx) {
                  addLog(`Transaction sent: ${tx.hash}`, 'info', 'Deploy');
              }

              await contract.waitForDeployment();
              address = await contract.getAddress();
              addLog(`Contract deployed at: ${address}`, 'success', 'Deploy');

          } else if (environment === 'launchlayer') {
              if (!selectedCloudWalletId) throw new Error("No cloud wallet selected");

              addLog(`Preparing transaction for Cloud Wallet...`, 'info', 'Deploy');

              // 1. Prepare Provider (Client Side)
              const rpc = getRpcForChain(chainId!);
              const provider = new ethers.JsonRpcProvider(rpc);

              // 2. Prepare Transaction Data
              const factory = new ContractFactory(contractData.abi, contractData.bytecode);
              const deployTx = await factory.getDeployTransaction(...args);

              // 3. Fetch Nonce & Gas (Client Side) - No timeouts on server!
              const nonce = await provider.getTransactionCount(account);
              const feeData = await provider.getFeeData();
              const gasEstimate = await provider.estimateGas({
                  ...deployTx,
                  from: account
              });

              addLog(`Signing on secure server...`, 'info', 'Deploy');

              // 4. Send to Server for Signing ONLY
              const { data, error } = await supabase.functions.invoke('deploy-contract', {
                  body: {
                      wallet_id: selectedCloudWalletId,
                      transaction: {
                          to: null, // Deploying
                          data: deployTx.data,
                          value: "0",
                          nonce: nonce,
                          gasLimit: gasEstimate.toString(),
                          gasPrice: feeData.gasPrice?.toString(),
                          maxFeePerGas: feeData.maxFeePerGas?.toString(),
                          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
                          chainId: chainId,
                          type: 2 // EIP-1559 usually safe, or let ethers handle defaults if we omited type
                      }
                  }
              });

              if (error) throw new Error(error.message);
              if (!data.success) throw new Error(data.error || "Signing failed");

              const signedTx = data.signedTx;

              // 5. Broadcast (Client Side)
              addLog(`Broadcasting transaction...`, 'info', 'Deploy');
              const txResponse = await provider.broadcastTransaction(signedTx);

              addLog(`Transaction broadcasted: ${txResponse.hash}`, 'success', 'Deploy');

              addLog(`Waiting for confirmation...`, 'info', 'Deploy');
              const receipt = await provider.waitForTransaction(txResponse.hash);
              address = receipt?.contractAddress || "Deployed (Address pending)";
              addLog(`Contract deployed at: ${address}`, 'success', 'Deploy');

          } else {
              // VM Simulation
              addLog(`Simulating deployment in VM...`, 'info', 'Deploy');
              await new Promise(resolve => setTimeout(resolve, 500));
              address = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
              addLog(`Contract deployed at: ${address} (Simulated)`, 'success', 'Deploy');
          }

          addDeployedContract({
              address,
              name: contractData.name,
              abi: contractData.abi,
              networkId: Number(chainId),
              type: environment
          });

      } catch (err: any) {
          console.error(err);
          setDeployError(err.message || 'Deployment failed');
          addLog(`Deployment failed: ${err.message}`, 'error', 'Deploy');
      } finally {
          setIsDeploying(false);
      }
  };

  return (
    <div className="h-full flex flex-col text-slate-300">
        {/* Environment / Wallet */}
        <div className="p-4 border-b border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-2">Environment</h2>

            <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:border-blue-500 outline-none mb-2"
            >
                <option value="injected">Injected Provider - MetaMask</option>
                <option value="launchlayer">LaunchLayer Wallet (Cloud)</option>
                <option value="vm">JavaScript VM (Simulated)</option>
            </select>

            {environment === 'launchlayer' && (
                <div className="space-y-3 mb-2 bg-slate-900/50 p-3 rounded border border-slate-800">
                     <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <Cloud size={14} className="text-blue-400" />
                            <span className="text-xs text-blue-400 font-bold">Cloud Wallet</span>
                        </div>
                        {isLoadingWallets && <RefreshCw className="animate-spin text-slate-500" size={12} />}
                     </div>

                     {/* Wallet Select */}
                     {cloudWallets.length > 0 ? (
                         <select
                            value={selectedCloudWalletId || ''}
                            onChange={(e) => selectCloudWallet(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-300 outline-none focus:border-blue-500"
                         >
                             {cloudWallets.map(w => (
                                 <option key={w.id} value={w.id}>{w.name} - {w.wallet_address.slice(0,6)}...{w.wallet_address.slice(-4)}</option>
                             ))}
                         </select>
                     ) : (
                         <div className="text-xs text-red-400">No cloud wallets found.</div>
                     )}

                     <div className="h-px bg-slate-800 my-1" />

                     {/* Network Toggle */}
                     <div className="flex bg-slate-950 rounded p-1 border border-slate-800">
                         <button
                            onClick={() => { setShowTestnets(true); setChainId(11155111); }}
                            className={clsx(
                                "flex-1 text-xs py-1 rounded transition-colors text-center font-medium",
                                showTestnets ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                            )}
                         >
                             Testnet
                         </button>
                         <button
                            onClick={() => { setShowTestnets(false); setChainId(1); }}
                            className={clsx(
                                "flex-1 text-xs py-1 rounded transition-colors text-center font-medium",
                                !showTestnets ? "bg-orange-600/20 text-orange-400 border border-orange-600/50" : "text-slate-500 hover:text-slate-300"
                            )}
                         >
                             Mainnet
                         </button>
                     </div>

                     {/* Network Selector */}
                     <div>
                        <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                            <Globe size={10} /> Network
                        </label>
                        <select
                            value={chainId || (showTestnets ? 11155111 : 1)}
                            onChange={(e) => setChainId(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-300 outline-none focus:border-blue-500"
                        >
                            {CHAINS.filter(c => c.isTestnet === showTestnets).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                     </div>
                </div>
            )}

            {environment === 'injected' && !account ? (
                <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white p-2 rounded flex items-center justify-center gap-2 transition-colors"
                >
                    {isConnecting ? <RefreshCw className="animate-spin" size={16} /> : <Wallet size={16} />}
                    <span>Connect Wallet</span>
                </button>
            ) : (
                <div className="bg-slate-900 rounded p-3 text-xs space-y-2 border border-slate-800">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Account</span>
                        <div className="flex items-center gap-2">
                            <span className="text-blue-400 font-mono" title={account || ''}>{account?.slice(0, 6)}...{account?.slice(-4)}</span>
                            {environment === 'injected' && (
                                <button onClick={disconnectWallet} className="text-slate-600 hover:text-red-400">
                                    <AlertCircle size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                    {environment !== 'launchlayer' && (
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">Balance</span>
                            <span className="text-slate-300">{Number(balance).toFixed(4)} ETH</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Chain ID</span>
                        <div className="text-right">
                            <span className="text-slate-300">{chainId}</span>
                            <span className="text-xs text-slate-500 ml-2 block">
                                {getNetworkName(String(chainId))}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {error && <div className="text-red-400 text-xs p-2 bg-red-900/20 rounded border border-red-900/50">{error}</div>}
        </div>

        {/* Deploy Section */}
        <div className="p-4 border-b border-slate-800 flex-1 overflow-auto">
             <h2 className="text-sm font-bold uppercase tracking-wider mb-4">Deploy</h2>

             <div className="space-y-4">
                 <div>
                     <label className="block text-xs text-slate-500 mb-1">Contract</label>
                     <select
                        value={selectedContract}
                        onChange={(e) => setSelectedContract(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:border-blue-500 outline-none"
                     >
                         <option value="">Select a contract...</option>
                         {Object.keys(compiledContracts).map(key => (
                             <option key={key} value={key}>{compiledContracts[key].name} - {compiledContracts[key].fileName}</option>
                         ))}
                     </select>
                 </div>

                 {selectedContract && compiledContracts[selectedContract] && (
                     <div className="space-y-2">
                         {compiledContracts[selectedContract].abi.find(item => item.type === 'constructor')?.inputs.map((input: any, idx: number) => (
                             <div key={idx}>
                                 <label className="block text-xs text-slate-500 mb-1">{input.name || `Arg ${idx}`} ({input.type})</label>
                                 <input
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm"
                                    placeholder={input.type}
                                    onChange={(e) => setConstructorArgs(prev => ({ ...prev, [input.name]: e.target.value }))}
                                 />
                             </div>
                         ))}

                         {/* Gas Estimate Display */}
                         {gasEstimate && (
                             <div className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded flex justify-between items-center">
                                 <span>Est. Gas Cost:</span>
                                 <span className="text-orange-400 font-mono">~{Number(gasEstimate).toFixed(6)} ETH</span>
                             </div>
                         )}

                         <div className="flex gap-2">
                             <button
                                onClick={handleDeploy}
                                disabled={!account || isDeploying}
                                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white p-2 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeploying ? <RefreshCw className="animate-spin" size={16} /> : <span>Deploy</span>}
                            </button>

                            <button
                                onClick={handleDebug}
                                disabled={isDebugging}
                                className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded flex items-center justify-center transition-colors disabled:opacity-50"
                                title="Debug with AI"
                            >
                                {isDebugging ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                            </button>
                        </div>

                        {deployError && (
                            <div className="text-red-400 text-xs p-2 bg-red-900/20 rounded border border-red-900/50 break-words">
                                {deployError}
                            </div>
                        )}

                        {aiSuggestion && (
                            <div className="text-purple-300 text-xs p-3 bg-purple-900/20 rounded border border-purple-900/50 break-words whitespace-pre-wrap">
                                <div className="font-bold mb-1 flex items-center gap-2">
                                    <Sparkles size={12} /> AI Suggestion
                                </div>
                                {aiSuggestion}
                            </div>
                        )}
                     </div>
                 )}

                 <div className="pt-4 border-t border-slate-800">
                     <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Deployed Contracts</h3>
                     {deployedContracts.length === 0 ? (
                         <div className="text-center text-xs text-slate-600 py-4">
                             No contracts deployed yet.
                         </div>
                     ) : (
                         <div className="space-y-2">
                             {deployedContracts.map((contract, idx) => (
                                 <ContractInstance key={idx} {...contract} />
                             ))}
                         </div>
                     )}
                 </div>
             </div>
        </div>
    </div>
  );
}
