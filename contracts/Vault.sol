// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IEIP3009Token} from "./interfaces/IEIP3009Token.sol";
import {
    IMapleCCTPReceiver
} from "./interfaces/IMapleCCTPReceiver.sol";

function _computeVaultAddress(
    address _owner,
    IEIP3009Token _token,
    IMapleCCTPReceiver _mapleReceiver
) pure returns (address) {
    bytes32 hashed = keccak256(
        abi.encodePacked(
            bytes1(0xff),
            _mapleReceiver,
            keccak256(abi.encodePacked(_owner)),
            keccak256(
                abi.encodePacked(type(Vault).creationCode, abi.encode(_token))
            )
        )
    );
    return address(uint160(uint(hashed)));
}

contract Vault {
    constructor(IEIP3009Token _token) {
        _token.approve(msg.sender, type(uint256).max);
    }
}
