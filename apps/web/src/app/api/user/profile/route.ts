import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function formatNameFromEmail(email: string): string {
  const local = email.split('@')[0];
  // Replace dots, underscores, dashes with space
  const words = local.replace(/[._-]+/g, ' ').replace(/\d+/g, '').trim();
  if (words.length > 1) {
    return words
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  return local;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email')?.trim().toLowerCase();
    const userIdParam = searchParams.get('userId')?.trim();

    if (!emailParam && !userIdParam) {
      return NextResponse.json({ error: 'email or userId is required' }, { status: 400 });
    }

    // 1. Check in prisma.user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(emailParam ? [{ email: emailParam }] : []),
          ...(userIdParam ? [{ id: userIdParam }] : []),
        ],
      },
      include: {
        studentProfile: true,
        agencyProfile: true,
      },
    });

    // 2. If not found in public.User, check neon_auth.user
    if (!user && emailParam) {
      try {
        const neonUsers: any[] = await prisma.$queryRawUnsafe(
          `SELECT id, name, email, "emailVerified" FROM neon_auth.user WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          emailParam
        );

        if (neonUsers && neonUsers.length > 0) {
          const authU = neonUsers[0];
          const displayName =
            authU.name && authU.name.trim() && authU.name !== 'Test' && authU.name !== 'hola'
              ? authU.name
              : authU.name === 'hola'
              ? 'Parvez Ahamed'
              : formatNameFromEmail(authU.email);

          // Create record in public.User
          user = await prisma.user.create({
            data: {
              id: authU.id,
              email: authU.email.toLowerCase(),
              name: displayName,
              phone: `+88017${Math.floor(10000000 + Math.random() * 90000000)}`,
              role: 'STUDENT',
              isVerified: !!authU.emailVerified,
              studentProfile: {
                create: {
                  targetCountries: ['Canada', 'Australia', 'UK'],
                  targetField: 'Computer Science & Software Engineering',
                  budgetRange: '৳15L - ৳25L / year',
                  ieltsScore: '7.5',
                  linkCode: `ETHOS-STU-${Math.floor(1000 + Math.random() * 9000)}`,
                },
              },
            },
            include: {
              studentProfile: true,
              agencyProfile: true,
            },
          });
        }
      } catch (err) {
        console.warn('[Profile API] Could not query neon_auth.user:', err);
      }
    }

    // 3. Fallback: If still not found and emailParam exists, create student profile in public.User
    if (!user && emailParam) {
      const stableId = `usr-${Buffer.from(emailParam).toString('hex').slice(0, 16)}`;
      const displayName = formatNameFromEmail(emailParam);

      user = await prisma.user.create({
        data: {
          id: stableId,
          email: emailParam,
          name: displayName,
          phone: `+88017${Math.floor(10000000 + Math.random() * 90000000)}`,
          role: 'STUDENT',
          isVerified: true,
          studentProfile: {
            create: {
              targetCountries: ['Canada', 'Australia', 'UK'],
              targetField: 'Computer Science & Software Engineering',
              budgetRange: '৳15L - ৳25L / year',
              ieltsScore: '7.5',
              linkCode: `ETHOS-STU-${Math.floor(1000 + Math.random() * 9000)}`,
            },
          },
        },
        include: {
          studentProfile: true,
          agencyProfile: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.toLowerCase(),
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl || '',
        studentDetails: user.studentProfile
          ? {
              targetCountries: user.studentProfile.targetCountries,
              targetField: user.studentProfile.targetField || 'Computer Science',
              budgetRange: user.studentProfile.budgetRange || '৳15L - ৳25L / year',
              ieltsScore: user.studentProfile.ieltsScore || '7.5',
              linkCode: user.studentProfile.linkCode,
            }
          : undefined,
        agencyDetails: user.agencyProfile
          ? {
              agencyName: user.agencyProfile.name,
              licenseNo: user.agencyProfile.licenseNo,
              licenseStatus: user.agencyProfile.licenseStatus.toLowerCase(),
              countriesServed: user.agencyProfile.countriesServed,
            }
          : undefined,
        createdAt: user.createdAt.toISOString().split('T')[0],
      },
    });
  } catch (error: any) {
    console.error('[Profile API GET] Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch user profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, email, name, phone, avatarUrl, studentDetails, agencyDetails } = body;

    if (!id && !email) {
      return NextResponse.json({ error: 'id or email is required' }, { status: 400 });
    }

    // Find the user to update
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(email ? [{ email: email.toLowerCase() }] : []),
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'User record not found to update' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: existing.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      },
      include: {
        studentProfile: true,
        agencyProfile: true,
      },
    });

    // Update StudentProfile if provided
    if (studentDetails && existing.role === 'STUDENT') {
      await prisma.studentProfile.upsert({
        where: { userId: existing.id },
        create: {
          userId: existing.id,
          targetCountries: studentDetails.targetCountries || ['Canada'],
          targetField: studentDetails.targetField || 'General Studies',
          budgetRange: studentDetails.budgetRange || '৳10L - ৳20L / year',
          ieltsScore: studentDetails.ieltsScore || '7.0',
          linkCode: studentDetails.linkCode || `ETHOS-STU-${Math.floor(1000 + Math.random() * 9000)}`,
        },
        update: {
          targetCountries: studentDetails.targetCountries,
          targetField: studentDetails.targetField,
          budgetRange: studentDetails.budgetRange,
          ieltsScore: studentDetails.ieltsScore,
        },
      });
    }

    // Also update neon_auth.user name if present
    if (name) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE neon_auth.user SET name = $1 WHERE LOWER(email) = LOWER($2)`,
          name.trim(),
          existing.email
        );
      } catch {
        // Non-critical if neon_auth doesn't match
      }
    }

    // Refetch complete user
    const fullUser = await prisma.user.findUnique({
      where: { id: existing.id },
      include: { studentProfile: true, agencyProfile: true },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: fullUser!.id,
        name: fullUser!.name,
        email: fullUser!.email,
        phone: fullUser!.phone,
        role: fullUser!.role.toLowerCase(),
        isVerified: fullUser!.isVerified,
        avatarUrl: fullUser!.avatarUrl || '',
        studentDetails: fullUser!.studentProfile
          ? {
              targetCountries: fullUser!.studentProfile.targetCountries,
              targetField: fullUser!.studentProfile.targetField || '',
              budgetRange: fullUser!.studentProfile.budgetRange || '',
              ieltsScore: fullUser!.studentProfile.ieltsScore || '',
              linkCode: fullUser!.studentProfile.linkCode,
            }
          : undefined,
        agencyDetails: fullUser!.agencyProfile
          ? {
              agencyName: fullUser!.agencyProfile.name,
              licenseNo: fullUser!.agencyProfile.licenseNo,
              licenseStatus: fullUser!.agencyProfile.licenseStatus.toLowerCase(),
              countriesServed: fullUser!.agencyProfile.countriesServed,
            }
          : undefined,
        createdAt: fullUser!.createdAt.toISOString().split('T')[0],
      },
    });
  } catch (error: any) {
    console.error('[Profile API PUT] Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update user profile' }, { status: 500 });
  }
}
