import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { IssueStatus, IssueSeverity, UserRole } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const checkDuplicates = searchParams.get('checkDuplicates') === 'true';
    if (checkDuplicates) {
      const categoryId = searchParams.get('categoryId') || '';
      const lat = parseFloat(searchParams.get('lat') || '0');
      const lng = parseFloat(searchParams.get('lng') || '0');
      const radius = parseFloat(searchParams.get('radius') || '350');

      const duplicates = serverDb.findPotentialDuplicates(categoryId, lat, lng, radius);
      return NextResponse.json({ duplicates });
    }

    const filters = {
      role: (searchParams.get('role') as UserRole) || undefined,
      citizenId: searchParams.get('citizenId') || undefined,
      departmentId: searchParams.get('departmentId') || undefined,
      fieldWorkerId: searchParams.get('fieldWorkerId') || undefined,
      status: (searchParams.get('status') as IssueStatus) || undefined,
      severity: (searchParams.get('severity') as IssueSeverity) || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      jurisdictionId: searchParams.get('jurisdictionId') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const issues = serverDb.getIssues(filters);
    return NextResponse.json({ issues, total: issues.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = body.title;
    const description = body.description;
    const categoryId = body.categoryId || body.category_id;
    const severity = body.severity || 'medium';
    const latitude = body.latitude;
    const longitude = body.longitude;
    const locationText = body.locationText || body.location_text || 'Ward Location';
    const jurisdictionId = body.jurisdictionId || body.jurisdiction_id;
    const photoDataUrl = body.photoDataUrl || body.photo_url || body.photo;
    const photoCaption = body.photoCaption || body.photo_caption;
    const authenticity = body.authenticity;
    const citizenId = body.citizenId || body.citizen_id;

    if (!title || !description || !categoryId || !jurisdictionId) {
      return NextResponse.json(
        { error: 'Title, description, category, and location are required.' },
        { status: 400 }
      );
    }

    // Determine reporting citizen
    let citizen = citizenId ? serverDb.findUserById(citizenId) : null;
    if (!citizen) {
      citizen = serverDb.findUserByEmail('citizen@civiclens.gov') || null;
    }

    const newIssue = serverDb.createIssue(
      {
        title,
        description,
        categoryId,
        severity: severity || 'medium',
        latitude: Number(latitude) || 12.9791,
        longitude: Number(longitude) || 80.2212,
        locationText: locationText || 'Chennai Constituency',
        jurisdictionId,
        photoDataUrl,
        photoCaption,
        authenticity,
      },
      citizen!
    );

    return NextResponse.json({
      success: true,
      issue: newIssue,
      message: 'Complaint submitted and auto-routed successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
