import { apiClient } from "./client";
import type { Modifier, ModifierGroup } from "@/types/models";

export interface ModifierGroupPayload {
  name: string;
  is_required?: boolean;
  max_selections?: number;
  sort_order?: number;
}

export interface ModifierPayload {
  name: string;
  extra_price: number;
  is_available?: boolean;
  sort_order?: number;
}

export const modifierGroupsApi = {

  list: (menuItemId: number) =>
    apiClient.get<ModifierGroup[]>(`/menu-items/${menuItemId}/modifier-groups`).then((r) => r.data),

  createGroup: (menuItemId: number, payload: ModifierGroupPayload) =>
    apiClient
      .post<ModifierGroup>(`/menu-items/${menuItemId}/modifier-groups`, payload)
      .then((r) => r.data),

  updateGroup: (menuItemId: number, groupId: number, payload: Partial<ModifierGroupPayload>) =>
    apiClient
      .put<ModifierGroup>(`/menu-items/${menuItemId}/modifier-groups/${groupId}`, payload)
      .then((r) => r.data),

  removeGroup: (menuItemId: number, groupId: number) =>
    apiClient
      .delete<{ message: string }>(`/menu-items/${menuItemId}/modifier-groups/${groupId}`)
      .then((r) => r.data),

 

  createModifier: (menuItemId: number, groupId: number, payload: ModifierPayload) =>
    apiClient
      .post<Modifier>(`/menu-items/${menuItemId}/modifier-groups/${groupId}/modifiers`, payload)
      .then((r) => r.data),

  updateModifier: (menuItemId: number, groupId: number, modifierId: number, payload: Partial<ModifierPayload>) =>
    apiClient
      .put<Modifier>(`/menu-items/${menuItemId}/modifier-groups/${groupId}/modifiers/${modifierId}`, payload)
      .then((r) => r.data),

  removeModifier: (menuItemId: number, groupId: number, modifierId: number) =>
    apiClient
      .delete<{ message: string }>(`/menu-items/${menuItemId}/modifier-groups/${groupId}/modifiers/${modifierId}`)
      .then((r) => r.data),
};
