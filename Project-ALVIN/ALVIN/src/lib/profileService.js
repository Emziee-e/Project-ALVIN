import { supabase } from './supabaseClient'

<<<<<<< HEAD
const profileTables = [
  { table: 'admin_profile', role: 'admin', keys: ['admin_id', 'user_id', 'email', 'id'] },
  { table: 'staff_profile', role: 'staff', keys: ['staff_id', 'user_id', 'email', 'id'] },
  { table: 'student_profile', role: 'student', keys: ['student_id', 'user_id', 'email', 'id'] },
]

const profileKeys = ['student_id', 'user_id', 'email', 'id']
const profileKeyErrors = ['42703', '42804', '22P02', 'PGRST116', 'PGRST204']

const getProfileKeyValue = (key, user) => {
  if (key === 'email') return user.email
  return user.id
}

const getProfileKeyValues = (key, user) => {
  if (key === 'email') return [user.email]
  if (key.endsWith('_id')) {
    const emailId = user.email?.split('@')[0]
    return [...new Set([user.id, user.user_metadata?.[key], emailId].filter(Boolean))]
  }
  return [user.id]
}

export async function getProfileForUser(user) {
  if (!user?.id) return null

  for (const { table, role, keys } of profileTables) {
    for (const key of keys) {
      for (const value of getProfileKeyValues(key, user)) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq(key, value)
          .maybeSingle()

        if (!error && data) return { role, table, profile: data }

        // Continue trying supported key shapes when PostgREST rejects a column or value.
        if (error && !profileKeyErrors.includes(error.code)) {
          console.error(`Unable to read ${table}:`, error.message)
        }
=======
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
>>>>>>> poli
      }
    }
  }

  return null
}

<<<<<<< HEAD
export async function saveStudentProfile(user, values) {
  if (!user?.id) throw new Error('A signed-in user is required to save a student profile.')

  const profileValues = {
=======
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
>>>>>>> poli
    program_course: values.program_course,
    year_level: values.year_level,
  }

<<<<<<< HEAD
  for (const key of profileKeys) {
    const value = getProfileKeyValue(key, user)
    const { data, error } = await supabase
      .from('student_profile')
      .select('*')
      .eq(key, value)
      .maybeSingle()

    if (error && profileKeyErrors.includes(error.code)) continue
    if (error) throw error

    if (data) {
      const { error: updateError } = await supabase
        .from('student_profile')
        .update(profileValues)
        .eq(key, value)

      if (updateError) throw updateError
      return
    }
  }

  for (const key of profileKeys) {
    const identity = getProfileKeyValue(key, user)
    const { error } = await supabase
      .from('student_profile')
      .insert({ [key]: identity, ...profileValues })

    if (!error) return
    if (!profileKeyErrors.includes(error.code)) throw error
  }

  throw new Error('student_profile must contain student_id, user_id, id, or email as its user identity column.')
}

export async function saveRoleProfile(user, role) {
  if (!user?.id || !['admin', 'staff'].includes(role)) {
    throw new Error('A signed-in admin or staff user is required to save a role profile.')
  }

  const table = `${role}_profile`
  const profileKeys = [`${role}_id`, 'user_id', 'email', 'id']

  for (const key of profileKeys) {
    const value = getProfileKeyValue(key, user)
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq(key, value)
      .maybeSingle()

    if (error && profileKeyErrors.includes(error.code)) continue
    if (error) throw error
    if (data) return
  }

  for (const key of profileKeys) {
    const identity = getProfileKeyValue(key, user)
    const { error } = await supabase
      .from(table)
      .insert({ [key]: identity })

    if (!error) return
    if (!profileKeyErrors.includes(error.code)) throw error
  }

  throw new Error(`${table} must contain ${role}_id, user_id, id, or email as its user identity column.`)
=======
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
>>>>>>> poli
}