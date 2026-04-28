import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

const DEFAULT_API_URL = 'https://api.legacybtc.example';
const DEFAULT_ADDRESS = 'LBTC1QEXAMPLEADDRESS000000000000000000000000';

const initialWallet = {
  address: DEFAULT_ADDRESS,
  balance: '0.00000000',
  immature: '0.00000000',
  height: 0,
  status: 'API not connected',
  transactions: [],
};

function formatAddress(addr) {
  if (!addr || addr.length < 18) return addr;
  return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
}

function cleanBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function normalizeBalancePayload(data) {
  return {
    balance: String(data?.balance ?? data?.available ?? '0.00000000'),
    immature: String(data?.immature ?? data?.immatureBalance ?? '0.00000000'),
    height: Number(data?.height ?? data?.blocks ?? 0),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export default function App() {
  const [page, setPage] = useState('wallet');
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [wallet, setWallet] = useState(initialWallet);
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [message, setMessage] = useState('Ready');
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => {
    if (page === 'wallet') return 'Wallet';
    if (page === 'receive') return 'Receive';
    if (page === 'send') return 'Send';
    return 'Settings';
  }, [page]);

  async function copyAddress() {
    await Clipboard.setStringAsync(address);
    setMessage('Address copied');
  }

  async function refreshWallet() {
    const base = cleanBaseUrl(apiUrl);
    const addr = String(address || '').trim();
    if (!base || !addr) {
      setMessage('Set API endpoint and address first');
      return;
    }

    setLoading(true);
    setMessage('Connecting to LegacyCoin API...');
    try {
      const health = await fetchJson(`${base}/health`);
      const balance = await fetchJson(`${base}/address/${encodeURIComponent(addr)}/balance`);
      let transactions = [];
      try {
        const txPayload = await fetchJson(`${base}/address/${encodeURIComponent(addr)}/transactions`);
        transactions = Array.isArray(txPayload) ? txPayload : Array.isArray(txPayload?.transactions) ? txPayload.transactions : [];
      } catch {
        transactions = [];
      }
      const normalized = normalizeBalancePayload(balance);
      setWallet({
        address: addr,
        balance: normalized.balance,
        immature: normalized.immature,
        height: normalized.height || Number(health?.height ?? health?.blocks ?? 0),
        status: String(health?.status ?? 'connected'),
        transactions,
      });
      setMessage('Wallet refreshed');
    } catch (error) {
      setWallet((prev) => ({ ...prev, status: 'API error' }));
      setMessage(`API error: ${error.message || String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  function submitSend() {
    if (!sendTo.trim() || !sendAmount.trim()) {
      setMessage('Enter destination and amount first');
      return;
    }
    setMessage('Send flow placeholder: signing/broadcast API is not enabled yet');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>LegacyCoin</Text>
          <Text style={styles.subBrand}>Mobile Wallet</Text>
        </View>
        <View style={styles.badge}><Text style={styles.badgeText}>LBTC</Text></View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.title}>{title}</Text>

        {page === 'wallet' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.label}>Available balance</Text>
              <Text style={styles.bigValue}>{wallet.balance}</Text>
              <Text style={styles.hint}>LBTC</Text>
            </View>
            <View style={styles.row}>
              <View style={[styles.card, styles.half]}>
                <Text style={styles.label}>Immature</Text>
                <Text style={styles.value}>{wallet.immature}</Text>
              </View>
              <View style={[styles.card, styles.half]}>
                <Text style={styles.label}>Height</Text>
                <Text style={styles.value}>{wallet.height}</Text>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.label}>API status</Text>
              <Text style={styles.valueSmall}>{wallet.status}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={refreshWallet} disabled={loading}>
                <Text style={styles.primaryButtonText}>{loading ? 'Refreshing...' : 'Refresh from API'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <Text style={styles.label}>Receive address</Text>
              <Text style={styles.mono}>{formatAddress(address)}</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={copyAddress}>
                <Text style={styles.secondaryButtonText}>Copy address</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <Text style={styles.label}>Recent transactions</Text>
              {wallet.transactions.length === 0 ? (
                <Text style={styles.hint}>No transactions loaded.</Text>
              ) : wallet.transactions.slice(0, 5).map((tx, idx) => (
                <Text key={`${tx.txid || idx}`} style={styles.txLine}>{tx.txid || tx.hash || JSON.stringify(tx)}</Text>
              ))}
            </View>
          </View>
        )}

        {page === 'receive' && (
          <View style={styles.card}>
            <Text style={styles.label}>Your LBTC address</Text>
            <Text style={styles.address}>{address}</Text>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrText}>QR placeholder</Text>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={copyAddress}>
              <Text style={styles.primaryButtonText}>Copy address</Text>
            </TouchableOpacity>
          </View>
        )}

        {page === 'send' && (
          <View style={styles.card}>
            <Text style={styles.label}>Recipient</Text>
            <TextInput style={styles.input} value={sendTo} onChangeText={setSendTo} placeholder="LBTC address" placeholderTextColor="#6b7280" autoCapitalize="none" />
            <Text style={styles.label}>Amount</Text>
            <TextInput style={styles.input} value={sendAmount} onChangeText={setSendAmount} placeholder="0.00000000" placeholderTextColor="#6b7280" keyboardType="decimal-pad" />
            <TouchableOpacity style={styles.primaryButton} onPress={submitSend}>
              <Text style={styles.primaryButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}

        {page === 'settings' && (
          <View style={styles.card}>
            <Text style={styles.label}>API endpoint</Text>
            <TextInput style={styles.input} value={apiUrl} onChangeText={setApiUrl} placeholder="https://api.example.com" placeholderTextColor="#6b7280" autoCapitalize="none" />
            <Text style={styles.label}>Wallet address to watch</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="LBTC address" placeholderTextColor="#6b7280" autoCapitalize="none" />
            <TouchableOpacity style={styles.primaryButton} onPress={refreshWallet} disabled={loading}>
              <Text style={styles.primaryButtonText}>{loading ? 'Testing...' : 'Test API connection'}</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>Expected endpoints: /health, /address/:address/balance, /address/:address/transactions</Text>
            <Text style={styles.label}>Architecture</Text>
            <Text style={styles.paragraph}>This mobile wallet is lightweight. It does not run a full node or miner on device.</Text>
          </View>
        )}

        <Text style={styles.status}>{message}</Text>
      </ScrollView>

      <View style={styles.tabs}>
        {['wallet', 'receive', 'send', 'settings'].map((item) => (
          <TouchableOpacity key={item} style={[styles.tab, page === item && styles.tabActive]} onPress={() => setPage(item)}>
            <Text style={[styles.tabText, page === item && styles.tabTextActive]}>{item[0].toUpperCase() + item.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#05070b' },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: '#ffffff', fontSize: 24, fontWeight: '800' },
  subBrand: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  badge: { borderWidth: 1, borderColor: '#374151', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: '#0b1020' },
  badgeText: { color: '#ffffff', fontWeight: '700' },
  content: { flex: 1 },
  contentInner: { padding: 18, paddingBottom: 32 },
  title: { color: '#ffffff', fontSize: 30, fontWeight: '800', marginBottom: 18 },
  card: { backgroundColor: '#0d1320', borderWidth: 1, borderColor: '#1f2937', borderRadius: 22, padding: 18, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 14 },
  half: { flex: 1 },
  label: { color: '#9ca3af', fontSize: 13, marginBottom: 8, marginTop: 4 },
  hint: { color: '#6b7280', fontSize: 12, marginTop: 6 },
  paragraph: { color: '#d1d5db', fontSize: 14, lineHeight: 21 },
  bigValue: { color: '#ffffff', fontSize: 38, fontWeight: '800' },
  value: { color: '#ffffff', fontSize: 21, fontWeight: '800' },
  valueSmall: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  mono: { color: '#d1d5db', fontFamily: 'monospace', fontSize: 13 },
  address: { color: '#ffffff', fontFamily: 'monospace', fontSize: 14, lineHeight: 22 },
  txLine: { color: '#d1d5db', fontFamily: 'monospace', fontSize: 12, paddingVertical: 5 },
  input: { backgroundColor: '#05070b', borderWidth: 1, borderColor: '#253044', borderRadius: 14, color: '#ffffff', padding: 14, marginBottom: 14 },
  primaryButton: { backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  primaryButtonText: { color: '#05070b', fontSize: 15, fontWeight: '800' },
  secondaryButton: { borderWidth: 1, borderColor: '#374151', borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  secondaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  qrPlaceholder: { height: 210, borderRadius: 24, borderWidth: 1, borderColor: '#253044', alignItems: 'center', justifyContent: 'center', marginVertical: 16, backgroundColor: '#070b12' },
  qrText: { color: '#6b7280' },
  status: { color: '#9ca3af', textAlign: 'center', marginTop: 8 },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#111827', backgroundColor: '#070b12', padding: 8 },
  tab: { flex: 1, paddingVertical: 11, borderRadius: 14, alignItems: 'center' },
  tabActive: { backgroundColor: '#ffffff' },
  tabText: { color: '#9ca3af', fontWeight: '700', fontSize: 12 },
  tabTextActive: { color: '#05070b' },
});
