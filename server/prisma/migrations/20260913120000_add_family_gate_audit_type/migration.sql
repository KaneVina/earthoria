-- AlterEnum
-- Thêm giá trị mới vào enum ChildAuditType đã có sẵn: ghi nhận mỗi lần
-- phụ huynh mở "cổng PIN" bảo vệ toàn bộ trang /family (không phải mở khoá
-- thiết bị của một bé cụ thể - trường hợp đó dùng UNLOCK sẵn có).
ALTER TYPE "ChildAuditType" ADD VALUE 'FAMILY_GATE_UNLOCK';