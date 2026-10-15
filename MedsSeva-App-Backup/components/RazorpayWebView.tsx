import React from 'react';
import { Modal, SafeAreaView, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  notes?: Record<string, string>;
}

interface RazorpayWebViewProps {
  isVisible: boolean;
  options: RazorpayOptions;
  onSuccess: (data: any) => void;
  onFailed: (data: any) => void;
  onClose: () => void;
}

export const RazorpayWebView: React.FC<RazorpayWebViewProps> = ({
  isVisible,
  options,
  onSuccess,
  onFailed,
  onClose,
}) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>MedSeva Payment</title>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body, html {
          width: 100%; height: 100%;
          display: flex; justify-content: center; align-items: center;
          background: #f8fafc; font-family: -apple-system, sans-serif;
        }
        .loader-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .loader {
          border: 3px solid #e2e8f0;
          border-top: 3px solid #006D6F;
          border-radius: 50%; width: 40px; height: 40px;
          animation: spin 0.9s linear infinite;
        }
        .loader-text { color: #64748b; font-size: 14px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div class="loader-wrap">
        <div class="loader"></div>
        <div class="loader-text">Opening Razorpay...</div>
      </div>
      <script>
        window.addEventListener('load', function() {
          var opts = ${JSON.stringify(options)};
          opts.handler = function(response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SUCCESS', data: response }));
          };
          opts.modal = {
            ondismiss: function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DISMISS' }));
            }
          };
          var rzp = new Razorpay(opts);
          rzp.on('payment.failed', function(response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'FAILED', data: response }));
          });
          rzp.open();
        });
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'SUCCESS') {
        onSuccess(msg.data);
      } else if (msg.type === 'FAILED') {
        onFailed(msg.data);
      } else if (msg.type === 'DISMISS') {
        onClose();
      }
    } catch {
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <WebView
          source={{ html: htmlContent }}
          onMessage={handleMessage}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          allowsInlineMediaPlayback
        />
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.cancelText}>Cancel Payment</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  cancelBtn: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
});