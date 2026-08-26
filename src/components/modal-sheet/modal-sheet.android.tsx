import {
  Column,
  Host,
  ModalBottomSheet,
  RNHostView,
} from "@expo/ui/jetpack-compose";
import { fillMaxHeight, padding } from "@expo/ui/jetpack-compose/modifiers";
import { FlatList, Text as RNText } from "react-native";

const DATA = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

type ModalSheetProps = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
};

export default function ModalSheet({
  visible,
  onVisibleChange,
}: ModalSheetProps) {
  if (!visible) return null;

  return (
    <Host matchContents>
      <ModalBottomSheet
        onDismissRequest={() => onVisibleChange(false)}
        containerColor="#1a1a2e"
        contentColor="#e0e0e0"
        // scrimColor="#806200"
      >
        <Column modifiers={[fillMaxHeight(), padding(16, 16, 16, 16)]}>
          <RNHostView>
            <FlatList
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              data={DATA}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <RNText
                  style={{
                    color: "#ffffff",
                    paddingVertical: 16,
                    fontSize: 16,
                  }}
                >
                  {item}
                </RNText>
              )}
            />
          </RNHostView>
        </Column>
      </ModalBottomSheet>
    </Host>
  );
}
