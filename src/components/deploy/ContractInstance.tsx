import React from 'react';
import { Contract, ethers } from 'ethers';
import { ChevronRight, ChevronDown, Copy } from 'lucide-react';
import { clsx } from 'clsx';
import { useDeployment } from '../../store/useDeployment';
import { useTerminal } from '../../store/useTerminal';
import { supabase } from '../../lib/supabase';
import { getRpcForChain } from './DeployPanel';

interface ContractInstanceProps {
    address: string;
    abi: any[];
    name: string;
    type?: 'injected' | 'vm' | 'launchlayer';
}

export function ContractInstance({ address, abi, name, type = 'injected' }: ContractInstanceProps) {
    const { provider, signer, selectedCloudWalletId, chainId, account } = useDeployment();
    const { addLog } = useTerminal();

    const [isExpanded, setIsExpanded] = React.useState(false);
    const [contract, setContract] = React.useState<Contract | null>(null);
    const [inputs, setInputs] = React.useState<Record<string, string>>({});
    const [outputs, setOutputs] = React.useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = React.useState<Record<string, boolean>>({});

    React.useEffect(() => {
        if (type === 'injected' && provider && address && abi) {
            const instance = new Contract(address, abi, signer || provider);
            setContract(instance);
        }
    }, [provider, signer, address, abi, type, chainId]);

    const handleInteraction = async (funcName: string, funcType: 'view' | 'pure' | 'nonpayable' | 'payable', inputsArg: any[]) => {
        setIsLoading(prev => ({ ...prev, [funcName]: true }));
        addLog(`Calling ${name}.${funcName}...`, 'info', 'Interact');

        try {
             // Gather args
            const args = inputsArg.map(input => inputs[`${funcName}_${input.name}`] || '');

            if (type === 'vm') {
                // Simulated Interaction
                await new Promise(resolve => setTimeout(resolve, 300));

                if (funcType === 'view' || funcType === 'pure') {
                    const result = `[Simulated Result]`;
                    setOutputs(prev => ({ ...prev, [funcName]: result }));
                    addLog(`${name}.${funcName} returned: ${result}`, 'success', 'Interact');
                } else {
                     const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
                     setOutputs(prev => ({ ...prev, [funcName]: `Tx Mined (Simulated): ${txHash}` }));
                     addLog(`${name}.${funcName} executed: ${txHash}`, 'success', 'Interact');
                }
            } else if (type === 'launchlayer') {

                const rpc = getRpcForChain(chainId!);
                const provider = new ethers.JsonRpcProvider(rpc);

                if (funcType === 'view' || funcType === 'pure') {
                     // Read-only call
                    const instance = new ethers.Contract(address, abi, provider);
                    const result = await instance[funcName](...args);
                    setOutputs(prev => ({ ...prev, [funcName]: result.toString() }));
                    addLog(`${name}.${funcName} returned: ${result}`, 'success', 'Interact');

                } else {
                    // State changing tx -> Client Prepare -> Server Sign -> Client Broadcast
                    if (!selectedCloudWalletId) throw new Error("No cloud wallet selected");

                    const iface = new ethers.Interface(abi);
                    const data = iface.encodeFunctionData(funcName, args);

                    // Fetch current nonce & gas
                    const nonce = await provider.getTransactionCount(account!);
                    const feeData = await provider.getFeeData();

                    // Estimate Gas
                    const txForEst = {
                        to: address,
                        data: data,
                        value: "0",
                        from: account
                    };
                    const gasLimit = await provider.estimateGas(txForEst);

                    // Call Signing Service
                    const { data: resData, error } = await supabase.functions.invoke('deploy-contract', {
                        body: {
                            wallet_id: selectedCloudWalletId,
                            transaction: {
                                to: address,
                                data: data,
                                value: "0", // TODO: Handle payable
                                nonce: nonce,
                                gasLimit: gasLimit.toString(),
                                gasPrice: feeData.gasPrice?.toString(),
                                maxFeePerGas: feeData.maxFeePerGas?.toString(),
                                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
                                chainId: chainId,
                                type: 2
                            }
                        }
                    });

                    if (error) throw error;
                    if (!resData.success) throw new Error(resData.error);

                    addLog(`Transaction signed: ${resData.signedTx.slice(0, 10)}...`, 'info', 'Interact');

                    // Broadcast
                    const txResponse = await provider.broadcastTransaction(resData.signedTx);
                    addLog(`Transaction broadcasted: ${txResponse.hash}`, 'success', 'Interact');
                    setOutputs(prev => ({ ...prev, [funcName]: `Tx: ${txResponse.hash}` }));
                }

            } else {
                // Injected (MetaMask)
                if (!contract) throw new Error("Contract not connected");

                let result: any;
                if (funcType === 'view' || funcType === 'pure') {
                    result = await contract[funcName](...args);
                    setOutputs(prev => ({ ...prev, [funcName]: result.toString() }));
                    addLog(`${name}.${funcName} returned: ${result}`, 'success', 'Interact');
                } else {
                    const tx = await contract[funcName](...args);
                    addLog(`Tx sent: ${tx.hash}`, 'info', 'Interact');
                    setOutputs(prev => ({ ...prev, [funcName]: `Tx sent: ${tx.hash}` }));
                    await tx.wait();
                    addLog(`Tx confirmed: ${tx.hash}`, 'success', 'Interact');
                    setOutputs(prev => ({ ...prev, [funcName]: `Confirmed: ${tx.hash}` }));
                }
            }
        } catch (err: any) {
            console.error(err);
            setOutputs(prev => ({ ...prev, [funcName]: `Error: ${err.message}` }));
            addLog(`Error calling ${funcName}: ${err.message}`, 'error', 'Interact');
        } finally {
            setIsLoading(prev => ({ ...prev, [funcName]: false }));
        }
    };

    const functions = abi.filter(item => item.type === 'function');

    return (
        <div className="border border-slate-800 rounded bg-slate-900/50 mb-2 overflow-hidden">
            <div
                className="flex items-center justify-between p-2 bg-slate-900 cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="font-bold text-slate-300 text-sm">{name}</span>
                    <span className="text-xs text-slate-500 truncate ml-2">{address}</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(address);
                    }}
                    className="p-1 hover:text-blue-400 text-slate-600"
                >
                    <Copy size={12} />
                </button>
            </div>

            {isExpanded && (
                <div className="p-2 space-y-2">
                    {functions.map((func, idx) => {
                        const isPayable = func.stateMutability === 'payable';
                        const isView = func.stateMutability === 'view' || func.stateMutability === 'pure';
                        const colorClass = isPayable ? 'bg-red-500 hover:bg-red-600' : (isView ? 'bg-blue-600 hover:bg-blue-500' : 'bg-orange-500 hover:bg-orange-600');

                        return (
                            <div key={idx} className="flex flex-col gap-1">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleInteraction(func.name, func.stateMutability, func.inputs)}
                                        disabled={isLoading[func.name]}
                                        className={clsx(
                                            "px-3 py-1 rounded text-xs text-white font-medium shadow-sm transition-all min-w-[80px]",
                                            colorClass,
                                            isLoading[func.name] && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {func.name}
                                    </button>
                                    {func.inputs.length > 0 && (
                                        <div className="flex-1 flex gap-1 overflow-x-auto">
                                            {func.inputs.map((input: any, i: number) => (
                                                <input
                                                    key={i}
                                                    placeholder={`${input.type} ${input.name}`}
                                                    className="bg-slate-950 border border-slate-700 rounded px-2 text-xs text-slate-300 min-w-[100px] flex-1"
                                                    onChange={(e) => setInputs(prev => ({ ...prev, [`${func.name}_${input.name}`]: e.target.value }))}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {outputs[func.name] && (
                                    <div className="text-xs font-mono text-slate-400 pl-2 border-l-2 border-slate-700 ml-1">
                                        ↳ {outputs[func.name]}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
