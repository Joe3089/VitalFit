import { fetchAPI } from "@/lib/api";
import { ApiBranchAdmin, ApiResponse, BranchAdmin } from "@/models/users";

interface GetBranchAdminsParams {
  limit?: number;
  offset?: number;
  sort?: "asc" | "desc";
  search?: string;
}

export async function fetchBranchAdmins(
  params: GetBranchAdminsParams = {},
): Promise<BranchAdmin[]> {
  const { limit = 10, offset = 0, sort = "desc", search } = params;

  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    sort: sort,
  });

  if (search) {
    query.append("search", search);
  }

  const endpoint = `/user/branch-admins?${query.toString()}`;
  const res: ApiResponse = await fetchAPI(endpoint);

  if (!res.data) {
    console.error(
      "Respuesta de API inválida, falta 'data' en /user/branch-admins",
    );
    return [];
  }

  const mappedData: BranchAdmin[] = res.data.map((admin: ApiBranchAdmin) => ({
    id: admin.user_id,
    firstName: admin.first_name,
    lastName: admin.last_name,
    roleId: admin.role_id,
    roleName: admin.role_name,
  }));

  return mappedData;
}
