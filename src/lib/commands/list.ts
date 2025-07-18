import type { Command } from "commander";
import { ApplicationCommand } from "./base";
import { makeLogger, type Logger } from "../logger";
import type { WifiConnectedDevice as WifiDevice, WifiInfo } from "@/types";
import { table } from "table";
import { formatDistanceToNow, fromUnixTime } from "date-fns";

export class ListCommand extends ApplicationCommand {
    override readonly logger: Logger = makeLogger("ListCommand");

    override register(program: Command): void {
        program
            .command('list')
            .alias('ls')
            .description('List all connected devices')
            .action(async () => {
                await this.list();
                await this.quit();
            });
    }

    private async list(): Promise<void> {
        const homePage = await this.authenticate();
        if (!homePage) {
            this.quit();
            return;
        }
        
        const path: string = 'modals/overview.lp?status=wifiInfo&auto_update=true';
        const url: string = `${this.config.routerUrl}/${path}`;
        
        const wifiInfo: WifiInfo = await homePage.evaluate(
            async (url) => {
                const response = await fetch(url);
                return await response.json() as WifiInfo;
            },
            url
        );

        this.printListTable('Main 2.4GHz', wifiInfo.wifiList24);
        this.printListTable('Main 5GHz', wifiInfo.wifiList5);
        this.printListTable('Guest 2.4GHz', wifiInfo.guestWifi24);
        this.printListTable('Guest 5GHz', wifiInfo.guestWifi5);
    }

    private printListTable(title: string, devices: WifiDevice[]): void {
        const tableData: string[][] = [
            ['Name', 'Hostname', 'IPv4', 'Connected?', 'IPv6', 'MAC Address', 'Last connected at?']
        ]
        
        devices.forEach((device) => {
            const name = `${device.FriendlyName}\n${device.Class}\n${device.Manufacturer}`;
            const hostname = device.HostName ?? '-';
            const ipv4 = device.DhcpLeaseIP ?? device.IPv4 ?? '-';
            const ipv6 = device.IPv6 ?? '-';
            const macAddress = device.MACAddress ?? '-';
            const lastConnectedAt = parseInt(device.ConnectedTime) ? formatDistanceToNow(fromUnixTime(parseInt(device.ConnectedTime)), { includeSeconds: true, addSuffix: true }) : '-';
            const isConnected = device.State === '1' ? 'Yes' : 'No';

            tableData.push(
                [name, hostname, ipv4, isConnected, ipv6, macAddress, lastConnectedAt]
            )
        });

        const devicesCount = devices.length;

        this.commandLogger.info(`${title} (${devicesCount} devices)`);
        if (devicesCount) {
            this.commandLogger.info(new Array(title.length).fill(0).map(() => '-').join(''));
            this.commandLogger.info(table(tableData), '\n');
        } else {
            this.commandLogger.info('\n\n');
        }
    }
}