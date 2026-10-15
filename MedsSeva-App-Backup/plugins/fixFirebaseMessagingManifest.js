const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function fixFirebaseMessagingManifest(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application?.[0];

    if (!application) return config;

    const metaDataArray = application["meta-data"] || [];

    const colorMeta = metaDataArray.find(
      (m) =>
        m.$?.["android:name"] ===
        "com.google.firebase.messaging.default_notification_color"
    );

    if (colorMeta) {
      colorMeta.$["android:resource"] = "@color/notification_icon_color";
      colorMeta.$["tools:replace"] = "android:resource";
    } else {
      metaDataArray.push({
        $: {
          "android:name":
            "com.google.firebase.messaging.default_notification_color",
          "android:resource": "@color/notification_icon_color",
          "tools:replace": "android:resource",
        },
      });
    }

    application["meta-data"] = metaDataArray;

    if (!manifest.manifest.$) {
      manifest.manifest.$ = {};
    }
    manifest.manifest.$["xmlns:tools"] =
      "http://schemas.android.com/tools";

    return config;
  });
};