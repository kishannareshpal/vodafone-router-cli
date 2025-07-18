import packageJson from 'package.json';

export type Config = {
    routerUrl: string,
    routerPassword: string
}

export const getConfig = (): Config => {
    return {
        routerUrl: process.env.ROUTER_URL ?? 'http://192.168.1.1',
        routerPassword: process.env.ROUTER_PASSWORD!
    }
}

export const getAppName = async (): Promise<string> => {
    return packageJson.name;
}