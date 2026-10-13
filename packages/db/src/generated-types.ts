export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      AcademicSession: {
        Row: {
          end_date: string
          name: string
          school_id: string
          session_id: string
          start_date: string
        }
        Insert: {
          end_date: string
          name: string
          school_id: string
          session_id?: string
          start_date: string
        }
        Update: {
          end_date?: string
          name?: string
          school_id?: string
          session_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "AcademicSession_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
        ]
      }
      ActivationCode: {
        Row: {
          activation_code_id: string
          code: string
          created_at: string
          expires_at: string
          revoked_at: string | null
          school_id: string
          target_entity: string
          target_id: string
          used_at: string | null
        }
        Insert: {
          activation_code_id?: string
          code: string
          created_at?: string
          expires_at: string
          revoked_at?: string | null
          school_id: string
          target_entity: string
          target_id: string
          used_at?: string | null
        }
        Update: {
          activation_code_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          revoked_at?: string | null
          school_id?: string
          target_entity?: string
          target_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ActivationCode_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
        ]
      }
      Assessment: {
        Row: {
          assessment_id: string
          class_id: string
          name: string
          school_id: string
          subject_id: string
          term_id: string
        }
        Insert: {
          assessment_id?: string
          class_id: string
          name: string
          school_id: string
          subject_id: string
          term_id: string
        }
        Update: {
          assessment_id?: string
          class_id?: string
          name?: string
          school_id?: string
          subject_id?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Assessment_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "Assessment_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "Assessment_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "Subject"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "Assessment_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "Term"
            referencedColumns: ["term_id"]
          },
        ]
      }
      Assignment: {
        Row: {
          assignment_id: string
          available_at: string
          class_id: string
          created_at: string
          due_at: string | null
          instructions: string | null
          school_id: string
          status: string
          subject_id: string
          teacher_id: string
          title: string
        }
        Insert: {
          assignment_id?: string
          available_at: string
          class_id: string
          created_at?: string
          due_at?: string | null
          instructions?: string | null
          school_id: string
          status?: string
          subject_id: string
          teacher_id: string
          title: string
        }
        Update: {
          assignment_id?: string
          available_at?: string
          class_id?: string
          created_at?: string
          due_at?: string | null
          instructions?: string | null
          school_id?: string
          status?: string
          subject_id?: string
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "Assignment_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "Assignment_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "Assignment_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "Subject"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "Assignment_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "Teacher"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      AssignmentAttachment: {
        Row: {
          assignment_id: string
          attachment_id: string
          file_size_bytes: number
          file_type: string
          original_filename: string
          school_id: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          assignment_id: string
          attachment_id?: string
          file_size_bytes: number
          file_type: string
          original_filename: string
          school_id: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          assignment_id?: string
          attachment_id?: string
          file_size_bytes?: number
          file_type?: string
          original_filename?: string
          school_id?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "AssignmentAttachment_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "Assignment"
            referencedColumns: ["assignment_id"]
          },
          {
            foreignKeyName: "AssignmentAttachment_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
        ]
      }
      Attendance: {
        Row: {
          attendance_id: string
          class_id: string
          date: string
          editable_until: string | null
          enrollment_id: string
          school_id: string
          status: string
          subject_id: string | null
          teacher_id: string
        }
        Insert: {
          attendance_id?: string
          class_id: string
          date: string
          editable_until?: string | null
          enrollment_id: string
          school_id: string
          status: string
          subject_id?: string | null
          teacher_id: string
        }
        Update: {
          attendance_id?: string
          class_id?: string
          date?: string
          editable_until?: string | null
          enrollment_id?: string
          school_id?: string
          status?: string
          subject_id?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "Attendance_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "SchoolEnrollment"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "Attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "Attendance_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "Subject"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "Attendance_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "Teacher"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      AuditLog: {
        Row: {
          action_type: string
          actor_id: string | null
          actor_role: string
          details: Json | null
          log_id: string
          school_id: string
          target_entity: string
          target_id: string | null
          timestamp: string
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          actor_role: string
          details?: Json | null
          log_id?: string
          school_id: string
          target_entity: string
          target_id?: string | null
          timestamp?: string
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          actor_role?: string
          details?: Json | null
          log_id?: string
          school_id?: string
          target_entity?: string
          target_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "AuditLog_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
        ]
      }
      Class: {
        Row: {
          class_id: string
          name: string
          school_id: string
        }
        Insert: {
          class_id?: string
          name: string
          school_id: string
        }
        Update: {
          class_id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Class_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
        ]
      }
      ClassMembership: {
        Row: {
          academic_session_id: string
          class_id: string
          end_date: string | null
          enrollment_id: string
          membership_id: string
          start_date: string
        }
        Insert: {
          academic_session_id: string
          class_id: string
          end_date?: string | null
          enrollment_id: string
          membership_id?: string
          start_date: string
        }
        Update: {
          academic_session_id?: string
          class_id?: string
          end_date?: string | null
          enrollment_id?: string
          membership_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "ClassMembership_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "AcademicSession"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "ClassMembership_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "ClassMembership_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "SchoolEnrollment"
            referencedColumns: ["enrollment_id"]
          },
        ]
      }
      DailyNote: {
        Row: {
          category: string
          created_at: string
          date: string
          enrollment_id: string
          note_id: string
          note_text: string
          teacher_id: string
        }
        Insert: {
          category: string
          created_at?: string
          date?: string
          enrollment_id: string
          note_id?: string
          note_text: string
          teacher_id: string
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          enrollment_id?: string
          note_id?: string
          note_text?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "DailyNote_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "SchoolEnrollment"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "DailyNote_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "Teacher"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      FamilyMembership: {
        Row: {
          created_at: string
          membership_id: string
          person_id: string
          school_id: string
          status: string
        }
        Insert: {
          created_at?: string
          membership_id?: string
          person_id: string
          school_id: string
          status?: string
        }
        Update: {
          created_at?: string
          membership_id?: string
          person_id?: string
          school_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "FamilyMembership_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "Person"
            referencedColumns: ["person_id"]
          },
          {
            foreignKeyName: "FamilyMembership_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
        ]
      }
      FamilyStudentRelationship: {
        Row: {
          membership_id: string
          platform_student_id: string
          relationship_id: string
          relationship_type: string
        }
        Insert: {
          membership_id: string
          platform_student_id: string
          relationship_id?: string
          relationship_type: string
        }
        Update: {
          membership_id?: string
          platform_student_id?: string
          relationship_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "FamilyStudentRelationship_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "FamilyMembership"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "FamilyStudentRelationship_platform_student_id_fkey"
            columns: ["platform_student_id"]
            isOneToOne: false
            referencedRelation: "PlatformStudent"
            referencedColumns: ["platform_student_id"]
          },
        ]
      }
      FeeRecord: {
        Row: {
          amount_expected: number
          amount_paid: number
          enrollment_id: string
          fee_record_id: string
          last_updated_at: string
          last_updated_by: string | null
          payment_method: string | null
          status: string
          term_id: string
          version: number
        }
        Insert: {
          amount_expected?: number
          amount_paid?: number
          enrollment_id: string
          fee_record_id?: string
          last_updated_at?: string
          last_updated_by?: string | null
          payment_method?: string | null
          status?: string
          term_id: string
          version?: number
        }
        Update: {
          amount_expected?: number
          amount_paid?: number
          enrollment_id?: string
          fee_record_id?: string
          last_updated_at?: string
          last_updated_by?: string | null
          payment_method?: string | null
          status?: string
          term_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "FeeRecord_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "SchoolEnrollment"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "FeeRecord_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "SchoolAdmin"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "FeeRecord_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "Term"
            referencedColumns: ["term_id"]
          },
        ]
      }
      Guardian: {
        Row: {
          contact_info: string | null
          guardian_id: string
          membership_id: string
          name: string
          relationship: string | null
        }
        Insert: {
          contact_info?: string | null
          guardian_id?: string
          membership_id: string
          name: string
          relationship?: string | null
        }
        Update: {
          contact_info?: string | null
          guardian_id?: string
          membership_id?: string
          name?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Guardian_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "FamilyMembership"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      Job: {
        Row: {
          attempts: number
          created_at: string
          job_id: string
          job_type: string
          last_error: string | null
          max_attempts: number
          payload: Json
          related_entity_id: string | null
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          job_id?: string
          job_type: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          related_entity_id?: string | null
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          job_id?: string
          job_type?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          related_entity_id?: string | null
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Job_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
        ]
      }
      JobRecipientStatus: {
        Row: {
          id: string
          job_id: string
          recipient_membership_id: string
          status: string
        }
        Insert: {
          id?: string
          job_id: string
          recipient_membership_id: string
          status?: string
        }
        Update: {
          id?: string
          job_id?: string
          recipient_membership_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "JobRecipientStatus_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "Job"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "JobRecipientStatus_recipient_membership_id_fkey"
            columns: ["recipient_membership_id"]
            isOneToOne: false
            referencedRelation: "FamilyMembership"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      Notification: {
        Row: {
          category: string
          created_at: string
          membership_id: string
          message_text: string
          notification_id: string
          read_status: boolean
          related_entity_id: string | null
          source_type: string
        }
        Insert: {
          category: string
          created_at?: string
          membership_id: string
          message_text: string
          notification_id?: string
          read_status?: boolean
          related_entity_id?: string | null
          source_type: string
        }
        Update: {
          category?: string
          created_at?: string
          membership_id?: string
          message_text?: string
          notification_id?: string
          read_status?: boolean
          related_entity_id?: string | null
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "Notification_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "FamilyMembership"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      Person: {
        Row: {
          activation_status: string
          auth_user_id: string | null
          contact_info: string | null
          created_at: string
          name: string
          person_id: string
        }
        Insert: {
          activation_status?: string
          auth_user_id?: string | null
          contact_info?: string | null
          created_at?: string
          name: string
          person_id?: string
        }
        Update: {
          activation_status?: string
          auth_user_id?: string | null
          contact_info?: string | null
          created_at?: string
          name?: string
          person_id?: string
        }
        Relationships: []
      }
      PlatformAdmin: {
        Row: {
          auth_user_id: string | null
          contact_info: string | null
          created_at: string
          name: string
          platform_admin_id: string
        }
        Insert: {
          auth_user_id?: string | null
          contact_info?: string | null
          created_at?: string
          name: string
          platform_admin_id?: string
        }
        Update: {
          auth_user_id?: string | null
          contact_info?: string | null
          created_at?: string
          name?: string
          platform_admin_id?: string
        }
        Relationships: []
      }
      PlatformStudent: {
        Row: {
          created_at: string
          dob: string
          name: string
          platform_student_id: string
          profile_photo: string | null
        }
        Insert: {
          created_at?: string
          dob: string
          name: string
          platform_student_id?: string
          profile_photo?: string | null
        }
        Update: {
          created_at?: string
          dob?: string
          name?: string
          platform_student_id?: string
          profile_photo?: string | null
        }
        Relationships: []
      }
      School: {
        Row: {
          address: string | null
          contact_info: string | null
          country: string
          created_at: string
          currency: string
          name: string
          school_id: string
          timezone: string
          type: string | null
        }
        Insert: {
          address?: string | null
          contact_info?: string | null
          country: string
          created_at?: string
          currency?: string
          name: string
          school_id?: string
          timezone?: string
          type?: string | null
        }
        Update: {
          address?: string | null
          contact_info?: string | null
          country?: string
          created_at?: string
          currency?: string
          name?: string
          school_id?: string
          timezone?: string
          type?: string | null
        }
        Relationships: []
      }
      SchoolAdmin: {
        Row: {
          activation_status: string
          admin_id: string
          auth_user_id: string | null
          contact_info: string | null
          created_at: string
          last_active: string | null
          name: string
          school_id: string
        }
        Insert: {
          activation_status?: string
          admin_id?: string
          auth_user_id?: string | null
          contact_info?: string | null
          created_at?: string
          last_active?: string | null
          name: string
          school_id: string
        }
        Update: {
          activation_status?: string
          admin_id?: string
          auth_user_id?: string | null
          contact_info?: string | null
          created_at?: string
          last_active?: string | null
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "SchoolAdmin_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
        ]
      }
      SchoolEnrollment: {
        Row: {
          end_date: string | null
          enrollment_id: string
          platform_student_id: string
          school_id: string
          school_student_id: string | null
          start_date: string
          status: string
        }
        Insert: {
          end_date?: string | null
          enrollment_id?: string
          platform_student_id: string
          school_id: string
          school_student_id?: string | null
          start_date: string
          status: string
        }
        Update: {
          end_date?: string | null
          enrollment_id?: string
          platform_student_id?: string
          school_id?: string
          school_student_id?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "SchoolEnrollment_platform_student_id_fkey"
            columns: ["platform_student_id"]
            isOneToOne: false
            referencedRelation: "PlatformStudent"
            referencedColumns: ["platform_student_id"]
          },
          {
            foreignKeyName: "SchoolEnrollment_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
        ]
      }
      Score: {
        Row: {
          assessment_id: string
          enrollment_id: string
          entered_at: string
          entered_by: string
          score_id: string
          value: number
        }
        Insert: {
          assessment_id: string
          enrollment_id: string
          entered_at?: string
          entered_by: string
          score_id?: string
          value: number
        }
        Update: {
          assessment_id?: string
          enrollment_id?: string
          entered_at?: string
          entered_by?: string
          score_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "Score_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "Assessment"
            referencedColumns: ["assessment_id"]
          },
          {
            foreignKeyName: "Score_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "SchoolEnrollment"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "Score_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "Teacher"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      StudentAssignmentStatus: {
        Row: {
          assignment_id: string
          enrollment_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          enrollment_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          enrollment_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "StudentAssignmentStatus_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "Assignment"
            referencedColumns: ["assignment_id"]
          },
          {
            foreignKeyName: "StudentAssignmentStatus_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "SchoolEnrollment"
            referencedColumns: ["enrollment_id"]
          },
        ]
      }
      Subject: {
        Row: {
          name: string
          school_id: string
          subject_id: string
        }
        Insert: {
          name: string
          school_id: string
          subject_id?: string
        }
        Update: {
          name?: string
          school_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Subject_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
        ]
      }
      Subscription: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          gateway_customer_ref: string | null
          gateway_provider: string | null
          grace_period_started_at: string | null
          next_charge_at: string | null
          school_id: string
          status: string
          subscription_id: string
          tier: string
          trial_ends_at: string
          trial_started_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          gateway_customer_ref?: string | null
          gateway_provider?: string | null
          grace_period_started_at?: string | null
          next_charge_at?: string | null
          school_id: string
          status: string
          subscription_id?: string
          tier: string
          trial_ends_at: string
          trial_started_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          gateway_customer_ref?: string | null
          gateway_provider?: string | null
          grace_period_started_at?: string | null
          next_charge_at?: string | null
          school_id?: string
          status?: string
          subscription_id?: string
          tier?: string
          trial_ends_at?: string
          trial_started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Subscription_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
        ]
      }
      Teacher: {
        Row: {
          activation_status: string
          auth_user_id: string | null
          contact_info: string | null
          created_at: string
          date_joined: string | null
          employment_status: string | null
          name: string
          profile_photo: string | null
          school_id: string
          staff_id: string | null
          teacher_id: string
        }
        Insert: {
          activation_status?: string
          auth_user_id?: string | null
          contact_info?: string | null
          created_at?: string
          date_joined?: string | null
          employment_status?: string | null
          name: string
          profile_photo?: string | null
          school_id: string
          staff_id?: string | null
          teacher_id?: string
        }
        Update: {
          activation_status?: string
          auth_user_id?: string | null
          contact_info?: string | null
          created_at?: string
          date_joined?: string | null
          employment_status?: string | null
          name?: string
          profile_photo?: string | null
          school_id?: string
          staff_id?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Teacher_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
        ]
      }
      TeacherClassAssignment: {
        Row: {
          assignment_id: string
          class_id: string
          session_id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          assignment_id?: string
          class_id: string
          session_id: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          assignment_id?: string
          class_id?: string
          session_id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "TeacherClassAssignment_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "Class"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "TeacherClassAssignment_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "AcademicSession"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "TeacherClassAssignment_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "Subject"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "TeacherClassAssignment_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "Teacher"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      Term: {
        Row: {
          end_date: string
          name: string
          session_id: string
          start_date: string
          term_id: string
        }
        Insert: {
          end_date: string
          name: string
          session_id: string
          start_date: string
          term_id?: string
        }
        Update: {
          end_date?: string
          name?: string
          session_id?: string
          start_date?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Term_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "AcademicSession"
            referencedColumns: ["session_id"]
          },
        ]
      }
      TransferPackage: {
        Row: {
          created_at: string
          included_records: Json
          package_id: string
          request_id: string
        }
        Insert: {
          created_at?: string
          included_records?: Json
          package_id?: string
          request_id: string
        }
        Update: {
          created_at?: string
          included_records?: Json
          package_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "TransferPackage_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "TransferRequest"
            referencedColumns: ["request_id"]
          },
        ]
      }
      TransferRequest: {
        Row: {
          approved_by: string | null
          created_at: string
          from_school_id: string
          platform_student_id: string
          request_id: string
          requested_by: string
          resolved_at: string | null
          status: string
          to_school_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          from_school_id: string
          platform_student_id: string
          request_id?: string
          requested_by: string
          resolved_at?: string | null
          status?: string
          to_school_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          from_school_id?: string
          platform_student_id?: string
          request_id?: string
          requested_by?: string
          resolved_at?: string | null
          status?: string
          to_school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "TransferRequest_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "SchoolAdmin"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "TransferRequest_from_school_id_fkey"
            columns: ["from_school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "TransferRequest_platform_student_id_fkey"
            columns: ["platform_student_id"]
            isOneToOne: false
            referencedRelation: "PlatformStudent"
            referencedColumns: ["platform_student_id"]
          },
          {
            foreignKeyName: "TransferRequest_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "SchoolAdmin"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "TransferRequest_to_school_id_fkey"
            columns: ["to_school_id"]
            isOneToOne: false
            referencedRelation: "School"
            referencedColumns: ["school_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_teacher: {
        Args: { p_contact_info?: string; p_name: string; p_staff_id?: string }
        Returns: Json
      }
      admin_create_family_person: {
        Args: { p_contact_info?: string; p_name: string }
        Returns: Json
      }
      admin_generate_activation_code: {
        Args: { p_target_entity: string; p_target_id: string }
        Returns: string
      }
      assignment_atomicity_probe: {
        Args: {
          p_class_id: string
          p_school_id: string
          p_should_fail: boolean
          p_subject_id: string
          p_teacher_id: string
          p_title: string
        }
        Returns: string
      }
      auth_admin_id: { Args: never; Returns: string }
      auth_app_role: { Args: never; Returns: string }
      auth_membership_id: { Args: never; Returns: string }
      auth_person_id: { Args: never; Returns: string }
      auth_platform_admin_id: { Args: never; Returns: string }
      auth_school_id: { Args: never; Returns: string }
      auth_teacher_id: { Args: never; Returns: string }
      consume_activation_code: {
        Args: { p_auth_user_id: string; p_code: string }
        Returns: Json
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      family_has_score_for_assessment: {
        Args: { p_assessment_id: string }
        Returns: boolean
      }
      find_platform_student_candidates: {
        Args: { p_dob: string; p_guardian_contacts?: string[]; p_name: string }
        Returns: {
          confidence: string
          dob: string
          name: string
          platform_student_id: string
        }[]
      }
      generate_platform_student_id: { Args: never; Returns: string }
      is_platform_admin: { Args: never; Returns: boolean }
      register_school: {
        Args: {
          p_admin_contact?: string
          p_admin_name: string
          p_country: string
          p_currency?: string
          p_school_name: string
          p_timezone?: string
        }
        Returns: string
      }
      resolve_or_create_platform_student: {
        Args: {
          p_decision: string
          p_dob: string
          p_matched_platform_student_id?: string
          p_name: string
        }
        Returns: string
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      teacher_assigned_to_enrollment_class: {
        Args: { p_enrollment_id: string }
        Returns: boolean
      }
      validate_activation_code: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
