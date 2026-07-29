type LayoutRecord = Record<string, unknown>;

interface LayoutElement extends LayoutRecord {
  type?: string;
  content?: string;
  tableData?: LayoutRecord & {
    rows?: unknown[];
    headers?: unknown[];
  };
}

interface LayoutSection extends LayoutRecord {
  id?: string;
  name?: string;
  title?: string;
  visible?: boolean;
  extraData?: LayoutRecord & {
    elements?: LayoutElement[];
  };
}

const isRecord = (value: unknown): value is LayoutRecord => {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
};

const getText = (value: unknown) => (typeof value === "string" ? value : "");

export function serializeSectionsForDatabase<T extends object>(sects: T[]): T[] {
  if (!Array.isArray(sects)) return [];
  return sects.map((sect) => {
    if (!sect) return sect;
    const newSect = { ...sect } as LayoutSection;
    if (newSect.extraData) {
      const newExtraData = { ...newSect.extraData };
      if (Array.isArray(newExtraData.elements)) {
        newExtraData.elements = newExtraData.elements.map((el: LayoutElement) => {
          if (el && el.type === "table" && el.tableData) {
            const newTableData = { ...el.tableData };
            if (Array.isArray(newTableData.rows)) {
              newTableData.rows = newTableData.rows.map((row: unknown) => {
                if (Array.isArray(row)) {
                  return { cols: row };
                }
                return row;
              });
            }
            return { ...el, tableData: newTableData };
          }
          return el;
        });
      }
      newSect.extraData = newExtraData;
    }
    return newSect as T;
  });
}

export function deserializeSectionsFromDatabase<T extends object>(sects: T[]): T[] {
  if (!Array.isArray(sects)) return [];
  return sects.map((sect) => {
    if (!sect) return sect;
    const newSect = { ...sect } as LayoutSection;
    if (newSect.extraData) {
      const newExtraData = { ...newSect.extraData };
      if (Array.isArray(newExtraData.elements)) {
        newExtraData.elements = newExtraData.elements.map((el: LayoutElement) => {
          if (el && el.type === "table" && el.tableData) {
            const newTableData = { ...el.tableData };
            if (Array.isArray(newTableData.rows)) {
              newTableData.rows = newTableData.rows.map((row: unknown) => {
                if (isRecord(row) && Array.isArray(row.cols)) {
                  return row.cols;
                }
                return row;
              });
            }
            return { ...el, tableData: newTableData };
          }
          return el;
        });
      }
      newSect.extraData = newExtraData;
    }
    return newSect as T;
  });
}

export function sanitizeHomeSections<T extends object>(sects: T[]): T[] {
  if (!Array.isArray(sects)) return [];
  let filtered = sects.filter((s) => {
    if (!s) return false;
    const section = s as LayoutSection;
    const lowerId = getText(section.id).toLowerCase();
    const lowerName = getText(section.name).toLowerCase();
    const lowerTitle = getText(section.title).toLowerCase();

    if (
      lowerId.includes("testimonial") ||
      lowerId.includes("opinion") ||
      lowerId.includes("feedback") ||
      lowerId.includes("review")
    ) {
      return false;
    }
    if (
      lowerName.includes("ý kiến") ||
      lowerName.includes("nhận xét") ||
      lowerName.includes("cảm nhận") ||
      lowerName.includes("testimonial")
    ) {
      return false;
    }
    if (lowerTitle.includes("ý kiến") && lowerTitle.includes("khách hàng")) {
      return false;
    }
    if (lowerTitle.includes("lời khẳng định từ quý hội viên")) {
      return false;
    }

    // Kiểm tra canvas tự do có chứa đánh giá hoặc thông tin báo giá.
    if (
      section.id &&
      section.id.startsWith("custom_free_canvas") &&
      section.extraData &&
      Array.isArray(section.extraData.elements)
    ) {
      const hasTestimonialOrPricing = section.extraData.elements.some((el) => {
        if (!el) return false;
        const lowerElContent = getText(el.content).toLowerCase();
        if (
          lowerElContent.includes("ý kiến") ||
          lowerElContent.includes("báo giá") ||
          lowerElContent.includes("trị giá") ||
          lowerElContent.includes("testimonial")
        ) {
          return true;
        }
        if (
          el.type === "table" &&
          el.tableData &&
          Array.isArray(el.tableData.headers)
        ) {
          const lowerHeaders = el.tableData.headers.join(" ").toLowerCase();
          if (
            lowerHeaders.includes("mức giá") ||
            lowerHeaders.includes("báo giá")
          ) {
            return true;
          }
        }
        return false;
      });
      if (hasTestimonialOrPricing) {
        return false;
      }
    }
    return true;
  });

  filtered = filtered.map((s) => {
    const newS = { ...s };
    return newS;
  });

  // Đảm bảo khối tin tức luôn tồn tại và được hiển thị.
  const hasNews = filtered.some((s) => {
    const section = s as LayoutSection;
    return section && section.id === "news";
  });

  if (!hasNews) {
    const newsDefaultObj = {
      id: "news",
      name: "Kinh Nghiệm & Phân Tích Địa Ốc",
      visible: true,
      paddingTop: 80,
      paddingBottom: 80,
      title: "Kinh Nghiệm & Phân Tích Địa Ốc",
      subtitle: "Góc nhìn chuyên gia",
      description:
        "Tin nhanh vi mô và phong thủy phong phú cung cấp từ đội ngũ biên soạn Greenia.",
    } as T;
    filtered.push(newsDefaultObj);
  } else {
    filtered = filtered.map((s) => {
      const section = s as LayoutSection;
      if (section && section.id === "news") {
        return { ...s, visible: true };
      }
      return s;
    });
  }

  return filtered;
}
