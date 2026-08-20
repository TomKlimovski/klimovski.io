[![Netlify Status](https://api.netlify.com/api/v1/badges/7d9c7e7e-e4c2-4169-8d80-41b66fb06420/deploy-status)](https://app.netlify.com/sites/hopeful-austin-beac2d/deploys)

Personal website as a shell.

## Commands

`help` lists the polite ones. The rest — `neofetch`, `fortune`, `git log`,
`sudo`, `vim`, `snake`, `cmatrix`, `crt`, `reboot`, `ssh tiq@tectoniq.com.au`,
and one you really shouldn't run — you'll have to find yourself.

## Development

Node 17+ needs the OpenSSL legacy provider for react-scripts 4:

    NODE_OPTIONS=--openssl-legacy-provider yarn start
    NODE_OPTIONS=--openssl-legacy-provider yarn build
    CI=true yarn test --watchAll=false
