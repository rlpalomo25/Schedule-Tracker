import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, X, User, KeyRound, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { allEmployees, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'credentials' | 'quick_select'>('quick_select');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchDemo, setSearchDemo] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) {
      setErrorMsg('Please enter your Single Digits username or email.');
      return;
    }
    const success = login(usernameOrEmail, password);
    if (success) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      setErrorMsg('');
      onClose();
    } else {
      setErrorMsg('Account not found with that username or email. Select a user from the directory tab or check spelling.');
    }
  };

  const handleSelectEmployee = (email: string) => {
    const success = login(email, 'password123');
    if (success) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      setErrorMsg('');
      onClose();
    }
  };

  const filteredDemoList = allEmployees.filter(emp =>
    emp.name.toLowerCase().includes(searchDemo.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchDemo.toLowerCase()) ||
    emp.country.toLowerCase().includes(searchDemo.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchDemo.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Single Digits Team Portal</h2>
              <p className="text-xs text-slate-400">Log in daily to clock hours, check shift schedule & manage PTO</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-3">
          <button
            onClick={() => setActiveTab('quick_select')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'quick_select'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Select Team Member (1-Click)</span>
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'credentials'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Username & Password Login</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'credentials' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username or Work Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-login-username"
                    type="text"
                    placeholder="e.g. cgarcia@singledigits.com or cgarcia"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    autoFocus
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  You can use your name, email prefix (e.g. <code className="text-indigo-600 font-semibold">cgarcia</code>), or full email.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Default company portal password: <span className="font-mono font-medium text-slate-600">password123</span>
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-submit-login"
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In to Daily Portal</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Filter team directory by name, department, or country..."
                  value={searchDemo}
                  onChange={(e) => setSearchDemo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5 divide-y divide-slate-100">
                {filteredDemoList.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp.email)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/70 border border-transparent hover:border-indigo-200 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${emp.avatarColor || 'bg-indigo-600'} text-white font-bold text-xs flex items-center justify-center shadow-2xs`}>
                        {emp.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-900 flex items-center gap-1.5">
                          {emp.name}
                          {emp.role === 'manager' && (
                            <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[10px] rounded-sm font-semibold">Manager</span>
                          )}
                          {emp.role === 'supervisor' && (
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[10px] rounded-sm font-semibold">Supervisor</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {emp.department} • {emp.country} • Sup: {emp.supervisor}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-[11px] font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {emp.schedule.Mon.isOff ? 'Off' : `${emp.schedule.Mon.start}-${emp.schedule.Mon.end}`}
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Protected company system • Single Digits Inc</span>
          <span className="text-slate-400">All 45 team profiles ready</span>
        </div>
      </div>
    </div>
  );
};
