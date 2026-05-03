import type { ElectrobunConfig } from "electrobun";

export default {
  app: {
    name: "摇光",
    identifier: "dev.alkaid.camera-ai-assistant",
    version: "0.1.0",
  },
  build: {
    bun: {
      entrypoint: "src/main/electrobun.ts",
    },
  },
  runtime: {
    exitOnLastWindowClosed: true,
  },
} satisfies ElectrobunConfig;
