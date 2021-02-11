export function hideBin(argv: Array<string>): Array<string> {
  return argv.slice(2);
}

export function ensureSourceAndOutput(source: string | number | undefined, output: string | number | undefined): [string, string] {
  if (!source || !output) {
    throw new Error("Must specify source and output file");
  }

  return [String(source), String(output)];
}

export function saferOutputPath(output: string | undefined): string {
  if (!output) {
    throw new Error("Must specify output path");
  }

  if (!output.startsWith("./var/") && !output.startsWith("var/")) {
    throw new Error("Output path must start with \"var\" in case of miss typed");
  }

  return output;
}
