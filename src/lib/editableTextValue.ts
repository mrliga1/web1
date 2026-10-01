// Giữ nguyên các thay thế nội dung đã dùng trong bản công khai và trình chỉnh sửa.
export function normalizeEditableTextValue(value?: string): string {
    let initial = value || '';
    const oldText = "Giao dịch minh bạch qua 4 bước khép kín: Thẩm định giá chính thực, Thẩm định tính pháp lý sổ hồng, Trao đổi phân tích sâu cùng chuyên gia nhãn quan phong thủy, và Hoàn công bàn giao dồi dào tài lộc";
    const newText = "Giao dịch minh bạch qua 4 bước khép kín: Thẩm định giá chính thực, Thẩm định tính pháp lý sổ hồng, Trao đổi phân tích chuyên sâu tiềm năng sản phẩm, và Hoàn thành giao dịch, hỗ trợ hậu mãi và pháp lý...";
    initial = initial.replace(oldText, newText);
    initial = initial.replace(/12,500\+/gi, "1,500+");
    initial = initial.replace(/12,500/g, "1,500");
    initial = initial.replace(/0% rủi ro/gi, "0% Lo ngại");
    initial = initial.replace(/0% lo ngại/gi, "0% Lo ngại");
    initial = initial.replace(/Phong thủy độc bách cát tường/gi, "Phân tích chuyên sâu pháp lý, thị trường");
    initial = initial.replace(/Giải pháp độc quyền phong thủy/gi, "Phân tích chuyên sâu pháp lý, thị trường");
    initial = initial.replace(/Đội tuyển đại sư tư vấn địa thế hướng phong, bài bài bài trí rước sinh khí dồi dào tài lộc của gia chủ sâu sắc tinh tường./gi, "Đội ngũ chuyên gia phân tích kỹ lưỡng tiềm năng tăng giá, pháp lý và tính thanh khoản, đảm bảo lợi nhuận và an toàn tuyệt đối cho dòng vốn của nhà đầu tư.");
    return initial;
}
