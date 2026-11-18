import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSyncStatus } from '../hooks/useSyncStatus';

export function SyncStatusBar(): React.JSX.Element | null {
  const { isOnline, isSyncing, pendingCount } = useSyncStatus();

  if (isOnline && !isSyncing && pendingCount === 0) {
    return null;
  }

  return (
    <View style={[styles.bar, !isOnline && styles.offline]}>
      <View style={styles.left}>
        {!isOnline && <Text style={styles.text}>Offline</Text>}
        {isSyncing && (
          <>
            <ActivityIndicator size="small" color="#fff" style={styles.spinner} />
            <Text style={styles.text}>Syncing...</Text>
          </>
        )}
        {isOnline && !isSyncing && pendingCount > 0 && (
          <Text style={styles.text}>{pendingCount} pending change{pendingCount > 1 ? 's' : ''}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 24,
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offline: {
    backgroundColor: '#f44336',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spinner: {
    marginRight: 4,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
