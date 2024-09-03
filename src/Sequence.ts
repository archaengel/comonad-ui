import { Monad1 } from "fp-ts/lib/Monad"
import { Functor1 } from "fp-ts/lib/Functor"
import { Apply1 } from "fp-ts/lib/Apply"
import { Pointed1 } from "fp-ts/lib/Pointed"
import { Chain1 } from "fp-ts/lib/Chain"
import { Applicative1 } from "fp-ts/lib/Applicative"

type Sequence<A> =
  | { _tag: 'End'; value: A }
  | { _tag: 'Next'; value: Sequence<A> }

export function next_<A>(sa: Sequence<A>): Sequence<A> {
    return { _tag: 'Next', value: sa }
}

export function end<A>(value: A): Sequence<A> {
    return { _tag: 'End', value }
}

export const URI = 'Sequence'
export type URI = typeof URI
declare module 'fp-ts/HKT' {
    interface URItoKind<A> {
        readonly [URI]: Sequence<A>
    }
}

const map_: Functor1<URI>['map'] = (fa, f) =>
    fa._tag === 'End' ? end(f(fa.value)) : next_(map_(fa.value, f));
  
  export const Functor: Functor1<URI> = {
    URI,
    map: map_,
  };
  
  /**
    instance Monad Sequence where
      return = End
      bind f (End a) = f a
      bind f (Next next) = Next (bind f next)
   */
  
  const ap_: Apply1<URI>['ap'] = (fab, fa) =>
    fab._tag === 'End' ? map_(fa, fab.value) : ap_(fab.value, fa);
  
  export const Apply: Apply1<URI> = {
    URI,
    map: map_,
    ap: ap_,
  };
  
  const of_: Pointed1<URI>['of'] = end;
  
  export const Pointed: Pointed1<URI> = {
    URI,
    of: of_,
  };
  
  export const Applicative: Applicative1<URI> = {
    URI,
    ap: ap_,
    map: map_,
    of: of_,
  };
  
  const chain_: Chain1<URI>['chain'] = (fa, f) =>
    fa._tag === 'End' ? f(fa.value) : next_(chain_(fa.value, f));
  
  export const Chain: Chain1<URI> = {
    URI,
    ap: ap_,
    map: map_,
    chain: chain_,
  };
  
  export const Monad: Monad1<URI> = {
    URI,
    ap: ap_,
    map: map_,
    chain: chain_,
    of: of_,
  };
