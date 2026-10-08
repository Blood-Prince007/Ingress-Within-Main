import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Shield,
  ArrowRight,
  Filter,
  X,
  Sparkles,
  Info,
  Calendar,
  HeartHandshake,
  Check,
  RefreshCw,
  MessageSquare,
  Mail,
} from 'lucide-react';

export default function TherapistRequestsView({ onNavigate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'accepted' | 'declined'

  // Modal & Confirmation state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'accept' | 'decline', request: obj }
  const [declineReason, setDeclineReason] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/therapist/requests');
      if (res.ok) {
        const json = await res.json();
        setRequests(json.requests || []);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.error?.message || 'Failed to retrieve client requests.');
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
      setError('Unable to load client requests due to a network connection issue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (matchId, action, reason = '') => {
    setActioningId(matchId);
    setError(null);
    try {
      const res = await fetch(`/api/therapist/requests/${matchId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        const text = action === 'accept'
          ? 'Client request accepted and notification emails sent!'
          : action === 'resend_email'
          ? 'Confirmation emails successfully sent to client and therapist!'
          : 'Client request declined';
        setFeedbackMessage({ type: 'success', text });
        setTimeout(() => setFeedbackMessage(null), 5000);
        setSelectedRequest(null);
        setConfirmAction(null);
        setDeclineReason('');
        await fetchRequests();
      } else {
        const text = json.error?.message || `Failed to ${action} request.`;
        setFeedbackMessage({ type: 'error', text });
        setTimeout(() => setFeedbackMessage(null), 6000);
      }
    } catch (err) {
      console.error('Action failed:', err);
      setFeedbackMessage({
        type: 'error',
        text: 'Network error processing your request. Please try again.',
      });
      setTimeout(() => setFeedbackMessage(null), 6000);
    } finally {
      setActioningId(null);
    }
  };

  const isReqPending = (st) => st === 'candidate' || st === 'shortlisted' || st === 'proposed';
  const isReqAccepted = (st) => st === 'selected' || st === 'accepted';
  const isReqDeclined = (st) => st === 'rejected' || st === 'declined';

  const filtered = requests.filter((r) => {
    if (filterStatus === 'pending') {
      return isReqPending(r.matchStatus);
    }
    if (filterStatus === 'accepted') {
      return isReqAccepted(r.matchStatus);
    }
    if (filterStatus === 'declined') {
      return isReqDeclined(r.matchStatus);
    }
    return true;
  });

  const pendingCount = requests.filter((r) => isReqPending(r.matchStatus)).length;
  const acceptedCount = requests.filter((r) => isReqAccepted(r.matchStatus)).length;
  const declinedCount = requests.filter((r) => isReqDeclined(r.matchStatus)).length;

  return (
    <div className="space-y-6">
      {/* --------------------------------------------------------------------- */}
      {/* HEADER                                                                */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#132A24]/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#4E7A66]">
              Clinical Care Matching
            </span>
          </div>
          <h1 className="font-serif text-3xl font-normal text-[#132A24]">
            New Requests
          </h1>
          <p className="text-xs text-[#132A24]/60 mt-1">
            Review client requests that have been matched to your practice.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex rounded-lg bg-[#132A24]/5 p-1 border border-[#132A24]/10 text-xs">
          {[
            { id: 'all', label: 'All', count: requests.length },
            { id: 'pending', label: 'Pending', count: pendingCount },
            { id: 'accepted', label: 'Accepted', count: acceptedCount },
            { id: 'declined', label: 'Declined', count: declinedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === tab.id
                  ? 'bg-white text-[#132A24] shadow-xs font-semibold'
                  : 'text-[#132A24]/60 hover:text-[#132A24]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterStatus === tab.id
                    ? 'bg-[#132A24]/10 text-[#132A24]'
                    : 'bg-[#132A24]/5 text-[#132A24]/50'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* FEEDBACK TOAST / BANNER */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-[#4E7A66]/10 border-[#4E7A66]/30 text-[#132A24]'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="text-[#4E7A66] shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-[#132A24]/40 hover:text-[#132A24] cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ERROR STATE BANNER */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchRequests}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-900 font-medium cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MAIN LIST & CARDS                                                     */}
      {/* --------------------------------------------------------------------- */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border border-[#132A24]/10 rounded-2xl p-6 shadow-xs animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-44 bg-[#132A24]/10 rounded"></div>
                <div className="h-4 w-20 bg-[#132A24]/10 rounded"></div>
              </div>
              <div className="h-4 w-3/4 bg-[#132A24]/5 rounded"></div>
              <div className="h-4 w-1/2 bg-[#132A24]/5 rounded"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#132A24]/10 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#132A24]/5 text-[#132A24]/30 flex items-center justify-center mx-auto">
            <Users size={24} />
          </div>
          <h3 className="font-serif text-xl font-normal text-[#132A24]">
            No new client requests
          </h3>
          <p className="text-xs text-[#132A24]/60 max-w-sm mx-auto leading-relaxed">
            When a client is matched with your practice, their request will appear here.
          </p>
          {filterStatus !== 'all' && (
            <button
              onClick={() => setFilterStatus('all')}
              className="text-xs text-[#4E7A66] hover:underline font-medium pt-2 inline-block cursor-pointer"
            >
              Show all requests ({requests.length})
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => {
            const isPending = isReqPending(req.matchStatus);
            const isSelected = isReqAccepted(req.matchStatus);
            const isDeclined = isReqDeclined(req.matchStatus);

            const createdDate = new Date(req.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={req.id}
                className="bg-white border border-[#132A24]/10 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#4E7A66]/30 transition-all"
              >
                <div className="space-y-3 flex-grow max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <span className="font-serif text-lg font-medium text-[#132A24]">
                      {req.clientDisplayName}
                    </span>
                    {req.age && (
                      <span className="text-xs text-[#132A24]/50">&bull; {req.age} yrs</span>
                    )}
                    {req.gender && (
                      <span className="text-xs text-[#132A24]/50 capitalize">&bull; {req.gender}</span>
                    )}
                    {req.city && (
                      <span className="text-xs text-[#132A24]/50">&bull; {req.city}</span>
                    )}

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ml-auto md:ml-2 ${
                        isSelected
                          ? 'bg-[#4E7A66]/15 text-[#4E7A66]'
                          : isDeclined
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isSelected ? 'Accepted' : isDeclined ? 'Declined' : 'Pending Review'}
                    </span>
                  </div>

                  <p className="text-xs text-[#132A24]/80 leading-relaxed font-sans">
                    <span className="font-medium text-[#132A24]">Presenting Reason: </span>
                    {req.presentingReason}
                  </p>

                  {/* Concerns Tags */}
                  {Array.isArray(req.concerns) && req.concerns.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {req.concerns.map((c, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-md bg-[#FAFAF8] border border-[#132A24]/10 text-[11px] text-[#132A24]/70"
                        >
                          {typeof c === 'string' ? c : c?.label || JSON.stringify(c)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[11px] text-[#132A24]/50 flex flex-wrap items-center gap-3 pt-1">
                    <span>Received: {createdDate}</span>
                    <span>&bull; Journey: {req.journeyType}</span>
                    <span className="capitalize">
                      &bull; Modality: {req.contactPreferences?.preferred_format || 'Telehealth Video'}
                    </span>
                    <span>&bull; Triage: {req.triageLevel}</span>
                    {req.matchScore && (
                      <span className="text-[#4E7A66] font-semibold">
                        &bull; {req.matchScore}% Match
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="px-3.5 py-2 rounded-lg border border-[#132A24]/15 text-xs text-[#132A24]/80 hover:bg-[#132A24]/5 transition-colors cursor-pointer font-medium"
                  >
                    Review Details
                  </button>

                  {isPending && (
                    <>
                      <button
                        onClick={() => setConfirmAction({ type: 'decline', request: req })}
                        disabled={actioningId === req.id}
                        className="px-3.5 py-2 rounded-lg border border-red-200 text-xs text-red-700 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: 'accept', request: req })}
                        disabled={actioningId === req.id}
                        className="px-4 py-2 rounded-lg bg-[#4E7A66] text-white text-xs font-semibold hover:bg-[#4E7A66]/90 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {actioningId === req.id ? 'Accepting...' : 'Accept Request'}
                      </button>
                    </>
                  )}

                  {isSelected && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4E7A66]/10 text-[#4E7A66] text-xs font-medium">
                        <CheckCircle2 size={13} /> Active Care
                      </span>
                      <button
                        onClick={() => handleAction(req.id, 'resend_email')}
                        disabled={actioningId === req.id}
                        title="Resend email notifications to client and therapist"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#132A24]/15 text-xs text-[#132A24]/75 hover:bg-[#132A24]/5 hover:text-[#132A24] transition-colors cursor-pointer disabled:opacity-50 font-medium"
                      >
                        <Mail size={12} />
                        {actioningId === req.id ? 'Sending...' : 'Resend Email'}
                      </button>
                    </div>
                  )}

                  {isDeclined && (
                    <span className="text-xs text-[#132A24]/40 italic">
                      Declined
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* REQUEST DETAIL MODAL                                                  */}
      {/* --------------------------------------------------------------------- */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-[#132A24]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#132A24]/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#132A24]/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#4E7A66]">
                  Matching Consultation Review
                </span>
                <h2 className="font-serif text-2xl font-normal text-[#132A24] mt-0.5">
                  {selectedRequest.clientDisplayName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-md text-[#132A24]/40 hover:text-[#132A24] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* SECTION 1: CLIENT IDENTIFIER & DEMOGRAPHICS */}
            <div className="bg-[#FAFAF8] border border-[#132A24]/5 rounded-xl p-4 space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#132A24]/60 block">
                Client Profile Context
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[#132A24]/50 block">Identifier:</span>
                  <span className="font-medium text-[#132A24]">{selectedRequest.clientDisplayName}</span>
                </div>
                <div>
                  <span className="text-[#132A24]/50 block">Age:</span>
                  <span className="font-medium text-[#132A24]">
                    {selectedRequest.age ? `${selectedRequest.age} yrs` : 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-[#132A24]/50 block">Gender:</span>
                  <span className="font-medium text-[#132A24] capitalize">
                    {selectedRequest.gender || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-[#132A24]/50 block">City / Location:</span>
                  <span className="font-medium text-[#132A24]">
                    {selectedRequest.city || 'Confidential'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: MATCHING CONTEXT */}
            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#132A24]/60 block">
                Matching Alignment
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-[#132A24]/10 bg-white">
                  <span className="text-[#132A24]/50 block">Fit Score</span>
                  <span className="text-base font-serif font-bold text-[#4E7A66]">
                    {selectedRequest.matchScore}%
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-[#132A24]/10 bg-white">
                  <span className="text-[#132A24]/50 block">Format</span>
                  <span className="font-medium text-[#132A24] capitalize">
                    {selectedRequest.contactPreferences?.preferred_format || 'Telehealth Video'}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-[#132A24]/10 bg-white">
                  <span className="text-[#132A24]/50 block">Triage Level</span>
                  <span className="font-medium text-[#132A24] capitalize">
                    {selectedRequest.triageLevel}
                  </span>
                </div>
              </div>

              {Array.isArray(selectedRequest.matchReasons) && selectedRequest.matchReasons.length > 0 && (
                <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#132A24]/5 text-xs space-y-1">
                  <span className="font-medium text-[#132A24] block">Matching Rationale:</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {selectedRequest.matchReasons.map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-white border border-[#132A24]/10 text-[10px] text-[#132A24]/70"
                      >
                        {typeof r === 'string' ? r : JSON.stringify(r)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: SAFE INTAKE SUMMARY */}
            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#132A24]/60 block">
                Intake Consultation Summary
              </span>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-medium text-[#132A24] block">Presenting Reason:</span>
                  <p className="text-[#132A24]/80 leading-relaxed bg-[#FAFAF8] p-3 rounded-lg border border-[#132A24]/5 mt-1">
                    {selectedRequest.presentingReason}
                  </p>
                </div>

                {Array.isArray(selectedRequest.concerns) && selectedRequest.concerns.length > 0 && (
                  <div>
                    <span className="font-medium text-[#132A24] block">Focus Areas & Concerns:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedRequest.concerns.map((c, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded bg-[#FAFAF8] border border-[#132A24]/10 text-[11px] text-[#132A24]/70"
                        >
                          {typeof c === 'string' ? c : c?.label || JSON.stringify(c)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(selectedRequest.affectedLifeAreas) && selectedRequest.affectedLifeAreas.length > 0 && (
                  <div>
                    <span className="font-medium text-[#132A24] block">Affected Life Areas:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedRequest.affectedLifeAreas.map((a, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded bg-[#FAFAF8] border border-[#132A24]/10 text-[11px] text-[#132A24]/70"
                        >
                          {typeof a === 'string' ? a : JSON.stringify(a)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRequest.ownWords && (
                  <div>
                    <span className="font-medium text-[#132A24] block">Client's Statement:</span>
                    <p className="text-[#132A24]/80 leading-relaxed italic bg-[#FAFAF8] p-3 rounded-lg border border-[#132A24]/5 mt-1">
                      "{selectedRequest.ownWords}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* TENANCY & PRIVACY SHIELD NOTICE */}
            <div className="bg-[#4E7A66]/5 border border-[#4E7A66]/20 rounded-xl p-4 text-xs space-y-1 text-[#132A24]">
              <div className="flex items-center gap-1.5 font-semibold text-[#4E7A66]">
                <Shield size={14} />
                <span>Client Privacy & Clinical Tenancy Protection</span>
              </div>
              <p className="text-[11px] text-[#132A24]/70 leading-relaxed">
                Client self-reflection journals, psychometric exercise responses, and private notes are confidential self-work and are strictly inaccessible to practitioner accounts.
              </p>
            </div>

            {/* MODAL ACTION BAR */}
            <div className="border-t border-[#132A24]/10 pt-4 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-lg border border-[#132A24]/15 text-xs text-[#132A24]/70 hover:bg-[#132A24]/5 cursor-pointer"
              >
                Close
              </button>

              {isReqPending(selectedRequest.matchStatus) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setConfirmAction({ type: 'decline', request: selectedRequest });
                    }}
                    className="px-4 py-2 rounded-lg border border-red-200 text-xs text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => {
                      setConfirmAction({ type: 'accept', request: selectedRequest });
                    }}
                    className="px-5 py-2 rounded-lg bg-[#4E7A66] text-white text-xs font-semibold hover:bg-[#4E7A66]/90 cursor-pointer shadow-xs"
                  >
                    Accept Request
                  </button>
                </div>
              )}

              {isReqAccepted(selectedRequest.matchStatus) && (
                <button
                  onClick={() => handleAction(selectedRequest.id, 'resend_email')}
                  disabled={actioningId === selectedRequest.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#132A24] text-white text-xs font-semibold hover:bg-[#132A24]/90 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Mail size={13} />
                  {actioningId === selectedRequest.id ? 'Sending...' : 'Resend Confirmation Email'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* CONFIRMATION DIALOG                                                   */}
      {/* --------------------------------------------------------------------- */}
      {confirmAction && (
        <div className="fixed inset-0 z-60 bg-[#132A24]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#132A24]/10 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  confirmAction.type === 'accept'
                    ? 'bg-[#4E7A66]/15 text-[#4E7A66]'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {confirmAction.type === 'accept' ? (
                  <HeartHandshake size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
              </div>
              <div>
                <h3 className="font-serif text-lg font-medium text-[#132A24]">
                  {confirmAction.type === 'accept' ? 'Accept Client Request?' : 'Decline Client Request?'}
                </h3>
                <span className="text-xs text-[#132A24]/50">
                  {confirmAction.request.clientDisplayName}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#132A24]/70 leading-relaxed">
              {confirmAction.type === 'accept'
                ? 'Accepting this request will establish an active clinical care relationship and add the client to your practice roster.'
                : 'Declining this request will mark the match as declined and preserve consultation history.'}
            </p>

            {confirmAction.type === 'decline' && (
              <div className="space-y-1 text-xs">
                <label className="text-[#132A24]/70 font-medium block">
                  Decline Reason (Optional):
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g. Clinical specialty mismatch, capacity limit..."
                  className="w-full h-20 p-2.5 rounded-lg border border-[#132A24]/15 text-xs text-[#132A24] focus:outline-hidden focus:border-[#4E7A66]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setConfirmAction(null);
                  setDeclineReason('');
                }}
                disabled={actioningId === confirmAction.request.id}
                className="px-4 py-2 rounded-lg border border-[#132A24]/15 text-xs text-[#132A24]/70 hover:bg-[#132A24]/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleAction(
                    confirmAction.request.id,
                    confirmAction.type,
                    declineReason
                  )
                }
                disabled={actioningId === confirmAction.request.id}
                className={`px-5 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer shadow-xs disabled:opacity-50 ${
                  confirmAction.type === 'accept'
                    ? 'bg-[#4E7A66] hover:bg-[#4E7A66]/90'
                    : 'bg-red-700 hover:bg-red-800'
                }`}
              >
                {actioningId === confirmAction.request.id
                  ? 'Processing...'
                  : confirmAction.type === 'accept'
                  ? 'Confirm Acceptance'
                  : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
