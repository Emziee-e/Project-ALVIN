import { supabase } from './supabaseClient'

/*
 * IMPORTANT:
 *
 * student_profile.student_id -> auth.users.id
 * staff_profile.staff_id     -> auth.users.id
 * admin_profile.admin_id     -> auth.users.id
 *
 * All three columns are UUID foreign keys.
 * Therefore ALWAYS use user.id when querying them.
 *
 * Example:
 *
 * user.id:
 * 8e19e6d5-8fb4-4a0b-be28-93fb5f00ff06
 *
 * user.email:
 * 2204421@ub.edu.ph
 *
 * Never use "2204421" as student_id/staff_id/admin_id.
 */

const profileTables = [
  {
    table: 'admin_profile',
    role: 'admin',
    key: 'admin_id',
  },
  {
    table: 'staff_profile',
    role: 'staff',
    key: 'staff_id',
  },
  {
    table: 'student_profile',
    role: 'student',
    key: 'student_id',
  },
]

/**
 * Find which profile belongs to the currently
 * authenticated Supabase user.
 */
export async function getProfileForUser(user) {
  if (!user?.id) {
    return null
  }

  // user.id is the UUID from auth.users.id
  const authUserId = user.id

  for (const { table, role, key } of profileTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq(key, authUserId)
      .maybeSingle()

    if (error) {
      console.error(
        `Unable to read ${table}:`,
        error
      )

      continue
    }

    if (data) {
      return {
        role,
        table,
        profile: data,
      }
    }
  }

  return null
}

/**
 * Create or update student profile.
 */
export async function saveStudentProfile(user, values) {
  if (!user?.id) {
    throw new Error(
      'A signed-in user is required to save a student profile.'
    )
  }

  const authUserId = user.id

  const profileValues = {
    ub_mail: user.email,
    display_name:
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      '',
    program_course: values.program_course,
    year_level: values.year_level,
  }

  // Check whether this auth user already has
  // a student_profile row.
  const {
    data: existingProfile,
    error: readError,
  } = await supabase
    .from('student_profile')
    .select('*')
    .eq('student_id', authUserId)
    .maybeSingle()

  if (readError) {
    throw readError
  }

  // Existing student -> update profile.
  if (existingProfile) {
    const { error: updateError } = await supabase
      .from('student_profile')
      .update(profileValues)
      .eq('student_id', authUserId)

    if (updateError) {
      throw updateError
    }

    return
  }

  // No student profile yet -> create one.
  const { error: insertError } = await supabase
    .from('student_profile')
    .insert({
      student_id: authUserId,
      ...profileValues,
    })

  if (insertError) {
    throw insertError
  }
}

/**
 * Create admin/staff profile if it does not exist.
 */
export async function saveRoleProfile(user, role) {
  if (
    !user?.id ||
    !['admin', 'staff'].includes(role)
  ) {
    throw new Error(
      'A signed-in admin or staff user is required.'
    )
  }

  const authUserId = user.id

  const table =
    role === 'admin'
      ? 'admin_profile'
      : 'staff_profile'

  const key =
    role === 'admin'
      ? 'admin_id'
      : 'staff_id'

  // Check existing profile.
  const {
    data: existingProfile,
    error: readError,
  } = await supabase
    .from(table)
    .select('*')
    .eq(key, authUserId)
    .maybeSingle()

  if (readError) {
    throw readError
  }

  if (existingProfile) {
    return
  }

  // Create profile linked directly to auth.users.id.
  const { error: insertError } = await supabase
    .from(table)
    .insert({
      [key]: authUserId,
      ub_mail: user.email,
      display_name:
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.email?.split('@')[0] ||
        '',
    })

  if (insertError) {
    throw insertError
  }
}