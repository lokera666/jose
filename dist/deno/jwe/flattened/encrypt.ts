import type {
  KeyLike,
  FlattenedJWE,
  JWEHeaderParameters,
  JWEKeyManagementHeaderParameters,
  EncryptOptions,
} from '../../types.d.ts'
import type { JWEKeyManagementHeaderResults } from '../../types.i.d.ts'
import ivFactory from '../../lib/iv.ts'
import { encode as base64url } from '../../runtime/base64url.ts'
import random from '../../runtime/random.ts'
import encrypt from '../../runtime/encrypt.ts'
import { deflate } from '../../runtime/zlib.ts'
import encryptKeyManagement from '../../lib/encrypt_key_management.ts'

import { JOSENotSupported, JWEInvalid } from '../../util/errors.ts'
import isDisjoint from '../../lib/is_disjoint.ts'
import { encoder, decoder, concat } from '../../lib/buffer_utils.ts'
import validateCrit from '../../lib/validate_crit.ts'

const generateIv = ivFactory(random)
const checkExtensions = validateCrit.bind(undefined, JWEInvalid, new Map())

/**
 * The FlattenedEncrypt class is a utility for creating Flattened JWE
 * objects.
 *
 * @example ESM import
 * ```js
 * import { FlattenedEncrypt } from 'jose/jwe/flattened/encrypt'
 * ```
 *
 * @example CJS import
 * ```js
 * const { FlattenedEncrypt } = require('jose/jwe/flattened/encrypt')
 * ```
 *
 * @example Deno import
 * ```js
 * import { FlattenedEncrypt } from 'https://deno.land/x/jose@VERSION/jwe/flattened/encrypt.ts'
 * ```
 *
 * @example Usage
 * ```js
 * const encoder = new TextEncoder()
 *
 * const jwe = await new FlattenedEncrypt(encoder.encode('It’s a dangerous business, Frodo, going out your door.'))
 *   .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
 *   .setAdditionalAuthenticatedData(encoder.encode('The Fellowship of the Ring'))
 *   .encrypt(publicKey)
 *
 * console.log(jwe)
 * ```
 */
class FlattenedEncrypt {
  private _plaintext: Uint8Array

  private _protectedHeader!: JWEHeaderParameters

  private _sharedUnprotectedHeader!: JWEHeaderParameters

  private _unprotectedHeader!: JWEHeaderParameters

  private _aad!: Uint8Array

  private _cek!: Uint8Array

  private _iv!: Uint8Array

  private _keyManagementParameters!: JWEKeyManagementHeaderParameters

  /**
   * @param plaintext Binary representation of the plaintext to encrypt.
   */
  constructor(plaintext: Uint8Array) {
    if (!(plaintext instanceof Uint8Array)) {
      throw new TypeError('plaintext must be an instance of Uint8Array')
    }
    this._plaintext = plaintext
  }

  /**
   * Sets the JWE Key Management parameters to be used when encrypting.
   * Use of this is method is really only needed for ECDH-ES based algorithms
   * when utilizing the Agreement PartyUInfo or Agreement PartyVInfo parameters.
   * Other parameters will always be randomly generated when needed and missing.
   *
   * @param parameters JWE Key Management parameters.
   */
  setKeyManagementParameters(parameters: JWEKeyManagementHeaderParameters) {
    if (this._keyManagementParameters) {
      throw new TypeError('setKeyManagementParameters can only be called once')
    }
    this._keyManagementParameters = parameters
    return this
  }

  /**
   * Sets the JWE Protected Header on the FlattenedEncrypt object.
   *
   * @param protectedHeader JWE Protected Header.
   */
  setProtectedHeader(protectedHeader: JWEHeaderParameters) {
    if (this._protectedHeader) {
      throw new TypeError('setProtectedHeader can only be called once')
    }
    this._protectedHeader = protectedHeader
    return this
  }

  /**
   * Sets the JWE Shared Unprotected Header on the FlattenedEncrypt object.
   *
   * @param sharedUnprotectedHeader JWE Shared Unprotected Header.
   */
  setSharedUnprotectedHeader(sharedUnprotectedHeader: JWEHeaderParameters) {
    if (this._sharedUnprotectedHeader) {
      throw new TypeError('setSharedUnprotectedHeader can only be called once')
    }
    this._sharedUnprotectedHeader = sharedUnprotectedHeader
    return this
  }

  /**
   * Sets the JWE Per-Recipient Unprotected Header on the FlattenedEncrypt object.
   *
   * @param unprotectedHeader JWE Per-Recipient Unprotected Header.
   */
  setUnprotectedHeader(unprotectedHeader: JWEHeaderParameters) {
    if (this._unprotectedHeader) {
      throw new TypeError('setUnprotectedHeader can only be called once')
    }
    this._unprotectedHeader = unprotectedHeader
    return this
  }

  /**
   * Sets the Additional Authenticated Data on the FlattenedEncrypt object.
   *
   * @param aad Additional Authenticated Data.
   */
  setAdditionalAuthenticatedData(aad: Uint8Array) {
    this._aad = aad
    return this
  }

