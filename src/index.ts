import { Command } from "commander";
import {getConfig} from "./lib/config.ts";
import { AuthCommand } from "./lib/commands/auth.ts";
import { ApplicationHelpers } from "./lib/helpers/application-helpers.ts";
import { ListCommand } from "./lib/commands/list.ts";

const config = getConfig();

const program = new Command();

ApplicationHelpers.registerCommands(
    program,
    new AuthCommand(config),
    new ListCommand(config)
);

program.parse();


