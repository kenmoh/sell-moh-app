import { deleteCategory, updateCategory } from "@/api/inventory";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

type Category = {
  id: string;
  name: string;
  description?: string;
};

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  category: Category | null;
};

const CategoryActionsSheet = ({ visible, onVisibleChange, category }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();

  const [view, setView] = useState<"menu" | "edit">("menu");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [errors, setErrors] = useState<Partial<Record<CategoryField, string>>>(
    {},
  );

  const { mutate: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: (data: { id: string; name: string; description: string }) =>
      updateCategory(data.id, { name: data.name, description: data.description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onVisibleChange(false);
      reset();
    },
    onError: (error) => {
      console.error("Failed to update category", error);
    },
  });

  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onVisibleChange(false);
      reset();
    },
    onError: (error) => {
      console.error("Failed to delete category", error);
    },
  });

  const reset = () => {
    setView("menu");
    setEditName("");
    setEditDescription("");
    setErrors({});
  };

  const handleOpenEdit = () => {
    if (!category) return;
    setEditName(category.name);
    setEditDescription(category.description || "");
    setView("edit");
  };

  const handleUpdate = () => {
    if (!category) return;
    const result = categorySchema.safeParse({
      name: editName,
      description: editDescription,
    });

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
    updateMutation({
      id: category.id,
      name: result.data.name,
      description: result.data.description,
    });
  };

  const handleDelete = () => {
    if (!category) return;
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation(category.id),
        },
      ],
    );
  };

  if (!category) return null;

  return (
    <AppBottomSheet
      snapPoints={view === "edit" ? ["55%", "70%"] : ["35%", "45%"]}
      visible={visible}
      onVisibleChange={(v) => {
        if (!v) reset();
        onVisibleChange(v);
      }}
    >
      {view === "menu" ? (
        <>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {category.name}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionPill, { backgroundColor: colors.backgroundElement }]}
              onPress={handleOpenEdit}
            >
              <Lucide name="pencil" size={16} color={colors.text} />
              <Text style={[styles.actionPillText, { color: colors.text }]}>Update</Text>
            </Pressable>

            <Pressable
              style={[styles.actionPill, { backgroundColor: "rgba(220,38,38,0.08)" }]}
              onPress={handleDelete}
            >
              <Lucide name="trash-2" size={16} color="#DC2626" />
              <Text style={[styles.actionPillText, { color: "#DC2626" }]}>Delete</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Edit Category
            </Text>
          </View>

          <View style={styles.content}>
            <AppTextInput
              placeholder="Category name"
              value={editName}
              onChangeText={setEditName}
              leftIcon="tag"
              autoCapitalize="words"
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
            <AppTextInput
              placeholder="Description"
              value={editDescription}
              onChangeText={setEditDescription}
              leftIcon="align-left"
              autoCapitalize="sentences"
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          <View style={styles.editActions}>
            <Pressable
              style={[styles.cancelBtn, { borderColor: colors.textSecondary }]}
              onPress={() => setView("menu")}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.saveBtn,
                {
                  backgroundColor: colors.buttonPrimary,
                  opacity: isUpdating ? 0.5 : 1,
                },
              ]}
              disabled={isUpdating}
              onPress={handleUpdate}
            >
              {isUpdating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        </>
      )}
    </AppBottomSheet>
  );
};

export default CategoryActionsSheet;

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 50,
  },
  actionPillText: {
    fontSize: 15,
    fontWeight: "600",
  },
  content: {
    gap: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: -4,
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  saveBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 50,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
