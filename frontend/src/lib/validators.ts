import { z } from "zod";

export const CATEGORIES = [
  "Tạp chí",
  "Báo in",
  "Báo điện tử",
  "Phát thanh",
  "Truyền hình",
  "Video clip",
  "Poster/Infographic",
] as const;

export const FORMATS = ["DOCX", "MP4", "PODCAST", "IMAGE"] as const;

export const submissionSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  studentId: z.string().min(5, "Mã sinh viên không hợp lệ").max(20, "Mã sinh viên không được vượt quá 20 ký tự"),
  classId: z.string().min(2, "Mã lớp không hợp lệ").max(15, "Mã lớp không được vượt quá 15 ký tự"),
  birthYear: z.string().regex(/^\d{4}$/, "Năm sinh phải là 4 chữ số"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().regex(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ"),
  workTitle: z.string().min(2, "Tên tác phẩm không được để trống").max(200, "Tên tác phẩm không được vượt quá 200 ký tự"),
  category: z.enum(CATEGORIES, {
    message: "Vui lòng chọn thể loại"
  }),
  format: z.enum(FORMATS, {
    message: "Vui lòng chọn định dạng"
  }),
  isGroup: z.boolean().optional(),
  teamMembers: z.array(
    z.object({
      fullName: z.string().min(2, "Họ tên quá ngắn"),
      studentId: z.string().min(5, "Mã sinh viên không hợp lệ").max(20, "Mã sinh viên không được vượt quá 20 ký tự"),
      birthYear: z.string().regex(/^\d{4}$/, "Năm sinh phải là 4 chữ số"),
    })
  ).max(4, "Tối đa 4 thành viên khác").optional(),
  fileUrl: z.string().url("Link không hợp lệ").optional().or(z.literal("")),
});

export type SubmissionFormData = z.infer<typeof submissionSchema>;

// Helper function to derive allowed format from category
export function getAllowedFormat(category: string): string {
  if (category === "Tạp chí" || category === "Báo in" || category === "Báo điện tử") return "DOCX";
  if (category === "Phát thanh") return "PODCAST";
  if (category === "Truyền hình" || category === "Video clip") return "MP4";
  if (category === "Poster/Infographic") return "IMAGE";
  return "DOCX";
}
