import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { api, type InvoiceSummary } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFileUpload, formatBytes, type FileWithPreview } from "@/components/ui/file-upload";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trash2,
  FileText,
  FileSpreadsheet,
  FileImage,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadFile extends FileWithPreview {
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export function InvoicesPage() {
  const { getAccessTokenSilently } = useAuth0();
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [
    { isDragging, errors },
    {
      removeFile,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: '.pdf,.csv,.png,.jpg,.jpeg',
    multiple: true,
    onFilesAdded: async (newFiles) => {
      for (const fileItem of newFiles) {
        const file = fileItem.file instanceof File ? fileItem.file : null;
        if (!file) continue;

        const uploadFile: UploadFile = {
          ...fileItem,
          progress: 0,
          status: 'uploading',
        };
        setUploadFiles((prev) => [...prev, uploadFile]);

        try {
          const token = await getAccessTokenSilently();
          await api.uploadInvoice(file, token);

          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id ? { ...f, progress: 100, status: 'completed' } : f
            )
          );
          await fetchInvoices();
        } catch {
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? { ...f, progress: 0, status: 'error', error: 'Upload failed' }
                : f
            )
          );
        }
      }
    },
  });

  const fetchInvoices = async () => {
    try {
      const token = await getAccessTokenSilently();
      const data = await api.listInvoices(token);
      setInvoices(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [getAccessTokenSilently]);

  const removeUploadFile = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((file) => file.id !== fileId));
    removeFile(fileId);
  };

  const retryUpload = async (fileId: string) => {
    const fileItem = uploadFiles.find((f) => f.id === fileId);
    if (!fileItem || !(fileItem.file instanceof File)) return;

    setUploadFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, progress: 0, status: 'uploading', error: undefined } : f))
    );

    try {
      const token = await getAccessTokenSilently();
      await api.uploadInvoice(fileItem.file, token);
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress: 100, status: 'completed' } : f))
      );
      await fetchInvoices();
    } catch (e) {
      setUploadFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: 'error', error: 'Upload failed' } : f))
      );
    }
  };

  const getFileIcon = (file: File | { type: string }) => {
    const type = file instanceof File ? file.type : file.type;
    if (type?.startsWith('image/')) return <FileImage className="w-4 h-4" />;
    if (type?.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (type?.includes('csv') || type?.includes('sheet')) return <FileSpreadsheet className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const fmt = (n: number | null) =>
    n != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
      : "—";

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold tracking-tight">Invoices</h2>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={cn(
              'relative rounded-lg border border-dashed p-8 text-center transition-colors',
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input {...getInputProps()} className="sr-only" />

            <div className="flex flex-col items-center gap-4">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full bg-muted transition-colors',
                  isDragging && 'bg-primary/10'
                )}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Drop files here or{' '}
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className="cursor-pointer text-primary underline-offset-4 hover:underline"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PDF, CSV, PNG, JPG up to 10MB
                </p>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadFiles.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Uploads ({uploadFiles.length})</h3>
                <Button onClick={clearFiles} variant="outline" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear all
                </Button>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="h-9">Name</TableHead>
                      <TableHead className="h-9">Size</TableHead>
                      <TableHead className="h-9">Status</TableHead>
                      <TableHead className="h-9 w-[80px] text-end">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadFiles.map((fileItem) => (
                      <TableRow key={fileItem.id}>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            {fileItem.status === 'uploading' ? (
                              <div className="relative">
                                <svg className="size-6 -rotate-90" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/20" />
                                  <circle
                                    cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"
                                    strokeDasharray={`${2 * Math.PI * 10}`}
                                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - fileItem.progress / 100)}`}
                                    className="text-primary transition-all duration-300"
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  {getFileIcon(fileItem.file)}
                                </div>
                              </div>
                            ) : (
                              getFileIcon(fileItem.file)
                            )}
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {fileItem.file.name}
                            </span>
                            {fileItem.status === 'error' && (
                              <span className="text-xs text-destructive">Error</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-sm text-muted-foreground">
                          {formatBytes(fileItem.file.size)}
                        </TableCell>
                        <TableCell className="py-2">
                          {fileItem.status === 'uploading' && (
                            <span className="text-xs text-muted-foreground">{Math.round(fileItem.progress)}%</span>
                          )}
                          {fileItem.status === 'completed' && (
                            <span className="text-xs text-green-600">Completed</span>
                          )}
                          {fileItem.status === 'error' && (
                            <span className="text-xs text-destructive">Failed</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 text-end">
                          {fileItem.status === 'error' ? (
                            <Button
                              onClick={() => retryUpload(fileItem.id)}
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive"
                            >
                              Retry
                            </Button>
                          ) : (
                            <Button
                              onClick={() => removeUploadFile(fileItem.id)}
                              variant="ghost"
                              size="sm"
                              className="h-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Errors */}
          {(error || errors.length > 0) && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Upload error(s)</span>
              </div>
              <div className="mt-2 text-sm text-destructive/80">
                {error && <p>{error}</p>}
                {errors.map((err, i) => <p key={i}>{err}</p>)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : invoices.length === 0 ? (
            <p className="text-muted-foreground text-sm">No invoices yet. Upload one above.</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_number || "—"}</TableCell>
                      <TableCell>{inv.vendor || "—"}</TableCell>
                      <TableCell>{inv.invoice_date || "—"}</TableCell>
                      <TableCell className="text-right">{fmt(inv.total)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
