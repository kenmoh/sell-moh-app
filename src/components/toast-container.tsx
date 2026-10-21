import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modal, StyleSheet, View } from "react-native";
import { useToastContext } from "@/lib/toast-context";
import ToastItem from "./toast";

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToastContext();

  if (toasts.length === 0) return null;

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      onRequestClose={() => {
        const top = toasts[toasts.length - 1];
        if (top) dismissToast(top.id);
      }}
    >
      <GestureHandlerRootView style={styles.root}>
        <View pointerEvents="box-none" style={styles.container}>
          {toasts.map((toast, index) => (
            <ToastItem
              key={toast.id}
              id={toast.id}
              title={toast.title}
              message={toast.message}
              type={toast.type}
              timeout={toast.timeout}
              actions={toast.actions}
              index={index}
              onDismiss={dismissToast}
            />
          ))}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 50,
    pointerEvents: "box-none",
  },
});
