import { JWEInvalid } from '../util/errors.js'
import { bitLength } from './iv.js'

export function checkIvLength(enc: string, iv: Uint8Array) {
  if (iv.length << 3 !== bitLength(enc)) {
    throw new JWEInvalid('Invalid Initialization Vector length')
  }
}
