import type QUnit from 'qunit'
// @ts-ignore
import * as lib from '#dist/webapi'
import * as env from './env.js'

export default (QUnit: QUnit) => {
  const { module, test } = QUnit
  module('aeskw.ts')

  type Vector = [string, boolean]
  const algorithms: Vector[] = [
    ['A128KW', true],
    ['A192KW', !env.isChromium],
    ['A256KW', true],
    ['A128GCMKW', true],
    ['A192GCMKW', !env.isChromium],
    ['A256GCMKW', true],
  ]

  function title(vector: Vector) {
    const [alg, works] = vector
    let result = ''
    if (!works) {
      result = '[not supported] '
    }
    result += `${alg}`
    return result
  }

  for (const vector of algorithms) {
    const [alg, works] = vector

    const execute = async (t: typeof QUnit.assert) => {
      const secret = await lib.generateSecret(alg)

      const jwe = await new lib.FlattenedEncrypt(crypto.getRandomValues(new Uint8Array(32)))
        .setProtectedHeader({ alg, enc: 'A256GCM' })
        .setAdditionalAuthenticatedData(crypto.getRandomValues(new Uint8Array(32)))
        .encrypt(secret)

      await lib.flattenedDecrypt(jwe, secret)
      t.ok(1)
    }

    if (works) {
      test(title(vector), execute)
    } else {
      test(title(vector), async (t) => {
        await t.rejects(execute(t))
      })
    }
  }
}
