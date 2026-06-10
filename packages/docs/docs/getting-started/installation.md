---
sidebar_position: 1
---

# Installation

## Requirements

- **Node.js** 18 or later
- **discord.js** v14.x
- **TypeScript** 5.x (recommended — FlowCord is built TypeScript-first)

## Install

```bash
npm install @flowcord/core@next discord.js
```

:::caution Alpha software
FlowCord is currently in alpha. The API may change between releases. Once a stable version is published, the `@next` tag will no longer be needed.
:::

## Verify

Check that both packages installed correctly:

```bash
npm list @flowcord/core discord.js
```

You should see version numbers for both. If `discord.js` is missing, install it explicitly — it is a required peer dependency and some package managers won't install it automatically.

## TypeScript setup

FlowCord's API is designed around TypeScript generics. While it works in JavaScript, you'll lose most of the type safety. If you're starting a new project, initialize TypeScript first:

```bash
npm install --save-dev typescript @types/node
npx tsc --init
```

A minimal `tsconfig.json` that works well with FlowCord:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

## Next steps

Head to [Quick Start](./quick-start.md) to build your first interactive menu.
