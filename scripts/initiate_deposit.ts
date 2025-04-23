/**
 * Bridge Authorization Generator
 * 
 * This module handles the generation of EIP-3009 authorization for USDC transfers.
 * It creates a signed authorization that allows the MapleCCTPSender contract to transfer
 * USDC on behalf of the user.
 */

import { hexlify, toUtf8Bytes, TypedDataDomain, Signer, BigNumberish } from "ethers";
import { randomBytes, Signature, zeroPadValue } from "ethers";

/**
 * Authorization structure for EIP-3009 token transfers
 * Contains all necessary parameters for the authorization signature
 */
interface Authorization {
  validAfter: number;    // Timestamp when the authorization becomes valid
  validBefore: number;   // Timestamp when the authorization expires
  nonce: string;         // Unique identifier for the authorization
  v: number;             // Signature v component
  r: string;             // Signature r component
  s: string;             // Signature s component
}

/**
 * Generates an EIP-3009 authorization for USDC transfer
 * 
 * @param from - The address of the token owner
 * @param to - The address of the token recipient (MapleCCTPSender contract)
 * @param amount - The amount of USDC to transfer
 * @param admin - The signer that will authorize the transfer
 * @returns Authorization object containing the signed authorization
 */
export const initiateBridge = async (
  from: string,
  to: string,
  amount: BigNumberish,
  admin: Signer,
): Promise<Authorization> => {
  // Define the EIP-712 domain for the authorization
  const domain: TypedDataDomain = {
    name: "USDC",
    version: "2",
    chainId: 84532, // 84532 when baseSpolia, 31337 when testing onhardhat
    verifyingContract: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC contract address
  };

  // Define the EIP-712 types for the authorization
  const types = {
    ReceiveWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  // Set authorization validity period
  const validAfter = 0;  // Authorization is valid immediately
  const validBefore = Math.floor(Date.now() / 1000) + 60 * 60;  // Valid for 1 hour
  
  // Generate a unique nonce by combining random bytes with the owner's address
  const nonce = `${hexlify(randomBytes(12))}${from.substring(2)}`;
 
  // Prepare the authorization arguments
  const args = {
    from,
    to,
    value: amount,
    validAfter,
    validBefore,
    nonce,
  };

  // Sign the authorization using EIP-712 typed data signing
  const signature = await admin.signTypedData(domain, types, args);
  
  // Split the signature into its components
  const { v, r, s } = Signature.from(signature);

  // Return the complete authorization object
  return {
    validAfter,
    validBefore,
    nonce,
    v,
    r,
    s
  };
};
