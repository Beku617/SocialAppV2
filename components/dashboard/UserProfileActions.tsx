import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export default function UserProfileActions({
  isOwnProfile,
  isFriend,
  requestPending,
  requestIncoming,
  actionLoading,
  onAddFriend,
  onAcceptFriend,
  onMessage,
}: {
  isOwnProfile: boolean;
  isFriend: boolean;
  requestPending: boolean;
  requestIncoming: boolean;
  actionLoading: boolean;
  onAddFriend: () => void;
  onAcceptFriend: () => void;
  onMessage: () => void;
}) {
  const actionLabel = isFriend
    ? "Friends"
    : requestIncoming
      ? "Accept Friend"
      : requestPending
        ? "Requested"
        : "Add Friend";

  const actionDisabled = isOwnProfile || isFriend || requestPending || actionLoading;

  return (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: 20,
        gap: 8,
        paddingBottom: 14,
      }}
    >
      {!isOwnProfile ? (
        <TouchableOpacity
          onPress={requestIncoming ? onAcceptFriend : onAddFriend}
          disabled={actionDisabled}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: requestIncoming ? "#1d4ed8" : "#111827",
            borderRadius: 10,
            paddingVertical: 10,
            gap: 6,
            borderWidth: 1,
            borderColor: "#374151",
            opacity: actionDisabled ? 0.72 : 1,
          }}
          activeOpacity={0.7}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons
                name={isFriend ? "people-outline" : "person-add-outline"}
                size={16}
                color="#fff"
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#fff",
                }}
              >
                {actionLabel}
              </Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        onPress={onMessage}
        style={{
          flex: isOwnProfile ? 1 : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#111827",
          borderWidth: 1,
          borderColor: "#374151",
          borderRadius: 10,
          paddingVertical: 10,
          gap: 6,
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="chatbubble-outline" size={16} color="#f9fafb" />
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "#f9fafb",
          }}
        >
          Message
        </Text>
      </TouchableOpacity>
    </View>
  );
}
