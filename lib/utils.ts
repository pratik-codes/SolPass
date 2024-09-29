import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as bip39 from "bip39";
import { Keypair } from "@solana/web3.js";
import { derivePath } from "ed25519-hd-key";
import crypto from "crypto";
import bs58 from "bs58";
import { toast } from "sonner";

const DATA_ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a 16-word seed phrase (mnemonic).
 * @returns {string} Seed phrase
 */
export const generateSeedPhrase = (): string => {
  return bip39.generateMnemonic();
};

/**
 * Generates a Solana-compatible keypair (public/private key) from a seed phrase.
 * @param {string} seedPhrase - The seed phrase to generate keys from
 * @returns {object} An object containing the privateKey and publicKey
 */
export const generateKeysFromSeedPhrase = (
  seedPhrase: string,
): { privateKey: string; publicKey: string } => {
  // Validate seed phrase
  if (!bip39.validateMnemonic(seedPhrase)) {
    throw new Error("Invalid seed phrase");
  }

  // Convert mnemonic to seed buffer
  const seedBuffer = bip39.mnemonicToSeedSync(seedPhrase); // Generate seed buffer

  // Derive keypair using Solana's derivation path (44'/501'/0'/0')
  const derivedSeed = derivePath(
    "m/44'/501'/0'/0'",
    seedBuffer.toString("hex"),
  ).key;

  // Generate the keypair using the derived seed (Keypair expects 32-byte seed)
  const keypair = Keypair.fromSeed(derivedSeed.slice(0, 32)); // Take the first 32 bytes

  // Extract only the first 32 bytes for the private key seed
  const privateKeySeed = keypair.secretKey.slice(0, 32); // First 32 bytes are the seed

  // Encode the private key seed in Base58
  const secretKeyBase58 = bs58.encode(Buffer.from(privateKeySeed));

  return {
    privateKey: secretKeyBase58, // Only 32-byte private key seed in bs58
    publicKey: keypair.publicKey.toBase58(), // Public key in Base58 encoding
  };
};

// function encryptDataWithPublicKey(data: string, publicKey: string) {
//   const key = naclUtil.decodeBase64(publicKey);
//   const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
//   const messageUint8 = naclUtil.decodeUTF8(data);
//   const encryptedMessage = nacl.secretbox(messageUint8, nonce, key);
//   const fullMessage = new Uint8Array(nonce.length + encryptedMessage.length);
//   fullMessage.set(nonce);
//   fullMessage.set(encryptedMessage, nonce.length);
//   return naclUtil.encodeBase64(fullMessage);
// }
//
// function decryptDataWithPrivateKey(data: string, privateKey: string) {
//   const key = naclUtil.decodeBase64(privateKey);
//   const messageWithNonceAsUint8Array = naclUtil.decodeBase64(data);
//   const nonce = messageWithNonceAsUint8Array.slice(0, nacl.secretbox.nonceLength);
//   const message = messageWithNonceAsUint8Array.slice(
//     nacl.secretbox.nonceLength,
//     messageWithNonceAsUint8Array.length,
//   );
//   const decrypted = nacl.secretbox.open(message, nonce, key);
//   if (!decrypted) {
//     throw new Error("Could not decrypt message");
//   }
//   return naclUtil.encodeUTF8(decrypted);
// }


// Encrypt data using the public key
export function encryptData(data: string): string {
  try {
    // convert the data to buffer
    const dataBuffer = Buffer.from(data);

    // Generate a random initialization vector (IV)
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(DATA_ENCRYPTION_KEY, "hex"),
      iv,
    );

    // Encrypt the private key
    const encrypted = Buffer.concat([
      cipher.update(dataBuffer),
      cipher.final(),
    ]);

    // Combine IV and encrypted data
    const fullEncryptedData = Buffer.concat([iv, encrypted]);

    return bs58.encode(fullEncryptedData);
  }
  catch (error) {
    console.error('Encryption failed:', error);
    return '';
  }
}

