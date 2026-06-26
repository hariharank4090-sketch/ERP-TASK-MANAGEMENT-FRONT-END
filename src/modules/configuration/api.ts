// src/modules/configuration/menuManagement/api.ts
import { fetchLink } from "../../Components/customFetch";
import type { BackendMenuItem, BackendSubRoute, MenuRow } from "./types";

const menuAPI = "configuration/appMenu/newAppMenu";

// ─── Slug helper ──────────────────────────────────────────────────────────────
// Preserves original casing from tUrl so "/All" stays "All" and "/reports" stays "reports".

function slugFromTUrl(tUrl: string | null | undefined, name: string): string {
    if (tUrl && tUrl.trim() !== "") {
        const stripped = tUrl.replace(/^\/+/, "").trim();
        return stripped || name.toLowerCase().replace(/\s+/g, "-");
    }
    return name.toLowerCase().replace(/\s+/g, "-");
}

// ─── Convert backend node to MenuRow ─────────────────────────────────────────

function toMenuRow(node: BackendSubRoute): MenuRow {
    return {
        menuId:       node.id,
        parentId:     node.parent_id,
        slug:         slugFromTUrl(node.tUrl, node.name),
        title:        node.name,
        iconKey:      null,
        menuType:     node.menu_type,
        // Backend uses is_active === 2 to mean "active"
        isActive:     node.is_active === 2,
        isVisible:    true,
        sortOrder:    node.display_order,
        componentKey: null,
        // Store tUrl exactly as-is — path resolution uses this directly
        tUrl:         node.tUrl ?? null,
        rUrl:         node.rUrl ?? null,
        readRights:   node.Read_Rights   ?? 0,
        addRights:    node.Add_Rights    ?? 0,
        editRights:   node.Edit_Rights   ?? 0,
        deleteRights: node.Delete_Rights ?? 0,
        printRights:  node.Print_Rights  ?? 0,
    };
}

function walkSubRoutes(
    routes: BackendSubRoute[] | undefined,
    out: MenuRow[],
    parentId: number | null,
): void {
    if (!routes) return;
    for (const sr of routes) {
        const row = toMenuRow(sr);
        // Always explicitly set parentId so tree wiring is correct
        row.parentId = parentId;
        out.push(row);
        walkSubRoutes(sr.SubRoutes, out, row.menuId);
    }
}

// ─── Flatten backend nested structure ────────────────────────────────────────
// Includes ALL nodes regardless of Read_Rights — buildMenuTree does the filtering.
// This ensures tUrl-based nodes (menu_type 2 and 3) are never silently dropped.

export function flattenBackendMenu(items: BackendMenuItem[]): MenuRow[] {
    const out: MenuRow[] = [];

    for (const main of items) {
        const mainRow = toMenuRow(main);
        out.push(mainRow);

        walkSubRoutes(main.SubRoutes, out, mainRow.menuId);

        if (main.SubMenu) {
            for (const sub of main.SubMenu) {
                const subRow = toMenuRow(sub);
                subRow.parentId = mainRow.menuId;
                out.push(subRow);

                walkSubRoutes(sub.SubRoutes, out, subRow.menuId);

                if (sub.ChildMenu) {
                    for (const child of sub.ChildMenu) {
                        const childRow = toMenuRow(child);
                        childRow.parentId = subRow.menuId;
                        out.push(childRow);

                        walkSubRoutes(child.SubRoutes, out, childRow.menuId);
                    }
                }
            }
        }
    }

    // De-duplicate by menuId: keep first occurrence
    const seen = new Set<number>();
    return out.filter((r) => {
        if (seen.has(r.menuId)) return false;
        seen.add(r.menuId);
        return true;
    });
}

// ─── Safe response extractor ─────────────────────────────────────────────────
// fetchLink may return:
//   Case A: { status: true,   data: BackendMenuItem[] }   ← backend JSON as-is
//   Case B: { success: true,  data: BackendMenuItem[] }   ← fetchLink remapped
//   Case C: { success: true,  data: { status: true, data: BackendMenuItem[] } } ← double-wrapped
//   Case D: BackendMenuItem[]                              ← raw array

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMenuArray(res: any): BackendMenuItem[] | null {
    // Case A / B — top-level ok flag + data array
    if (
        (res?.success === true || res?.status === true) &&
        Array.isArray(res?.data)
    ) {
        return res.data as BackendMenuItem[];
    }
    // Case C — fetchLink wraps body under .data
    if (
        res?.data &&
        (res.data?.success === true || res.data?.status === true) &&
        Array.isArray(res.data?.data)
    ) {
        return res.data.data as BackendMenuItem[];
    }
    // Case D — raw array
    if (Array.isArray(res)) {
        return res as BackendMenuItem[];
    }
    return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const getAppMenuData = async (
    loadingOn?: () => void,
    loadingOff?: () => void,
): Promise<MenuRow[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await fetchLink({
        address: menuAPI,
        loadingOn:  typeof loadingOn  === "function" ? loadingOn  : undefined,
        loadingOff: typeof loadingOff === "function" ? loadingOff : undefined,
    }).catch((e: Error) => {
        throw new Error("NETWORK_ERROR:" + e.message);
    });

    const items = extractMenuArray(res);
    if (items && items.length > 0) {
        return flattenBackendMenu(items);
    }
    return [];
};