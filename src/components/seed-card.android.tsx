import { Column } from "@expo/ui";
import { Card, Text } from "@expo/ui/jetpack-compose";

export function SeedCard() {
  return (
    <Card>
      <Column spacing={8} alignment="center" style={{ padding: 16 }}>
        <Text>Card Title</Text>
        <Text>Card content inherits seedColor</Text>
      </Column>
    </Card>
  );
}
