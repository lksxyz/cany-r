// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { IERC20 } from "./interfaces/IERC20.sol";

contract OvericeEscrow {
    IERC20 public immutable usdc;
    address public platformWallet;

    uint256 public constant PLATFORM_FEE = 50_000;
    uint256 public constant MAX_AGENT_MARGIN = 1_000_000;
    uint256 public constant MARGIN_BPS = 500;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    mapping(address => uint256) public escrowBalances;
    mapping(bytes32 => bool) public usedDigests;

    event Deposited(address indexed agent, uint256 amount);
    event Withdrawn(address indexed agent, uint256 amount);
    event EscrowReleased(
        bytes32 indexed exchangeId,
        address indexed tourist,
        address indexed agent,
        uint256 touristAmount,
        uint256 fee,
        uint256 agentMargin
    );
    event PlatformWalletUpdated(
        address indexed oldWallet,
        address indexed newWallet
    );

    constructor(address _usdc, address _platformWallet) {
        usdc = IERC20(_usdc);
        platformWallet = _platformWallet;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "TransferFrom failed"
        );
        escrowBalances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(
            escrowBalances[msg.sender] >= amount,
            "Insufficient escrow balance"
        );
        escrowBalances[msg.sender] -= amount;
        require(
            usdc.transfer(msg.sender, amount),
            "Transfer failed"
        );
        emit Withdrawn(msg.sender, amount);
    }

    function getEscrowBalance(
        address agent
    ) external view returns (uint256) {
        return escrowBalances[agent];
    }

    function releaseEscrow(
        bytes32 exchangeId,
        address tourist,
        uint256 touristAmount,
        uint256 agentMargin,
        uint256 nonce,
        uint256 expiry,
        bytes calldata signature
    ) external {
        require(block.timestamp <= expiry, "QR expired");

        bytes32 digest = keccak256(
            abi.encodePacked(exchangeId, nonce, expiry)
        );
        require(!usedDigests[digest], "Digest already used");

        address agent = _verifySigner(digest, signature);
        require(agent != address(0), "Invalid signature");

        uint256 expectedMargin = (touristAmount * MARGIN_BPS) /
            BPS_DENOMINATOR;
        if (expectedMargin > MAX_AGENT_MARGIN) {
            expectedMargin = MAX_AGENT_MARGIN;
        }
        require(agentMargin == expectedMargin, "Invalid agent margin");

        uint256 totalRequired = touristAmount + PLATFORM_FEE + agentMargin;
        require(
            escrowBalances[agent] >= totalRequired,
            "Insufficient escrow balance"
        );

        usedDigests[digest] = true;
        escrowBalances[agent] -= totalRequired;

        require(
            usdc.transfer(tourist, touristAmount),
            "Transfer to tourist failed"
        );
        require(
            usdc.transfer(platformWallet, PLATFORM_FEE),
            "Transfer fee failed"
        );
        require(
            usdc.transfer(agent, agentMargin),
            "Transfer margin failed"
        );

        emit EscrowReleased(
            exchangeId,
            tourist,
            agent,
            touristAmount,
            PLATFORM_FEE,
            agentMargin
        );
    }

    function setPlatformWallet(address newWallet) external {
        require(msg.sender == platformWallet, "Only platform wallet");
        require(newWallet != address(0), "Invalid address");
        emit PlatformWalletUpdated(platformWallet, newWallet);
        platformWallet = newWallet;
    }

    function _verifySigner(
        bytes32 digest,
        bytes calldata signature
    ) internal pure returns (address) {
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                digest
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = _splitSignature(signature);
        return ecrecover(ethSignedHash, v, r, s);
    }

    function _splitSignature(
        bytes calldata sig
    ) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        require(sig.length == 65, "Invalid signature length");
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 0x20))
            v := byte(0, calldataload(add(sig.offset, 0x40)))
        }
        if (v < 27) v += 27;
    }
}
