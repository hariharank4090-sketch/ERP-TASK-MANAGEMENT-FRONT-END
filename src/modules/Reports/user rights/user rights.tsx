/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Autocomplete,
  TextField,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  Paper,
  InputAdornment,
  Collapse,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Save as SaveIcon,
  Security as SecurityIcon,
  Search as SearchIcon,
  CheckCircleOutline as CheckCircleIcon,
  HighlightOff as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Group as GroupIcon,
  ViewAgendaOutlined as ViewAgendaIcon,
  Layers as LayersIcon,
  Badge as BadgeIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import type { UserBasedTreeViewProps, UserRightsData } from "./variable";
import { postCheck, fetchUserRights, fetchUsersList, fetchUserTypes, fetchUserTypeRights } from "./api";
import { isEqualNumber } from "../../../Components/functions";

export interface UserTypeItem {
  Id: number | string;
  UserType: string;
}

export interface UserDropdownItem {
  UserId: number | string;
  Name: string;
  UserTypeId?: number | string;
  UserType?: string;
  
  [key: string]: any;
}

interface MenuFlatItem {
  id: number;
  name: string;
  parentName: string;
  parentId: number | null;
  rUrl: string;
  menuType?: number;
  dataNode?: UserRightsData;
  childItems?: MenuFlatItem[];
}

const collectChildItems = (
  childrenList: any[],
  parentCategory: string,
  parentId: number
): MenuFlatItem[] => {
  const result: MenuFlatItem[] = [];
  if (!Array.isArray(childrenList)) return result;

  childrenList.forEach((child: any) => {
    if (!child) return;
    const cIsActive = Number(child.is_active ?? child.is_Active ?? child.isActive ?? 1);
    if (cIsActive === 0) return;

    const cId = Number(child.id ?? child.MenuId ?? child.Id ?? child.menu_id ?? child.menuId ?? 0);
    const cName = String(child.name ?? child.MenuName ?? child.title ?? child.User_Menu_Name ?? "").trim();
    if (!cName && !cId) return;

    const cType = Number(child.menu_type ?? child.menuType ?? 3);
    const subMenus: any[] = child.SubMenu || child.sub_menu || child.subMenu || [];
    const childMenus: any[] = child.ChildMenu || child.child_menu || child.childMenu || [];
    const subRoutes: any[] = child.SubRoutes || child.sub_routes || child.subRoutes || [];
    const nestedChildren = [...subMenus, ...childMenus, ...subRoutes];

    const nestedFlatChildren = collectChildItems(nestedChildren, parentCategory, cId);

    result.push({
      id: cId,
      name: cName || `Child #${cId}`,
      parentName: parentCategory,
      parentId: parentId,
      rUrl: String(child.rUrl || child.route || child.path || ""),
      menuType: cType,
      dataNode: child,
      childItems: nestedFlatChildren,
    });
  });

  return result;
};

const flattenMenuTree = (
  nodes: UserRightsData[],
  parentCategory = "GENERAL MODULES",
  level = 0
): MenuFlatItem[] => {
  const result: MenuFlatItem[] = [];
  if (!Array.isArray(nodes)) return result;

  nodes.forEach((node: any) => {
    if (!node) return;
    const menuId = Number(node.id ?? node.MenuId ?? node.Id ?? node.menu_id ?? node.menuId ?? 0);
    const menuName = String(node.name ?? node.MenuName ?? node.title ?? node.User_Menu_Name ?? "").trim();
    if (!menuName && !menuId) return;

    const subMenus: any[] = node.SubMenu || node.sub_menu || node.subMenu || [];
    const childMenus: any[] = node.ChildMenu || node.child_menu || node.childMenu || [];
    const subRoutes: any[] = node.SubRoutes || node.sub_routes || node.subRoutes || [];
    const allChildren = [...subMenus, ...childMenus, ...subRoutes];
    const menuType = Number(node.menu_type ?? node.menuType ?? (level === 0 ? 1 : level === 1 ? 2 : 3));

    if (level === 0) {
      const isActive = Number(node.is_active ?? node.is_Active ?? node.isActive ?? node.app_type ?? 0);
      if (isActive !== 2) {
        return; // Only display data where mainMenu.is_active === 2
      }
      const catName = menuName ? menuName.toUpperCase() : "MAIN MODULES";
      if (allChildren.length > 0) {
        result.push(...flattenMenuTree(allChildren, catName, level + 1));
      } else {
        result.push({
          id: menuId,
          name: menuName || `Menu #${menuId}`,
          parentName: "MAIN MODULES",
          parentId: null,
          rUrl: String(node.rUrl || node.route || node.path || ""),
          menuType: menuType,
          dataNode: node,
          childItems: [],
        });
      }
    } else {
      // level >= 1 (SubMenu menu_type: 2)
      const childItems: MenuFlatItem[] = collectChildItems(allChildren, parentCategory, menuId);

      result.push({
        id: menuId,
        name: menuName,
        parentName: parentCategory,
        parentId: null,
        rUrl: String(node.rUrl || node.route || node.path || ""),
        menuType: menuType,
        dataNode: node,
        childItems: childItems,
      });
    }
  });

  return result;
};

const getAllFlatItems = (items: MenuFlatItem[]): MenuFlatItem[] => {
  const result: MenuFlatItem[] = [];
  const traverse = (list: MenuFlatItem[]) => {
    list.forEach((item) => {
      result.push(item);
      if (item.childItems && item.childItems.length > 0) {
        traverse(item.childItems);
      }
    });
  };
  traverse(items);
  return result;
};

const getActiveMenuIds = (nodes: UserRightsData[]): number[] => {
  const ids: number[] = [];
  const traverse = (list: any[]) => {
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      if (!item) return;
      const menuId = Number(item.id ?? item.MenuId ?? item.Id ?? item.menu_id ?? item.menuId ?? 0);
      const readVal =
        item.Read_Rights ??
        item.readRights ??
        item.ReadRights ??
        item.read_rights ??
        item.Read_right ??
        item.read_right ??
        item.is_read ??
        item.isRead;

      let isRead = false;
      if (readVal !== undefined && readVal !== null) {
        isRead =
          Number(readVal) === 1 ||
          readVal === true ||
          String(readVal).toLowerCase() === "true" ||
          String(readVal) === "1";
      } else if (menuId > 0) {
        isRead = true;
      }

      if (isRead && menuId) {
        ids.push(menuId);
      }
      if (item.SubMenu) traverse(item.SubMenu);
      if (item.sub_menu) traverse(item.sub_menu);
      if (item.subMenu) traverse(item.subMenu);
      if (item.ChildMenu) traverse(item.ChildMenu);
      if (item.child_menu) traverse(item.child_menu);
      if (item.childMenu) traverse(item.childMenu);
      if (item.SubRoutes) traverse(item.SubRoutes);
      if (item.sub_routes) traverse(item.sub_routes);
      if (item.subRoutes) traverse(item.subRoutes);
    });
  };
  traverse(nodes);
  return ids;
};

