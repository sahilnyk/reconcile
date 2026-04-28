import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { api, type InvoiceSummary } from "@/lib/api";
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
  Search,
  Filter,
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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
    maxSize: 10 * 1024 * 1024,
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
            prev.map((f) => f.id === fileItem.id ? { ...f, progress: 100, status: 'completed' } : f)
          );
          await fetchInvoices();
        } catch {
          setUploadFiles((prev) =>
            prev.map((f) => f.id === fileItem.id ? { ...f, progress: 0, status: 'error', error: 'Upload failed' } : f)
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
      setUploadFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress: 100, status: 'completed' } : f)));
      await fetchInvoices();
    } catch {
      setUploadFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: 'error', error: 'Upload failed' } : f)));
    }
  };

  const getFileIcon = (file: File | { type: string }) => {
    const type = file instanceof File ? file.type : file.type;
    if (type?.startsWith('image/')) return <FileImage className="w-4 h-4" />;
    if (type?.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (type?.includes('csv') || type?.includes('sheet')) return <FileSpreadsheet className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Paid: 'bg-emerald-100 text-emerald-700',
      Pending: 'bg-amber-100 text-amber-700',
      Overdue: 'bg-rose-100 text-rose-700',
    };
    return (
      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${styles[status] || 'bg-muted text-muted-foreground'}`}>
        {status}
      </span>
    );
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    const matchesSearch = inv.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const fmt = (n: number | null) =>
    n != null ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n) : "—";

  return (
    <div className="p-3 space-y-3 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Invoices</h1>
          <p className="text-[10px] text-muted-foreground">Manage your invoices</p>
        </div>
        <span className="text-[10px] text-muted-foreground">{invoices.length}</span>
      </div>

      {/* Upload Area - Compact */}
      <div className="border rounded-none">
        <div className="p-2 border-b">
          <p className="text-[11px] font-medium">Upload</p>
        </div>
        <div className="p-2">
          <div
            className={cn(
              'relative border border-dashed p-3 text-center transition-colors cursor-pointer',
              isDragging ? 'border-emerald-500 bg-emerald-50/50' : 'border-border hover:border-muted-foreground/50'
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input {...getInputProps()} className="sr-only" />
            <div className="flex items-center justify-center gap-1.5">
              <Upload className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-[11px] font-medium">Drop or click to upload</p>
                <p className="text-[9px] text-muted-foreground">PDF, CSV, PNG, JPG</p>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-medium">Uploading {uploadFiles.length}</p>
                <Button onClick={clearFiles} variant="ghost" size="sm" className="h-5 text-[9px] px-1">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5">Name</TableHead>
                      <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5">Size</TableHead>
                      <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5">Status</TableHead>
                      <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5 w-[40px] text-right">Act</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadFiles.map((fileItem) => (
                      <TableRow key={fileItem.id}>
                        <TableCell className="py-1 px-1.5">
                          <div className="flex items-center gap-1.5">
                            {fileItem.status === 'uploading' ? (
                              <div className="relative">
                                <svg className="size-3.5 -rotate-90" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/20" />
                                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"
                                    strokeDasharray={`${2 * Math.PI * 10}`}
                                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - fileItem.progress / 100)}`}
                                    className="text-emerald-600 transition-all duration-300"
                                    strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  {getFileIcon(fileItem.file)}
                                </div>
                              </div>
                            ) : (
                              getFileIcon(fileItem.file)
                            )}
                            <span className="text-[9px] font-medium truncate max-w-[100px]">{fileItem.file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-1 px-1.5 text-[9px] text-muted-foreground">{formatBytes(fileItem.file.size)}</TableCell>
                        <TableCell className="py-1 px-1.5">
                          {fileItem.status === 'uploading' && <span className="text-[9px] text-muted-foreground">{Math.round(fileItem.progress)}%</span>}
                          {fileItem.status === 'completed' && <span className="text-[9px] text-emerald-600">Done</span>}
                          {fileItem.status === 'error' && <span className="text-[9px] text-rose-600">Err</span>}
                        </TableCell>
                        <TableCell className="py-1 px-1.5 text-right">
                          {fileItem.status === 'error' ? (
                            <Button onClick={() => retryUpload(fileItem.id)} variant="ghost" size="sm" className="h-4 text-[9px] px-0.5 text-rose-600">
                              Retry
                            </Button>
                          ) : (
                            <Button onClick={() => removeUploadFile(fileItem.id)} variant="ghost" size="sm" className="h-4 w-4 p-0">
                              <Trash2 className="w-3 h-3" />
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
            <div className="mt-2 border border-rose-200 bg-rose-50 p-1.5">
              <div className="flex items-center gap-1.5 text-rose-700 text-[9px]">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-medium">Error</span>
              </div>
              <div className="mt-0.5 text-[9px] text-rose-600">
                {error && <p>{error}</p>}
                {errors.map((err, i) => <p key={i}>{err}</p>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice List */}
      <div className="border rounded-none">
        <div className="p-2 border-b flex items-center justify-between">
          <p className="text-[11px] font-medium">Invoices</p>
          <span className="text-[9px] text-muted-foreground">{filteredInvoices.length}</span>
        </div>
        <div className="p-2">
          {/* Filters */}
          <div className="flex gap-1.5 mb-2">
            <div className="relative flex-1 max-w-[160px]">
              <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-6 pr-2 py-0.5 text-[10px] border rounded-none bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-1.5 py-0.5 text-[10px] border rounded-none bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="All">All</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-muted-foreground text-[10px] py-3">Loading...</p>
          ) : invoices.length === 0 ? (
            <p className="text-muted-foreground text-[10px] py-3">No invoices yet. Upload one above.</p>
          ) : (
            <div className="border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5 font-semibold text-muted-foreground">Invoice</TableHead>
                    <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5 font-semibold text-muted-foreground">Vendor</TableHead>
                    <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5 font-semibold text-muted-foreground">Date</TableHead>
                    <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5 font-semibold text-muted-foreground text-right">Total</TableHead>
                    <TableHead className="text-[9px] uppercase h-6 py-0 px-1.5 font-semibold text-muted-foreground text-center">Sts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv, index) => (
                    <TableRow key={inv.id} className={index % 2 === 0 ? "bg-white hover:bg-muted/50" : "bg-muted/30 hover:bg-muted/50"}>
                      <TableCell className="text-[9px] py-1 px-1.5 font-medium">{inv.invoice_number || "—"}</TableCell>
                      <TableCell className="text-[9px] py-1 px-1.5 text-muted-foreground">{inv.vendor || "—"}</TableCell>
                      <TableCell className="text-[9px] py-1 px-1.5">{inv.invoice_date || "—"}</TableCell>
                      <TableCell className="text-[9px] py-1 px-1.5 text-right font-medium">{fmt(inv.total)}</TableCell>
                      <TableCell className="py-1 px-1.5 text-center">{getStatusBadge(inv.status || 'Pending')}</TableCell>
                    </TableRow>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-2 text-[9px] text-muted-foreground">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
