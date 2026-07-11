import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  db,
  auth,
  setDoc,
} from "../firebase";
import {
  docRealtime,
  collectionRealtime,
  dbRealtime,
  onSnapshot,
} from "../firebase-realtime";
import { onAuthStateChanged } from '../firebase';
import { authFetch } from '../lib/authFetch';
import {
  PlusCircle,
  Trash2,
  Mail,
  ShieldAlert,
  CheckCircle,
  Clock,
  Save,
  Image,
  MapPin,
  Phone,
  Building2,
  LayoutGrid,
  Eye,
  Search,
  Sparkles,
  X,
  Bold,
  List,
  LogOut,
  FileText,
  Settings,
  UserCheck,
  Shield,
  ChevronRight,
  AlertCircle,
  Edit,
  Plus,
  Sun,
  Moon,
  Menu,
  Compass,
  RefreshCw,
  Bookmark,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ArrowLeft,
  Activity,
  MousePointerClick,
  DollarSign,
  TrendingUp,
  Users,
  BarChart2,
  Target,
  Kanban,
  MessageSquare,
  PhoneCall,
  Award,
  Ban,
  UserPlus,
  User,
  MoreVertical,
  Calendar,
  Filter,
  AlignJustify,
  Download,
  Share2,
  Zap,
} from "lucide-react";
import { handleFirestoreError, OperationType } from "../firebase-errors";
import { Product, Project, News, RouteState, FloorPlanTab } from "../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import UserProfileTab from "./UserProfileTab";
import { allLocationsList } from "../lib/locationMapping";
import {
  GITHUB_DEFAULTS,
  GithubFirestoreConfig,
  buildGithubAuthHeader,
  resolveGithubUploadSettings,
  testGithubConnection,
} from "../lib/githubConfig";

interface AdminPanelProps {
  onShowNotification: (message: string, type: "success" | "error") => void;
  onNavigate: (route: RouteState) => void;
  logoUrl?: string;
}

export type UserRole = "admin" | "editor" | "member" | "user";

