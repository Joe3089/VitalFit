import { fetchAPI } from "@/lib/api";

export interface ApiBranch {
  branch_id: string;
  country_name: string;
  manager_name: string;
  manager_last_name: string;
  name: string;
  state_name: string;
  status: string;
  tax_id: string;
}

export type BranchesTableRow = {
  id: string;
  name: string;
  taxId: string;
  administrator: string;
  state: string;
  country: string;
  status: "Active" | "Inactive" | "Maintenance";
};

type StatsData = {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
};

export type BranchesFetchResult = {
  data: BranchesTableRow[];
  total: number;
  stats: StatsData;
};

interface ApiCount {
  active: number;
  inactive: number;
  maintenance: number;
  total: number;
}

interface ApiBranchesResponse {
  count: ApiCount;
  data: ApiBranch[];
}

interface FetchBranchesParams {
  limit: number;
  offset: number;
  sort: "asc" | "desc";
  search?: string;
  status?: string;
  token: string | null;
}

export type CreateBranchPayload = {
  address?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  manager_id?: string | null;
  max_capacity?: number | null;
  name?: string | null;
  operating_hours?: Array<{
    close_time?: string | null;
    day_of_week?: string | null;
    is_closed?: boolean;
    open_time?: string | null;
  }>;
  payment_methods?: string[] | null;
  phone?: string | null;
  state?: string | null;
  status?: string | null;
  tax_id?: string | null;
};

/* ────────────────────────────────
   🔹 Crear Sucursal
──────────────────────────────── */
export async function createBranch(payload: CreateBranchPayload) {
  const res = await fetchAPI("/branches", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res;
}

/* ────────────────────────────────
   🔹 Obtener Sucursales
──────────────────────────────── */
export async function fetchBranches({
  limit,
  offset,
  sort,
  search,
  status,
  token,
}: FetchBranchesParams): Promise<BranchesFetchResult> {
  const query = new URLSearchParams();
  query.append("limit", limit.toString());
  query.append("offset", offset.toString());
  query.append("sort", sort);

  if (search) {
    query.append("search", search);
  }
  if (status) {
    query.append("status", status);
  }

  const res: ApiBranchesResponse = await fetchAPI(
    `/branches?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.data || !res.count) {
    console.error("⚠️ Respuesta inválida: falta 'data' o 'count'");
    return {
      data: [],
      total: 0,
      stats: { total: 0, active: 0, inactive: 0, maintenance: 0 },
    };
  }

  const statsResult: StatsData = {
    total: res.count.total,
    active: res.count.active,
    inactive: res.count.inactive,
    maintenance: res.count.maintenance,
  };

  const mappedData: BranchesTableRow[] = res.data.map((b) => ({
    id: b.branch_id,
    name: b.name,
    taxId: b.tax_id,
    administrator:
      `${b.manager_name ?? ""} ${b.manager_last_name ?? ""}`.trim(),
    state: b.state_name,
    country: b.country_name,
    status: b.status as "Active" | "Inactive" | "Maintenance",
  }));

  return {
    data: mappedData,
    total: res.count.total,
    stats: statsResult,
  };
}
