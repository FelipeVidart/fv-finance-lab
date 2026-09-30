import { pathToFileURL } from "node:url";
import path from "node:path";

const root = process.cwd();

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const withoutAlias = specifier.slice(2);
    const resolvedPath = path.join(root, "src", withoutAlias);
    const withExtension = path.extname(resolvedPath)
      ? resolvedPath
      : `${resolvedPath}.ts`;

    return {
      shortCircuit: true,
      url: pathToFileURL(withExtension).href,
    };
  }

  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !path.extname(specifier)
  ) {
    const parentPath = context.parentURL
      ? new URL(".", context.parentURL).pathname
      : root;
    const resolvedPath = path.resolve(parentPath, `${specifier}.ts`);

    return {
      shortCircuit: true,
      url: pathToFileURL(resolvedPath).href,
    };
  }

  return nextResolve(specifier, context);
}
