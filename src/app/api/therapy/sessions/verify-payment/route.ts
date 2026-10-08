import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { SessionBookingService } from '../../../../../lib/therapy/sessionBookingService';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, booking_id } = body;

    if (!razorpay_payment_id) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMETERS', message: 'razorpay_payment_id is required.' } },
        { status: 400 }
      );
    }

    const confirmation = await SessionBookingService.confirmSessionPayment({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      bookingId: booking_id,
    });

    return NextResponse.json(confirmation);
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      {
        error: {
          code: err.code || 'PAYMENT_VERIFICATION_FAILED',
          message: err.message || 'Payment confirmation failed.',
        },
      },
      { status }
    );
  }
}
