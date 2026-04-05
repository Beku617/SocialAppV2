import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getHomeRouteForUser, registerUser } from "../../services/api";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const navigatedRef = useRef(false);

  const handleRegister = async () => {
    if (loading || submittingRef.current || navigatedRef.current) return;

    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      const { data, error } = await registerUser(fullName, email, password);

      if (error) {
        Alert.alert("Registration Failed", error);
        return;
      }

      if (navigatedRef.current) return;
      navigatedRef.current = true;
      router.replace(getHomeRouteForUser(data?.user) as any);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <View
              style={{
                width: 64,
                height: 64,
                backgroundColor: "#4f46e5",
                borderRadius: 18,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 24,
                transform: [{ rotate: "-3deg" }],
                shadowColor: "#4f46e5",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Ionicons name="person-add" size={28} color="#ffffff" />
            </View>
            <Text
              style={{
                fontSize: 30,
                fontWeight: "bold",
                color: "#111827",
                letterSpacing: -0.5,
              }}
            >
              Create Account
            </Text>
            <Text style={{ fontSize: 15, color: "#9ca3af", marginTop: 8 }}>
              Join Connect and start sharing
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            {/* Full Name */}
            <View
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#f3f4f6",
                paddingHorizontal: 20,
              }}
            >
              <TextInput
                style={{ paddingVertical: 16, fontSize: 15, color: "#111827" }}
                placeholder="Full Name"
                placeholderTextColor="#9ca3af"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#f3f4f6",
                paddingHorizontal: 20,
              }}
            >
              <TextInput
                style={{ paddingVertical: 16, fontSize: 15, color: "#111827" }}
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#f3f4f6",
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  fontSize: 15,
                  color: "#111827",
                }}
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#f3f4f6",
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  fontSize: 15,
                  color: "#111827",
                }}
                placeholder="Confirm Password"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              style={{
                backgroundColor: "#4f46e5",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                marginTop: 8,
                opacity: loading ? 0.7 : 1,
                shadowColor: "#4f46e5",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 6,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text
                  style={{ color: "#ffffff", fontSize: 17, fontWeight: "bold" }}
                >
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 32,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
            <Text
              style={{
                marginHorizontal: 16,
                color: "#9ca3af",
                fontSize: 12,
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Or
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
          </View>

          {/* Sign In Link */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#111827", fontSize: 17, fontWeight: "600" }}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
