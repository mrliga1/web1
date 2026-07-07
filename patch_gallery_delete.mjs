import fs from 'fs';

const filePath = 'src/components/AdminPanel.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const replacement = `  const handleBulkDeleteImages = async () => {
    if (selectedGalleryImages.length === 0) return;
    if (!window.confirm(\`Bạn có chắc chắn muốn xóa \${selectedGalleryImages.length} ảnh đã chọn khỏi hệ thống?\`)) return;
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
      onShowNotification(\`Đã xóa \${successCount} ảnh thành công!\`, "success");
    } catch (error: any) {
      console.error(error);
      onShowNotification("Có lỗi xảy ra khi xóa hàng loạt", "error");
    } finally {
      setLoading(false);
    }
  };`;

// We will replace the existing handleBulkDeleteImages function.
const regex = /const handleBulkDeleteImages = async \(\) => \{[\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\};/m;

content = content.replace(regex, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Done patching bulk delete');
