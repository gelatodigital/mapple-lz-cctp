// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {
    GelatoRelayContext
} from "@gelatonetwork/relay-context/contracts/GelatoRelayContext.sol";
import {
    IMapleCCTPReceiver
} from "./interfaces/IMapleCCTPReceiver.sol";
import {
    IMapleCCTPSender
} from "./interfaces/IMapleCCTPSender.sol";
import {ITokenMessenger} from "./interfaces/ITokenMessenger.sol";
import {IEIP3009Token} from "./interfaces/IEIP3009Token.sol";
import {Authorization} from "./types/Authorization.sol";
import {_computeVaultAddress} from "./Vault.sol";

import "hardhat/console.sol";

contract MapleCCTPSender is
    IMapleCCTPSender
{
    uint32 public constant DST_DOMAIN = 0;
    IEIP3009Token public constant SRC_TOKEN = IEIP3009Token(0x036CbD53842c5426634e7929541eC2318f3dCF7e);
    IEIP3009Token public constant DST_TOKEN = IEIP3009Token(0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238);
    ITokenMessenger public constant TOKEN_MESSENGER = ITokenMessenger(0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5);
    IMapleCCTPReceiver public immutable MAPLE_RECEIVER;

    constructor(
        IMapleCCTPReceiver _MapleReceiver
    ) {
        MAPLE_RECEIVER = _MapleReceiver;
    }

    function bridgeAndDeposit(
        address _owner,
        uint256 _amount,
        Authorization calldata _authorization
    ) external {

        SRC_TOKEN.receiveWithAuthorization(
            _owner,
            address(this),
            _amount,
            _authorization.validAfter,
            _authorization.validBefore,
            _authorization.nonce,
            _authorization.v,
            _authorization.r,
            _authorization.s
        );

       

      
        SRC_TOKEN.approve(address(TOKEN_MESSENGER), _amount);

        address sponsor = _decodeSponsor(_authorization);


        address vault = _computeVaultAddress(
            sponsor,
            DST_TOKEN,
            MAPLE_RECEIVER
        );

        TOKEN_MESSENGER.depositForBurnWithCaller(
            _amount,
            DST_DOMAIN, // Sepolia dst_domain
            _addressToBytes32(vault),
            address(SRC_TOKEN),
            _addressToBytes32(address(MAPLE_RECEIVER))
        );

        emit LogBridge(sponsor, _amount);
    }

    function _decodeSponsor(
        Authorization calldata _authorization
    ) internal pure returns (address) {
        return address(uint160(uint256(_authorization.nonce)));
    }

    function _addressToBytes32(address addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }
}
