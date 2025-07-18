import envPaths from "env-paths";
import type { Browser, Page } from "puppeteer";
import { getAppName } from "../config";
import path from 'path';
import { makeLogger } from "../logger";

export class CookiesHelpers {
    /**
     * Save all of the session cookies to a file in the user config directory.
     */
    static async exportCookiesToFile(page: Page): Promise<void> {
        const logger = makeLogger('CookiesHelper#exportCookiesToFile');

        logger.debug('Exporting cookies to a file...');
        const client = await page.createCDPSession();

        // Export cookies from all pages into a file
        const cookiesResponse = await client.send("Network.getAllCookies");

        const cookies = cookiesResponse.cookies;
        logger.debug(`\tFound ${cookies.length} cookies to export`);

        logger.debug(`\tSaving the cookies to a file`);
        const cookiesFilePath = await this.getCookiesFilePath();
        const serializedCookies = JSON.stringify(cookies);
        await Bun.write(cookiesFilePath, serializedCookies);
        logger.debug(`\tCookies saved to ${cookiesFilePath}.`);
    }

    /**
     * Restore any cookies saved for this application from the user's config directory.
     */
    static async tryRestoreCookiesFromFileTo(browser: Browser): Promise<void> {
        const logger = makeLogger('CookiesHelper#restoreCookiesFromFileTo');

        logger.debug('Attempting to restore cookies...');
        try {
            const cookiesFilePath = await this.getCookiesFilePath();
            const cookiesFile = Bun.file(cookiesFilePath);
            
            const cookies = await cookiesFile.json();
            await browser.setCookie(...cookies);
            logger.debug('\tSuccessfully restored the cookies.');

        } catch (error) {
            // There are no cookies to load
            logger.debug('\tDid not restore any cookies.');
        }
    }

    static getCookiesFilePath = async () => {
        const appName = await getAppName();
        const systemPaths = envPaths(appName);

        return path.join(systemPaths.config, 'cookies.txt');
    }
}