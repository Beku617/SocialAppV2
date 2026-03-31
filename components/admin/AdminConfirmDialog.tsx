import { Ionicons } from "@expo/vector-icons";
import { Modal, Text, TouchableOpacity, View } from "react-native";

export type AdminDialogTone = "default" | "success" | "danger" | "warning";

type AdminConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  tone?: AdminDialogTone;
};

const toneMap: Record<
  AdminDialogTone,
  {
    icon: keyof typeof Ionicons.glyphMap;
    iconBg: string;
    iconColor: string;
    borderColor: string;
  }
> = {
  default: {
    icon: "information-circle-outline",
    iconBg: "#eff6ff",
    iconColor: "#2563eb",
    borderColor: "#dbeafe",
  },
  success: {
    icon: "checkmark-circle-outline",
    iconBg: "#ecfdf5",
    iconColor: "#059669",
    borderColor: "#dcfce7",
  },
  danger: {
    icon: "trash-outline",
    iconBg: "#fef2f2",
    iconColor: "#dc2626",
    borderColor: "#fee2e2",
  },
  warning: {
    icon: "alert-circle-outline",
    iconBg: "#fffbeb",
    iconColor: "#d97706",
    borderColor: "#fef3c7",
  },
};

export default function AdminConfirmDialog({
  visible,
  title,
  message,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  tone = "default",
}: AdminConfirmDialogProps) {
  const styles = toneMap[tone];
  const hasSecondaryAction = Boolean(secondaryLabel && onSecondary);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onSecondary || onPrimary}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(15, 23, 42, 0.38)",
          justifyContent: "center",
          paddingHorizontal: 22,
        }}
      >
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 28,
            padding: 22,
            borderWidth: 1,
            borderColor: styles.borderColor,
            shadowColor: "#0f172a",
            shadowOffset: { width: 0, height: 14 },
            shadowOpacity: 0.12,
            shadowRadius: 28,
            elevation: 10,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: styles.iconBg,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name={styles.icon} size={22} color={styles.iconColor} />
          </View>

          <Text
            style={{
              fontSize: 21,
              fontWeight: "700",
              color: "#111827",
              letterSpacing: -0.3,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 21,
              color: "#6b7280",
            }}
          >
            {message}
          </Text>

          <View
            style={{
              flexDirection: hasSecondaryAction ? "row" : "column",
              gap: 12,
              marginTop: 22,
            }}
          >
            {hasSecondaryAction ? (
              <TouchableOpacity
                onPress={onSecondary}
                style={{
                  flex: 1,
                  backgroundColor: "#f3f4f6",
                  borderRadius: 16,
                  paddingVertical: 13,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#374151",
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  {secondaryLabel}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={onPrimary}
              style={{
                flex: hasSecondaryAction ? 1 : undefined,
                backgroundColor: "#111827",
                borderRadius: 16,
                paddingVertical: 13,
                alignItems: "center",
                width: hasSecondaryAction ? undefined : "100%",
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {primaryLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
