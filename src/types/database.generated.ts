// Generated from migrated PostgreSQL using scripts/db-types-embedded.mjs. Do not edit.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type Database = { public: { Tables: {
"appointment_services": {
Row: {
"id": string;
"organization_id": string;
"appointment_id": string;
"service_id": string;
"position": number;
"name_snapshot": string;
"price_php": number;
"duration_minutes": number;
"buffer_minutes": number;
"commission_type": string;
"commission_value": number;
};
Insert: {
"id"?: string;
"organization_id": string;
"appointment_id": string;
"service_id": string;
"position": number;
"name_snapshot": string;
"price_php": number;
"duration_minutes": number;
"buffer_minutes": number;
"commission_type": string;
"commission_value": number;
};
Update: {
"id"?: string;
"organization_id"?: string;
"appointment_id"?: string;
"service_id"?: string;
"position"?: number;
"name_snapshot"?: string;
"price_php"?: number;
"duration_minutes"?: number;
"buffer_minutes"?: number;
"commission_type"?: string;
"commission_value"?: number;
};
Relationships: [{foreignKeyName:"appointment_services_organization_id_appointment_id_fkey";columns:["organization_id","appointment_id"];isOneToOne:false;referencedRelation:"appointments";referencedColumns:["organization_id","id"]},{foreignKeyName:"appointment_services_organization_id_service_id_fkey";columns:["organization_id","service_id"];isOneToOne:false;referencedRelation:"services";referencedColumns:["organization_id","id"]}];
};
"appointments": {
Row: {
"id": string;
"organization_id": string;
"staff_id": string;
"customer_id": string | null;
"walk_in_name": string;
"start_at": string;
"end_at": string;
"status": string;
"notes": string;
"created_by": string;
"updated_by": string;
"created_at": string;
"updated_at": string;
};
Insert: {
"id"?: string;
"organization_id": string;
"staff_id": string;
"customer_id"?: string | null;
"walk_in_name"?: string;
"start_at": string;
"end_at": string;
"status"?: string;
"notes"?: string;
"created_by": string;
"updated_by": string;
"created_at"?: string;
"updated_at"?: string;
};
Update: {
"id"?: string;
"organization_id"?: string;
"staff_id"?: string;
"customer_id"?: string | null;
"walk_in_name"?: string;
"start_at"?: string;
"end_at"?: string;
"status"?: string;
"notes"?: string;
"created_by"?: string;
"updated_by"?: string;
"created_at"?: string;
"updated_at"?: string;
};
Relationships: [{foreignKeyName:"appointments_organization_id_fkey";columns:["organization_id"];isOneToOne:false;referencedRelation:"organizations";referencedColumns:["id"]},{foreignKeyName:"appointments_created_by_fkey";columns:["created_by"];isOneToOne:false;referencedRelation:"users";referencedColumns:["id"]},{foreignKeyName:"appointments_updated_by_fkey";columns:["updated_by"];isOneToOne:false;referencedRelation:"users";referencedColumns:["id"]},{foreignKeyName:"appointments_organization_id_staff_id_fkey";columns:["organization_id","staff_id"];isOneToOne:false;referencedRelation:"staff_profiles";referencedColumns:["organization_id","id"]},{foreignKeyName:"appointments_organization_id_customer_id_fkey";columns:["organization_id","customer_id"];isOneToOne:false;referencedRelation:"customers";referencedColumns:["organization_id","id"]}];
};
"attendance_entries": {
Row: {
"id": string;
"organization_id": string;
"staff_id": string;
"clock_in_at": string;
"clock_out_at": string | null;
"break_minutes": number;
"status": string;
"correction_reason": string | null;
"approved_by": string | null;
"approved_at": string | null;
};
Insert: {
"id"?: string;
"organization_id": string;
"staff_id": string;
"clock_in_at"?: string;
"clock_out_at"?: string | null;
"break_minutes"?: number;
"status"?: string;
"correction_reason"?: string | null;
"approved_by"?: string | null;
"approved_at"?: string | null;
};
Update: {
"id"?: string;
"organization_id"?: string;
"staff_id"?: string;
"clock_in_at"?: string;
"clock_out_at"?: string | null;
"break_minutes"?: number;
"status"?: string;
"correction_reason"?: string | null;
"approved_by"?: string | null;
"approved_at"?: string | null;
};
Relationships: [{foreignKeyName:"attendance_entries_approved_by_fkey";columns:["approved_by"];isOneToOne:false;referencedRelation:"users";referencedColumns:["id"]},{foreignKeyName:"attendance_entries_organization_id_staff_id_fkey";columns:["organization_id","staff_id"];isOneToOne:false;referencedRelation:"staff_profiles";referencedColumns:["organization_id","id"]}];
};
"audit_events": {
Row: {
"id": number;
"actor_user_id": string | null;
"action": string;
"entity_type": string;
"entity_id": string | null;
"organization_id": string | null;
"old_data": Json | null;
"new_data": Json | null;
"occurred_at": string;
};
Insert: {
"id"?: never;
"actor_user_id"?: string | null;
"action": string;
"entity_type": string;
"entity_id"?: string | null;
"organization_id"?: string | null;
"old_data"?: Json | null;
"new_data"?: Json | null;
"occurred_at"?: string;
};
Update: {
"id"?: never;
"actor_user_id"?: string | null;
"action"?: string;
"entity_type"?: string;
"entity_id"?: string | null;
"organization_id"?: string | null;
"old_data"?: Json | null;
"new_data"?: Json | null;
"occurred_at"?: string;
};
Relationships: [{foreignKeyName:"audit_events_actor_user_id_fkey";columns:["actor_user_id"];isOneToOne:false;referencedRelation:"users";referencedColumns:["id"]}];
};
"commission_earnings": {
Row: {
"id": string;
"organization_id": string;
"appointment_service_id": string;
"staff_id": string;
"earned_at": string;
"amount_php": number;
"rule_snapshot": Json;
};
Insert: {
"id"?: string;
"organization_id": string;
"appointment_service_id": string;
"staff_id": string;
"earned_at"?: string;
"amount_php": number;
"rule_snapshot": Json;
};
Update: {
"id"?: string;
"organization_id"?: string;
"appointment_service_id"?: string;
"staff_id"?: string;
"earned_at"?: string;
"amount_php"?: number;
"rule_snapshot"?: Json;
};
Relationships: [{foreignKeyName:"commission_earnings_organization_id_appointment_service_id_fkey";columns:["organization_id","appointment_service_id"];isOneToOne:false;referencedRelation:"appointment_services";referencedColumns:["organization_id","id"]},{foreignKeyName:"commission_earnings_organization_id_staff_id_fkey";columns:["organization_id","staff_id"];isOneToOne:false;referencedRelation:"staff_profiles";referencedColumns:["organization_id","id"]}];
};
"customers": {
Row: {
"id": string;
"organization_id": string;
"name": string;
"email": string | null;
"phone": string | null;
"status": "lead" | "active" | "inactive";
"notes": string | null;
"created_by": string;
"updated_by": string;
"created_at": string;
"updated_at": string;
};
Insert: {
"id"?: string;
"organization_id": string;
"name": string;
"email"?: string | null;
"phone"?: string | null;
"status"?: "lead" | "active" | "inactive";
"notes"?: string | null;
"created_by"?: string;
"updated_by"?: string;
"created_at"?: string;
"updated_at"?: string;
};
Update: {
"id"?: string;
"organization_id"?: string;
"name"?: string;
"email"?: string | null;
"phone"?: string | null;
"status"?: "lead" | "active" | "inactive";
"notes"?: string | null;
"created_by"?: string;
"updated_by"?: string;
"created_at"?: string;
"updated_at"?: string;
};
Relationships: [{foreignKeyName:"customers_organization_id_fkey";columns:["organization_id"];isOneToOne:false;referencedRelation:"organizations";referencedColumns:["id"]},{foreignKeyName:"customers_created_by_fkey";columns:["created_by"];isOneToOne:false;referencedRelation:"users";referencedColumns:["id"]},{foreignKeyName:"customers_updated_by_fkey";columns:["updated_by"];isOneToOne:false;referencedRelation:"users";referencedColumns:["id"]}];
};
"file_records": {
Row: {
"id": string;
"organization_id": string | null;
"bucket_id": string;
"object_path": string;
"original_name": string;
"mime_type": string;
"size_bytes": number;
"uploaded_by": string;
"created_at": string;
};
Insert: {
"id"?: string;
"organization_id"?: string | null;
"bucket_id"?: string;
"object_path": string;
"original_name": string;
"mime_type": string;
"size_bytes": number;
"uploaded_by"?: string;
"created_at"?: string;
};
Update: {
"id"?: string;
"organization_id"?: string | null;
"bucket_id"?: string;
"object_path"?: string;
"original_name"?: string;
"mime_type"?: string;
"size_bytes"?: number;
"uploaded_by"?: string;
"created_at"?: string;
};
Relationships: [{foreignKeyName:"file_records_organization_id_fkey";columns:["organization_id"];isOneToOne:false;referencedRelation:"organizations";referencedColumns:["id"]},{foreignKeyName:"file_records_uploaded_by_fkey";columns:["uploaded_by"];isOneToOne:false;referencedRelation:"users";referencedColumns:["id"]}];
};
"organization_memberships": {
Row: {
"organization_id": string;
"user_id": string;
"role": "admin" | "manager" | "staff";
"created_at": string;
"updated_at": string;
};
Insert: {
"organization_id": string;
"user_id": string;
"role"?: "admin" | "manager" | "staff";
"created_at"?: string;
"updated_at"?: string;
};
Update: {
"organization_id"?: string;
"user_id"?: string;
"role"?: "admin" | "manager" | "staff";
"created_at"?: string;
"updated_at"?: string;
};
Relationships: [{foreignKeyName:"organization_memberships_organization_id_fkey";columns:["organization_id"];isOneToOne:false;referencedRelation:"organizations";referencedColumns:["id"]},{foreignKeyName:"organization_memberships_user_id_fkey";columns:["user_id"];isOneToOne:false;referencedRelation:"users";referencedColumns:["id"]}];
};
"organizations": {
Row: {
"id": string;
"name": string;
"slug": string;
"created_by": string | null;
"created_at": string;
"updated_at": string;
};
Insert: {
"id"?: string;
"name": string;
"slug": string;
"created_by"?: string | null;
"created_at"?: string;
"updated_at"?: string;
};
Update: {
"id"?: string;
"name"?: string;
"slug"?: string;
"created_by"?: string | null;
"created_at"?: string;
"updated_at"?: string;
};
Relationships: [{foreignKeyName:"organizations_created_by_fkey";columns:["created_by"];isOneToOne:false;referencedRelation:"users";referencedColumns:["id"]}];
};
"payroll_items": {
Row: {
"id": string;
"organization_id": string;
"payroll_period_id": string;
"staff_id": string;
"employee_name": string;
"basis_snapshot": Json;
"approved_minutes": number;
"approved_days": number;
"base_php": number;
"commissions_php": number;
"additions_php": number;
"deductions_php": number;
"net_php": number;
};
Insert: {
"id"?: string;
"organization_id": string;
"payroll_period_id": string;
"staff_id": string;
"employee_name": string;
"basis_snapshot": Json;
"approved_minutes": number;
"approved_days": number;
"base_php": number;
"commissions_php": number;
"additions_php"?: number;
"deductions_php"?: number;
"net_php": number;
};
Update: {
"id"?: string;
"organization_id"?: string;
"payroll_period_id"?: string;
"staff_id"?: string;
"employee_name"?: string;
"basis_snapshot"?: Json;
"approved_minutes"?: number;
"approved_days"?: number;
"base_php"?: number;
"commissions_php"?: number;
"additions_php"?: number;
"deductions_php"?: number;
"net_php"?: number;
};
Relationships: [{foreignKeyName:"payroll_items_organization_id_payroll_period_id_fkey";columns:["organization_id","payroll_period_id"];isOneToOne:false;referencedRelation:"payroll_periods";referencedColumns:["organization_id","id"]},{foreignKeyName:"payroll_items_organization_id_staff_id_fkey";columns:["organization_id","staff_id"];isOneToOne:false;referencedRelation:"staff_profiles";referencedColumns:["organization_id","id"]}];
};
"payroll_line_items": {
Row: {
"id": string;
"organization_id": string;
"payroll_item_id": string;
"kind": string;
"description": string;
"amount_php": number;
"attendance_id": string | null;
"commission_id": string | null;
};
Insert: {
"id"?: string;
"organization_id": string;
"payroll_item_id": string;
"kind": string;
"description": string;
"amount_php": number;
"attendance_id"?: string | null;
"commission_id"?: string | null;
};
Update: {
"id"?: string;
"organization_id"?: string;
"payroll_item_id"?: string;
"kind"?: string;
"description"?: string;
"amount_php"?: number;
"attendance_id"?: string | null;
"commission_id"?: string | null;
};
Relationships: [{foreignKeyName:"payroll_line_items_organization_id_payroll_item_id_fkey";columns:["organization_id","payroll_item_id"];isOneToOne:false;referencedRelation:"payroll_items";referencedColumns:["organization_id","id"]},{foreignKeyName:"payroll_line_items_organization_id_attendance_id_fkey";columns:["organization_id","attendance_id"];isOneToOne:false;referencedRelation:"attendance_entries";referencedColumns:["organization_id","id"]},{foreignKeyName:"payroll_line_items_organization_id_commission_id_fkey";columns:["organization_id","commission_id"];isOneToOne:false;referencedRelation:"commission_earnings";referencedColumns:["organization_id","id"]}];
};
"payroll_periods": {
Row: {
"id": string;
"organization_id": string;
"start_date": string;
"end_date": string;
"status": string;
"prepared_by": string;
"approved_by": string | null;
"approved_at": string | null;
"paid_by": string | null;
"paid_at": string | null;
"paid_reference": string | null;
};
Insert: {
"id"?: string;
"organization_id": string;
"start_date": string;
"end_date": string;
"status"?: string;
"prepared_by": string;
"approved_by"?: string | null;
"approved_at"?: string | null;
"paid_by"?: string | null;
"paid_at"?: string | null;
"paid_reference"?: string | null;
};
Update: {
"id"?: string;
"organization_id"?: string;
"start_date"?: string;
"end_date"?: string;
"status"?: string;
"prepared_by"?: string;
"approved_by"?: string | null;
"approved_at"?: string | null;
"paid_by"?: string | null;
"paid_at"?: string | null;
"paid_reference"?: string | null;
};
Relationships: [{foreignKeyName:"payroll_periods_organization_id_fkey";columns:["organization_id"];isOneToOne:false;referencedRelation:"organizations";referencedColumns:["id"]},{foreignKeyName:"payroll_periods_prepared_by_fkey";columns:["prepared_by"];isOneToOne:false;referencedRelation:"users";referencedColumns:["id"]},{foreignKeyName:"payroll_periods_approved_by_fkey";columns:["approved_by"];isOneToOne:false;referencedRelation:"users";referencedColumns:["id"]},{foreignKeyName:"payroll_periods_paid_by_fkey";columns:["paid_by"];isOneToOne:false;referencedRelation:"users";referencedColumns:["id"]}];
};
"profiles": {
Row: {
"id": string;
"full_name": string;
"role": "admin" | "manager" | "staff";
"avatar_path": string | null;
"created_at": string;
"updated_at": string;
};
Insert: {
"id": string;
"full_name": string;
"role"?: "admin" | "manager" | "staff";
"avatar_path"?: string | null;
"created_at"?: string;
"updated_at"?: string;
};
Update: {
"id"?: string;
"full_name"?: string;
"role"?: "admin" | "manager" | "staff";
"avatar_path"?: string | null;
"created_at"?: string;
"updated_at"?: string;
};
Relationships: [{foreignKeyName:"profiles_id_fkey";columns:["id"];isOneToOne:false;referencedRelation:"users";referencedColumns:["id"]}];
};
"salon_settings": {
Row: {
"organization_id": string;
"timezone": string;
"opening_hours": Json;
"closed_dates": (string)[];
"slot_minutes": number;
"payroll_frequency": string;
"monthly_divisor": number;
"updated_at": string;
};
Insert: {
"organization_id": string;
"timezone"?: string;
"opening_hours"?: Json;
"closed_dates"?: (string)[];
"slot_minutes"?: number;
"payroll_frequency"?: string;
"monthly_divisor"?: number;
"updated_at"?: string;
};
Update: {
"organization_id"?: string;
"timezone"?: string;
"opening_hours"?: Json;
"closed_dates"?: (string)[];
"slot_minutes"?: number;
"payroll_frequency"?: string;
"monthly_divisor"?: number;
"updated_at"?: string;
};
Relationships: [{foreignKeyName:"salon_settings_organization_id_fkey";columns:["organization_id"];isOneToOne:false;referencedRelation:"organizations";referencedColumns:["id"]}];
};
"service_commission_rules": {
Row: {
"organization_id": string;
"staff_id": string;
"service_id": string;
"commission_type": string;
"commission_value": number;
};
Insert: {
"organization_id": string;
"staff_id": string;
"service_id": string;
"commission_type": string;
"commission_value": number;
};
Update: {
"organization_id"?: string;
"staff_id"?: string;
"service_id"?: string;
"commission_type"?: string;
"commission_value"?: number;
};
Relationships: [{foreignKeyName:"service_commission_rules_organization_id_staff_id_fkey";columns:["organization_id","staff_id"];isOneToOne:false;referencedRelation:"staff_profiles";referencedColumns:["organization_id","id"]},{foreignKeyName:"service_commission_rules_organization_id_service_id_fkey";columns:["organization_id","service_id"];isOneToOne:false;referencedRelation:"services";referencedColumns:["organization_id","id"]}];
};
"services": {
Row: {
"id": string;
"organization_id": string;
"name": string;
"category": string;
"price_php": number;
"duration_minutes": number;
"buffer_minutes": number;
"active": boolean;
};
Insert: {
"id"?: string;
"organization_id": string;
"name": string;
"category": string;
"price_php": number;
"duration_minutes": number;
"buffer_minutes"?: number;
"active"?: boolean;
};
Update: {
"id"?: string;
"organization_id"?: string;
"name"?: string;
"category"?: string;
"price_php"?: number;
"duration_minutes"?: number;
"buffer_minutes"?: number;
"active"?: boolean;
};
Relationships: [{foreignKeyName:"services_organization_id_fkey";columns:["organization_id"];isOneToOne:false;referencedRelation:"organizations";referencedColumns:["id"]}];
};
"staff_compensation": {
Row: {
"staff_id": string;
"organization_id": string;
"pay_basis": string;
"rate_php": number;
"commission_type": string;
"commission_value": number;
"effective_from": string;
};
Insert: {
"staff_id": string;
"organization_id": string;
"pay_basis": string;
"rate_php": number;
"commission_type"?: string;
"commission_value"?: number;
"effective_from"?: string;
};
Update: {
"staff_id"?: string;
"organization_id"?: string;
"pay_basis"?: string;
"rate_php"?: number;
"commission_type"?: string;
"commission_value"?: number;
"effective_from"?: string;
};
Relationships: [{foreignKeyName:"staff_compensation_organization_id_staff_id_fkey";columns:["organization_id","staff_id"];isOneToOne:false;referencedRelation:"staff_profiles";referencedColumns:["organization_id","id"]}];
};
"staff_profiles": {
Row: {
"id": string;
"organization_id": string;
"user_id": string | null;
"display_name": string;
"phone": string | null;
"active": boolean;
"hire_date": string;
"working_hours": Json | null;
};
Insert: {
"id"?: string;
"organization_id": string;
"user_id"?: string | null;
"display_name": string;
"phone"?: string | null;
"active"?: boolean;
"hire_date"?: string;
"working_hours"?: Json | null;
};
Update: {
"id"?: string;
"organization_id"?: string;
"user_id"?: string | null;
"display_name"?: string;
"phone"?: string | null;
"active"?: boolean;
"hire_date"?: string;
"working_hours"?: Json | null;
};
Relationships: [{foreignKeyName:"staff_profiles_organization_id_fkey";columns:["organization_id"];isOneToOne:false;referencedRelation:"organizations";referencedColumns:["id"]},{foreignKeyName:"staff_profiles_user_id_fkey";columns:["user_id"];isOneToOne:false;referencedRelation:"users";referencedColumns:["id"]},{foreignKeyName:"staff_profiles_organization_id_user_id_fkey";columns:["organization_id","user_id"];isOneToOne:false;referencedRelation:"organization_memberships";referencedColumns:["organization_id","user_id"]}];
};
"staff_services": {
Row: {
"organization_id": string;
"staff_id": string;
"service_id": string;
};
Insert: {
"organization_id": string;
"staff_id": string;
"service_id": string;
};
Update: {
"organization_id"?: string;
"staff_id"?: string;
"service_id"?: string;
};
Relationships: [{foreignKeyName:"staff_services_organization_id_staff_id_fkey";columns:["organization_id","staff_id"];isOneToOne:false;referencedRelation:"staff_profiles";referencedColumns:["organization_id","id"]},{foreignKeyName:"staff_services_organization_id_service_id_fkey";columns:["organization_id","service_id"];isOneToOne:false;referencedRelation:"services";referencedColumns:["organization_id","id"]}];
};
}; Views: { [_ in never]: never }; Functions: {
"adjust_payroll": { Args: {"p_org":string;"p_item":string;"p_kind":string;"p_description":string;"p_amount":number}; Returns: undefined };
"calculate_payroll": { Args: {"p_org":string;"p_start":string;"p_end":string}; Returns: string };
"create_salon": { Args: {"p_name":string;"p_slug":string}; Returns: string };
"log_payslip_access": { Args: {"p_org":string;"p_item":string}; Returns: undefined };
"punch_attendance": { Args: {"p_org":string;"p_direction":string}; Returns: string };
"review_attendance": { Args: {"p_org":string;"p_data":Json}; Returns: string };
"salon_members": { Args: {"p_org":string}; Returns: Json };
"salon_read": { Args: {"p_org":string;"p_resource":string;"p_from"?:string;"p_to"?:string}; Returns: Json };
"save_booking": { Args: {"p_org":string;"p_data":Json}; Returns: string };
"save_salon_settings": { Args: {"p_org":string;"p_data":Json}; Returns: undefined };
"save_service": { Args: {"p_org":string;"p_data":Json}; Returns: string };
"save_staff": { Args: {"p_org":string;"p_data":Json}; Returns: string };
"set_compensation": { Args: {"p_org":string;"p_data":Json}; Returns: undefined };
"set_salon_member": { Args: {"p_org":string;"p_email":string;"p_role":"admin" | "manager" | "staff"}; Returns: string };
"set_service_commission": { Args: {"p_org":string;"p_staff":string;"p_service":string;"p_type":string;"p_value":number}; Returns: undefined };
"transition_booking": { Args: {"p_org":string;"p_id":string;"p_status":string}; Returns: undefined };
"transition_payroll": { Args: {"p_org":string;"p_id":string;"p_status":string;"p_reference"?:string}; Returns: undefined };
}; Enums: {"app_role":"admin" | "manager" | "staff";"customer_status":"lead" | "active" | "inactive"}; CompositeTypes: { [_ in never]: never } } };
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
export const Constants = { public: { Enums: {"app_role":["admin","manager","staff"],"customer_status":["lead","active","inactive"]} } } as const;
