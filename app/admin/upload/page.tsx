import { getDict } from "@/lib/i18n";
import UploadForm from "@/components/UploadForm";

export default function AdminUpload() {
  const t = getDict();
  return (
    <UploadForm
      labels={{
        help: t.upload_help, pickFiles: t.pick_files, pickFolder: t.pick_folder, folderAsCategory: t.folder_as_category,
        start: t.start_upload, uploaded: t.uploaded, skipped: t.skipped, failed: t.failed,
      }}
    />
  );
}
