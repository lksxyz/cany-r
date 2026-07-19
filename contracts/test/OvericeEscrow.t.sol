// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Test } from "forge-std/Test.sol";
import { OvericeEscrow } from "../src/OvericeEscrow.sol";
import { MockUSDC } from "./mocks/MockUSDC.sol";

contract OvericeEscrowTest is Test {
    OvericeEscrow escrow;
    MockUSDC usdc;

    uint256 agentKey = 0xA11CE;
    address agent;
    address tourist;
    address platformWallet;

    uint256 constant DEPOSIT_AMOUNT = 100_000_000;
    uint256 constant TOURIST_AMOUNT = 10_000_000;
    uint256 constant AGENT_MARGIN = 500_000;
    uint256 constant PLATFORM_FEE = 50_000;

    function setUp() public {
        agent = vm.addr(agentKey);
        tourist = makeAddr("tourist");
        platformWallet = makeAddr("platform");

        usdc = new MockUSDC();
        escrow = new OvericeEscrow(address(usdc), platformWallet);

        usdc.mint(agent, DEPOSIT_AMOUNT);

        vm.prank(agent);
        usdc.approve(address(escrow), type(uint256).max);

        vm.prank(agent);
        escrow.deposit(DEPOSIT_AMOUNT);
    }

    function _signRelease(
        bytes32 exchangeId,
        uint256 nonce,
        uint256 expiry
    ) internal view returns (bytes memory) {
        bytes32 digest = keccak256(
            abi.encodePacked(exchangeId, nonce, expiry)
        );
        bytes32 prefixed = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", digest)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentKey, prefixed);
        return abi.encodePacked(r, s, v);
    }

    function test_Deposit() public view {
        assertEq(escrow.escrowBalances(agent), DEPOSIT_AMOUNT);
        assertEq(usdc.balanceOf(address(escrow)), DEPOSIT_AMOUNT);
        assertEq(usdc.balanceOf(agent), 0);
    }

    function test_Withdraw() public {
        vm.prank(agent);
        escrow.withdraw(10_000_000);

        assertEq(escrow.escrowBalances(agent), DEPOSIT_AMOUNT - 10_000_000);
        assertEq(usdc.balanceOf(agent), 10_000_000);
    }

    function test_RevertWhen_WithdrawExceedsBalance() public {
        vm.prank(agent);
        vm.expectRevert("Insufficient escrow balance");
        escrow.withdraw(DEPOSIT_AMOUNT + 1);
    }

    function test_RevertWhen_DepositZero() public {
        vm.prank(agent);
        vm.expectRevert("Amount must be > 0");
        escrow.deposit(0);
    }

    function test_ReleaseEscrow() public {
        bytes32 exchangeId = keccak256("exchange-1");
        uint256 nonce = 12345;
        uint256 expiry = block.timestamp + 300;
        bytes memory signature = _signRelease(exchangeId, nonce, expiry);

        vm.prank(tourist);
        escrow.releaseEscrow(
            exchangeId,
            tourist,
            TOURIST_AMOUNT,
            AGENT_MARGIN,
            nonce,
            expiry,
            signature
        );

        assertEq(usdc.balanceOf(tourist), TOURIST_AMOUNT);
        assertEq(usdc.balanceOf(platformWallet), PLATFORM_FEE);
        assertEq(usdc.balanceOf(agent), AGENT_MARGIN);
        assertEq(
            escrow.escrowBalances(agent),
            DEPOSIT_AMOUNT - TOURIST_AMOUNT - PLATFORM_FEE - AGENT_MARGIN
        );
    }

    function test_RevertWhen_QRExpired() public {
        bytes32 exchangeId = keccak256("exchange-1");
        uint256 nonce = 12345;
        uint256 expiry = block.timestamp - 1;
        bytes memory signature = _signRelease(exchangeId, nonce, expiry);

        vm.prank(tourist);
        vm.expectRevert("QR expired");
        escrow.releaseEscrow(
            exchangeId,
            tourist,
            TOURIST_AMOUNT,
            AGENT_MARGIN,
            nonce,
            expiry,
            signature
        );
    }

    function test_RevertWhen_ReplayDigest() public {
        bytes32 exchangeId = keccak256("exchange-1");
        uint256 nonce = 12345;
        uint256 expiry = block.timestamp + 300;
        bytes memory signature = _signRelease(exchangeId, nonce, expiry);

        vm.prank(tourist);
        escrow.releaseEscrow(
            exchangeId,
            tourist,
            TOURIST_AMOUNT,
            AGENT_MARGIN,
            nonce,
            expiry,
            signature
        );

        vm.prank(tourist);
        vm.expectRevert("Digest already used");
        escrow.releaseEscrow(
            exchangeId,
            tourist,
            TOURIST_AMOUNT,
            AGENT_MARGIN,
            nonce,
            expiry,
            signature
        );
    }

    function test_RevertWhen_InvalidSignature() public {
        bytes32 exchangeId = keccak256("exchange-1");
        uint256 nonce = 12345;
        uint256 expiry = block.timestamp + 300;

        bytes memory signature = _signRelease(exchangeId, nonce, expiry);
        signature[0] = bytes1(uint8(signature[0]) ^ 0x01);

        vm.prank(tourist);
        vm.expectRevert("Invalid signature");
        escrow.releaseEscrow(
            exchangeId,
            tourist,
            TOURIST_AMOUNT,
            AGENT_MARGIN,
            nonce,
            expiry,
            signature
        );
    }

    function test_RevertWhen_WrongSigner() public {
        bytes32 exchangeId = keccak256("exchange-1");
        uint256 nonce = 12345;
        uint256 expiry = block.timestamp + 300;

        uint256 wrongKey = 0xBADD;
        bytes32 digest = keccak256(
            abi.encodePacked(exchangeId, nonce, expiry)
        );
        bytes32 prefixed = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", digest)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, prefixed);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(tourist);
        vm.expectRevert("Insufficient escrow balance");
        escrow.releaseEscrow(
            exchangeId,
            tourist,
            TOURIST_AMOUNT,
            AGENT_MARGIN,
            nonce,
            expiry,
            signature
        );
    }

    function test_RevertWhen_InsufficientBalance() public {
        bytes32 exchangeId = keccak256("exchange-2");
        uint256 nonce = 67890;
        uint256 expiry = block.timestamp + 300;
        bytes memory signature = _signRelease(exchangeId, nonce, expiry);

        uint256 touristAmount = DEPOSIT_AMOUNT - PLATFORM_FEE;
        uint256 marginCap = 1_000_000;

        vm.prank(tourist);
        vm.expectRevert("Insufficient escrow balance");
        escrow.releaseEscrow(
            exchangeId,
            tourist,
            touristAmount,
            marginCap,
            nonce,
            expiry,
            signature
        );
    }

    function test_RevertWhen_InvalidMargin() public {
        bytes32 exchangeId = keccak256("exchange-3");
        uint256 nonce = 11111;
        uint256 expiry = block.timestamp + 300;
        bytes memory signature = _signRelease(exchangeId, nonce, expiry);

        vm.prank(tourist);
        vm.expectRevert("Invalid agent margin");
        escrow.releaseEscrow(
            exchangeId,
            tourist,
            TOURIST_AMOUNT,
            AGENT_MARGIN + 1,
            nonce,
            expiry,
            signature
        );
    }

    function test_MarginCapAtMax() public {
        uint256 largeTouristAmount = 30_000_000;
        uint256 expectedMargin = 1_000_000;

        bytes32 exchangeId = keccak256("exchange-large");
        uint256 nonce = 99999;
        uint256 expiry = block.timestamp + 300;
        bytes memory signature = _signRelease(exchangeId, nonce, expiry);

        uint256 extraDeposit = largeTouristAmount + PLATFORM_FEE + expectedMargin;
        usdc.mint(agent, extraDeposit);
        vm.prank(agent);
        usdc.approve(address(escrow), type(uint256).max);
        vm.prank(agent);
        escrow.deposit(extraDeposit);

        vm.prank(tourist);
        escrow.releaseEscrow(
            exchangeId,
            tourist,
            largeTouristAmount,
            expectedMargin,
            nonce,
            expiry,
            signature
        );

        assertEq(usdc.balanceOf(tourist), largeTouristAmount);
        assertEq(usdc.balanceOf(agent), expectedMargin);
    }

    function test_SetPlatformWallet() public {
        address newWallet = makeAddr("new-platform");

        vm.prank(platformWallet);
        escrow.setPlatformWallet(newWallet);

        assertEq(escrow.platformWallet(), newWallet);
    }

    function test_RevertWhen_NonOwnerSetPlatformWallet() public {
        vm.prank(tourist);
        vm.expectRevert("Only platform wallet");
        escrow.setPlatformWallet(makeAddr("evil"));
    }

    function test_RevertWhen_SetPlatformWalletZero() public {
        vm.prank(platformWallet);
        vm.expectRevert("Invalid address");
        escrow.setPlatformWallet(address(0));
    }

    function test_GetEscrowBalance() public view {
        assertEq(escrow.getEscrowBalance(agent), DEPOSIT_AMOUNT);
        assertEq(escrow.getEscrowBalance(tourist), 0);
    }

    function test_Event_EscrowReleased() public {
        bytes32 exchangeId = keccak256("exchange-event");
        uint256 nonce = 77777;
        uint256 expiry = block.timestamp + 300;
        bytes memory signature = _signRelease(exchangeId, nonce, expiry);

        vm.prank(tourist);
        vm.expectEmit(true, true, true, true);
        emit OvericeEscrow.EscrowReleased(
            exchangeId,
            tourist,
            agent,
            TOURIST_AMOUNT,
            PLATFORM_FEE,
            AGENT_MARGIN
        );
        escrow.releaseEscrow(
            exchangeId,
            tourist,
            TOURIST_AMOUNT,
            AGENT_MARGIN,
            nonce,
            expiry,
            signature
        );
    }
}
