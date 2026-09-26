import type { Plugin } from 'vite';
import { initDevframe } from 'devframe/initiate';
import ngDevtools from './devframe.ts';
import { analogMiddleware, setDevOrigin } from './analog-server-log.ts';
import { analogConfig } from './rpc/analog-scan.ts';

export interface NgDevtoolsViteOptions {
  base?: string;
  apiPrefix?: string;
}

export default function ngDevtoolsVite(options: NgDevtoolsViteOptions = {}): Plugin {
  const base = options.base ?? '/__ng-devtools/';
  return {
    name: 'ng-devtools',
    apply: 'serve',
    enforce: 'pre',
    configureServer(server) {
      const apiPrefix = options.apiPrefix ?? analogConfig(server.config.root).apiPrefix;
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        if (url.endsWith('/__connection.json') && !url.startsWith(base)) {
          res.statusCode = 404;
          res.end();
          return;
        }
        next();
      });
      server.middlewares.use(analogMiddleware(apiPrefix));
      const devtools = initDevframe(ngDevtools, {
        base,
        ws: false,
        auth: false,
        allowedOrigins: false,
      });
      server.middlewares.use(devtools.nodeMiddleware);
      server.httpServer?.once('listening', () => {
        setDevOrigin(server.resolvedUrls?.local[0]);
      });
    },
  };
}
