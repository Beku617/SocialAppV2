import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { fetchAdminReports, type AdminReport } from "../../services/api";
import AdminConfirmDialog, { type AdminDialogTone } from "./AdminConfirmDialog";

type AdminReportsSectionProps = {
  onDataChanged: () => void | Promise<void>;
};

type NoticeDialogState = {
  tone: AdminDialogTone;
  title: string;
  message: string;
};

const formatReasonLabel = (reason: string) =>
  reason
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function AdminReportsSection({
  onDataChanged,
}: AdminReportsSectionProps) {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noticeDialog, setNoticeDialog] = useState<NoticeDialogState | null>(
    null,
  );

  const loadReports = useCallback(async () => {
    const result = await fetchAdminReports();

    if (result.error) {
      setNoticeDialog({
        tone: "warning",
        title: "Reports",
        message: result.error,
      });
      setLoading(false);
      return;
    }

    setReports(result.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReports();
    await Promise.resolve(onDataChanged());
    setRefreshing(false);
  }, [loadReports, onDataChanged]);

  const openReports = useMemo(
    () => reports.filter((report) => report.status === "open"),
    [reports],
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 40,
        }}
      >
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            colors={["#111827"]}
            tintColor="#111827"
          />
        }
      >
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            paddingHorizontal: 18,
            paddingVertical: 16,
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}>
            Reports
          </Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>
            Open reports: {openReports.length}
          </Text>
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 24,
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          {reports.length === 0 ? (
            <View style={{ paddingVertical: 34, alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: "#9ca3af", fontWeight: "600" }}>
                No reports yet
              </Text>
            </View>
          ) : (
            reports.map((report, index) => (
              <View
                key={report.id}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 16,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: "#f3f4f6",
                  gap: 9,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#fef3c7",
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    }}
                  >
                    <Text
                      style={{
                        color: "#92400e",
                        fontSize: 11,
                        fontWeight: "700",
                        letterSpacing: 0.3,
                      }}
                    >
                      {formatReasonLabel(report.reason)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>
                    {new Date(report.createdAt).toLocaleString()}
                  </Text>
                </View>

                <Text style={{ fontSize: 14, color: "#374151" }}>
                  Reporter: {report.reporter?.name || "Unknown"}{" "}
                  {report.reporter?.email ? `(${report.reporter.email})` : ""}
                </Text>
                <Text style={{ fontSize: 14, color: "#374151" }}>
                  Post author: {report.post?.author?.name || "Unknown"}
                </Text>
                <Text
                  numberOfLines={2}
                  style={{ fontSize: 14, color: "#111827", fontWeight: "600" }}
                >
                  {report.post?.text?.trim() || "Image post"}
                </Text>
                {report.description ? (
                  <Text style={{ fontSize: 13, color: "#6b7280", lineHeight: 19 }}>
                    Details: {report.description}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <AdminConfirmDialog
        visible={noticeDialog !== null}
        tone={noticeDialog?.tone || "default"}
        title={noticeDialog?.title || ""}
        message={noticeDialog?.message || ""}
        primaryLabel="OK"
        onPrimary={() => setNoticeDialog(null)}
      />
    </View>
  );
}
