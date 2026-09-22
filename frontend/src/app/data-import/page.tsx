"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function DataImportPage() {
  const [entityType, setEntityType] = useState("MATERIALS");
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  const sampleCsvTemplates: Record<string, string> = {
    MATERIALS: "material_name,category,unit,unit_cost,minimum_stock,safety_stock,lead_time_days\nSilica Fume,Admixtures,bags,480,20,50,7\nWaterproofing Chemical,Chemicals,liters,320,15,30,5",
    INVENTORY: "project_name,material_name,quantity,unit_cost\nMadurai Commercial Complex,TMT Reinforcement Steel (Fe 550D),1200,65\nChennai Residential Tower,Ordinary Portland Cement (Grade 53),400,380",
    CONSUMPTION: "project_id,material_id,quantity\nproj_1,mat_1,150\nproj_2,mat_2,80"
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("entity_type", entityType);
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/data-import/preview", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setPreviewData(data);
    } catch (e: any) {
      alert(`Preview failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("entity_type", entityType);
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/data-import/execute", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setImportResult(data);
      setPreviewData(null);
      setFile(null);
    } catch (e: any) {
      alert(`Import failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(sampleCsvTemplates[entityType]);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `sample_${entityType.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#1E2638]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileSpreadsheet className="text-amber-400" />
            CSV Data Ingestion & Migration Wizard
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Import existing site schedules, BOQ material records, and yard stocks with automatic schema validation.
          </p>
        </div>

        <button
          onClick={downloadSample}
          className="px-3.5 py-1.5 rounded-lg bg-[#141B2D] hover:bg-[#1C263F] text-amber-400 text-xs font-semibold border border-zinc-700 transition-all"
        >
          Download Sample {entityType} CSV
        </button>
      </div>

      {/* Step 1: Ingestion Config */}
      <div className="p-6 rounded-xl bg-[#111726] border border-[#1E2638] space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <span>1. Select Entity & Upload File</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {["MATERIALS", "INVENTORY", "CONSUMPTION"].map((et) => (
            <button
              key={et}
              onClick={() => {
                setEntityType(et);
                setPreviewData(null);
                setImportResult(null);
              }}
              className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all ${
                entityType === et
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/50"
                  : "bg-[#141B2D] text-zinc-400 border-[#1E2638] hover:text-white"
              }`}
            >
              <p>{et} DATASET</p>
              <p className="text-[10px] text-zinc-500 font-normal mt-0.5">CSV / Excel Format</p>
            </button>
          ))}
        </div>

        {/* Upload Dropzone */}
        <div className="border-2 border-dashed border-[#232D42] hover:border-amber-500/40 rounded-xl p-8 text-center space-y-3 transition-colors">
          <Upload size={32} className="mx-auto text-zinc-500" />
          <div>
            <label className="cursor-pointer">
              <span className="text-xs font-bold text-amber-400 hover:underline">Click to browse file</span>
              <span className="text-xs text-zinc-400"> or drag and drop CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-zinc-500 mt-1">
              {file ? `Selected file: ${file.name}` : "Supports UTF-8 CSV with standard headers"}
            </p>
          </div>

          {file && (
            <button
              disabled={loading}
              onClick={handlePreview}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md"
            >
              {loading ? "Parsing..." : "Preview & Validate File"}
            </button>
          )}
        </div>
      </div>

      {/* Step 2: Validation Preview */}
      {previewData && (
        <div className="p-6 rounded-xl bg-[#111726] border border-amber-500/40 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#1E2638] pb-3">
            <div>
              <h3 className="font-bold text-sm text-white">2. Schema Validation Report</h3>
              <p className="text-xs text-zinc-400">
                Parsed {previewData.total_rows} rows &bull;{" "}
                <strong className="text-emerald-400">{previewData.valid_rows} Valid</strong> &bull;{" "}
                <strong className="text-red-400">{previewData.total_rows - previewData.valid_rows} Invalid</strong>
              </p>
            </div>

            <button
              disabled={loading}
              onClick={handleExecuteImport}
              className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg transition-all"
            >
              {loading ? "Importing..." : `Commit Import (${previewData.valid_rows} Rows)`}
            </button>
          </div>

          {/* Table Preview */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0E1320] text-zinc-400 border-b border-[#1E2638]">
                <tr>
                  <th className="py-2.5 px-3">Row #</th>
                  <th className="py-2.5 px-3">Record Preview</th>
                  <th className="py-2.5 px-3">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2638] text-zinc-300">
                {previewData.preview.map((p: any) => (
                  <tr key={p.row_number} className="hover:bg-[#141B2D]">
                    <td className="py-2.5 px-3 font-mono text-zinc-500">#{p.row_number}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-200">
                      {JSON.stringify(p.data)}
                    </td>
                    <td className="py-2.5 px-3">
                      {p.is_valid ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Valid
                        </span>
                      ) : (
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          <AlertCircle size={12} /> {p.errors.join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 3: Result confirmation */}
      {importResult && (
        <div className="p-5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 size={18} />
            <span>Successfully Ingested {importResult.imported_rows} Records</span>
          </div>
          <p className="text-zinc-300">
            Records have been committed to the primary database and will be reflected immediately across inventory, forecasting, and agent scans.
          </p>
        </div>
      )}
    </div>
  );
}