export default function AdminPanel({
  onShowNotification,
  onNavigate,
  logoUrl,
}: AdminPanelProps) {
  const { currentUser, userProfile, logout, loading: authLoading } = useAuth();

  // Authentication, passwords, and security contexts
  const isLoggedIn = !!currentUser;
  const currentUserRole = userProfile?.role || "user";
  const currentMemberEmail = userProfile?.email || "";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const isSidebarExpanded = desktopSidebarOpen || isSidebarHovered;
  const theme = "dark";

  // Primary data arrays synced to state
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newsCategories, setNewsCategories] = useState<string[]>([]);
  const [blockedIps, setBlockedIps] = useState<string[]>([]);
  const [serviceAccountJson, setServiceAccountJson] = useState("");
  const [firebaseAdminStatus, setFirebaseAdminStatus] = useState<boolean | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [newBlockedIp, setNewBlockedIp] = useState("");
  const [seoConfig, setSeoConfig] = useState({
    metaTitle: "Greenia Homes - Cố Vấn Bất Động Sản Chuyên Sâu",
    metaDesc:
      "Đồng hành tư vấn đầu tư bất động sản cá nhân hóa, từ pháp lý sổ hồng đến phân tích vĩ mô.",
    metaKeywords:
      "greenia homes, biệt thự thảo điền, chuyển nhượng biệt thự, phong thủy nhà ở tphcm",
  });

  const [loading, setLoading] = useState(false);

  // Layout navigation: which sub-manager is currently open
  const [activeTab, setActiveTab] = useState<
    | "listings"
    | "projects"
    | "articles"
    | "categories"
    | "users"
    | "seo"
    | "leads"

    | "google"
    | "profile"
  >("listings");
  const [users, setUsers] = useState<any[]>([]);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editingEmployeeName, setEditingEmployeeName] = useState("");
  const [googleServiceTab, setGoogleServiceTab] = useState<
    "ga4" | "gtm" | "ads" | "adsense" | "fb" | "tiktok" | "cookie"
  >("ga4");
  const [crmSelectedLead, setCrmSelectedLead] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dashboardFilter, setDashboardFilter] = useState<
    "all" | "new" | "contacted" | "negotiating" | "won"
  >("all");
  const [usersFilter, setUsersFilter] = useState<"all" | "admin" | "editor" | "member" | "user">("all");

  // Interactive Create Masters Form states
  const [createType, setCreateType] = useState<
    "product" | "project" | "article"
  >("product");

  // Generic content variables for the creation wizard
  const [title, setTitle] = useState("");
  const [priceText, setPriceText] = useState("");
  const [priceVal, setPriceVal] = useState("");
  const [prodType, setProdType] = useState<"sale" | "rent">("sale");
  const [district, setDistrict] = useState("");
  const [street, setStreet] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [editorMode, setEditorMode] = useState<"visual" | "code">("visual");
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [expandedEditors, setExpandedEditors] = useState<
    Record<string, boolean>
  >({
    overview: true,
    subdivisions: false,
    location: false,
    amenity: false,
    floorPlan: false,
    price: false,
    qa: false,
    customSections: false,
  });
  const quillRef = useRef<ReactQuill>(null);
  const activeQuillInstance = useRef<any>(null);

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ color: [] }, { background: [] }],
          ["link", "image", "video"],
          ["clean"],
        ],
        handlers: {
          image: function (this: any) {
            activeQuillInstance.current = this.quill;
            setLibraryTargetField("editor-quill-dynamic");
            setIsLibraryOpen(true);
          },
        },
      },
    }),
    [],
  );

  const [category, setCategory] = useState("");

  // technical and property specs
  const [bedrooms, setBedrooms] = useState("");
  const [toilets, setToilets] = useState("");
  const [area, setArea] = useState("");
  const [direction, setDirection] = useState("");
  const [roadWidth, setRoadWidth] = useState("");
  const [legalStatus, setLegalStatus] = useState("");
  const [floors, setFloors] = useState("");
  const [interior, setInterior] = useState("");
  const [mapHtml, setMapHtml] = useState("");

  // Dynamic edit values and uploader references
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [albumUrlInput, setAlbumUrlInput] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [githubStatus, setGithubStatus] = useState<any>(null);
  const [checkingGithub, setCheckingGithub] = useState(false);
  const [showGithubConfigModal, setShowGithubConfigModal] = useState(false);
  const [configToken, setConfigToken] = useState("");
  const [configOwner, setConfigOwner] = useState("");
  const [configRepo, setConfigRepo] = useState("");
  const [configBranch, setConfigBranch] = useState("main");
  const [savingConfig, setSavingConfig] = useState(false);
  const [githubFirestoreConfig, setGithubFirestoreConfig] =
    useState<GithubFirestoreConfig | null>(null);

  // Selection editor formatting helper
  const formatSelectedText = (tagOpen: string, tagClose: string) => {
    const textarea = document.getElementById(
      "html-content-editor",
    ) as HTMLTextAreaElement;
    if (!textarea) {
      appendRichHtmlByTags(tagOpen, tagClose);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = tagOpen + (selected || "Văn bản") + tagClose;
    setHtmlContent(
      text.substring(0, start) + replacement + text.substring(end),
    );
    onShowNotification("Đã áp dụng mã định dạng thành công!", "success");

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + tagOpen.length,
        start + tagOpen.length + (selected || "Văn bản").length,
      );
    }, 0);
  };

  const appendRichHtmlByTags = (tagOpen: string, tagClose: string) => {
    setHtmlContent((prev) => prev + tagOpen + "Nội dung mẫu" + tagClose);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: string,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadStatus(files.length > 1 ? `Đang xử lý ảnh ${i + 1}/${files.length}...` : "Đang đọc dữ liệu ảnh...");

        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.onerror = (error) => reject(error);
        });
        reader.readAsDataURL(file);
        let base64 = await base64Promise;
        let uploadFileName = file.name;

        if (!file.type.includes("webp")) {
          setUploadStatus(files.length > 1 ? `Đang tối ưu hóa ảnh ${i + 1}/${files.length} sang WebP...` : "Đang tối ưu hóa ảnh sang định dạng WebP...");
          const convertedBase64 = await new Promise<string>((resolve) => {
            const img = new globalThis.Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              if (!ctx) return resolve(base64);
              ctx.drawImage(img, 0, 0);
              const webpDataUrl = canvas.toDataURL("image/webp", 0.85);
              resolve(webpDataUrl);
            };
            img.onerror = () => resolve(base64);
            img.src = base64;
          });

          base64 = convertedBase64;
          const nameWithoutExt = file.name.includes(".")
            ? file.name.substring(0, file.name.lastIndexOf("."))
            : file.name;
          uploadFileName = nameWithoutExt + ".webp";
        }

        const githubSettings = resolveGithubUploadSettings(githubFirestoreConfig);
        if ("error" in githubSettings) {
          console.error("[AdminPanel] GitHub config:", githubSettings.error);
          throw new Error(githubSettings.error);
        }

        const { owner, repo, branch, token: realToken } = githubSettings;

        const uniqueFileName = uploadFileName.replace(
          /(\.[^.]+)$/,
          `-${Date.now()}$1`,
        );

        setUploadStatus(files.length > 1 ? `Đang tải ảnh ${i + 1}/${files.length} lên GitHub...` : "Đang tải ảnh lên GitHub...");

        const pureBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
        if (!pureBase64) {
          throw new Error("Không thể đọc dữ liệu ảnh Base64.");
        }

        const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/public/uploads/${uniqueFileName}`;

        const response = await fetch(githubApiUrl, {
          method: "PUT",
          headers: {
            Authorization: buildGithubAuthHeader(realToken),
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Upload ảnh ${uniqueFileName} từ Admin`,
            content: pureBase64,
            branch,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const message =
            errorData.message ||
            errorData.error ||
            `GitHub API trả về lỗi ${response.status}.`;
          throw new Error(message);
        }

        const responseData = await response.json();
        const relativeUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/public/uploads/${uniqueFileName}`;

        if (relativeUrl) {
          uploadedUrls.push(relativeUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        if (targetField.startsWith("subdivisionCardImage:")) {
          const idxStr = targetField.split(":")[1];
          const idx = parseInt(idxStr, 10);
          if (!isNaN(idx)) {
            setSubdivisionsCards((prev) => {
              const next = [...prev];
              if (next[idx]) {
                next[idx].imageUrl = uploadedUrls[0];
              }
              return next;
            });
            onShowNotification("Tải ảnh phân khu thành công!", "success");
          }
        } else if (targetField.startsWith("tabImage:")) {
          const tabId = targetField.split(":")[1];
          setFloorPlanTabsList((prev) =>
            prev.map((tab) =>
              tab.id === tabId
                ? { ...tab, images: [...(tab.images || []), ...uploadedUrls] }
                : tab,
            ),
          );
          onShowNotification(`Tải ${uploadedUrls.length} ảnh tab mặt bằng thành công!`, "success");
        } else if (targetField === "imageUrl") {
          setImageUrl(uploadedUrls[0]);
          onShowNotification("Tải ảnh đại diện thành công vào hệ thống!", "success");
        } else if (targetField === "avatarUrl") {
          setAvatarUrl(uploadedUrls[0]);
          onShowNotification("Tải ảnh môi giới đại diện thành công!", "success");
        } else if (targetField === "album") {
          setImageUrls((prev) => [...prev, ...uploadedUrls]);
          onShowNotification(`Chèn thêm ${uploadedUrls.length} ảnh phụ album thành công!`, "success");
        } else if (targetField === "floorPlanAlbum") {
          setFloorPlanImages((prev) => [...prev, ...uploadedUrls]);
          onShowNotification(`Tải ${uploadedUrls.length} ảnh mặt bằng thành công!`, "success");
        } else if (targetField === "amenityAlbum") {
          setAmenityImages((prev) => [...prev, ...uploadedUrls]);
          onShowNotification(`Tải ${uploadedUrls.length} ảnh tiện ích thành công!`, "success");
        } else if (targetField === "logoUrl") {
          await setDoc(
            doc(db, "settings", "general"),
            { logoUrl: uploadedUrls[0] },
            { merge: true },
          );
          onShowNotification("Cập nhật logo thương hiệu mới thành công!", "success");
        } else if (targetField === "library") {
          setUploadedLibraryImages((prev) => [...uploadedUrls, ...prev]);
          onShowNotification(`Tải ${uploadedUrls.length} ảnh vào kho thành công!`, "success");
        }
      } else {
        throw new Error("Không có ảnh nào được tải lên thành công.");
      }
    } catch (err: any) {
      console.error(err);
      onShowNotification(`Lỗi xử lý file: ${err.message || err}`, "error");
    } finally {
      setIsUploading(false);
      setUploadStatus("");
      e.target.value = '';
    }
  };

  const handleSelectFromLibrary = (pickedUrl: string) => {
    if (
      typeof libraryTargetField === "string" &&
      libraryTargetField.startsWith("subdivisionCardImage:")
    ) {
      const idxStr = libraryTargetField.split(":")[1];
      const idx = parseInt(idxStr, 10);
      if (!isNaN(idx)) {
        setSubdivisionsCards((prev) => {
          const next = [...prev];
          if (next[idx]) {
            next[idx].imageUrl = pickedUrl;
          }
          return next;
        });
        onShowNotification("Đã nối ảnh phân khu từ kho thư viện!", "success");
      }
    } else if (
      typeof libraryTargetField === "string" &&
      libraryTargetField.startsWith("tabImage:")
    ) {
      const tabId = libraryTargetField.split(":")[1];
      setFloorPlanTabsList((prev) =>
        prev.map((tab) =>
          tab.id === tabId
            ? { ...tab, images: [...(tab.images || []), pickedUrl] }
            : tab,
        ),
      );
      onShowNotification(
        "Đã chèn thêm ảnh tab mặt bằng từ kho thư viện!",
        "success",
      );
    } else if (libraryTargetField === "imageUrl") {
      setImageUrl(pickedUrl);
      onShowNotification("Đã nối ảnh bìa chính từ kho thư viện!", "success");
    } else if (libraryTargetField === "avatarUrl") {
      setAvatarUrl(pickedUrl);
      onShowNotification(
        "Đã nối ảnh chân dung môi giới từ kho thư viện!",
        "success",
      );
    } else if (libraryTargetField === "album") {
      setImageUrls((prev) => [...prev, pickedUrl]);
      onShowNotification(
        "Đã chèn thêm ảnh phụ album từ kho thư viện!",
        "success",
      );
    } else if (libraryTargetField === "floorPlanAlbum") {
      setFloorPlanImages((prev) => [...prev, pickedUrl]);
      onShowNotification(
        "Đã chèn thêm ảnh mặt bằng từ kho thư viện!",
        "success",
      );
    } else if (libraryTargetField === "amenityAlbum") {
      setAmenityImages((prev) => [...prev, pickedUrl]);
      onShowNotification(
        "Đã chèn thêm ảnh tiện ích từ kho thư viện!",
        "success",
      );
    } else if (libraryTargetField === "editor") {
      const imgTag = `<img loading="lazy" decoding="async" src="${pickedUrl}" alt="Hình ảnh bài viết" />`;
      if (editorCursorMatch) {
        const { start, end, text } = editorCursorMatch;
        setHtmlContent(
          text.substring(0, start) + "\n" + imgTag + "\n" + text.substring(end),
        );
        setEditorCursorMatch(null);
      } else {
        setHtmlContent((prev) => prev + "\n" + imgTag + "\n");
      }
      onShowNotification("Đã chèn ảnh vào nội dung bài viết!", "success");
    } else if (libraryTargetField === "editor-quill") {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection();
        const cursorPosition = range ? range.index : editor.getLength();
        editor.insertEmbed(cursorPosition, "image", pickedUrl);
        editor.setSelection(cursorPosition + 1, 0);
      }
      onShowNotification("Đã chèn ảnh vào nội dung bài viết!", "success");
    } else if (libraryTargetField === "editor-quill-dynamic") {
      if (activeQuillInstance.current) {
        const editor = activeQuillInstance.current;
        const range = editor.getSelection();
        const cursorPosition = range ? range.index : editor.getLength();
        editor.insertEmbed(cursorPosition, "image", pickedUrl);
        editor.setSelection(cursorPosition + 1, 0);
      }
      onShowNotification("Đã chèn ảnh vào nội dung bài viết!", "success");
    }
    setIsLibraryOpen(false);
    setLibraryTargetField(null);
  };

  const handleAddAlbumUrl = () => {
    if (albumUrlInput.trim()) {
      setImageUrls((prev) => [...prev, albumUrlInput.trim()]);
      setAlbumUrlInput("");
      onShowNotification(
        "Đã lưu đường dẫn ảnh vào album thành công!",
        "success",
      );
    }
  };

  const handleRemoveAlbumImage = (idxToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    onShowNotification("Đã gỡ ảnh khỏi album.", "success");
  };

  const handleAddFloorPlanAlbumUrl = () => {
    if (floorPlanImageUrlInput.trim()) {
      setFloorPlanImages((prev) => [...prev, floorPlanImageUrlInput.trim()]);
      setFloorPlanImageUrlInput("");
      onShowNotification("Đã thêm ảnh mặt bằng thành công!", "success");
    }
  };

  const handleRemoveFloorPlanAlbumImage = (idxToRemove: number) => {
    setFloorPlanImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    onShowNotification("Đã gỡ ảnh khỏi mặt bằng.", "success");
  };

  const handleAddAmenityAlbumUrl = () => {
    if (amenityImageUrlInput.trim()) {
      setAmenityImages((prev) => [...prev, amenityImageUrlInput.trim()]);
      setAmenityImageUrlInput("");
      onShowNotification("Đã thêm ảnh tiện ích thành công!", "success");
    }
  };

  const handleRemoveAmenityAlbumImage = (idxToRemove: number) => {
    setAmenityImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    onShowNotification("Đã gỡ ảnh khỏi tiện ích.", "success");
  };

  const handleAddFloorPlanTab = () => {
    if (floorPlanTabsList.length >= 5) {
      onShowNotification("Chỉ có thể tạo tối đa 5 tab mặt bằng.", "error");
      return;
    }
    const newId = `tab-${Date.now()}`;
    setFloorPlanTabsList((prev) => [
      ...prev,
      { id: newId, name: `Tab ${prev.length + 1}`, content: "", images: [] },
    ]);
    setActiveFloorPlanTabId(newId);
  };

  const handleRemoveFloorPlanTab = (idToRemove: string) => {
    setFloorPlanTabsList((prev) => prev.filter((t) => t.id !== idToRemove));
    if (activeFloorPlanTabId === idToRemove) {
      setActiveFloorPlanTabId(null);
    }
  };

  const handleUpdateFloorPlanTab = (
    id: string,
    field: keyof FloorPlanTab,
    value: any,
  ) => {
    setFloorPlanTabsList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  // Action initiators for edits
  const handleStartEditProduct = (item: Product) => {
    if (
      (currentUserRole === "member" || currentUserRole === "user") &&
      item.createdBy !== currentMemberEmail
    ) {
      onShowNotification(
        "Lỗi phân quyền: Bạn chỉ có thể sửa sản phẩm do chính bạn đăng!",
        "error",
      );
      return;
    }
    setTitle(item.title);
    setPriceText(item.priceText || "");
    setPriceVal(String(item.priceVal || ""));
    setProdType(item.type || "sale");
    setDistrict(item.district || "");
    setStreet(item.street || "");
    setContactPhone(item.phone || "");
    setImageUrl(item.imageUrl || "");
    setImageUrls(item.imageUrls || [item.imageUrl || ""]);
    setAvatarUrl(item.avatarUrl || "");
    setHtmlContent(item.description || "");
    setCategory(item.category || "");

    // extra specs
    setBedrooms(String(item.bedrooms || ""));
    setToilets(String(item.toilets || ""));
    setArea(String(item.area || ""));
    setDirection(item.direction || "");
    setRoadWidth(item.roadWidth || "");
    setLegalStatus(item.legalStatus || "");
    setFloors(String(item.floors || ""));
    setInterior(item.interior || "");
    setMapHtml(item.mapHtml || "");

    // Set item-level SEO tags
    setItemSeoTitle(item.seoTitle || item.metaTitle || "");
    setItemSeoDesc(item.seoDesc || item.metaDesc || "");
    setItemSeoKeywords(item.seoKeywords || item.metaKeywords || "");
    setItemBaseRating(String(item.baseRating ?? 5.0));
    setItemBaseReviewCount(String(item.baseReviewCount ?? 0));

    setIsEditing(true);
    setEditingItemId(item.id);
    setCreateType("product");
    setActiveTab("new_wizard" as any);
  };

  const handleStartEditProject = (proj: Project) => {
    if (currentUserRole === "member" || currentUserRole === "user") {
      onShowNotification(
        "Thành viên thường không có quyền chỉnh sửa dự án quy hoạch.",
        "error",
      );
      return;
    }
    setTitle(proj.title);
    setPriceText(proj.priceText || "");
    setPriceVal(String(proj.priceVal || ""));
    setDistrict(proj.location || "");
    setImageUrl(proj.imageUrl || "");
    setImageUrls(proj.imageUrls || [proj.imageUrl || ""]);
    setAvatarUrl(proj.avatarUrl || "");
    setHtmlContent(proj.description || "");
    setProjLocationShortDesc(proj.locationShortDesc || "");
    setProjSubdivisionTab(proj.subdivisionTab || "");
    setSubdivisionsCards(proj.subdivisionsCards || []);
    setProjLocationTab(proj.locationTab || "");
    setProjAmenityTab(proj.amenityTab || "");
    setAmenityImages(proj.amenityImages || []);
    setProjFloorPlanTab(proj.floorPlanTab || "");
    setFloorPlanImages(proj.floorPlanImages || []);
    setFloorPlanTabsList(proj.floorPlanTabs || []);
    if (proj.floorPlanTabs?.length)
      setActiveFloorPlanTabId(proj.floorPlanTabs[0].id);
    else setActiveFloorPlanTabId(null);
    setProjPriceTab(proj.priceTab || "");
    setProjQaTab(proj.qaTab || "");
    setQaList(proj.qaList || []);
    setCustomSections(proj.customSections || []);
    setProjDeveloper(proj.developer || "");
    setProjOwnership(proj.ownership || "");
    setProjScale(proj.scale || "");
    setProjUnits(proj.units?.toString() || "");
    setProjProductType(proj.productType || "");
    setProjPopulation(proj.population || "");
    setProjBuildingDensity(proj.buildingDensity || "");
    setProjHandoverTime(proj.handoverTime || "");
    setProjSubdivisions(proj.subdivisions || "");
    setProjSupportedBanks(proj.supportedBanks || "");
    setProjAdditionalInfo(proj.additionalInfo || "");
    setProjNewsCategoryUrl(proj.newsCategoryUrl || "");
    setProjProductCategoryUrl(proj.productCategoryUrl || "");
    setProjCommencementDate(proj.commencementDate || "");
    setMapHtml(proj.mapHtml || "");

    // Set item-level SEO tags
    setItemSeoTitle(proj.seoTitle || proj.metaTitle || "");
    setItemSeoDesc(proj.seoDesc || proj.metaDesc || "");
    setItemSeoKeywords(proj.seoKeywords || proj.metaKeywords || "");
    setItemBaseRating(String(proj.baseRating ?? 5.0));
    setItemBaseReviewCount(String(proj.baseReviewCount ?? 0));

    setIsEditing(true);
    setEditingItemId(proj.id);
    setCreateType("project");
    setActiveTab("new_wizard" as any);
  };

  const handleStartEditNews = (n: News) => {
    if (
      (currentUserRole === "member" || currentUserRole === "user") &&
      n.createdBy !== currentMemberEmail
    ) {
      onShowNotification(
        "Lỗi phân quyền: Bạn chỉ có thể chỉnh sửa bài viết do chính bạn đăng!",
        "error",
      );
      return;
    }
    setTitle(n.title);
    setCategory(n.category || "");
    setImageUrl(n.imageUrl || "");
    setImageUrls(n.imageUrls || [n.imageUrl || ""]);
    setAvatarUrl(n.avatarUrl || "");
    setHtmlContent(n.content || "");

    // Set item-level SEO tags
    setItemSeoTitle(n.seoTitle || n.metaTitle || "");
    setItemSeoDesc(n.seoDesc || n.metaDesc || "");
    setItemSeoKeywords(n.seoKeywords || n.metaKeywords || "");
    setItemBaseRating(String(n.baseRating ?? 5.0));
    setItemBaseReviewCount(String(n.baseReviewCount ?? 0));

    setIsEditing(true);
    setEditingItemId(n.id);
    setCreateType("article");
    setActiveTab("new_wizard" as any);
  };

  const handleCancelWizard = () => {
    setIsEditing(false);
    setEditingItemId("");
    setTitle("");
    setPriceText("");
    setPriceVal("");
    setImageUrl("");
    setImageUrls([]);
    setAvatarUrl("");
    setHtmlContent("");
    setProjLocationShortDesc("");
    setProjSubdivisionTab("");
    setSubdivisionsCards([]);
    setProjLocationTab("");
    setProjAmenityTab("");
    setAmenityImages([]);
    setAmenityImageUrlInput("");
    setProjFloorPlanTab("");
    setFloorPlanImages([]);
    setFloorPlanImageUrlInput("");
    setFloorPlanTabsList([]);
    setActiveFloorPlanTabId(null);
    setProjPriceTab("");
    setProjQaTab("");
    setQaList([]);
    setCustomSections([]);
    setProjDeveloper("");
    setProjOwnership("");
    setProjScale("");
    setProjUnits("");
    setProjProductType("");
    setProjPopulation("");
    setProjBuildingDensity("");
    setProjHandoverTime("");
    setProjSubdivisions("");
    setProjSupportedBanks("");
    setProjAdditionalInfo("");
    setProjNewsCategoryUrl("");
    setProjProductCategoryUrl("");
    setProjCommencementDate("");

    // clear specs
    setBedrooms("");
    setToilets("");
    setArea("");
    setDirection("");
    setRoadWidth("");
    setLegalStatus("");
    setFloors("");
    setInterior("");
    setMapHtml("");

    // clear custom item seo
    setItemSeoTitle("");
    setItemSeoDesc("");
    setItemSeoKeywords("");
    setItemBaseRating("5.0");
    setItemBaseReviewCount("0");

    setActiveTab("listings");
  };

  // Subpage tabs for projects
  const [projSubdivisionTab, setProjSubdivisionTab] = useState("");
  const [subdivisionsCards, setSubdivisionsCards] = useState<any[]>([]);
  const [projLocationShortDesc, setProjLocationShortDesc] = useState("");
  const [projLocationTab, setProjLocationTab] = useState("");
  const [projAmenityTab, setProjAmenityTab] = useState("");
  const [amenityImages, setAmenityImages] = useState<string[]>([]);
  const [amenityImageUrlInput, setAmenityImageUrlInput] = useState("");
  const [projFloorPlanTab, setProjFloorPlanTab] = useState("");
  const [floorPlanImages, setFloorPlanImages] = useState<string[]>([]);
  const [floorPlanImageUrlInput, setFloorPlanImageUrlInput] = useState("");
  const [floorPlanTabsList, setFloorPlanTabsList] = useState<FloorPlanTab[]>(
    [],
  );
  const [activeFloorPlanTabId, setActiveFloorPlanTabId] = useState<
    string | null
  >(null);
  const [projPriceTab, setProjPriceTab] = useState("");
  const [projQaTab, setProjQaTab] = useState("");
  const [qaList, setQaList] = useState<{ question: string; answer: string }[]>(
    [],
  );
  const [customSections, setCustomSections] = useState<any[]>([]);
  const [projDeveloper, setProjDeveloper] = useState("");
  const [projOwnership, setProjOwnership] = useState("");
  const [projScale, setProjScale] = useState("");
  const [projUnits, setProjUnits] = useState("");
  const [projProductType, setProjProductType] = useState("");
  const [projPopulation, setProjPopulation] = useState("");
  const [projBuildingDensity, setProjBuildingDensity] = useState("");
  const [projHandoverTime, setProjHandoverTime] = useState("");
  const [projSubdivisions, setProjSubdivisions] = useState("");
  const [projSupportedBanks, setProjSupportedBanks] = useState("");
  const [projAdditionalInfo, setProjAdditionalInfo] = useState("");
  const [projNewsCategoryUrl, setProjNewsCategoryUrl] = useState("");
  const [projProductCategoryUrl, setProjProductCategoryUrl] = useState("");
  const [projCommencementDate, setProjCommencementDate] = useState("");

  // SEO form state edits
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  // Item-specific SEO/Metadata overrides
  const [itemSeoTitle, setItemSeoTitle] = useState("");
  const [itemSeoDesc, setItemSeoDesc] = useState("");
  const [itemSeoKeywords, setItemSeoKeywords] = useState("");
  const [itemBaseRating, setItemBaseRating] = useState("5.0");
  const [itemBaseReviewCount, setItemBaseReviewCount] = useState("0");

  // Google & Meta Integrated Analytics & Ads States
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [googleTagId, setGoogleTagId] = useState("");
  const [googleAdsId, setGoogleAdsId] = useState("");
  const [googleAdSenseCode, setGoogleAdSenseCode] = useState("");
  const [facebookPixelId, setFacebookPixelId] = useState("");
  const [tiktokPixelId, setTiktokPixelId] = useState("");
  const [cookieConsentEnabled, setCookieConsentEnabled] = useState(false);

  // General Contact Settings
  const [contactHotline, setContactHotline] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactWorkingHours, setContactWorkingHours] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialZalo, setSocialZalo] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialTiktok, setSocialTiktok] = useState("");


  const [newsCategoriesExt, setNewsCategoriesExt] = useState<any[]>([]);
  const [productCategoriesExt, setProductCategoriesExt] = useState<any[]>([]);

  // Image library/gallery selector states
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryTargetField, setLibraryTargetField] = useState<string | null>(
    null,
  );
  const [selectedLibraryImages, setSelectedLibraryImages] = useState<string[]>([]);
  const [uploadedLibraryImages, setUploadedLibraryImages] = useState<string[]>(
    [],
  );
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>([]);

  // Mock Chart Data for Tracking Services
  const ga4ChartData = [
    { name: "Mon", views: 800 },
    { name: "Tue", views: 1200 },
    { name: "Wed", views: 900 },
    { name: "Thu", views: 1500 },
    { name: "Fri", views: 1800 },
    { name: "Sat", views: 2400 },
    { name: "Sun", views: 2100 },
  ];
  const adsChartData = [
    { name: "Mon", conversions: 12 },
    { name: "Tue", conversions: 18 },
    { name: "Wed", conversions: 15 },
    { name: "Thu", conversions: 22 },
    { name: "Fri", conversions: 24 },
    { name: "Sat", conversions: 35 },
    { name: "Sun", conversions: 28 },
  ];
  const adsenseChartData = [
    { name: "Mon", revenue: 20 },
    { name: "Tue", revenue: 35 },
    { name: "Wed", revenue: 25 },
    { name: "Thu", revenue: 45 },
    { name: "Fri", revenue: 50 },
    { name: "Sat", revenue: 80 },
    { name: "Sun", revenue: 65 },
  ];
  const fbPixelChartData = [
    { name: "Mon", events: 120 },
    { name: "Tue", events: 190 },
    { name: "Wed", events: 150 },
    { name: "Thu", events: 210 },
    { name: "Fri", events: 280 },
    { name: "Sat", events: 350 },
    { name: "Sun", events: 320 },
  ];
  const tkPixelChartData = [
    { name: "Mon", events: 80 },
    { name: "Tue", events: 140 },
    { name: "Wed", events: 110 },
    { name: "Thu", events: 180 },
    { name: "Fri", events: 250 },
    { name: "Sat", events: 310 },
    { name: "Sun", events: 300 },
  ];

  // Editor special interactions:
  const [editorCursorMatch, setEditorCursorMatch] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);
  const [isInternalLinkModalOpen, setIsInternalLinkModalOpen] = useState(false);
  const [internalLinkSearch, setInternalLinkSearch] = useState("");

  // Premium high-res landscape presets
  const assetPresets: { label: string; url: string }[] = [];

  const libraryImages = React.useMemo(() => {
    const urls = new Set<string>();

    // Add dynamically uploaded library images first (so they appear at the top)
    uploadedLibraryImages.forEach((u) => urls.add(u));

    // Add default presets
    assetPresets.forEach((p) => urls.add(p.url));

    // Reverse products, projects, news so newest are processed first (if array is ordered oldest to newest, though typically reversing helps get latest first if order is chronologically appending)
    [...products].reverse().forEach((p) => {
      if (p.imageUrl) urls.add(p.imageUrl);
      if (p.imageUrls) p.imageUrls.forEach((u) => urls.add(u));
    });

    [...projects].reverse().forEach((p) => {
      if (p.imageUrl) urls.add(p.imageUrl);
      if (p.imageUrls) p.imageUrls.forEach((u) => urls.add(u));
    });

    [...news].reverse().forEach((n) => {
      if (n.imageUrl) urls.add(n.imageUrl);
      if (n.imageUrls) n.imageUrls.forEach((u) => urls.add(u));
    });

    // Filter empty strings and keep only valid image sources
    return Array.from(urls).filter(
      (u) => u && (u.startsWith("http") || u.startsWith("data:image")),
    );
  }, [products, projects, news, uploadedLibraryImages]);

  const openGithubConfigModal = () => {
    setConfigOwner(
      githubFirestoreConfig?.owner?.trim() || GITHUB_DEFAULTS.owner,
    );
    setConfigRepo(githubFirestoreConfig?.repo?.trim() || GITHUB_DEFAULTS.repo);
    setConfigBranch(
      githubFirestoreConfig?.branch?.trim() || GITHUB_DEFAULTS.branch,
    );
    setConfigToken("");
    setShowGithubConfigModal(true);
  };

  const checkGithubConnection = async (
    configOverride?: GithubFirestoreConfig | null,
  ) => {
    try {
      setCheckingGithub(true);
      const activeConfig =
        configOverride !== undefined ? configOverride : githubFirestoreConfig;

      try {
        const res = await fetch("/api/github-status");
        if (res.ok) {
          const data = await res.json();
          setGithubStatus(data);
          return;
        }
      } catch {
        // Firebase Hosting không có server – kiểm tra trực tiếp qua GitHub API
      }

      const settings = resolveGithubUploadSettings(activeConfig);
      const status = await testGithubConnection(settings);
      setGithubStatus(status);
    } catch (err: any) {
      setGithubStatus({
        configured: true,
        status: "LỖI HỆ THỐNG",
        message: err.message || String(err),
      });
    } finally {
      setCheckingGithub(false);
    }
  };

  const handleSaveGithubConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configToken.trim() || !configOwner.trim() || !configRepo.trim()) {
      onShowNotification(
        "Vui lòng nhập đầy đủ Token, Chủ sở hữu và Tên Kho lưu trữ!",
        "error",
      );
      return;
    }

    try {
      setSavingConfig(true);

      const tokenEncoded = `base64:${btoa(configToken.trim())}`;
      const firestorePayload: GithubFirestoreConfig = {
        tokenEncoded,
        owner: configOwner.trim(),
        repo: configRepo.trim(),
        branch: configBranch.trim() || GITHUB_DEFAULTS.branch,
      };

      await setDoc(doc(db, "settings", "github"), firestorePayload, {
        merge: true,
      });
      setGithubFirestoreConfig(firestorePayload);

      try {
        const res = await authFetch("/api/github-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: configToken,
            owner: configOwner,
            repo: configRepo,
            branch: configBranch,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          onShowNotification(
            data.message ||
              "Lưu cấu hình GitHub thành công (Firestore + máy chủ cục bộ)!",
            "success",
          );
        } else {
          onShowNotification(
            "Đã lưu cấu hình GitHub vào Firestore. Upload ảnh trên web đã sẵn sàng!",
            "success",
          );
        }
      } catch {
        onShowNotification(
          "Đã lưu cấu hình GitHub vào Firestore. Upload ảnh trên web đã sẵn sàng!",
          "success",
        );
      }

      setShowGithubConfigModal(false);
      setConfigToken("");
      await checkGithubConnection(firestorePayload);
    } catch (err: any) {
      console.error(err);
      onShowNotification(`Lỗi cập nhật: ${err.message || err}`, "error");
    } finally {
      setSavingConfig(false);
    }
  };

  // Load GitHub config from Firestore and check connection on login
  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;

    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "github"));
        const config = snap.exists()
          ? (snap.data() as GithubFirestoreConfig)
          : null;
        if (!cancelled) {
          setGithubFirestoreConfig(config);
          const settings = resolveGithubUploadSettings(config);
          const status = await testGithubConnection(settings);
          if (!cancelled) setGithubStatus(status);
        }
      } catch (err: any) {
        if (!cancelled) {
          setGithubStatus({
            configured: false,
            status: "LỖI HỆ THỐNG",
            message: err.message || String(err),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  // Add IPs management logic
  useEffect(() => {
    if (activeTab === ("blocked_ips" as any)) {
      fetchBlockedIps();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === ("firebase_admin" as any)) {
      fetch("/api/firebase-admin-status")
        .then(r => r.json())
        .then(d => setFirebaseAdminStatus(d.configured))
        .catch(() => setFirebaseAdminStatus(false));
    }
  }, [activeTab]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const fetchBlockedIps = async () => {
    try {
      const resp = await authFetch("/api/blocked-ips");
      const data = await resp.json();
      if (data.success) setBlockedIps(data.ips || []);
    } catch (e) {
      console.error(e);
    }
  };

  const saveBlockedIps = async (ips: string[]) => {
    try {
      setLoading(true);
      const resp = await authFetch("/api/blocked-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ips }),
      });
      const data = await resp.json();
      if (data.success) {
        setBlockedIps(ips);
        onShowNotification("Đã lưu danh sách chặn IP", "success");
      } else {
        onShowNotification("Lỗi khi lưu IP", "error");
      }
    } catch (e) {
      console.error(e);
      onShowNotification("Lỗi khi lưu IP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlockedIp = () => {
    if (!newBlockedIp) return;
    const ip = newBlockedIp.trim();
    if (blockedIps.includes(ip)) {
      setNewBlockedIp("");
      return;
    }
    saveBlockedIps([...blockedIps, ip]);
    setNewBlockedIp("");
  };

  const handleRemoveBlockedIp = (ip: string) => {
    saveBlockedIps(blockedIps.filter((i) => i !== ip));
  };

  // Prefill configuration inputs with current status values
  useEffect(() => {
    if (githubStatus) {
      if (githubStatus.owner) setConfigOwner(githubStatus.owner);
      if (githubStatus.repo) setConfigRepo(githubStatus.repo);
      if (githubStatus.branch) setConfigBranch(githubStatus.branch);
    }
  }, [githubStatus]);

  // Load static SEO from memory on start
  useEffect(() => {
    setSeoTitle(seoConfig.metaTitle);
    setSeoDesc(seoConfig.metaDesc);
    setSeoKeywords(seoConfig.metaKeywords);
  }, []);

  // System background data synchronizations using snapshot channels
  useEffect(() => {
    if (!isLoggedIn) return;

    setLoading(true);

    const unsubProducts = onSnapshot(
      collectionRealtime(dbRealtime, "products"),
      (snap) => {
        const items: Product[] = [];
        snap.forEach((d) => {
          items.push({ id: d.id, ...d.data() } as Product);
        });
        items.sort(
          (a, b) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime(),
        );
        setProducts(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "products");
      },
    );

    const unsubProjects = onSnapshot(
      collectionRealtime(dbRealtime, "projects"),
      (snap) => {
        const items: Project[] = [];
        snap.forEach((d) => {
          items.push({ id: d.id, ...d.data() } as Project);
        });
        items.sort(
          (a, b) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime(),
        );
        setProjects(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "projects");
      },
    );

    const unsubNews = onSnapshot(
      collectionRealtime(dbRealtime, "news"),
      (snap) => {
        const items: News[] = [];
        snap.forEach((d) => {
          items.push({ id: d.id, ...d.data() } as News);
        });
        items.sort(
          (a, b) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime(),
        );
        setNews(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "news");
      },
    );

    const unsubConsultations = onSnapshot(
      collectionRealtime(dbRealtime, "consultations"),
      (snap) => {
        const items: any[] = [];
        snap.forEach((d) => {
          items.push({ id: d.id, ...d.data() });
        });
        items.sort(
          (a, b) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime(),
        );
        setConsultations(items);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "consultations");
      },
    );

    const unsubSettings = onSnapshot(
      docRealtime(dbRealtime, "settings", "general"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.metaTitle !== undefined) setSeoTitle(data.metaTitle || "");
          if (data.metaDesc !== undefined) setSeoDesc(data.metaDesc || "");
          if (data.metaKeywords !== undefined)
            setSeoKeywords(data.metaKeywords || "");
          if (data.googleAnalyticsId !== undefined)
            setGoogleAnalyticsId(data.googleAnalyticsId || "");
          if (data.googleTagId !== undefined)
            setGoogleTagId(data.googleTagId || "");
          if (data.googleAdsId !== undefined)
            setGoogleAdsId(data.googleAdsId || "");
          if (data.googleAdSenseCode !== undefined)
            setGoogleAdSenseCode(data.googleAdSenseCode || "");
          if (data.facebookPixelId !== undefined)
            setFacebookPixelId(data.facebookPixelId || "");
          if (data.tiktokPixelId !== undefined)
            setTiktokPixelId(data.tiktokPixelId || "");
          if (data.cookieConsentEnabled !== undefined)
            setCookieConsentEnabled(data.cookieConsentEnabled || false);

          if (data.contactHotline !== undefined) setContactHotline(data.contactHotline || "");
          if (data.contactEmail !== undefined) setContactEmail(data.contactEmail || "");
          if (data.contactAddress !== undefined) setContactAddress(data.contactAddress || "");
          if (data.contactWorkingHours !== undefined) setContactWorkingHours(data.contactWorkingHours || "");
          if (data.socialFacebook !== undefined) setSocialFacebook(data.socialFacebook || "");
          if (data.socialZalo !== undefined) setSocialZalo(data.socialZalo || "");
          if (data.socialYoutube !== undefined) setSocialYoutube(data.socialYoutube || "");
          if (data.socialTiktok !== undefined) setSocialTiktok(data.socialTiktok || "");

          if (data.newsCategoriesExt !== undefined) {
            setNewsCategoriesExt(data.newsCategoriesExt || []);
            if (data.newsCategoriesExt.length > 0) {
              setNewsCategories(data.newsCategoriesExt.map((c: any) => c.name));
            }
          }
          if (data.productCategoriesExt !== undefined) {
            setProductCategoriesExt(data.productCategoriesExt || []);
            if (data.productCategoriesExt.length > 0) {
              setCategories(data.productCategoriesExt.map((c: any) => c.name));
            }
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "settings/general");
      },
    );

    const unsubUsers = onSnapshot(
      collectionRealtime(dbRealtime, "users"),
      (snap) => {
        const items: any[] = [];
        snap.forEach((d) => {
          items.push({ id: d.id, ...d.data() });
        });
        items.sort(
          (a, b) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime(),
        );
        setUsers(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "users");
      },
    );

    return () => {
      unsubProducts();
      unsubProjects();
      unsubNews();
      unsubConsultations();
      unsubSettings();
      unsubUsers();
    };
  }, [isLoggedIn]);

  // Core Login dispatch matching role requirements
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleSignOut = async () => {
    try {
      await logout();
      onShowNotification("Bạn đã đăng xuất khỏi hệ thống.", "success");
      onNavigate({ screen: "home" });
    } catch {
      onShowNotification("Lỗi đăng xuất", "error");
    }
  };

  // Approval status workflow (Admin or Editor changes listing status)
  const handleToggleApproval = async (
    id: string,
    currentStatus: string,
    action: "approved" | "rejected",
    path: "products" | "projects" | "news" = "products",
  ) => {
    try {
      await updateDoc(doc(db, path, id), {
        approvalStatus: action,
      });
      onShowNotification(
        `Đã chuyển trạng thái bài viết thành công sang [${action.toUpperCase()}]`,
        "success",
      );
    } catch (err) {
      console.error(err);
      onShowNotification(
        "Lỗi khi lưu trạng thái phê duyệt lên Cloud.",
        "error",
      );
    }
  };

  // Deletion logic (Standard members can delete their own items, Editors blocked, Admins full delete)
    const purgeImageUrlsFromDB = async (urlsToDelete: string[]) => {
    try {
      const productsToUpdate = products.filter(p => urlsToDelete.includes(p.imageUrl || "") || p.imageUrls?.some(u => urlsToDelete.includes(u)));
      for (const p of productsToUpdate) {
        const pRef = doc(db, "products", p.id);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
            const data = pSnap.data();
            const updateData: any = {};
            if (urlsToDelete.includes(data.imageUrl)) updateData.imageUrl = "";
            if (data.imageUrls) {
               updateData.imageUrls = data.imageUrls.filter((g: string) => !urlsToDelete.includes(g));
            }
            await updateDoc(pRef, updateData);
        }
      }
      
      const projectsToUpdate = projects.filter(p => urlsToDelete.includes(p.imageUrl || "") || p.imageUrls?.some(u => urlsToDelete.includes(u)));
      for (const p of projectsToUpdate) {
        const pRef = doc(db, "projects", p.id);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
            const data = pSnap.data();
            const updateData: any = {};
            if (urlsToDelete.includes(data.imageUrl)) updateData.imageUrl = "";
            if (data.imageUrls) {
               updateData.imageUrls = data.imageUrls.filter((g: string) => !urlsToDelete.includes(g));
            }
            await updateDoc(pRef, updateData);
        }
      }

      const newsToUpdate = news.filter(n => urlsToDelete.includes(n.thumbnail || ""));
      for (const n of newsToUpdate) {
        await updateDoc(doc(db, "articles", n.id), { thumbnail: "" });
      }
    } catch (e) {
      console.error("Lỗi khi xóa ảnh khỏi database:", e);
    }
  };

    const deleteImageFromGithub = async (imgUrl: string) => {
    const githubSettings = resolveGithubUploadSettings(githubFirestoreConfig);
    if ("error" in githubSettings) {
      throw new Error(githubSettings.error);
    }
    const { owner, repo, branch, token: realToken } = githubSettings;

    let filePath = "";
    try {
      const urlObj = new URL(imgUrl);
      if (urlObj.hostname === 'raw.githubusercontent.com') {
        const parts = urlObj.pathname.split('/');
        filePath = parts.slice(4).join('/');
      } else if (urlObj.hostname === 'cdn.jsdelivr.net') {
        const parts = urlObj.pathname.split('/');
        filePath = parts.slice(4).join('/');
      } else {
        filePath = `uploads/${imgUrl.split('/').pop()}`;
      }
    } catch(e) {
      filePath = `uploads/${imgUrl.split('/').pop()}`;
    }

    if (!filePath) {
       throw new Error("Không thể xác định đường dẫn file.");
    }

    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    
    let retries = 3;
    while (retries > 0) {
      // 1. Get SHA
      const getRes = await fetch(githubApiUrl, {
        method: "GET",
        headers: {
          Authorization: buildGithubAuthHeader(realToken),
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        }
      });

      if (!getRes.ok) {
         if (getRes.status === 404) return true; // Already deleted or not found on GitHub
         throw new Error("Lỗi khi lấy thông tin file từ GitHub");
      }

      const fileData = await getRes.json();
      const sha = fileData.sha;

      // 2. Delete
      const delRes = await fetch(githubApiUrl, {
        method: "DELETE",
        headers: {
          Authorization: buildGithubAuthHeader(realToken),
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Xóa ảnh ${filePath} từ Admin`,
          sha: sha,
          branch: branch,
        })
      });

      if (delRes.ok) {
        return true;
      }
      
      // If conflict (409) or rate limited (403), retry
      if (delRes.status === 409 || delRes.status === 403) {
        retries--;
        await new Promise(r => setTimeout(r, 1500)); // wait 1.5 seconds and retry
        continue;
      }

      throw new Error("Lỗi khi gửi yêu cầu xóa lên GitHub");
    }
    return false;
  };

  const handleDeleteSingleImage = async (imgUrl: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi hệ thống?")) return;
    try {
      setLoading(true);
      await deleteImageFromGithub(imgUrl);
      
      await purgeImageUrlsFromDB([imgUrl]);
      setUploadedLibraryImages(prev => prev.filter(u => u !== imgUrl));
      
      setSelectedGalleryImages(prev => prev.filter(u => u !== imgUrl));
      onShowNotification("Đã xóa ảnh thành công!", "success");
    } catch (error: any) {
      console.error(error);
      onShowNotification(error.message || "Lỗi khi xóa ảnh", "error");
    } finally {
      setLoading(false);
    }
  };

    const handleBulkDeleteImages = async () => {
    if (selectedGalleryImages.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedGalleryImages.length} ảnh đã chọn khỏi hệ thống?`)) return;
    try {
      setLoading(true);
      let successCount = 0;
      let successfullyDeletedUrls: string[] = [];
      for (const imgUrl of selectedGalleryImages) {
        try {
          await deleteImageFromGithub(imgUrl);
          // Wait briefly to prevent GitHub API rate limit and tree lock conflicts
          await new Promise(r => setTimeout(r, 800));
        } catch(e) {
          console.error("Lỗi xóa ảnh GitHub (vẫn tiến hành gỡ khỏi dữ liệu):", imgUrl, e);
        }
        // Always push to successfullyDeletedUrls so it gets purged from the DB/UI
        // even if GitHub API throws an error (e.g. 409 conflict, rate limit).
        successCount++;
        successfullyDeletedUrls.push(imgUrl);
      }
      
      if (successfullyDeletedUrls.length > 0) {
        // 1. Purge from Firebase/Supabase Database
        await purgeImageUrlsFromDB(successfullyDeletedUrls);
        
        // 2. Instantly update UI states (fallback in case Supabase Realtime is disabled)
        setUploadedLibraryImages(prev => prev.filter(u => !successfullyDeletedUrls.includes(u)));
        
        setProducts(prev => prev.map(p => {
          let modified = false;
          let newP = { ...p };
          if (successfullyDeletedUrls.includes(newP.imageUrl || "")) { newP.imageUrl = ""; modified = true; }
          if (newP.imageUrls) {
             const newArr = newP.imageUrls.filter((u: string) => !successfullyDeletedUrls.includes(u));
             if (newArr.length !== newP.imageUrls.length) { newP.imageUrls = newArr; modified = true; }
          }
          return modified ? newP : p;
        }));

        setProjects(prev => prev.map(p => {
          let modified = false;
          let newP = { ...p };
          if (successfullyDeletedUrls.includes(newP.imageUrl || "")) { newP.imageUrl = ""; modified = true; }
          if (newP.imageUrls) {
             const newArr = newP.imageUrls.filter((u: string) => !successfullyDeletedUrls.includes(u));
             if (newArr.length !== newP.imageUrls.length) { newP.imageUrls = newArr; modified = true; }
          }
          return modified ? newP : p;
        }));

        setNews(prev => prev.map(n => {
          let modified = false;
          let newN = { ...n };
          if (successfullyDeletedUrls.includes(newN.imageUrl || "")) { newN.imageUrl = ""; modified = true; }
          if (successfullyDeletedUrls.includes(newN.thumbnail || "")) { newN.thumbnail = ""; modified = true; }
          if (newN.imageUrls) {
             const newArr = newN.imageUrls.filter((u: string) => !successfullyDeletedUrls.includes(u));
             if (newArr.length !== newN.imageUrls.length) { newN.imageUrls = newArr; modified = true; }
          }
          return modified ? newN : n;
        }));
      }
      
      setSelectedGalleryImages([]);
      onShowNotification(`Đã xóa ${successCount} ảnh thành công!`, "success");
    } catch (error: any) {
      console.error(error);
      onShowNotification("Có lỗi xảy ra khi xóa hàng loạt", "error");
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteContent = async (
    id: string,
    path: "products" | "projects" | "news",
  ) => {
    if (currentUserRole === "member" || currentUserRole === "user") {
      let itemOwner = "";
      if (path === "products") {
        const found = products.find((p) => p.id === id);
        if (found) itemOwner = found.createdBy || "";
      } else if (path === "news") {
        const found = news.find((n) => n.id === id);
        if (found) itemOwner = found.createdBy || "";
      } else if (path === "projects") {
        const found = projects.find((p) => p.id === id);
        if (found) itemOwner = found.createdBy || "";
      }

      if (itemOwner !== currentMemberEmail) {
        onShowNotification(
          "Lỗi phân quyền: Bạn chỉ có quyền xóa sản phẩm/bài viết do chính bạn đăng!",
          "error",
        );
        return;
      }
    } else if (currentUserRole === "editor") {
      onShowNotification(
        "Lỗi phân quyền: Biên tập viên không có quyền xóa dữ liệu.",
        "error",
      );
      return;
    }

    try {
      await deleteDoc(doc(db, path, id));
      onShowNotification(
        "Đã gãi phóng và xóa tài sản khỏi cơ sở dữ liệu thành công!",
        "success",
      );
    } catch (err) {
      console.error(err);
      onShowNotification("Lỗi khi xóa tài sản trên cloud.", "error");
    }
  };

  // Composer visual assistant to append rich layout HTML code in text fields
  const appendRichHtml = (tagType: "h1" | "h2" | "bold" | "p" | "list") => {
    let piece = "";
    if (tagType === "h1") piece = "<h1>Tiêu đề lớn</h1>\n";
    else if (tagType === "h2") piece = "<h2>Tiêu đề phụ</h2>\n";
    else if (tagType === "bold") piece = "<strong>Chữ in đậm nổi bật</strong> ";
    else if (tagType === "p")
      piece = "<p>Đoạn văn phân tích chi tiết của bạn...</p>\n";
    else if (tagType === "list")
      piece =
        "<ul>\n  <li>Tiện ích cao cấp 1</li>\n  <li>Tiện ích cao cấp 2</li>\n</ul>\n";

    setHtmlContent((prev) => prev + piece);
    onShowNotification(`Đã chèn ký tự HTML assisted thành công!`, "success");
  };

  // Main Creating Content wizard
  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowNotification(
        "Vui lòng điền đủ tiêu đề / tên gọi bắt buộc.",
        "error",
      );
      return;
    }

    const priceNumerical = Number(priceVal.trim());
    const finalImage = imageUrl.trim() || assetPresets[0].url;

    let finalCategory = category;
    if (!finalCategory) {
      if (createType === "article") {
        const fallbacks = Array.from(
          new Set([
            ...newsCategories,
            ...(news.length > 0
              ? news.map((n: News) => n.category)
              : [
                "Tin thị trường",
                "Lưu ý khi mua nhà",
                "Phong thủy",
                "Thông tin dự án",
                "Bất động sản hạng sang",
              ]),
          ]),
        ).filter(Boolean);
        finalCategory = fallbacks[0] || "Khác";
      } else if (createType === "product") {
        const fallbacks = Array.from(
          new Set([
            ...categories,
            ...(products.length > 0
              ? products.map((p: Product) => p.category)
              : [
                "Biệt thự sinh thái",
                "Căn hộ cao cấp",
                "Nhà phố liền kề",
                "Đất nền quy hoạch",
                "Shophouse kinh doanh",
              ]),
          ]),
        ).filter(Boolean);
        finalCategory = fallbacks[0] || "Khác";
      }
    }

    try {
      setLoading(true);
      if (isEditing) {
        if (createType === "product") {
          if (currentUserRole === "member" || currentUserRole === "user") {
            const found = products.find((p) => p.id === editingItemId);
            if (found && found.createdBy !== currentMemberEmail) {
              onShowNotification(
                "Lỗi phân quyền: Bạn chỉ có thể sửa sản phẩm do chính bạn đăng!",
                "error",
              );
              return;
            }
          }
          const updatePayload = {
            title: title.trim(),
            priceText: priceText.trim() || "Giá thỏa thuận",
            priceVal: isNaN(priceNumerical) ? 0 : priceNumerical,
            type: prodType,
            district: district.trim(),
            street: street.trim(),
            phone: contactPhone.trim(),
            imageUrl: finalImage,
            imageUrls: imageUrls,
            avatarUrl: avatarUrl,
            description: htmlContent.trim(),
            category: finalCategory,
            bedrooms: Number(bedrooms) || 0,
            toilets: Number(toilets) || 0,
            area: Number(area) || 0,
            direction: direction.trim(),
            roadWidth: roadWidth.trim(),
            legalStatus: legalStatus.trim(),
            floors: floors.trim(),
            interior: interior.trim(),
            mapHtml: mapHtml.trim(),
            seoTitle: itemSeoTitle.trim(),
            seoDesc: itemSeoDesc.trim(),
            seoKeywords: itemSeoKeywords.trim(),
            baseRating: Number(itemBaseRating) || 5.0,
            baseReviewCount: Number(itemBaseReviewCount) || 0,
            metaTitle: itemSeoTitle.trim(),
            metaDesc: itemSeoDesc.trim(),
            metaKeywords: itemSeoKeywords.trim(),
          };
          await updateDoc(doc(db, "products", editingItemId), updatePayload);
          onShowNotification(
            "Cập nhật thông tin bất động sản thành công!",
            "success",
          );
        } else if (createType === "project") {
          if (currentUserRole === "member" || currentUserRole === "user") {
            onShowNotification(
              "Thành viên thường không có quyền chỉnh sửa quy hoạch dự án.",
              "error",
            );
            return;
          }
          const updatePayload = {
            title: title.trim(),
            priceText: priceText.trim() || "Giá dự kiến",
            location: district.trim(),
            imageUrl: finalImage,
            imageUrls: imageUrls,
            avatarUrl: avatarUrl,
            description: htmlContent.trim(),
            locationShortDesc: projLocationShortDesc.trim(),
            subdivisionTab: projSubdivisionTab.trim(),
            subdivisionsCards: subdivisionsCards,
            locationTab:
              projLocationTab.trim() ||
              `<p>Vị trí địa chính đắc địa tại ${district}</p>`,
            amenityTab:
              projAmenityTab.trim() ||
              "<ul><li>Hồ bơi sinh thái lọc muối</li><li>Hạ tầng thông minh xanh</li></ul>",
            amenityImages: amenityImages,
            floorPlanTab: projFloorPlanTab.trim(),
            floorPlanImages: floorPlanImages,
            floorPlanTabs: floorPlanTabsList,
            priceTab: projPriceTab.trim(),
            qaTab: projQaTab.trim(),
            qaList: qaList,
            customSections: customSections,
            developer: projDeveloper.trim(),
            ownership: projOwnership.trim(),
            scale: projScale.trim(),
            units: projUnits.trim() || undefined,
            productType: projProductType.trim(),
            population: projPopulation.trim(),
            buildingDensity: projBuildingDensity.trim(),
            handoverTime: projHandoverTime.trim(),
            subdivisions: projSubdivisions.trim(),
            supportedBanks: projSupportedBanks.trim(),
            additionalInfo: projAdditionalInfo,
            newsCategoryUrl: projNewsCategoryUrl.trim(),
            productCategoryUrl: projProductCategoryUrl.trim(),
            commencementDate: projCommencementDate.trim(),
            mapHtml: mapHtml.trim(),
            seoTitle: itemSeoTitle.trim(),
            seoDesc: itemSeoDesc.trim(),
            seoKeywords: itemSeoKeywords.trim(),
            baseRating: Number(itemBaseRating) || 5.0,
            baseReviewCount: Number(itemBaseReviewCount) || 0,
            metaTitle: itemSeoTitle.trim(),
            metaDesc: itemSeoDesc.trim(),
            metaKeywords: itemSeoKeywords.trim(),
          };
          await updateDoc(doc(db, "projects", editingItemId), updatePayload);
          onShowNotification("Cập nhật quy hoạch dự án thành công!", "success");
        } else if (createType === "article") {
          if (currentUserRole === "member" || currentUserRole === "user") {
            const found = news.find((n) => n.id === editingItemId);
            if (found && found.createdBy !== currentMemberEmail) {
              onShowNotification(
                "Lỗi phân quyền: Bạn chỉ có thể sửa bài viết do chính bạn đăng!",
                "error",
              );
              return;
            }
          }
          const updatePayload = {
            title: title.trim(),
            category: finalCategory,
            content: htmlContent.trim(),
            imageUrl: finalImage,
            imageUrls: imageUrls,
            avatarUrl: avatarUrl,
            seoTitle: itemSeoTitle.trim(),
            seoDesc: itemSeoDesc.trim(),
            seoKeywords: itemSeoKeywords.trim(),
            baseRating: Number(itemBaseRating) || 5.0,
            baseReviewCount: Number(itemBaseReviewCount) || 0,
            metaTitle: itemSeoTitle.trim(),
            metaDesc: itemSeoDesc.trim(),
            metaKeywords: itemSeoKeywords.trim(),
          };
          await updateDoc(doc(db, "news", editingItemId), updatePayload);
          onShowNotification(
            "Cập nhật chuyên mục bài viết thành công!",
            "success",
          );
        }
      } else {
        if (createType === "product") {
          const prodPayload = {
            title: title.trim(),
            priceText: priceText.trim() || "Giá thỏa thuận",
            priceVal: isNaN(priceNumerical) ? 0 : priceNumerical,
            type: prodType,
            district: district.trim(),
            street: street.trim(),
            phone: contactPhone.trim(),
            imageUrl: finalImage,
            imageUrls: imageUrls,
            avatarUrl: avatarUrl,
            description: htmlContent.trim(),
            category: finalCategory,
            bedrooms: Number(bedrooms) || 3,
            toilets: Number(toilets) || 2,
            area: Number(area) || 120,
            direction: direction.trim(),
            roadWidth: roadWidth.trim(),
            legalStatus: legalStatus.trim(),
            floors: floors.trim(),
            interior: interior.trim(),
            mapHtml: mapHtml.trim(),
            viewsCount: Math.floor(Math.random() * (200 - 150 + 1)) + 150,
            createdAt: new Date().toISOString(),
            createdBy: currentMemberEmail,
            approvalStatus:
              currentUserRole === "member" || currentUserRole === "user"
                ? "pending"
                : "approved",
            seoTitle: itemSeoTitle.trim(),
            seoDesc: itemSeoDesc.trim(),
            seoKeywords: itemSeoKeywords.trim(),
            baseRating: Number(itemBaseRating) || 5.0,
            baseReviewCount: Number(itemBaseReviewCount) || 0,
            metaTitle: itemSeoTitle.trim(),
            metaDesc: itemSeoDesc.trim(),
            metaKeywords: itemSeoKeywords.trim(),
          };

          await addDoc(collection(db, "products"), prodPayload);
          onShowNotification(
            currentUserRole === "member" || currentUserRole === "user"
              ? "Đăng ký bán/thuê thành công! Tin của bạn đang chờ Admin kiểm duyệt."
              : "Đăng sản phẩm kinh doanh thành công và sẳn sàng hoạt động!",
            "success",
          );
        } else if (createType === "project") {
          if (currentUserRole === "member" || currentUserRole === "user") {
            onShowNotification(
              "Thành viên thường không có quyền kiến tạo Đô thị/Dự án.",
              "error",
            );
            return;
          }

          const projPayload = {
            title: title.trim(),
            priceText: priceText.trim() || "Giá dự kiến",
            location: district.trim(),
            imageUrl: finalImage,
            imageUrls: imageUrls,
            avatarUrl: avatarUrl,
            description: htmlContent.trim(),
            locationShortDesc: projLocationShortDesc.trim(),
            status: "opening",
            subdivisionTab: projSubdivisionTab.trim(),
            subdivisionsCards: subdivisionsCards,
            locationTab:
              projLocationTab.trim() ||
              `<p>Vị trí địa chính đắc địa tại ${district}</p>`,
            amenityTab:
              projAmenityTab.trim() ||
              "<ul><li>Hồ bơi sinh thái lọc muối</li><li>Hạ tầng thông minh xanh</li></ul>",
            amenityImages: amenityImages,
            floorPlanTab: projFloorPlanTab.trim(),
            floorPlanImages: floorPlanImages,
            floorPlanTabs: floorPlanTabsList,
            priceTab: projPriceTab.trim(),
            qaTab: projQaTab.trim(),
            qaList: qaList,
            customSections: customSections,
            developer: projDeveloper.trim(),
            ownership: projOwnership.trim(),
            scale: projScale.trim(),
            units: projUnits.trim() || undefined,
            productType: projProductType.trim(),
            population: projPopulation.trim(),
            buildingDensity: projBuildingDensity.trim(),
            handoverTime: projHandoverTime.trim(),
            subdivisions: projSubdivisions.trim(),
            supportedBanks: projSupportedBanks.trim(),
            additionalInfo: projAdditionalInfo,
            newsCategoryUrl: projNewsCategoryUrl.trim(),
            productCategoryUrl: projProductCategoryUrl.trim(),
            commencementDate: projCommencementDate.trim(),
            mapHtml: mapHtml.trim(),
            createdAt: new Date().toISOString(),
            createdBy: currentMemberEmail,
            approvalStatus: "approved",
            seoTitle: itemSeoTitle.trim(),
            seoDesc: itemSeoDesc.trim(),
            seoKeywords: itemSeoKeywords.trim(),
            baseRating: Number(itemBaseRating) || 5.0,
            baseReviewCount: Number(itemBaseReviewCount) || 0,
            metaTitle: itemSeoTitle.trim(),
            metaDesc: itemSeoDesc.trim(),
            metaKeywords: itemSeoKeywords.trim(),
          };

          await addDoc(collection(db, "projects"), projPayload);
          onShowNotification(
            "Đã xuất bản dự án đại đô thị thành công!",
            "success",
          );
        } else if (createType === "article") {
          const newsPayload = {
            title: title.trim(),
            category: finalCategory,
            description: title.trim(),
            content: htmlContent.trim(),
            imageUrl: finalImage,
            imageUrls: imageUrls,
            avatarUrl: avatarUrl,
            author:
              currentUserRole === "member" || currentUserRole === "user"
                ? `Cộng tác viên (${currentMemberEmail.split("@")[0]})`
                : "Thuận Nguyễn",
            viewsCount: Math.floor(Math.random() * (200 - 150 + 1)) + 150,
            createdAt: new Date().toISOString(),
            createdBy: currentMemberEmail,
            approvalStatus:
              currentUserRole === "member" || currentUserRole === "user"
                ? "pending"
                : "approved",
            seoTitle: itemSeoTitle.trim(),
            seoDesc: itemSeoDesc.trim(),
            seoKeywords: itemSeoKeywords.trim(),
            baseRating: Number(itemBaseRating) || 5.0,
            baseReviewCount: Number(itemBaseReviewCount) || 0,
            metaTitle: itemSeoTitle.trim(),
            metaDesc: itemSeoDesc.trim(),
            metaKeywords: itemSeoKeywords.trim(),
          };

          await addDoc(collection(db, "news"), newsPayload);
          onShowNotification(
            "Đăng tải chuyên mục tin bài thành công!",
            "success",
          );
        }
      }

      // Restore wizard form variables
      setTitle("");
      setPriceText("");
      setPriceVal("");
      setImageUrl("");
      setImageUrls([]);
      setAvatarUrl("");
      setHtmlContent("");
      setProjSubdivisionTab("");
      setSubdivisionsCards([]);
      setProjLocationTab("");
      setProjAmenityTab("");
      setAmenityImages([]);
      setAmenityImageUrlInput("");
      setProjFloorPlanTab("");
      setFloorPlanImages([]);
      setFloorPlanImageUrlInput("");
      setFloorPlanTabsList([]);
      setActiveFloorPlanTabId(null);
      setProjPriceTab("");
      setProjQaTab("");
      setQaList([]);
      setCustomSections([]);
      setProjDeveloper("");
      setProjOwnership("");
      setProjScale("");
      setProjUnits("");
      setProjProductType("");
      setProjPopulation("");
      setProjBuildingDensity("");
      setProjHandoverTime("");
      setProjSubdivisions("");
      setProjSupportedBanks("");
      setProjAdditionalInfo("");
      setProjNewsCategoryUrl("");
      setProjProductCategoryUrl("");
      setProjCommencementDate("");

      // clear specs
      setBedrooms("");
      setToilets("");
      setArea("");
      setDirection("");
      setRoadWidth("");
      setLegalStatus("");
      setFloors("");
      setInterior("");
      setMapHtml("");

      setIsEditing(false);
      setEditingItemId("");

      // clear custom item seo
      setItemSeoTitle("");
      setItemSeoDesc("");
      setItemSeoKeywords("");
      setItemBaseRating("5.0");
      setItemBaseReviewCount("0");

      // Navigate to corresponding tab depending on creation/updating type
      if (createType === "product") setActiveTab("listings");
      else if (createType === "project") setActiveTab("projects");
      else if (createType === "article") setActiveTab("articles");
    } catch (err) {
      console.error(err);
      onShowNotification(
        "Gặp lỗi khi ghi thông tin phục vụ lưu giữ lên hệ thống bất động sản.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Category Modal States
  const [catModal, setCatModal] = useState<{
    isOpen: boolean;
    type: "product" | "news";
    mode: "add" | "edit";
    index?: number;
    data: { name: string; seoTitle: string; seoDesc: string; parentId: string; seoKeywords?: string };
  }>({
    isOpen: false,
    type: "product",
    mode: "add",
    data: { name: "", seoTitle: "", seoDesc: "", parentId: "", seoKeywords: "" },
  });

  const handleSaveCatModal = async () => {
    const { type, mode, index, data } = catModal;
    if (!data.name.trim()) {
      onShowNotification("Tên danh mục không được để trống", "error");
      return;
    }

    try {
      setLoading(true);
      if (type === "product") {
        let newExts = Array.isArray(productCategoriesExt)
          ? [...productCategoriesExt]
          : [];
        if (newExts.length < categories.length) {
          newExts = categories.map(
            (c, i) =>
              newExts[i] || {
                id: c.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                name: c,
                seoTitle: c,
                seoDesc: "",
                seoKeywords: "",
              },
          );
        }

        if (mode === "add") {
          const catId = data.name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-");
          newExts.push({
            id: catId,
            name: data.name.trim(),
            seoTitle: data.seoTitle.trim() || data.name.trim(),
            seoDesc: data.seoDesc.trim(),
            seoKeywords: data.seoKeywords?.trim() || "",
            parentId: data.parentId?.trim() || null,
          });
        } else if (mode === "edit" && index !== undefined) {
          newExts[index] = {
            ...newExts[index],
            name: data.name.trim(),
            seoTitle: data.seoTitle.trim() || data.name.trim(),
            seoDesc: data.seoDesc.trim(),
            seoKeywords: data.seoKeywords?.trim() || "",
            parentId: data.parentId?.trim() || null,
          };
        }

        await setDoc(
          doc(db, "settings", "general"),
          { productCategoriesExt: newExts },
          { merge: true },
        );
        setProductCategoriesExt(newExts);
        setCategories(newExts.map((c) => c.name));
      } else {
        let newExts = Array.isArray(newsCategoriesExt)
          ? [...newsCategoriesExt]
          : [];
        if (newExts.length < newsCategories.length) {
          newExts = newsCategories.map(
            (c, i) =>
              newExts[i] || {
                id: c.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                name: c,
                seoTitle: c,
                seoDesc: "",
                seoKeywords: "",
              },
          );
        }

        if (mode === "add") {
          const catId = data.name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-");
          newExts.push({
            id: catId,
            name: data.name.trim(),
            parentId: data.parentId.trim() || null,
            seoTitle: data.seoTitle.trim() || data.name.trim(),
            seoDesc: data.seoDesc.trim(),
            seoKeywords: data.seoKeywords?.trim() || "",
          });
        } else if (mode === "edit" && index !== undefined) {
          newExts[index] = {
            ...newExts[index],
            name: data.name.trim(),
            parentId: data.parentId?.trim() || null,
            seoTitle: data.seoTitle.trim() || data.name.trim(),
            seoDesc: data.seoDesc.trim(),
            seoKeywords: data.seoKeywords?.trim() || "",
          };
        }

        await setDoc(
          doc(db, "settings", "general"),
          { newsCategoriesExt: newExts },
          { merge: true },
        );
        setNewsCategoriesExt(newExts);
        setNewsCategories(newExts.map((c) => c.name));
      }
      onShowNotification("Lưu danh mục thành công!", "success");
      setCatModal((prev) => ({ ...prev, isOpen: false }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
      onShowNotification("Lỗi khi lưu danh mục", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setCatModal({
      isOpen: true,
      type: "product",
      mode: "add",
      data: { name: "", seoTitle: "", seoDesc: "", parentId: "", seoKeywords: "" },
    });
  };

  const handleEditCategory = (catIndex: number) => {
    let newExts = Array.isArray(productCategoriesExt)
      ? [...productCategoriesExt]
      : [];
    if (newExts.length < categories.length) {
      newExts = categories.map(
        (c, i) =>
          newExts[i] || {
            id: c.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            name: c,
            seoTitle: c,
            seoDesc: "",
            seoKeywords: "",
          },
      );
    }
    const cat = newExts[catIndex];
    if (!cat) return;
    setCatModal({
      isOpen: true,
      type: "product",
      mode: "edit",
      index: catIndex,
      data: {
        name: cat.name,
        seoTitle: cat.seoTitle || "",
        seoDesc: cat.seoDesc || "",
        seoKeywords: cat.seoKeywords || "",
        parentId: cat.parentId || "",
      },
    });
  };

  const handleDeleteCategory = async (catIndex: number) => {
    try {
      let newExts = Array.isArray(productCategoriesExt)
        ? [...productCategoriesExt]
        : [];
      if (newExts.length < categories.length) {
        newExts = categories.map((c, i) => {
          if (newExts[i]) return newExts[i];
          const nameStr = String(c || `Danh mục ${i}`);
          return {
            id: nameStr.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            name: nameStr,
            seoTitle: nameStr,
            seoDesc: "",
            seoKeywords: "",
          };
        });
      }
      newExts = newExts.filter((_, i) => i !== catIndex);

      setLoading(true);
      await setDoc(
        doc(db, "settings", "general"),
        { productCategoriesExt: newExts },
        { merge: true },
      );
      setProductCategoriesExt(newExts);
      setCategories(newExts.map((c) => c.name));
      onShowNotification("Xóa thành công!", "success");
    } catch (e) {
      console.error("Lỗi khi xóa danh mục:", e);
      onShowNotification("Có lỗi xảy ra: " + (e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewsCategory = () => {
    setCatModal({
      isOpen: true,
      type: "news",
      mode: "add",
      data: { name: "", seoTitle: "", seoDesc: "", parentId: "", seoKeywords: "" },
    });
  };

  const handleEditNewsCategory = (catIndex: number) => {
    let newExts = Array.isArray(newsCategoriesExt)
      ? [...newsCategoriesExt]
      : [];
    if (newExts.length < newsCategories.length) {
      newExts = newsCategories.map(
        (c, i) =>
          newExts[i] || {
            id: c.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            name: c,
            seoTitle: c,
            seoDesc: "",
            seoKeywords: "",
          },
      );
    }
    const cat = newExts[catIndex];
    if (!cat) return;
    setCatModal({
      isOpen: true,
      type: "news",
      mode: "edit",
      index: catIndex,
      data: {
        name: cat.name,
        seoTitle: cat.seoTitle || "",
        seoDesc: cat.seoDesc || "",
        seoKeywords: cat.seoKeywords || "",
        parentId: cat.parentId || "",
      },
    });
  };

  const handleDeleteNewsCategory = async (catIndex: number) => {
    try {
      let newExts = Array.isArray(newsCategoriesExt)
        ? [...newsCategoriesExt]
        : [];
      if (newExts.length < newsCategories.length) {
        newExts = newsCategories.map((c, i) => {
          if (newExts[i]) return newExts[i];
          const nameStr = String(c || `Danh mục ${i}`);
          return {
            id: nameStr.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            name: nameStr,
            seoTitle: nameStr,
            seoDesc: "",
            seoKeywords: "",
          };
        });
      }
      newExts = newExts.filter((_, i) => i !== catIndex);

      setLoading(true);
      await setDoc(
        doc(db, "settings", "general"),
        { newsCategoriesExt: newExts },
        { merge: true },
      );
      setNewsCategoriesExt(newExts);
      setNewsCategories(newExts.map((c) => c.name));
      onShowNotification("Xóa thành công!", "success");
    } catch (e) {
      console.error("Lỗi khi xóa danh mục tin tức:", e);
      onShowNotification("Có lỗi xảy ra: " + (e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await setDoc(
        doc(db, "settings", "general"),
        {
          contactHotline: contactHotline.trim(),
          contactEmail: contactEmail.trim(),
          contactAddress: contactAddress.trim(),
          contactWorkingHours: contactWorkingHours.trim(),
          socialFacebook: socialFacebook.trim(),
          socialZalo: socialZalo.trim(),
          socialYoutube: socialYoutube.trim(),
          socialTiktok: socialTiktok.trim()
        },
        { merge: true },
      );
      onShowNotification("Đã lưu thiết lập cấu hình chung thành công!", "success");
    } catch (err) {
      console.error(err);
      onShowNotification("Không thể lưu thay đổi cấu hình chung.", "error");
    } finally {
      setLoading(false);
    }
  };

  // SEO configuration save
  const handleSaveSEO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await setDoc(
        doc(db, "settings", "general"),
        {
          metaTitle: seoTitle,
          metaDesc: seoDesc,
          metaKeywords: seoKeywords,
          googleAnalyticsId: googleAnalyticsId.trim(),
          googleTagId: googleTagId.trim(),
          googleAdsId: googleAdsId.trim(),
          googleAdSenseCode: googleAdSenseCode.trim(),
          facebookPixelId: facebookPixelId.trim(),
          tiktokPixelId: tiktokPixelId.trim(),
          cookieConsentEnabled,
        },
        { merge: true },
      );

      setSeoConfig({
        metaTitle: seoTitle,
        metaDesc: seoDesc,
        metaKeywords: seoKeywords,
      });
      onShowNotification(
        "Đã lưu thiết lập SEO, Google Analytics, Tags & AdSense thành công!",
        "success",
      );
    } catch (err) {
      console.error(err);
      onShowNotification(
        "Không thể ghi nhận thiết lập SEO và Google Trackers.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (currentUserRole === "member" || currentUserRole === "editor") {
      onShowNotification(
        "Lỗi phân quyền: Bạn không được phép xóa khách hàng khỏi hệ thống CRM.",
        "error",
      );
      return;
    }

    try {
      await deleteDoc(doc(db, "consultations", id));
      onShowNotification("Đã xóa dữ liệu khách hàng thành công!", "success");
      if (crmSelectedLead?.id === id) {
        setCrmSelectedLead(null);
      }
    } catch (err) {
      console.error(err);
      onShowNotification("Gặp lỗi khi xóa dữ liệu khách hàng", "error");
    }
  };

  const handleUpdateLeadStatus = async (
    id: string,
    newStatus: string,
    name: string,
  ) => {
    try {
      await updateDoc(doc(db, "consultations", id), {
        status: newStatus,
      });
      onShowNotification(`Đã chuyển trạng thái khách hàng ${name}`, "success");
    } catch (err) {
      console.error(err);
      onShowNotification("Không thể cập nhật trạng thái", "error");
    }
  };

  const handleUpdateLeadField = async (
    id: string,
    field: string,
    value: any,
    labelText: string,
  ) => {
    try {
      await updateDoc(doc(db, "consultations", id), {
        [field]: value,
      });
      onShowNotification(`Đã lưu ${labelText}`, "success");
    } catch (err) {
      console.error(err);
      onShowNotification(`Không thể lưu ${labelText}`, "error");
    }
  };

  const handleUpdateAssignee = async (
    leadId: string,
    newValue: string,
    lead: any,
  ) => {
    try {
      await updateDoc(doc(db, "consultations", leadId), {
        assignee: newValue,
      });
      onShowNotification("Đã lưu Người phụ trách", "success");

      // extract email if any
      const emailMatch = newValue.match(
        /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/,
      );
      if (emailMatch && emailMatch[1]) {
        const email = emailMatch[1];
        const assignedUser = users.find(u => u.email === email);
        const empName = assignedUser ? (assignedUser.employeeName || assignedUser.displayName || assignedUser.username || email) : email;

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
            <h2 style="color: #d4af37;">Khách Hàng Mới Được Giao</h2>
            <p>Chào <b>${empName}</b>,<br/>Admin vừa giao một khách hàng mới cho bạn trên hệ thống CRM.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 150px;">Họ và Tên</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${lead.name || "---"}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Số điện thoại</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${lead.phone || "---"}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Nhu cầu / Sản phẩm</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${lead.propertyTitle || "---"}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Lời nhắn</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${lead.message || lead.demand || "Không có"}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Nguồn truy cập</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${lead.sourceUrl || "Trang chủ"}</td>
              </tr>
            </table>
            <p style="margin-top: 20px; font-size: 13px; color: #666;">Vui lòng liên hệ và chăm sóc khách hàng trong thời gian sớm nhất.</p>
          </div>
        `;

        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            subject: `[CRM] Bạn được giao khách hàng: ${lead.name}`,
            html: htmlContent,
          }),
        });
        onShowNotification("Email đã được gửi đến nhân viên", "success");
      }
    } catch (err) {
      console.error(err);
      onShowNotification("Không thể lưu Người phụ trách", "error");
    }
  };

  const handleAddCareHistory = async (lead: any, text: string) => {
    if (!text.trim()) return;
    try {
      const currentUserName = userProfile?.username || currentUser?.email || (currentUserRole === "admin" ? "Admin" : currentUserRole === "editor" ? "Editor" : "Nhân viên");
      const historyItem = {
        time: Date.now(),
        note: text.trim(),
        author: currentUserName,
      };

      const newHistory = lead.careHistory
        ? [...lead.careHistory, historyItem]
        : [historyItem];

      await updateDoc(doc(db, "consultations", lead.id), {
        careHistory: newHistory,
      });

      onShowNotification("Đã cập nhật lịch sử chăm sóc", "success");
      setCrmSelectedLead({ ...lead, careHistory: newHistory });
    } catch (err) {
      console.error(err);
      onShowNotification("Lỗi khi cập nhật lịch sử", "error");
    }
  };

  const toggleLeadSelection = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleBulkAssign = async () => {
    if (selectedLeadIds.length === 0) {
      onShowNotification("Vui lòng chọn ít nhất 1 khách hàng", "error");
      return;
    }
    if (!bulkAssignee.trim()) {
      onShowNotification("Vui lòng nhập tên/email nhân viên", "error");
      return;
    }

    setLoading(true);
    try {
      for (const id of selectedLeadIds) {
        const lead = consultations.find((c) => c.id === id);
        if (lead) {
          await handleUpdateAssignee(id, bulkAssignee, lead);
        }
      }
      setSelectedLeadIds([]);
      setBulkAssignee("");
      onShowNotification(
        `Đã giao ${selectedLeadIds.length} khách hàng thành công!`,
        "success",
      );
    } catch (error) {
      console.error(error);
      onShowNotification("Có lỗi xảy ra khi giao khách hàng", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmployeeName = async (userId: string, newName: string) => {
    setLoading(true);
    try {
      if (currentUserRole !== "admin" && currentUserRole !== "editor") {
        throw new Error("Chỉ Admin & Biên tập mới có quyền đổi tên");
      }
      await updateDoc(doc(db, "users", userId), {
        username: newName,
      });
      onShowNotification("Đã cập nhật tên người dùng / nhân viên", "success");
      setEditingEmployeeId(null);
    } catch (err: any) {
      console.error("Update rename error:", err);
      onShowNotification("Không thể đổi tên: " + err.message + "\nHãy đảm bảo bạn đã lưu tên mới.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    setLoading(true);
    try {
      if (currentUserRole !== "admin") {
        throw new Error("Chỉ Admin mới có quyền đổi chức vụ");
      }
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
      });
      onShowNotification("Đã cập nhật chức vụ người dùng", "success");
    } catch (err) {
      console.error(err);
      onShowNotification("Không thể cập nhật chức vụ", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setLoading(true);
    try {
      if (currentUserRole !== "admin") {
        throw new Error("Chỉ Admin mới có quyền xóa tài khoản");
      }

      // Xóa bên Auth ĐẦU TIÊN để đảm bảo xóa triệt để
      let authWarning = "";
      try {
        const fetchRes = await authFetch(`/api/users/${userId}`, { method: 'DELETE' });
        const resData = await fetchRes.json();

        if (!fetchRes.ok) {
          if (resData.error && resData.error.includes('no user record')) {
            console.log("Ignored missing auth user.");
          } else if (resData.error && resData.error.includes('Chưa cấu hình Firebase Admin')) {
            throw new Error("Xóa thất bại: Chưa cấu hình Firebase Admin SDK. Vui lòng cấu hình tại 'Cài đặt hệ thống' > 'Cấu hình Firebase Admin'.");
          } else {
            throw new Error(`Xóa Auth thất bại: ${resData.error || 'Unknown error'}`);
          }
        }
      } catch (e: any) {
        if (e.message && e.message.includes('Xóa thất bại')) {
          throw e; // quăng tiếp để dừng lại
        }
        console.warn("Lỗi kết nối mạng tới Server khi xóa Auth", e);
        authWarning = " (Cảnh báo: Không thể kết nối đến máy chủ để xóa Auth)";
        throw new Error("Không thể kết nối đến server để xóa Auth: " + e.message);
      }

      // Xóa trong Firestore
      await deleteDoc(doc(db, "users", userId));

      onShowNotification("Đã xóa người dùng thành công khỏi hệ thống." + authWarning, "success");
    } catch (err: any) {
      console.error(err);
      onShowNotification("Không thể xóa người dùng: " + (err.message || 'Lỗi Firebase'), "error");
    } finally {
      setLoading(false);
    }
  };

  const displayConsultations = React.useMemo(() => {
    if (currentUserRole === "admin" || currentUserRole === "editor")
      return consultations;
    return consultations.filter(
      (c: any) =>
        c.assignee &&
        c.assignee.toLowerCase().includes(currentMemberEmail.toLowerCase()),
    );
  }, [consultations, currentUserRole, currentMemberEmail]);

  // If unauthorized -> Show prompt to login
  if (!isLoggedIn) {
    return (
      <div
        className="max-w-md mx-auto px-4 py-16 text-center animate-in fade-in"
        id="admin-unauth-box"
      >
        <div className="bg-slate-50 border border-slate-200 p-8 rounded-lg space-y-6 shadow-2xl relative overflow-hidden">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight">
              Khu Vực Quản Lý
            </h2>
            <p className="text-slate-700 text-sm font-light">
              Vui lòng đăng nhập từ thanh điều hướng để truy cập khu vực này.
            </p>
            <button
              onClick={() => onNavigate({ screen: "home" })}
              className="bg-primary hover:bg-primary-light text-zinc-900 font-bold py-2 px-6 rounded-lg text-sm"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper to resolve email to display name
  const getAssigneeName = (email: string) => {
    if (!email) return "-";
    const user = users.find((u) => u.email === email);
    return user ? user.username || user.displayName || user.email : email;
  };

  // Authorised layout view
  return (
    <div
      className="min-h-screen w-full bg-white flex font-sans text-slate-900 overflow-x-hidden"
      id="wp-admin-root"
    >
      {/* 1. wordpress left sidebar navigation panel */}
      <aside
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`group fixed inset-y-0 left-0 z-50 bg-slate-50 border-r border-slate-200 flex flex-col transition-all duration-300 lg:translate-x-0 lg:static overflow-hidden shrink-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } ${isSidebarExpanded ? "w-64" : "w-64 lg:w-16"}`}
        id="wp-admin-sidebar"
      >
        {/* Sidebar Header branding */}
        <div
          className={`p-4 bg-white border-b border-slate-200 flex items-center shrink-0 h-[72px] ${isSidebarExpanded ? "justify-between" : "justify-center lg:px-2"}`}
        >
          <div
            className={`flex items-center gap-2.5 overflow-hidden transition-all duration-300 ${isSidebarExpanded ? "w-auto opacity-100" : "lg:w-0 lg:opacity-0 w-auto opacity-100"}`}
          >
            <div className="bg-primary text-white p-2 rounded-lg font-bold font-display flex items-center justify-center min-w-[32px] h-d+ shrink-0">
              W
            </div>
            <div className="whitespace-nowrap">
              <span className="font-display text-[15px] font-bold tracking-tight text-slate-900 block">
                Greenia <span className="text-primary">Homes</span>
              </span>
              <span className="text-[8px] font-bold text-slate-500 tracking-widest block font-mono">
                WordPress Console
              </span>
            </div>
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
            className="hidden lg:flex text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-200 shrink-0"
            title={desktopSidebarOpen ? "Thu gọn menu" : "Mở rộng menu"}
          >
            <Menu className="w-5 h-8" />
          </button>

          {/* Mobile close menu trigger */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-700 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-200 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-6 transition-all duration-300 ${isSidebarExpanded ? "px-3" : "px-3 lg:px-2 lg:[&_span]:hidden lg:[&_p]:opacity-0 lg:[&_button]:justify-center lg:[&_button]:px-0"}`}
          id="wp-sidebar-links"
        >
          <div className="space-y-1.5">
            <p className="px-3 text-[9px] font-black text-slate-500 tracking-wider">
              Hệ Thống
            </p>

            <button
              onClick={() => {
                setActiveTab("listings");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "listings"
                  ? "text-slate-900 bg-primary/10 border-l-[3px] border-primary font-bold"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0 text-primary" />
              <span>Kho Sản Phẩm BĐS</span>
              <span className="ml-auto text-[9px] bg-white px-2 py-0.5 rounded-full text-slate-500 font-mono">
                {currentUserRole === "member" || currentUserRole === "user"
                  ? products.filter((p) => p.createdBy === currentMemberEmail)
                    .length
                  : products.length}
              </span>
            </button>

            {["admin", "editor"].includes(currentUserRole) && (
              <button
                onClick={() => {
                  setActiveTab("projects");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "projects"
                    ? "text-slate-900 bg-primary/10 border-l-[3px] border-primary font-bold"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                  }`}
              >
                <Compass className="w-4 h-4 shrink-0 text-primary" />
                <span>Dự Án Quy Hoạch</span>
                <span className="ml-auto text-[9px] bg-white px-2 py-0.5 rounded-full text-slate-500 font-mono">
                  {projects.length}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                setActiveTab("articles");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "articles"
                  ? "text-slate-900 bg-primary/10 border-l-[3px] border-primary font-bold"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                }`}
            >
              <FileText className="w-4 h-4 shrink-0 text-primary" />
              <span>Tin Tức Phong Thủy</span>
              <span className="ml-auto text-[9px] bg-white px-2 py-0.5 rounded-full text-slate-500 font-mono">
                {currentUserRole === "member" || currentUserRole === "user"
                  ? news.filter((n) => n.createdBy === currentMemberEmail)
                    .length
                  : news.length}
              </span>
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="px-3 text-[9px] font-black text-slate-500 tracking-wider">
              Cơ cấu & SEO
            </p>

            {currentUserRole === "admin" && (
              <>
                <button
                  onClick={() => {
                    setActiveTab("categories");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "categories"
                      ? "text-slate-900 bg-primary/10 border-l-[3px] border-primary font-bold"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                >
                  <List className="w-4 h-4 shrink-0 text-primary" />
                  <span>Danh Mục Sản Phẩm</span>
                </button>


                <button
                  onClick={() => {
                    setActiveTab("general" as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "general" as any
                      ? "text-slate-900 bg-primary/10 border-l-[3px] border-primary font-bold"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                >
                  <MapPin className="w-4 h-4 shrink-0 text-primary" />
                  <span>Liên Hệ & MXH</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("integrations" as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "integrations" as any
                      ? "text-slate-900 bg-primary/10 border-l-[3px] border-primary font-bold"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                >
                  <Share2 className="w-4 h-4 shrink-0 text-primary" />
                  <span>Ai & Auto-Post</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("seo");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "seo"
                      ? "text-slate-900 bg-primary/10 border-l-[3px] border-primary font-bold"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                >
                  <Settings className="w-4 h-4 shrink-0 text-primary" />
                  <span>Cấu hình SEO & Logo</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("google");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "google"
                      ? "text-slate-900 bg-primary/10 border-l-[3px] border-primary font-bold"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                >
                  <Activity className="w-4 h-4 shrink-0 text-primary" />
                  <span>Google Tracking & Ads</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("blocked_ips" as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left font-semibold tracking-wide transition-all cursor-pointer ${activeTab === ("blocked_ips" as any)
                      ? "text-slate-900 bg-primary/10 border-l-[3px] border-primary font-bold"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 text-primary" />
                  <span>Danh Sách Chặn IP</span>
                </button>

                <button
                  onClick={() => {
                    openGithubConfigModal();
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left font-semibold tracking-wide transition-all cursor-pointer ${
                    showGithubConfigModal
                      ? "text-slate-900 bg-primary/10 border-l-[3px] border-primary font-bold"
                      : githubStatus?.status === "HOẠT ĐỘNG"
                        ? "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                        : "text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 border-l-[3px] border-rose-500/40"
                  }`}
                >
                  <Share2 className="w-4 h-4 shrink-0 text-primary" />
                  <span>Cấu Hình GitHub / PAT</span>
                  {githubStatus?.status !== "HOẠT ĐỘNG" && (
                    <span className="ml-auto text-[8px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-mono">
                      !
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab("gallery" as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left font-semibold tracking-wide transition-all cursor-pointer ${activeTab === ("gallery" as any)
                      ? "text-slate-900 bg-primary/10 border-l-[3px] border-primary font-bold"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                >
                  <Image className="w-4 h-4 shrink-0 text-primary" />
                  <span>Kho Hình Ảnh</span>
                  <span className="ml-auto text-[9px] bg-white px-2 py-0.5 rounded-full text-slate-500 font-mono">
                    {libraryImages.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("users");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "users"
                      ? "text-slate-900 bg-primary/10 border-l-[3px] border-primary font-bold"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                    }`}
                >
                  <UserPlus className="w-4 h-4 shrink-0 text-primary" />
                  <span>Quản Lý Người Dùng</span>
                  <span className="ml-auto text-[9px] bg-white px-2 py-0.5 rounded-full text-slate-500 font-mono">
                    {users.length}
                  </span>
                </button>
              </>
            )}

            {currentUserRole !== "user" && (
              <button
                onClick={() => {
                  setActiveTab("leads");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "leads"
                    ? "text-slate-900 bg-primary/10 border-l-[3px] border-primary font-bold"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                  }`}
              >
                <Mail className="w-4 h-4 shrink-0 text-primary" />
                <span>Kho Khách Hàng (CRM)</span>
                {displayConsultations.filter((c) => c.status === "pending")
                  .length > 0 && (
                    <span className="ml-auto text-[9px] bg-red-500 text-white font-extrabold px-2 py-0.5 rounded-full font-mono animate-pulse">
                      {
                        displayConsultations.filter((c) => c.status === "pending")
                          .length
                      }
                    </span>
                  )}
              </button>
            )}



            <button
              onClick={() => {
                setCreateType("product");
                setActiveTab("new_wizard" as any);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left font-semibold tracking-wide transition-all cursor-pointer ${activeTab === ("new_wizard" as any)
                  ? "text-slate-900 bg-primary/10 border-l-[3px] border-primary font-bold"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                }`}
            >
              <PlusCircle className="w-4 h-4 shrink-0 text-primary" />
              <span>Viết Bài / Khởi Đăng Tin</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("profile");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-left font-semibold tracking-wide transition-all cursor-pointer ${activeTab === "profile"
                  ? "text-slate-900 bg-primary/10 border-l-[3px] border-primary font-bold"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                }`}
            >
              <UserCheck className="w-4 h-4 shrink-0 text-primary" />
              <span>Hồ Sơ Cá Nhân</span>
            </button>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-col gap-2">
            <button
              onClick={() => onNavigate({ screen: "home" })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-all text-left cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-primary" />
              <span>Ghé thăm trang chủ</span>
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-all text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Thoát Bảng Quản Trị</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer metadata user indicator */}
        <div
          className={`p-4 bg-white border-t border-slate-200 shrink-0 text-left transition-all duration-300 overflow-hidden ${isSidebarExpanded ? "h-auto opacity-100" : "lg:h-0 lg:p-0 lg:opacity-0 lg:pointer-events-none border-t-0"}`}
        >
          <p className="text-[10px] text-slate-500 whitespace-nowrap">
            Email đăng nhập:
          </p>
          <p
            className="text-[11px] font-mono font-bold text-slate-800 truncate"
            title={currentMemberEmail}
          >
            {currentMemberEmail}
          </p>
          <span className="inline-block mt-1.5 text-[8px] font-bold tracking-wider bg-primary/10 text-primary-light px-2 py-0.5 rounded-full border border-primary/15 whitespace-nowrap">
            {currentUserRole === "admin"
              ? "Chủ sở hữu"
              : currentUserRole === "editor"
                ? "Biên Tập Viên"
                : "Môi giới / Đối tác"}
          </span>
        </div>
      </aside>

      {/* Background backing content overlay for sliding sidebar on mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/65 z-40 backdrop-blur-sm"
        />
      )}

      {/* 2. Top-bar dynamic and right workspace main container */}
      <div className="flex-1 flex flex-col min-w-0" id="wp-workspace">
        {/* Custom Header control row */}
        <header
          className="h-16 bg-slate-50 border-b border-slate-200 px-6 flex items-center justify-between shrink-0"
          id="wp-topbar"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-700 hover:text-slate-900 p-2 rounded-lg bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-primary-light">
                Dashboard
              </span>
              <span className="text-slate-500">/</span>
              <span className="text-xs text-slate-700 font-mono font-bold">
                {activeTab.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* GitHub Connection Status Badge */}
            {currentUserRole === "admin" && (
              <button
                onClick={() => {
                  if (
                    !githubStatus ||
                    githubStatus.status === "THIẾU CẤU HÌNH" ||
                    (githubStatus.status &&
                      githubStatus.status !== "HOẠT ĐỘNG" &&
                      !checkingGithub)
                  ) {
                    openGithubConfigModal();
                  } else {
                    checkGithubConnection();
                  }
                }}
                disabled={checkingGithub}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold font-mono transition-all border shrink-0 cursor-pointer ${checkingGithub
                    ? "bg-zinc-900 border-zinc-800 text-slate-600"
                    : !githubStatus
                      ? "bg-primary/10 border-primary/20 text-primary-light hover:bg-primary/25"
                      : githubStatus.status === "HOẠT ĐỘNG"
                        ? "bg-primary/10 border-primary/25 text-primary-light"
                        : "bg-rose-500/10 border-rose-500/25 text-rose-500 hover:bg-rose-500/20"
                  }`}
                title={
                  githubStatus?.status === "HOẠT ĐỘNG"
                    ? githubStatus.message
                    : "Nhấn để cấu hình GitHub PAT"
                }
              >
                <RefreshCw
                  className={`w-3 h-3 ${checkingGithub ? "animate-spin" : ""}`}
                />
                <span>
                  GITHUB:{" "}
                  {checkingGithub
                    ? "ĐANG ĐỐI CHIẾU..."
                    : !githubStatus
                      ? "KIỂM TRA..."
                      : githubStatus.status}
                </span>
              </button>
            )}

            <div className="w-px h-6 bg-slate-100 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black font-display text-xs">
                {currentMemberEmail ? currentMemberEmail[0].toUpperCase() : "A"}
              </div>
              <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                Chào, {currentMemberEmail.split("@")[0]}
              </span>
            </div>
          </div>
        </header>

        {/* Complete main workspace workspace panels */}
        <main
          className="flex-1 min-w-0 px-3 py-3 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden space-y-4 md:space-y-8"
          id="wp-inner-body"
        >

          {/* Quick Stats overview panel only displaying for listings tab */}
          {activeTab === "listings" && (
            <div className="flex flex-col xl:flex-row gap-3 mb-4 items-stretch xl:items-start w-full">
              <div
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1"
                id="wp-stats-grid"
              >
              <div
                onClick={() => setActiveTab("listings")}
                className="bg-slate-50 border px-3 py-2 h-[43.5px] rounded-lg cursor-pointer transition-colors border-slate-200 hover:border-primary hover:bg-primary/5 group"
              >
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[9px] font-bold tracking-wider text-slate-700 group-hover:text-primary transition-colors">
                    Sản Phẩm
                  </span>
                  <div className="text-[12px] leading-[12px] font-bold text-primary-light">
                    {currentUserRole === "member" || currentUserRole === "user"
                      ? products.filter(
                        (p) => p.createdBy === currentMemberEmail,
                      ).length
                      : products.length}
                  </div>
                </div>
                <span className="text-[8px] text-slate-500 truncate block">
                  Sản phẩm bất động sản vinh hoa
                </span>
              </div>

              <div
                onClick={() => setActiveTab("projects")}
                className="bg-slate-50 border px-3 py-2 h-[43.5px] rounded-lg cursor-pointer transition-colors border-slate-200 hover:border-primary hover:bg-primary/5 group"
              >
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[9px] font-bold tracking-wider text-slate-700 group-hover:text-primary transition-colors">
                    Dự Án
                  </span>
                  <div className="text-[12px] leading-[12px] font-bold text-primary-light">
                    {currentUserRole === "member" || currentUserRole === "user"
                      ? projects.filter(
                        (p) => p.createdBy === currentMemberEmail,
                      ).length
                      : projects.length}
                  </div>
                </div>
                <span className="text-[8px] text-slate-500 truncate block">
                  Công trình thế kỷ lấn biển
                </span>
              </div>

              <div
                onClick={() => setActiveTab("articles")}
                className="bg-slate-50 border px-3 py-2 h-[43.5px] rounded-lg cursor-pointer transition-colors border-slate-200 hover:border-indigo-500 hover:bg-indigo-500/5 group"
              >
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[9px] font-bold tracking-wider text-slate-700 group-hover:text-indigo-500 transition-colors">
                    Tin Tức
                  </span>
                  <div className="text-[12px] leading-[12px] font-bold text-indigo-400">
                    {currentUserRole === "member" || currentUserRole === "user"
                      ? news.filter((n) => n.createdBy === currentMemberEmail)
                        .length
                      : news.length}
                  </div>
                </div>
                <span className="text-[8px] text-slate-500 truncate block">
                  Chuyên mục khai thái vận tài
                </span>
              </div>

              <div
                onClick={() => setActiveTab("leads")}
                className="bg-slate-50 border px-3 py-2 h-[43.5px] rounded-lg cursor-pointer transition-colors border-slate-200 hover:border-rose-500 hover:bg-rose-500/5 group"
              >
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[9px] font-bold tracking-wider text-slate-700 group-hover:text-rose-500 transition-colors">
                    Liên Hệ
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[12px] leading-[12px] font-bold text-rose-500">
                      {
                        displayConsultations.filter(
                          (c) => c.status === "pending",
                        ).length
                      }
                    </span>
                    <span className="text-[9px] text-slate-500">
                      / {displayConsultations.length}
                    </span>
                  </div>
                </div>
                <span className="text-[8px] text-slate-500 truncate block">
                  Khách hàng cần liên hệ gấp
                </span>
              </div>
            </div>

            {/* Đăng tin button beside the grid */}
            <div className="flex-shrink-0 flex items-center justify-end">
                <button
                  onClick={() => {
                    setCreateType("product");
                    setActiveTab("new_wizard" as any);
                  }}
                  className="inline-flex items-center gap-1.5 bg-primary text-white font-bold text-xs py-2 px-4 h-[43.5px] rounded-lg cursor-pointer w-full xl:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  <span>Đăng tin</span>
                </button>
            </div>
          </div>
          )}

          {/* Main Tab content router wrapper */}
          <div className="space-y-8">
            {/* =========================================================
            TAB 1: Products Listing Manager (with Approval toggle!)
            ========================================================= */}
            {activeTab === "listings" && (
              <div className="space-y-6" id="properties-editor-workspace">
                <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-lg shadow-black/50 overflow-hidden w-full">
                  <table className="w-full text-left text-sm text-slate-800">
                    <thead className="bg-slate-200 text-slate-700 text-[10px] font-bold tracking-widest border-b border-slate-200">
                      <tr>
                        <th className="px-5 pt-[10px] pb-[5px] h-[31px]">Thông tin BDS</th>
                        <th className="px-5 pt-[10px] pb-[5px] h-[31px] hidden sm:table-cell">Mô tả ngắn</th>
                        <th className="px-5 pt-[10px] pb-[5px] h-[31px] hidden lg:table-cell text-center">Lượt xem</th>
                        <th className="px-5 pt-[10px] pb-[5px] h-[31px] hidden lg:table-cell">Người đăng</th>
                        <th className="px-5 pt-[10px] pb-[5px] h-[31px] text-right hidden sm:table-cell">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {products
                        .filter(
                          (p) =>
                            currentUserRole === "admin" ||
                            currentUserRole === "editor" ||
                            p.createdBy === currentMemberEmail,
                        )
                        .map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-100 transition-colors"
                          >
                            <td className="px-[5px] pt-[10px] pb-3">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                  <img loading="lazy" decoding="async"
                                    src={(item.imageUrl) || undefined}
                                    alt={item.title}
                                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <h4 className="font-semibold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                                      {item.title}
                                      <span
                                        className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border ${item.approvalStatus === "approved"
                                            ? "bg-primary/10 border-primary/20 text-primary"
                                            : item.approvalStatus === "rejected"
                                              ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                              : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                          }`}
                                      >
                                        {item.approvalStatus === "approved" ? "Đã duyệt" : item.approvalStatus === "rejected" ? "Bị từ chối" : "Chờ duyệt"}
                                      </span>
                                    </h4>
                                    <p className="text-primary-light font-bold text-[10px] sm:text-xs mt-0.5">
                                      {item.priceText}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 sm:hidden mt-1">
                                  <button
                                    onClick={() => onNavigate({ screen: "product-detail", productId: item.id })}
                                    className="text-[10px] bg-slate-100 hover:bg-slate-300 text-slate-800 px-2 py-[3px] rounded transition-colors"
                                  >Xem</button>
                                  <button
                                    onClick={() => handleStartEditProduct(item)}
                                    className="text-[10px] bg-slate-100 hover:bg-slate-300 text-primary-light px-2 py-[3px] rounded transition-colors flex items-center gap-1"
                                  ><Edit className="w-3 h-3" /> Sửa</button>
                                  <button
                                    onClick={() => handleDeleteContent(item.id, "products")}
                                    disabled={currentUserRole === "editor"}
                                    className="text-[10px] bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-900 px-2 py-[3px] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                                  ><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </td>
                            <td className="px-[5px] py-3 hidden sm:table-cell max-w-[200px] xl:max-w-[300px]">
                              <p className="text-[11px] text-slate-600 line-clamp-2" title={(item.description || "").replace(/<[^>]+>/g, " ").replace(/&[a-zA-Z]+;/g, " ").replace(/\s+/g, " ").trim()}>
                                {(item.description || "").replace(/<[^>]+>/g, " ").replace(/&[a-zA-Z]+;/g, " ").replace(/\s+/g, " ").trim() || "Chưa có mô tả..."}
                              </p>
                            </td>
                            <td className="px-5 py-3 hidden lg:table-cell text-center align-middle">
                              <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold">
                                {item.viewsCount || 0}
                              </span>
                            </td>
                            <td className="px-5 py-3 hidden lg:table-cell">
                              <div className="text-[10px] text-slate-700 font-mono">
                                ID: {item.id.slice(0, 5)}<br />
                                <span className="text-slate-800">{item.createdBy || "Admin"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right hidden sm:table-cell">
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  onClick={() => onNavigate({ screen: "product-detail", productId: item.id })}
                                  className="text-[10px] bg-slate-100 hover:bg-slate-300 text-slate-800 px-2 py-1.5 rounded transition-colors"
                                >Xem</button>
                                <button
                                  onClick={() => handleStartEditProduct(item)}
                                  className="text-[10px] bg-slate-100 hover:bg-slate-300 text-primary-light px-2 py-1.5 rounded transition-colors flex items-center gap-1"
                                ><Edit className="w-3 h-3" /> Sửa</button>
                                <button
                                  onClick={() => handleDeleteContent(item.id, "products")}
                                  disabled={currentUserRole === "editor"}
                                  className="text-[10px] bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-900 px-2 py-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center p-1.5"
                                ><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {products.filter((p) => currentUserRole === "admin" || currentUserRole === "editor" || p.createdBy === currentMemberEmail).length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-5 py-12 text-center text-slate-500 font-medium">Không có sản phẩm nào</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =========================================================
            TAB 2: Projects manager (Vinhomes Can Gio/Hoc Mon)
            ========================================================= */}
            {activeTab === "projects" && (
              <div className="space-y-6" id="projects-workspace">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab("listings")}
                      className="p-1.5 bg-slate-100 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Quay lại Bảng Thống Kê"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h3 className="text-slate-900 font-display font-medium text-base">
                      Dự án
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      setCreateType("project");
                      setActiveTab("new_wizard" as any);
                    }}
                    className="inline-flex items-center gap-1 bg-primary text-white font-bold text-xs py-[5px] px-4 rounded-lg cursor-pointer"
                  >
                    <span>Thêm</span>
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-lg shadow-black/50 overflow-hidden w-full">
                  <table className="w-full text-left text-sm text-slate-800">
                    <thead className="bg-slate-200 text-slate-700 text-[10px] font-bold tracking-widest border-b border-slate-200">
                      <tr>
                        <th className="px-5 pt-[10px] pb-[5px] h-[31px]">Thông tin Dự án</th>
                        <th className="px-5 pt-[10px] pb-[5px] h-[31px] hidden sm:table-cell">Vị trí</th>
                        <th className="px-5 pt-[10px] pb-[5px] h-[31px] text-right hidden sm:table-cell">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {projects
                        .filter(
                          (p) =>
                            currentUserRole === "admin" ||
                            currentUserRole === "editor" ||
                            p.createdBy === currentMemberEmail,
                        )
                        .map((proj) => (
                          <tr
                            key={proj.id}
                            className="hover:bg-slate-100 transition-colors"
                          >
                            <td className="px-[10px] py-[5px]">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                  <img loading="lazy" decoding="async"
                                    src={(proj.imageUrl) || undefined}
                                    alt={proj.title}
                                    className="w-16 h-12 rounded object-cover flex-shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">
                                      {proj.title}
                                    </h4>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 sm:hidden mt-1">
                                  <button
                                    onClick={() =>
                                      onNavigate({
                                        screen: "project-detail",
                                        projectId: proj.id,
                                      })
                                    }
                                    className="text-[10px] bg-slate-100 hover:bg-slate-300 text-slate-800 px-2 py-[3px] rounded transition-colors"
                                  >Xem</button>
                                  <button
                                    onClick={() => handleStartEditProject(proj)}
                                    className="text-[10px] bg-slate-100 hover:bg-slate-300 text-primary-light px-2 py-[3px] rounded transition-colors flex items-center gap-1"
                                  ><Edit className="w-3 h-3" /> Sửa</button>
                                  <button
                                    onClick={() => handleDeleteContent(proj.id, "projects")}
                                    disabled={currentUserRole === "editor"}
                                    className="text-[10px] bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-900 px-2 py-[3px] rounded transition-colors disabled:opacity-30 flex items-center justify-center"
                                  ><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 hidden sm:table-cell">
                              <div className="text-[10px] text-slate-700 font-mono flex items-center gap-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span>{proj.location}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right hidden sm:table-cell">
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  onClick={() =>
                                    onNavigate({
                                      screen: "project-detail",
                                      projectId: proj.id,
                                    })
                                  }
                                  className="text-[10px] bg-slate-100 hover:bg-slate-300 text-slate-800 px-2 py-1.5 rounded transition-colors"
                                >Xem</button>
                                <button
                                  onClick={() => handleStartEditProject(proj)}
                                  className="text-[10px] bg-slate-100 hover:bg-slate-300 text-primary-light px-2 py-1.5 rounded transition-colors flex items-center gap-1"
                                ><Edit className="w-3 h-3" /> Sửa</button>
                                <button
                                  onClick={() => handleDeleteContent(proj.id, "projects")}
                                  disabled={currentUserRole === "editor"}
                                  className="text-[10px] bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-900 px-2 py-1.5 rounded transition-colors disabled:opacity-30 flex items-center justify-center p-1.5"
                                ><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {projects.filter((p) => currentUserRole === "admin" || currentUserRole === "editor" || p.createdBy === currentMemberEmail).length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-5 py-12 text-center text-slate-500 font-medium">Không có dự án nào</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =========================================================
            TAB USERS: User Management
            ========================================================= */}
            {activeTab === "users" && currentUserRole === "admin" && (
              <div className="space-y-6" id="users-workspace">
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 px-4 py-[5px] mb-[10px] text-[12px] rounded-xl shadow-lg">
                  <h3 className="font-display font-medium text-slate-900 flex items-center gap-2 tracking-wider">
                    <Users className="w-[12px] h-[12px] text-primary" />
                    <span className="text-[12px]">Người dùng</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <select
                      className="bg-white border border-slate-300 text-slate-900 text-[10px] sm:text-xs rounded-lg px-2 py-1.5 outline-none focus:border-primary transition-colors"
                      value={usersFilter}
                      onChange={(e) => setUsersFilter(e.target.value as any)}
                    >
                      <option value="all">-- Lọc tất cả --</option>
                      <option value="admin">Admin (Quản trị)</option>
                      <option value="editor">Editor (Biên tập)</option>
                      <option value="member">Member (Môi giới)</option>
                      <option value="user">User (Người dùng)</option>
                    </select>
                    <div className="text-sm text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                      Sl:{" "}
                      <span className="text-primary font-bold">
                        {usersFilter === "all" ? users.length : users.filter(u => u.role === usersFilter).length}
                      </span>
                    </div>
                  </div>
                </div>

                {!selectedUser ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-lg shadow-black/50 overflow-hidden w-full">
                    <table className="w-full text-left text-sm text-slate-800">
                      <thead className="bg-slate-200 text-slate-700 text-[10px] font-bold tracking-widest border-b border-slate-200">
                        <tr>
                          <th className="px-2 sm:px-[10px] pt-[10px] pb-[5px] h-[31px] w-[34px] text-center sm:text-left">STT</th>
                          <th className="px-[10px] pt-[10px] pb-[5px] h-[31px]">Tên hiện thị / Email</th>
                          <th className="px-[10px] pt-[10px] pb-[5px] h-[31px]">Chức vụ</th>
                          <th className="px-[10px] pt-[10px] pb-[5px] h-[31px] text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {users
                          .filter(user => usersFilter === "all" || user.role === usersFilter)
                          .map((user, index) => (
                            <tr
                              key={user.id}
                              className="hover:bg-slate-100 transition-colors"
                            >
                              <td className="px-2 sm:px-[10px] py-1 font-mono text-slate-500 text-[10px] sm:text-xs text-center sm:text-left h-[50px] w-[34px]">
                                {(index + 1).toString().padStart(2, "0")}
                              </td>
                              <td className="px-[10px] py-1 w-auto h-[45px]">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-300 text-primary font-bold shrink-0 text-xs hidden sm:flex">
                                    {(user.employeeName || user.displayName || user.username || user.email || "?").charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <div className="font-bold text-primary whitespace-nowrap text-sm truncate max-w-[150px] sm:max-w-[200px]">
                                      {user.employeeName || user.displayName || user.username || "Chưa đặt tên NV"}
                                    </div>
                                    <div className="text-[10px] sm:text-xs text-slate-700 font-mono truncate max-w-[150px] sm:max-w-[200px]">
                                      {user.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-0 w-auto h-[50px] px-[5px]">
                                <span className={`text-[10px] sm:text-xs font-medium px-[5px] py-1 rounded-full ${user.role === "admin" ? "bg-primary/10 text-primary border border-primary/20" : user.role === "editor" ? "bg-accent/10 text-accent border border-primary/20" : user.role === "member" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "bg-slate-100 text-slate-700 border border-slate-300"}`}>
                                  {user.role === "admin" ? "Admin" : user.role === "editor" ? "Biên tập" : user.role === "member" ? "Môi giới" : "Người dùng"}
                                </span>
                              </td>
                              <td className="px-[10px] py-1 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                  className="p-2 text-slate-900 bg-slate-100 hover:bg-slate-300 border border-slate-300 rounded flex gap-2 items-center text-xs ml-auto transition-all"
                                  title="Xem chi tiết"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="hidden xl:block font-medium">Chi tiết</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        {users.filter(user => usersFilter === "all" || user.role === usersFilter).length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-5 py-16 text-center text-slate-500 font-medium"
                            >
                              Không có dữ liệu người dùng
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col w-full shadow-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-0 border-b border-slate-300 bg-slate-50 flex justify-between items-center z-10 w-full shrink-0">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedUser(null);
                            setShowDeleteConfirm(false);
                          }}
                          className="cursor-pointer bg-slate-100 hover:bg-slate-300 text-slate-800 px-2 sm:px-3 py-[5px] rounded text-[10px] font-bold flex items-center gap-1 transition-colors border border-slate-300"
                        >
                          <ChevronLeft className="w-4 h-4" /> Đóng
                        </button>
                        <div>
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 font-mono leading-tight flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            <span className="truncate max-w-[150px] sm:max-w-[300px] inline-block">
                              {selectedUser.employeeName || selectedUser.displayName || selectedUser.username || "Chưa đặt tên"}
                            </span>
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 py-2">
                        {!showDeleteConfirm ? (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="cursor-pointer text-[11px] text-rose-500 font-bold hover:text-rose-400 px-3 py-1.5 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 rounded flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa người dùng
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 p-1.5 rounded">
                            <span className="text-[10px] text-red-500 font-bold px-1">Chắc chắn xóa?</span>
                            <button
                              onClick={async () => {
                                await handleDeleteUser(selectedUser.id);
                                setShowDeleteConfirm(false);
                                setSelectedUser(null);
                              }}
                              className="cursor-pointer text-[10px] text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded font-bold transition-colors"
                            >
                              Có, Xóa
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="cursor-pointer text-[10px] text-slate-800 bg-slate-100 hover:bg-slate-300 px-2 py-1 rounded font-bold transition-colors"
                            >
                              Hủy
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 sm:p-5 overflow-y-auto w-full bg-white flex-1 space-y-6">
                      <div className="bg-slate-50 border border-slate-300 rounded-lg overflow-hidden flex flex-col w-full text-sm text-slate-800">
                        <div className="bg-slate-100 border-b border-slate-300 p-2 sm:p-3 font-bold text-slate-900 text-[10px] flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-primary" />
                          Thông tin người dùng
                        </div>

                        <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[140px_1fr]">
                          <div className="bg-slate-100 text-slate-700 p-2 sm:p-3 border-b border-r border-slate-300 font-semibold text-[10px] sm:text-[11px] flex items-center">
                            Tên hiển thị (NV)
                          </div>
                          <div className="bg-white p-2 sm:p-3 border-b border-slate-300 font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                            {editingEmployeeId === selectedUser.id ? (
                              <div className="flex items-center gap-2 w-full">
                                <input
                                  autoFocus
                                  type="text"
                                  value={editingEmployeeName}
                                  onChange={(e) => setEditingEmployeeName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleUpdateEmployeeName(selectedUser.id, editingEmployeeName.trim());
                                      setSelectedUser({ ...selectedUser, employeeName: editingEmployeeName.trim() });
                                    }
                                    if (e.key === "Escape") setEditingEmployeeId(null);
                                  }}
                                  className="bg-slate-50 border border-primary text-primary text-xs px-2 py-1 rounded outline-none flex-1 max-w-[200px]"
                                />
                                <button
                                  onClick={() => {
                                    handleUpdateEmployeeName(selectedUser.id, editingEmployeeName.trim());
                                    setSelectedUser({ ...selectedUser, employeeName: editingEmployeeName.trim() });
                                  }}
                                  className="text-accent hover:text-emerald-400"
                                  title="Lưu"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => setEditingEmployeeId(null)}
                                  className="text-rose-500 hover:text-rose-400"
                                  title="Huỷ"
                                >
                                  <span className="text-xs font-bold px-1">X</span>
                                </button>
                              </div>
                            ) : (
                              <>
                                <span>{selectedUser.employeeName || selectedUser.displayName || selectedUser.username || "Chưa đặt tên NV"}</span>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setEditingEmployeeId(selectedUser.id);
                                    setEditingEmployeeName(selectedUser.employeeName || selectedUser.displayName || selectedUser.username || "");
                                  }}
                                  className="text-slate-500 hover:text-primary shrink-0"
                                  title="Sửa tên người dùng"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>

                          <div className="bg-slate-100 text-slate-700 p-2 sm:p-3 border-b border-r border-slate-300 font-semibold text-[10px] sm:text-[11px] flex items-center">
                            Email
                          </div>
                          <div className="bg-white p-2 sm:p-3 border-b border-slate-300 font-mono text-slate-800 text-xs sm:text-sm flex items-center break-all">
                            {selectedUser.email}
                          </div>

                          <div className="bg-slate-100 text-slate-700 p-2 sm:p-3 border-b border-r border-slate-300 font-semibold text-[10px] sm:text-[11px] flex items-center">
                            SĐT
                          </div>
                          <div className="bg-white p-2 sm:p-3 border-b border-slate-300 font-mono text-primary text-xs sm:text-sm flex items-center">
                            {selectedUser.phone || <span className="text-text-secondary italic">Chưa cập nhật</span>}
                          </div>

                          <div className="bg-slate-100 text-slate-700 p-2 sm:p-3 border-b border-r border-slate-300 font-semibold text-[10px] sm:text-[11px] flex items-center">
                            Chức vụ
                          </div>
                          <div className="bg-white p-1 sm:p-2 border-b border-slate-300 text-xs sm:text-sm h-10 sm:h-12 flex items-center">
                            <select
                              className="bg-transparent border-none text-[11px] sm:text-xs text-slate-900 px-2 sm:px-3 py-1 outline-none cursor-pointer w-full h-full font-bold"
                              value={selectedUser.role}
                              onChange={(e) => {
                                handleUpdateUserRole(selectedUser.id, e.target.value);
                                setSelectedUser({ ...selectedUser, role: e.target.value });
                              }}
                            >
                              <option value="user" className="bg-slate-50">User (Người dùng)</option>
                              <option value="member" className="bg-slate-50">Member (Môi giới)</option>
                              <option value="editor" className="bg-slate-50">Editor (Biên tập)</option>
                              <option value="admin" className="bg-slate-50">Admin (Quản trị)</option>
                            </select>
                          </div>

                          <div className="bg-slate-100 text-slate-700 p-2 sm:p-3 border-r border-slate-300 font-semibold text-[10px] sm:text-[11px] flex items-center">
                            Ngày tham gia
                          </div>
                          <div className="bg-white p-2 sm:p-3 text-slate-700 text-xs sm:text-sm flex items-center">
                            {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString("vi-VN") : "Không rõ"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================
            TAB PROFILE: User Profile settings
            ========================================================= */}
            {activeTab === "profile" && (
              <UserProfileTab onShowNotification={onShowNotification} />
            )}

            {/* =========================================================
            TAB 3: News / Articles management
            ========================================================= */}
            {activeTab === "articles" && (
              <div className="space-y-6" id="news-blogs-workspace">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab("listings")}
                      className="p-1.5 bg-slate-100 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Quay lại Bảng Thống Kê"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h3 className="text-slate-900 font-display font-medium text-base">
                      Danh sách tin tức
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setCreateType("article");
                      setActiveTab("new_wizard" as any);
                    }}
                    className="inline-flex items-center gap-1 bg-primary text-white font-bold text-xs py-[5px] px-4 rounded-lg cursor-pointer"
                  >
                    <span>Thêm bài viết</span>
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-lg shadow-black/50 overflow-hidden w-full">
                  <table className="w-full text-left text-sm text-slate-800">
                    <thead className="bg-slate-200 text-slate-700 text-[10px] font-bold tracking-widest border-b border-slate-200">
                      <tr>
                        <th className="px-5 pt-[10px] pb-[5px] h-[31px]">Thông tin bài viết</th>
                        <th className="px-5 pt-[10px] pb-[5px] h-[31px] hidden sm:table-cell">Trạng thái</th>
                        <th className="px-5 pt-[10px] pb-[5px] h-[31px] hidden sm:table-cell">Danh mục / Ngày phát</th>
                        <th className="px-5 pt-[10px] pb-[5px] h-[31px] text-right hidden sm:table-cell">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {news
                        .filter(
                          (n) =>
                            currentUserRole === "admin" ||
                            currentUserRole === "editor" ||
                            n.createdBy === currentMemberEmail,
                        )
                        .map((n) => (
                          <tr
                            key={n.id}
                            className="hover:bg-slate-100 transition-colors"
                          >
                            <td className="px-[10px] py-[5px]">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                  <img loading="lazy" decoding="async"
                                    src={(n.imageUrl) || undefined}
                                    alt={n.title}
                                    className="w-16 h-12 rounded object-cover flex-shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">
                                      {n.title}
                                    </h4>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 sm:hidden mt-1">
                                  <button
                                    onClick={() => onNavigate({ screen: "news-detail", newsId: n.id })}
                                    className="text-[10px] bg-slate-100 hover:bg-slate-300 text-slate-800 px-2 py-[3px] rounded transition-colors"
                                  >Mở bài</button>
                                  <button
                                    onClick={() => handleStartEditNews(n)}
                                    className="text-[10px] bg-slate-100 hover:bg-slate-300 text-primary-light px-2 py-[3px] rounded transition-colors flex items-center gap-1"
                                  ><Edit className="w-3 h-3" /> Sửa</button>
                                  <button
                                    onClick={() => handleDeleteContent(n.id, "news")}
                                    disabled={currentUserRole === "editor"}
                                    className="text-[10px] bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-900 px-2 py-[3px] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                                  ><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 hidden sm:table-cell">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full border ${n.approvalStatus === "approved"
                                    ? "bg-primary/10 border-primary/20 text-primary"
                                    : n.approvalStatus === "rejected"
                                      ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                      : "bg-primary/10 border-primary/20 text-primary"
                                  }`}
                              >
                                {n.approvalStatus === "approved" ? "Đã duyệt" : n.approvalStatus === "rejected" ? "Bị từ chối" : "Chờ duyệt"}
                              </span>
                            </td>
                            <td className="px-5 py-3 hidden sm:table-cell">
                              <div className="text-[10px] text-slate-700 font-mono flex flex-col gap-0.5">
                                <span className="text-primary-light font-bold">{n.category}</span>
                                <span>{new Date(n.createdAt).toLocaleDateString("vi-VN")}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right hidden sm:table-cell">
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  onClick={() => onNavigate({ screen: "news-detail", newsId: n.id })}
                                  className="text-[10px] bg-slate-100 hover:bg-slate-300 text-slate-800 pr-[8px] pl-2 py-[3px] rounded transition-colors"
                                >Mở bài</button>
                                <button
                                  onClick={() => handleStartEditNews(n)}
                                  className="text-[10px] bg-slate-100 hover:bg-slate-300 text-primary-light px-2 py-1.5 rounded transition-colors flex items-center gap-1"
                                ><Edit className="w-3 h-3" /> Sửa</button>
                                <button
                                  onClick={() => handleDeleteContent(n.id, "news")}
                                  disabled={currentUserRole === "editor"}
                                  className="text-[10px] bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-900 px-2 py-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center p-1.5"
                                ><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {news.filter((n) => currentUserRole === "admin" || currentUserRole === "editor" || n.createdBy === currentMemberEmail).length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-5 py-12 text-center text-slate-500 font-medium">Không có tin tức nào</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =========================================================
            TAB: Filters Configuration
            ========================================================= */}
            

            {/* =========================================================
            TAB 4: Categories listing group (Wordpress style)
            ========================================================= */}
            {activeTab === "categories" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto">
                {/* 1. Danh mục Sản Phẩm */}
                <div
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col"
                  id="categories-workspace"
                >
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <LayoutGrid className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-slate-900 font-display font-bold text-[15px]">
                          Danh mục Sản Phẩm
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Phân loại bất động sản</p>
                      </div>
                    </div>
                    <button
                      onClick={handleAddCategory}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Thêm mới
                    </button>
                  </div>

                  <div className="p-5 flex-1 bg-white rounded-b-2xl">
                    {catModal.isOpen && catModal.type === "product" ? (
                      <div className="space-y-4 text-left animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-3">
                           <h4 className="font-bold text-slate-800">{catModal.mode === 'add' ? 'Thêm Danh Mục' : 'Sửa Danh Mục'}</h4>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Danh Mục</label>
                          <input autoFocus type="text" value={catModal.data.name} onChange={(e) => setCatModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))} className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl px-3 py-2 text-sm text-slate-900 transition-all outline-none" placeholder="VD: Biệt thự nghỉ dưỡng" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Danh Mục Cha (ID)</label>
                          <select value={catModal.data.parentId} onChange={(e) => setCatModal(prev => ({ ...prev, data: { ...prev.data, parentId: e.target.value } }))} className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl px-3 py-2 text-sm text-slate-900 transition-all outline-none">
                            <option value="">-- Để trống (Cấp 1) --</option>
                            {categories.filter(c => c !== catModal.data.name).map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">SEO Title</label>
                          <input type="text" value={catModal.data.seoTitle} onChange={(e) => setCatModal(prev => ({ ...prev, data: { ...prev.data, seoTitle: e.target.value } }))} className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl px-3 py-2 text-sm text-slate-900 transition-all outline-none" placeholder="Tiêu đề SEO..." />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">SEO Description</label>
                          <textarea rows={2} value={catModal.data.seoDesc} onChange={(e) => setCatModal(prev => ({ ...prev, data: { ...prev.data, seoDesc: e.target.value } }))} className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl px-3 py-2 text-sm text-slate-900 transition-all outline-none resize-none" placeholder="Mô tả SEO..." />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">SEO Keywords</label>
                          <input type="text" value={catModal.data.seoKeywords || ""} onChange={(e) => setCatModal(prev => ({ ...prev, data: { ...prev.data, seoKeywords: e.target.value } }))} className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl px-3 py-2 text-sm text-slate-900 transition-all outline-none" placeholder="Từ khóa SEO..." />
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                           <button onClick={() => setCatModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 mt-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">Hủy</button>
                           <button onClick={handleSaveCatModal} className="px-5 py-2 mt-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer">Lưu Lại</button>
                        </div>
                      </div>
                    ) : categories.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-xl">
                        Chưa có danh mục nào
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {categories.map((cat, index) => {
                          const ext = productCategoriesExt[index];
                          return (
                            <div
                              key={"c" + index}
                              className="group bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-200 p-3.5 rounded-xl flex items-center justify-between transition-all shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-center gap-3.5">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                                  {index + 1}
                                </div>
                                <div>
                                  <span className="text-slate-800 font-bold text-sm block">
                                    {cat}
                                  </span>
                                  {ext?.parentId && (
                                    <span className="text-slate-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                                      <ChevronRight className="w-3 h-3" /> Thuộc: {ext.parentId}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    if (currentUserRole === "editor") return;
                                    handleEditCategory(index);
                                  }}
                                  disabled={currentUserRole === "editor"}
                                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-lg transition-all cursor-pointer disabled:opacity-30"
                                  title="Sửa"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (currentUserRole === "editor") return;
                                    handleDeleteCategory(index);
                                  }}
                                  disabled={currentUserRole === "editor"}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all cursor-pointer disabled:opacity-30"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Danh mục Tin Tức */}
                <div
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col"
                  id="news-categories-workspace"
                >
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-slate-900 font-display font-bold text-[15px]">
                          Danh mục Tin Tức
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Phân loại bài viết blog</p>
                      </div>
                    </div>
                    <button
                      onClick={handleAddNewsCategory}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Thêm mới
                    </button>
                  </div>

                  <div className="p-5 flex-1 bg-white rounded-b-2xl">
                    {catModal.isOpen && catModal.type === "news" ? (
                      <div className="space-y-4 text-left animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-3">
                           <h4 className="font-bold text-slate-800">{catModal.mode === 'add' ? 'Thêm Danh Mục' : 'Sửa Danh Mục'}</h4>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Danh Mục</label>
                          <input autoFocus type="text" value={catModal.data.name} onChange={(e) => setCatModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))} className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-3 py-2 text-sm text-slate-900 transition-all outline-none" placeholder="VD: Tin thị trường" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Danh Mục Cha (ID)</label>
                          <select value={catModal.data.parentId} onChange={(e) => setCatModal(prev => ({ ...prev, data: { ...prev.data, parentId: e.target.value } }))} className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-3 py-2 text-sm text-slate-900 transition-all outline-none">
                            <option value="">-- Để trống (Cấp 1) --</option>
                            {newsCategories.filter(c => c !== catModal.data.name).map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">SEO Title</label>
                          <input type="text" value={catModal.data.seoTitle} onChange={(e) => setCatModal(prev => ({ ...prev, data: { ...prev.data, seoTitle: e.target.value } }))} className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-3 py-2 text-sm text-slate-900 transition-all outline-none" placeholder="Tiêu đề SEO..." />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">SEO Description</label>
                          <textarea rows={2} value={catModal.data.seoDesc} onChange={(e) => setCatModal(prev => ({ ...prev, data: { ...prev.data, seoDesc: e.target.value } }))} className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-3 py-2 text-sm text-slate-900 transition-all outline-none resize-none" placeholder="Mô tả SEO..." />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">SEO Keywords</label>
                          <input type="text" value={catModal.data.seoKeywords || ""} onChange={(e) => setCatModal(prev => ({ ...prev, data: { ...prev.data, seoKeywords: e.target.value } }))} className="w-full bg-slate-50 hover:bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-3 py-2 text-sm text-slate-900 transition-all outline-none" placeholder="Từ khóa SEO..." />
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                           <button onClick={() => setCatModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 mt-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">Hủy</button>
                           <button onClick={handleSaveCatModal} className="px-5 py-2 mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer">Lưu Lại</button>
                        </div>
                      </div>
                    ) : newsCategories.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-xl">
                        Chưa có danh mục nào
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {newsCategories.map((cat, index) => {
                          const ext = newsCategoriesExt[index];
                          return (
                            <div
                              key={"n" + index}
                              className="group bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 p-3.5 rounded-xl flex items-center justify-between transition-all shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-center gap-3.5">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                                  {index + 1}
                                </div>
                                <div>
                                  <span className="text-slate-800 font-bold text-sm block">
                                    {cat}
                                  </span>
                                  {ext?.parentId && (
                                    <span className="text-slate-500 text-[11px] mt-1 flex items-center gap-1 font-medium">
                                      <ChevronRight className="w-3 h-3" /> Thuộc: {ext.parentId}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    if (currentUserRole === "editor") return;
                                    handleEditNewsCategory(index);
                                  }}
                                  disabled={currentUserRole === "editor"}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all cursor-pointer disabled:opacity-30"
                                  title="Sửa"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (currentUserRole === "editor") return;
                                    handleDeleteNewsCategory(index);
                                  }}
                                  disabled={currentUserRole === "editor"}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all cursor-pointer disabled:opacity-30"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
            TAB 4.5: GENERAL SETTINGS
            ========================================================= */}
            {activeTab === ("general" as any) && (
              <div className="space-y-6 max-w-2xl mx-auto" id="general-settings-workspace">
                <div className="bg-slate-50 border border-slate-200 px-[10px] py-[10px] rounded-lg">
                  <h3 className="font-display font-medium text-slate-900 text-base text-left border-b border-slate-200 pb-0 tracking-wider">
                    Cấu Hình Liên Hệ & Mạng Xã Hội
                  </h3>

                  <form
                    onSubmit={handleSaveGeneralSettings}
                    className="space-y-4 pt-[5px] text-left"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700">
                          Hotline (Zalo/Viber 24/7)
                        </label>
                        <input
                          type="text"
                          value={contactHotline}
                          onChange={(e) => setContactHotline(e.target.value)}
                          placeholder="VD: 0932 966 700"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-[10px] text-[10px] text-slate-900 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700">
                          Email Liên Hệ
                        </label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="VD: contact@greeniahomes.vn"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-[10px] text-[10px] text-slate-900 outline-none"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-700">
                          Địa chỉ Văn Phòng
                        </label>
                        <input
                          type="text"
                          value={contactAddress}
                          onChange={(e) => setContactAddress(e.target.value)}
                          placeholder="Địa chỉ công ty"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-[10px] text-[10px] text-slate-900 outline-none"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-700">
                          Giờ làm việc
                        </label>
                        <input
                          type="text"
                          value={contactWorkingHours}
                          onChange={(e) => setContactWorkingHours(e.target.value)}
                          placeholder="VD: 08:00 - 18:00 (Thứ 2 - Thứ 7)"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-[10px] text-[10px] text-slate-900 outline-none"
                        />
                      </div>
                    </div>

                    <h4 className="font-display font-medium text-primary text-sm mt-6 mb-2">Mạng Xã Hội</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700">
                          Link Fanpage Facebook
                        </label>
                        <input
                          type="url"
                          value={socialFacebook}
                          onChange={(e) => setSocialFacebook(e.target.value)}
                          placeholder="https://facebook.com/..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-[10px] text-[10px] text-slate-900 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700">
                          Link Zalo OA / Cá nhân
                        </label>
                        <input
                          type="url"
                          value={socialZalo}
                          onChange={(e) => setSocialZalo(e.target.value)}
                          placeholder="https://zalo.me/..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-[10px] text-[10px] text-slate-900 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700">
                          Channel YouTube
                        </label>
                        <input
                          type="url"
                          value={socialYoutube}
                          onChange={(e) => setSocialYoutube(e.target.value)}
                          placeholder="https://youtube.com/..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-[10px] text-[10px] text-slate-900 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700">
                          Kênh TikTok
                        </label>
                        <input
                          type="url"
                          value={socialTiktok}
                          onChange={(e) => setSocialTiktok(e.target.value)}
                          placeholder="https://tiktok.com/..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-[10px] text-[10px] text-slate-900 outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-amber-600 text-white font-bold py-3 px-5 rounded-lg text-xs transition-all tracking-wider disabled:opacity-50"
                      >
                        {loading ? "Đang lưu..." : "Lưu Thay Đổi"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* =========================================================
            TAB 4.8: AI & AUTO-POST SETTINGS
            ========================================================= */}
            {activeTab === ("integrations" as any) && (
              <div className="space-y-6 max-w-3xl mx-auto" id="integrations-workspace">
                {/* AI / Gemini */}
                <div className="bg-slate-50 border border-slate-200 px-[15px] py-[15px] rounded-lg">
                  <h3 className="font-display font-medium text-slate-900 text-base text-left border-b border-slate-200 pb-2 mb-4 tracking-wider flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Cấu Hình AI (Trợ lý Content)
                  </h3>
                  <div className="space-y-3">
                    <p className="text-xs text-slate-700 text-left">Kết nối Gemini API để tự động viết bài SEO, sinh mô tả dự án và tự động điền thông số.</p>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-slate-700">
                        Google Gemini API Key
                      </label>
                      <input
                        type="password"
                        placeholder="AIzaSyB..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-[10px] text-[10px] text-slate-900 outline-none"
                      />
                    </div>
                    <button className="bg-primary text-white font-bold px-4 py-2 text-xs rounded hover:bg-primary-light transition-colors">
                      Lưu & Kích hoạt AI
                    </button>
                  </div>
                </div>

                {/* Auto Post */}
                <div className="bg-slate-50 border border-slate-200 px-[15px] py-[15px] rounded-lg">
                  <h3 className="font-display font-medium text-slate-900 text-base text-left border-b border-slate-200 pb-2 mb-4 tracking-wider flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-indigo-500" />
                    Auto-Post (Đăng tin đa nền tảng)
                  </h3>
                  <div className="space-y-5 text-left">
                    <p className="text-xs text-slate-700">Thiết lập tài khoản để tự động đồng bộ hóa tin đăng dự án/bài viết lên các trang bên ngoài khi xuất bản.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Batdongsan.com.vn */}
                      <div className="p-4 border border-slate-200 rounded-lg bg-black/50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-sm text-red-500">BatDongSan.com.vn</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-[10px] rounded text-slate-700 uppercase">Chưa kết nối</span>
                        </div>
                        <input type="text" placeholder="Access Token / API Key" className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs mb-2 outline-none text-slate-900" />
                        <button className="w-full bg-slate-100 hover:bg-slate-300 text-slate-900 font-medium px-4 py-2 text-[11px] rounded transition-colors">
                          Lưu Cấu Hình
                        </button>
                      </div>

                      {/* Chotot */}
                      <div className="p-4 border border-slate-200 rounded-lg bg-black/50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-sm text-primary">ChoTot.com</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-[10px] rounded text-slate-700 uppercase">Chưa kết nối</span>
                        </div>
                        <input type="text" placeholder="Access Token / API Key" className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs mb-2 outline-none text-slate-900" />
                        <button className="w-full bg-slate-100 hover:bg-slate-300 text-slate-900 font-medium px-4 py-2 text-[11px] rounded transition-colors">
                          Lưu Cấu Hình
                        </button>
                      </div>

                      {/* Facebook */}
                      <div className="p-4 border border-slate-200 rounded-lg bg-black/50 md:col-span-2">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-sm text-blue-500">Facebook Page (Auto-Post)</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-[10px] rounded text-slate-700 uppercase">Chưa kết nối</span>
                        </div>
                        <input type="text" placeholder="Facebook Page Access Token" className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs mb-2 outline-none text-slate-900" />
                        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 text-[11px] rounded transition-colors">
                          Kết Nối Facebook Graph API
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs leading-relaxed text-indigo-300">
                      <strong>Lưu ý:</strong> Tính năng Auto-Post đòi hỏi các nền tảng thứ 3 cấp quyền truy cập API (Thường dành cho tài khoản Đại lý/Doanh nghiệp). Nếu bạn chưa có API Key, liên hệ bộ phận hỗ trợ của nền tảng đó để được cấp.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
            TAB 5: SEO global metas settings
            ========================================================= */}
            {activeTab === "seo" && (
              <div className="space-y-6 max-w-xl mx-auto" id="seo-workspace">
                <div className="bg-slate-50 border border-slate-200 px-[10px] py-[10px] rounded-lg">
                  <h3 className="font-display font-medium text-slate-900 text-base text-left border-b border-slate-200 pb-0 tracking-wider">
                    Thiết Lập SEO
                  </h3>

                  <form
                    onSubmit={handleSaveSEO}
                    className="space-y-4 pt-[5px] text-left"
                  >
                    <div className="space-y-1 mb-[5px]">
                      <label className="text-[10px] font-bold text-slate-700">
                        Meta Title (Tiêu Đề Trang Tìm Kiếm)
                      </label>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3  py-[10px] text-[10px] text-slate-900 outline-none"
                      />
                    </div>

                    <div className="space-y-1 mb-[5px]">
                      <label className="text-[10px] font-bold text-slate-700">
                        Meta Description (Mô Tả Thu Hút Người Tìm)
                      </label>
                      <textarea
                        value={seoDesc}
                        onChange={(e) => setSeoDesc(e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700">
                        Meta Keywords (Từ Khóa Tiết Lộ Google)
                      </label>
                      <input
                        type="text"
                        value={seoKeywords}
                        onChange={(e) => setSeoKeywords(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-primary hover:bg-amber-600 text-white font-bold py-3 px-5 rounded-lg text-xs transition-all tracking-wider"
                      >
                        Lưu
                      </button>
                    </div>
                  </form>
                </div>

                {/* Logo Configuration Card */}
                <div className="bg-slate-50 border border-slate-200 px-[10px] py-[5px] rounded-lg">
                  <h3 className="font-display font-medium text-slate-900 text-base text-left border-b border-slate-200 pb-0 h-[36px] tracking-wider flex items-center gap-2">
                    <Image className="w-4 h-d+ text-primary" />
                    <span>Thiết Lập Logo</span>
                  </h3>

                  <div className="pt-[10px] text-left space-y-5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 mb-2.5">
                        Xem Trước Logo Hiện Tại
                      </p>
                      <div className="p-5 bg-white border border-slate-200 rounded-lg flex items-center justify-center min-h-[90px] shadow-inner">
                        {logoUrl ? (
                          <div className="relative group/logo">
                            <img loading="lazy" decoding="async"
                              src={(logoUrl) || undefined}
                              alt="Greenia Homes Brand Logo"
                              className="h-4 max-h-12 w-auto object-contain"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                              <span className="text-[9px] font-mono text-slate-800">
                                Chiều cao khuyên dùng: 32-48px
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="bg-primary text-white p-2 rounded-lg">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div className="text-left font-display font-bold">
                              <span className="text-slate-900 text-sm block leading-none">
                                Greenia{" "}
                                <span className="text-primary">Homes</span>
                              </span>
                              <span className="text-[7.5px] font-bold text-slate-700 tracking-widest mt-0.5 block">
                                Luxury Real Estate
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-700 block">
                        Tải Tập Tin Logo Mới Lên
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="bg-primary hover:bg-amber-600 active:scale-[0.98] text-white font-bold py-2.5 px-4 rounded-lg text-xs cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10">
                          <Plus className="w-4 h-4" />
                          <span>Chọn file logo ảnh</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, "logoUrl")}
                          />
                        </label>

                        {logoUrl && (
                          <button
                            type="button"
                            onClick={async () => {
                              await setDoc(
                                doc(db, "settings", "general"),
                                { logoUrl: "" },
                                { merge: true },
                              );
                              onShowNotification(
                                "Khôi phục logo mặc định thành công!",
                                "success",
                              );
                            }}
                            className="bg-white hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold py-2.5 px-4 rounded-lg text-xs transition-all"
                          >
                            Khôi phục về mặc định
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
                        Hệ thống tự động đồng bộ hóa hình ảnh lên máy chủ lưu
                        trữ lâu dài. Định dạng tốt nhất là PNG nền trong suốt
                        (transparent).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
            TAB 6: Google Services configuration
            ========================================================= */}
            {activeTab === "google" && (
              <div className="space-y-6 mx-auto" id="google-workspace">
                {/* Header and Service Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-3 md:pb-4">
                  <h3 className="font-display font-medium text-slate-900 text-base md:text-lg flex items-center gap-2 tracking-wider">
                    <Activity className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    <span>Google Tracking & Quản Trị</span>
                  </h3>
                  <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1 overflow-x-auto w-full md:w-auto [&::-webkit-scrollbar]:hidden">
                    {(
                      [
                        "ga4",
                        "gtm",
                        "ads",
                        "adsense",
                        "fb",
                        "tiktok",
                        "cookie",
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setGoogleServiceTab(tab)}
                        className={`px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold tracking-wider rounded-md transition-all whitespace-nowrap ${googleServiceTab === tab
                            ? "bg-primary text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                          }`}
                      >
                        {tab === "ga4"
                          ? "Analytics (GA4)"
                          : tab === "gtm"
                            ? "Tag Manager"
                            : tab === "ads"
                              ? "Google Ads"
                              : tab === "adsense"
                                ? "AdSense"
                                : tab === "fb"
                                  ? "Facebook Pixel"
                                  : tab === "tiktok"
                                    ? "TikTok Pixel"
                                    : "Cookie Consent"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Config Form */}
                  <div className="lg:col-span-1 border-slate-200 rounded-lg flex flex-col justify-start space-y-4 text-left">
                    <form
                      onSubmit={handleSaveSEO}
                      className="bg-slate-50 border border-slate-200 p-4 md:p-6 rounded-lg space-y-4 md:space-y-5"
                    >
                      <div className="pb-3 border-b border-slate-200">
                        <h4 className="text-slate-900 text-sm font-bold tracking-wider text-primary-light">
                          {googleServiceTab === "ga4" &&
                            "Cấu hình Google Analytics"}
                          {googleServiceTab === "gtm" && "Cấu hình Tag Manager"}
                          {googleServiceTab === "ads" && "Cấu hình Google Ads"}
                          {googleServiceTab === "adsense" && "Cấu hình AdSense"}
                          {googleServiceTab === "fb" &&
                            "Cấu hình Facebook Pixel"}
                          {googleServiceTab === "tiktok" &&
                            "Cấu hình TikTok Pixel"}
                          {googleServiceTab === "cookie" &&
                            "Popup Phân quyền Cookie"}
                        </h4>
                        <p className="text-[10px] text-slate-700 font-light mt-1">
                          Đảm bảo nhập mã chính xác từ tài khoản của bạn để hệ
                          thống tracking đúng.
                        </p>
                      </div>

                      {googleServiceTab === "ga4" && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-800 flex items-center gap-2">
                            GA4 Measurement ID
                          </label>
                          <input
                            type="text"
                            value={googleAnalyticsId}
                            onChange={(e) =>
                              setGoogleAnalyticsId(e.target.value)
                            }
                            placeholder="Ví dụ: G-XXXXXXXXXX"
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 md:py-3 md:px-4 text-xs md:text-sm text-slate-900 outline-none font-mono focus:border-primary/50 transition-all shadow-inner"
                          />
                        </div>
                      )}

                      {googleServiceTab === "gtm" && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-800">
                            Container ID (GTM)
                          </label>
                          <input
                            type="text"
                            value={googleTagId}
                            onChange={(e) => setGoogleTagId(e.target.value)}
                            placeholder="Ví dụ: GTM-XXXXXXX"
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 md:py-3 md:px-4 text-xs md:text-sm text-slate-900 outline-none font-mono focus:border-primary/50 transition-all shadow-inner"
                          />
                        </div>
                      )}

                      {googleServiceTab === "ads" && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-800">
                            Conversion ID
                          </label>
                          <input
                            type="text"
                            value={googleAdsId}
                            onChange={(e) => setGoogleAdsId(e.target.value)}
                            placeholder="Ví dụ: AW-XXXXXXXXXX"
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 md:py-3 md:px-4 text-xs md:text-sm text-slate-900 outline-none font-mono focus:border-primary/50 transition-all shadow-inner"
                          />
                          <p className="text-[10px] text-slate-700 font-light mt-1">
                            ID tự động gắn cho các sự kiện Conversion (Contact,
                            Signup).
                          </p>
                        </div>
                      )}

                      {googleServiceTab === "adsense" && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-800">
                            Mã nhúng vùng quảng cáo
                          </label>
                          <textarea
                            value={googleAdSenseCode}
                            onChange={(e) =>
                              setGoogleAdSenseCode(e.target.value)
                            }
                            placeholder="<script async src='https://pagead2...></script>"
                            rows={6}
                            className="w-full bg-white border border-emerald-900/50 rounded-lg py-2 px-3 md:py-3 md:px-4 text-emerald-400 outline-none font-mono text-[10px] md:text-xs leading-relaxed focus:border-primary/30 transition-all shadow-inner"
                          />
                        </div>
                      )}

                      {googleServiceTab === "fb" && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-800 flex items-center gap-2">
                              Facebook Meta Pixel ID
                            </label>
                            <input
                              type="text"
                              value={facebookPixelId}
                              onChange={(e) => setFacebookPixelId(e.target.value)}
                              placeholder="Ví dụ: 1042XXXXXXXXXX"
                              className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 md:py-3 md:px-4 text-xs md:text-sm text-slate-900 outline-none font-mono focus:border-primary/50 transition-all shadow-inner"
                            />
                            <p className="text-[10px] text-slate-700 font-light mt-1">
                              Hệ thống Pixel tự động theo dõi PageView,
                              ViewContent.
                            </p>
                          </div>


                        </div>
                      )}

                      {googleServiceTab === "tiktok" && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-800 flex items-center gap-2">
                            TikTok Pixel ID
                          </label>
                          <input
                            type="text"
                            value={tiktokPixelId}
                            onChange={(e) => setTiktokPixelId(e.target.value)}
                            placeholder="Ví dụ: C3T4XXXXXXXXXX"
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 md:py-3 md:px-4 text-xs md:text-sm text-slate-900 outline-none font-mono focus:border-primary/50 transition-all shadow-inner"
                          />
                        </div>
                      )}

                      {googleServiceTab === "cookie" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
                            <div>
                              <label className="text-sm font-bold text-slate-900 mb-1 block">
                                Bật Popup Cookie Consent
                              </label>
                              <p className="text-[10px] text-slate-700 font-light">
                                Bắt buộc người dùng chấp nhận chính sách trước
                                khi chèn tracking (Theo luật GDPR/CCPA).
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setCookieConsentEnabled(!cookieConsentEnabled)
                              }
                              className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${cookieConsentEnabled ? "bg-primary" : "bg-slate-700"}`}
                            >
                              <div
                                className={`w-5 h-5 bg-white rounded-full transition-transform absolute ${cookieConsentEnabled ? "translate-x-6" : "translate-x-1"}`}
                              />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-accent text-white font-bold py-3 px-4 rounded-lg text-xs transition-all tracking-wider disabled:opacity-50"
                        >
                          {loading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Lưu Mã Tracking
                        </button>
                      </div>
                    </form>

                    <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-lg flex items-start gap-3">
                      <Activity className="w-5 h-5 text-blue-400 shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-blue-300 mb-1">
                          Mô phỏng dữ liệu Tracking
                        </p>
                        <p className="text-[10px] text-slate-700 font-light leading-relaxed">
                          Vì mục đích bảo mật, dữ liệu biểu đồ bên phải là thông
                          số mô phỏng hiển thị cho {googleServiceTab}. Để xem
                          đầy đủ báo cáo thời gian thực, vui lòng truy cập trang
                          quản trị gốc của dịch vụ.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Chart & Metrics */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Micro metrics card top row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                      {googleServiceTab === "ga4" && (
                        <>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left">
                            <span className="text-[9px] text-slate-700 tracking-widest block mb-1">
                              Kích hoạt
                            </span>
                            <div className="flex items-end gap-2">
                              <span className="text-xl md:text-2xl font-bold text-slate-900">
                                45.2K
                              </span>
                              <TrendingUp className="w-3 h-3 text-emerald-400 mb-1.5" />
                            </div>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left">
                            <span className="text-[9px] text-slate-700 tracking-widest block mb-1">
                              Thời gian
                            </span>
                            <div className="flex items-end gap-2">
                              <span className="text-xl md:text-2xl font-bold text-slate-900">
                                2m 14s
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left">
                            <span className="text-[9px] text-slate-700 tracking-widest block mb-1">
                              Tỷ lệ thoát
                            </span>
                            <div className="flex items-end gap-2">
                              <span className="text-xl md:text-2xl font-bold text-slate-900">
                                41.8%
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                      {googleServiceTab === "gtm" && (
                        <>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left col-span-2 md:col-span-3">
                            <span className="text-[9px] text-emerald-400 tracking-widest font-bold block mb-1 flex items-center gap-1.5">
                              <CheckCircle className="w-3 h-3" /> GTM: ACTIVE
                            </span>
                            <p className="text-xs md:text-sm text-slate-800 mt-2 font-light">
                              Các sự kiện cấu hình: Page View, Button Clicks.
                            </p>
                          </div>
                        </>
                      )}
                      {googleServiceTab === "ads" && (
                        <>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left">
                            <span className="text-[9px] text-slate-700 tracking-widest block mb-1">
                              Lượt Nhấp
                            </span>
                            <div className="flex items-end gap-2">
                              <span className="text-xl md:text-2xl font-bold text-slate-900">
                                12.4K
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left">
                            <span className="text-[9px] text-slate-700 tracking-widest block mb-1">
                              Chi Phí
                            </span>
                            <div className="flex items-end gap-2">
                              <span className="text-xl md:text-2xl font-bold text-slate-900">
                                1.2tr
                              </span>
                              <span className="text-[10px] text-slate-700 mb-1 hidden md:inline">
                                VND
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left relative col-span-2 md:col-span-1">
                            <div className="absolute top-0 right-0 bg-blue-500/10 border-b border-l border-blue-500/25 text-[8px] text-blue-400 px-1.5 py-0.5 rounded-bl font-bold">
                              ROAS
                            </div>
                            <span className="text-[9px] text-slate-700 tracking-widest block mb-1">
                              Chuyển đổi
                            </span>
                            <div className="flex items-end gap-2">
                              <span className="text-xl md:text-2xl font-bold text-rose-400">
                                238
                              </span>
                              <TrendingUp className="w-3 h-3 text-emerald-400 mb-1.5" />
                            </div>
                          </div>
                        </>
                      )}
                      {googleServiceTab === "adsense" && (
                        <>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left">
                            <span className="text-[9px] text-slate-700 tracking-widest block mb-1">
                              Lượt hiển thị
                            </span>
                            <div className="flex items-end gap-2">
                              <span className="text-xl md:text-2xl font-bold text-slate-900">
                                89.1K
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left">
                            <span className="text-[9px] text-slate-700 tracking-widest block mb-1">
                              RPM Trang
                            </span>
                            <div className="flex items-end gap-2">
                              <span className="text-xl md:text-2xl font-bold text-slate-900">
                                $4.20
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left relative col-span-2 md:col-span-1">
                            <div className="absolute top-0 right-0 bg-primary/10 border-b border-l border-primary/25 text-[8px] text-primary px-1.5 py-0.5 rounded-bl font-bold">
                              HOT
                            </div>
                            <span className="text-[9px] text-slate-700 tracking-widest block mb-1">
                              Tổng Doanh Thu
                            </span>
                            <div className="flex items-end gap-2">
                              <span className="text-xl md:text-2xl font-bold text-primary-light">
                                $374.5
                              </span>
                              <TrendingUp className="w-3 h-3 text-emerald-400 mb-1.5" />
                            </div>
                          </div>
                        </>
                      )}
                      {googleServiceTab === "fb" && (
                        <>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left">
                            <span className="text-[9px] text-slate-700 tracking-widest block mb-1">
                              Tổng Sự kiện
                            </span>
                            <div className="flex items-end gap-2">
                              <span className="text-xl md:text-2xl font-bold text-slate-900">
                                1,520
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left">
                            <span className="text-[9px] text-slate-700 tracking-widest block mb-1">
                              Chuyển đổi
                            </span>
                            <div className="flex items-end gap-2">
                              <span className="text-xl md:text-2xl font-bold text-slate-900">
                                3.4%
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left relative col-span-2 md:col-span-1">
                            <div className="absolute top-0 right-0 bg-blue-500/10 border-b border-l border-blue-500/25 text-[8px] text-blue-400 px-1.5 py-0.5 rounded-bl font-bold">
                              META
                            </div>
                            <span className="text-[9px] text-slate-700 tracking-widest block mb-1">
                              KH Mới
                            </span>
                            <div className="flex items-end gap-2">
                              <span className="text-xl md:text-2xl font-bold text-blue-400">
                                54
                              </span>
                              <TrendingUp className="w-3 h-3 text-emerald-400 mb-1.5" />
                            </div>
                          </div>
                        </>
                      )}
                      {googleServiceTab === "tiktok" && (
                        <>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left">
                            <span className="text-[9px] text-slate-700 tracking-widest block mb-1">
                              Tổng Sự kiện
                            </span>
                            <div className="flex items-end gap-2">
                              <span className="text-xl md:text-2xl font-bold text-slate-900">
                                980
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left">
                            <span className="text-[9px] text-slate-700 tracking-widest block mb-1">
                              Chuyển đổi
                            </span>
                            <div className="flex items-end gap-2">
                              <span className="text-xl md:text-2xl font-bold text-slate-900">
                                2.8%
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left relative col-span-2 md:col-span-1">
                            <div className="absolute top-0 right-0 bg-purple-500/10 border-b border-l border-purple-500/25 text-[8px] text-purple-400 px-1.5 py-0.5 rounded-bl font-bold">
                              TIKTOK
                            </div>
                            <span className="text-[9px] text-slate-700 tracking-widest block mb-1">
                              KH Mới
                            </span>
                            <div className="flex items-end gap-2">
                              <span className="text-xl md:text-2xl font-bold text-purple-400">
                                28
                              </span>
                              <TrendingUp className="w-3 h-3 text-emerald-400 mb-1.5" />
                            </div>
                          </div>
                        </>
                      )}
                      {googleServiceTab === "cookie" && (
                        <>
                          <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-lg text-left col-span-2 md:col-span-3">
                            <span className="text-[9px] text-emerald-400 tracking-widest font-bold block mb-1 flex items-center gap-1.5">
                              <CheckCircle className="w-3 h-3" /> GDPR/CCPA
                              Compliance{" "}
                            </span>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-3">
                              <div className="flex-1 bg-white rounded p-2 md:p-3 text-center border border-slate-200">
                                <span className="block text-xl md:text-2xl font-bold text-slate-900 mb-1">
                                  84%
                                </span>
                                <span className="text-[10px] text-slate-700 ">
                                  Chấp nhận
                                </span>
                              </div>
                              <div className="flex-1 bg-white rounded p-2 md:p-3 text-center border border-slate-200">
                                <span className="block text-xl md:text-2xl font-bold text-slate-900 mb-1">
                                  16%
                                </span>
                                <span className="text-[10px] text-slate-700 ">
                                  Từ chối
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Main Graph Area */}
                    {googleServiceTab !== "cookie" &&
                      googleServiceTab !== "gtm" && (
                        <div className="bg-slate-50 border border-slate-200 p-4 md:p-6 rounded-lg text-left">
                          <h4 className="font-bold text-slate-900 text-xs md:text-sm mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                            <span>
                              {googleServiceTab === "ga4" &&
                                "Biểu Đồ Lưu Lượng Báo Cáo"}
                              {googleServiceTab === "ads" &&
                                "Lượt Nhấp & Chuyển Đổi"}
                              {googleServiceTab === "adsense" &&
                                "Doanh Thu Ước Tính"}
                              {googleServiceTab === "fb" &&
                                "Sự kiện Facebook Pixel"}
                              {googleServiceTab === "tiktok" &&
                                "Sự kiện TikTok Pixel"}
                            </span>
                            <span className="text-[10px] text-slate-700 font-mono font-medium px-2 py-1 bg-white rounded self-start sm:self-auto">
                              7 NGÀY GẦN NHẤT
                            </span>
                          </h4>
                          <div className="h-[200px] md:h-[250px] w-full mt-2 md:mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={
                                  (googleServiceTab === "ads"
                                    ? adsChartData
                                    : googleServiceTab === "adsense"
                                      ? adsenseChartData
                                      : googleServiceTab === "fb"
                                        ? fbPixelChartData
                                        : googleServiceTab === "tiktok"
                                          ? tkPixelChartData
                                          : ga4ChartData) as any
                                }
                                margin={{
                                  top: 10,
                                  right: 10,
                                  left: -20,
                                  bottom: 0,
                                }}
                              >
                                <defs>
                                  <linearGradient
                                    id="colorMain"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    {googleServiceTab === "adsense" ? (
                                      <>
                                        <stop
                                          offset="5%"
                                          stopColor="#d4af37"
                                          stopOpacity={0.3}
                                        />
                                        <stop
                                          offset="95%"
                                          stopColor="#d4af37"
                                          stopOpacity={0}
                                        />
                                      </>
                                    ) : googleServiceTab === "ads" ? (
                                      <>
                                        <stop
                                          offset="5%"
                                          stopColor="#fb7185"
                                          stopOpacity={0.3}
                                        />
                                        <stop
                                          offset="95%"
                                          stopColor="#fb7185"
                                          stopOpacity={0}
                                        />
                                      </>
                                    ) : googleServiceTab === "fb" ? (
                                      <>
                                        <stop
                                          offset="5%"
                                          stopColor="#3b82f6"
                                          stopOpacity={0.3}
                                        />
                                        <stop
                                          offset="95%"
                                          stopColor="#3b82f6"
                                          stopOpacity={0}
                                        />
                                      </>
                                    ) : googleServiceTab === "tiktok" ? (
                                      <>
                                        <stop
                                          offset="5%"
                                          stopColor="#c084fc"
                                          stopOpacity={0.3}
                                        />
                                        <stop
                                          offset="95%"
                                          stopColor="#c084fc"
                                          stopOpacity={0}
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <stop
                                          offset="5%"
                                          stopColor="#3b82f6"
                                          stopOpacity={0.3}
                                        />
                                        <stop
                                          offset="95%"
                                          stopColor="#3b82f6"
                                          stopOpacity={0}
                                        />
                                      </>
                                    )}
                                  </linearGradient>
                                </defs>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#1e293b"
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="name"
                                  stroke="#475569"
                                  fontSize={10}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <YAxis
                                  stroke="#475569"
                                  fontSize={10}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#020617",
                                    borderColor: "#1e293b",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                  }}
                                  itemStyle={{
                                    color: "#fff",
                                    fontWeight: "bold",
                                  }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey={
                                    googleServiceTab === "ads"
                                      ? "conversions"
                                      : googleServiceTab === "adsense"
                                        ? "revenue"
                                        : googleServiceTab === "fb" ||
                                          googleServiceTab === "tiktok"
                                          ? "events"
                                          : "views"
                                  }
                                  stroke={
                                    googleServiceTab === "adsense"
                                      ? "#d4af37"
                                      : googleServiceTab === "ads"
                                        ? "#fb7185"
                                        : googleServiceTab === "fb"
                                          ? "#3b82f6"
                                          : googleServiceTab === "tiktok"
                                            ? "#c084fc"
                                            : "#3b82f6"
                                  }
                                  strokeWidth={2}
                                  fillOpacity={1}
                                  fill="url(#colorMain)"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
            TAB: Blocked IPs
            ========================================================= */}
            {activeTab === ("blocked_ips" as any) && (
              <div className="space-y-6 mx-auto" id="blocked-ips-workspace">
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg text-left">
                  <div className="mb-6">
                    <h3 className="font-display font-medium text-slate-900 text-lg flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-500" />
                      Danh sách chặn IP (Chống Spam)
                    </h3>
                    <p className="text-sm text-slate-700 mt-1">
                      Nhập địa chỉ IP của khách hàng vào đây để hệ thống tự động
                      chặn gửi yêu cầu thư nhắc gửi vào email hoặc hệ thống.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <input
                      type="text"
                      placeholder="Nhập địa chỉ IP (ví dụ: 192.168.1.1)"
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:border-primary/50 outline-none transition-colors"
                      value={newBlockedIp}
                      onChange={(e) => setNewBlockedIp(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddBlockedIp()
                      }
                    />
                    <button
                      onClick={handleAddBlockedIp}
                      disabled={loading || !newBlockedIp}
                      className="px-6 py-2.5 bg-primary hover:bg-amber-600 disabled:bg-zinc-800 disabled:text-slate-500 text-white rounded-lg text-sm font-semibold tracking-wide transition-colors flex items-center gap-2 justify-center"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm IP
                    </button>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto w-full">
                    {blockedIps.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        Hiện chưa có IP nào bị chặn.
                      </div>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-zinc-900/50">
                            <th className="px-6 py-4 font-medium text-slate-800">
                              Địa chỉ IP
                            </th>
                            <th className="px-6 py-4 font-medium text-slate-800 w-24 text-center">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {blockedIps.map((ip, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/50 transition-colors"
                            >
                              <td className="px-6 py-4 text-slate-800 font-mono">
                                {ip}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleRemoveBlockedIp(ip)}
                                  className="w-8 h-8 flex items-center justify-center rounded bg-slate-100 hover:bg-red-500/20 text-slate-700 hover:text-red-500 transition-colors mx-auto"
                                  title="Bỏ chặn"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}



            {/* =========================================================
            DYNAMIC TAB: Media Gallery Browser (Image Library)
            ========================================================= */}
            {activeTab === ("gallery" as any) && (
              <div className="space-y-6 text-left relative" id="gallery-workspace">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-200 p-6 rounded-lg gap-3 mb-6">
                  <div>
                    <h3 className="font-display font-medium text-slate-900 text-base tracking-wider flex items-center gap-2">
                      <Image className="w-5 h-5 text-primary" />
                      <span>Kho Thư Viện Hình Ảnh</span>
                    </h3>
                    <p className="text-slate-700 text-xs mt-1">
                      Đang hiển thị {libraryImages.length} tài nguyên ảnh đã sử
                      dụng trên hệ thống Greenia Homes. Nhấp nút dưới để copy
                      link ảnh hoặc tái sử dụng trực tiếp khi tạo bài viết mới.
                    </p>
                  </div>
                </div>

                {/* Floating Bulk Action Bar */}
                {selectedGalleryImages.length > 0 && (
                  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 fade-in duration-300">
                    <div className="flex items-center gap-4 bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl shadow-black/20 border border-slate-200/50">
                      <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
                        <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
                          {selectedGalleryImages.length}
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Đã chọn</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleBulkDeleteImages}
                          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          Xóa {selectedGalleryImages.length} ảnh
                        </button>
                        <button
                          onClick={() => setSelectedGalleryImages([])}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-5 py-2.5 rounded-xl transition-all active:scale-95"
                        >
                          Hủy chọn
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {libraryImages.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-slate-700 text-sm">
                      Chưa có hình ảnh nào được tải lên hoặc ghi nhận trong hệ
                      thống.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {libraryImages.map((imgUrl, index) => (
                      <div
                        key={index}
                        className={`bg-slate-50 border rounded-lg overflow-hidden group hover:border-primary/50 transition-all shadow-md relative ${selectedGalleryImages.includes(imgUrl) ? 'border-primary ring-2 ring-primary/30' : 'border-slate-200'}`}
                      >
                        <div className="absolute top-2 left-2 z-10">
                          <input
                            type="checkbox"
                            checked={selectedGalleryImages.includes(imgUrl)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGalleryImages(prev => [...prev, imgUrl]);
                              } else {
                                setSelectedGalleryImages(prev => prev.filter(u => u !== imgUrl));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer shadow-sm"
                          />
                        </div>
                        <div className="aspect-[4/3] w-full overflow-hidden bg-white relative">
                          <img loading="lazy" decoding="async"
                            src={(imgUrl) || undefined}
                            alt={`Thư viện #${index}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(imgUrl);
                                onShowNotification(
                                  "Đã sao chép liên kết ảnh thành công!",
                                  "success",
                                );
                              }}
                              className="bg-primary hover:bg-amber-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer "
                            >
                              Sao chép Link
                            </button>
                            <button
                              onClick={() => handleDeleteSingleImage(imgUrl)}
                              className="bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer mt-1"
                            >
                              Xóa ảnh
                            </button>
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col justify-between">
                          <span className="text-[10px] font-mono text-slate-700 truncate block">
                            Hình ảnh #{index + 1}
                          </span>
                          <span
                            className="text-[9px] font-mono text-slate-500 truncate block mt-0.5"
                            title={imgUrl}
                          >
                            {imgUrl}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}



            {/* =========================================================
            TAB 6: Leads & CRM
            ========================================================= */}
            {activeTab === "leads" && (
              <div
                className="space-y-4 md:space-y-6 text-left relative"
                id="crm-workspace"
              >
                {!crmSelectedLead ? (
                  <div className="space-y-4 md:space-y-6 flex-1">
                    {/* CRM Header Dashboard */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3 mb-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setActiveTab("listings")}
                          className="p-1.5 bg-slate-100 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Quay lại Bảng Thống Kê"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                          <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-primary" />
                            Hệ thống CRM
                          </h3>
                          <p className="text-[11px] text-slate-700 mt-0.5">
                            Theo dõi, phân loại và quản lý toàn bộ vòng đời
                            khách hàng.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const headers = [
                              "Họ Tên",
                              "Số điện thoại",
                              "Email",
                              "Sản phẩm/Dự án quan tâm",
                              "Nội dung tin nhắn (Nhu cầu)",
                              "Trạng thái",
                              "Ngày tạo",
                              "Nhân viên phụ trách",
                              "Ghi chú (Admin)",
                              "IP Khách hàng",
                              "URL Nguồn",
                            ];
                            const rows = displayConsultations.map((c) => {
                              return [
                                `"${c.name || ""}"`,
                                `"${c.phone || ""}"`,
                                `"${c.email || ""}"`,
                                `"${c.propertyTitle || ""}"`,
                                `"${(c.message || c.demand || "").replace(/"/g, '""')}"`,
                                `"${c.status}"`,
                                `"${new Date(c.createdAt).toLocaleString("vi-VN")}"`,
                                `"${c.assignee || "Chưa giao"}"`,
                                `"${(c.notes || "").replace(/"/g, '""')}"`,
                                `"${c.ipAddress || ""}"`,
                                `"${c.sourceUrl || ""}"`,
                              ];
                            });
                            const csvContent =
                              "\uFEFF" +
                              [
                                headers.join(","),
                                ...rows.map((r) => r.join(",")),
                              ].join("\n");
                            const blob = new Blob([csvContent], {
                              type: "text/csv;charset=utf-8;",
                            });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.setAttribute("href", url);
                            link.setAttribute(
                              "download",
                              `danh_sach_crm_${new Date().getTime()}.csv`,
                            );
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="bg-[#064E3B]/20 text-accent border border-primary/30 hover:bg-primary hover:text-white px-2.5 py-1 text-[11px] font-bold rounded flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Xuất Excel
                        </button>
                      </div>
                    </div>

                    {/* Quick Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                      <div
                        className={`bg-slate-50 border px-3 py-2 h-[43.5px] rounded-lg cursor-pointer transition-colors ${dashboardFilter === "new" ? "border-primary bg-primary/10" : "border-zinc-800 hover:border-slate-600"}`}
                        onClick={() =>
                          setDashboardFilter(
                            dashboardFilter === "new" ? "all" : "new",
                          )
                        }
                      >
                        <span
                          className={`text-[9px] font-bold tracking-wider block mb-1 ${dashboardFilter === "new" ? "text-primary" : "text-slate-600"}`}
                        >
                          Khách Mới
                        </span>
                        <div
                          className={`text-[12px] leading-[12px] font-bold ${dashboardFilter === "new" ? "text-primary" : "text-slate-900"}`}
                        >
                          {
                            displayConsultations.filter(
                              (c) =>
                                c.status === "pending" || c.status === "new",
                            ).length
                          }
                        </div>
                      </div>
                      <div
                        className={`bg-slate-50 border px-3 py-2 h-[43.5px] rounded-lg cursor-pointer transition-colors ${dashboardFilter === "contacted" ? "border-sky-500 bg-sky-500/10" : "border-zinc-800 hover:border-slate-600"}`}
                        onClick={() =>
                          setDashboardFilter(
                            dashboardFilter === "contacted"
                              ? "all"
                              : "contacted",
                          )
                        }
                      >
                        <span
                          className={`text-[9px] font-bold tracking-wider block mb-1 ${dashboardFilter === "contacted" ? "text-sky-400" : "text-slate-600"}`}
                        >
                          Đã Liên Hệ
                        </span>
                        <div
                          className={`text-[12px] leading-[12px] font-bold ${dashboardFilter === "contacted" ? "text-sky-400" : "text-slate-900"}`}
                        >
                          {
                            displayConsultations.filter(
                              (c) =>
                                c.status === "processed" ||
                                c.status === "contacted",
                            ).length
                          }
                        </div>
                      </div>
                      <div
                        className={`bg-slate-50 border px-3 py-2 h-[43.5px] rounded-lg cursor-pointer transition-colors ${dashboardFilter === "negotiating" ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 hover:border-slate-600"}`}
                        onClick={() =>
                          setDashboardFilter(
                            dashboardFilter === "negotiating"
                              ? "all"
                              : "negotiating",
                          )
                        }
                      >
                        <span
                          className={`text-[9px] font-bold tracking-wider block mb-1 ${dashboardFilter === "negotiating" ? "text-purple-400" : "text-slate-600"}`}
                        >
                          Tiềm Năng
                        </span>
                        <div
                          className={`text-[12px] leading-[12px] font-bold ${dashboardFilter === "negotiating" ? "text-purple-400" : "text-slate-900"}`}
                        >
                          {
                            displayConsultations.filter(
                              (c) => c.status === "negotiating",
                            ).length
                          }
                        </div>
                      </div>
                      <div
                        className={`bg-slate-50 border px-3 py-2 h-[43.5px] rounded-lg cursor-pointer transition-colors ${dashboardFilter === "won" ? "border-primary bg-accent/10" : "border-zinc-800 hover:border-slate-600"}`}
                        onClick={() =>
                          setDashboardFilter(
                            dashboardFilter === "won" ? "all" : "won",
                          )
                        }
                      >
                        <span
                          className={`text-[9px] font-bold tracking-wider block mb-1 ${dashboardFilter === "won" ? "text-emerald-400" : "text-slate-600"}`}
                        >
                          Chốt thành công
                        </span>
                        <div
                          className={`text-[12px] leading-[12px] font-bold ${dashboardFilter === "won" ? "text-emerald-400" : "text-slate-900"}`}
                        >
                          {
                            displayConsultations.filter(
                              (c) => c.status === "won",
                            ).length
                          }
                        </div>
                      </div>
                      <div className="bg-slate-50 border px-3 py-2 h-[43.5px] border-slate-200 rounded-lg border-l-2 border-l-rose-500">
                        <span className="text-[9px] text-slate-700 font-bold tracking-wider block mb-1">
                          Tỉ lệ chuyển đổi
                        </span>
                        <div className="text-[12px] leading-[12px] font-bold text-slate-900">
                          {displayConsultations.length > 0
                            ? Math.round(
                              (displayConsultations.filter(
                                (c) => c.status === "won",
                              ).length /
                                displayConsultations.length) *
                              100,
                            )
                            : 0}
                          %
                        </div>
                      </div>
                      <div
                        className={`bg-slate-50 border px-3 py-2 h-[43.5px] rounded-lg cursor-pointer transition-colors ${dashboardFilter === "all" ? "border-primary bg-accent/10" : "border-zinc-800 hover:border-slate-600"}`}
                        onClick={() => setDashboardFilter("all")}
                      >
                        <span
                          className={`text-[9px] font-bold tracking-wider block mb-1 ${dashboardFilter === "all" ? "text-emerald-400" : "text-slate-600"}`}
                        >
                          Số Lượng
                        </span>
                        <div
                          className={`text-[12px] leading-[12px] font-bold ${dashboardFilter === "all" ? "text-emerald-400" : "text-slate-900"}`}
                        >
                          {displayConsultations.length}
                        </div>
                      </div>
                    </div>

                    {/* Bulk Selection Toolbar */}
                    {(currentUserRole === "admin" ||
                      currentUserRole === "editor") &&
                      selectedLeadIds.length > 0 && (
                        <div className="bg-slate-100 border border-primary/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-lg animate-in fade-in slide-in-from-bottom-2 z-10 sticky top-0">
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 shrink-0">
                              <CheckCircle className="w-4 h-4" /> Đã chọn{" "}
                              {selectedLeadIds.length} khách
                            </div>
                            <button
                              onClick={() => setSelectedLeadIds([])}
                              className="text-xs text-slate-700 hover:text-slate-900 px-2 cursor-pointer"
                            >
                              Bỏ chọn
                            </button>
                          </div>

                          <div className="flex items-center gap-2 w-full md:w-auto">
                            <UserPlus className="w-4 h-4 text-slate-700 hidden sm:block" />
                            <select
                              className="bg-slate-50 border border-slate-300 text-sm text-slate-900 px-3 py-1.5 rounded-lg outline-none focus:border-primary flex-1 min-w-[200px] cursor-pointer"
                              value={bulkAssignee}
                              onChange={(e) => setBulkAssignee(e.target.value)}
                            >
                              <option value="">-- Chọn nhân viên --</option>
                              {users
                                .filter((u) => u.role !== "user")
                                .map((u) => (
                                  <option key={u.id} value={u.email}>
                                    {u.employeeName || u.displayName || u.username || u.email}
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={handleBulkAssign}
                              className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-1.5 rounded-lg text-xs tracking-wider shrink-0 transition-colors cursor-pointer shadow-sm"
                            >
                              Giao việc
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Main CRM View Layer */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mt-4">
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-white border-b border-slate-200 text-[10px] font-bold text-slate-700 tracking-wider h-[30.5px]">
                              {(currentUserRole === "admin" ||
                                currentUserRole === "editor") && (
                                  <th className="px-2 sm:px-4 pt-[3px] pb-0 w-[40px]">
                                    <input
                                      type="checkbox"
                                      checked={
                                        displayConsultations.length > 0 &&
                                        selectedLeadIds.length ===
                                        displayConsultations.length
                                      }
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedLeadIds(
                                            displayConsultations.map((c) => c.id),
                                          );
                                        } else {
                                          setSelectedLeadIds([]);
                                        }
                                      }}
                                      className="w-3.5 h-3.5 rounded bg-slate-50 border-slate-300 text-primary focus:ring-primary/30 cursor-pointer"
                                    />
                                  </th>
                                )}
                              <th className="px-2 sm:px-4 pt-[3px] pb-0 whitespace-nowrap">
                                Khách hàng
                              </th>
                              <th className="hidden md:table-cell px-4 pt-[3px] pb-0 whitespace-nowrap">
                                IP khách hàng
                              </th>
                              <th className="hidden sm:table-cell px-2 sm:px-4 pt-[3px] pb-0">
                                Nhu cầu
                              </th>
                              <th className="hidden sm:table-cell px-2 sm:px-4 pt-[3px] pb-0">
                                Vị trí điền form
                              </th>
                              <th className="px-2 sm:px-4 pt-[3px] pb-0 whitespace-nowrap">
                                Trạng thái
                              </th>
                              <th className="hidden md:table-cell px-4 pt-[3px] pb-0">
                                Người chăm sóc
                              </th>
                              <th className="hidden lg:table-cell px-4 pt-[3px] pb-0 whitespace-nowrap">
                                Ngày tạo
                              </th>
                              <th className="px-2 sm:px-4 pt-[3px] pb-0 whitespace-nowrap"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {displayConsultations
                              .filter((c) => {
                                if (dashboardFilter === "all") return true;
                                if (dashboardFilter === "new")
                                  return (
                                    c.status === "pending" || c.status === "new"
                                  );
                                if (dashboardFilter === "contacted")
                                  return (
                                    c.status === "processed" ||
                                    c.status === "contacted"
                                  );
                                if (dashboardFilter === "negotiating")
                                  return c.status === "negotiating";
                                if (dashboardFilter === "won")
                                  return c.status === "won";
                                return true;
                              })
                              .map((lead) => {
                                const s = lead.status;
                                const mappedStatus =
                                  s === "pending"
                                    ? "new"
                                    : s === "processed"
                                      ? "contacted"
                                      : s;
                                return (
                                  <tr
                                    key={lead.id}
                                    className={`hover:bg-slate-100 transition-colors ${selectedLeadIds.includes(lead.id) ? "bg-primary/5" : ""}`}
                                  >
                                    {(currentUserRole === "admin" ||
                                      currentUserRole === "editor") && (
                                        <td
                                          className="px-2 sm:px-4 py-2"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={selectedLeadIds.includes(
                                              lead.id,
                                            )}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              toggleLeadSelection(lead.id);
                                            }}
                                            className="w-3.5 h-3.5 rounded bg-slate-50 border-slate-300 text-primary focus:ring-primary/30 cursor-pointer"
                                          />
                                        </td>
                                      )}
                                    <td className="px-2 sm:px-4 py-2">
                                      <div className="font-bold text-slate-900 sm:text-sm text-xs">
                                        {lead.name}
                                      </div>
                                      <div className="text-[10px] sm:text-xs text-slate-700 font-mono mt-0.5">
                                        {lead.phone}
                                      </div>
                                    </td>
                                    <td className="hidden md:table-cell px-4 py-0 text-xs font-mono text-slate-700">
                                      {lead.ipAddress || "---.---.---.---"}
                                    </td>
                                    <td className="hidden sm:table-cell px-2 sm:px-4 py-0">
                                      <div className="text-[11px] sm:text-xs text-slate-700 font-medium py-2 break-words max-w-[250px] whitespace-normal">
                                        {lead.message || lead.demand || <span className="text-slate-400 italic font-normal">Không có</span>}
                                      </div>
                                    </td>
                                    <td className="hidden sm:table-cell px-2 sm:px-4 py-0">
                                      <div className="text-[11px] sm:text-xs text-slate-700 font-medium py-2 break-words max-w-[200px] whitespace-normal">
                                        {lead.sourceUrl ? (
                                          <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline hover:text-primary-light transition-colors break-all">
                                            {lead.sourceUrl}
                                          </a>
                                        ) : (
                                          <span className="text-slate-400 italic font-normal">Không có</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 sm:px-4 py-0">
                                      <span
                                        className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded inline-block ${mappedStatus === "new"
                                            ? "bg-blue-500/20 text-blue-400"
                                            : mappedStatus === "contacted"
                                              ? "bg-primary/20 text-primary-light"
                                              : mappedStatus === "negotiating"
                                                ? "bg-purple-500/20 text-purple-400"
                                                : mappedStatus === "won"
                                                  ? "bg-accent/20 text-emerald-400"
                                                  : "bg-slate-700 text-slate-700"
                                          }`}
                                      >
                                        {mappedStatus === "new"
                                          ? "Khách mới"
                                          : mappedStatus === "contacted"
                                            ? "Đã liên hệ"
                                            : mappedStatus === "negotiating"
                                              ? "Tiềm năng"
                                              : mappedStatus === "won"
                                                ? "Chốt thành công"
                                                : mappedStatus}
                                      </span>
                                    </td>
                                    <td className="hidden md:table-cell px-4 py-0 text-xs font-mono font-medium text-primary-light/90">
                                      <div className="flex items-center gap-1.5 break-all max-w-[150px] py-2">
                                        <UserCheck className="w-3.5 h-3.5 text-accent/80 shrink-0" />{" "}
                                        {getAssigneeName(lead.assignee)}
                                      </div>
                                    </td>
                                    <td className="hidden lg:table-cell px-4 py-0 text-xs text-slate-500">
                                      {new Date(
                                        lead.createdAt,
                                      ).toLocaleDateString("vi-VN")}
                                    </td>
                                    <td className="px-2 sm:px-4 py-0 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => {
                                            setCrmSelectedLead(lead);
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                          }}
                                          className="bg-slate-100 hover:bg-slate-300 text-slate-900 p-2 rounded-lg transition-colors inline-block"
                                          title="Xem chi tiết"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        {(currentUserRole === "admin" ||
                                          currentUserRole === "editor") && (
                                            <button
                                              onClick={() =>
                                                handleDeleteLead(lead.id)
                                              }
                                              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-lg transition-colors inline-block"
                                              title="Xóa khách hàng"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            {displayConsultations.length === 0 && (
                              <tr>
                                <td
                                  colSpan={7}
                                  className="p-8 text-center text-slate-500"
                                >
                                  Hệ thống chưa có khách hàng nào.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col w-full shadow-sm animate-in fade-in zoom-in-95 duration-200">
                    {/* Header as Excel Tabs / Toolbar */}
                    <div className="px-3 py-0 border-b border-slate-300 bg-slate-50 flex justify-between items-center z-10 w-full shrink-0">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setCrmSelectedLead(null)}
                          className="cursor-pointer bg-slate-100 hover:bg-slate-300 text-slate-800 px-2 sm:px-3 py-[5px] rounded text-[10px] font-bold flex items-center gap-1 transition-colors border border-slate-300"
                        >
                          <ChevronLeft className="w-4 h-4" /> Đóng
                        </button>
                        <div>
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 font-mono leading-tight flex items-center gap-2">
                            <span className="truncate max-w-[150px] sm:max-w-[300px] inline-block">
                              {crmSelectedLead.name || "Khách hàng"}
                            </span>
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(currentUserRole === "admin" ||
                          currentUserRole === "editor") && (
                            <button
                              onClick={() => handleDeleteLead(crmSelectedLead.id)}
                              className="cursor-pointer text-[11px] text-rose-500 font-bold hover:text-rose-400 px-3 py-1.5 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 rounded flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </button>
                          )}
                      </div>
                    </div>

                    {/* Body Content - Spreadsheet layout */}
                    <div className="p-2 sm:p-4 overflow-y-auto w-full bg-white flex-1">
                      {/* Cập nhật thông tin chung - Dạng bảng ngang */}
                      <div className="bg-slate-50 border border-slate-300 rounded-lg mb-6 overflow-hidden flex flex-col w-full text-sm text-slate-800">
                        <div className="bg-slate-100 border-b border-slate-300 p-2 sm:p-3 font-bold text-slate-900 text-[10px] flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-primary" />{" "}
                          Thông tin liên lạc
                        </div>
                        <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] lg:grid-cols-[120px_1fr_120px_1fr]">
                          {/* Trạng Thái & Phụ Trách */}
                          <div className="bg-slate-100 text-slate-700 p-2 sm:p-3 border-b border-r border-slate-300 font-semibold text-[10px] sm:text-[11px] flex items-center">
                            Trạng thái
                          </div>
                          <div className="bg-white p-0 border-b lg:border-r border-slate-300 h-9 sm:h-10 lg:h-auto">
                            <select
                              value={
                                crmSelectedLead.status === "pending"
                                  ? "new"
                                  : crmSelectedLead.status === "processed"
                                    ? "contacted"
                                    : crmSelectedLead.status
                              }
                              onChange={(e) => {
                                const st = e.target.value;
                                handleUpdateLeadStatus(
                                  crmSelectedLead.id,
                                  st,
                                  crmSelectedLead.name,
                                );
                                setCrmSelectedLead({
                                  ...crmSelectedLead,
                                  status: st,
                                });
                              }}
                              className="w-full h-full bg-transparent border-none text-[11px] sm:text-xs text-primary-light px-2 sm:px-3 py-1 sm:py-2 outline-none cursor-pointer font-bold"
                            >
                              {[
                                "new",
                                "contacted",
                                "negotiating",
                                "won",
                                "lost",
                              ].map((st) => (
                                <option
                                  key={st}
                                  value={st}
                                  className="bg-slate-50 text-slate-800"
                                >
                                  {st === "new"
                                    ? "Khách mới"
                                    : st === "contacted"
                                      ? "Đã liên hệ"
                                      : st === "negotiating"
                                        ? "Tiềm năng"
                                        : st === "won"
                                          ? "Chốt thành công"
                                          : "Thất bại"}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="bg-slate-100 text-slate-700 p-2 sm:p-3 border-b border-r border-slate-300 font-semibold text-[10px] sm:text-[11px] flex items-center">
                            NV phụ trách
                          </div>
                          <div className="bg-white p-0 border-b border-slate-300 h-9 sm:h-10 lg:h-auto">
                            <select
                              className="w-full h-full bg-transparent border-none text-[11px] sm:text-xs text-slate-900 px-2 sm:px-3 py-1 sm:py-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              disabled={
                                currentUserRole !== "admin" &&
                                currentUserRole !== "editor"
                              }
                              value={crmSelectedLead.assignee || ""}
                              onChange={(e) => {
                                if (
                                  currentUserRole !== "admin" &&
                                  currentUserRole !== "editor"
                                )
                                  return;
                                const val = e.target.value;
                                if (val !== crmSelectedLead.assignee) {
                                  handleUpdateAssignee(
                                    crmSelectedLead.id,
                                    val,
                                    crmSelectedLead,
                                  );
                                  setCrmSelectedLead({
                                    ...crmSelectedLead,
                                    assignee: val,
                                  });
                                }
                              }}
                            >
                              <option value="">
                                -- Chưa giao NV --
                              </option>
                              {users
                                .filter((u) => u.role !== "user")
                                .map((u) => (
                                  <option
                                    key={u.id}
                                    value={u.email}
                                  >
                                    {u.employeeName || u.displayName || u.username || u.email}
                                  </option>
                                ))}
                              {crmSelectedLead.assignee &&
                                !users.find(
                                  (u) => u.email === crmSelectedLead.assignee,
                                ) && (
                                  <option
                                    value={crmSelectedLead.assignee}
                                    className="bg-slate-50"
                                  >
                                    {crmSelectedLead.assignee}
                                  </option>
                                )}
                            </select>
                          </div>

                          {/* Điện thoại & Mức độ */}
                          <div className="bg-slate-100 text-slate-700 p-2 sm:p-3 border-b border-r border-slate-300 font-semibold text-[10px] sm:text-[11px] flex items-center">
                            Điện thoại
                          </div>
                          <div className="bg-white p-2 sm:p-3 border-b lg:border-r border-slate-300 font-bold text-primary font-mono text-xs sm:text-sm flex items-center">
                            {crmSelectedLead.phone ? (
                              <a href={`tel:${crmSelectedLead.phone.replace(/[^0-9+]/g, '')}`} className="hover:underline inline-block">
                                {crmSelectedLead.phone}
                              </a>
                            ) : "Chưa cung cấp"}
                          </div>

                          <div className="bg-slate-100 text-slate-700 p-2 sm:p-3 border-b border-r border-slate-300 font-semibold text-[10px] sm:text-[11px] flex items-center">
                            Mức độ ưu tiên
                          </div>
                          <div className="bg-white p-0 border-b border-slate-300 h-9 sm:h-10 lg:h-auto">
                            <select
                              className="w-full h-full bg-transparent border-none text-[11px] sm:text-xs text-slate-800 px-2 sm:px-3 py-1 sm:py-2 outline-none cursor-pointer"
                              value={crmSelectedLead.priority || "medium"}
                              onChange={(e) => {
                                handleUpdateLeadField(
                                  crmSelectedLead.id,
                                  "priority",
                                  e.target.value,
                                  "Mức độ ưu tiên",
                                );
                                setCrmSelectedLead({
                                  ...crmSelectedLead,
                                  priority: e.target.value,
                                });
                              }}
                            >
                              <option value="high" className="bg-slate-50">
                                🔴 Cao (Gấp, Tiềm năng)
                              </option>
                              <option value="medium" className="bg-slate-50">
                                ⚡ Trung Bình
                              </option>
                              <option value="low" className="bg-slate-50">
                                ❄️ Thấp (Chỉ tham khảo)
                              </option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] lg:grid-cols-[120px_1fr]">
                          <div className="bg-slate-100 text-slate-700 p-2 sm:p-3 border-b border-r border-slate-300 font-semibold text-[10px] sm:text-[11px] flex items-center">
                            Email
                          </div>
                          <div className="bg-white p-2 sm:p-3 border-b border-slate-300 font-medium text-slate-900 break-words text-[11px] sm:text-xs flex items-center">
                            {crmSelectedLead.email ? (
                              <a href={`mailto:${crmSelectedLead.email}`} className="text-primary hover:underline">
                                {crmSelectedLead.email}
                              </a>
                            ) : "Chưa cung cấp"}
                          </div>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] lg:grid-cols-[120px_1fr]">
                          <div className="bg-slate-100 text-slate-700 p-2 sm:p-3 border-b lg:border-b-0 border-r border-slate-300 font-semibold text-[10px] sm:text-[11px] flex items-center">
                            Nhu cầu
                          </div>
                          <div className="bg-white p-2 sm:p-3 border-b lg:border-b-0 border-slate-300 font-medium text-slate-900 break-words text-[11px] sm:text-xs flex items-center">
                            {crmSelectedLead.propertyTitle?.replace?.(
                              /Giao diện liên hệ:\s*/i,
                              "",
                            ) || "Chưa xác định"}
                          </div>
                        </div>

                        {crmSelectedLead.images &&
                          crmSelectedLead.images.length > 0 && (
                            <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] lg:grid-cols-[120px_1fr] border-t border-slate-300">
                              <div className="bg-slate-100 text-slate-700 p-2 sm:p-3 border-b lg:border-b-0 border-r border-slate-300 font-semibold text-[10px] sm:text-[11px] flex items-center">
                                Ảnh đính kèm
                              </div>
                              <div className="bg-white p-2 sm:p-3 border-b lg:border-b-0 border-slate-300">
                                <div className="flex gap-2 flex-wrap">
                                  {crmSelectedLead.images.map(
                                    (img: string, idx: number) => (
                                      <a
                                        href={img}
                                        target="_blank"
                                        rel="noreferrer"
                                        key={idx}
                                        className="block border border-slate-600 w-12 h-12 sm:w-16 sm:h-16 hover:border-primary rounded overflow-hidden"
                                      >
                                        <img loading="lazy" decoding="async"
                                          src={(img) || undefined}
                                          alt={`Đính kèm`}
                                          className="w-full h-full object-cover"
                                        />
                                      </a>
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Bảng Lịch sử liên hệ - Dạng Excel Dọc */}
                      <div>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-2 gap-2">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-accent" />{" "}
                            Bảng cập nhật lịch sử chăm sóc
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Tạo ngày:{" "}
                            {new Date(
                              crmSelectedLead.createdAt,
                            ).toLocaleDateString("vi-VN")}{" "}
                            | Nguồn: {crmSelectedLead.source || "Website"}
                          </span>
                        </div>

                        <div className="overflow-x-auto w-full rounded-lg border border-slate-300">
                          <table className="w-full text-left text-sm text-slate-800 border-collapse bg-slate-50">
                            <thead>
                              <tr className="bg-slate-100 text-slate-900 text-[10px]">
                                <th className="border-b md:border-r border-slate-300 p-2 w-[70px] sm:w-[150px] font-bold">
                                  Thời gian
                                </th>
                                <th className="hidden sm:table-cell border-b md:border-r border-slate-300 p-2 w-[120px] font-bold">
                                  Người xử lý
                                </th>
                                <th className="border-b border-slate-300 p-2 font-bold text-primary">
                                  Nội dung
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Hàng nhập liệu mới ở trên cùng */}
                              <tr className="bg-primary/5 ">
                                <td className="border-b md:border-r border-slate-300 p-0 align-middle text-center text-[9px] sm:text-[10px] font-bold text-primary/50 tracking-widest">
                                  Ghi chú
                                </td>
                                <td
                                  colSpan={2}
                                  className="border-b border-slate-300 p-0 bg-white relative"
                                >
                                  <div className="flex min-h-[32px]">
                                    <textarea
                                      id="care-history-input"
                                      className="w-full h-full bg-transparent border-none py-1.5 px-2 sm:px-3 text-xs text-slate-900 outline-none resize-none"
                                      placeholder="Nội dung"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const el = document.getElementById(
                                          "care-history-input",
                                        ) as HTMLTextAreaElement;
                                        if (el && el.value.trim()) {
                                          handleAddCareHistory(
                                            crmSelectedLead,
                                            el.value.trim(),
                                          );
                                          el.value = "";
                                        }
                                      }}
                                      className="bg-amber-600 hover:bg-primary text-white font-bold px-2 sm:px-4 py-0 transition-colors shrink-0 flex flex-row items-center justify-center gap-1 text-[9px] sm:text-[10px]"
                                    >
                                      <span>Cập nhật</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {!crmSelectedLead.careHistory ||
                                crmSelectedLead.careHistory.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={3}
                                    className="border-b border-slate-300 p-6 text-center text-slate-500 text-xs italic"
                                  >
                                    Chưa có ghi chú chăm sóc nào. Hãy nhập ở
                                    dòng trên.
                                  </td>
                                </tr>
                              ) : (
                                [...crmSelectedLead.careHistory]
                                  .reverse()
                                  .map((item: any, idx: number) => (
                                    <tr
                                      key={idx}
                                      className="hover:bg-zinc-800/50 transition-colors"
                                    >
                                      <td className="border-b md:border-r border-slate-300 p-2 text-[9px] sm:text-[10px] font-mono text-slate-700 align-top">
                                        <div className="flex flex-col">
                                          <span>
                                            {new Date(item.time).toLocaleDateString("vi-VN")} {new Date(item.time).toLocaleTimeString("vi-VN", {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                          <span className="sm:hidden font-bold text-slate-800 mt-1">
                                            {item.author || "Nhân viên"}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="hidden sm:table-cell border-b md:border-r border-slate-300 p-2 text-[11px] font-bold text-slate-800 align-top">
                                        {item.author || "Nhân viên"}
                                      </td>
                                      <td className="border-b border-slate-300 p-2 text-[11px] sm:text-xs text-slate-900 max-w-[200px] sm:max-w-none break-words whitespace-pre-wrap leading-relaxed align-top">
                                        {item.note}
                                      </td>
                                    </tr>
                                  ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================
            DYNAMIC TAB: new content creation wizard (WordPress-like editor)
            ========================================================= */}
            {activeTab === ("new_wizard" as any) && (
              <div
                className="max-w-[1000px] mx-auto space-y-6 text-left"
                id="news-wizard-creation-deck"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (editingItemId) setEditingItemId(null);
                      if (createType === "product") setActiveTab("listings");
                      else if (createType === "project") setActiveTab("projects");
                      else setActiveTab("articles");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Quay lại
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (editingItemId) setEditingItemId(null);
                        setActiveTab("listings");
                      }}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded transition-colors ${createType === "product" ? "bg-primary text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
                    >
                      Sản phẩm
                    </button>
                    {(currentUserRole === "admin" ||
                      currentUserRole === "editor") && (
                        <button
                          onClick={() => {
                            if (editingItemId) setEditingItemId(null);
                            setActiveTab("projects");
                          }}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded transition-colors ${createType === "project" ? "bg-primary text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
                        >
                          Dự án
                        </button>
                      )}
                    <button
                      onClick={() => {
                        if (editingItemId) setEditingItemId(null);
                        setActiveTab("articles");
                      }}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded transition-colors ${createType === "article" ? "bg-primary text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
                    >
                      Tin tức
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={handleCreateContent}
                  className="bg-slate-50 border border-slate-200 p-0 rounded-lg space-y-5 w-full"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 px-2.5">
                    {/* Title */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] text-slate-700 font-bold font-display">
                        Tiêu Đề / Tên Gọi
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ví dụ: Lâu đài Chateau Phú Mỹ Hưng, Vinhomes Can Gio..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none focus:border-primary"
                        required
                      />
                    </div>

                    {createType !== "article" && (
                      <>
                        {/* Price display string */}
                        <div className="space-y-1 mt-[-10px]">
                          <label className="text-[10px] text-slate-700 font-bold font-display">
                            Giá Trình Bày
                          </label>
                          <input
                            type="text"
                            value={priceText}
                            onChange={(e) => setPriceText(e.target.value)}
                            placeholder="Ví dụ: 32 Tỷ hoặc 15 Tr/tháng"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none focus:border-primary"
                          />
                        </div>

                        {/* Numeric sorting price */}
                        {createType === "product" && (
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display">
                              Giá Trị Số Đọc Bộ Lọc
                            </label>
                            <input
                              type="number"
                              value={priceVal}
                              onChange={(e) => setPriceVal(e.target.value)}
                              placeholder="Ví dụ: 32000000000"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none focus:border-primary font-mono"
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* Subcategory dropdown list */}
                    {createType !== "project" && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-700 font-bold font-display">
                          Danh Mục Thể Loại
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none cursor-pointer"
                        >
                          {Array.from(
                            new Set([
                              ...(createType === "article"
                                ? newsCategories
                                : categories),
                              ...(createType === "article"
                                ? news.length > 0
                                  ? news.map((n) => n.category)
                                  : [
                                    "Tin thị trường",
                                    "Lưu ý khi mua nhà",
                                    "Phong thủy",
                                    "Thông tin dự án",
                                    "Bất động sản hạng sang",
                                  ]
                                : products.length > 0
                                  ? products.map((p) => p.category)
                                  : [
                                    "Biệt thự sinh thái",
                                    "Căn hộ cao cấp",
                                    "Nhà phố liền kề",
                                    "Đất nền quy hoạch",
                                    "Shophouse kinh doanh",
                                  ]),
                            ]),
                          )
                            .filter(Boolean)
                            .map((c, i) => (
                              <option key={i} value={c}>
                                {c}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {/* Buy vs Rent status */}
                    {createType === "product" && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-700 font-bold font-display">
                          Hình thức giao dịch
                        </label>
                        <select
                          value={prodType}
                          onChange={(e) => setProdType(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none cursor-pointer"
                        >
                          <option value="sale">Bán</option>
                          <option value="rent">Cho thuê</option>
                        </select>
                      </div>
                    )}

                    {/* Local District / Area */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-700 font-bold font-display">
                        Địa Điểm / Khu Vực Bản Đồ
                      </label>
                      <input
                        list="locations-list"
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="Quận 7, TP. HCM"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none"
                      />
                      <datalist id="locations-list">
                        {allLocationsList.map((loc) => (
                          <option key={loc} value={loc} />
                        ))}
                      </datalist>
                    </div>

                    {/* Street Name / Number */}
                    {createType === "product" && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-700 font-bold font-display block">
                          Tên đường / Số nhà
                        </label>
                        <input
                          type="text"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="Số 12, Đường Nguyễn Hoàng"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none"
                        />
                      </div>
                    )}

                    {/* Visual Map and Technical Specifications */}
                    {createType === "product" && (
                      <div className="md:col-span-2 border-t border-zinc-800/60 pt-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {/* Location Area */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display block">
                              Diện tích m²
                            </label>
                            <input
                              type="number"
                              value={area}
                              onChange={(e) => setArea(e.target.value)}
                              placeholder="Ví dụ: 120"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none focus:border-amber-550 font-mono"
                            />
                          </div>

                          {/* Bedrooms */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display block">
                              Số phòng ngủ
                            </label>
                            <input
                              type="number"
                              value={bedrooms}
                              onChange={(e) => setBedrooms(e.target.value)}
                              placeholder="Ví dụ: 3"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none focus:border-amber-550 font-mono"
                            />
                          </div>

                          {/* Toilets */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display block">
                              Số toilet/WC
                            </label>
                            <input
                              type="number"
                              value={toilets}
                              onChange={(e) => setToilets(e.target.value)}
                              placeholder="Ví dụ: 2"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none focus:border-amber-550 font-mono"
                            />
                          </div>

                          {/* Direction */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display block">
                              Hướng nhà (phong thủy)
                            </label>
                            <input
                              type="text"
                              value={direction}
                              onChange={(e) => setDirection(e.target.value)}
                              placeholder="Ví dụ: Đông Nam"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none focus:border-amber-555"
                            />
                          </div>

                          {/* RoadWidth / frontage */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display block">
                              Mặt tiền / Lộ giới
                            </label>
                            <input
                              type="text"
                              value={roadWidth}
                              onChange={(e) => setRoadWidth(e.target.value)}
                              placeholder="Ví dụ: 12m - Đường nhựa"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none focus:border-amber-555"
                            />
                          </div>

                          {/* Legal Status */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display block">
                              Pháp lý bất động sản
                            </label>
                            <input
                              type="text"
                              value={legalStatus}
                              onChange={(e) => setLegalStatus(e.target.value)}
                              placeholder="Sổ hồng riêng chính chủ, công chứng ngay"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none focus:border-amber-555"
                            />
                          </div>

                          {/* Floors */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display block">
                              Quy mô số tầng
                            </label>
                            <input
                              type="text"
                              value={floors}
                              onChange={(e) => setFloors(e.target.value)}
                              placeholder="Ví dụ: 1 trệt 2 lầu"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none focus:border-amber-555"
                            />
                          </div>

                          {/* Interior info */}
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[10px] text-slate-700 font-bold font-display block">
                              Tình trạng nội thất bàn giao
                            </label>
                            <input
                              type="text"
                              value={interior}
                              onChange={(e) => setInterior(e.target.value)}
                              placeholder="Đầy đủ nội thất cao cấp hạng sang nhập khẩu, phong cách Âu Châu"
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none focus:border-amber-555"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Iframe map nhúng */}
                    {createType !== "article" && (
                      <div className="space-y-1 md:col-span-2 border-t border-zinc-800/60 pt-4">
                        <label className="text-[10px] text-primary-light font-bold tracking-wider font-display flex items-center gap-1">
                          <span>
                            Vị trí sơ đồ bản đồ (Dán mã nhúng Google Maps iframe
                            / liên kết)
                          </span>
                        </label>
                        <textarea
                          value={mapHtml}
                          onChange={(e) => setMapHtml(e.target.value)}
                          placeholder='Copy mã nhúng Bản đồ (<iframe src="... " ...></iframe>) dán trực diện vào đây...'
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 font-mono placeholder:text-slate-500 outline-none focus:border-amber-500"
                          rows={3}
                        />
                        <div className="text-[9px] text-slate-500 text-left leading-normal">
                          Hướng dẫn: Trên máy tính hoặc điện thoại mở Google
                          Maps -&gt; Tìm bất động sản -&gt; Click "Chia sẻ"
                          -&gt; Chọn thẻ "Nhúng bản đồ" -&gt; Click "Sao chép
                          HTML" và dán đè trực tiếp toàn bộ dòng đó vào khung
                          trên.
                        </div>
                      </div>
                    )}

                    {/* Primary cover photograph uploader */}
                    <div className="space-y-1 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-slate-700 font-bold font-display">
                          Ảnh đại diện
                        </label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, "imageUrl")}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                          />
                          <button
                            type="button"
                            className="w-full bg-slate-100 hover:bg-slate-750 text-slate-800 border border-slate-300 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5"
                          >
                            <Image className="w-3.5 h-d+.5 text-primary-light" />
                            <span>Tải ảnh lên</span>
                          </button>
                        </div>
                        {(currentUserRole === "admin" ||
                          currentUserRole === "editor") && (
                            <button
                              type="button"
                              onClick={() => {
                                setLibraryTargetField("imageUrl");
                                setIsLibraryOpen(true);
                              }}
                              className="bg-primary hover:bg-amber-600 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Image className="w-3.5 h-3.5 text-black" />
                              <span>Chọn từ kho</span>
                            </button>
                          )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {assetPresets.map((ps, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setImageUrl(ps.url)}
                            className={`text-[9px] px-2 py-0.5 rounded border border-slate-200 transition-all ${imageUrl === ps.url
                                ? "bg-primary text-white border-transparent font-bold"
                                : "text-slate-600 font-sans"
                              }`}
                          >
                            {ps.label}
                          </button>
                        ))}
                      </div>
                      {imageUrl.trim() && (
                        <div className="mt-2 text-center md:text-left self-start">
                          <span className="text-[9px] text-slate-500 block mb-1">
                            Xem trước ảnh bìa chính:
                          </span>
                          <img loading="lazy" decoding="async"
                            src={(imageUrl) || undefined}
                            alt="Cover preview"
                            className="w-44 h-24 object-cover rounded-lg border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>

                    {/* ADVANCED MODULES: BROKER AVATAR & LISTING PHOTO ALBUM GALLERY */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-12 gap-6 border-t border-b border-slate-200 my-0 pt-[5px] pb-[4px]">
                      {/* Top: Album Gallery multiple landscape arrays uploader */}
                      <div className="md:col-span-12 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="text-[10px] text-primary-light font-bold font-display flex items-center gap-1">
                          <Image className="w-3.5 h-3.5" />
                          <span>Anbum ảnh</span>
                        </label>
                        <p className="text-[9px] text-slate-700">
                          Danh mục ảnh con để kiến thiết album lướt slide trực
                          quan cho quý vị khách xem.
                        </p>

                        <div className="flex gap-2">
                          <div className="relative min-w-[100px]">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleImageUpload(e, "album")}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            />
                            <button
                              type="button"
                              className="w-full bg-slate-100 hover:bg-slate-750 text-slate-800 border border-slate-300 text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1"
                            >
                              Tải ảnh
                            </button>
                          </div>
                          {(currentUserRole === "admin" ||
                            currentUserRole === "editor") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setLibraryTargetField("album");
                                  setIsLibraryOpen(true);
                                }}
                                className="bg-slate-100 hover:bg-slate-750 border border-slate-300 text-slate-800 font-bold text-xs py-1.5 px-3 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                              >
                                Chọn từ kho
                              </button>
                            )}
                        </div>

                        {imageUrls.length > 0 && (
                          <div className="pt-3">
                            <span className="text-[9px] text-slate-500 font-bold">
                              Hình ảnh hiện tại trong album ({imageUrls.length}
                              ):
                            </span>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mt-2">
                              {imageUrls.map((url, idx) => (
                                <div
                                  key={idx}
                                  className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-300 group bg-white shadow-sm"
                                >
                                  <img loading="lazy" decoding="async"
                                    src={(url) || undefined}
                                    alt={`Album thumb #${idx}`}
                                    className="w-full h-full object-cover group-hover:opacity-60 transition-opacity"
                                    referrerPolicy="no-referrer"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAlbumImage(idx)}
                                    className="absolute top-1 right-1 bg-rose-600/90 hover:bg-rose-600 text-slate-900 p-1 rounded-full shadow-md z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Xóa ảnh"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom: Contact broker avatar card layout */}
                      <div className="md:col-span-12 space-y-2 self-start bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="text-[10px] text-primary-light font-bold font-display flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>
                            Ảnh Đại Diện Người Đăng Tin{" "}
                            <span className="lowercase text-slate-500 font-sans font-normal ml-1">
                              (Tùy Chọn)
                            </span>
                          </span>
                        </label>
                        <div className="flex items-center gap-4 mt-2">
                          {avatarUrl && (
                            <img loading="lazy" decoding="async"
                              src={(avatarUrl) || undefined}
                              alt="Broker avatar"
                              className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={avatarUrl}
                              onChange={(e) => setAvatarUrl(e.target.value)}
                              placeholder="Link ảnh môi tác giả/môi giới..."
                              className="w-full max-w-sm bg-white border border-slate-200 rounded-lg px-3  py-[10px] text-[10px] text-slate-900 outline-none focus:border-primary"
                            />
                            <div className="flex items-center gap-3 mt-1">
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleImageUpload(e, "avatarUrl")
                                  }
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                />
                                <span className="text-[10px] text-primary-light font-bold cursor-pointer hover:underline cursor-pointer">
                                  Tải ảnh chân dung từ máy
                                </span>
                              </div>
                              {(currentUserRole === "admin" ||
                                currentUserRole === "editor") && (
                                  <>
                                    <span className="text-slate-650 text-[10px]">
                                      •
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLibraryTargetField("avatarUrl");
                                        setIsLibraryOpen(true);
                                      }}
                                      className="text-[10px] text-primary-light font-bold hover:underline bg-transparent border-0 cursor-pointer"
                                    >
                                      Chọn từ kho lưu trữ
                                    </button>
                                  </>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EXTRA FOR PROJECTS SUBPAGES (Trang Vị trí, trang Tiện ích) */}
                    {createType === "project" && (
                      <>
                        <div className="grid grid-cols-2 gap-4 md:col-span-2 mb-4">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display">
                              Chủ đầu tư
                            </label>
                            <textarea
                              rows={2}
                              value={projDeveloper}
                              onChange={(e) => setProjDeveloper(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display">
                              Hình thức sở hữu
                            </label>
                            <textarea
                              rows={2}
                              value={projOwnership}
                              onChange={(e) => setProjOwnership(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display">
                              Tổng diện tích (Quy mô)
                            </label>
                            <textarea
                              rows={2}
                              value={projScale}
                              onChange={(e) => setProjScale(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display">
                              Số lượng căn
                            </label>
                            <textarea
                              rows={2}
                              value={projUnits}
                              onChange={(e) => setProjUnits(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display">
                              Thời điểm khởi công
                            </label>
                            <textarea
                              rows={2}
                              value={projCommencementDate}
                              onChange={(e) =>
                                setProjCommencementDate(e.target.value)
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display">
                              Loại hình sản phẩm
                            </label>
                            <textarea
                              rows={2}
                              value={projProductType}
                              onChange={(e) =>
                                setProjProductType(e.target.value)
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display">
                              Quy mô dân số
                            </label>
                            <textarea
                              rows={2}
                              value={projPopulation}
                              onChange={(e) =>
                                setProjPopulation(e.target.value)
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display">
                              Mật độ xây dựng
                            </label>
                            <textarea
                              rows={2}
                              value={projBuildingDensity}
                              onChange={(e) =>
                                setProjBuildingDensity(e.target.value)
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display">
                              Thời gian bàn giao
                            </label>
                            <textarea
                              rows={2}
                              value={projHandoverTime}
                              onChange={(e) =>
                                setProjHandoverTime(e.target.value)
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display">
                              Phân khu
                            </label>
                            <textarea
                              rows={2}
                              value={projSubdivisions}
                              onChange={(e) =>
                                setProjSubdivisions(e.target.value)
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-700 font-bold font-display">
                              Ngân hàng hỗ trợ
                            </label>
                            <textarea
                              rows={2}
                              value={projSupportedBanks}
                              onChange={(e) =>
                                setProjSupportedBanks(e.target.value)
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 focus:outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          <div className="col-span-2 mt-4 p-4 border border-primary/20 bg-primary/5 rounded-lg flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 space-y-2">
                              <label className="text-[10px] text-primary font-bold font-display block mb-1">
                                Cấu hình danh mục Tin tức liên quan
                              </label>
                              <p className="text-[10px] text-slate-700 mb-2">
                                Để hiển thị danh mục tin tức cụ thể (VD:
                                "Vinhomes Cần Giờ").
                              </p>
                              <input
                                type="text"
                                value={projNewsCategoryUrl}
                                onChange={(e) =>
                                  setProjNewsCategoryUrl(e.target.value)
                                }
                                placeholder="Nhập tên danh mục tin tức..."
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-primary focus:outline-none focus:border-primary transition-colors"
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <label className="text-[10px] text-primary font-bold font-display block mb-1">
                                Cấu hình danh mục Sản phẩm liên quan
                              </label>
                              <p className="text-[10px] text-slate-700 mb-2">
                                Để hiển thị danh mục sản phẩm ở cột Giá bán (VD:
                                "Biệt thự").
                              </p>
                              <input
                                type="text"
                                value={projProductCategoryUrl}
                                onChange={(e) =>
                                  setProjProductCategoryUrl(e.target.value)
                                }
                                placeholder="Nhập tên danh mục sản phẩm..."
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-primary focus:outline-none focus:border-primary transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* HTML content compositing area with advanced Visual formatting toolbar */}
                    <div
                      className={
                        isEditorFullscreen
                          ? "fixed inset-0 z-[100] bg-black/95 backdrop-blur-md p-4 sm:p-8 flex flex-col space-y-4 overflow-hidden"
                          : "space-y-1.5 md:col-span-2"
                      }
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1.5 border-b border-slate-200 gap-2">
                        <div className="flex items-center gap-4">
                          <div
                            className="text-[10px] text-amber-500 font-bold font-display flex items-center gap-3 cursor-pointer select-none"
                            onClick={() =>
                              setExpandedEditors((prev) => ({
                                ...prev,
                                overview: !prev.overview,
                              }))
                            }
                          >
                            {createType === "project"
                              ? "Phân Trang 1: Tổng Quan Dự Án"
                              : "TRÌNH SOẠN THẢO VĂN BẢN"}
                            {expandedEditors.overview ? (
                              <ChevronUp className="w-4 h-d+" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex bg-slate-50 rounded-lg p-0.5 border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setEditorMode("visual")}
                              className={`px-3 py-1 text-[9px] rounded-md transition-colors ${editorMode === "visual" ? "bg-primary text-white font-bold" : "text-slate-700 hover:text-slate-900"}`}
                            >
                              Trực Quan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditorMode("code")}
                              className={`px-3 py-1 text-[9px] rounded-md transition-colors ${editorMode === "code" ? "bg-indigo-500 text-white font-bold" : "text-slate-700 hover:text-slate-900"}`}
                            >
                              Mã HTML
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setIsEditorFullscreen(!isEditorFullscreen)
                          }
                          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2 self-start"
                          title={
                            isEditorFullscreen
                              ? "Thu nhỏ"
                              : "Phóng to toàn màn hình"
                          }
                        >
                          {isEditorFullscreen ? (
                            <>
                              <Minimize2 className="w-4 h-4" />
                              <span className="text-[10px] font-semibold hidden sm:inline">
                                Thu nhỏ
                              </span>
                            </>
                          ) : (
                            <>
                              <Maximize2 className="w-4 h-4" />
                              <span className="text-[10px] font-semibold hidden sm:inline">
                                Phóng to
                              </span>
                            </>
                          )}
                        </button>
                      </div>

                      {(expandedEditors.overview || isEditorFullscreen) && (
                        <>
                          {editorMode === "code" && (
                            <div className="flex flex-wrap gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  formatSelectedText("<h1>", "</h1>\n")
                                }
                                className="text-[9px] bg-white border border-slate-200 text-primary-light hover:text-slate-900 px-2 py-1 rounded font-mono font-bold"
                                title="Chèn tiêu đề lớn"
                              >
                                h1
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  formatSelectedText("<h2>", "</h2>\n")
                                }
                                className="text-[9px] bg-white border border-slate-200 text-primary-light hover:text-slate-900 px-2 py-1 rounded font-mono font-bold"
                                title="Chèn tiêu đề con"
                              >
                                h2
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  formatSelectedText("<h3>", "</h3>\n")
                                }
                                className="text-[9px] bg-white border border-slate-200 text-primary-light hover:text-slate-900 px-2 py-1 rounded font-mono font-bold"
                                title="Chèn tiêu đề phụ"
                              >
                                h3
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  formatSelectedText("<strong>", "</strong>")
                                }
                                className="text-[9px] bg-white border border-slate-200 text-primary-light hover:text-slate-900 px-2 py-1 rounded font-mono font-bold"
                                title="Chữ in đậm"
                              >
                                B (Bold)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  formatSelectedText("<em>", "</em>")
                                }
                                className="text-[9px] bg-white border border-slate-200 text-primary-light hover:text-slate-900 px-2 py-1 rounded font-mono font-bold"
                                title="Chữ in nghiêng"
                              >
                                I (Italic)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  formatSelectedText("<p>", "</p>\n")
                                }
                                className="text-[9px] bg-white border border-slate-200 text-primary-light hover:text-slate-900 px-2 py-1 rounded font-mono font-bold"
                                title="Đoạn văn"
                              >
                                P (Paragraph)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  formatSelectedText(
                                    "\n<ul>\n  <li>",
                                    "</li>\n  <li>Tiện ích tiếp theo</li>\n</ul>\n",
                                  )
                                }
                                className="text-[9px] bg-white border border-slate-200 text-primary-light hover:text-slate-900 px-2 py-1 rounded font-mono font-bold"
                                title="Danh sách không thứ tự"
                              >
                                ul
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  formatSelectedText(
                                    '\n<hr class="border-zinc-800 my-5" />\n',
                                    "",
                                  )
                                }
                                className="text-[9px] bg-white border border-slate-200 text-primary-light hover:text-slate-900 px-2 py-1 rounded font-mono font-bold"
                                title="Đường kẻ ranh giới"
                              >
                                Dải kẻ
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  formatSelectedText(
                                    '<span class="text-primary-light font-bold font-mono">📱 Liên hệ: ',
                                    "</span>",
                                  )
                                }
                                className="text-[9px] bg-white border border-slate-200 text-orange-400 hover:text-slate-900 px-2 py-1 rounded font-mono font-bold"
                                title="Chèn số Hotline đại lý"
                              >
                                Holtine
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  formatSelectedText(
                                    '<blockquote class="border-l-4 border-primary pl-4 italic text-slate-600">',
                                    "</blockquote>\n",
                                  )
                                }
                                className="text-[9px] bg-white border border-slate-200 text-primary-light hover:text-slate-900 px-1.5 py-1 rounded font-mono font-bold"
                                title="Trích dẫn"
                              >
                                Quote
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const link =
                                    window.prompt("Nhập URL liên kết:");
                                  if (link)
                                    formatSelectedText(
                                      `<a href="${link}" class="text-emerald-400 font-medium hover:underline cursor-pointer transition-colors" target="_blank" rel="noopener noreferrer">`,
                                      "</a>",
                                    );
                                }}
                                className="text-[9px] bg-white border border-slate-200 text-sky-400 hover:text-slate-900 px-2 py-1 rounded font-mono font-bold"
                                title="Chèn liên kết URL"
                              >
                                URL
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const textarea = document.getElementById(
                                    "html-content-editor",
                                  ) as HTMLTextAreaElement;
                                  if (textarea)
                                    setEditorCursorMatch({
                                      start: textarea.selectionStart,
                                      end: textarea.selectionEnd,
                                      text: textarea.value,
                                    });
                                  setLibraryTargetField("editor");
                                  setIsLibraryOpen(true);
                                }}
                                className="text-[9px] bg-white border border-slate-200 text-rose-400 hover:text-slate-900 px-1.5 py-1 rounded font-mono font-bold"
                                title="Chèn hình ảnh từ kho"
                              >
                                Chèn ảnh
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const textarea = document.getElementById(
                                    "html-content-editor",
                                  ) as HTMLTextAreaElement;
                                  if (textarea)
                                    setEditorCursorMatch({
                                      start: textarea.selectionStart,
                                      end: textarea.selectionEnd,
                                      text: textarea.value,
                                    });
                                  setIsInternalLinkModalOpen(true);
                                }}
                                className="text-[9px] bg-white border border-slate-200 text-emerald-400 hover:text-slate-900 px-1.5 py-1 rounded font-mono font-bold"
                                title="Chèn liên kết bài cũ nội bộ"
                              >
                                Link Nội Bộ
                              </button>
                            </div>
                          )}

                          {editorMode === "code" && (
                            <p className="text-[9px] text-slate-700">
                              Hỗ trợ bôi đen đoạn văn rồi chọn các thẻ định dạng
                              trên để tự động bọc mã chuẩn WordPress không cần
                              vướng lỗi!
                            </p>
                          )}

                          {editorMode === "code" ? (
                            <textarea
                              id="html-content-editor"
                              value={htmlContent}
                              onChange={(e) => setHtmlContent(e.target.value)}
                              placeholder="Nhập mã HTML hoặc bôi đen định dạng. Sử dụng thanh công cụ trợ giúp nhanh phía trên để kiến thiết bài đăng cực chuẩn WordPress..."
                              className={`w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-xs text-slate-800 outline-none font-mono resize-none ${isEditorFullscreen ? "flex-1" : ""}`}
                              rows={isEditorFullscreen ? undefined : 15}
                              required
                            />
                          ) : (
                            <div
                              className={`bg-white rounded-lg border border-slate-200 prose-editor-container flex flex-col ${isEditorFullscreen ? "flex-1 fullscreen" : ""}`}
                            >
                              {React.createElement(ReactQuill as any, {
                                ref: quillRef,
                                theme: "snow",
                                value: htmlContent,
                                onChange: setHtmlContent,
                                modules: quillModules,
                                className: `text-zinc-900 flex flex-col ${isEditorFullscreen ? "flex-1" : ""}`,
                              })}
                            </div>
                          )}

                          {/* HTML render preview - Only show in code mode to avoid duplicate display since visual already shows it */}
                          {editorMode === "code" && htmlContent.trim() && (
                            <div className="bg-white p-5 rounded-lg border border-zinc-900 space-y-2 mt-4">
                              <p className="text-[9px] text-slate-500 font-bold font-mono">
                                Xem trước bản trực quan thời gian thực lúc hiển
                                thị:
                              </p>
                              <div
                                className="prose prose-invert max-w-none text-slate-800 leading-relaxed max-h-80 overflow-y-auto"
                                dangerouslySetInnerHTML={{
                                  __html: htmlContent,
                                }}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {createType === "project" && !isEditorFullscreen && (
                      <>
                        <div className="space-y-1 md:col-span-2 mb-4 pt-4 border-t border-slate-200">
                          <div
                            className="text-[10px] text-amber-500 font-bold font-display flex items-center justify-between mb-2 cursor-pointer select-none"
                            onClick={() =>
                              setExpandedEditors((prev) => ({
                                ...prev,
                                subdivisions: !prev.subdivisions,
                              }))
                            }
                          >
                            <span>Phân Trang 2: Phân khu</span>
                            {expandedEditors.subdivisions ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>

                          {expandedEditors.subdivisions && (
                            <div className="bg-white rounded-lg border border-slate-200 prose-editor-container mb-4">
                              <ReactQuill
                                theme="snow"
                                value={projSubdivisionTab}
                                onChange={setProjSubdivisionTab}
                                modules={quillModules}
                                className="text-zinc-900"
                              />
                            </div>
                          )}

                          {expandedEditors.subdivisions && (
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] text-primary-light font-bold font-display flex items-center gap-1">
                                  <LayoutGrid className="w-3.5 h-3.5" />
                                  <span>Thẻ Phân Khu (Dạng cột)</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSubdivisionsCards((prev) => [
                                      ...prev,
                                      {
                                        name: "",
                                        imageUrl: "",
                                        status: "",
                                        projectStr: "",
                                        styleStr: "",
                                        priceStr: "",
                                        types: [],
                                      },
                                    ])
                                  }
                                  className="text-primary hover:text-slate-900 hover:bg-slate-200 px-2 py-1 rounded text-xs border border-slate-200 flex items-center gap-1 transition-colors"
                                >
                                  <Plus className="w-3 h-3" /> Thêm cột
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {subdivisionsCards.map((card, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white border border-slate-200 p-3 rounded-lg space-y-2 relative"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSubdivisionsCards((prev) =>
                                          prev.filter((_, i) => i !== idx),
                                        )
                                      }
                                      className="absolute top-2 right-2 text-red-500 hover:text-white p-1 rounded hover:bg-red-500/20 z-20"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                    <input
                                      type="text"
                                      placeholder="Tên phân khu"
                                      value={card.name}
                                      onChange={(e) => {
                                        const n = [...subdivisionsCards];
                                        n[idx].name = e.target.value;
                                        setSubdivisionsCards(n);
                                      }}
                                      className="w-full bg-slate-50 border border-slate-200 rounded px-3  py-[10px] text-[10px] text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                    <div className="flex gap-2 items-center">
                                      <input
                                        type="text"
                                        placeholder="URL Ảnh chụp"
                                        value={card.imageUrl}
                                        onChange={(e) => {
                                          const n = [...subdivisionsCards];
                                          n[idx].imageUrl = e.target.value;
                                          setSubdivisionsCards(n);
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 min-h-[32px] py-1.5 text-[10px] text-slate-800 focus:outline-none focus:border-primary"
                                      />
                                      <div className="relative shrink-0">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) =>
                                            handleImageUpload(
                                              e,
                                              `subdivisionCardImage:${idx}`,
                                            )
                                          }
                                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                        />
                                        <button
                                          type="button"
                                          className="bg-slate-100 text-slate-800 border border-slate-300 py-1 text-[10px] px-2 rounded-lg flex items-center justify-center gap-1"
                                          title="Tải ảnh lên"
                                        >
                                          <Image className="w-3 h-d+ text-primary-light" />
                                        </button>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setLibraryTargetField(
                                            `subdivisionCardImage:${idx}`,
                                          );
                                          setIsLibraryOpen(true);
                                        }}
                                        className="bg-slate-100 text-slate-800 border border-slate-300 py-1 text-[10px] px-2 rounded-lg shrink-0 flex items-center justify-center gap-1"
                                        title="Kho thư viện"
                                      >
                                        <Bookmark className="w-3 h-3 text-primary-light" />
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="Trạng thái (Mới mở bán)"
                                      value={card.status || ""}
                                      onChange={(e) => {
                                        const n = [...subdivisionsCards];
                                        n[idx].status = e.target.value;
                                        setSubdivisionsCards(n);
                                      }}
                                      className="w-full bg-slate-50 border border-slate-200 rounded px-3  py-[10px] text-[10px] text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                    <select
                                      value={card.linkedProjectId || ""}
                                      onChange={(e) => {
                                        const n = [...subdivisionsCards];
                                        n[idx].linkedProjectId = e.target.value;
                                        setSubdivisionsCards(n);
                                      }}
                                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 min-h-[32px] py-1.5 text-[10px] text-slate-800 focus:outline-none focus:border-primary"
                                    >
                                      <option value="">
                                        -- Liên kết trang con (Tùy chọn) --
                                      </option>
                                      {projects
                                        .filter((p) => p.id !== editingItemId)
                                        .map((p) => (
                                          <option key={p.id} value={p.id}>
                                            {p.title}
                                          </option>
                                        ))}
                                    </select>
                                    <input
                                      type="text"
                                      placeholder="Tên phân khu hiển thị trên card"
                                      value={card.projectStr || ""}
                                      onChange={(e) => {
                                        const n = [...subdivisionsCards];
                                        n[idx].projectStr = e.target.value;
                                        setSubdivisionsCards(n);
                                      }}
                                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Phong cách xây dựng"
                                      value={card.styleStr || ""}
                                      onChange={(e) => {
                                        const n = [...subdivisionsCards];
                                        n[idx].styleStr = e.target.value;
                                        setSubdivisionsCards(n);
                                      }}
                                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Giá bán"
                                      value={card.priceStr || ""}
                                      onChange={(e) => {
                                        const n = [...subdivisionsCards];
                                        n[idx].priceStr = e.target.value;
                                        setSubdivisionsCards(n);
                                      }}
                                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Loại hình (ngăn cách bằng phẩy)"
                                      value={
                                        card.types ? card.types.join(", ") : ""
                                      }
                                      onChange={(e) => {
                                        const n = [...subdivisionsCards];
                                        n[idx].types = e.target.value
                                          .split(",")
                                          .map((s) => s.trim());
                                        setSubdivisionsCards(n);
                                      }}
                                      className="w-full bg-slate-50 border border-slate-200 rounded px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 md:col-span-2 mb-4 pt-4 border-t border-slate-200">
                          <div
                            className="text-[10px] text-amber-500 font-bold font-display flex items-center justify-between mb-2 cursor-pointer select-none"
                            onClick={() =>
                              setExpandedEditors((prev) => ({
                                ...prev,
                                location: !prev.location,
                              }))
                            }
                          >
                            <span>Phân Trang 3: Mô tả Vị trí</span>
                            {expandedEditors.location ? (
                              <ChevronUp className="w-4 h-d+" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>

                          {expandedEditors.location && (
                            <div className="space-y-4">
                              <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2 prose-editor-container">
                                <label className="text-[10px] text-primary-light font-bold font-display block">Mô tả ngắn Vị trí / Địa chỉ</label>
                                <ReactQuill
                                  theme="snow"
                                  value={projLocationShortDesc}
                                  onChange={setProjLocationShortDesc}
                                  modules={quillModules}
                                  className="text-zinc-900 bg-white"
                                />
                              </div>
                              <div className="bg-white rounded-lg border border-slate-200 prose-editor-container">
                                <label className="text-[10px] text-slate-500 font-bold font-display block p-2 bg-bg-base border-b border-zinc-100">Mô tả chi tiết Vị trí</label>
                                <ReactQuill
                                  theme="snow"
                                  value={projLocationTab}
                                  onChange={setProjLocationTab}
                                  modules={quillModules}
                                  className="text-zinc-900"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 md:col-span-2 mb-4 pt-2 border-t border-slate-800/50">
                          <div
                            className="text-[10px] text-amber-500 font-bold font-display flex items-center justify-between mb-2 cursor-pointer select-none"
                            onClick={() =>
                              setExpandedEditors((prev) => ({
                                ...prev,
                                amenity: !prev.amenity,
                              }))
                            }
                          >
                            <span>Phân Trang 4: Chuỗi Tiện ích</span>
                            {expandedEditors.amenity ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>

                          {expandedEditors.amenity && (
                            <>
                              <div className="bg-white rounded-lg border border-slate-200 prose-editor-container">
                                <ReactQuill
                                  theme="snow"
                                  value={projAmenityTab}
                                  onChange={setProjAmenityTab}
                                  modules={quillModules}
                                  className="text-zinc-900"
                                />
                              </div>

                              <div className="md:col-span-12 space-y-2 bg-zinc-900/40 p-4 rounded-xl border border-slate-200 mt-2">
                                <label className="text-[10px] text-primary-light font-bold font-display flex items-center gap-1">
                                  <Image className="w-3.5 h-3.5" />
                                  <span>Album Ảnh Tiện Ích</span>
                                </label>
                                <div className="flex gap-2">
                                  <div className="relative min-w-[100px]">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) =>
                                        handleImageUpload(e, "amenityAlbum")
                                      }
                                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                    />
                                    <button
                                      type="button"
                                      className="w-full bg-slate-100 hover:bg-slate-750 text-slate-800 border border-slate-300 text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1"
                                    >
                                      Tải ảnh lên
                                    </button>
                                  </div>
                                  {(currentUserRole === "admin" ||
                                    currentUserRole === "editor") && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setLibraryTargetField("amenityAlbum");
                                          setIsLibraryOpen(true);
                                        }}
                                        className="bg-slate-100 hover:bg-slate-750 border border-slate-300 text-slate-800 font-bold text-xs py-1.5 px-3 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                                      >
                                        Từ kho
                                      </button>
                                    )}
                                </div>
                                {amenityImages.length > 0 && (
                                  <div className="pt-3">
                                    <span className="text-[9px] text-slate-500 font-bold">
                                      Hình ảnh tiện ích ({amenityImages.length}
                                      ):
                                    </span>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mt-2">
                                      {amenityImages.map((url, idx) => (
                                        <div
                                          key={idx}
                                          className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-300 group bg-white shadow-sm"
                                        >
                                          <img loading="lazy" decoding="async"
                                            src={(url) || undefined}
                                            alt={`Amenity thumb #${idx}`}
                                            className="w-full h-full object-cover group-hover:opacity-60 transition-opacity"
                                            referrerPolicy="no-referrer"
                                          />
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemoveAmenityAlbumImage(idx)
                                            }
                                            className="absolute top-1 right-1 bg-rose-600/90 hover:bg-rose-600 text-slate-900 p-1 rounded-full shadow-md z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Xóa ảnh"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="space-y-1 md:col-span-2 mb-4 pt-2 border-t border-slate-800/50">
                          <div
                            className="text-[10px] text-amber-500 font-bold font-display flex items-center justify-between mb-2 cursor-pointer select-none"
                            onClick={() =>
                              setExpandedEditors((prev) => ({
                                ...prev,
                                floorPlan: !prev.floorPlan,
                              }))
                            }
                          >
                            <span>Phân Trang 5: Mặt bằng</span>
                            {expandedEditors.floorPlan ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>

                          {expandedEditors.floorPlan && (
                            <div className="bg-white rounded-lg border border-slate-200 prose-editor-container">
                              <ReactQuill
                                theme="snow"
                                value={projFloorPlanTab}
                                onChange={setProjFloorPlanTab}
                                modules={quillModules}
                                className="text-zinc-900"
                              />
                            </div>
                          )}
                          {expandedEditors.floorPlan && (
                            <div className="md:col-span-12 space-y-2 bg-zinc-900/40 p-4 rounded-xl border border-slate-200 mt-2">
                              <label className="text-[10px] text-primary-light font-bold font-display flex items-center gap-1">
                                <Image className="w-3.5 h-3.5" />
                                <span>Album Ảnh Mặt Bằng</span>
                              </label>
                              <div className="flex gap-2">
                                <div className="relative min-w-[100px]">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                      handleImageUpload(e, "floorPlanAlbum")
                                    }
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                  />
                                  <button
                                    type="button"
                                    className="w-full bg-slate-100 hover:bg-slate-750 text-slate-800 border border-slate-300 text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1"
                                  >
                                    Tải ảnh lên
                                  </button>
                                </div>
                                {(currentUserRole === "admin" ||
                                  currentUserRole === "editor") && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLibraryTargetField("floorPlanAlbum");
                                        setIsLibraryOpen(true);
                                      }}
                                      className="bg-slate-100 hover:bg-slate-750 border border-slate-300 text-slate-800 font-bold text-xs py-1.5 px-3 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                                    >
                                      Từ kho
                                    </button>
                                  )}
                              </div>
                              {floorPlanImages.length > 0 && (
                                <div className="pt-3">
                                  <span className="text-[9px] text-slate-500 font-bold">
                                    Hình ảnh mặt bằng ({floorPlanImages.length}
                                    ):
                                  </span>
                                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mt-2">
                                    {floorPlanImages.map((url, idx) => (
                                      <div
                                        key={idx}
                                        className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-300 group bg-white shadow-sm"
                                      >
                                        <img loading="lazy" decoding="async"
                                          src={(url) || undefined}
                                          alt={`Floor plan thumb #${idx}`}
                                          className="w-full h-full object-cover group-hover:opacity-60 transition-opacity"
                                          referrerPolicy="no-referrer"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveFloorPlanAlbumImage(idx)
                                          }
                                          className="absolute top-1 right-1 bg-rose-600/90 hover:bg-rose-600 text-slate-900 p-1 rounded-full shadow-md z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Xóa ảnh"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="mt-4 border-t border-slate-200 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                  <label className="text-[10px] text-primary-light font-bold font-display flex items-center gap-1">
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    <span>
                                      Các Tab Cấu Hình Phụ Từng Mặt Bằng (Tối đa
                                      5 tab)
                                    </span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={handleAddFloorPlanTab}
                                    disabled={floorPlanTabsList.length >= 5}
                                    className="bg-amber-600 hover:bg-primary disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-[10px] py-1 px-2 rounded transition-colors flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Thêm Tab Mới</span>
                                  </button>
                                </div>

                                {floorPlanTabsList.length > 0 && (
                                  <div className="border border-slate-200 rounded-lg bg-zinc-900/50 overflow-hidden">
                                    <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar bg-white">
                                      {floorPlanTabsList.map((tab) => (
                                        <button
                                          key={tab.id}
                                          type="button"
                                          onClick={() =>
                                            setActiveFloorPlanTabId(tab.id)
                                          }
                                          className={`px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${activeFloorPlanTabId === tab.id ? "bg-zinc-800 text-primary-light border-b-2 border-primary" : "text-slate-600 hover:text-slate-700 hover:bg-zinc-900"}`}
                                        >
                                          {tab.name || "Tab Chưa Tên"}
                                          <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveFloorPlanTab(tab.id);
                                            }}
                                            className="text-slate-500 hover:text-rose-500 cursor-pointer"
                                          >
                                            <X className="w-3 h-3" />
                                          </span>
                                        </button>
                                      ))}
                                    </div>

                                    {activeFloorPlanTabId && (
                                      <div className="p-4 space-y-4">
                                        {floorPlanTabsList.map(
                                          (tab) =>
                                            tab.id === activeFloorPlanTabId && (
                                              <div
                                                key={tab.id}
                                                className="space-y-4"
                                              >
                                                <div>
                                                  <label className="text-[10px] text-slate-700 font-bold mb-1 block">
                                                    Tên Tab hiển thị
                                                  </label>
                                                  <input
                                                    type="text"
                                                    value={tab.name}
                                                    onChange={(e) =>
                                                      handleUpdateFloorPlanTab(
                                                        tab.id,
                                                        "name",
                                                        e.target.value,
                                                      )
                                                    }
                                                    placeholder="VD: Mặt bằng 1PN, 2PN..."
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3  py-[10px] text-[10px] text-slate-900 outline-none focus:border-primary"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="text-[10px] text-slate-700 font-bold mb-1 block">
                                                    Nội dung HTML mô tả
                                                  </label>
                                                  <div className="bg-white rounded-lg border border-slate-200 text-zinc-900 prose-editor-container">
                                                    <ReactQuill
                                                      theme="snow"
                                                      value={tab.content}
                                                      onChange={(val) =>
                                                        handleUpdateFloorPlanTab(
                                                          tab.id,
                                                          "content",
                                                          val,
                                                        )
                                                      }
                                                      modules={quillModules}
                                                    />
                                                  </div>
                                                </div>
                                                <div>
                                                  <label className="text-[10px] text-slate-700 font-bold mb-1 block">
                                                    Hình ảnh liên kết
                                                  </label>
                                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                      <div className="relative min-w-[100px]">
                                                        <input
                                                          type="file"
                                                          accept="image/*"
                                                          onChange={(e) =>
                                                            handleImageUpload(
                                                              e,
                                                              `tabImage:${tab.id}`,
                                                            )
                                                          }
                                                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                                        />
                                                        <button
                                                          type="button"
                                                          className="w-full bg-slate-100 hover:bg-slate-750 text-slate-800 border border-slate-300 text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1"
                                                        >
                                                          Tải ảnh lên
                                                        </button>
                                                      </div>
                                                      {(currentUserRole ===
                                                        "admin" ||
                                                        currentUserRole ===
                                                        "editor") && (
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              setLibraryTargetField(
                                                                `tabImage:${tab.id}`,
                                                              );
                                                              setIsLibraryOpen(
                                                                true,
                                                              );
                                                            }}
                                                            className="bg-slate-100 hover:bg-slate-750 border border-slate-300 text-slate-800 font-bold text-xs py-1.5 px-3 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                                                          >
                                                            Từ kho
                                                          </button>
                                                        )}
                                                    </div>
                                                  </div>
                                                  {tab.images.length > 0 && (
                                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                                                      {tab.images.map(
                                                        (img, idx) => (
                                                          <div
                                                            key={idx}
                                                            className="relative aspect-[4/3] rounded border border-slate-300 overflow-hidden group"
                                                          >
                                                            <img loading="lazy" decoding="async"
                                                              src={(img) || undefined}
                                                              className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                                                              alt=""
                                                            />
                                                            <button
                                                              type="button"
                                                              onClick={() =>
                                                                handleUpdateFloorPlanTab(
                                                                  tab.id,
                                                                  "images",
                                                                  tab.images.filter(
                                                                    (_, i) =>
                                                                      i !== idx,
                                                                  ),
                                                                )
                                                              }
                                                              className="absolute top-1 right-1 bg-rose-600 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity text-slate-900"
                                                            >
                                                              <X className="w-3 h-d+" />
                                                            </button>
                                                          </div>
                                                        ),
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            ),
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 md:col-span-2 mb-4 pt-2 border-t border-slate-800/50">
                          <div
                            className="text-[10px] text-amber-500 font-bold font-display flex items-center justify-between mb-2 cursor-pointer select-none"
                            onClick={() =>
                              setExpandedEditors((prev) => ({
                                ...prev,
                                price: !prev.price,
                              }))
                            }
                          >
                            <span>Phân Trang 6: Giá bán</span>
                            {expandedEditors.price ? (
                              <ChevronUp className="w-4 h-3" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>

                          {expandedEditors.price && (
                            <div className="bg-white rounded-lg border border-slate-200 prose-editor-container">
                              <ReactQuill
                                theme="snow"
                                value={projPriceTab}
                                onChange={setProjPriceTab}
                                modules={quillModules}
                                className="text-zinc-900"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 md:col-span-2 mb-4 pt-2 border-t border-slate-800/50">
                          <div
                            className="text-[10px] text-amber-500 font-bold font-display flex items-center justify-between mb-2 cursor-pointer select-none"
                            onClick={() =>
                              setExpandedEditors((prev) => ({
                                ...prev,
                                qa: !prev.qa,
                              }))
                            }
                          >
                            <span>Phân Trang 7: Hỏi đáp (Q&A)</span>
                            {expandedEditors.qa ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>

                          {expandedEditors.qa && (
                            <div className="space-y-4">
                              <div className="bg-white rounded-lg border border-slate-200 prose-editor-container">
                                <ReactQuill
                                  theme="snow"
                                  value={projQaTab}
                                  onChange={setProjQaTab}
                                  modules={quillModules}
                                  className="text-zinc-900"
                                />
                              </div>

                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-slate-900 font-medium text-sm">
                                    Danh sách câu hỏi & trả lời (Accordion)
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setQaList([
                                        ...qaList,
                                        { question: "", answer: "" },
                                      ])
                                    }
                                    className="bg-primary/10 text-primary hover:bg-primary hover:text-zinc-900 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                                  >
                                    <Plus className="w-3 h-3" /> Thêm câu hỏi
                                  </button>
                                </div>
                                <div className="space-y-3">
                                  {qaList.map((qa, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-white border border-slate-200 p-3 rounded-lg space-y-2 relative"
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setQaList((prev) =>
                                            prev.filter((_, i) => i !== idx),
                                          )
                                        }
                                        className="absolute top-2 right-2 text-red-500 hover:text-white p-1 rounded hover:bg-red-500/20 z-20"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                      <input
                                        type="text"
                                        placeholder="Câu hỏi (Question)"
                                        value={qa.question}
                                        onChange={(e) => {
                                          const n = [...qaList];
                                          n[idx].question = e.target.value;
                                          setQaList(n);
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded px-3  py-[10px] text-[10px] font-medium text-slate-900 focus:outline-none focus:border-primary pr-8"
                                      />
                                      <textarea
                                        placeholder="Câu trả lời (Answer)"
                                        value={qa.answer}
                                        onChange={(e) => {
                                          const n = [...qaList];
                                          n[idx].answer = e.target.value;
                                          setQaList(n);
                                        }}
                                        className="w-full h-d+ bg-slate-50 border border-slate-200 rounded px-3  py-[10px] text-[10px] text-slate-800 focus:outline-none focus:border-primary resize-none"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Custom Sections Editor */}
                        <div className="space-y-1 md:col-span-2 mb-4 pt-4 border-t border-slate-200">
                          <div
                            className="text-[10px] text-amber-500 font-bold font-display flex items-center justify-between mb-2 cursor-pointer select-none"
                            onClick={() =>
                              setExpandedEditors((prev) => ({
                                ...prev,
                                customSections: !prev.customSections,
                              }))
                            }
                          >
                            <span>Bài Viết / Phân Trang Bổ Sung (Tuỳ Chỉnh)</span>
                            {expandedEditors.customSections ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>

                          {expandedEditors.customSections && (
                            <div className="space-y-4">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCustomSections([
                                      ...customSections,
                                      { id: Date.now().toString(), title: "Khu vực nội dung mới", content: "", position: "after_overview" },
                                    ])
                                  }
                                  className="bg-primary/10 text-primary hover:bg-primary hover:text-zinc-900 text-xs px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                  <Plus className="w-4 h-4" /> Thêm Bài Viết
                                </button>
                              </div>
                              <div className="space-y-6">
                                {customSections.map((sec, idx) => (
                                  <div key={sec.id || idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4 relative">
                                    <button
                                      type="button"
                                      onClick={() => setCustomSections(customSections.filter((_, i) => i !== idx))}
                                      className="absolute top-4 right-4 text-slate-500 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded transition-colors z-10"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <label className="text-[10px] text-slate-700 font-bold font-display">Tiêu đề bài viết</label>
                                        <input
                                          type="text"
                                          value={sec.title}
                                          onChange={(e) => {
                                            const newSec = [...customSections];
                                            newSec[idx].title = e.target.value;
                                            setCustomSections(newSec);
                                          }}
                                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-[10px] text-slate-900 focus:outline-none focus:border-primary pr-10"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] text-slate-700 font-bold font-display">Vị trí hiển thị</label>
                                        <select
                                          value={sec.position}
                                          onChange={(e) => {
                                            const newSec = [...customSections];
                                            newSec[idx].position = e.target.value;
                                            setCustomSections(newSec);
                                          }}
                                          className="w-full bg-white border border-slate-200 rounded px-3 py-[9px] text-[10px] text-slate-900 focus:outline-none focus:border-primary"
                                        >
                                          <option value="before_overview">Trình bày trên cùng (Trước Tổng quan)</option>
                                          <option value="after_overview">Sau phần Tổng quan</option>
                                          <option value="after_subdivision">Sau phần Phân khu</option>
                                          <option value="after_location">Sau phần Vị trí</option>
                                          <option value="after_amenity">Sau phần Tiện ích</option>
                                          <option value="after_floorplan">Sau phần Mặt bằng</option>
                                          <option value="after_price">Sau phần Giá bán</option>
                                          <option value="after_qa">Sau phần Hỏi đáp</option>
                                          <option value="after_news">Dưới cùng (Sau tin tức)</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] text-slate-700 font-bold font-display">Nội dung</label>
                                      <div className="bg-white rounded border border-slate-200 text-zinc-900 relative">
                                        <ReactQuill
                                          theme="snow"
                                          value={sec.content}
                                          onChange={(val) => {
                                            const newSec = [...customSections];
                                            newSec[idx].content = val;
                                            setCustomSections(newSec);
                                          }}
                                          modules={quillModules}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Cấu hình SEO Tùy chọn cho Trang Chi Tiết Này */}
                  <div className="pt-6 border-t border-slate-800/50 text-left space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-d+ w-1 bg-primary rounded-full"></div>
                      <div>
                        <h4 className="text-slate-900 text-xs font-bold tracking-wider text-primary-light">
                          Tối ưu SEO cho trang chi tiết này (Tùy chọn)
                        </h4>
                        <p className="text-[10px] text-slate-700 font-light mt-0.5">
                          Nếu không cài đặt, hệ thống sẽ tự động ghép tiêu đề
                          chính và mô tả tóm tắt của bài làm SEO.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500">
                          Meta Title (Tiêu đề riêng của trang này)
                        </label>
                        <input
                          type="text"
                          value={itemSeoTitle}
                          onChange={(e) => setItemSeoTitle(e.target.value)}
                          placeholder="Ví dụ: Lâu đài Chateau Phú Mỹ Hưng bán giá tốt nhất - Greenia Homes"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3  py-[10px] text-[10px] text-slate-900 outline-none focus:border-primary font-sans"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500">
                          Meta Description (Mô tả thu hút lôi cuốn người tìm)
                        </label>
                        <textarea
                          value={itemSeoDesc}
                          onChange={(e) => setItemSeoDesc(e.target.value)}
                          placeholder="Mô tả cụ thể thông số, các điểm nhấn của bất động sản/bài viết này..."
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none focus:border-primary font-sans"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500">
                          Meta Keywords (Từ khóa ngăn cách bằng dấu phẩy)
                        </label>
                        <input
                          type="text"
                          value={itemSeoKeywords}
                          onChange={(e) => setItemSeoKeywords(e.target.value)}
                          placeholder="Ví dụ: chateau phu my hung, ban biet thu chateau, biet thu quan 7"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-900 outline-none focus:border-primary font-sans"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-1">
                        <label className="text-[10px] font-bold text-slate-500">
                          Schema Rating (Số sao ban đầu)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={itemBaseRating}
                          onChange={(e) => setItemBaseRating(e.target.value)}
                          placeholder="Mặc định: 5.0"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 min-h-[32px] text-[10px] text-slate-900 outline-none focus:border-primary font-sans"
                        />
                        <p className="text-[9px] text-slate-500 font-sans mt-1">Từ 1 đến 5.</p>
                      </div>

                      <div className="space-y-1 md:col-span-1">
                        <label className="text-[10px] font-bold text-slate-500">
                          Schema Review Count (Khởi điểm)
                        </label>
                        <input
                          type="number"
                          value={itemBaseReviewCount}
                          onChange={(e) => setItemBaseReviewCount(e.target.value)}
                          placeholder="Mặc định: 0"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 min-h-[32px] text-[10px] text-slate-900 outline-none focus:border-primary font-sans"
                        />
                        <p className="text-[9px] text-slate-500 font-sans mt-1">Sẽ cộng dồn khi khách hàng đánh giá thật.</p>
                      </div>
                    </div>
                  </div>

                  {/* Action row buttons */}
                  {uploadStatus && (
                    <div className="bg-white border border-slate-200 p-3.5 rounded-lg flex items-center gap-3 text-xs text-amber-500 font-mono my-3 shadow-inner">
                      <span className="w-2 h-d+ rounded-full bg-amber-500 animate-ping"></span>
                      <span className="font-semibold">{uploadStatus}</span>
                    </div>
                  )}

                  {isEditing && (
                    <div className="bg-primary/10 border border-primary/20 text-amber-300 p-4 rounded-lg text-xs flex items-center justify-between">
                      <span>
                        Bạn đang sửa bài viết có ID:{" "}
                        <strong>{editingItemId}</strong>. Ấn hủy để biến dọn
                        sạch.
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelWizard}
                        className="bg-slate-200 text-slate-800 hover:bg-slate-300 px-3 py-1 rounded-lg font-bold transition-colors"
                      >
                        Hủy sửa
                      </button>
                    </div>
                  )}

                  <div className="flex justify-end gap-3.5 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      disabled={isUploading || loading}
                      onClick={
                        isEditing
                          ? handleCancelWizard
                          : () => setActiveTab("listings")
                      }
                      className="bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isEditing ? "Hủy và dọn sạch" : "Trở lại"}
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading || loading}
                      className={`bg-primary hover:opacity-90 active:scale-95 text-white font-bold text-xs py-2.5 px-6 rounded-lg transition-all flex items-center gap-2 ${isUploading || loading
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                        }`}
                    >
                      {isUploading || loading ? (
                        <>
                          <span className="w-3.5 h-2.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                          <span>Đang xử lý...</span>
                        </>
                      ) : (
                        <span>
                          {isEditing
                            ? "Cập nhật"
                            : "Đăng"}
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* =========================================================
            OVERLAY MODAL DIAGRAM: IMAGE LIBRARY POPUP SELECTOR
            ========================================================= */}


            {isLibraryOpen && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-lg">
                    <div>
                      <h3 className="text-slate-900 font-display font-bold text-sm tracking-wider flex items-center gap-2">
                        <Image className="w-4 h-3 text-primary" />
                        <span>Chọn Hình Ảnh Từ Kho Thư Viện</span>
                      </h3>
                      <p className="text-slate-700 text-[11px] mt-0.5">
                        Click vào bất kỳ hình ảnh nào bên dưới để áp dụng trực
                        tiếp cho trường dữ liệu ảnh đang chỉnh sửa.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleImageUpload(e, "library")}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={isUploading}
                        />
                        <button
                          type="button"
                          className="text-primary hover:text-white text-xs font-semibold flex items-center gap-1.5 py-2 px-4 bg-primary/10 hover:bg-primary border border-primary/20 hover:border-primary rounded-lg transition-all cursor-pointer"
                        >
                          {isUploading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang Tải...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Tải ảnh mới lên</span>
                            </>
                          )}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsLibraryOpen(false);
                          setLibraryTargetField(null);
                        }}
                        className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold cursor-pointer py-2 px-4 bg-white border border-slate-200 rounded-lg transition-all"
                      >
                        Đóng lại
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {libraryImages.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-slate-700 text-xs">
                          Chưa có hình ảnh nào khả dụng trong kho thư viện.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {libraryImages.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              if (libraryTargetField === "album" || libraryTargetField === "floorPlanAlbum" || libraryTargetField === "amenityAlbum") {
                                setSelectedLibraryImages(prev => 
                                  prev.includes(imgUrl) ? prev.filter(url => url !== imgUrl) : [...prev, imgUrl]
                                );
                              } else {
                                handleSelectFromLibrary(imgUrl);
                              }
                            }}
                            className={`bg-white border ${selectedLibraryImages.includes(imgUrl) ? 'border-primary ring-2 ring-primary' : 'border-slate-200'} rounded-lg overflow-hidden group cursor-pointer hover:border-primary transition-all shadow-md relative group/lib`}
                          >
                            <div className="aspect-[4/3] w-full relative">
                              <img loading="lazy" decoding="async"
                                src={(imgUrl) || undefined}
                                alt={`Library modal item #${idx}`}
                                className="w-full h-full object-cover group-hover/lib:scale-105 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                              />
                              <div className={`absolute inset-0 transition-all flex items-center justify-center ${selectedLibraryImages.includes(imgUrl) ? 'bg-black/40 opacity-100' : 'bg-black/20 opacity-0 group-hover/lib:opacity-100'}`}>
                                <span className={`font-bold text-[10px] px-3 py-1.5 rounded-full tracking-wider shadow-lg ${selectedLibraryImages.includes(imgUrl) ? 'bg-rose-500 text-white' : 'bg-primary text-white'}`}>
                                  {selectedLibraryImages.includes(imgUrl) ? "Bỏ chọn" : "Áp dụng"}
                                </span>
                              </div>
                            </div>
                            <div className="p-2 bg-slate-50 border-t border-slate-100">
                              <span className="text-[9px] font-mono text-slate-500 truncate block">
                                {imgUrl}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLibraryOpen(false);
                        setLibraryTargetField(null);
                        setSelectedLibraryImages([]);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-lg transition-all cursor-pointer"
                    >
                      Đóng
                    </button>
                    {(libraryTargetField === "album" || libraryTargetField === "floorPlanAlbum" || libraryTargetField === "amenityAlbum") && selectedLibraryImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                           if (libraryTargetField === "album") {
                             setImageUrls((prev) => [...prev, ...selectedLibraryImages]);
                           } else if (libraryTargetField === "floorPlanAlbum") {
                             setFloorPlanImages((prev) => [...prev, ...selectedLibraryImages]);
                           } else if (libraryTargetField === "amenityAlbum") {
                             setAmenityImages((prev) => [...prev, ...selectedLibraryImages]);
                           }
                           onShowNotification(`Đã chèn ${selectedLibraryImages.length} ảnh từ kho thư viện!`, "success");
                           setIsLibraryOpen(false);
                           setLibraryTargetField(null);
                           setSelectedLibraryImages([]);
                        }}
                        className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all cursor-pointer shadow-md"
                      >
                        Áp dụng {selectedLibraryImages.length} ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
            OVERLAY MODAL DIAGRAM: INTERNAL LINK SELECTOR
            ========================================================= */}
            {isInternalLinkModalOpen && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-black/20">
                    <div>
                      <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        <span className="bg-emerald-400/10 p-1.5 rounded-md">
                          <Bookmark className="w-4 h-4 text-emerald-400" />
                        </span>
                        LIÊN KẾT BÀI VIẾT NỘI BỘ
                      </h3>
                      <p className="text-slate-500 text-[10px] mt-1">
                        Tìm kiếm và chèn đường dẫn sản phẩm, dự án hoặc bài tin
                        tức có sẵn vào nội dung đang soạn thảo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInternalLinkModalOpen(false);
                        setEditorCursorMatch(null);
                      }}
                      className="text-slate-700 hover:text-slate-900 text-xs font-semibold cursor-pointer py-1.5 px-3 bg-white border border-slate-200 rounded-lg transition-colors"
                    >
                      Đóng lại
                    </button>
                  </div>

                  <div className="p-5 flex-1 min-h-[50vh] overflow-y-auto space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={internalLinkSearch}
                        onChange={(e) => setInternalLinkSearch(e.target.value)}
                        placeholder="Tìm theo tiêu đề bài viết, sản phẩm..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3  py-[10px] text-[10px] text-slate-900 outline-none focus:border-primary transition-colors"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
                    </div>

                    <div className="space-y-3">
                      {/* Flatten and filter items */}
                      {[
                        ...products.map((p) => ({
                          ...p,
                          _type: "product",
                          _label: "Sản Phẩm",
                        })),
                        ...projects.map((p) => ({
                          ...p,
                          _type: "project",
                          _label: "Dự Án",
                        })),
                        ...news.map((p) => ({
                          ...p,
                          _type: "news",
                          _label: "Tin Tức",
                        })),
                      ]
                        .filter(
                          (item) =>
                            item.title &&
                            item.title
                              .toLowerCase()
                              .includes(internalLinkSearch.toLowerCase()),
                        )
                        .map((item) => {
                          let href = "";
                          if (item._type === "product")
                            href = `#product/${item.id}`;
                          else if (item._type === "project")
                            href = `#project/${item.id}`;
                          else if (item._type === "news")
                            href = `#news/${item.id}`;

                          return (
                            <div
                              key={`${item._type}-${item.id}`}
                              onClick={() => {
                                if (editorCursorMatch) {
                                  const { start, end, text } =
                                    editorCursorMatch;
                                  const selected =
                                    text.substring(start, end) || item.title;
                                  const imgTag = `<a href="${href}" class="text-emerald-400 font-medium hover:underline cursor-pointer transition-colors" title="${item.title}">${selected}</a>`;
                                  setHtmlContent(
                                    text.substring(0, start) +
                                    imgTag +
                                    text.substring(end),
                                  );
                                  setEditorCursorMatch(null);
                                } else {
                                  setHtmlContent(
                                    (prev) =>
                                      prev +
                                      `<a href="${href}" class="text-emerald-400 font-medium hover:underline cursor-pointer transition-colors" title="${item.title}">${item.title}</a>`,
                                  );
                                }
                                onShowNotification(
                                  "Đã chèn liên kết nội bộ thành công!",
                                  "success",
                                );
                                setIsInternalLinkModalOpen(false);
                              }}
                              className="bg-white border border-slate-200 p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:border-primary hover:bg-slate-100 transition-all group"
                            >
                              <img loading="lazy" decoding="async"
                                src={(item.imageUrl) || undefined}
                                alt=""
                                className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${item._type === "product"
                                        ? "bg-primary/20 text-primary"
                                        : item._type === "project"
                                          ? "bg-indigo-500/20 text-indigo-400"
                                          : "bg-sky-500/20 text-sky-400"
                                      }`}
                                  >
                                    {item._label}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono truncate">
                                    {window.location.origin}/{href}
                                  </span>
                                </div>
                                <h4 className="text-xs font-semibold text-slate-800 truncate group-hover:text-emerald-400 transition-colors">
                                  {item.title}
                                </h4>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* GitHub Configuration Modal – luôn hiển thị trên mọi tab */}
      {showGithubConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-slate-50 border border-slate-200 rounded-lg w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-primary-light" />
                <h3 className="font-bold text-xs text-slate-800 tracking-widest font-mono">
                  Cấu hình đồng bộ GitHub
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowGithubConfigModal(false);
                  setConfigToken("");
                }}
                className="text-slate-700 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGithubConfig} className="p-6 space-y-4">
              <div className="bg-amber-950/20 border border-primary/15 p-3.5 rounded-lg text-left space-y-1">
                <span className="text-[10px] font-mono font-bold text-primary-light">
                  Lưu vào Firestore
                </span>
                <p className="text-[11px] text-slate-800 leading-relaxed font-sans">
                  Token PAT được mã hóa Base64 trước khi lưu vào Firestore.
                  Sau khi lưu, bạn có thể tải ảnh WebP lên GitHub ngay trên web
                  production.
                </p>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-slate-700 font-bold block">
                  GitHub Personal Access Token (PAT){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={configToken}
                  onChange={(e) => setConfigToken(e.target.value)}
                  placeholder="github_pat_... hoặc ghp_..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-[10px] text-[10px] text-slate-800 outline-none focus:border-primary transition-colors placeholder:text-slate-500"
                />
                <span className="text-[10px] text-slate-700 block mt-1 leading-normal font-sans">
                  Quyền <code>repo</code> hoặc <code>public_repo</code>.{" "}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-500 hover:underline inline"
                  >
                    Tạo PAT mới
                  </a>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-700 font-bold block">
                    Owner <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={configOwner}
                    onChange={(e) => setConfigOwner(e.target.value)}
                    placeholder="mrliga1"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-800 outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-700 font-bold block">
                    Repository <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={configRepo}
                    onChange={(e) => setConfigRepo(e.target.value)}
                    placeholder="web1"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-800 outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-slate-700 font-bold block">
                  Branch
                </label>
                <input
                  type="text"
                  required
                  value={configBranch}
                  onChange={(e) => setConfigBranch(e.target.value)}
                  placeholder="main"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 min-h-[32px] py-1.5 text-[10px] text-slate-800 outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowGithubConfigModal(false);
                    setConfigToken("");
                  }}
                  className="bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold px-4.5 py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Đóng lại
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className={`bg-primary hover:bg-amber-600 active:scale-95 text-black font-bold text-xs py-2.5 px-5 rounded-lg transition-all flex items-center gap-2 ${savingConfig ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {savingConfig ? "ĐANG LƯU..." : "LƯU CẤU HÌNH"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
