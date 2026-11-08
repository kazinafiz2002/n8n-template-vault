export function hash(str: string): string;
export function processWorkflowFile(
  text: string,
  fileName: string,
  folderCategory?: string
): { ok: true; item: Record<string, unknown> } | { ok: false; error: string };