  /**
   * Sets a content encryption key to use, by default a random suitable one
   * is generated for the JWE enc" (Encryption Algorithm) Header Parameter.
   * You do not need to invoke this method, it is only really intended for
   * test and vector validation purposes.
   *
   * @param cek JWE Content Encryption Key.
   */
  setContentEncryptionKey(cek: Uint8Array) {
    if (this._cek) {
      throw new TypeError('setContentEncryptionKey can only be called once')
    }
    this._cek = cek
    return this
  }

  /**
   * Sets the JWE Initialization Vector to use for content encryption, by default
   * a random suitable one is generated for the JWE enc" (Encryption Algorithm)
   * Header Parameter. You do not need to invoke this method, it is only really
   * intended for test and vector validation purposes.
   *
   * @param iv JWE Initialization Vector.
   */
  setInitializationVector(iv: Uint8Array) {
    if (this._iv) {
      throw new TypeError('setInitializationVector can only be called once')
    }
    this._iv = iv
    return this
  }

  /**
   * Encrypts and resolves the value of the Flattened JWE object.
   *
   * @param key Public Key or Secret to encrypt the JWE with.
   * @param options JWE Encryption options.
   */
  async encrypt(key: KeyLike, options?: EncryptOptions) {
    if (!this._protectedHeader && !this._unprotectedHeader && !this._sharedUnprotectedHeader) {
      throw new JWEInvalid(
        'either setProtectedHeader, setUnprotectedHeader, or sharedUnprotectedHeader must be called before #encrypt()',
      )
    }

    if (
      !isDisjoint(this._protectedHeader, this._unprotectedHeader, this._sharedUnprotectedHeader)
    ) {
      throw new JWEInvalid(
        'JWE Shared Protected, JWE Shared Unprotected and JWE Per-Recipient Header Parameter names must be disjoint',
      )
    }

    const joseHeader: JWEHeaderParameters = {
      ...this._protectedHeader,
      ...this._unprotectedHeader,
      ...this._sharedUnprotectedHeader,
    }

    checkExtensions(options?.crit, this._protectedHeader, joseHeader)

    if (joseHeader.zip !== undefined) {
      if (!this._protectedHeader || !this._protectedHeader.zip) {
        throw new JWEInvalid('JWE "zip" (Compression Algorithm) Header MUST be integrity protected')
      }

      if (joseHeader.zip !== 'DEF') {
        throw new JOSENotSupported(
          'unsupported JWE "zip" (Compression Algorithm) Header Parameter value',
        )
      }
    }

    const { alg, enc } = joseHeader

    if (typeof alg !== 'string' || !alg) {
      throw new JWEInvalid('JWE "alg" (Algorithm) Header Parameter missing or invalid')
    }

    if (typeof enc !== 'string' || !enc) {
      throw new JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter missing or invalid')
    }

    let encryptedKey: Uint8Array | undefined

    if (alg === 'dir') {
      if (this._cek) {
        throw new TypeError('setContentEncryptionKey cannot be called when using Direct Encryption')
      }
    } else if (alg === 'ECDH-ES') {
      if (this._cek) {
        throw new TypeError(
          'setContentEncryptionKey cannot be called when using Direct Key Agreement',
        )
      }
    }

    let cek: KeyLike
    {
      let parameters: JWEKeyManagementHeaderResults | undefined
      ;({ cek, encryptedKey, parameters } = await encryptKeyManagement(
        alg,
        enc,
        key,
        this._cek,
        this._keyManagementParameters,
      ))

      if (parameters) {
        if (!this._protectedHeader) {
          this.setProtectedHeader(parameters)
        } else {
          this._protectedHeader = { ...this._protectedHeader, ...parameters }
        }
      }
    }

    this._iv ||= generateIv(enc)

    let additionalData: Uint8Array
    let protectedHeader: Uint8Array
    let aadMember: string | undefined
    if (this._protectedHeader) {
      protectedHeader = encoder.encode(base64url(JSON.stringify(this._protectedHeader)))
    } else {
      protectedHeader = encoder.encode('')
    }

    if (this._aad) {
      aadMember = base64url(this._aad)
      additionalData = concat(protectedHeader, encoder.encode('.'), encoder.encode(aadMember))
    } else {
      additionalData = protectedHeader
    }

    let ciphertext: Uint8Array
    let tag: Uint8Array

    if (joseHeader.zip === 'DEF') {
      const deflated = await (options?.deflateRaw || deflate)(this._plaintext)
      ;({ ciphertext, tag } = await encrypt(enc, deflated, cek, this._iv, additionalData))
    } else {
      ;({ ciphertext, tag } = await encrypt(enc, this._plaintext, cek, this._iv, additionalData))
    }

    const jwe: FlattenedJWE = {
      ciphertext: base64url(ciphertext),
      iv: base64url(this._iv),
      tag: base64url(tag),
    }

    if (encryptedKey) {
      jwe.encrypted_key = base64url(encryptedKey)
    }

    if (aadMember) {
      jwe.aad = aadMember
    }

    if (this._protectedHeader) {
      jwe.protected = decoder.decode(protectedHeader)
    }

    if (this._sharedUnprotectedHeader) {
      jwe.unprotected = this._sharedUnprotectedHeader
    }

    if (this._unprotectedHeader) {
      jwe.header = this._unprotectedHeader
    }

    return jwe
  }
}

export { FlattenedEncrypt }
export default FlattenedEncrypt
export type { KeyLike, FlattenedJWE, JWEHeaderParameters, JWEKeyManagementHeaderParameters }
