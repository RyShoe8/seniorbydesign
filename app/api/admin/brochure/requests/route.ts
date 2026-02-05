import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBrochureRequestsCollection } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Period = 'day' | 'week' | 'month' | 'year';

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

function toIsoDateUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeekUTC(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

function normalizeStart(date: Date, period: Period) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  if (period === 'week') {
    return startOfWeekUTC(d);
  }
  if (period === 'month') {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  }
  if (period === 'year') {
    return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  }
  return d;
}

function nextBucket(date: Date, period: Period) {
  const d = new Date(date.getTime());
  if (period === 'day') {
    d.setUTCDate(d.getUTCDate() + 1);
  } else if (period === 'week') {
    d.setUTCDate(d.getUTCDate() + 7);
  } else if (period === 'month') {
    d.setUTCMonth(d.getUTCMonth() + 1, 1);
  } else {
    d.setUTCFullYear(d.getUTCFullYear() + 1, 0, 1);
  }
  return d;
}

function bucketLabel(date: Date, period: Period) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  if (period === 'month') {
    return `${year}-${month}`;
  }
  if (period === 'year') {
    return `${year}`;
  }
  if (period === 'week') {
    return toIsoDateUTC(date);
  }
  return `${year}-${month}-${day}`;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get('period') || 'day';
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');
  const period = (['day', 'week', 'month', 'year'] as Period[]).includes(periodParam as Period)
    ? (periodParam as Period)
    : 'day';

  if (!startParam || !endParam) {
    return NextResponse.json({ error: 'Missing start or end date' }, { status: 400 });
  }

  const startDate = new Date(startParam);
  const endDate = new Date(endParam);

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
  }

  const collection = await getBrochureRequestsCollection();
  const requests = await collection
    .find({
      createdAt: { $gte: startDate, $lte: endDate },
      brochureType: { $in: ['digital', 'physical'] },
    })
    .project({ brochureType: 1, createdAt: 1 })
    .toArray();

  const buckets: Record<string, { digital: number; physical: number }> = {};
  let cursor = normalizeStart(startDate, period);
  const endCursor = normalizeStart(endDate, period);

  while (cursor <= endCursor) {
    const label = bucketLabel(cursor, period);
    buckets[label] = { digital: 0, physical: 0 };
    cursor = nextBucket(cursor, period);
  }

  for (const requestItem of requests) {
    const createdAt = new Date(requestItem.createdAt);
    const bucketDate = normalizeStart(createdAt, period);
    const label = bucketLabel(bucketDate, period);
    if (!buckets[label]) {
      buckets[label] = { digital: 0, physical: 0 };
    }
    if (requestItem.brochureType === 'digital') {
      buckets[label].digital += 1;
    } else if (requestItem.brochureType === 'physical') {
      buckets[label].physical += 1;
    }
  }

  const labels = Object.keys(buckets).sort();
  const digital = labels.map((label) => buckets[label].digital);
  const physical = labels.map((label) => buckets[label].physical);

  return NextResponse.json({ labels, digital, physical });
}
