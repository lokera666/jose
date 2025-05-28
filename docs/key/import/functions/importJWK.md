# Function: importJWK()

## [💗 Help the project](https://github.com/sponsors/panva)

Support from the community to continue maintaining and improving this module is welcome. If you find the module useful, please consider supporting the project by [becoming a sponsor](https://github.com/sponsors/panva).

▸ **importJWK**(`jwk`, `alg`?, `options`?): [`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`Uint8Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) \| [`CryptoKey`](https://developer.mozilla.org/docs/Web/API/CryptoKey)\>

Imports a JWK to a [CryptoKey](https://developer.mozilla.org/docs/Web/API/CryptoKey). Either the JWK "alg" (Algorithm) Parameter, or the optional
"alg" argument, must be present for asymmetric JSON Web Key imports.

> [!NOTE]\
> The JSON Web Key parameters "use", "key_ops", and "ext" are also used in the [CryptoKey](https://developer.mozilla.org/docs/Web/API/CryptoKey)
> import process.

> [!NOTE]\
> Symmetric JSON Web Keys (i.e. `kty: "oct"`) yield back an [Uint8Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) instead of a
> [CryptoKey](https://developer.mozilla.org/docs/Web/API/CryptoKey).

This function is exported (as a named export) from the main `'jose'` module entry point as well
as from its subpath export `'jose/key/import'`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `jwk` | [`JWK`](../../../types/interfaces/JWK.md) | JSON Web Key. |
| `alg`? | `string` | JSON Web Algorithm identifier to be used with the imported key. Default is the "alg" property on the JWK. See [Algorithm Key Requirements](https://github.com/panva/jose/issues/210). |
| `options`? | [`KeyImportOptions`](../interfaces/KeyImportOptions.md) | - |

## Returns

[`Promise`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<[`Uint8Array`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) \| [`CryptoKey`](https://developer.mozilla.org/docs/Web/API/CryptoKey)\>

## Example

```js
const ecPublicKey = await jose.importJWK(
  {
    crv: 'P-256',
    kty: 'EC',
    x: 'ySK38C1jBdLwDsNWKzzBHqKYEE5Cgv-qjWvorUXk9fw',
    y: '_LeQBw07cf5t57Iavn4j-BqJsAD1dpoz8gokd3sBsOo',
  },
  'ES256',
)

const rsaPublicKey = await jose.importJWK(
  {
    kty: 'RSA',
    e: 'AQAB',
    n: '12oBZRhCiZFJLcPg59LkZZ9mdhSMTKAQZYq32k_ti5SBB6jerkh-WzOMAO664r_qyLkqHUSp3u5SbXtseZEpN3XPWGKSxjsy-1JyEFTdLSYe6f9gfrmxkUF_7DTpq0gn6rntP05g2-wFW50YO7mosfdslfrTJYWHFhJALabAeYirYD7-9kqq9ebfFMF4sRRELbv9oi36As6Q9B3Qb5_C1rAzqfao_PCsf9EPsTZsVVVkA5qoIAr47lo1ipfiBPxUCCNSdvkmDTYgvvRm6ZoMjFbvOtgyts55fXKdMWv7I9HMD5HwE9uW839PWA514qhbcIsXEYSFMPMV6fnlsiZvQQ',
  },
  'PS256',
)
```
