import { describe, it, expect } from 'vitest';
import {
  buildMaps,
  computeFullPath,
  buildDepth,
  buildMenuTree,
  flattenTree,
} from '../../src/utils/menuManagement';
import type { MenuRow } from '../../src/modules/configuration/types';

describe('menuManagement utilities', () => {
  const sampleRows: MenuRow[] = [
    {
      menuId: 1,
      parentId: null,
      title: 'Dashboard',
      slug: 'dashboard',
      tUrl: '/all',
      menuType: 2,
      sortOrder: 1,
      isActive: true,
      isVisible: true,
      readRights: 1,
    },
    {
      menuId: 2,
      parentId: null,
      title: 'Masters',
      slug: 'masters',
      tUrl: '/masters',
      menuType: 1,
      sortOrder: 2,
      isActive: true,
      isVisible: true,
      readRights: 1,
    },
    {
      menuId: 3,
      parentId: 2,
      title: 'Projects',
      slug: 'projects',
      tUrl: '/masters/projects',
      menuType: 2,
      sortOrder: 1,
      isActive: true,
      isVisible: true,
      readRights: 1,
    },
  ];

  it('builds maps correctly', () => {
    const { byId, children } = buildMaps(sampleRows);
    expect(byId.get(1)?.title).toBe('Dashboard');
    expect(children.get(null)?.length).toBe(2);
    expect(children.get(2)?.length).toBe(1);
  });

  it('computes full path using tUrl or fallback slug', () => {
    const { byId } = buildMaps(sampleRows);
    expect(computeFullPath(sampleRows[0], byId)).toBe('/all');
    expect(computeFullPath(sampleRows[2], byId)).toBe('/masters/projects');
  });

  it('computes depth properly', () => {
    const { byId } = buildMaps(sampleRows);
    expect(buildDepth(sampleRows[0], byId)).toBe(0);
    expect(buildDepth(sampleRows[2], byId)).toBe(1);
  });

  it('builds tree and flattens tree', () => {
    const tree = buildMenuTree(sampleRows);
    expect(tree.length).toBe(2);
    expect(tree[1].children?.length).toBe(1);

    const flattened = flattenTree(tree);
    expect(flattened.length).toBe(3);
  });
});
