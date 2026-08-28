import { createCategory } from "@/api/inventory";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { CreateCategory } from "@/types/product";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  description: z.string().trim().min(1, "Description is required"),
});

type CategoryField = keyof z.infer<typeof categorySchema>;

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onCreated?: (name: string) => void;
};

const AddCategorySheet = ({ visible, onVisibleChange, onCreated }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Partial<Record<CategoryField, string>>>(
    {},
  );

  const { mutate: createCategoryMutation, isPending } = useMutation({
    mutationFn: (data: CreateCategory) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onVisibleChange(false);
      onCreated?.(name.trim());
      reset();
    },
    onError: (error) => {
      console.error("Failed to create category", error);
    },
  });

  const reset = () => {
    setName("");
    setDescription("");
    setErrors({});
  };

  const handleCreate = () => {
    const result = categorySchema.safeParse({ name, description });

    if (!result.success) {
      const fieldErrors: Partial<Record<CategoryField, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as CategoryField;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    createCategoryMutation({
      name: result.data.name,
      description: result.data.description,
    });
  };

  const canSubmit = !isPending;

  return (
    <AppBottomSheet
      snapPoints={["45%", "60%"]}
      visible={visible}
      onVisibleChange={onVisibleChange}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Add Category
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Create a new product category
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <AppTextInput
            placeholder="Category name"
            value={name}
            onChangeText={setName}
            leftIcon="tag"
            autoCapitalize="words"
          />
          {errors.name && (
            <Text style={styles.errorText}>{errors.name}</Text>
          )}
          <AppTextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            leftIcon="align-left"
            autoCapitalize="sentences"
          />
          {errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
        </View>
      </View>

      <Pressable
        style={[
          styles.createBtn,
          {
            backgroundColor: colors.buttonPrimary,
            opacity: canSubmit ? 1 : 0.5,
          },
        ]}
        disabled={!canSubmit}
        onPress={handleCreate}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Lucide name="plus" size={18} color="#fff" />
            <Text style={styles.createBtnText}>Create Category</Text>
          </>
        )}
      </Pressable>
    </AppBottomSheet>
  );
};

export default AddCategorySheet;

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  content: {
    paddingBottom: 16,
  },
  section: {
    gap: 10,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: -4,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 50,
    paddingVertical: 16,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
