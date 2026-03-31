import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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
import {
  getHomeRouteForUser,
  getValidToken,
  loginUser,
  resolveSessionUser,
} from "../../services/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    const bootstrapSession = async () => {
      const token = await getValidToken();
      if (!mounted) return;

      if (token) {
        const sessionUser = await resolveSessionUser();
        if (!mounted) return;

        router.replace(getHomeRouteForUser(sessionUser) as any);
        return;
      }

      setCheckingSession(false);
    };

    bootstrapSession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    const { data, error } = await loginUser(email, password);
    setLoading(false);

    if (error) {
      Alert.alert("Login Failed", error);
      return;
    }

    router.replace(getHomeRouteForUser(data?.user) as any);
  };

  if (checkingSession) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#ffffff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

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
          <View style={{ alignItems: "center", marginBottom: 48 }}>
            <View
              style={{
                width: 64,
                height: 64,
                backgroundColor: "#4f46e5",
                borderRadius: 18,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 24,
                transform: [{ rotate: "3deg" }],
                shadowColor: "#4f46e5",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Ionicons name="sparkles" size={32} color="#ffffff" />
            </View>
            <Text
              style={{
                fontSize: 30,
                fontWeight: "bold",
                color: "#111827",
                letterSpacing: -0.5,
              }}
            >
              Welcome Back
            </Text>
            <Text style={{ fontSize: 15, color: "#9ca3af", marginTop: 8 }}>
              Sign in to continue to Connect
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
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
                placeholder="Email or Username"
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

            {/* Forgot Password */}
            <TouchableOpacity style={{ alignSelf: "flex-end" }}>
              <Text
                style={{ fontSize: 14, color: "#4f46e5", fontWeight: "600" }}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleLogin}
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
                  Sign In
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

          {/* Create Account */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/register")}
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
              Create Account
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
