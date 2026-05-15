import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bitez.vendor",
  appName: "BITEZ Vendor",
  webDir: "out",
  android: {
    allowMixedContent: true,
  },
};

export default config;
