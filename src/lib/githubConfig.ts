export interface GithubFirestoreConfig {
  tokenEncoded?: string;
  owner?: string;
  repo?: string;
  branch?: string;
}

export const GITHUB_DEFAULTS = {
  owner: "mrliga1",
  repo: "web1",
  branch: "main",
} as const;

export function decodeBase64(str: string): string | null {
  try {
    const normalized = str.trim().replace(/-/g, "+").replace(/_/g, "/");
    return atob(normalized);
  } catch (error) {
    console.error(
      "[githubConfig] decodeBase64 thất bại – chuỗi Base64 không hợp lệ:",
      error,
    );
    return null;
  }
}

export function resolveGithubToken(
  rawToken: string | undefined,
): { token: string } | { error: string } {
  if (rawToken === undefined || rawToken.trim() === "") {
    return {
      error:
        "GitHub Token chưa được cấu hình. Vào Cài đặt GitHub trong Admin hoặc thêm VITE_GITHUB_TOKEN vào .env.",
    };
  }

  const trimmed = rawToken.trim();

  if (trimmed.startsWith("ghp_") || trimmed.startsWith("github_pat_")) {
    return { token: trimmed };
  }

  if (trimmed.startsWith("base64:")) {
    const base64Part = trimmed.slice(7);
    if (
      base64Part.startsWith("ghp_") ||
      base64Part.startsWith("github_pat_")
    ) {
      return { token: base64Part };
    }
    const decoded = decodeBase64(base64Part);
    if (!decoded || decoded.trim() === "") {
      return {
        error:
          "GitHub Token (base64:...) không giải mã được. Kiểm tra lại cấu hình.",
      };
    }
    return { token: decoded.trim() };
  }

  const decoded = decodeBase64(trimmed);
  if (!decoded || decoded.trim() === "") {
    return {
      error:
        "GitHub Token không phải chuỗi Base64 hợp lệ. Kiểm tra lại cấu hình.",
    };
  }
  return { token: decoded.trim() };
}

export function buildGithubAuthHeader(token: string): string {
  return token.startsWith("ghp_") || token.startsWith("github_pat_")
    ? `token ${token}`
    : `Bearer ${token}`;
}

export function resolveGithubUploadSettings(
  firestoreConfig?: GithubFirestoreConfig | null,
): {
  owner: string;
  repo: string;
  branch: string;
  token: string;
} | { error: string } {
  const owner =
    firestoreConfig?.owner?.trim() ||
    import.meta.env.VITE_GITHUB_OWNER?.trim() ||
    GITHUB_DEFAULTS.owner;
  const repo =
    firestoreConfig?.repo?.trim() ||
    import.meta.env.VITE_GITHUB_REPO?.trim() ||
    GITHUB_DEFAULTS.repo;
  const branch =
    firestoreConfig?.branch?.trim() ||
    import.meta.env.VITE_GITHUB_BRANCH?.trim() ||
    GITHUB_DEFAULTS.branch;

  const rawToken =
    firestoreConfig?.tokenEncoded ||
    import.meta.env.VITE_GITHUB_TOKEN;

  const tokenResult = resolveGithubToken(rawToken);
  if ("error" in tokenResult) {
    return { error: tokenResult.error };
  }

  const token = tokenResult.token;
  if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
    return {
      error:
        "Token GitHub không hợp lệ sau khi giải mã. Kiểm tra lại cấu hình PAT.",
    };
  }

  return { owner, repo, branch, token };
}

export async function testGithubConnection(
  settings: ReturnType<typeof resolveGithubUploadSettings>,
): Promise<{
  configured: boolean;
  status: string;
  message: string;
  owner?: string;
  repo?: string;
  branch?: string;
}> {
  if ("error" in settings) {
    return {
      configured: false,
      status: "THIẾU CẤU HÌNH",
      message: settings.error,
    };
  }

  const { owner, repo, branch, token } = settings;
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: {
        Authorization: buildGithubAuthHeader(token),
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (response.ok) {
    const repoData = await response.json().catch(() => ({}));
    return {
      configured: true,
      status: "HOẠT ĐỘNG",
      owner,
      repo,
      branch,
      message: `Kết nối thành công! Token có quyền truy cập repo ${owner}/${repo}.`,
    };
  }

  const errorData = await response.json().catch(() => ({}));
  const errorMessage = errorData.message || response.statusText;
  return {
    configured: true,
    status: `LỖI KẾT NỐI (${response.status})`,
    owner,
    repo,
    branch,
    message: `Lỗi từ GitHub (Mã ${response.status}): ${errorMessage}`,
  };
}
