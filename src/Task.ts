import * as ChnRec from 'fp-ts/ChainRec'
import * as T from 'fp-ts/Task'
import * as E from 'fp-ts/Either'

const chainRec: ChnRec.ChainRec1<T.URI>['chainRec'] = (a, f) => async () => {
    let current = await f(a)()
    while (E.isLeft(current)) {
        current = await f(current.left)()
    }
    return current.right
}

export const ChainRec: ChnRec.ChainRec1<T.URI> = {
    ...T.Chain,
    chainRec
}