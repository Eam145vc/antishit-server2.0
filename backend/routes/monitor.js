Run `npm audit` for details.
==> Uploading build...
==> Deploying...
==> Uploaded in 6.5s. Compression took 5.1s
==> Build successful 🎉
==> Running 'cd backend && npm start'
> anti-cheat-dashboard-backend@1.0.0 start
> node server.js
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
/opt/render/project/src/backend/node_modules/express/lib/router/route.js:216
        throw new Error(msg);
        ^
Error: Route.post() requires a callback function but got a [object Undefined]
    at Route.<computed> [as post] (/opt/render/project/src/backend/node_modules/express/lib/router/route.js:216:15)
    at proto.<computed> [as post] (/opt/render/project/src/backend/node_modules/express/lib/router/index.js:521:19)
    at Object.<anonymous> (/opt/render/project/src/backend/routes/auth.js:15:8)
    at Module._compile (node:internal/modules/cjs/loader:1565:14)
    at Object..js (node:internal/modules/cjs/loader:1708:10)
    at Module.load (node:internal/modules/cjs/loader:1318:32)
    at Function._load (node:internal/modules/cjs/loader:1128:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:219:24)
    at Module.require (node:internal/modules/cjs/loader:1340:12)
Node.js v22.12.0
