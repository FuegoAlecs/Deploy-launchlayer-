import React from 'react';
import { ethers } from 'ethers';
import { useCompiler } from '../../store/useCompiler';
import { Code, Calculator } from 'lucide-react';

export function DevToolsPanel() {
  const [activeTab, setActiveTab] = React.useState<'converter' | 'abi'>('converter');

  return (
    <div className="h-full flex flex-col text-slate-300">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <span className="font-medium text-sm tracking-wide text-slate-400 uppercase block mb-3">Developer Tools</span>
            <div className="flex bg-slate-950 rounded p-1 border border-slate-800">
                <button
                    onClick={() => setActiveTab('converter')}
                    className={`flex-1 text-xs py-1.5 rounded flex items-center justify-center gap-2 transition-colors ${activeTab === 'converter' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Calculator size={12} /> Converter
                </button>
                <button
                    onClick={() => setActiveTab('abi')}
                    className={`flex-1 text-xs py-1.5 rounded flex items-center justify-center gap-2 transition-colors ${activeTab === 'abi' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Code size={12} /> ABI Encoder
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
            {activeTab === 'converter' ? <UnitConverter /> : <AbiEncoder />}
        </div>
    </div>
  );
}

function UnitConverter() {
    const [ether, setEther] = React.useState('1');
    const [gwei, setGwei] = React.useState('1000000000');
    const [wei, setWei] = React.useState('1000000000000000000');

    const handleChange = (type: 'ether' | 'gwei' | 'wei', value: string) => {
        try {
            if (!value) {
                setEther(''); setGwei(''); setWei('');
                return;
            }
            if (type === 'ether') {
                setEther(value);
                setWei(ethers.parseEther(value).toString());
                setGwei(ethers.formatUnits(ethers.parseEther(value), 'gwei'));
            } else if (type === 'gwei') {
                setGwei(value);
                setWei(ethers.parseUnits(value, 'gwei').toString());
                setEther(ethers.formatEther(ethers.parseUnits(value, 'gwei')));
            } else {
                setWei(value);
                setEther(ethers.formatEther(value));
                setGwei(ethers.formatUnits(value, 'gwei'));
            }
        } catch (e) {
            // Ignore parse errors while typing
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs text-slate-500 mb-1 block">Ether</label>
                <input
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-300"
                    value={ether}
                    onChange={(e) => handleChange('ether', e.target.value)}
                    placeholder="0.0"
                />
            </div>
            <div>
                <label className="text-xs text-slate-500 mb-1 block">Gwei</label>
                <input
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-300"
                    value={gwei}
                    onChange={(e) => handleChange('gwei', e.target.value)}
                    placeholder="0"
                />
            </div>
            <div>
                <label className="text-xs text-slate-500 mb-1 block">Wei</label>
                <input
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-300"
                    value={wei}
                    onChange={(e) => handleChange('wei', e.target.value)}
                    placeholder="0"
                />
            </div>
        </div>
    );
}

function AbiEncoder() {
    const { compiledContracts } = useCompiler();
    const [selectedContract, setSelectedContract] = React.useState('');
    const [selectedFunction, setSelectedFunction] = React.useState('');
    const [inputs, setInputs] = React.useState<Record<string, string>>({});
    const [encodedData, setEncodedData] = React.useState('');

    const contract = compiledContracts[selectedContract];
    const abi = contract?.abi || [];
    const functions = abi.filter((item: any) => item.type === 'function');
    const func = functions.find((f: any) => f.name === selectedFunction);

    React.useEffect(() => {
        if (contract && func) {
            try {
                const iface = new ethers.Interface(abi);
                const args = func.inputs.map((input: any) => inputs[input.name] || '');
                const data = iface.encodeFunctionData(func.name, args);
                setEncodedData(data);
            } catch (e) {
                setEncodedData('Invalid inputs');
            }
        } else {
            setEncodedData('');
        }
    }, [contract, func, inputs]);

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs text-slate-500 mb-1 block">Contract</label>
                <select
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-300"
                    value={selectedContract}
                    onChange={(e) => { setSelectedContract(e.target.value); setSelectedFunction(''); }}
                >
                    <option value="">Select Contract...</option>
                    {Object.keys(compiledContracts).map(key => (
                        <option key={key} value={key}>{compiledContracts[key].name}</option>
                    ))}
                </select>
            </div>

            {contract && (
                <div>
                    <label className="text-xs text-slate-500 mb-1 block">Function</label>
                    <select
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-300"
                        value={selectedFunction}
                        onChange={(e) => setSelectedFunction(e.target.value)}
                    >
                        <option value="">Select Function...</option>
                        {functions.map((f: any, idx: number) => (
                            <option key={idx} value={f.name}>{f.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {func && (
                <div className="space-y-2 border-t border-slate-800 pt-2">
                    {func.inputs.map((input: any, idx: number) => (
                        <div key={idx}>
                            <label className="text-xs text-slate-500 mb-1 block">{input.name} ({input.type})</label>
                            <input
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-300"
                                placeholder={input.type}
                                value={inputs[input.name] || ''}
                                onChange={(e) => setInputs(prev => ({ ...prev, [input.name]: e.target.value }))}
                            />
                        </div>
                    ))}
                </div>
            )}

            {encodedData && (
                <div className="mt-4">
                    <label className="text-xs text-slate-500 mb-1 block">Encoded Calldata</label>
                    <div className="bg-slate-950 border border-slate-700 rounded p-2 text-xs font-mono break-all text-green-400">
                        {encodedData}
                    </div>
                </div>
            )}
        </div>
    );
}
