import React, { useState, useRef } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import {
  X,
  FileSpreadsheet,
  Upload,
  RotateCcw,
  Check,
  HardDrive,
  FileUp,
  AlertCircle,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { employees, importCSVData, importXLSXData, resetToDefaultData } = useSchedule();
  const [csvInput, setCsvInput] = useState('');
  const [activeMode, setActiveMode] = useState<'upload' | 'paste'>('upload');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setSelectedFileName(file.name);
    const fileNameLower = file.name.toLowerCase();

    if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
      try {
        const buffer = await file.arrayBuffer();
        const result = importXLSXData(buffer);
        if (result.success) {
          setImportStatus({
            success: true,
            message: `Successfully loaded ${result.count} employee schedules from "${file.name}"!`
          });
          confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
        } else {
          setImportStatus({
            success: false,
            message: result.error || 'Failed to parse Excel schedule data.'
          });
        }
      } catch (err: any) {
        setImportStatus({
          success: false,
          message: err?.message || 'Error reading Excel file.'
        });
      }
    } else if (fileNameLower.endsWith('.csv') || file.type.includes('csv') || file.type.includes('text')) {
      try {
        const text = await file.text();
        const result = importCSVData(text);
        if (result.success) {
          setImportStatus({
            success: true,
            message: `Successfully loaded ${result.count} employee schedules from "${file.name}"!`
          });
          confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
        } else {
          setImportStatus({
            success: false,
            message: result.error || 'Failed to parse CSV schedule data.'
          });
        }
      } catch (err: any) {
        setImportStatus({
          success: false,
          message: err?.message || 'Error reading CSV file.'
        });
      }
    } else {
      setImportStatus({
        success: false,
        message: 'Unsupported format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.'
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handlePasteImport = () => {
    if (!csvInput.trim()) {
      setImportStatus({ success: false, message: 'Please paste CSV content to import.' });
      return;
    }
    const result = importCSVData(csvInput);
    if (result.success) {
      setImportStatus({ success: true, message: `Successfully loaded ${result.count} employee schedules!` });
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      setCsvInput('');
    } else {
      setImportStatus({ success: false, message: result.error || 'Failed to parse CSV.' });
    }
  };

  const handleReset = () => {
    if (confirm('Reset all schedules, attendance records, and time logs back to original Google Drive default values?')) {
      resetToDefaultData();
      setImportStatus({ success: true, message: 'Restored all original 45 team schedules!' });
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-5 sm:px-6 py-4 sm:py-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Load Team Schedules</h2>
              <p className="text-xs text-slate-400">Excel (.xlsx / .xls) & CSV Roster Import</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Status Message */}
          {importStatus.message && (
            <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
              importStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {importStatus.success ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="flex-1">{importStatus.message}</span>
            </div>
          )}

          {/* Drive Source Overview */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                <HardDrive className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Active Schedule Database</span>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200 text-emerald-900">
                {employees.length} Active Engineers Loaded
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Upload an updated Google Drive or spreadsheet export in <strong>Excel (.xlsx, .xls)</strong> or <strong>CSV (.csv)</strong> format. Schedules, employee departments, supervisors, and shift times will be parsed and immediately synchronized across all views.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveMode('upload')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[38px] ${
                activeMode === 'upload'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload File (.xlsx or .csv)</span>
            </button>
            <button
              onClick={() => setActiveMode('paste')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[38px] ${
                activeMode === 'paste'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste CSV Text</span>
            </button>
          </div>

          {activeMode === 'upload' ? (
            /* Drag & Drop Upload Zone */
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-slate-50/80'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 mx-auto mb-3 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Click to select or drag and drop schedule file
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
                  Supports <strong>Excel Workbooks (.xlsx, .xls)</strong> and <strong>CSV documents (.csv)</strong>
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Choose XLSX or CSV File</span>
                </div>
                {selectedFileName && (
                  <p className="mt-3 text-[11px] font-semibold text-emerald-700">
                    Last selected: {selectedFileName}
                  </p>
                )}
              </div>

              {/* Supported Columns Guide */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-1 text-[11px]">Supported Column Formats:</span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  • Standard columns: <code>Name</code>, <code>Email Address</code>, <code>Department</code>, <code>Country</code>, <code>Supervisor</code>, <code>Manager</code>.<br />
                  • Shift columns: Either paired (<code>MonStart</code>, <code>MonEnd</code>) or unified (<code>Mon</code> with value like <code>9:00 - 18:00</code> or <code>Off</code>).
                </p>
              </div>
            </div>
          ) : (
            /* Paste CSV Mode */
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-800 text-xs uppercase tracking-wider block mb-1.5">
                  Paste CSV Text
                </label>
                <textarea
                  placeholder="Paste CSV rows: Name, Email Address, Department, Country, Supervisor, Manager, MonStart, MonEnd, etc..."
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  rows={6}
                  className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Header row required on the first line</span>
                <button
                  onClick={handlePasteImport}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-colors flex items-center justify-center gap-2 min-h-[40px]"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Parse & Apply Schedule</span>
                </button>
              </div>
            </div>
          )}

          {/* Factory Reset */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-800 block">Restore Default Google Drive Roster</span>
              <span className="text-[11px] text-slate-500">Resets back to the original 45 employee baseline</span>
            </div>
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[38px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
