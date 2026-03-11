const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'opencommstack-e2e-simulation-key';

function encrypt(text) {
  if (!text) return null;
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

function decrypt(ciphertext) {
  if (!ciphertext) return null;
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = { encrypt, decrypt };
