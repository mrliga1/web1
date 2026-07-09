import fs from 'fs';

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const regex = /const handleBulkDeleteImages = async \(\) => \{[\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\};\s*const handleBulkDeleteImages/m;

// Find the first handleBulkDeleteImages and keep it, but remove the second one.
// Wait, the regex matched up to handleDeleteSingleImage in the previous script.
// So the injected code contains:
// purgeImageUrlsFromDB
// deleteImageFromGithub
// handleDeleteSingleImage
// handleBulkDeleteImages (the new one)
// then right after that:
// const handleBulkDeleteImages = async () => { ... } (the old one)

// Let's just remove the second one explicitly by finding its exact start
content = content.replace(/const handleBulkDeleteImages = async \(\) => \{\s*if \(selectedGalleryImages\.length === 0\) return;\s*if \(!window\.confirm\(`Bạn có chắc chắn muốn xóa \$\{selectedGalleryImages\.length\} ảnh đã chọn khỏi hệ thống\?`\)\) return;\s*try \{\s*setLoading\(true\);\s*let successCount = 0;\s*for \(const imgUrl of selectedGalleryImages\) \{\s*const res = await fetch\(`\/api\/github\?path=\$\{encodeURIComponent\(imgUrl\)\}`,\s*\{\s*method: "DELETE",\s*\}\s*\);\s*if \(res\.ok\) \{\s*successCount\+\+;\s*await purgeImageUrlFromDB\(imgUrl\);\s*setUploadedLibraryImages\(prev => prev\.filter\(u => u !== imgUrl\)\);\s*\}\s*\}\s*setSelectedGalleryImages\(\[\]\);\s*onShowNotification\(`Đã xóa \$\{successCount\} ảnh thành công!`, "success"\);\s*\} catch \(error: any\) \{\s*console\.error\(error\);\s*onShowNotification\("Có lỗi xảy ra khi xóa hàng loạt", "error"\);\s*\} finally \{\s*setLoading\(false\);\s*\}\s*\};/m, '');

fs.writeFileSync('src/components/AdminPanel.tsx', content, 'utf8');
console.log('Removed duplicate handleBulkDeleteImages');
