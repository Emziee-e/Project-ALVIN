import { supabase } from './supabaseClient'

/*
 * PROFILE DATABASE STRUCTURE
 *
 * student_profile.student_id
 *      -> auth.users.id
 *
 * career_advisor_profile.car_ad_id
 *      -> auth.users.id
 *
 * admin_profile.admin_id
 *      -> auth.users.id
 *
 * IMPORTANT:
 * These primary keys are UUIDs.
 * Always query them using user.id from Supabase Auth.
 *
 * Do NOT use the UB number extracted from the email.
 *
 * Correct:
 *   .eq('student_id', user.id)
 *
 * Incorrect:
 *   .eq('student_id', '2204421')
 */

const profileTables = [
  {
    table: 'admin_profile',
    role: 'admin',
    key: 'admin_id',
  },
  {
    table: 'career_advisor_profile',
    role: 'career_advisor',
    key: 'car_ad_id',
  },
  {
    table: 'student_profile',
    role: 'student',
    key: 'student_id',
  },
]

/**
 * Find the profile/role belonging to the
 * currently authenticated Supabase user.
 */
export async function getProfileForUser(user) {
  if (!user?.id) {
    return null
  }

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
 * Create or update the student profile.
 *
 * program_course and year_level have been removed
 * because those columns no longer exist in
 * student_profile.
 */
export async function saveStudentProfile(user, values = {}) {
  if (!user?.id) {
    throw new Error(
      'A signed-in user is required to save a student profile.'
    )
  }

  const authUserId = user.id

  const profileValues = {
    ub_mail: user.email,
    display_name:
      values.display_name ||
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      '',
  }

  // Check whether the student profile already exists.
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

  // Existing profile -> update it.
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

  // No student profile -> create one.
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
 * Create an admin or career-advisor profile.
 *
 * Supported roles:
 * - admin
 * - career_advisor
 *
 * Admin does NOT require account_status.
 */
export async function saveRoleProfile(user, role) {
  if (
    !user?.id ||
    !['admin', 'career_advisor'].includes(role)
  ) {
    throw new Error(
      'A signed-in admin or career advisor is required.'
    )
  }

  const authUserId = user.id

  let table
  let key

  if (role === 'admin') {
    table = 'admin_profile'
    key = 'admin_id'
  } else {
    table = 'career_advisor_profile'
    key = 'car_ad_id'
  }

  // Check whether the profile already exists.
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

  const profileValues = {
    [key]: authUserId,

    ub_mail: user.email,

    display_name:
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      '',
  }

  /*
   * account_status only applies to the student
   * and career-advisor profiles.
   *
   * Admin profile does not need it.
   */
  if (role === 'career_advisor') {
    profileValues.account_status = 'active'
  }

  const { error: insertError } = await supabase
    .from(table)
    .insert(profileValues)

  if (insertError) {
    throw insertError
  }
}