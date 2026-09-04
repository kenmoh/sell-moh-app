import { createEmployee, fetchTenantRoles } from "@/api/auth";
import AppBottomSheet from "@/components/bottom-sheet";
import AppTextInput from "@/components/text-input";
import { Colors } from "@/constants/theme";
import { CreateEmployee } from "@/types/auth";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { z } from "zod";

const employeeSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().optional(),
  role: z.string().min(1, "Select a role"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type EmployeeField = keyof z.infer<typeof employeeSchema>;

type Props = {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
};

const AddEmployeeSheet = ({ visible, onVisibleChange }: Props) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<EmployeeField, string>>>(
    {},
  );

  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchTenantRoles,
    enabled: visible,
  });

  const { mutate: createEmployeeMutation, isPending } = useMutation({
    mutationFn: (data: CreateEmployee) => createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onVisibleChange(false);
      reset();
    },
    onError: (error) => {
      console.error("Failed to create employee", error);
    },
  });

  const reset = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setRole("");
    setPassword("");
    setShowPassword(false);
    setErrors({});
  };

  const handleCreate = () => {
    const result = employeeSchema.safeParse({
      fullName,
      email,
      phone: phone || undefined,
      role,
      password,
    });

    if (!result.success) {
      const fieldErrors: Partial<Record<EmployeeField, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as EmployeeField;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    createEmployeeMutation({
      full_name: result.data.fullName,
      email: result.data.email,
      phone: result.data.phone || null,
      role: result.data.role,
      password: result.data.password,
      store_id: null,
    });
  };

  const canSubmit = Object.keys(errors).length === 0 && !isPending;

  return (
    <AppBottomSheet
      snapPoints={["75%", "95%"]}
      visible={visible}
      onVisibleChange={onVisibleChange}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Add Employee
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Invite a new team member
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Personal Info
          </Text>
          <AppTextInput
            placeholder="Full name"
            value={fullName}
            onChangeText={setFullName}
            leftIcon="user"
            autoCapitalize="words"
          />
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          )}
          <AppTextInput
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            leftIcon="mail"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}
          <AppTextInput
            placeholder="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            leftIcon="phone"
            keyboardType="phone-pad"
          />
        </View>

        {/* Role */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Role
          </Text>

          {isLoadingRoles ? (
            <ActivityIndicator
              color={colors.buttonPrimary}
              style={{ padding: 20 }}
            />
          ) : (
            <View style={styles.roleRow}>
              {rolesData?.map((r) => {
                const isActive = role === r.name;
                return (
                  <Pressable
                    key={r.id}
                    style={[
                      styles.rolePill,
                      {
                        backgroundColor: isActive
                          ? colors.buttonPrimary
                          : colors.backgroundElement,
                      },
                    ]}
                    onPress={() => setRole(isActive ? "" : r.name)}
                  >
                    <Text
                      style={[
                        styles.rolePillText,
                        { color: isActive ? "#fff" : colors.text },
                      ]}
                    >
                      {r.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {errors.role && (
            <Text style={styles.errorText}>{errors.role}</Text>
          )}
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Security
          </Text>
          <AppTextInput
            placeholder="Temporary password"
            value={password}
            onChangeText={setPassword}
            leftIcon="lock"
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? "eye-off" : "eye"}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
        </View>
      </ScrollView>

      {/* Create Button */}
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
            <Lucide name="user-plus" size={18} color="#fff" />
            <Text style={styles.createBtnText}>Add Employee</Text>
          </>
        )}
      </Pressable>
    </AppBottomSheet>
  );
};

export default AddEmployeeSheet;

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
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rolePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  rolePillText: {
    fontSize: 14,
    fontWeight: "600",
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
