export type EngagementTable = "products" | "projects" | "news";
export type EngagementAction = "view" | "rating";

export interface EngagementResult {
  accepted: boolean;
  viewsCount: number;
  userTotalRating: number;
  userReviewCount: number;
}

export async function recordContentEngagement(input: {
  table: EngagementTable;
  id: string;
  action: EngagementAction;
  value?: number;
}): Promise<EngagementResult> {
  const response = await fetch("/api/engagement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
    keepalive: true,
  });

  const result = (await response.json().catch(() => ({}))) as Partial<
    EngagementResult & { error: string }
  >;

  if (!response.ok) {
    throw new Error(result.error || "Không thể ghi nhận tương tác");
  }

  return {
    accepted: result.accepted === true,
    viewsCount: Number(result.viewsCount) || 0,
    userTotalRating: Number(result.userTotalRating) || 0,
    userReviewCount: Number(result.userReviewCount) || 0,
  };
}
