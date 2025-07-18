import type { Command } from "commander";
import { ApplicationCommand } from "./base";

export class AuthCommand extends ApplicationCommand {
    override register(program: Command): void {
        program
            .command('auth')
            .description('Setup router authentication credentials.')
            .action(async () => {
                await this.authenticate();
                await this.quit();
            });
    }
}