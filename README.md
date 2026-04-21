# React-shop-cloudfront-backend

This is backend service for frontend starter project for nodejs-aws mentoring program.

## Deployment

**Api Gateway:**
[https://4xxckkyhoj.execute-api.us-east-1.amazonaws.com/prod/](https://4xxckkyhoj.execute-api.us-east-1.amazonaws.com/prod/)

## Tech stack

- [Node.js](https://nodejs.org) 20+ as a runtime
- [TypeScript](https://www.typescriptlang.org/) 6.x for type checking
- [esbuild](https://esbuild.github.io/) for bundling Lambda handlers
- [Jest](https://jestjs.io/) for unit testing
- [Eslint](https://eslint.org/) as a code linting tool
- [Prettier](https://prettier.io/) as a code formatting tool
- [AWS CDK](https://aws.amazon.com/cdk/) for infrastructure as code

## Available Scripts

### `build`

Runs TypeScript type-check and bundles Lambda handlers with esbuild into `dist/handlers/`.

```bash
npm run build
```

### `typecheck`

Runs TypeScript compiler in no-emit mode for type validation.

```bash
npm run typecheck
```

### `test`

Runs Jest test suite with ts-jest support for TypeScript test files.

```bash
npm run test
```

### `lint`, `prettier`

Runs linting and formatting for all files in `src` folder.

```bash
npm run lint
npm run prettier
```

### `cdk:app:build`

Builds the application and copies artifacts from `dist/` into `infra/resources/build/`.

```bash
npm run cdk:app:build
```

### `cdk:app:build:deploy`

Builds app artifacts via `scripts/build.sh` and deploys the CDK stack.

```bash
npm run cdk:app:build:deploy
```

### `cdk:build`

Builds TypeScript infrastructure code in the `infra` folder.

```bash
npm run cdk:build
```

### `cdk:synth`

Synthesizes the CDK CloudFormation template without deploying.

```bash
npm run cdk:synth
```

### `cdk:deploy`

Deploys the CDK infrastructure to AWS.

```bash
npm run cdk:deploy
```

### `cdk:build:deploy`

Builds TypeScript infrastructure code in the `infra` folder and deploys everything in one command.

```bash
npm run cdk:build:deploy
```

### `cdk:destroy`

Destroys all AWS resources created by the CDK stack.

```bash
npm run cdk:destroy
```
