import { Colors } from "@/constants/theme";
import { Product } from "@/types/product-types";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const WIDTH = Dimensions.get("window").width * 0.46;

const Card = ({
  product,
  onPress,
}: {
  product: Product;
  onPress?: () => void;
}) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: WIDTH,
        backgroundColor: colors.card,
        padding: 10,
        borderRadius: 10,
        justifyContent: "space-between",
      }}
    >
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 12,
          marginVertical: 5,
        }}
      >
        {" "}
        {product.category?.name}
      </Text>
      <View>
        <Text
          style={{
            color: colors.text,
            fontSize: 14,
            flexWrap: "wrap",
          }}
        >
          {product.name}
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: 22,
          }}
        >
          ₦ {product.price}
        </Text>
      </View>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 12,
          marginTop: 10,
        }}
      >
        In Stock: {product.in_stock}
      </Text>
    </Pressable>
  );
};

export default Card;

const styles = StyleSheet.create({});
