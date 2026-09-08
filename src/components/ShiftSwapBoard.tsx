import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  UserCheck,
  CheckCircle2,
  Clock,
  Calendar,
  Filter,
  Search,
  Users,
  AlertCircle,
  Plus,
  Check,
  X,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  HelpCircle,
  MessageSquare,
  RefreshCw,
  Building,
  User
} from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { useAuth } from '../context/AuthContext';
import { ShiftSwapRequest, SwapStatus, DayOfWeek } from '../types';

interface ShiftSwapBoardProps {
  onOpenCreateSwapModal: () => void;
  onSelectEmployee?: (empId: string) => void;
}

export const ShiftSwapBoard: React.FC<ShiftSwapBoardProps> = ({
  onOpenCreateSwapModal
}) => {
  const {
    shiftSwapRequests,
    employees,
    respondToShiftSwapRequest,
    claimOpenCoverageRequest,
    supervisorReviewSwap,
    cancelShiftSwapRequest
  } = useSchedule();

  const { currentUser, isManagerOrSupervisor, allEmployees, switchUser } = useAuth();

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'needs_action' | 'pending_supervisor' | 'open_pool' | 'history'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Departments list
  const departments = useMemo(() => {
    const set = new Set(employees.map(e => e.department));
    return Array.from(set).sort();
  }, [employees]);

  // Counts for pills
  const counts = useMemo(() => {
    const total = shiftSwapRequests.length;
    const pendingCoworker = shiftSwapRequests.filter(r => r.status === 'pending_coworker').length;
    const pendingSupervisor = shiftSwapRequests.filter(r => r.status === 'pending_supervisor').length;
    const approved = shiftSwapRequests.filter(r => r.status === 'approved').length;
    const openPool = shiftSwapRequests.filter(r => r.isOpenPool && r.status === 'pending_coworker').length;

    // Needs action for current user
    const needsActionCount = shiftSwapRequests.filter(r => {
      if (!currentUser) return false;
      if (r.status === 'pending_supervisor' && (isManagerOrSupervisor || r.requesterSupervisor === currentUser.name)) {
        return true;
      }
      if (r.status === 'pending_coworker' && r.targetEmployeeId === currentUser.id) {
        return true;
      }
      if (r.status === 'pending_coworker' && r.isOpenPool && r.requesterId !== currentUser.id && r.requesterDepartment === currentUser.department) {
        return true;
      }
      return false;
    }).length;

    return { total, pendingCoworker, pendingSupervisor, approved, openPool, needsActionCount };
  }, [shiftSwapRequests, currentUser, isManagerOrSupervisor]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return shiftSwapRequests.filter(r => {
      // Tab filter
      if (activeTab === 'needs_action') {
        if (!currentUser) return false;
        const isMySupervisorReview = r.status === 'pending_supervisor' && (isManagerOrSupervisor || r.requesterSupervisor === currentUser.name);
        const isMyCoworkerTrade = r.status === 'pending_coworker' && r.targetEmployeeId === currentUser.id;
        const isClaimablePool = r.status === 'pending_coworker' && r.isOpenPool && r.requesterId !== currentUser.id;
        if (!isMySupervisorReview && !isMyCoworkerTrade && !isClaimablePool) return false;
      } else if (activeTab === 'pending_supervisor') {
        if (r.status !== 'pending_supervisor') return false;
      } else if (activeTab === 'open_pool') {
        if (!r.isOpenPool || r.status !== 'pending_coworker') return false;
      } else if (activeTab === 'history') {
        if (r.status !== 'approved' && r.status !== 'rejected' && r.status !== 'cancelled') return false;
      }

      // Department filter
      if (departmentFilter !== 'all' && r.requesterDepartment !== departmentFilter) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRequester = r.requesterName.toLowerCase().includes(query);
        const matchesTarget = r.targetEmployeeName ? r.targetEmployeeName.toLowerCase().includes(query) : false;
        const matchesReason = r.reason.toLowerCase().includes(query);
        const matchesSupervisor = r.requesterSupervisor.toLowerCase().includes(query);
        const matchesDept = r.requesterDepartment.toLowerCase().includes(query);
        if (!matchesRequester && !matchesTarget && !matchesReason && !matchesSupervisor && !matchesDept) {
          return false;
        }
      }

      return true;
    });
  }, [shiftSwapRequests, activeTab, departmentFilter, searchQuery, currentUser, isManagerOrSupervisor]);

  const showFeedback = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleCoworkerResponse = (req: ShiftSwapRequest, accept: boolean) => {
    respondToShiftSwapRequest(req.id, accept);
    if (accept) {
      showFeedback(`Trade accepted! Shift request forwarded to supervisor (${req.requesterSupervisor}) for one-click sign-off.`);
    } else {
      showFeedback(`Trade proposal declined.`);
    }
  };

  const handleClaimOpenPool = (req: ShiftSwapRequest) => {
    if (!currentUser) return;
    claimOpenCoverageRequest(req.id, currentUser);
    showFeedback(`You claimed ${req.requesterName}'s shift on ${req.requesterDay}! Forwarded to ${req.requesterSupervisor} for approval.`);
  };

  const handleSupervisorApproval = (req: ShiftSwapRequest, approved: boolean) => {
    const supervisorName = currentUser?.name || req.requesterSupervisor || 'Supervisor';
    supervisorReviewSwap(req.id, approved, supervisorName);
    if (approved) {
      showFeedback(`Swap approved! Schedules for ${req.requesterName} and ${req.targetEmployeeName || 'colleague'} updated automatically on Timeline & Weekly Matrix.`);
    } else {
      showFeedback(`Swap request rejected by ${supervisorName}.`);
    }
  };

  const handleCancelRequest = (req: ShiftSwapRequest) => {
    cancelShiftSwapRequest(req.id);
    showFeedback(`Request cancelled.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-2xs">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Shift Swaps & Coverage Board
                </h1>
                <p className="text-xs text-slate-500">
                  Peer-to-peer shift exchanges, open coverage bidding, and supervisor 1-click schedule sync
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-propose-shift-swap-board"
              onClick={onOpenCreateSwapModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-600/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Plus className="w-4 h-4" />
              <span>Propose Shift Swap</span>
            </button>
          </div>
        </div>

        {/* Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 pt-5 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('all')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className="text-[11px] font-semibold opacity-80">Total Requests</div>
            <div className="text-lg font-extrabold mt-0.5">{counts.total}</div>
          </button>

          <button
            onClick={() => setActiveTab('needs_action')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
              activeTab === 'needs_action'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-blue-50/70 hover:bg-blue-100/70 text-blue-900 border-blue-200'
            }`}
          >
            {counts.needsActionCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
            <div className="text-[11px] font-semibold opacity-80">Needs My Action</div>
            <div className="text-lg font-extrabold mt-0.5 flex items-center gap-1.5">
              <span>{counts.needsActionCount}</span>
              {counts.needsActionCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-bold">Action</span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('pending_supervisor')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTab === 'pending_supervisor'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-900 border-indigo-200'
            }`}
          >
            <div className="text-[11px] font-semibold opacity-80">Awaiting Supervisor</div>
            <div className="text-lg font-extrabold mt-0.5">{counts.pendingSupervisor}</div>
          </button>

          <button
            onClick={() => setActiveTab('open_pool')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTab === 'open_pool'
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : 'bg-teal-50/70 hover:bg-teal-100/70 text-teal-900 border-teal-200'
            }`}
          >
            <div className="text-[11px] font-semibold opacity-80">Open Pool Shifts</div>
            <div className="text-lg font-extrabold mt-0.5">{counts.openPool}</div>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900 border-emerald-200'
            }`}
          >
            <div className="text-[11px] font-semibold opacity-80">Approved & Applied</div>
            <div className="text-lg font-extrabold mt-0.5">{counts.approved}</div>
          </button>
        </div>
      </div>

      {/* Action Success Toast Banner */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Role Context & Quick Switch Helper Tip */}
      <div className="bg-gradient-to-r from-slate-100 via-indigo-50/50 to-blue-50/50 border border-slate-200/90 rounded-xl p-3 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Current Viewing Perspective:{' '}
            <strong className="text-slate-900">{currentUser?.name || 'Guest'}</strong> ({currentUser?.department}) —{' '}
            <span className="font-semibold text-indigo-700">
              {isManagerOrSupervisor ? 'Supervisor / Manager Privileges (1-Click Approvals Active)' : 'Team Member'}
            </span>
          </span>
        </div>

        {/* Demo Switcher Quick Links */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">Demo as Supervisor:</span>
          <button
            onClick={() => {
              const andre = allEmployees.find(e => e.name === 'Andre Villaran') || allEmployees.find(e => e.role === 'supervisor');
              if (andre) switchUser(andre.id);
            }}
            className="px-2 py-1 text-[11px] font-bold rounded-md bg-white hover:bg-slate-100 border border-slate-300 text-indigo-700 transition-colors shadow-2xs"
          >
            Andre Villaran
          </button>
          <button
            onClick={() => {
              const roberto = allEmployees.find(e => e.name === 'Roberto Luarca');
              if (roberto) switchUser(roberto.id);
            }}
            className="px-2 py-1 text-[11px] font-bold rounded-md bg-white hover:bg-slate-100 border border-slate-300 text-teal-700 transition-colors shadow-2xs"
          >
            Roberto Luarca
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scroll-smooth">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Requests ({shiftSwapRequests.length})
          </button>

          <button
            onClick={() => setActiveTab('needs_action')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'needs_action'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Needs My Action</span>
            {counts.needsActionCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'needs_action' ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
              }`}>
                {counts.needsActionCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pending_supervisor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'pending_supervisor'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Pending Supervisor</span>
            {counts.pendingSupervisor > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'pending_supervisor' ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'
              }`}>
                {counts.pendingSupervisor}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('open_pool')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'open_pool'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Open Pool ({counts.openPool})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            History & Resolved
          </button>
        </div>

        {/* Search & Department Selector */}
        <div className="flex items-center gap-2">
          {/* Department Filter */}
          <div className="relative">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-7 py-1.5 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[160px] sm:min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search swaps or people..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Shift Swap Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No shift requests found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'needs_action'
              ? 'You have no pending shift requests waiting for your approval or response.'
              : activeTab === 'pending_supervisor'
              ? 'All peer-approved shift swaps have been processed by supervisors.'
              : activeTab === 'open_pool'
              ? 'No open shifts are currently posted to the department volunteer pool.'
              : 'Try clearing filters or propose a new shift trade.'}
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenCreateSwapModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Propose Shift Swap</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((req) => {
            const isRequester = currentUser?.id === req.requesterId;
            const isTarget = currentUser?.id === req.targetEmployeeId;
            const isSupervisorForRequest = isManagerOrSupervisor || currentUser?.name === req.requesterSupervisor;
            const canClaimOpenPool = req.isOpenPool && req.status === 'pending_coworker' && !isRequester;

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border transition-all duration-150 p-5 shadow-xs hover:shadow-md ${
                  req.status === 'pending_supervisor'
                    ? 'border-indigo-300 ring-1 ring-indigo-500/10'
                    : req.status === 'approved'
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : req.status === 'pending_coworker'
                    ? 'border-amber-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Card Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Request Type Badge */}
                    {req.requestType === 'swap' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>2-Way Shift Swap</span>
                      </span>
                    ) : req.isOpenPool ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                        <Users className="w-3 h-3" />
                        <span>Open Pool Coverage</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                        <UserCheck className="w-3 h-3" />
                        <span>1-Way Shift Coverage</span>
                      </span>
                    )}

                    {/* Department Tag */}
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <Building className="w-3 h-3" />
                      <span>{req.requesterDepartment}</span>
                    </span>

                    {/* Supervisor Tag */}
                    <span className="text-xs text-slate-400">
                      • Supervisor: <strong className="text-slate-600">{req.requesterSupervisor}</strong>
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {req.status === 'pending_coworker' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                        <span>Awaiting Colleague</span>
                      </span>
                    )}

                    {req.status === 'pending_supervisor' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 animate-pulse">
                        <ShieldCheck className="w-3 h-3 text-indigo-700" />
                        <span>Awaiting Supervisor Sign-off</span>
                      </span>
                    )}

                    {req.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Approved & Applied to Schedule</span>
                      </span>
                    )}

                    {req.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        <X className="w-3 h-3 text-rose-600" />
                        <span>Declined</span>
                      </span>
                    )}

                    {req.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
                        <span>Cancelled</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Main Body: Visual Comparison */}
                <div className="py-4">
                  <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
                    {/* Requester Box */}
                    <div className="md:col-span-5 bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Requester
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800">
                          {req.requesterDay}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-slate-900">{req.requesterName}</div>
                      <div className="text-xs text-slate-500 mb-2">{req.requesterDepartment}</div>

                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>
                          {req.requesterShift.isOff
                            ? 'Scheduled Off'
                            : `${req.requesterShift.start} – ${req.requesterShift.end}`}
                        </span>
                      </div>
                    </div>

                    {/* Trade Icon in Middle */}
                    <div className="md:col-span-1 flex flex-col items-center justify-center text-slate-400 py-1 md:py-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                        {req.requestType === 'swap' ? (
                          <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-teal-600" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tight">
                        {req.requestType === 'swap' ? 'Swaps with' : 'Covered by'}
                      </span>
                    </div>

                    {/* Target Colleague / Open Pool Box */}
                    <div className="md:col-span-5 bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {req.isOpenPool ? 'Coverage Partner' : 'Target Colleague'}
                        </span>
                        {req.targetDay && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-100 text-teal-800">
                            {req.targetDay}
                          </span>
                        )}
                      </div>

                      {req.targetEmployeeName ? (
                        <>
                          <div className="text-sm font-bold text-slate-900">{req.targetEmployeeName}</div>
                          <div className="text-xs text-slate-500 mb-2">
                            {req.requestType === 'swap' ? 'Trade Partner' : 'Covering Colleague'}
                          </div>

                          {req.targetShift && (
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                              <Clock className="w-3.5 h-3.5 text-teal-600" />
                              <span>
                                {req.targetShift.isOff
                                  ? 'Scheduled Off'
                                  : `${req.targetShift.start} – ${req.targetShift.end}`}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-2">
                          <div className="text-sm font-bold text-sky-700 flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            <span>Open Department Pool</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Shift is currently unclaimed. Any eligible teammate in {req.requesterDepartment} can claim it below.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reason & Audit Notes */}
                  <div className="mt-3 p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-700">Reason: </span>
                        <span className="text-slate-900">{req.reason}</span>
                      </div>
                    </div>

                    {req.peerResponseNote && (
                      <div className="text-[11px] text-slate-600 pl-5">
                        <strong className="text-slate-700">Peer Note:</strong> {req.peerResponseNote}
                      </div>
                    )}

                    {req.supervisorNotes && (
                      <div className="text-[11px] text-indigo-900 bg-indigo-50/70 p-2 rounded-lg border border-indigo-100 pl-3">
                        <strong>Supervisor Decision ({req.supervisorName}):</strong> {req.supervisorNotes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Controls Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400">
                    Created: {new Date(req.createdAt).toLocaleDateString()} at{' '}
                    {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Action 1: Supervisor 1-Click Approval */}
                    {req.status === 'pending_supervisor' && isSupervisorForRequest && (
                      <>
                        <button
                          onClick={() => handleSupervisorApproval(req, true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                          title="Instantly approve and swap shifts on live schedules"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Approve & Apply to Schedule</span>
                        </button>

                        <button
                          onClick={() => handleSupervisorApproval(req, false)}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {/* Action 2: Coworker Acceptance */}
                    {req.status === 'pending_coworker' && isTarget && (
                      <>
                        <button
                          onClick={() => handleCoworkerResponse(req, true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Accept Trade Request</span>
                        </button>

                        <button
                          onClick={() => handleCoworkerResponse(req, false)}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </>
                    )}

                    {/* Action 3: Claim from Open Pool */}
                    {canClaimOpenPool && (
                      <button
                        onClick={() => handleClaimOpenPool(req)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-[0.98] shadow-sm shadow-teal-600/20 transition-all cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Claim Shift Coverage</span>
                      </button>
                    )}

                    {/* Action 4: Cancel Request by Requester */}
                    {(req.status === 'pending_coworker' || req.status === 'pending_supervisor') && isRequester && (
                      <button
                        onClick={() => handleCancelRequest(req)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <span>Cancel Request</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
