// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Script } from "forge-std/Script.sol";
import { OvericeEscrow } from "../src/OvericeEscrow.sol";

contract DeployEscrow is Script {
    function run() external {
        address usdc = vm.envAddress("USDC_ADDRESS");
        address platformWallet = vm.envAddress("PLATFORM_WALLET");

        vm.startBroadcast();
        new OvericeEscrow(usdc, platformWallet);
        vm.stopBroadcast();
    }
}
