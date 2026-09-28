import { NextRequest, NextResponse } from 'next/server';
import { SessionBookingService } from '../../../../../../lib/therapy/sessionBookingService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: therapistId } = await params;
    const searchParams = request.nextUrl.searchParams;

    const startDate = searchParams.get('start') || searchParams.get('startDate') || new Date().toISOString();
    // Default to 14 days ahead
    const defaultEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('end') || searchParams.get('endDate') || defaultEnd;

    const [slots, pricing] = await Promise.all([
      SessionBookingService.getTherapistAvailability(therapistId, startDate, endDate),
      SessionBookingService.getAuthoritativePricing(therapistId),
    ]);

    return NextResponse.json({
      therapistId,
      startDate,
      endDate,
      pricing,
      slots,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'AVAILABILITY_ERROR', message: err.message || 'Failed to fetch therapist availability.' } },
      { status: 500 }
    );
  }
}