const UserBasedTreeView: React.FC<UserBasedTreeViewProps> = (props) => {
  // User Types state
  const [userTypes, setUserTypes] = useState<UserTypeItem[]>([]);
  const [selectedUserType, setSelectedUserType] = useState<UserTypeItem | null>(null);

  // Users state
  const [users, setUsers] = useState<UserDropdownItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDropdownItem | null>(null);
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<UserDropdownItem[]>([]);

  // Flat list of menus for searching/checkboxes
  const [flatMenus, setFlatMenus] = useState<MenuFlatItem[]>([]);
  // Menu rights list for selected user or group
  const [userRightsIds, setUserRightsIds] = useState<number[]>([]);

  // UI states
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRights, setLoadingRights] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingStatusText, setSavingStatusText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Collapse/Expand state for main categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // 1. Fetch Users, User Types, and Initial Menu Tree on load
  useEffect(() => {
    toast.dismiss();

    const initData = async () => {
      setLoadingUsers(true);
      setLoadingRights(true);
      try {
        try {
          const utRes = await fetchUserTypes();
          if (utRes?.success && Array.isArray(utRes.data)) {
            setUserTypes(
              utRes.data.map((ut: any) => ({
                Id: ut.Id ?? ut.id ?? ut.UserTypeId ?? ut.User_Type_Id,
                UserType: ut.UserType ?? ut.name ?? ut.User_Type ?? ut.UserTypeName ?? String(ut.Id),
              }))
            );
          }
        } catch (utErr) {
          console.error("Error loading user types in UserRights:", utErr);
        }

        const userRes = await fetchUsersList();
        let loadedUsers: UserDropdownItem[] = [];
        if (userRes?.success && Array.isArray(userRes.data)) {
          loadedUsers = userRes.data.map((u: any) => {
            const uTypeId = u.UserTypeId ?? u.user_type_id ?? u.User_Type_Id;
            let uType = u.UserType ?? u.UserTypeName ?? u.user_type ?? u.User_Type ?? u.task_type ?? u.TaskType;
            if ((!uType || !isNaN(Number(uType))) && uTypeId !== undefined) {
              const matchedUt = loadedUsers.find(
                (ut) => String(ut.Id).trim() === String(uTypeId).trim()
              );
              if (matchedUt) {
                uType = matchedUt.UserType;
              }
            }
            return {
              ...u,
              UserId: u.UserId ?? u.id ?? u.User_Id ?? u.user_id,
              Name: u.Name ?? u.name ?? u.User_Name ?? u.username ?? "",
              UserTypeId: uTypeId,
              UserType: typeof uType === "string" ? uType : "",
            };
          });
          setUsers(loadedUsers);
        } else {
          toast.error("Failed to load users list");
        }

        const localData = localStorage.getItem("user");
        const parseData = localData ? JSON.parse(localData) : null;
        const currentId = parseData?.UserId ?? parseData?.id ?? parseData?.User_Id ?? loadedUsers[0]?.UserId ?? 1;

        if (currentId) {
          const foundUser = loadedUsers.find(
            (u) => String(u.UserId).trim() === String(currentId).trim()
          ) || loadedUsers[0] || null;

          if (foundUser) {
            setSelectedUser(foundUser);
          }

          const rightsRes = await fetchUserRights(
            foundUser ? foundUser.UserId : currentId,
            props.loadingOn,
            props.loadingOff
          );

          if (rightsRes?.success && Array.isArray(rightsRes.data) && rightsRes.data.length > 0) {
            const flattened = flattenMenuTree(rightsRes.data);
            setFlatMenus(flattened);
            setUserRightsIds(getActiveMenuIds(rightsRes.data));

            const initialExp: Record<string, boolean> = {};
            flattened.forEach((item) => {
              initialExp[item.parentName] = true;
            });
            setExpandedCategories(initialExp);
          }
        }
      } catch (err: any) {
        console.error("Error loading initial data:", err);
        toast.error("Failed to initialize screen data");
      } finally {
        setLoadingUsers(false);
        setLoadingRights(false);
      }
    };

    initData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper to match user with selected UserType
  const isUserMatched = (u: UserDropdownItem, type: UserTypeItem) => {
    if (u.UserTypeId !== undefined && u.UserTypeId !== null && type.Id !== undefined && type.Id !== null) {
      if (isEqualNumber(u.UserTypeId, type.Id) || String(u.UserTypeId).trim() === String(type.Id).trim()) {
        return true;
      }
    }
    const uType = u.UserType || (u as any).user_type || (u as any).UserTypeName;
    if (uType && type.UserType) {
      if (String(uType).trim().toUpperCase() === String(type.UserType).trim().toUpperCase()) {
        return true;
      }
    }
    return false;
  };

  // Filtered users when a UserType is selected
  const filteredUsersForDropdown = useMemo(() => {
    if (!selectedUserType) return users;
    return users.filter((u) => isUserMatched(u, selectedUserType));
  }, [users, selectedUserType]);

  // Target selection check
  const hasTargetSelection = Boolean(selectedUserType || selectedUser);

  // Handle UserType Selection / Change
  const handleUserTypeChange = async (newType: UserTypeItem | null) => {
    setSelectedUserType(newType);
    setSelectedUser(null);

    if (!newType) {
      setSelectedGroupUsers([]);
      setUserRightsIds([]);
      setFlatMenus([]);
      return;
    }

    const matched = users.filter((u) => isUserMatched(u, newType));
    setSelectedGroupUsers(matched);

    if (matched.length > 0) {
      toast.info(`Selected ${matched.length} user${matched.length > 1 ? "s" : ""} in "${newType.UserType}"`);
    } else {
      toast.info(`Selected User Type "${newType.UserType}"`);
    }

    setLoadingRights(true);
    try {
      const utRightsRes = await fetchUserTypeRights(
        newType.Id,
        props.loadingOn,
        props.loadingOff
      );

      let activeIds: number[] = [];
      let loadedTreeFromUt = false;

      if (utRightsRes?.success && Array.isArray(utRightsRes.data)) {
        activeIds = getActiveMenuIds(utRightsRes.data);
        const flattened = flattenMenuTree(utRightsRes.data);
        if (flattened.length > 0) {
          setFlatMenus(flattened);
          loadedTreeFromUt = true;
          const initialExp: Record<string, boolean> = {};
          flattened.forEach((item) => {
            initialExp[item.parentName] = true;
          });
          setExpandedCategories(initialExp);
        }
      }

      // If UserType endpoint did not return full menu categories tree, fetch master structure for UI display
      if (!loadedTreeFromUt && flatMenus.length === 0) {
        const fallbackRes = await fetchUserRights(
          1,
          props.loadingOn,
          props.loadingOff
        );
        if (fallbackRes?.success && Array.isArray(fallbackRes.data)) {
          const flattened = flattenMenuTree(fallbackRes.data);
          setFlatMenus(flattened);
          const initialExp: Record<string, boolean> = {};
          flattened.forEach((item) => {
            initialExp[item.parentName] = true;
          });
          setExpandedCategories(initialExp);
        }
      }

      // Set active rights specifically for this UserType
      setUserRightsIds(activeIds);
    } catch (err) {
      console.error("Error loading group rights:", err);
      setUserRightsIds([]);
    } finally {
      setLoadingRights(false);
    }
  };

  // 2. Fetch single user rights when selectedUser changes
  useEffect(() => {
    if (selectedUserType) return;

    if (!selectedUser) {
      setUserRightsIds([]);
      setFlatMenus([]);
      return;
    }

    const loadUserRights = async () => {
      setLoadingRights(true);
      try {
        const rightsRes = await fetchUserRights(
          selectedUser.UserId,
          props.loadingOn,
          props.loadingOff
        );

        let activeIds: number[] = [];
        let loadedTree = false;

        if (rightsRes?.success && Array.isArray(rightsRes.data)) {
          activeIds = getActiveMenuIds(rightsRes.data);
          const flattened = flattenMenuTree(rightsRes.data);
          if (flattened.length > 0) {
            setFlatMenus(flattened);
            loadedTree = true;
            const initialExp: Record<string, boolean> = {};
            flattened.forEach((item) => {
              initialExp[item.parentName] = true;
            });
            setExpandedCategories(initialExp);
          }
        }

        if (!loadedTree && flatMenus.length === 0) {
          const fallbackRes = await fetchUserRights(
            1,
            props.loadingOn,
            props.loadingOff
          );
          if (fallbackRes?.success && Array.isArray(fallbackRes.data)) {
            const flattened = flattenMenuTree(fallbackRes.data);
            setFlatMenus(flattened);
            const initialExp: Record<string, boolean> = {};
            flattened.forEach((item) => {
              initialExp[item.parentName] = true;
            });
            setExpandedCategories(initialExp);
          }
        }

        setUserRightsIds(activeIds);
      } catch (err: any) {
        console.error("Error loading user rights:", err);
        setUserRightsIds([]);
      } finally {
        setLoadingRights(false);
      }
    };

    loadUserRights();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser, selectedUserType]);

  // Collapse/Expand state for sub menu cards
  const [expandedSubCards, setExpandedSubCards] = useState<Record<number, boolean>>({});

  const toggleSubCardExpand = (menuId: number) => {
    setExpandedSubCards((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  // Flattened items including childItems for calculations
  const allFlatItems = useMemo(() => getAllFlatItems(flatMenus), [flatMenus]);

  // Group flat menus by category
  const groupedMenus = useMemo(() => {
    const groups: Record<string, MenuFlatItem[]> = {};
    flatMenus.forEach((item) => {
      if (!groups[item.parentName]) {
        groups[item.parentName] = [];
      }
      groups[item.parentName].push(item);
    });
    return groups;
  }, [flatMenus]);

  // Filtered menus based on search query
  const filteredGroupedMenus = useMemo(() => {
    if (!searchQuery.trim()) return groupedMenus;
    const query = searchQuery.toLowerCase();
    const result: Record<string, MenuFlatItem[]> = {};

    Object.entries(groupedMenus).forEach(([catName, items]) => {
      const matchedItems: MenuFlatItem[] = [];

      items.forEach((item) => {
        const parentMatches =
          item.name.toLowerCase().includes(query) ||
          item.parentName.toLowerCase().includes(query) ||
          (item.rUrl && item.rUrl.toLowerCase().includes(query));

        const matchingChildren = (item.childItems || []).filter(
          (child) =>
            child.name.toLowerCase().includes(query) ||
            (child.rUrl && child.rUrl.toLowerCase().includes(query))
        );

        if (parentMatches || matchingChildren.length > 0) {
          matchedItems.push({
            ...item,
            childItems: parentMatches ? item.childItems : matchingChildren,
          });
        }
      });

      if (matchedItems.length > 0) {
        result[catName] = matchedItems;
      }
    });

    return result;
  }, [groupedMenus, searchQuery]);

  // Compute detailed active menu list for display in the sidebar
  const activeMenuDetails = useMemo(() => {
    const list: {
      id: number;
      name: string;
      parentName: string;
      tags: string[];
      templateIds: number[];
    }[] = [];

    allFlatItems.forEach((item) => {
      const hasBaseAccess = userRightsIds.includes(Number(item.id));
      if (hasBaseAccess) {
        list.push({
          id: Number(item.id),
          name: item.name,
          parentName: item.parentName || "Task Management",
          tags: [item.menuType === 3 ? "Child Menu" : "Sub Menu"],
          templateIds: [],
        });
      }
    });

    return list;
  }, [allFlatItems, userRightsIds]);

  const [showUserChips, setShowUserChips] = useState(false);

  // Remove a report's access right directly from the left sidebar
  const handleRemoveReportAccess = (menuId: number) => {
    setUserRightsIds((prev) => prev.filter((id) => id !== menuId));
    toast.info("Removed report access");
  };

  // Category Toggle
  const toggleCategory = (catName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  // Toggle Parent SubMenu and all its Child items
  const handleParentSubToggle = (item: MenuFlatItem) => {
    const childIds = (item.childItems || []).map((c) => Number(c.id));
    const allIds = [Number(item.id), ...childIds];

    const isParentChecked = userRightsIds.includes(Number(item.id));

    if (isParentChecked) {
      setUserRightsIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setUserRightsIds((prev) => Array.from(new Set([...prev, ...allIds])));
    }
  };

  // Toggle Child item and update Parent SubMenu selection status
  const handleChildToggle = (childId: number, parentItem: MenuFlatItem) => {
    const isChildChecked = userRightsIds.includes(childId);

    setUserRightsIds((prev) => {
      let next: number[];
      if (isChildChecked) {
        next = prev.filter((id) => id !== childId);
      } else {
        next = [...prev, childId];
      }

      const childIds = (parentItem.childItems || []).map((c) => Number(c.id));
      const anyChildChecked = childIds.some((cId) => next.includes(cId));

      if (anyChildChecked) {
        if (!next.includes(Number(parentItem.id))) {
          next.push(Number(parentItem.id));
        }
      } else {
        next = next.filter((id) => id !== Number(parentItem.id));
      }

      return next;
    });
  };

  // Select all matching menus
  const handleSelectAll = () => {
    const allMatchingIds: number[] = [];
    Object.values(filteredGroupedMenus).forEach((items) => {
      items.forEach((item) => {
        allMatchingIds.push(Number(item.id));
        if (item.childItems) {
          item.childItems.forEach((child) => {
            allMatchingIds.push(Number(child.id));
          });
        }
      });
    });

    setUserRightsIds((prev) => {
      const combined = new Set([...prev, ...allMatchingIds]);
      return Array.from(combined);
    });
    toast.info("Selected all matching menus");
  };

  // Clear all matching menus
  const handleClearAll = () => {
    const matchingIdsToRemove = new Set<number>();
    Object.values(filteredGroupedMenus).forEach((items) => {
      items.forEach((item) => {
        matchingIdsToRemove.add(Number(item.id));
        if (item.childItems) {
          item.childItems.forEach((child) => {
            matchingIdsToRemove.add(Number(child.id));
          });
        }
      });
    });

    setUserRightsIds((prev) => prev.filter((id) => !matchingIdsToRemove.has(id)));
    toast.info("Cleared rights for matching menus");
  };

  // 3. Save Rights
  const handleSaveRights = async () => {
    if (!selectedUserType && !selectedUser) {
      toast.warning("Please select an employee or user type");
      return;
    }

    setSaving(true);
    const targetLabel = selectedUserType ? selectedUserType.UserType : selectedUser?.Name;
    setSavingStatusText(`Saving rights for ${targetLabel}...`);

    try {
      const rightsMap = new Set(userRightsIds);
      const payload: any[] = [];
      const uniqueFlatItemsMap = new Map<number, MenuFlatItem>();
      allFlatItems.forEach((item) => {
        const idNum = Number(item.id);
        if (idNum > 0 && !uniqueFlatItemsMap.has(idNum)) {
          uniqueFlatItemsMap.set(idNum, item);
        }
      });
      const uniqueFlatItems = Array.from(uniqueFlatItemsMap.values());

      if (selectedUserType) {
        const typeId = Number(selectedUserType.Id);
        // 1. UserType level rights (without UserId) to update tbl_AppMenu_UserTypeRights
        for (const menu of uniqueFlatItems) {
          const menuId = Number(menu.id);
          const hasRight = rightsMap.has(menuId);
          payload.push({
            MenuId: menuId,
            UserTypeId: typeId,
            User_Type_Id: typeId,
            ReadRights: hasRight ? 1 : 0,
            AddRights: hasRight ? 1 : 0,
            EditRights: hasRight ? 1 : 0,
            DeleteRights: hasRight ? 1 : 0,
            PrintRights: hasRight ? 1 : 0,
          });
        }
        // 2. Individual user level rights (with UserId) to update tbl_AppMenu_UserRights for matching users
        if (selectedGroupUsers && selectedGroupUsers.length > 0) {
          for (const u of selectedGroupUsers) {
            const uId = Number(u.UserId);
            for (const menu of uniqueFlatItems) {
              const menuId = Number(menu.id);
              const hasRight = rightsMap.has(menuId);
              payload.push({
                MenuId: menuId,
                User: uId,
                UserId: uId,
                User_Id: uId,
                UserTypeId: typeId,
                User_Type_Id: typeId,
                ReadRights: hasRight ? 1 : 0,
                AddRights: hasRight ? 1 : 0,
                EditRights: hasRight ? 1 : 0,
                DeleteRights: hasRight ? 1 : 0,
                PrintRights: hasRight ? 1 : 0,
              });
            }
          }
        }
      } else if (selectedUser) {
        const uId = Number(selectedUser.UserId);
        const typeId = selectedUser.UserTypeId ? Number(selectedUser.UserTypeId) : undefined;
        for (const menu of uniqueFlatItems) {
          const menuId = Number(menu.id);
          const hasRight = rightsMap.has(menuId);
          payload.push({
            MenuId: menuId,
            User: uId,
            UserId: uId,
            User_Id: uId,
            ...(typeId !== undefined ? { UserTypeId: typeId, User_Type_Id: typeId } : {}),
            ReadRights: hasRight ? 1 : 0,
            AddRights: hasRight ? 1 : 0,
            EditRights: hasRight ? 1 : 0,
            DeleteRights: hasRight ? 1 : 0,
            PrintRights: hasRight ? 1 : 0,
          });
        }
      }

      const res = await postCheck(payload, props.loadingOn, props.loadingOff);

      if (res?.success) {
        toast.success(`Rights saved successfully for ${targetLabel}!`);

        if (selectedUserType) {
          const utRightsRes = await fetchUserTypeRights(
            selectedUserType.Id,
            props.loadingOn,
            props.loadingOff
          );
          if (utRightsRes?.success && Array.isArray(utRightsRes.data)) {
            setUserRightsIds(getActiveMenuIds(utRightsRes.data));
          }
        } else if (selectedUser) {
          const rightsRes = await fetchUserRights(
            selectedUser.UserId,
            props.loadingOn,
            props.loadingOff
          );
          if (rightsRes?.success && Array.isArray(rightsRes.data)) {
            setUserRightsIds(getActiveMenuIds(rightsRes.data));
          }
        }
      }
    } catch (err: any) {
      console.error("Error saving rights:", err);
      toast.error("Failed to save user rights");
    } finally {
      setSaving(false);
      setSavingStatusText("");
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%", minHeight: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {/* Main 2-Panel Layout Container */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            height: "100%",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          {/* Left Control Panel */}
          <Box
            sx={{
              width: { xs: "100%", md: "340px", lg: "370px" },
              height: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
            }}
          >
            <Card
              elevation={3}
              sx={{
                borderRadius: 2.5,
                height: "100%",
                minHeight: 0,
                border: "1px solid rgba(226, 232, 240, 0.8)",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                  p: 1.75,
                  height: "100%",
                  minHeight: 0,
                  boxSizing: "border-box",
                  overflow: "hidden",
                  "&:last-child": { pb: 1.75 },
                }}
              >
                {/* 1. User Type Dropdown (Compact) */}
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={0.75}>
                    <BadgeIcon color="primary" sx={{ fontSize: 18 }} />
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ fontSize: "0.92rem" }}>
                      User Type
                    </Typography>
                  </Box>
                  {selectedUserType ? (
                    <Chip
                      label="Collective Mode"
                      size="small"
                      color="secondary"
                      sx={{ height: 22, fontSize: "0.75rem", fontWeight: 700 }}
                    />
                  ) : (
                    <Chip
                      label="Single User Mode"
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: "0.75rem", fontWeight: 600, color: "text.secondary" }}
                    />
                  )}
                </Box>

                <Autocomplete
                  options={userTypes}
                  getOptionLabel={(option) => (typeof option === "string" ? option : option?.UserType || "")}
                  isOptionEqualToValue={(option, value) => !value || String(option?.Id) === String(value?.Id)}
                  value={selectedUserType}
                  onChange={(_, newValue) => handleUserTypeChange(newValue)}
                  size="small"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="User Type (Optional)"
                      placeholder="Leave empty for single user"
                      variant="outlined"
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                          fontSize: "0.88rem",
                        },
                      }}
                    />
                  )}
                />

                {/* 2. Target User Dropdown */}
                {selectedUserType ? (
                  <>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <GroupIcon color="primary" sx={{ fontSize: 18 }} />
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ fontSize: "0.92rem" }}>
                          Target Users ({selectedGroupUsers.length})
                        </Typography>
                      </Box>
                      <Box display="flex" gap={0.5}>
                        <Button
                          size="small"
                          sx={{ fontSize: "0.76rem", py: "1px", px: "6px", minWidth: 0, textTransform: "none", fontWeight: 600 }}
                          onClick={() => setSelectedGroupUsers(filteredUsersForDropdown)}
                        >
                          Select All
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          sx={{ fontSize: "0.76rem", py: "1px", px: "6px", minWidth: 0, textTransform: "none", fontWeight: 600 }}
                          onClick={() => setSelectedGroupUsers([])}
                        >
                          Clear
                        </Button>
                      </Box>
                    </Box>

                    <Autocomplete
                      multiple
                      options={filteredUsersForDropdown}
                      disableCloseOnSelect
                      getOptionLabel={(option) => option.Name}
                      isOptionEqualToValue={(option, value) => String(option.UserId) === String(value.UserId)}
                      value={selectedGroupUsers}
                      onChange={(_, newValue) => setSelectedGroupUsers(newValue)}
                      size="small"
                      limitTags={2}
                      renderOption={(props, option, { selected }) => (
                        <li {...props} key={option.UserId}>
                          <Checkbox
                            size="small"
                            checked={selected}
                            sx={{ mr: 1, p: 0.25 }}
                          />
                          <Typography variant="body2" sx={{ fontSize: "0.88rem" }}>
                            {option.Name}
                          </Typography>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={`Users in ${selectedUserType.UserType}`}
                          placeholder="Select users..."
                          variant="outlined"
                          fullWidth
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 1.5,
                              fontSize: "0.88rem",
                            },
                          }}
                        />
                      )}
                    />

                    {/* Compact Collapsible Target Users Bar */}
                    <Box
                      sx={{
                        p: 0.75,
                        px: 1,
                        bgcolor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: 1.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        flexShrink: 0,
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <GroupIcon sx={{ fontSize: 15, color: "#15803d" }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: "#166534", fontSize: "0.82rem" }}>
                            {selectedGroupUsers.length} Users ({selectedUserType.UserType})
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          onClick={() => setShowUserChips((prev) => !prev)}
                          sx={{
                            p: "0px 6px",
                            minWidth: 0,
                            fontSize: "0.75rem",
                            textTransform: "none",
                            fontWeight: 600,
                            color: "#15803d",
                            bgcolor: "#dcfce7",
                            "&:hover": { bgcolor: "#bbf7d0" },
                          }}
                        >
                          {showUserChips ? "Hide Users" : "Show Users"}
                        </Button>
                      </Box>

                      {showUserChips && (
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            maxHeight: 75,
                            overflowY: "auto",
                            pt: 0.5,
                            borderTop: "1px dashed #bbf7d0",
                          }}
                        >
                          {selectedGroupUsers.map((u) => (
                            <Chip
                              key={u.UserId}
                              label={u.Name}
                              size="small"
                              onDelete={() =>
                                setSelectedGroupUsers((prev) =>
                                  prev.filter((item) => String(item.UserId) !== String(u.UserId))
                                )
                              }
                              sx={{
                                height: 22,
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                bgcolor: "#ffffff",
                                color: "#166534",
                                border: "1px solid #bbf7d0",
                                "& .MuiChip-deleteIcon": {
                                  fontSize: 14,
                                  color: "#166534",
                                  "&:hover": { color: "#b91c1c" },
                                },
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </>
                ) : (
                  <>
                    <Box display="flex" alignItems="center" gap={0.75}>
                      <PersonIcon color="primary" sx={{ fontSize: 18 }} />
                      <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ fontSize: "0.92rem" }}>
                        Select Employee
                      </Typography>
                    </Box>

                    {loadingUsers ? (
                      <Box display="flex" justifyContent="center" py={1}>
                        <CircularProgress size={22} />
                      </Box>
                    ) : (
                      <Autocomplete
                        options={users}
                        getOptionLabel={(option) => option.Name}
                        isOptionEqualToValue={(option, value) => String(option.UserId) === String(value.UserId)}
                        value={selectedUser}
                        onChange={(_, newValue) => setSelectedUser(newValue)}
                        size="small"
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Search / Select Employee"
                            variant="outlined"
                            fullWidth
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 1.5,
                                fontSize: "0.88rem",
                              },
                            }}
                          />
                        )}
                      />
                    )}

                    {selectedUser && (
                      <Box
                        sx={{
                          p: 0.75,
                          px: 1,
                          bgcolor: "#fcf7ef",
                          border: "1px solid #e0c496",
                          borderRadius: 1.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexShrink: 0,
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={0.75} sx={{ minWidth: 0, flex: 1 }}>
                          <PersonIcon sx={{ fontSize: 16, color: "#C99F65" }} />
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: "#7a5925",
                              fontSize: "0.85rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {selectedUser.Name}
                            {(() => {
                              const uTypeDisplay =
                                selectedUser.UserType ||
                                userTypes.find(
                                  (ut) => String(ut.Id).trim() === String(selectedUser.UserTypeId).trim()
                                )?.UserType;
                              return (
                                <Typography component="span" sx={{ color: "#64748b", fontWeight: 500, fontSize: "0.78rem", ml: 0.5 }}>
                                  (ID: {selectedUser.UserId}{uTypeDisplay ? ` • ${uTypeDisplay}` : ""})
                                </Typography>
                              );
                            })()}
                          </Typography>
                        </Box>
                        <Chip
                          label="Active"
                          size="small"
                          sx={{ height: 22, fontSize: "0.75rem", fontWeight: 700, bgcolor: "#C99F65", color: "#ffffff" }}
                        />
                      </Box>
                    )}
                  </>
                )}

                {/* 3. SELECTED Task Management & MENUS PANEL */}
                {hasTargetSelection ? (
                  <Box
                    sx={{
                      flex: "1 1 0px",
                      height: 0,
                      minHeight: 0,
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: "#ffffff",
                      borderRadius: 2,
                      border: "1px solid #cbd5e1",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Panel Header */}
                    <Box
                      sx={{
                        p: 1,
                        px: 1.25,
                        bgcolor: "#f1f5f9",
                        borderBottom: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexShrink: 0,
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <SecurityIcon sx={{ fontSize: 16, color: "#7a5925" }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b" }}>
                          Selected Task Management & Menus
                        </Typography>
                        <Chip
                          size="small"
                          label={`${activeMenuDetails.length}`}
                          sx={{
                            height: 22,
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            bgcolor: "#C99F65",
                            color: "#ffffff",
                          }}
                        />
                      </Box>

                      {activeMenuDetails.length > 0 && (
                        <Tooltip title="Clear all assigned rights">
                          <Button
                            size="small"
                            color="error"
                            onClick={() => setUserRightsIds([])}
                            sx={{
                              p: "1px 6px",
                              minWidth: 0,
                              fontSize: "0.78rem",
                              textTransform: "none",
                              fontWeight: 600,
                              height: 22,
                            }}
                          >
                            Clear All
                          </Button>
                        </Tooltip>
                      )}
                    </Box>

                    {/* Dedicated Scrollable List of Task Management */}
                    <Box
                      sx={{
                        flex: "1 1 0px",
                        height: 0,
                        minHeight: 0,
                        overflowY: "auto",
                        overscrollBehavior: "contain",
                        p: 0.75,
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.6,
                      }}
                    >
                      {activeMenuDetails.length > 0 ? (
                        activeMenuDetails.map((menu) => (
                          <Box
                            key={menu.id}
                            sx={{
                              p: 0.75,
                              px: 1,
                              borderRadius: 1.5,
                              bgcolor: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderLeft: "3px solid #C99F65",
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.35,
                              transition: "all 0.15s ease",
                              flexShrink: 0,
                              "&:hover": {
                                bgcolor: "#ffffff",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                                borderColor: "#cbd5e1",
                                borderLeftColor: "#b3894f",
                              },
                            }}
                          >
                            <Box display="flex" alignItems="center" justifyContent="space-between" gap={0.5}>
                              <Box display="flex" alignItems="center" gap={0.6} sx={{ minWidth: 0, flex: 1 }}>
                                <CheckCircleIcon sx={{ fontSize: 14, color: "#C99F65", flexShrink: 0 }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: "0.85rem",
                                    color: "#1e293b",
                                    lineHeight: 1.25,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                  title={menu.name}
                                >
                                  {menu.name}
                                </Typography>
                              </Box>
                              <Tooltip title="Remove this report">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveReportAccess(menu.id)}
                                  sx={{
                                    p: 0.2,
                                    color: "text.disabled",
                                    "&:hover": { color: "#dc2626", bgcolor: "#fee2e2" },
                                  }}
                                >
                                  <ClearIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>

                            {/* Tags / Category Badges */}
                            <Box display="flex" alignItems="center" flexWrap="wrap" gap={0.4} pl={2.25}>
                              <Chip
                                label={menu.parentName}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  bgcolor: "#e2e8f0",
                                  color: "#334155",
                                }}
                              />
                              {menu.tags.map((tag) => (
                                <Chip
                                  key={tag}
                                  label={tag}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: "0.72rem",
                                    fontWeight: 600,
                                    bgcolor: "#fcf7ef",
                                    color: "#7a5925",
                                    border: "1px solid #e0c496",
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        ))
                      ) : (
                        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ flex: 1, py: 3, color: "text.disabled" }}>
                          <LayersIcon sx={{ fontSize: 28, mb: 0.5, opacity: 0.5 }} />
                          <Typography variant="caption" align="center" sx={{ fontWeight: 600, color: "#64748b", fontSize: "0.82rem" }}>
                            No reports selected yet
                          </Typography>
                          <Typography variant="caption" align="center" sx={{ fontSize: "0.78rem", opacity: 0.8, mt: 0.25 }}>
                            Select menus on the right to add them here.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                      flex: 1,
                      color: "text.disabled",
                      textAlign: "center",
                      p: 2,
                      bgcolor: "#f8fafc",
                      borderRadius: 2,
                      border: "1px dashed #cbd5e1",
                    }}
                  >
                    <SecurityIcon sx={{ fontSize: 36, mb: 1, opacity: 0.4 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#64748b", fontSize: "0.88rem" }}>
                      No Target Selected
                    </Typography>
                    <Typography variant="caption" sx={{ mt: 0.5, maxWidth: 220, fontSize: "0.78rem" }}>
                      Select an employee above, or pick a User Type to assign rights collectively.
                    </Typography>
                  </Box>
                )}

                {/* 4. Save Button (Pinned at Bottom) */}
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveRights}
                  disabled={
                    saving ||
                    !hasTargetSelection
                  }
                  sx={{
                    py: 1,
                    borderRadius: 1.5,
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    textTransform: "none",
                    bgcolor: "#C99F65",
                    color: "#ffffff",
                    boxShadow: "0 4px 10px rgba(201, 159, 101, 0.3)",
                    transition: "all 0.2s",
                    flexShrink: 0,
                    "&:hover": {
                      backgroundColor: "#b3894f",
                    },
                  }}
                >
                  {saving
                    ? savingStatusText || "Saving..."
                    : selectedUserType
                      ? selectedGroupUsers.length > 0
                        ? `Save Rights for ${selectedGroupUsers.length} User(s)`
                        : `Save Rights for ${selectedUserType.UserType}`
                      : selectedUser
                        ? `Save Rights for ${selectedUser.Name}`
                        : "Save Rights"}
                </Button>
              </CardContent>
            </Card>
          </Box>

          {/* Right Menus Selection list */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              height: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Card
              elevation={3}
              sx={{
                borderRadius: 2.5,
                height: "100%",
                minHeight: 0,
                border: "1px solid rgba(226, 232, 240, 0.8)",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <CardContent
                sx={{
                  p: 2,
                  height: "100%",
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  boxSizing: "border-box",
                  overflow: "hidden",
                  "&:last-child": { pb: 2 },
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1.5}
                  flexShrink={0}
                >
                  <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: "0.92rem" }}>
                    Available Menus & Task Management
                  </Typography>

                  {hasTargetSelection && (
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={handleSelectAll}
                        sx={{ textTransform: "none", borderRadius: 1, py: 0.2, fontSize: "0.85rem" }}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<ClearIcon />}
                        onClick={handleClearAll}
                        sx={{ textTransform: "none", borderRadius: 1, py: 0.2, fontSize: "0.85rem" }}
                      >
                        Clear All
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Search box */}
                <TextField
                  placeholder="Search menu or report..."
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    mb: 1.5,
                    flexShrink: 0,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      fontSize: "0.88rem",
                      backgroundColor: "#f8fafc",
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                {!hasTargetSelection ? (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    sx={{ flex: 1, color: "text.secondary", py: 4 }}
                  >
                    <SecurityIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
                    <Typography variant="body2" fontWeight={600} align="center" sx={{ fontSize: "0.88rem" }}>
                      Please select an employee or a User Type
                    </Typography>
                    <Typography variant="caption" color="text.disabled" align="center" sx={{ mt: 0.5, fontSize: "0.78rem" }}>
                      Select a single employee or select a User Type to configure menu privileges collectively.
                    </Typography>
                  </Box>
                ) : loadingRights ? (
                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ flex: 1, py: 4 }}>
                    <CircularProgress size={30} sx={{ mb: 1.5 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                      Loading permissions list...
                    </Typography>
                  </Box>
                ) : Object.keys(filteredGroupedMenus).length === 0 ? (
                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ flex: 1, py: 4 }}>
                    <ClearIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                      No menus found matching "{searchQuery}"
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      flex: "1 1 0px",
                      height: 0,
                      minHeight: 0,
                      overflowY: "auto",
                      overscrollBehavior: "contain",
                      pr: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                    }}
                  >
                    {Object.entries(filteredGroupedMenus).map(([category, items]) => {
                      const isExpanded = expandedCategories[category] !== false;

                      const categoryActiveCount = items.reduce((acc, item) => {
                        let count = userRightsIds.includes(Number(item.id)) ? 1 : 0;
                        if (item.childItems) {
                          item.childItems.forEach((child) => {
                            if (userRightsIds.includes(Number(child.id))) {
                              count++;
                            }
                          });
                        }
                        return acc + count;
                      }, 0);

                      const categoryTotalCount = items.reduce((acc, item) => {
                        return acc + 1 + (item.childItems ? item.childItems.length : 0);
                      }, 0);

                      return (
                        <Paper
                          key={category}
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            border: "1px solid #e2e8f0",
                            flexShrink: 0,
                            transition: "box-shadow 0.2s",
                            "&:hover": {
                              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                            },
                          }}
                        >
                          {/* Category Header */}
                          <Box
                            onClick={() => toggleCategory(category)}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              px: 2,
                              py: 1,
                              backgroundColor: "#f8fafc",
                              borderBottom: isExpanded ? "1px solid #e2e8f0" : "none",
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={1}>
                              {isExpanded ? (
                                <ExpandMoreIcon color="action" fontSize="small" />
                              ) : (
                                <ChevronRightIcon color="action" fontSize="small" />
                              )}
                              <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ fontSize: "0.92rem" }}>
                                {category.toUpperCase()}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                px: 1,
                                py: 0.2,
                                borderRadius: 4,
                                backgroundColor: categoryActiveCount > 0 ? "rgba(201, 159, 101, 0.15)" : "#f1f5f9",
                                color: categoryActiveCount > 0 ? "#7a5925" : "text.secondary",
                                fontSize: "0.82rem",
                                fontWeight: 700,
                              }}
                            >
                              {categoryActiveCount} / {categoryTotalCount} Enabled
                            </Box>
                          </Box>

                          {/* Category Items list */}
                          <Collapse in={isExpanded}>
                            <Box
                              sx={{
                                px: 2,
                                py: 1.5,
                                backgroundColor: "#f8fafc",
                              }}
                            >
                              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
                                {items.map((item) => {
                                  const isChecked = userRightsIds.includes(Number(item.id));
                                  const hasChildren = Boolean(item.childItems && item.childItems.length > 0);
                                  const childIds = hasChildren ? item.childItems!.map((c) => Number(c.id)) : [];
                                  const checkedChildrenCount = childIds.filter((id) => userRightsIds.includes(id)).length;
                                  const isSubExpanded = Boolean(expandedSubCards[item.id]);

                                  return (
                                    <Box key={item.id} sx={{ display: "flex", flexDirection: "column", gridColumn: isSubExpanded && hasChildren ? { xs: "span 1", sm: "span 2", md: "span 3" } : "span 1" }}>
                                      <Paper
                                        elevation={0}
                                        sx={{
                                          width: "100%",
                                          height: isSubExpanded ? "auto" : 108,
                                          minHeight: 108,
                                          display: "flex",
                                          flexDirection: "column",
                                          justifyContent: "space-between",
                                          p: 1.25,
                                          borderRadius: 2,
                                          border: isChecked ? "1.5px solid #C99F65" : "1px solid #e2e8f0",
                                          backgroundColor: isChecked ? "#fcf7ef" : "#ffffff",
                                          boxShadow: isChecked
                                            ? "0 2px 8px rgba(201, 159, 101, 0.2)"
                                            : "0 1px 3px rgba(0, 0, 0, 0.03)",
                                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                          "&:hover": {
                                            transform: "translateY(-2px)",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                            borderColor: isChecked ? "#b3894f" : "#cbd5e1",
                                          },
                                        }}
                                      >
                                        {/* TOP AREA: Checkbox, Name, Route, Expand Button */}
                                        <Box
                                          onClick={() => handleParentSubToggle(item)}
                                          sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 1,
                                            cursor: "pointer",
                                            userSelect: "none",
                                            width: "100%",
                                          }}
                                        >
                                          <Checkbox
                                            checked={isChecked}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              handleParentSubToggle(item);
                                            }}
                                            size="small"
                                            sx={{
                                              p: 0,
                                              mt: 0.1,
                                              color: "#94a3b8",
                                              "&.Mui-checked": {
                                                color: "#C99F65",
                                              },
                                            }}
                                          />

                                          <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontWeight: isChecked ? 700 : 600,
                                                fontSize: "0.88rem",
                                                color: isChecked ? "#7a5925" : "#1e293b",
                                                lineHeight: 1.25,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                              }}
                                            >
                                              {item.name}
                                            </Typography>

                                            <Typography
                                              variant="caption"
                                              sx={{
                                                fontSize: "0.75rem",
                                                color: "#64748b",
                                                display: "block",
                                                mt: 0.25,
                                                minHeight: "1.1rem",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                fontFamily: "monospace",
                                                opacity: 0.85,
                                              }}
                                            >
                                              {item.rUrl || "/"}
                                            </Typography>
                                          </Box>

                                          {hasChildren ? (
                                            <IconButton
                                              size="small"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSubCardExpand(item.id);
                                              }}
                                              sx={{
                                                p: 0.25,
                                                color: "#475569",
                                                transition: "transform 0.2s",
                                                transform: isSubExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                                "&:hover": { bgcolor: "rgba(0,0,0,0.05)" },
                                              }}
                                            >
                                              <ExpandMoreIcon fontSize="small" />
                                            </IconButton>
                                          ) : (
                                            <Box sx={{ width: 28, height: 28, flexShrink: 0 }} />
                                          )}
                                        </Box>

                                        {/* BOTTOM AREA: Sub Menu badge or Child Menus count badge */}
                                        <Box
                                          sx={{
                                            mt: 1,
                                            pt: 0.75,
                                            borderTop: isChecked ? "1px dashed #e0c496" : "1px dashed #e2e8f0",
                                          }}
                                        >
                                          <Box
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            sx={{ height: 26, px: 0.5 }}
                                          >
                                            <Box display="flex" alignItems="center" gap={0.5}>
                                              <ViewAgendaIcon
                                                sx={{
                                                  fontSize: 12,
                                                  color: isChecked ? "#C99F65" : "#cbd5e1",
                                                }}
                                              />
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  fontSize: "0.75rem",
                                                  color: isChecked ? "#7a5925" : "#94a3b8",
                                                  fontWeight: 600,
                                                }}
                                              >
                                                {hasChildren
                                                  ? `${checkedChildrenCount}/${childIds.length} Child Menus`
                                                  : "Sub Menu (Type 2)"}
                                              </Typography>
                                            </Box>
                                            {hasChildren ? (
                                              <Button
                                                size="small"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleSubCardExpand(item.id);
                                                }}
                                                sx={{
                                                  p: "0px 6px",
                                                  minWidth: 0,
                                                  fontSize: "0.75rem",
                                                  textTransform: "none",
                                                  fontWeight: 700,
                                                  color: isSubExpanded ? "#7a5925" : "#475569",
                                                  bgcolor: isSubExpanded ? "#fcf7ef" : "#f1f5f9",
                                                  borderRadius: 1,
                                                }}
                                              >
                                                {isSubExpanded ? "Collapse" : `Expand (${childIds.length})`}
                                              </Button>
                                            ) : isChecked ? (
                                              <Chip
                                                label="Active"
                                                size="small"
                                                sx={{
                                                  height: 20,
                                                  fontSize: "0.7rem",
                                                  fontWeight: 700,
                                                  backgroundColor: "#fcf7ef",
                                                  color: "#7a5925",
                                                  border: "1px solid #e0c496",
                                                  borderRadius: 0.75,
                                                  "& .MuiChip-label": { px: 0.5 },
                                                }}
                                              />
                                            ) : (
                                              <Box sx={{ height: 16 }} />
                                            )}
                                          </Box>
                                        </Box>

                                        {/* EXPANDABLE SECTION FOR CHILD MENUS (menu_type: 3) */}
                                        {hasChildren && (
                                          <Collapse in={isSubExpanded} timeout="auto" unmountOnExit={false}>
                                            <Box
                                              sx={{
                                                mt: 1.25,
                                                pt: 1.25,
                                                borderTop: "1px dashed #cbd5e1",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 1,
                                              }}
                                            >
                                              <Box display="flex" alignItems="center" justifyContent="space-between">
                                                <Typography
                                                  variant="caption"
                                                  sx={{
                                                    fontWeight: 700,
                                                    fontSize: "0.8rem",
                                                    color: "#334155",
                                                    letterSpacing: "0.02em",
                                                    textTransform: "uppercase",
                                                  }}
                                                >
                                                  Child Menus (Type 3)
                                                </Typography>
                                                <Typography
                                                  variant="caption"
                                                  sx={{
                                                    fontSize: "0.75rem",
                                                    color: "#64748b",
                                                    fontWeight: 600,
                                                  }}
                                                >
                                                  {checkedChildrenCount} of {childIds.length} active
                                                </Typography>
                                              </Box>

                                              <Box
                                                sx={{
                                                  display: "grid",
                                                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
                                                  gap: 1,
                                                }}
                                              >
                                                {item.childItems!.map((child) => {
                                                  const isChildChecked = userRightsIds.includes(Number(child.id));

                                                  return (
                                                    <Paper
                                                      key={child.id}
                                                      elevation={0}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleChildToggle(Number(child.id), item);
                                                      }}
                                                      sx={{
                                                        p: 1,
                                                        borderRadius: 1.5,
                                                        border: isChildChecked ? "1.5px solid #C99F65" : "1px solid #cbd5e1",
                                                        backgroundColor: isChildChecked ? "#ffffff" : "#f8fafc",
                                                        cursor: "pointer",
                                                        userSelect: "none",
                                                        display: "flex",
                                                        alignItems: "flex-start",
                                                        gap: 0.75,
                                                        transition: "all 0.15s ease",
                                                        "&:hover": {
                                                          borderColor: isChildChecked ? "#b3894f" : "#94a3b8",
                                                          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                                                        },
                                                      }}
                                                    >
                                                      <Checkbox
                                                        checked={isChildChecked}
                                                        onChange={(e) => {
                                                          e.stopPropagation();
                                                          handleChildToggle(Number(child.id), item);
                                                        }}
                                                        size="small"
                                                        sx={{
                                                          p: 0,
                                                          mt: 0.1,
                                                          color: "#94a3b8",
                                                          "&.Mui-checked": { color: "#C99F65" },
                                                        }}
                                                      />

                                                      <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Box display="flex" alignItems="center" justifyContent="space-between" gap={0.5}>
                                                          <Typography
                                                            variant="body2"
                                                            sx={{
                                                              fontWeight: isChildChecked ? 700 : 600,
                                                              fontSize: "0.85rem",
                                                              color: isChildChecked ? "#7a5925" : "#1e293b",
                                                              lineHeight: 1.2,
                                                            }}
                                                          >
                                                            {child.name}
                                                          </Typography>
                                                          {isChildChecked && (
                                                            <Chip
                                                              label="Active"
                                                              size="small"
                                                              sx={{
                                                                height: 18,
                                                                fontSize: "0.68rem",
                                                                fontWeight: 700,
                                                                backgroundColor: "#fcf7ef",
                                                                color: "#7a5925",
                                                                border: "1px solid #e0c496",
                                                                borderRadius: 0.5,
                                                                "& .MuiChip-label": { px: 0.4 },
                                                              }}
                                                            />
                                                          )}
                                                        </Box>

                                                        {child.rUrl && (
                                                          <Typography
                                                            variant="caption"
                                                            sx={{
                                                              fontSize: "0.72rem",
                                                              color: "#64748b",
                                                              display: "block",
                                                              mt: 0.25,
                                                              whiteSpace: "nowrap",
                                                              overflow: "hidden",
                                                              textOverflow: "ellipsis",
                                                              fontFamily: "monospace",
                                                            }}
                                                          >
                                                            {child.rUrl}
                                                          </Typography>
                                                        )}
                                                      </Box>
                                                    </Paper>
                                                  );
                                                })}
                                              </Box>
                                            </Box>
                                          </Collapse>
                                        )}
                                      </Paper>
                                    </Box>
                                  );
                                })}
                              </Box>
                            </Box>
                          </Collapse>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
  );
};

export default UserBasedTreeView;
