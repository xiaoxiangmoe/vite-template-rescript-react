import reactRefresh from '@vitejs/plugin-react-refresh';
import { defineConfig, Plugin } from 'vite';
import * as path from 'path';
import * as fs from 'fs';

const cartesianProduct = <X, Y>(
  xs: ReadonlyArray<X>,
  ys: ReadonlyArray<Y>
): ReadonlyArray<readonly [x: X, y: Y]> =>
  // @ts-expect-error
  xs.flatMap(x => ys.map(y => [x, y] as const));

const SUPPORTED_EXTS = ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'];

function rootDirsPlugin({
  rootDirs,
  supportedExtensions = SUPPORTED_EXTS,
}: {
  readonly rootDirs: ReadonlyArray<string>;
  readonly supportedExtensions?: ReadonlyArray<string>;
}): Plugin {
  const absoluteRootDirs = rootDirs?.map(x => path.join(__dirname, x));
  return {
    name: 'vite-root-dirs-plugin',
    resolveId(source, importer) {
      if (absoluteRootDirs != null && source.startsWith('.') && importer) {
        const sourceLocation = path.join(path.dirname(importer), source);
        return cartesianProduct(
          absoluteRootDirs.filter(dir => sourceLocation.startsWith(dir)),
          absoluteRootDirs
        )
          .map(([fromRootDir, toRootDir]) =>
            path.join(toRootDir, path.relative(fromRootDir, sourceLocation))
          )
          .find(newSourceLocation =>
            ['', ...supportedExtensions].some(ext =>
              fs.existsSync(newSourceLocation + ext)
            )
          );
      }
    },
  };
}

export default defineConfig({
  plugins: [
    reactRefresh(),
    rootDirsPlugin({
      rootDirs: ['src', 'lib/es6/src'],
    }),
  ],
  css: {
    modules: {
      localsConvention: undefined,
    },
  },
});
