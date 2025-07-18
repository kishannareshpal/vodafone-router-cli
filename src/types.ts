export type WifiConnectedDevice = {
    Class: string,
    ConnectedTime: string, // in seconds?
    IPv4: string,
    DhcpLeaseIP: string,
    IPv6: string,
    HostName: string,
    FriendlyName: string,
    MACAddress: string,
    State: "0" | "1",
    Manufacturer: string
}

export type WifiInfo = {
    /**
     * The number of devices active in the guest SSID
     */
    guestActiveCount: number,

    /**
     * The number of devices active in the main SSID
     */
    mainWifiActiveCount: number,

    /**
     * The number of devices active in the main and both SSIDs
     */
    wifiActiveCount: number,

    /**
     * List of devices connected to the 2.4GHz main WiFi
     */
    wifiList24: WifiConnectedDevice[],

    /**
     * List of devices connected to the 5GHz main Wifi
     */
    wifiList5: WifiConnectedDevice[],

    /**
     * List of devices connected to the 2.4GHz guest Wifi
     */
    guestWifi24: WifiConnectedDevice[],

    /**
     * List of devices connected to the 5GHz guest Wifi
     */
    guestWifi5: WifiConnectedDevice[]
}