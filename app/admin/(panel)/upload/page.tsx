import { UploadForm } from "@/components/admin/UploadForm";

export default function UploadPage() {
  return (
    <div className="container-site py-10 sm:py-12">
      <div className="border-b border-hairline pb-6">
        <p className="eyebrow text-muted">Publishing desk</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight">
          Upload a photograph
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Choose an image, set its season, and write a caption. The image is
          optimized in your browser before it is uploaded, and appears on the
          live site immediately.
        </p>
      </div>
      <div className="mt-10">
        <UploadForm />
      </div>
    </div>
  );
}
