// src/utils/menuManagement.ts
import type { MenuRow } from "../modules/configuration/types";

// ─── Map builders ─────────────────────────────────────────────────────────────

export function buildMaps(rows: MenuRow[]) {
    const byId = new Map<number, MenuRow>();
    const children = new Map<number | null, MenuRow[]>();
    rows.forEach((r) => {
        byId.set(r.menuId, r);
        const key = r.parentId ?? null;
        if (!children.has(key)) children.set(key, []);
        children.get(key)!.push(r);
    });
    return { byId, children };
}

// ─── Path / depth helpers ─────────────────────────────────────────────────────

/**
 * Resolve the navigable path for a menu row.
 * tUrl from the backend is ALWAYS used when present — preserves casing
 * ("/All", "/master"). Falls back to slug-chain only when tUrl is absent.
 */
export function computeFullPath(row: MenuRow, byId: Map<number, MenuRow>): string {
    const tUrl = row.tUrl;
    if (tUrl && tUrl.trim() !== "") {
        const t = tUrl.trim();
        return t.startsWith("/") ? t : "/" + t;
    }
    const parts: string[] = [];
    let cur: MenuRow | undefined | null = row;
    const guard = new Set<number>();
    while (cur) {
        if (guard.has(cur.menuId)) break;
        guard.add(cur.menuId);
        parts.unshift(cur.slug);
        cur = cur.parentId ? byId.get(cur.parentId) ?? null : null;
    }
    return "/" + parts.join("/");
}

export function buildDepth(row: MenuRow, byId: Map<number, MenuRow>): number {
    let depth = 0;
    let cur: MenuRow | undefined | null = row;
    const guard = new Set<number>();
    while (cur && cur.parentId) {
        if (guard.has(cur.menuId)) break;
        guard.add(cur.menuId);
        depth++;
        cur = byId.get(cur.parentId);
    }
    return depth;
}

export function computePathSort(row: MenuRow, byId: Map<number, MenuRow>): string {
    const parts: string[] = [];
    let cur: MenuRow | undefined | null = row;
    const guard = new Set<number>();
    while (cur) {
        if (guard.has(cur.menuId)) break;
        guard.add(cur.menuId);
        const so = cur.sortOrder == null ? 1000 : cur.sortOrder;
        parts.unshift(String(so).padStart(6, "0") + ":" + (cur.slug || ""));
        cur = cur.parentId ? byId.get(cur.parentId) ?? null : null;
    }
    return parts.join("/");
}

export function collectDescendants(
    rootId: number,
    childrenMap: Map<number | null, MenuRow[]>,
): Set<number> {
    const out = new Set<number>();
    const stack: number[] = [rootId];
    while (stack.length) {
        const id = stack.pop()!;
        for (const k of childrenMap.get(id) ?? []) {
            out.add(k.menuId);
            stack.push(k.menuId);
        }
    }
    return out;
}

// ─── Tree node ────────────────────────────────────────────────────────────────

export interface MenuTreeNode extends MenuRow {
    fullPath: string;
    children: MenuTreeNode[];
    subMenus?: MenuTreeNode[];
}

// ─── Build full tree ──────────────────────────────────────────────────────────
//
// Rules:
//   1. Only rows with readRights === 1, isActive truthy, isVisible truthy pass through.
//   2. tUrl is the authoritative fullPath; slug-chain is the fallback.
//   3. Orphaned nodes whose parent was filtered out are promoted to root.
//   4. Tree is sorted ascending by sortOrder then title at every level.

export function buildMenuTree(menus: MenuRow[]): MenuTreeNode[] {
    // 1. Keep only readable + active + visible rows
    const allowed = menus.filter(
        (m) =>
            m.readRights === 1 &&
            Boolean(m.isActive) &&
            Boolean(m.isVisible),
    );

    const validIds = new Set(allowed.map((m) => m.menuId));

    // 2. Promote orphaned children to root so they are never silently lost
    const processed = allowed.map((m) =>
        m.parentId !== null &&
        m.parentId !== undefined &&
        !validIds.has(m.parentId)
            ? { ...m, parentId: null }
            : m,
    );

    const byId = new Map<number, MenuRow>(processed.map((m) => [m.menuId, m]));

    // 3. Resolve fullPath — tUrl wins, slug-chain is fallback
    const resolveFullPath = (m: MenuRow): string => {
        const tUrl = m.tUrl;
        if (tUrl && tUrl.trim() !== "") {
            const t = tUrl.trim();
            return t.startsWith("/") ? t : "/" + t;
        }
        const parts: string[] = [];
        let cur: MenuRow | undefined | null = m;
        const guard = new Set<number>();
        while (cur) {
            if (guard.has(cur.menuId)) break;
            guard.add(cur.menuId);
            parts.unshift(cur.slug);
            cur = cur.parentId ? byId.get(cur.parentId) ?? null : null;
        }
        return "/" + parts.join("/");
    };

    // 4. Build node map and wire parent → children
    const nodeMap = new Map<number, MenuTreeNode>(
        processed.map((m) => [m.menuId, { ...m, fullPath: "", children: [] }]),
    );

    const roots: MenuTreeNode[] = [];

    processed.forEach((m) => {
        const node = nodeMap.get(m.menuId)!;
        node.fullPath = resolveFullPath(m);

        if (m.parentId !== null && m.parentId !== undefined) {
            const parent = nodeMap.get(m.parentId);
            if (parent) {
                parent.children.push(node);
            } else {
                // Parent was filtered out — promote to root
                roots.push(node);
            }
        } else {
            roots.push(node);
        }
    });

    // 5. Sort ascending by sortOrder then title at every level
    const sortTree = (nodes: MenuTreeNode[]) => {
        nodes.sort((a, b) => {
            const as_ = a.sortOrder ?? 1000;
            const bs_ = b.sortOrder ?? 1000;
            return as_ !== bs_ ? as_ - bs_ : a.title.localeCompare(b.title);
        });
        nodes.forEach((n) => sortTree(n.children));
    };
    sortTree(roots);

    return roots;
}

