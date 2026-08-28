import { supabase } from "@/lib/supabase"

export type OrganizationType =
  | "travel_club"
  | "league"
  | "tournament_operator"
  | "training_facility"

export type Organization = {
  id: string
  name: string
  slug: string
  organization_type: OrganizationType
  city: string | null
  state: string | null
}

export async function getMyOrganizations(): Promise<Organization[]> {
  if (!supabase) return []

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("status", "active")

  if (membershipError) throw membershipError
  if (!memberships?.length) return []

  const ids = memberships.map((membership) => membership.organization_id)
  const { data, error } = await supabase
    .from("organizations")
    .select("id,name,slug,organization_type,city,state")
    .in("id", ids)
    .order("name")

  if (error) throw error
  return (data ?? []) as Organization[]
}

export async function createOrganization(input: {
  name: string
  slug: string
  organizationType: OrganizationType
  city?: string
  state?: string
}) {
  if (!supabase) throw new Error("Supabase is not configured")

  const { data, error } = await supabase.rpc("create_organization_with_owner", {
    p_name: input.name,
    p_slug: input.slug,
    p_organization_type: input.organizationType,
    p_city: input.city ?? null,
    p_state: input.state ?? null,
  })

  if (error) throw error
  return data
}
