import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  X,
  CreditCard,
  ShieldCheck,
  User,
  ExternalLink,
} from 'lucide-react';

export default function TherapyBookingFlow({
  isOpen,
  onClose,
  initialTherapist = null,
  onSuccess = null,
}) {
  const [step, setStep] = useState(1); // 1: Therapist, 2: Slot, 3: Pricing Review, 4: Payment, 5: Confirmed
  const [therapists, setTherapists] = useState([]);
  const [loadingTherapists, setLoadingTherapists] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState(initialTherapist);

  // Slots
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Notes & Details
  const [clientNotes, setClientNotes] = useState('');
  const [error, setError] = useState(null);

  // Checkout & Order
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [bookingOrder, setBookingOrder] = useState(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [confirmedData, setConfirmedData] = useState(null);

  // Syncing Google Calendar retry
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      if (initialTherapist) {
        setSelectedTherapist(initialTherapist);
        setStep(2);
      } else {
        setStep(1);
        fetchTherapists();
      }
      setSelectedSlot(null);
      setError(null);
      setBookingOrder(null);
      setConfirmedData(null);
    }
  }, [isOpen, initialTherapist]);

  const fetchTherapists = async () => {
    setLoadingTherapists(true);
    try {
      const res = await fetch('/api/therapy/therapists');
      if (res.ok) {
        const data = await res.json();
        setTherapists(data.therapists || []);
      }
    } catch (err) {
      console.error('Failed to load therapists:', err);
    } finally {
      setLoadingTherapists(false);
    }
  };

  // Fetch slots whenever therapist changes or step 2 is active
  useEffect(() => {
    if (step === 2 && selectedTherapist?.id) {
      setLoadingSlots(true);
      setError(null);
      fetch(`/api/therapy/therapists/${selectedTherapist.id}/availability`)
        .then((res) => res.json())
        .then((data) => {
          setAvailableSlots(data.slots || []);
        })
        .catch((err) => {
          setError('Failed to fetch real-time availability. Please try again.');
          setAvailableSlots([]);
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [step, selectedTherapist]);

  // Group slots by date string
  const groupedSlots = useMemo(() => {
    const groups = {};
    for (const slot of availableSlots) {
      const d = new Date(slot.start);
      const dateKey = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(slot);
    }
    return groups;
  }, [availableSlots]);

  // Pricing calculations (Authoritative base + 18% GST)
  const baseFee = Number(selectedTherapist?.fee || selectedTherapist?.per_session_fee || 1500);
  const gstAmount = Math.round(baseFee * 0.18);
  const totalAmount = baseFee + gstAmount;

  // Handle Order Creation and Razorpay Checkout
  const handleProceedToPayment = async () => {
    if (!selectedTherapist || !selectedSlot) return;
    setIsCreatingOrder(true);
    setError(null);

    try {
      const res = await fetch('/api/therapy/sessions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapistAccountId: selectedTherapist.id,
          slotStart: selectedSlot.start,
          slotEnd: selectedSlot.end,
          sessionType: 'video',
          modality: 'telehealth',
          clientNotes: clientNotes || undefined,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error?.message || 'Failed to initialize session hold.');
      }

      setBookingOrder(orderData);
      setStep(4);

      // Launch Razorpay
      await launchRazorpay(orderData);
    } catch (err) {
      setError(err.message || 'An error occurred during booking creation.');
      setIsCreatingOrder(false);
    }
  };

  const launchRazorpay = async (orderData) => {
    try {
      // Ensure Razorpay script loaded
      if (typeof window !== 'undefined' && !window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const options = {
        key: orderData.keyId,
        order_id: orderData.razorpayOrderId,
        amount: orderData.amountPaise,
        currency: orderData.currency || 'INR',
        name: 'Ingress Within',
        description: `Therapy Session with ${selectedTherapist?.name || selectedTherapist?.full_name || 'Clinician'}`,
        theme: { color: '#064e3b' },
        handler: async function (response) {
          await verifyPayment(response, orderData.bookingId);
        },
        modal: {
          ondismiss: function () {
            setIsCreatingOrder(false);
          },
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setError(resp.error?.description || 'Payment was declined or failed.');
          setIsCreatingOrder(false);
        });
        rzp.open();
      } else {
        // Fallback for environments without external script access (test runner)
        setIsCreatingOrder(false);
      }
    } catch (checkoutErr) {
      console.warn('Razorpay popup error:', checkoutErr);
      setIsCreatingOrder(false);
    }
  };

  const verifyPayment = async (paymentResponse, bookingId) => {
    setIsVerifyingPayment(true);
    setError(null);
    try {
      const res = await fetch('/api/therapy/sessions/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          booking_id: bookingId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Payment verification failed.');
      }

      setConfirmedData(data);
      setStep(5);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message || 'Payment verification could not be confirmed.');
    } finally {
      setIsVerifyingPayment(false);
      setIsCreatingOrder(false);
    }
  };

  // Safe retry for Google Calendar sync
  const handleRetryCalendarSync = async () => {
    const apptId = confirmedData?.appointment?.id;
    if (!apptId) return;

    setIsRetryingSync(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/therapy/sessions/sync-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apptId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Calendar sync retry failed.');
      }

      setConfirmedData((prev) => ({
        ...prev,
        appointment: {
          ...prev.appointment,
          google_meet_url: data.googleMeetUrl || prev.appointment?.google_meet_url,
          meeting_link: data.googleMeetUrl || prev.appointment?.meeting_link,
          calendar_sync_status: data.calendarSyncStatus || 'synced',
          google_meet_status: data.googleMeetUrl ? 'created' : prev.appointment?.google_meet_status,
        },
      }));
      setSyncMessage('Google Calendar synced and Google Meet room ready!');
    } catch (err) {
      setSyncMessage(`Sync attempt: ${err.message}`);
    } finally {
      setIsRetryingSync(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col my-8 max-h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#FAF9F5]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <h2 className="font-serif text-lg font-medium text-gray-900">
              {step === 5 ? 'Booking Confirmed' : 'Book a Therapy Session'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator (Steps 1-4) */}
        {step < 5 && (
          <div className="px-6 pt-4 pb-2 border-b border-gray-50 flex items-center justify-between text-[11px] font-medium text-gray-400">
            <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-emerald-800 font-semibold' : ''}`}>
              <span>1. Clinician</span>
            </div>
            <span>&rsaquo;</span>
            <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-emerald-800 font-semibold' : ''}`}>
              <span>2. Date & Time</span>
            </div>
            <span>&rsaquo;</span>
            <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-emerald-800 font-semibold' : ''}`}>
              <span>3. Review & Fee</span>
            </div>
            <span>&rsaquo;</span>
            <div className={`flex items-center gap-1.5 ${step === 4 ? 'text-emerald-800 font-semibold' : ''}`}>
              <span>4. Checkout</span>
            </div>
          </div>
        )}

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Therapist Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Select a Licensed Clinician</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Choose a therapist based on their clinical background and areas of expertise.
                </p>
              </div>

              {loadingTherapists ? (
                <div className="py-12 text-center text-xs text-gray-400">Loading licensed clinicians...</div>
              ) : therapists.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-xl">
                  No clinicians currently listed for direct booking.
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {therapists.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTherapist(t)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedTherapist?.id === t.id
                          ? 'border-emerald-700 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-700'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-800 text-emerald-100 flex items-center justify-center font-serif text-sm">
                            {(t.name || t.full_name || 'Dr').charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              {t.name || t.full_name}
                            </h4>
                            <p className="text-[11px] text-gray-500">
                              {t.credentials || 'Licensed Therapist'} &bull; ₹{t.fee || t.per_session_fee || 1500}/session
                            </p>
                          </div>
                        </div>
                        {selectedTherapist?.id === t.id && (
                          <CheckCircle2 size={18} className="text-emerald-700" />
                        )}
                      </div>
                      {t.bio && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                          {t.bio}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!selectedTherapist}
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-semibold hover:bg-emerald-900 disabled:opacity-50 inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  Continue to Schedule <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Real-time Slot Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Choose Date & Time Slot</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Showing real-time availability synced with{' '}
                    <strong>{selectedTherapist?.name || selectedTherapist?.full_name || 'Clinician'}</strong>’s Google Calendar.
                  </p>
                </div>
                {!initialTherapist && (
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-emerald-800 hover:underline font-medium"
                  >
                    Change Clinician
                  </button>
                )}
              </div>

              {loadingSlots ? (
                <div className="py-12 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={18} className="animate-spin text-emerald-700" />
                  <span>Checking Google Calendar and live booking holds...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                  <CalendarIcon size={28} className="mx-auto text-gray-400" />
                  <p className="text-xs font-semibold text-gray-800">No open slots in the next 14 days</p>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                    This clinician’s calendar is currently booked or undergoing scheduling buffer adjustments. Please check back soon or consult another provider.
                  </p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-4 p-1 border border-gray-100 rounded-2xl">
                  {Object.entries(groupedSlots).map(([day, slots]) => (
                    <div key={day} className="space-y-2">
                      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2">
                        {day}
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slots.map((slot) => {
                          const isSelected = selectedSlot?.start === slot.start;
                          const timeStr = new Date(slot.start).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          });
                          return (
                            <button
                              key={slot.start}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all ${
                                isSelected
                                  ? 'bg-emerald-800 border-emerald-800 text-white shadow-xs'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-600 hover:bg-emerald-50/40'
                              }`}
                            >
                              {timeStr}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedSlot && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                  <span className="font-medium">
                    Selected:{' '}
                    {new Date(selectedSlot.start).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                  <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-semibold">
                    50 Minutes
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-semibold hover:bg-emerald-900 disabled:opacity-50 inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  Review Booking <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Authoritative Review & Policy */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Review & Authoritative Pricing</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Confirm your appointment schedule and review transparent fee calculation.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-500">Clinician</span>
                  <strong className="text-gray-900">
                    {selectedTherapist?.name || selectedTherapist?.full_name}
                  </strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-500">Date & Time</span>
                  <strong className="text-gray-900">
                    {new Date(selectedSlot?.start).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-200">
                  <span className="text-gray-500">Modality</span>
                  <strong className="text-gray-900 flex items-center gap-1">
                    <Video size={13} className="text-blue-600" /> Google Meet Video Consultation
                  </strong>
                </div>

                {/* Authoritative pricing */}
                <div className="pt-1 space-y-1.5">
                  <div className="flex justify-between text-gray-600">
                    <span>Session Fee (50 min)</span>
                    <span>₹{baseFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST (18% Regulatory Tax)</span>
                    <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total Amount Payable</span>
                    <span className="text-emerald-800">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Client Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Message for Clinician (Optional)
                </label>
                <textarea
                  rows={2}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Share any context or primary topics you would like to address..."
                  className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                />
              </div>

              {/* Strict Policy Guarantee */}
              <div className="bg-[#FAF9F5] border border-[#132A24]/10 rounded-xl p-3.5 text-xs text-[#132A24]/80 flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-[#4E7A66] shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-[11px] leading-relaxed">
                  <p className="font-semibold text-[#132A24]">Scheduling & Cancellation Protection</p>
                  <p>
                    Free reschedule up to <strong>24 hours</strong> before start. 100% automated refund if cancelled at least <strong>48 hours</strong> in advance.
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  disabled={isCreatingOrder}
                  onClick={handleProceedToPayment}
                  className="px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-semibold hover:bg-emerald-900 disabled:opacity-50 inline-flex items-center gap-2 transition-colors shadow-xs"
                >
                  <CreditCard size={14} />
                  {isCreatingOrder ? 'Reserving Slot (15 min hold)...' : `Proceed to Pay ₹${totalAmount}`}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Processing Payment / Hold State */}
          {step === 4 && (
            <div className="py-8 text-center space-y-4">
              <RefreshCw size={28} className="animate-spin text-emerald-700 mx-auto" />
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {isVerifyingPayment ? 'Verifying Payment & Syncing Meet...' : 'Awaiting Razorpay Checkout'}
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  A 15-minute slot hold has been created. Complete your payment in the checkout window to confirm your booking.
                </p>
              </div>

              {bookingOrder && !isVerifyingPayment && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => launchRazorpay(bookingOrder)}
                    className="px-4 py-2 bg-emerald-800 text-white text-xs font-medium rounded-xl hover:bg-emerald-900"
                  >
                    Re-open Payment Window
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Confirmed Booking Screen */}
          {step === 5 && (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <h3 className="font-serif text-2xl font-medium text-gray-900">Therapy Session Confirmed!</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Reference: <strong className="text-gray-900">{confirmedData?.booking?.booking_reference}</strong>
                </p>
              </div>

              {/* Confirmed Details Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-left space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Clinician</span>
                  <span className="font-semibold text-gray-900">
                    {selectedTherapist?.name || selectedTherapist?.full_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date & Time</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(selectedSlot?.start).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-800">
                    Confirmed
                  </span>
                </div>
              </div>

              {/* Google Meet & Calendar Integration Card */}
              <div className="p-4 rounded-2xl border border-gray-200 bg-white text-left space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-xs text-gray-900">
                    <Video size={16} className="text-blue-600" />
                    <span>Google Meet Consultation Room</span>
                  </div>
                  {confirmedData?.appointment?.calendar_sync_status === 'synced' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={11} /> Calendar Synced
                    </span>
                  )}
                </div>

                {confirmedData?.appointment?.google_meet_url ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-gray-500">
                      A dedicated Google Meet room has been generated and synced with your calendar.
                    </p>
                    <a
                      href={confirmedData.appointment.google_meet_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 no-underline shadow-xs transition-colors"
                    >
                      <Video size={14} /> Join Google Meet <ExternalLink size={12} />
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      Calendar synchronization or Google Meet generation was not completed instantly. You can retry synchronization now.
                    </p>
                    <button
                      type="button"
                      disabled={isRetryingSync}
                      onClick={handleRetryCalendarSync}
                      className="w-full py-2 px-3 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCw size={13} className={isRetryingSync ? 'animate-spin' : ''} />
                      {isRetryingSync ? 'Syncing with Google Calendar...' : 'Try Calendar Sync Again'}
                    </button>
                    {syncMessage && (
                      <p className="text-[11px] text-emerald-700 font-medium text-center">{syncMessage}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (typeof window !== 'undefined' && window.navigateTo) {
                      window.navigateTo('/therapy/sessions');
                    } else if (typeof window !== 'undefined') {
                      window.location.href = '/therapy/sessions';
                    }
                  }}
                  className="flex-1 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-semibold hover:bg-emerald-900 transition-colors shadow-xs"
                >
                  View Your Sessions
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
