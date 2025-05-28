# Interface: GenerateSecretOptions

## [💗 Help the project](https://github.com/sponsors/panva)

Support from the community to continue maintaining and improving this module is welcome. If you find the module useful, please consider supporting the project by [becoming a sponsor](https://github.com/sponsors/panva).

Secret generation function options.

## Properties

### extractable?

• `optional` **extractable**: `boolean`

The value to use as [SubtleCrypto.generateKey](https://developer.mozilla.org/docs/Web/API/SubtleCrypto/generateKey) `extractable` argument. Default is false.

> [!NOTE]\
> Because A128CBC-HS256, A192CBC-HS384, and A256CBC-HS512 secrets cannot be represented as
> [CryptoKey](https://developer.mozilla.org/docs/Web/API/CryptoKey) this option has no effect for them.
