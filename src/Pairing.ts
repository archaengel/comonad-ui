import { Kind, URIS } from "fp-ts/HKT";

export interface Pairing<F extends URIS, G extends URIS> {
    readonly URI: F;
    readonly URI2: G;
    readonly pair: {
        <A, B, C>(
            f: (a: A, b: B) => C,
            fa: Kind<F, A>,
            gb: Kind<G, B>
        ): C
    }
}
