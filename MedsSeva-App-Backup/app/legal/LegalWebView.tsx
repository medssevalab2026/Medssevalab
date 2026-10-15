import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

type LegalType = "terms" | "privacy" | "copyright" | "about";

const LEGAL_URLS: Record<LegalType, string> = {
  terms: "https://medsseva.com/terms-of-service.html",
  privacy: "https://medsseva.com/privacy-policy.html",
  copyright: "https://medsseva.com/copyright.html",
  about: "https://medsseva.com/aboutus.html",
};

const LEGAL_TITLES: Record<LegalType, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  copyright: "Copyright",
  about: "About Us",
};
const INJECTED_CSS = `
  (function() {
    const style = document.createElement('style');
    style.textContent = \`
      nav, header, footer,
      .navbar, .nav, .footer,
      .tnc-navbar, .tnc-footer { display: none !important; }
      .tnc-container { padding-top: 20px !important; }
      body { padding-top: 0 !important; margin-top: 0 !important; }
    \`;
    document.head.appendChild(style);
    true;
  })();
`;

function resolveType(raw: string | string[] | undefined): LegalType {
  const val = Array.isArray(raw) ? raw[0] : raw;
  if (val === "privacy" || val === "copyright" || val === "about") return val;
  return "terms";
}
export default function LegalWebView() {
  const { type: rawType } = useLocalSearchParams<{ type: string }>();
  const type = resolveType(rawType);
  const url = LEGAL_URLS[type];
  const title = LEGAL_TITLES[type];
  const canGoBack = router.canGoBack?.() ?? false;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webViewRef = useRef<WebView>(null);

  function handleBack() {
    if (canGoBack) router.back();
    else router.replace("/(auth)/login");
  }

  function handleRetry() {
    setError(false);
    setLoading(true);
    webViewRef.current?.reload();
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Failed to load</Text>
          <Text style={styles.errorSubtitle}>
            Check your internet connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.webviewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            injectedJavaScript={INJECTED_CSS}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 4 : 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  placeholder: {
    width: 36,
  },
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
   ...StyleSheet.absoluteFill,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: "#6366f1",
    borderRadius: 10,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});