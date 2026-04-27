"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Upload, Link as LinkIcon, CheckCircle, AlertTriangle } from "lucide-react";
import {
  submissionSchema,
  SubmissionFormData,
  CATEGORIES,
  getAllowedFormat,
} from "@/lib/validators";

export default function SubmissionForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error" | "timeout">("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      category: "Tạp chí",
      format: "DOCX",
    },
  });

  const watchCategory = watch("category");
  const watchFormat = watch("format");
  const watchIsGroup = watch("isGroup");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "teamMembers",
  });

  // Handle category change to enforce format
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    setValue("category", newCategory as any);
    const requiredFormat = getAllowedFormat(newCategory);
    setValue("format", requiredFormat as any);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const nextStep = async () => {
    const isStep1Valid = await trigger([
      "fullName",
      "studentId",
      "classId",
      "birthYear",
      "email",
      "phone",
      "isGroup",
      "teamMembers"
    ]);
    if (isStep1Valid) setStep(2);
  };

  const onSubmit = async (data: SubmissionFormData) => {
    const isFileUploadFormat = ["DOCX", "IMAGE"].includes(data.format);
    
    // Validate based on format
    if (isFileUploadFormat && !selectedFile) {
      alert(`Vui lòng tải lên file ${data.format === "DOCX" ? "DOCX" : "ảnh/PDF"}`);
      return;
    }
    if (!isFileUploadFormat && !data.fileUrl) {
      alert("Vui lòng cung cấp link tác phẩm");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      let fileData = "";
      let mimeType = "";
      let filename = "";

      if (isFileUploadFormat && selectedFile) {
        // Convert File to Base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
        });
        reader.readAsDataURL(selectedFile);
        fileData = await base64Promise;
        mimeType = selectedFile.type;
        
        // Convert Vietnamese to non-accented slug for safe standard filenames
        const toSlug = (str: string) => {
          return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/đ/g, "d").replace(/Đ/g, "D") // Handle 'đ'
            .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
            .trim()
            .replace(/\s+/g, "_"); // Replace spaces with underscore
        };

        const ext = selectedFile.name.split('.').pop() || (data.format === "DOCX" ? "docx" : "png");
        const safeName = toSlug(data.fullName);
        const safeTitle = toSlug(data.workTitle).substring(0, 40); // Max 40 chars for title slug
        
        // Result: 2023xxxx_Ngo_Sy_An_Bao_ve_nen_tang_tu_tuong_cua.docx
        filename = `${data.studentId}_${safeName}_${safeTitle}.${ext}`;
      }

      let teamMembersStr = "";
      if (data.isGroup && data.teamMembers && data.teamMembers.length > 0) {
        teamMembersStr = data.teamMembers
          .map((m, i) => `${i + 1}. ${m.fullName} (${m.studentId}, SN: ${m.birthYear})`)
          .join("\n");
      }

      const payload = {
        ...data,
        teamMembersStr,
        fileData,
        mimeType,
        filename,
      };

      // Create an AbortController for the timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for edge case

      const GAS_URL = "https://script.google.com/macros/s/AKfycbwrkYiy-dWNGz6ii1oQ50VoSK7fIS2xe7A3aSKbYQFeAfqTrCoIS_eL5rb3XTevzgVavw/exec"; 
      
      const response = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        mode: "no-cors", // Required for GAS unless CORS is strictly configured
      });

      clearTimeout(timeoutId);
      
      // Since no-cors doesn't return readable status, we assume success if no error is thrown
      setSubmitStatus("success");
    } catch (error: any) {
      if (error.name === "AbortError") {
        setSubmitStatus("timeout");
      } else {
        setSubmitStatus("error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === "success") {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, type: "spring" }}
        className="text-center p-10 bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl max-w-md mx-auto"
      >
        <CheckCircle className="w-16 h-16 text-brand-red mx-auto mb-6" />
        <h2 className="text-2xl font-serif font-bold text-brand-blue mb-3">Nộp bài thành công!</h2>
        <p className="text-slate-600 mb-8 font-light">
          Tác phẩm của bạn đã được ghi nhận. Hệ thống sẽ tự động gửi email xác nhận cho bạn.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3.5 bg-brand-blue text-white rounded-xl font-semibold hover:bg-blue-900 transition-all shadow-[0_4px_14px_0_rgb(30,58,138,0.39)] hover:shadow-[0_6px_20px_rgba(30,58,138,0.23)] hover:-translate-y-0.5 active:scale-95"
        >
          Nộp thêm tác phẩm (Bản v2)
        </button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-xl text-slate-900 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl overflow-hidden relative">
      <div className="p-8 md:p-12">
        <div className="flex justify-between items-center mb-10 border-b border-slate-200/60 pb-5">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-blue tracking-tight">
            Cổng Nộp Bài
          </h2>
          <div className="text-sm font-semibold bg-brand-blue/5 text-brand-blue px-3 py-1 rounded-full">Bước {step}/2</div>
        </div>

        {submitStatus === "error" && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-brand-red flex items-start">
            <AlertTriangle className="w-5 h-5 text-brand-red mr-3 mt-0.5" />
            <p className="text-sm text-red-800">Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.</p>
          </div>
        )}

        {submitStatus === "timeout" && (
          <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 flex items-start">
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-orange-800">Kết nối quá hạn (Timeout)</p>
              <p className="text-sm text-orange-700 mt-1">File của bạn có thể quá lớn hoặc mạng yếu. Vui lòng kiểm tra lại kết nối và thử lại.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Họ và tên</label>
                    <input
                      {...register("fullName")}
                      className="w-full p-4 bg-white/60 text-slate-900 border border-slate-200/60 focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all rounded-xl shadow-sm"
                      placeholder="Nguyễn Văn A"
                    />
                    {errors.fullName && <p className="text-brand-red text-xs">{errors.fullName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Mã sinh viên</label>
                    <input
                      {...register("studentId")}
                      className="w-full p-4 bg-white/60 text-slate-900 border border-slate-200/60 focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all rounded-xl shadow-sm"
                      placeholder="2023xxxx"
                    />
                    {errors.studentId && <p className="text-brand-red text-xs">{errors.studentId.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Mã lớp</label>
                    <input
                      {...register("classId")}
                      className="w-full p-4 bg-white/60 text-slate-900 border border-slate-200/60 focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all rounded-xl shadow-sm"
                      placeholder="K68..."
                    />
                    {errors.classId && <p className="text-brand-red text-xs">{errors.classId.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Năm sinh</label>
                    <input
                      {...register("birthYear")}
                      className="w-full p-4 bg-white/60 text-slate-900 border border-slate-200/60 focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all rounded-xl shadow-sm"
                      placeholder="2005"
                    />
                    {errors.birthYear && <p className="text-brand-red text-xs">{errors.birthYear.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email</label>
                    <input
                      {...register("email")}
                      type="email"
                      className="w-full p-4 bg-white/60 text-slate-900 border border-slate-200/60 focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all rounded-xl shadow-sm"
                      placeholder="email@domain.com"
                    />
                    {errors.email && <p className="text-brand-red text-xs">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Số điện thoại</label>
                    <input
                      {...register("phone")}
                      className="w-full p-3 border border-slate-300 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none transition-all rounded-none"
                      placeholder="09xxxxxxx"
                    />
                    {errors.phone && <p className="text-brand-red text-xs">{errors.phone.message}</p>}
                  </div>
                </div>

                <div className="pt-2 mt-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                    <input 
                      type="checkbox" 
                      {...register("isGroup")}
                      className="w-5 h-5 rounded text-brand-blue focus:ring-brand-blue"
                    />
                    <span className="text-slate-700 font-bold">Đây là tác phẩm của nhóm tác giả</span>
                  </label>
                  
                  {watchIsGroup && (
                    <div className="mt-3 space-y-4 bg-brand-blue/5 p-5 rounded-2xl border border-brand-blue/10">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-brand-blue text-sm">Thành viên bổ sung ({fields.length}/4)</h4>
                        <p className="text-xs text-slate-500">Tối đa 5 người/nhóm</p>
                      </div>
                      
                      {fields.map((field, index) => (
                        <div key={field.id} className="relative bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                          <button 
                            type="button" 
                            onClick={() => remove(index)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-brand-red p-1 text-lg leading-none"
                            title="Xóa thành viên này"
                          >
                            &times;
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs font-bold text-slate-600 block mb-1">Họ và tên</label>
                              <input
                                {...register(`teamMembers.${index}.fullName` as const)}
                                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-blue outline-none rounded-lg"
                                placeholder="Họ và tên..."
                              />
                              {errors.teamMembers?.[index]?.fullName && <p className="text-brand-red text-xs mt-1">{errors.teamMembers[index]?.fullName?.message}</p>}
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-600 block mb-1">Mã sinh viên</label>
                              <input
                                {...register(`teamMembers.${index}.studentId` as const)}
                                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-blue outline-none rounded-lg"
                                placeholder="2023xxxx"
                              />
                              {errors.teamMembers?.[index]?.studentId && <p className="text-brand-red text-xs mt-1">{errors.teamMembers[index]?.studentId?.message}</p>}
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-600 block mb-1">Năm sinh</label>
                              <input
                                {...register(`teamMembers.${index}.birthYear` as const)}
                                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-brand-blue outline-none rounded-lg"
                                placeholder="2005"
                              />
                              {errors.teamMembers?.[index]?.birthYear && <p className="text-brand-red text-xs mt-1">{errors.teamMembers[index]?.birthYear?.message}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {fields.length < 4 && (
                        <button
                          type="button"
                          onClick={() => append({ fullName: "", studentId: "", birthYear: "" })}
                          className="w-full py-3 border-2 border-dashed border-brand-blue/30 text-brand-blue rounded-xl font-semibold hover:bg-brand-blue/10 transition-colors text-sm mt-2"
                        >
                          + Thêm thành viên
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-brand-blue text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-900 transition-all shadow-[0_4px_14px_0_rgb(30,58,138,0.39)] hover:shadow-[0_6px_20px_rgba(30,58,138,0.23)] hover:-translate-y-0.5 active:scale-95"
                  >
                    Tiếp tục
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tên tác phẩm</label>
                  <input
                    {...register("workTitle")}
                    className="w-full p-4 bg-white/60 text-slate-900 border border-slate-200/60 focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all rounded-xl shadow-sm"
                    placeholder="Nhập tên tác phẩm..."
                  />
                  {errors.workTitle && <p className="text-brand-red text-xs">{errors.workTitle.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Thể loại</label>
                    <select
                      {...register("category")}
                      onChange={handleCategoryChange}
                      className="w-full p-4 bg-white/60 text-slate-900 border border-slate-200/60 focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all rounded-xl shadow-sm cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Định dạng bắt buộc</label>
                    <div className="w-full p-4 border border-slate-200/60 bg-slate-50/50 text-slate-500 font-mono rounded-xl shadow-sm">
                      {watchFormat}
                    </div>
                  </div>
                </div>

                {["DOCX", "IMAGE"].includes(watchFormat) ? (
                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-bold text-slate-700">Tải lên File {watchFormat === "DOCX" ? "DOCX" : "Poster/Infographic"}</label>
                    <div className="border-2 border-dashed border-slate-300/80 bg-white/40 rounded-2xl p-10 text-center hover:bg-white/80 hover:border-brand-blue/50 transition-all relative group cursor-pointer shadow-sm">
                      <input 
                        type="file" 
                        accept={watchFormat === "DOCX" ? ".docx" : "image/*,.pdf"} 
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-4 group-hover:text-brand-blue group-hover:scale-110 transition-all duration-300" />
                      <p className="text-sm font-medium text-slate-700">
                        {selectedFile ? selectedFile.name : `Nhấn để chọn hoặc kéo thả file ${watchFormat === "DOCX" ? "DOCX" : "Ảnh/PDF"} vào đây`}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">Dung lượng tối đa 50MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-bold text-slate-700">Link tác phẩm ({watchFormat})</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        {...register("fileUrl")}
                        className="w-full p-4 pl-11 bg-white/60 text-slate-900 border border-slate-200/60 focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all rounded-xl shadow-sm"
                        placeholder="https://drive.google.com/... hoặc youtube.com/..."
                      />
                    </div>
                    {errors.fileUrl && <p className="text-brand-red text-xs">{errors.fileUrl.message}</p>}
                    <p className="text-xs text-slate-500 mt-1">
                      Vui lòng đảm bảo link đã được bật chế độ "Bất kỳ ai có liên kết".
                    </p>
                  </div>
                )}

                <div className="pt-8 flex justify-between items-center border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-500 hover:text-brand-blue font-medium transition-colors px-4 py-2 rounded-lg hover:bg-slate-50"
                    disabled={isSubmitting}
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-brand-red text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center hover:bg-red-700 transition-all shadow-[0_4px_14px_0_rgb(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none min-w-[180px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      "Nộp Tác Phẩm"
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
