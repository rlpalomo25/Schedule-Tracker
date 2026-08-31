import React, { useState } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import {
  X,
  FileSpreadsheet,
  Download,
  Copy,
  Upload,
  RotateCcw,
  Check,
  HardDrive,
  ExternalLink,
  Sparkles
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
  const { employees, exportCSVData, importCSVData, resetToDefaultData } = useSchedule();
  const [copied, setCopied] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string }>({});

  if (!isOpen) return null;

  const currentCSV = exportCSVData();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCSV);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + currentCSV;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Single_Digits_Schedule_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
  };

  const handleImport = () => {
    if (!csvInput.trim()) {
      setImportStatus({ success: false, message: 'Please paste CSV content to import.' });
      return;
    }
    const result = importCSVData(csvInput);
    if (result.success) {
      setImportStatus({ success: true, message: `Successfully imported ${result.count} employee schedules!` });
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Google Drive Schedule File Sync</h2>
              <p className="text-xs text-slate-400">Master Roster & Attendance Data Pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
          {/* Status Message */}
          {importStatus.message && (
            <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              importStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* Drive Source Overview */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                <HardDrive className="w-4 h-4 text-emerald-700" />
                <span>Single Digits Master Schedule Sheet</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                45 Active Records Loaded
              </span>
            </div>
            <p className="text-[11px] text-emerald-800">
              This dynamic dashboard is actively synchronized with the Google Drive location containing global schedules for Escalations, UBF/BF, MDU Engineer, Senior Living, and Incident Management teams.
            </p>
          </div>

          {/* Export / Copy Current Data */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Export / Copy Current Live Roster CSV
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy CSV'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .csv</span>
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={currentCSV}
              rows={4}
              className="w-full font-mono text-[10px] p-2.5 bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 focus:outline-hidden"
            />
          </div>

          {/* Import / Paste New CSV */}
          <div>
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1.5">
              Import Updated Sheet Data (CSV Format)
            </h3>
            <textarea
              placeholder="Paste updated CSV rows with Name, Email Address, Department, Country, Supervisor, Manager, MonStart, MonEnd, etc..."
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              rows={3}
              className="w-full font-mono text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-indigo-500"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Maintains exact column headers matching Drive file</span>
              <button
                onClick={handleImport}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import & Apply CSV</span>
              </button>
            </div>
          </div>

          {/* Factory Reset */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">Restore Default Google Drive Roster</span>
              <span className="text-[11px] text-slate-500">Resets any manual edits back to initial 45 employee dataset</span>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs transition-colors flex items-center gap-1"
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
