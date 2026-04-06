import { Ionicons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PostOptionsSheetProps = {
  visible: boolean;
  isOwner: boolean;
  authorName: string;
  saved: boolean;
  notificationsEnabled: boolean;
  onClose: () => void;
  onEditPost: () => void;
  onDeletePost: () => void;
  onToggleSaved: () => void;
  onHidePost: () => void;
  onReportPost: () => void;
  onToggleNotifications: () => void;
  onCopyLink: () => void;
  onSnoozeAuthor: () => void;
  onHideAuthor: () => void;
};

type OptionItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  danger?: boolean;
  onPress: () => void;
};

function OptionItem({
  icon,
  title,
  description,
  danger = false,
  onPress,
}: OptionItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.84}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 14,
        paddingVertical: 14,
      }}
    >
      <View
        style={{
          width: 36,
          alignItems: "center",
          paddingTop: description ? 2 : 0,
        }}
      >
        <Ionicons name={icon} size={29} color={danger ? "#dc2626" : "#111827"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: danger ? "#dc2626" : "#111827",
            lineHeight: 24,
          }}
        >
          {title}
        </Text>
        {description ? (
          <Text
            style={{
              marginTop: 2,
              fontSize: 13,
              lineHeight: 18,
              color: "#6b7280",
            }}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function SheetCard({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 12,
        marginBottom: 12,
      }}
    >
      {children}
    </View>
  );
}

export default function PostOptionsSheet({
  visible,
  isOwner,
  authorName,
  saved,
  notificationsEnabled,
  onClose,
  onEditPost,
  onDeletePost,
  onToggleSaved,
  onHidePost,
  onReportPost,
  onToggleNotifications,
  onCopyLink,
  onSnoozeAuthor,
  onHideAuthor,
}: PostOptionsSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(17, 24, 39, 0.32)",
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            maxHeight: "86%",
            backgroundColor: "#eef2f7",
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingTop: 10,
            paddingHorizontal: 12,
            paddingBottom: Math.max(insets.bottom, 12),
          }}
        >
          <View
            style={{
              width: 56,
              height: 6,
              borderRadius: 999,
              backgroundColor: "#9ca3af",
              alignSelf: "center",
              marginBottom: 12,
            }}
          />

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 6 }}
          >
            {isOwner ? (
              <SheetCard>
                <OptionItem
                  icon="create-outline"
                  title="Edit post"
                  description="Update your caption and images."
                  onPress={onEditPost}
                />
                <OptionItem
                  icon="trash-outline"
                  title="Delete post"
                  description="Remove this post from your profile and feed."
                  danger
                  onPress={onDeletePost}
                />
              </SheetCard>
            ) : null}

            <SheetCard>
              <OptionItem
                icon={saved ? "bookmark" : "bookmark-outline"}
                title={saved ? "Unsave post" : "Save post"}
                description={
                  saved
                    ? "Remove this post from your saved items."
                    : "Add this to your saved items."
                }
                onPress={onToggleSaved}
              />
              <OptionItem
                icon="eye-off-outline"
                title="Hide post"
                description="See fewer posts like this."
                onPress={onHidePost}
              />
              {!isOwner ? (
                <OptionItem
                  icon="alert-circle-outline"
                  title="Report post"
                  description={`We'll review this post without telling ${authorName} who reported it.`}
                  onPress={onReportPost}
                />
              ) : null}
              {isOwner ? (
                <OptionItem
                  icon={notificationsEnabled ? "notifications" : "notifications-outline"}
                  title={
                    notificationsEnabled
                      ? "Turn off notifications for this post"
                      : "Turn on notifications for this post"
                  }
                  description={
                    notificationsEnabled
                      ? "Stop getting updates about this post."
                      : "Get updates when people interact with this post."
                  }
                  onPress={onToggleNotifications}
                />
              ) : null}
              <OptionItem
                icon="copy-outline"
                title="Copy link"
                description="Copy a share token to open this post in app search."
                onPress={onCopyLink}
              />
            </SheetCard>

            {!isOwner ? (
              <SheetCard>
                <OptionItem
                  icon="time-outline"
                  title={`Snooze ${authorName} for 30 days`}
                  description="Temporarily stop seeing posts from this person."
                  onPress={onSnoozeAuthor}
                />
                <OptionItem
                  icon="remove-circle-outline"
                  title={`Hide all from ${authorName}`}
                  description="Stop seeing posts from this person."
                  onPress={onHideAuthor}
                />
              </SheetCard>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
