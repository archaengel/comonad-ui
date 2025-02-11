import { createInterface } from "readline";
import { Task } from "fp-ts/lib/Task";

export const ask: (question: string) => Task<string> =
  (question) => () =>
    new Promise((resolve) => {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });