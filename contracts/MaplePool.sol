// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MaplePool {
    
   IERC20 public constant TOKEN = IERC20(0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238);
   mapping(address => uint) public balances;
     function depositToken(
        address sponsor,
        uint256 amount
    ) external {
        TOKEN.transferFrom(msg.sender,address(this),amount);
        balances[sponsor] =  balances[sponsor] + amount;
    }
}
