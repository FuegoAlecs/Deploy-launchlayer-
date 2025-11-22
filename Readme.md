# 🚀 Launchlets

**The Complete Browser-Based Solidity IDE for Every EVM Chain**

Launchlets is a powerful, fully-featured Solidity development environment that runs entirely in your browser. Write, compile, deploy, and interact with smart contracts across all EVM-compatible blockchains—no backend required, no installation needed.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/solidity-%5E0.8.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue.svg)
![React](https://img.shields.io/badge/react-18+-61DAFB.svg)

---

## ✨ Features

### 🎨 Professional IDE Experience
- **Monaco Editor Integration** - Full-featured code editor with Solidity syntax highlighting
- **Multi-file Support** - Work with complex projects with multiple contracts and imports
- **Smart Auto-completion** - Context-aware suggestions for Solidity keywords and functions
- **Real-time Error Detection** - Instant feedback on syntax and compilation errors
- **File Tree Navigation** - Organized workspace with folders and nested directories

### ⚙️ Powerful Compilation
- **Solc-JS Integration** - Browser-based Solidity compiler (v0.4.11 to latest)
- **Version Switching** - Easy selection of any Solc version
- **Optimization Controls** - Configure optimizer runs and EVM versions
- **Detailed Outputs** - ABI, bytecode, opcodes, gas estimates, and more
- **Multi-contract Compilation** - Handles complex projects with dependencies

### 🌐 Universal Blockchain Support
Deploy to **any EVM-compatible chain**:

**Mainnets:**
- Ethereum, Polygon, Binance Smart Chain, Avalanche
- Arbitrum, Optimism, Base, Fantom, Cronos
- Gnosis, Celo, Moonbeam, Harmony, Aurora
- And 50+ more EVM chains

**Testnets:**
- Sepolia, Holesky, Mumbai, BSC Testnet
- Fuji, Arbitrum Sepolia, Optimism Sepolia
- Base Sepolia, Fantom Testnet, and more

**Custom Networks:**
- Add any EVM-compatible network with RPC configuration

### 💼 Smart Contract Deployment
- **MetaMask Integration** - One-click wallet connection
- **Multi-wallet Support** - WalletConnect, Coinbase Wallet, and more
- **Constructor Parameters** - Intuitive UI for complex deployment arguments
- **Gas Management** - Customizable gas limits and price settings
- **Transaction Tracking** - Real-time deployment status and confirmation

### 🎯 Contract Interaction
- **Automatic UI Generation** - Interact with deployed contracts instantly
- **Function Categorization** - Visual distinction for read/write/payable functions
- **Event Monitoring** - Decoded event logs from transactions
- **At Address Loading** - Connect to existing deployed contracts
- **Transaction History** - Complete log of all interactions

### 🔌 Plugin Ecosystem
- **Static Analyzer** - Security vulnerability detection and gas optimization
- **Debugger** - Step-through transaction debugging with state inspection
- **Unit Testing** - Run Solidity tests directly in the browser
- **Flattener** - Prepare contracts for verification on block explorers
- **Documentation Generator** - Create docs from NatSpec comments

### 💾 Data Persistence
- **Local Storage** - Your work is saved automatically in the browser
- **Export/Import** - Download and share complete workspaces
- **Session Recovery** - Resume exactly where you left off

---

## 🚀 Getting Started

### Quick Start
1. Visit [launchlets.app](https://launchlets.app) (or your deployment URL)
2. Start coding immediately—no sign-up required!
3. Connect your wallet when ready to deploy

### Your First Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HelloWorld {
    string public message;
    
    constructor(string memory _message) {
        message = _message;
    }
    
    function updateMessage(string memory _newMessage) public {
        message = _newMessage;
    }
}
```

1. **Write** - Paste the contract in the editor
2. **Compile** - Click "Compile HelloWorld.sol"
3. **Deploy** - Select network, connect wallet, and deploy
4. **Interact** - Call functions directly from the UI

---

## 🛠️ Installation

### For Development

```bash
# Clone the repository
git clone https://github.com/yourusername/launchlets.git
cd launchlets

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Editor**: Monaco Editor
- **Compiler**: solc-js (browser build)
- **Web3**: ethers.js v6
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Storage**: IndexedDB

---

## 📚 Documentation

### Core Modules

#### Compiler
```typescript
import { SolcCompiler } from './compiler';

const compiler = new SolcCompiler();
await compiler.loadVersion('0.8.20');
const output = await compiler.compile(sources);
```

#### Deployer
```typescript
import { ContractDeployer } from './deployer';

const deployer = new ContractDeployer();
await deployer.connect('injected');
const contract = await deployer.deploy(bytecode, abi, args);
```

#### File System
```typescript
import { FileSystemManager } from './filesystem';

const fs = new FileSystemManager();
await fs.createFile('contracts/MyToken.sol', content);
const files = await fs.listFiles('contracts/');
```

---

## 🌟 Key Features Explained

### Multi-Chain Deployment
Launchlets comes pre-configured with 100+ EVM networks. Simply select your target network from the dropdown, and Launchlets automatically configures the correct RPC endpoints and chain IDs.

### Browser-Based Compilation
No server-side compilation needed! Launchlets uses solc-js compiled to WebAssembly, allowing full Solidity compilation directly in your browser. This means:
- ⚡ Fast compilation times
- 🔒 Complete privacy (your code never leaves your browser)
- 🌍 Works offline after initial load

### Wallet Integration
Support for all major Ethereum wallets:
- MetaMask
- WalletConnect (any mobile wallet)
- Coinbase Wallet
- Rainbow Wallet
- And more...

### Smart Contract Templates
Get started quickly with pre-built templates:
- ERC-20 Token
- ERC-721 NFT
- ERC-1155 Multi-Token
- Governance Contracts
- Staking Contracts
- DEX/AMM Templates

---

## 🎨 Customization

### Themes
- Light Mode
- Dark Mode
- Custom themes (coming soon)

### Editor Settings
- Font size adjustment
- Tab size configuration
- Word wrap options
- Auto-save intervals

### Network Management
Add custom networks easily:
```typescript
{
  name: "My Custom Network",
  chainId: 12345,
  rpcUrl: "https://rpc.mynetwork.com",
  symbol: "CUSTOM",
  explorer: "https://explorer.mynetwork.com"
}
```

---

## 🔒 Security

Launchlets prioritizes security:

- ✅ **No Private Key Storage** - Uses wallet providers exclusively
- ✅ **No Backend** - Your code stays in your browser
- ✅ **Input Sanitization** - All user inputs are validated
- ✅ **Transaction Confirmations** - Clear confirmation modals before signing
- ✅ **Gas Limit Safeguards** - Warnings for suspicious transactions
- ✅ **Open Source** - Full transparency of the codebase

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Write TypeScript with strict mode
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

---

## 📝 Roadmap

### Version 1.0 (Current)
- ✅ Full IDE functionality
- ✅ All EVM chain support
- ✅ Basic plugin system

### Version 1.1 (Coming Soon)
- 🔄 GitHub integration
- 🔄 IPFS deployment
- 🔄 Advanced debugger
- 🔄 Contract verification

### Version 2.0 (Future)
- 🔮 AI-powered code suggestions
- 🔮 Collaborative editing
- 🔮 Gas optimization analyzer
- 🔮 Formal verification tools

---

## 🐛 Troubleshooting

### Common Issues

**Compilation Fails**
- Check Solidity version compatibility
- Verify import paths are correct
- Review error messages in the console

**Deployment Fails**
- Ensure wallet is connected
- Check you're on the correct network
- Verify sufficient gas and balance

**Transaction Not Confirming**
- Check network congestion
- Try increasing gas price
- Verify contract logic for reverts

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Remix IDE** - Inspiration and reference implementation
- **Solidity Team** - Amazing language and compiler
- **Ethereum Foundation** - Building the decentralized future
- **OpenZeppelin** - Secure smart contract libraries
- **All Contributors** - Thank you for making Launchlets better!

---

## 📞 Support & Community

- **Documentation**: [docs.launchlets.app](https://docs.launchlets.app)
- **Discord**: [Join our community](https://discord.gg/launchlets)
- **Twitter**: [@launchlets](https://twitter.com/launchlets)
- **GitHub Issues**: [Report bugs](https://github.com/yourusername/launchlets/issues)
- **Email**: support@launchlets.app

---

## 🌟 Star Us!

If Launchlets helps you build amazing dApps, please consider giving us a star ⭐ on GitHub!

---

**Built with ❤️ by developers, for developers**

*Launch your smart contracts anywhere, anytime, from any device.*
