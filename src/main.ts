import * as ts from "typescript";
import * as path from "path";

interface ParsedFunction {
  name: string;
  comment: string;
  tags: { tagName?: { escapedText: string }; comment: string }[];
}

export interface DocTest {
  repl: string;
  expected: string;
}

/**
 * Comment
 * @param filePath
 * @return arne
 */
export function analyzeTSFile(filePath: string) {
  // Read ts file
  const program = ts.createProgram([filePath], { allowJs: true });
  const sourceFile = program.getSourceFile(filePath);

  const functions: ParsedFunction[] = [];

  ts.forEachChild(sourceFile!, (node) => {
    let functionName = undefined;
    let comment = undefined;
    let tags = undefined;
    if (ts.isFunctionDeclaration(node) && typeof node.name !== "undefined") {
      functionName = node.name.text;
    }
    if (typeof (node as any).jsDoc !== "undefined") {
      interface jsdoc {
        jsDoc?: [
          {
            comment: string;
            tags?: {};
          }
        ];
      }
      const nnnode = node as jsdoc;
      if (typeof nnnode.jsDoc !== "undefined") {
        for (const node of nnnode.jsDoc) {
          node.comment;
          comment = (comment ?? "") + node.comment;
          tags = node.tags ?? [];
        }
      }
    }

    if (functionName && comment && tags) {
      functions.push({
        name: functionName,
        comment: comment,
        tags: tags as any,
      });
    }
  });

  let tests: DocTest[] = [];
  for (const f of functions) {
    for (const t of getTests(f)) {
      tests.push(t);
    }
  }

  return tests;
}

/**
 * Hellour
 * @param arg
 * @returns string
 * @test hello_world("arne")
 * @expect "hello arne"
 * @test hello_world("second")
 * @expect "hello second"
 * @test hello_world("third")
 * @expect "hello fail"
 */
export function hello_world(arg: string): string {
  return "hello " + arg;
}

function getTests(f: ParsedFunction): DocTest[] {
  const tests: DocTest[] = [];

  let repl = undefined;
  let expected = undefined;
  for (const t of f.tags) {
    if (typeof t.tagName !== "undefined" && t.tagName.escapedText === "test") {
      repl = t.comment;
    }
    if (
      typeof t.tagName !== "undefined" &&
      t.tagName.escapedText === "expect"
    ) {
      expected = t.comment;
    }

    if (repl && expected) {
      tests.push({ repl, expected });
      repl = undefined;
      expected = undefined;
    }
  }

  return tests;
}

export function runTest(t: DocTest): boolean {
  try {
    let evalStr = 'let t = require("./main.ts"); ';
    const testStr = `${t.repl} === ${t.expected}`;
    evalStr = `${evalStr} ${testStr}`;
    process.stdout.write("Running test: " + testStr + " ... ");
    if (!eval(evalStr)) {
      process.stdout.write("failed\n");
      return false;
    }
  } catch (e) {
    process.stdout.write(`failed: ${e}\n`);
    return false;
  }
  process.stdout.write(`OK\n`);
  return true;
}
