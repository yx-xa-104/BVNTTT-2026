import SubmissionForm from "@/components/SubmissionForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center pb-12 relative overflow-hidden">
      {/* Premium Background Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-red opacity-[0.07] rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-brand-blue opacity-[0.05] rounded-full blur-[150px] mix-blend-multiply pointer-events-none" />

      <div className="w-full max-w-6xl z-20 flex justify-center md:justify-start px-4 md:px-8 pt-6 w-full items-center gap-4 md:gap-6">
        <img 
          src="/logo-khoa.png" 
          alt="Logo Khoa" 
          className="h-14 md:h-20 object-contain drop-shadow-sm hover:scale-105 transition-transform duration-500" 
        />
        <div className="h-10 md:h-14 w-[1px] bg-slate-300/80 rounded-full"></div>
        <img 
          src="/logo-doan.png" 
          alt="Logo Đoàn" 
          className="h-14 md:h-20 object-contain drop-shadow-sm hover:scale-105 transition-transform duration-500" 
        />
      </div>

      <div className="w-full max-w-5xl z-10 flex flex-col items-center mb-12 px-4 -mt-4 md:-mt-10 relative">
        <img 
          src="/APAG.png" 
          alt="APAG Logo" 
          className="w-56 md:w-80 lg:w-96 -mb-8 md:-mb-16 lg:-mb-20 object-contain drop-shadow-md hover:scale-105 transition-transform duration-500 relative z-10" 
        />
        
        <h1 className="text-3xl md:text-[3.25rem] font-serif text-slate-900 tracking-tight text-center mb-6 leading-[1.15] max-w-4xl">
          Cuộc thi chính luận về bảo vệ nền tảng tư tưởng của Đảng <br className="hidden lg:block" />
          <span className="text-brand-blue font-bold">lần thứ Sáu, năm 2026</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 text-center max-w-2xl font-light tracking-wide">
          Nền tảng nộp bài dự thi chính thức dành cho sinh viên khoa <br />
          <span className="text-brand-blue font-bold">KHOA HỌC LIÊN NGÀNH - NGOẠI NGỮ - TIN HỌC</span>
        </p>
      </div>

      <div className="w-full z-10">
        <SubmissionForm />
      </div>

      <footer className="mt-20 z-10 text-center text-sm text-slate-400 font-medium tracking-wide">
        &copy; KHOA HỌC LIÊN NGÀNH - NGOẠI NGỮ - TIN HỌC <br />
        Made with ❤️ by Sybau Ngô
      </footer>
    </main>
  );
}
