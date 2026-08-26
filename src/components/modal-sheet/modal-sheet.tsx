import AppBottomSheet from "@/components/bottom-sheet";
import { FlatList, Text, StyleSheet } from "react-native";

const DATA = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

type ModalSheetProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
};

export default function ModalSheet({ visible, onVisibleChange }: ModalSheetProps) {
  return (
    <AppBottomSheet visible={visible} onVisibleChange={onVisibleChange}>
      <Text style={styles.title}>Modal Sheet</Text>
      <FlatList
        nestedScrollEnabled
        data={DATA}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Text style={styles.itemText}>{item}</Text>
        )}
        style={{ maxHeight: 400 }}
      />
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  itemText: {
    paddingVertical: 14,
    fontSize: 15,
  },
});
