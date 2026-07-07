import fs from 'fs';

const filePath = 'src/components/AdminPanel.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const replacement = `  const purgeImageUrlsFromDB = async (urlsToDelete: string[]) => {
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
        filePath = \`public/uploads/\${imgUrl.split('/').pop()}\`;
      }
    } catch(e) {
      filePath = \`public/uploads/\${imgUrl.split('/').pop()}\`;
    }

    if (!filePath) {
       throw new Error("Không thể xác định đường dẫn file.");
    }

    const githubApiUrl = \`https://api.github.com/repos/\${owner}/\${repo}/contents/\${filePath}\`;
    
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
       if (getRes.status === 404) return true; // Already deleted
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
        message: \`Xóa ảnh \${filePath} từ Admin\`,
        sha: sha,
        branch: branch,
      })
    });

    if (!delRes.ok) {
      throw new Error("Lỗi khi gửi yêu cầu xóa lên GitHub");
    }

    return true;
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
    if (!window.confirm(\`Bạn có chắc chắn muốn xóa \${selectedGalleryImages.length} ảnh đã chọn khỏi hệ thống?\`)) return;
    try {
      setLoading(true);
      let successCount = 0;
      let successfullyDeletedUrls: string[] = [];
      for (const imgUrl of selectedGalleryImages) {
        try {
          await deleteImageFromGithub(imgUrl);
          successCount++;
          successfullyDeletedUrls.push(imgUrl);
        } catch(e) {
          console.error("Lỗi xóa ảnh:", imgUrl, e);
        }
      }
      if (successfullyDeletedUrls.length > 0) {
        await purgeImageUrlsFromDB(successfullyDeletedUrls);
        setUploadedLibraryImages(prev => prev.filter(u => !successfullyDeletedUrls.includes(u)));
      }
      setSelectedGalleryImages([]);
      onShowNotification(\`Đã xóa \${successCount} ảnh thành công!\`, "success");
    } catch (error: any) {
      console.error(error);
      onShowNotification("Có lỗi xảy ra khi xóa hàng loạt", "error");
    } finally {
      setLoading(false);
    }
  };`;

// Use regex to match the three functions
const regex = /const purgeImageUrlFromDB = async \([\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\};/m;

content = content.replace(regex, replacement);

// Also let's fix the sticky header for the gallery
content = content.replace(
  'className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-200 p-6 rounded-lg gap-3 mb-6"',
  'className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-200 p-6 rounded-lg gap-3 mb-6 sticky top-2 z-20 shadow-sm"'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done replacing DB purge logic and pinning the header');
