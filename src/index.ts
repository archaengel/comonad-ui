import { pipe } from "fp-ts/function";
import * as T from 'fp-ts/Task'
import { identity } from "fp-ts/function";
import { Kind, URIS } from "fp-ts/HKT";
import { Comonad1 } from "fp-ts/lib/Comonad";
import { Pairing } from "./Pairing";
import * as IO from "fp-ts/IO";
import * as Sequence from "./Sequence";
import * as Stream from "./Stream";
import { Console as ConsoleUI } from "./Console";
import * as Console from "fp-ts/Console";
import { newIORef } from "fp-ts/lib/IORef";
import { left } from "fp-ts/lib/Either";
import { ask } from "./getLine";
import { ChainRec } from "./Task";

function move<W extends URIS, M extends URIS, A, B>(
  space: Kind<W, A>,
  movement: Kind<M, B>,
  comonad: Comonad1<W>,
  pairing: Pairing<M, W>,
): Kind<W, A> {
  return pairing.pair(
    (_a, newSpace) => newSpace,
    movement,
    comonad.extend(space, identity),
  );
}

type UI<Base extends URIS, M extends URIS, A> = (
  handler: (action: Kind<M, void>) => Kind<Base, void>,
) => A;
type ComponentT<Base extends URIS, M extends URIS, W extends URIS, A> = Kind<
  W,
  UI<Base, M, A>
>;
type Component<M extends URIS, W extends URIS, A> = ComponentT<IO.URI, M, W, A>;

const streamSequencePair: Pairing<Sequence.URI, Stream.URI>["pair"] = (
  f,
  fa,
  gb,
) =>
  fa._tag === "End"
    ? f(fa.value, gb.cons)
    : streamSequencePair(f, fa.value, gb.cdr());

const streamSequencePairing: Pairing<Sequence.URI, Stream.URI> = {
  URI: Sequence.URI,
  URI2: Stream.URI,
  pair: streamSequencePair,
};

const nats: Stream.Stream<number> = (() => {
  const stream_ = (n: number): Stream.Stream<number> => ({
    cons: n,
    cdr: () => stream_(n + 1),
  });

  return stream_(0);
})();

function unfoldStream<S, A>(
  s: S,
  nextState: (s: S) => [A, S],
): Stream.Stream<A> {
  const [a, s_] = nextState(s);
  return {
    cons: a,
    cdr: () => unfoldStream(s_, nextState),
  };
}

const counterComponent: Component<Sequence.URI, Stream.URI, ConsoleUI> =
  (() => {
    const render =
      (n: number): UI<IO.URI, Sequence.URI, ConsoleUI> =>
      (handler) => ({
        text: n.toString(),
        action: (ans: string) => {
          switch (ans) {
            case "y":
            case "Y":
              return handler(Sequence.next_(Sequence.end(undefined)))
            default:
              return handler(Sequence.end(undefined))
          }
        },
      });

    return unfoldStream(0, (n) => [render(n), n + 1]);
  })();

function explore<W extends URIS, M extends URIS, A>(
  component: Component<M, W, ConsoleUI>,
  comonad: Comonad1<W>,
  pairing: Pairing<M, W>,
): T.Task<void> {
  return pipe(
    T.Do,
    T.bind("ref", () => T.fromIO(newIORef(component))),
    T.flatMap(({ ref }) =>
      ChainRec.chainRec(void 0, () =>
        pipe(
          T.Do,
          T.bind("space", () => T.fromIO(ref.read)),
          T.let(
            "send",
            ({ space }) =>
              (action: Kind<M, void>) =>
                T.fromIO(ref.write(move(space, action, comonad, pairing))),
          ),
          T.let("component", ({ space, send }) =>
            comonad.extract(space)(send),
          ),
          T.tap(({ component }) => T.fromIO(Console.log(component.text))),
          T.bind("ans", () => ask("Increment? (y/n)\n> ")),
          T.tap(({ component, ans }) => T.fromIO(component.action(ans))),
          T.map(left),
        ),
      ),
    ),
  );
}

explore(counterComponent, Stream.Comonad, streamSequencePairing)();

