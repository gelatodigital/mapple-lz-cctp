// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {
    GelatoRelayContext
} from "@gelatonetwork/relay-context/contracts/GelatoRelayContext.sol";
import {
    IMapleCCTPReceiver
} from "./interfaces/IMapleCCTPReceiver.sol";
import {IMessageTransmitter} from "./interfaces/IMessageTransmitter.sol";
import {IMaplePool} from "./interfaces/IMaplePool.sol";
import {IEIP3009Token} from "./interfaces/IEIP3009Token.sol";
import {Vault, _computeVaultAddress} from "./Vault.sol";

contract MapleCCTPReceiver is
    IMapleCCTPReceiver,
    GelatoRelayContext
{
    IEIP3009Token public constant TOKEN = IEIP3009Token(0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238);
    IMessageTransmitter public constant MESSAGE_TRANSMITTER = IMessageTransmitter(0x7865fAfC2db2093669d92c0F33AeEF291086BEFD);

    IMaplePool public immutable MAPLE_POOL;
    
    // https://developers.circle.com/stablecoins/docs/message-format
    uint8 private constant _BODY_INDEX = 116;
    uint8 private constant _MINT_RECIPIENT_INDEX = _BODY_INDEX + 36;
    uint8 private constant _AMOUNT_INDEX = _BODY_INDEX + 68;

    error VaultNotMintRecipient();

    constructor(
        IMaplePool _maplePool
    ) {
        MAPLE_POOL= _maplePool;
    }

    function receiveAndDepositSyncFee(
        address _sponsor,
        bytes calldata _message,
        bytes calldata _attestation
    ) external onlyGelatoRelay {
        uint256 amount = _receiveFromVault(_sponsor, _message, _attestation);

        _transferRelayFee();
        uint256 remaining = amount - _getFee();

        TOKEN.approve(address(MAPLE_POOL), remaining);
        MAPLE_POOL.depositToken(_sponsor, remaining);
    }

    function receiveAndDeposit(
        address _sponsor,
        bytes calldata _message,
        bytes calldata _attestation
    ) external {
        uint256 amount = _receiveFromVault(_sponsor, _message, _attestation);

        TOKEN.approve(address(MAPLE_POOL), amount);
        MAPLE_POOL.depositToken(_sponsor, amount);
    }

    function _receiveFromVault(
        address _sponsor,
        bytes calldata _message,
        bytes calldata _attestation
    ) internal returns (uint256 amount) {
        address vault = _getOrCreateVault(_sponsor);

        _requireVaultIsMintRecipient(vault, _message);
        MESSAGE_TRANSMITTER.receiveMessage(_message, _attestation);

        amount = _decodeAmount(_message);
        TOKEN.transferFrom(vault, address(this), amount);
    }

    function _getOrCreateVault(
        address _owner
    ) internal returns (address vault) {
        vault = _computeVaultAddress(_owner, TOKEN, this);
        if (vault.code.length == 0) _deployVault(_owner);
    }

    function _deployVault(address _owner) internal {
        new Vault{salt: keccak256(abi.encodePacked(_owner))}(TOKEN);
    }

    function _requireVaultIsMintRecipient(
        address _vault,
        bytes calldata _message
    ) internal pure {
        if (_vault != _decodeMintRecipient(_message))
            revert VaultNotMintRecipient();
    }

    function _decodeMintRecipient(
        bytes calldata _message
    ) internal pure returns (address) {
        bytes32 mintRecipient = bytes32(_message[_MINT_RECIPIENT_INDEX:]);
        return address(uint160(uint256(mintRecipient)));
    }

    function _decodeAmount(
        bytes calldata _message
    ) internal pure returns (uint256) {
        bytes32 amount = bytes32(_message[_AMOUNT_INDEX:]);
        return uint256(amount);
    }
}
