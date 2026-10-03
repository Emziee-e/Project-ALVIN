import { supabase } from './supabaseClient'

// ======================================================
// GET CURRENT USER
// ======================================================

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  if (!user) {
    throw new Error('You must be signed in.')
  }

  return user
}

// ======================================================
// CREATE COURSE
// ======================================================

export async function createCourse(values) {
  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from('course_info')
    .insert({
        car_ad_id: user.id,
        course_title: values.course_title.trim(),
        course_code: values.course_code.trim(),
        section: values.section?.trim() || null,
        academic_term:
            values.academic_term?.trim() || null,
        course_status: 'active',
        course_color:
            values.course_color || 'bg-[#862334]',
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// ======================================================
// GET CAREER ADVISOR'S COURSES
// ======================================================

export async function getMyCourses() {
  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from('course_info')
    .select('*')
    .eq('car_ad_id', user.id)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    throw error
  }

  return data || []
}

// ======================================================
// GET ONE COURSE
// ======================================================

export async function getCourse(courseId) {
  if (!courseId) {
    throw new Error('Course ID is required.')
  }

  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from('course_info')
    .select('*')
    .eq('course_id', courseId)
    .eq('car_ad_id', user.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error(
      'Course not found or you do not have access to it.'
    )
  }

  return data
}

// ======================================================
// UPDATE COURSE
// ======================================================

export async function updateCourse(courseId, values) {
  if (!courseId) {
    throw new Error("Course ID is required.");
  }

  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("course_info")
    .update({
      course_title: values.course_title.trim(),
      course_code: values.course_code.trim(),
      section: values.section?.trim() || null,
      academic_term: values.academic_term?.trim() || null,
      course_status: values.course_status || "active",
      course_color: values.course_color || "bg-[#862334]",
    })
    .eq("course_id", courseId)
    .eq("car_ad_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ======================================================
// DELETE COURSE
// ======================================================

export async function deleteCourse(courseId) {
  const user = await getCurrentUser()

  const { error } = await supabase
    .from('course_info')
    .delete()
    .eq('course_id', courseId)
    .eq('car_ad_id', user.id)

  if (error) {
    throw error
  }
}

// ======================================================
// GET AVAILABLE ACTIVE STUDENTS
// ======================================================

export async function getAvailableStudents() {
  const { data, error } = await supabase
    .from('student_profile')
    .select(`
      student_id,
      display_name,
      ub_mail,
      account_status
    `)
    .eq('account_status', 'active')
    .order('display_name', {
      ascending: true,
    })

  if (error) {
    throw error
  }

  return data || []
}

// ======================================================
// ENROLL STUDENTS
// ======================================================

export async function enrollStudents(
  courseId,
  students
) {
  if (!courseId) {
    throw new Error('Course ID is required.')
  }

  if (!Array.isArray(students) || students.length === 0) {
    return []
  }

  const rows = students.map((student) => ({
    course_id: courseId,
    student_id: student.student_id,
    enrollment_status: 'enrolled',
  }))

  const { data, error } = await supabase
    .from('course_enrollments')
    .insert(rows)
    .select()

  if (error) {
    // PostgreSQL unique violation
    if (error.code === '23505') {
      throw new Error(
        'One or more selected students are already enrolled in this course.'
      )
    }

    throw error
  }

  return data || []
}

// ======================================================
// GET COURSE ENROLLMENTS
// ======================================================

export async function getCourseEnrollments(
  courseId
) {
  if (!courseId) {
    throw new Error('Course ID is required.')
  }

  const { data, error } = await supabase
    .from('course_enrollments')
    .select(`
      enrollment_id,
      enrollment_status,
      enrolled_at,

      student_profile (
        student_id,
        display_name,
        ub_mail,
        account_status
      )
    `)
    .eq('course_id', courseId)
    .order('enrolled_at', {
      ascending: false,
    })

  if (error) {
    throw error
  }

  return data || []
}

// ======================================================
// CHANGE ENROLLMENT STATUS
// ======================================================

export async function updateEnrollmentStatus(
  enrollmentId,
  status
) {
  const allowedStatuses = [
    'enrolled',
    'completed',
    'dropped',
  ]

  if (!allowedStatuses.includes(status)) {
    throw new Error(
      'Invalid enrollment status.'
    )
  }

  const { data, error } = await supabase
    .from('course_enrollments')
    .update({
      enrollment_status: status,
    })
    .eq('enrollment_id', enrollmentId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

// ======================================================
// REMOVE STUDENT FROM COURSE
// ======================================================

export async function removeEnrollment(
  enrollmentId
) {
  if (!enrollmentId) {
    throw new Error(
      'Enrollment ID is required.'
    )
  }

  const { error } = await supabase
    .from('course_enrollments')
    .delete()
    .eq('enrollment_id', enrollmentId)

  if (error) {
    throw error
  }
}

export async function findStudentByEmail(email) {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error("Please enter the student's UB email.");
  }

  const { data, error } = await supabase
    .from("student_profile")
    .select(`
      student_id,
      display_name,
      ub_mail,
      account_status
    `)
    .ilike("ub_mail", cleanEmail)
    .eq("account_status", "active")
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error(
      "No active student account was found with this UB email."
    );
  }

  return data;
}