// Decrypt data using the private key
export function decryptData(encryptedDataBase58: string): string {
  try {
    // Decode the Base58-encoded encrypted data
    const fullEncryptedData = bs58.decode(encryptedDataBase58);

    // Extract IV and encrypted data
    const iv = fullEncryptedData.slice(0, 16); // First 16 bytes are IV
    const encrypted = fullEncryptedData.slice(16);

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(DATA_ENCRYPTION_KEY, "hex"),
      iv,
    );

    // Decrypt the private key
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    console.log({ decrypted });


    // return the buffer in plain text
    return decrypted.toString();
  } catch (error) {
    // console.error('Decryption failed:', error);
    return "";
  }
}

/**
 * Encrypts the private key using AES-CBC.
 *
 * @param {string} privateKey - The private key to encrypt (in Base58)
 * @param {string} encryptionKey - The key used for encryption (from environment variable)
 * @returns {string} - The Base58 encoded encrypted private key
 */
export const encryptPrivateKey = (
  privateKey: string,
  encryptionKey: string,
): string => {
  // Decode the private key from Base58
  const privateKeyBuffer = bs58.decode(privateKey);

  // Generate a random initialization vector (IV)
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(encryptionKey, "hex"),
    iv,
  );

  // Encrypt the private key
  const encrypted = Buffer.concat([
    cipher.update(privateKeyBuffer),
    cipher.final(),
  ]);

  // Combine IV and encrypted data
  const fullEncryptedData = Buffer.concat([iv, encrypted]);

  // Return the encrypted private key as a Base58 string
  return bs58.encode(fullEncryptedData);
};

/**
 * Decrypts the private key using AES-CBC.
 *
 * @param {string} encryptedPrivateKey - The Base58 encoded encrypted private key with IV
 * @param {string} encryptionKey - The key used for decryption (from environment variable)
 * @returns {string | null} - The decrypted private key or null if decryption fails
 */
export const decryptPrivateKey = (
  encryptedPrivateKey: string,
  encryptionKey: string,
): string | null => {
  try {
    // Decode the Base58-encoded encrypted data
    const fullEncryptedData = bs58.decode(encryptedPrivateKey);

    // Extract IV and encrypted data
    const iv = fullEncryptedData.slice(0, 16); // First 16 bytes are IV
    const encrypted = fullEncryptedData.slice(16);

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(encryptionKey, "hex"),
      iv,
    );

    // Decrypt the private key
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    // Re-encode the decrypted private key to Base58
    return bs58.encode(decrypted);
  } catch (error) {
    // console.error('Decryption failed:', error);
    return null;
  }
};



// TODO: move to AES-CBC mode
export const saveKeys = (seed: string, encryptionKey: string | undefined) => {
  if (!encryptionKey) {
    return false;
  }
  const keys = generateKeysFromSeedPhrase(seed);
  console.log({ keys });
  const encryptedPublickKey = encryptPrivateKey(keys.publicKey, encryptionKey);
  const encryptedPrivateKey = encryptPrivateKey(keys.privateKey, encryptionKey);

  sessionStorage.setItem("pk", encryptedPrivateKey);
  sessionStorage.setItem("pbk", encryptedPublickKey);

  return true;
};

export const validatePin = (enteredPin: string, pbk: string, pk: string) => {
  if (!enteredPin || !pbk || !pk) {
    console.error("missing pin or pbk or pk");
    return false;
  }

  const currentEncryptedPin = localStorage.getItem("pin") || "";

  if (!currentEncryptedPin) {
    console.error("missing current pin");
    return false;
  }

  const currentPin = decryptData(currentEncryptedPin);

  if (currentPin === enteredPin) {
    return true;
  }

  return false;
};

export const copyToClipboard = (textToCopy: string) => {
  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      toast("Copied to clipboard");
      console.log("Seed phrases copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy: ", err);
    });
};

export const ValidateSeedPhrase = (seedPhrase: string) => {
  return bip39.validateMnemonic(seedPhrase);
}
