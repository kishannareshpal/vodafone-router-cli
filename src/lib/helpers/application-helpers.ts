import type { Command } from "commander";
import type { ApplicationCommand } from "../commands/base";

export class ApplicationHelpers {
    static registerCommands = (program: Command, ...appCommands: ApplicationCommand[]): void => {
        for (const appCommand of appCommands) {
            appCommand.register(program);
        }
    }
}