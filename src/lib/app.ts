import puppeteer, {Browser, Page, type WaitForSelectorOptions} from "puppeteer";
import type {Config} from "@/lib/config.ts";
import { makeLogger, type Logger } from "./logger";

export class App {
    private browser: Browser | undefined;
    private readonly logger: Logger = makeLogger("App");

    constructor(private readonly config: Config,) {
    }

    async init(): Promise<void> {
        this.logger.info("Initializing the app");
        const browser = await this.getBrowser();

        this.logger.debug("Navigating to the home page");
        const loginOrHomePage = await browser.newPage();
        await loginOrHomePage.goto(this.config.routerUrl);

        // Check if the site is unavailable due to the rate limit being hit
        if (await this.isTemporarilyUnavailable(loginOrHomePage)) {
            // We'll have to wait out until the service is back up.
            // - Quit the app for now.
            await this.quit();
        }

        // Authenticate if necessary
        const homePage = await this.authenticate(loginOrHomePage);

        // Do stuff while authenticated...
        const activeWifiDevicesCount = await homePage.evaluate(async () => {
            const wifiInfoUrl = "http://192.168.1.1/modals/overview.lp?status=wifiInfo&auto_update=true";
            const response = await fetch(wifiInfoUrl);
            const wifiInfo = await response.json() as { wifiActiveCount: number };

            return wifiInfo.wifiActiveCount;
        });

        console.log(`${activeWifiDevicesCount} active wifi devices!`)
    }

    async quit(): Promise<void> {
        await this.browser?.close();
    }

    private async authenticate(loginOrHomePage: Page) {
        // Ensure the user is not already authenticated;
        this.logger.debug("Checking whether or not the user is authenticated...")
        const isAuthenticated = await this.checkAuth(loginOrHomePage);
        if (isAuthenticated) {
            // Already authenticated. Nothing to do.
            this.logger.debug("\tAlready authenticated.");
            return loginOrHomePage;
        }

        // Authenticate...
        this.logger.debug("\tNot authenticated. Authenticating now...");
        await loginOrHomePage.locator('#login-txt-pwd').fill(this.config.routerPassword);
        await loginOrHomePage.locator('#login-btn-logIn').click();
        await loginOrHomePage.waitForSelector('#home-form-logout', { timeout: 8_000 });
        this.logger.debug("\t\tAuthenticated.");

        return loginOrHomePage;
    }

    private async isTemporarilyUnavailable(page: Page): Promise<boolean> {
        this.logger.debug("Checking whether the site has been temporarily blocked with a 503 due to rate limiting..");
        const pageContent = await page.content();
        const unavailable = pageContent.toLowerCase().includes("503 service");

        if (unavailable) {
            this.logger.error("\tYour router service is temporarily unavailable and reporting a 504. Please try again later.")
        }

        return unavailable;
    }

    /**
     * Return whether or not the user is currently authenticated by assessing the home page.
     */
    private async checkAuth(loginOrHomePage: Page): Promise<boolean> {
        this.logger.debug("Checking whether the user is already authenticated..")
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
            this.logger.debug("\tFailed to check authentication baed on the current page. TODO: retry");
            return false;
        }

        const homeOrLoginTestElementId: string = await homeOrLoginTestElement.evaluate((element: any) => {
            return element.id
        });

        this.logger.info("bgin");
        this.logger.info("Thing: " + homeOrLoginTestElementId);
        this.logger.info("done");
        return homeOrLoginTestElementId === HOME_PAGE_TEST_ELEMENT_ID;
    }

    private async getBrowser(): Promise<Browser> {
        if (this.browser) {
            return this.browser;
        }

        this.browser = await puppeteer.launch({
            headless: false,
            userDataDir: "tmp/user-data",
            networkEnabled: false,
            defaultViewport: { width: 1280, height: 720 },
        });

        return this.browser;
    }
}