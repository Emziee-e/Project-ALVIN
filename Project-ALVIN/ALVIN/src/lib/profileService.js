import { supabase } from './supabaseClient'

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
      }
    }
  }

  return null
}

export async function saveStudentProfile(user, values) {
  if (!user?.id) throw new Error('A signed-in user is required to save a student profile.')

  const profileValues = {
    program_course: values.program_course,
    year_level: values.year_level,
  }

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
}