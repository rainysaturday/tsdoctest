import { analyzeTSFile, runTest } from "./main";
import * as path from "path";

const tests = analyzeTSFile(path.resolve(__dirname, "main.ts"));

for (const t of tests) {
  runTest(t);
}
