import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';

export async function POST(req: NextRequest) {
  try {
    const { userId, credits } = await req.json();

    if (!userId || credits === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get current user credits
    const currentUser = await db.user.findUnique({
      where: { id: userId },
    });

    const currentCredits = currentUser?.credits || 150;
    const purchasedCredits = credits - currentCredits;

    if (purchasedCredits <= 0) {
      return NextResponse.json(
        { error: 'Invalid credit amount' },
        { status: 400 }
      );
    }

    // Update user credits in database
    await db.user.update({
      where: { id: userId },
      data: { credits },
    });

    // Create transaction record
    await db.StripeTransaction.create({
      data: {
        userId,
        credits: purchasedCredits,
        user: {
          connect: { id: userId }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating credits:', error);
    return NextResponse.json(
      { error: 'Failed to update credits' },
      { status: 500 }
    );
  }
}
