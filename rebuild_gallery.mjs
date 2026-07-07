import fs from 'fs';

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// 1. Inject selectedGalleryImages state
if (!content.includes('const [selectedGalleryImages, setSelectedGalleryImages]')) {
  content = content.replace(
    /const \[uploadedLibraryImages, setUploadedLibraryImages\] = useState<string\[\]>\([\s\S]*?\);/,
    `$&
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>([]);`
  );
}

// 2. Inject purgeImageUrlFromDB, handleDeleteSingleImage, handleBulkDeleteImages
const funcs = `
  const purgeImageUrlFromDB = async (imgUrl: string) => {
    try {
      const productsToUpdate = products.filter(p => p.imageUrl === imgUrl || p.imageUrls?.includes(imgUrl));
      for (const p of productsToUpdate) {
        const updateData: any = {};
        if (p.imageUrl === imgUrl) updateData.imageUrl = "";
        if (p.imageUrls?.includes(imgUrl)) updateData.imageUrls = p.imageUrls.filter((g: string) => g !== imgUrl);
        await updateDoc(doc(db, "products", p.id), updateData);
      }
      
      const projectsToUpdate = projects.filter(p => p.imageUrl === imgUrl || p.imageUrls?.includes(imgUrl));
      for (const p of projectsToUpdate) {
        const updateData: any = {};
        if (p.imageUrl === imgUrl) updateData.imageUrl = "";
        if (p.imageUrls?.includes(imgUrl)) updateData.imageUrls = p.imageUrls.filter((g: string) => g !== imgUrl);
        await updateDoc(doc(db, "projects", p.id), updateData);
      }

      const newsToUpdate = news.filter(n => n.thumbnail === imgUrl);
      for (const n of newsToUpdate) {
        await updateDoc(doc(db, "articles", n.id), { thumbnail: "" });
      }
    } catch (e) {
      console.error("Lỗi khi xóa ảnh khỏi database:", e);
    }
  };

  const handleDeleteSingleImage = async (imgUrl: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi hệ thống?")) return;
    try {
      setLoading(true);
      const res = await fetch(\`/api/github?path=\${encodeURIComponent(imgUrl)}\`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Lỗi khi xóa ảnh trên GitHub");
      
      await purgeImageUrlFromDB(imgUrl);
      setUploadedLibraryImages(prev => prev.filter(u => u !== imgUrl));
      setDeletedImageUrls(prev => [...prev, imgUrl]);
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
      for (const imgUrl of selectedGalleryImages) {
        const res = await fetch(\`/api/github?path=\${encodeURIComponent(imgUrl)}\`, {
          method: "DELETE",
        });
        if (res.ok) {
          successCount++;
          await purgeImageUrlFromDB(imgUrl);
          setUploadedLibraryImages(prev => prev.filter(u => u !== imgUrl));
          setDeletedImageUrls(prev => [...prev, imgUrl]);
        }
      }
      setSelectedGalleryImages([]);
      onShowNotification(\`Đã xóa \${successCount} ảnh thành công!\`, "success");
    } catch (error: any) {
      console.error(error);
      onShowNotification("Có lỗi xảy ra khi xóa hàng loạt", "error");
    } finally {
      setLoading(false);
    }
  };

`;

if (!content.includes('handleDeleteSingleImage = async')) {
  content = content.replace('const handleDeleteContent = async', funcs + 'const handleDeleteContent = async');
}

// 3. Update Gallery UI
const galleryHeaderTarget = /<h3 className="font-display font-medium text-slate-900 text-base tracking-wider flex items-center gap-2">[\s\S]*?<\/p>\s*<\/div>\s*<\/div>/;

const galleryHeaderReplacement = \`<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3 mb-4">
                  <div>
                    <h3 className="font-display font-medium text-slate-900 text-base tracking-wider flex items-center gap-2">
                      <Image className="w-5 h-5 text-primary" />
                      <span>Kho Thư Viện Hình Ảnh</span>
                    </h3>
                    <p className="text-slate-700 text-xs mt-1">
                      Đang hiển thị {libraryImages.length} tài nguyên ảnh đã sử
                      dụng trên hệ thống Greenia Homes.
                    </p>
                  </div>
                  {selectedGalleryImages.length > 0 && (
                    <div className="flex items-center gap-2 bg-primary/5 p-1.5 rounded-lg border border-primary/20">
                      <span className="text-[11px] font-bold text-primary px-2">Đã chọn: {selectedGalleryImages.length}</span>
                      <button
                        onClick={handleBulkDeleteImages}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] px-3 py-1.5 rounded transition-all"
                      >
                        Xóa {selectedGalleryImages.length} ảnh
                      </button>
                      <button
                        onClick={() => setSelectedGalleryImages([])}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] px-3 py-1.5 rounded transition-all"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  )}
                </div>\`;
content = content.replace(galleryHeaderTarget, galleryHeaderReplacement);

// 4. Inject checkboxes and delete buttons to images
// We need to carefully replace the mapping of libraryImages
const mappingTargetStr = \`<div
                        key={index}
                        className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden group hover:border-primary/50 transition-all shadow-md relative"\`;

const mappingReplacementStr = \`<div
                        key={index}
                        className={\`bg-slate-50 border rounded-lg overflow-hidden group hover:border-primary/50 transition-all shadow-md relative \${selectedGalleryImages.includes(imgUrl) ? 'border-primary ring-2 ring-primary/30' : 'border-slate-200'}\`}
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
                        </div>\`;
content = content.replace(mappingTargetStr, mappingReplacementStr);

// 5. Replace dark mode card footer and add single delete button in the hover overlay
// Let's replace the single delete button first
const overlayTarget = /Sao chép Link\s*<\/button>\s*<\/div>\s*<\/div>/;
const overlayReplacement = \`Sao chép Link
                            </button>
                            <button
                              onClick={() => handleDeleteSingleImage(imgUrl)}
                              className="bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer mt-1"
                            >
                              Xóa ảnh
                            </button>
                          </div>
                        </div>\`;
content = content.replace(overlayTarget, overlayReplacement);

// Let's fix the footer colors
const footerTarget = /<div className="p-3 bg-zinc-900\/80 border-t border-slate-800\/50 flex flex-col justify-between">/g;
const footerReplacement = \`<div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col justify-between">\`;
content = content.replace(footerTarget, footerReplacement);

fs.writeFileSync('src/components/AdminPanel.tsx', content, 'utf8');
console.log('Rebuilt image gallery with bulk actions and fixed colors.');
