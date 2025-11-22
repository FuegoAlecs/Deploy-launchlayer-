import React from 'react';
import { useDeployment } from '../../store/useDeployment';
import { useCompiler } from '../../store/useCompiler';
import { Wallet, RefreshCw, AlertCircle } from 'lucide-react';
import { ethers, ContractFactory } from 'ethers';
import { ContractInstance } from './ContractInstance';

export function DeployPanel() {
  const {
      connectWallet, disconnectWallet, account, balance, chainId, isConnecting, error,
      deployedContracts, addDeployedContract
  } = useDeployment();
  const { compiledContracts } = useCompiler();

  const [selectedContract, setSelectedContract] = React.useState<string>('');
  const [constructorArgs, setConstructorArgs] = React.useState<Record<string, string>>({});
  const [isDeploying, setIsDeploying] = React.useState(false);
  const [deployError, setDeployError] = React.useState<string | null>(null);

  // Auto-select first contract
  React.useEffect(() => {
      const keys = Object.keys(compiledContracts);
      if (keys.length > 0 && !selectedContract) {
          setSelectedContract(keys[0]);
      }
  }, [compiledContracts, selectedContract]);

  const handleDeploy = async () => {
      if (!selectedContract || !account) return;

      setIsDeploying(true);
      setDeployError(null);

      try {
          const contractData = compiledContracts[selectedContract];
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          const factory = new ContractFactory(contractData.abi, contractData.bytecode, signer);

          // Resolve args
          const deployInputs = contractData.abi.find(item => item.type === 'constructor')?.inputs || [];
          const args = deployInputs.map((input: any) => constructorArgs[input.name] || '');

          const contract = await factory.deploy(...args);
          await contract.waitForDeployment();

          const address = await contract.getAddress();

          addDeployedContract({
              address,
              name: contractData.name,
              abi: contractData.abi,
              networkId: Number(chainId)
          });

      } catch (err: any) {
          console.error(err);
          setDeployError(err.message || 'Deployment failed');
      } finally {
          setIsDeploying(false);
      }
  };

  return (
    <div className="h-full flex flex-col text-slate-300">
        {/* Environment / Wallet */}
        <div className="p-4 border-b border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-2">Environment</h2>

            {!account ? (
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
                            <span className="text-blue-400 font-mono" title={account}>{account.slice(0, 6)}...{account.slice(-4)}</span>
                            <button onClick={disconnectWallet} className="text-slate-600 hover:text-red-400">
                                <AlertCircle size={12} />
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Balance</span>
                        <span className="text-slate-300">{Number(balance).toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500">Chain ID</span>
                        <span className="text-slate-300">{chainId}</span>
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
                     {Object.keys(compiledContracts).length === 0 && (
                         <p className="text-xs text-slate-500 mt-1 italic">Compile a contract to see it here.</p>
                     )}
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

                         <button
                            onClick={handleDeploy}
                            disabled={!account || isDeploying}
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white p-2 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDeploying ? <RefreshCw className="animate-spin" size={16} /> : <span>Deploy</span>}
                        </button>

                        {deployError && (
                            <div className="text-red-400 text-xs p-2 bg-red-900/20 rounded border border-red-900/50 break-words">
                                {deployError}
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
