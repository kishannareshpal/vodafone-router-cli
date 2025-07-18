import type { Browser } from "puppeteer";
import type { Config } from "../config";
import puppeteer from "puppeteer";
import type { Command } from "commander";
import { CookiesHelpers } from "../helpers/cookies-helpers";
import type { Page, WaitForSelectorOptions } from "puppeteer";
import { makeCommandLogger, makeLogger, type Logger } from "../logger";

export abstract class ApplicationCommand {
    protected browser: Browser | undefined;
    protected readonly logger: Logger = makeLogger("ApplicationCommand");

    protected readonly commandLogger: Logger = makeCommandLogger();

    constructor(protected readonly config: Config) {
    }

    abstract register(program: Command): void

    protected async authenticate(): Promise<Page | null> {
        const browser = await this.getBrowser();
        await CookiesHelpers.tryRestoreCookiesFromFileTo(browser);

        const loginOrHomePage = await browser.newPage();
        await loginOrHomePage.goto(this.config.routerUrl);

        // Check if the site is unavailable due to the rate limit being hit
        if (await this.isTemporarilyUnavailable(loginOrHomePage)) {
            // We'll have to wait out until the service is back up.
            // - Quit the app for now.
            return null;
        }

        // Ensure the user is not already authenticated
        const isAuthenticated = await this.checkAuth(loginOrHomePage);
        if (isAuthenticated) {
            return loginOrHomePage;
        }

        // Authenticate...
        this.logger.debug("\tAuthenticating now...");
        await loginOrHomePage.locator('#login-txt-pwd').fill(this.config.routerPassword);
        await loginOrHomePage.locator('#login-btn-logIn').click();
        await loginOrHomePage.waitForSelector('#home-form-logout', { timeout: 8_000 });
        await CookiesHelpers.exportCookiesToFile(loginOrHomePage);
        this.logger.debug("\t\tAuthenticated.");

        return loginOrHomePage;
    }

    protected async getBrowser(): Promise<Browser> {
        if (this.browser) {
            return this.browser;
        }

        this.browser = await puppeteer.launch({
            headless: true,
            userDataDir: "tmp/user-data/",
            networkEnabled: false,
            args: ['--no-sandbox'],
            defaultViewport: { width: 1280, height: 720 },
        });

        return this.browser;
    }

    protected async quit(): Promise<void> {
        await this.browser?.close();
    }

    private async isTemporarilyUnavailable(page: Page): Promise<boolean> {
        this.logger.debug("Checking whether the site has been temporarily blocked with a 503 due to rate limiting..");
        const pageContent = await page.content();
        const unavailable = pageContent.toLowerCase().includes("503 service");

        if (!unavailable) {
            this.logger.debug("\tYour router service is ok.");
            return false;
        }
        
        this.logger.error("\tYour router service is temporarily unavailable and reporting a 504. Please try again later.")
        return true;
    }

    /**
     * Return whether or not the user is currently authenticated by assessing the home page.
     */
    private async checkAuth(loginOrHomePage: Page): Promise<boolean> {
        this.logger.debug("Checking whether or not the user is already authenticated..")
        const HOME_PAGE_TEST_ELEMENT_ID = "home-form-logout";
        const LOGIN_PAGE_TEST_ELEMENT_ID = "login-txt-pwd";

        const selectorWaitOptions: WaitForSelectorOptions = {
            timeout: 10_000,
        };

        const homeOrLoginTestElement = await Promise.race([
            loginOrHomePage.waitForSelector(`#${HOME_PAGE_TEST_ELEMENT_ID}`, selectorWaitOptions).catch(() => {}),
            loginOrHomePage.waitForSelector(`#${LOGIN_PAGE_TEST_ELEMENT_ID}`, selectorWaitOptions).catch(() => {}),
        ]);

        if (!homeOrLoginTestElement) {
            this.logger.debug("\tCould not check the authentication.");
            return false;
        }

        const homeOrLoginTestElementId: string = await homeOrLoginTestElement.evaluate((element: any) => {
            return element.id
        });
        const authenticated = homeOrLoginTestElementId === HOME_PAGE_TEST_ELEMENT_ID;
        if (!authenticated) {
            this.logger.debug("\tNot already authenticated!");
            return false;
        }

        this.logger.debug("\tAlready authenticated!")
        return true;
    }
}