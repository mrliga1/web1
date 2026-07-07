import fs from 'fs';

const filePath = 'src/components/AdminPanel.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const replacement = `  const deleteImageFromGithub = async (imgUrl: string) => {
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
        filePath = \`uploads/\${imgUrl.split('/').pop()}\`;
      }
    } catch(e) {
      filePath = \`uploads/\${imgUrl.split('/').pop()}\`;
    }

    if (!filePath) {
       throw new Error("Không thể xác định đường dẫn file.");
    }

    const githubApiUrl = \`https://api.github.com/repos/\${owner}/\${repo}/contents/\${filePath}\`;
    
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
          message: \`Xóa ảnh \${filePath} từ Admin\`,
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
          // Wait to prevent GitHub API rate limit and tree lock conflicts
          await new Promise(r => setTimeout(r, 800));
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

const regex = /const deleteImageFromGithub = async \([\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\};/m;

content = content.replace(regex, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done patching Github delete logic');
