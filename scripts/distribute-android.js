const { existsSync, readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const apkPath = path.resolve("dist/sanskari-samriti-staging.apk");
const group = process.env.FIREBASE_TESTER_GROUP;

if (!existsSync(apkPath)) {
  console.error(`APK not found: ${apkPath}. Run "npm run build:apk:local" first.`);
  process.exit(1);
}

if (!group) {
  console.error("Set FIREBASE_TESTER_GROUP to your Firebase App Distribution tester group alias.");
  process.exit(1);
}

let appId;
try {
  const config = JSON.parse(readFileSync("google-services.json", "utf8"));
  appId = config.client?.find(
    (client) => client.client_info?.android_client_info?.package_name === "com.sanskarisamriti.app",
  )?.client_info?.mobilesdk_app_id;
} catch (error) {
  console.error(`Unable to read google-services.json: ${error.message}`);
  process.exit(1);
}

if (!appId) {
  console.error('No Firebase Android app ID found for "com.sanskarisamriti.app" in google-services.json.');
  process.exit(1);
}

const result = spawnSync(
  "npx",
  [
    "--yes",
    "firebase-tools@latest",
    "appdistribution:distribute",
    apkPath,
    "--app",
    appId,
    "--groups",
    group,
    "--release-notes",
    process.env.FIREBASE_RELEASE_NOTES || "Staging build",
  ],
  { stdio: "inherit" },
);

if (result.error) {
  console.error(`Unable to start Firebase CLI: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
