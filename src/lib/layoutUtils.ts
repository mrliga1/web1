export function serializeSectionsForDatabase(sects: any[]): any[] {
  if (!Array.isArray(sects)) return [];
  return sects.map((sect) => {
    if (!sect) return sect;
    const newSect = { ...sect };
    if (newSect.extraData) {
      const newExtraData = { ...newSect.extraData };
      if (Array.isArray(newExtraData.elements)) {
        newExtraData.elements = newExtraData.elements.map((el: any) => {
          if (el && el.type === "table" && el.tableData) {
            const newTableData = { ...el.tableData };
            if (Array.isArray(newTableData.rows)) {
              newTableData.rows = newTableData.rows.map((row: any) => {
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
    return newSect;
  });
}

export function deserializeSectionsFromDatabase(sects: any[]): any[] {
  if (!Array.isArray(sects)) return [];
  return sects.map((sect) => {
    if (!sect) return sect;
    const newSect = { ...sect };
    if (newSect.extraData) {
      const newExtraData = { ...newSect.extraData };
      if (Array.isArray(newExtraData.elements)) {
        newExtraData.elements = newExtraData.elements.map((el: any) => {
          if (el && el.type === "table" && el.tableData) {
            const newTableData = { ...el.tableData };
            if (Array.isArray(newTableData.rows)) {
              newTableData.rows = newTableData.rows.map((row: any) => {
                if (row && typeof row === "object" && Array.isArray(row.cols)) {
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
    return newSect;
  });
}

export function sanitizeHomeSections(sects: any[]): any[] {
  if (!Array.isArray(sects)) return [];
  // 1. Remove custom_testimonials or any testimonial sections, reviews, feedback, or opinions
  let filtered = sects.filter((s) => {
    if (!s) return false;
    const lowerId = (s.id || "").toLowerCase();
    const lowerName = (s.name || "").toLowerCase();
    const lowerTitle = (s.title || "").toLowerCase();

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

    // Check if it's a free-form canvas that contains testimonial or pricing info
    if (
      s.id &&
      s.id.startsWith("custom_free_canvas") &&
      s.extraData &&
      Array.isArray(s.extraData.elements)
    ) {
      const hasTestimonialOrPricing = s.extraData.elements.some((el: any) => {
        if (!el) return false;
        const lowerElContent = (el.content || "").toLowerCase();
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
        return false; // Remove the entire section!
      }
    }
    return true;
  });

  filtered = filtered.map((s) => {
    let newS = { ...s };
    return newS;
  });

  // 2. Ensure news section exists and is visible
  const hasNews = filtered.some((s) => s && s.id === "news");
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
    };
    filtered.push(newsDefaultObj);
  } else {
    // Make sure news is visible
    filtered = filtered.map((s) => {
      if (s && s.id === "news") {
        return { ...s, visible: true };
      }
      return s;
    });
  }

  return filtered;
}
