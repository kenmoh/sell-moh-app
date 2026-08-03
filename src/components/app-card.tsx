import { Product } from "@/types/product-types";
import { Column, Text } from "@expo/ui";
import { Dimensions } from "react-native";

const WIDTH = Dimensions.get("window").width * 0.49;

const Card = ({ product }: { product: Product }) => {
  return (
    <Column style={{ width: WIDTH, backgroundColor: "green" }}>
      <Text textStyle={{ color: "red" }}>{product.name}</Text>
      <Text textStyle={{ color: "red" }}>{product.description}</Text>
      <Text textStyle={{ color: "red" }}>{product.price.toString()}</Text>
      <Text textStyle={{ color: "red" }}>{product.category?.name}</Text>
    </Column>
  );
};

export default Card;
