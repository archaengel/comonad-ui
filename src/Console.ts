import { IO } from "fp-ts/lib/IO";

export type Console = {
    text: string;
    action: (input: string) => IO<void>;
}
   