// ─── Convenience selectors ────────────────────────────────────────────────────

// Flatten the entire tree into a single array (all depths)
export function flattenTree(nodes: MenuTreeNode[]): MenuTreeNode[] {
    const result: MenuTreeNode[] = [];
    const stack = [...nodes];
    while (stack.length) {
        const node = stack.pop()!;
        result.push(node);
        if (node.children?.length) stack.push(...node.children);
    }
    return result;
}

// Returns only nodes with menuType === 2 — these are the main menu items
export function getMainMenus(tree: MenuTreeNode[]): MenuTreeNode[] {
    return tree.filter((n) => n.menuType === 2);
}

// Returns children of a main menu node where menuType === 3 (sub menu items),
// sorted ascending by sortOrder then title
export function getSubMenus(mainMenu: MenuTreeNode): MenuTreeNode[] {
    const subs = mainMenu.children.filter((c) => c.menuType === 3);
    subs.sort((a, b) => {
        const as_ = a.sortOrder ?? 1000;
        const bs_ = b.sortOrder ?? 1000;
        return as_ !== bs_ ? as_ - bs_ : a.title.localeCompare(b.title);
    });
    return subs;
}

// ─── Path helpers ─────────────────────────────────────────────────────────────

function normalizePath(p: string): string {
    if (!p) return "/";
    return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

/**
 * Case-insensitive path match so "/All" in the DB matches "/all" in the browser
 * URL bar (React Router lower-cases paths on most browsers).
 */
function pathsMatch(a: string, b: string): boolean {
    return normalizePath(a).toLowerCase() === normalizePath(b).toLowerCase();
}

export function findMenuByPath(
    tree: MenuTreeNode[],
    pathname: string,
): MenuTreeNode | null {
    const dfs = (nodes: MenuTreeNode[]): MenuTreeNode | null => {
        for (const node of nodes) {
            if (pathsMatch(node.fullPath, pathname)) return node;
            if (node.children.length) {
                const found = dfs(node.children);
                if (found) return found;
            }
        }
        return null;
    };
    return dfs(tree);
}

/**
 * Find the main menu (menuType === 2) that contains the given path as a descendant
 * This traverses UP from the current menu to find the top-most parent with menuType === 2
 */
export function findMainMenuByChildPath(
    tree: MenuTreeNode[],
    pathname: string,
): MenuTreeNode | null {
    // First find the current menu node
    const currentMenu = findMenuByPath(tree, pathname);
    if (!currentMenu) return null;

    // If current menu itself is a main menu (type 2), return it
    if (currentMenu.menuType === 2) {
        return currentMenu;
    }

    // Build id → node map from the full flattened tree for upward traversal
    const flattened = flattenTree(tree);
    const byId = new Map<number, MenuTreeNode>();
    flattened.forEach((n) => byId.set(n.menuId, n));

    // Traverse up the parent chain to find a menu with type 2
    let current: MenuTreeNode | undefined = currentMenu;
    while (current) {
        if (current.menuType === 2) {
            return current;
        }
        // Move to parent
        if (current.parentId) {
            current = byId.get(current.parentId);
        } else {
            break;
        }
    }

    return null;
}

/**
 * Get all submenus (menuType === 3) for a given main menu ID
 * This uses the flat nodes to find all children regardless of tree structure
 */
export function getSubmenusByMainMenuId(
    flatNodes: MenuTreeNode[],
    mainMenuId: number
): MenuTreeNode[] {
    // Filter all nodes where parentId matches the main menu ID and menuType is 3
    const submenus = flatNodes.filter(
        (node) => node.parentId === mainMenuId && node.menuType === 3
    );

    // Sort by sortOrder then title
    submenus.sort((a, b) => {
        const as_ = a.sortOrder ?? 1000;
        const bs_ = b.sortOrder ?? 1000;
        return as_ !== bs_ ? as_ - bs_ : a.title.localeCompare(b.title);
    });

    return submenus;
}