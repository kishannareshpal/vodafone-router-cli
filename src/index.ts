import { App } from "./lib/app.ts";
import {getConfig} from "./lib/config.ts";

const config = getConfig();

const app = new App(config);
await app.init();
await app.quit();

console.log("Hello world");