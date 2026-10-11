import {
  groupListResponseSchema,
  groupSchema,
  myGroupsResponseSchema,
  type CreateGroupInput,
  type Group,
  type GroupListParams,
  type GroupListResponse,
  type UpdateGroupInput,
} from "@urconnections/shared";
import { apiGet, apiSend, apiSendNoContent } from "../../../lib/apiClient";

// Every group call goes to our own API. Ownership is decided by the server from the
// session cookie: the client never sends a user id.

/** One page of groups matching the filters. Pass the previous page's nextCursor to get the next one. */
export const getGroups = (params: GroupListParams): Promise<GroupListResponse> =>
  apiGet("/api/groups", groupListResponseSchema, params);

export const getGroupById = (id: string): Promise<Group> => apiGet(`/api/groups/${encodeURIComponent(id)}`, groupSchema);

/** The signed-in user's own groups, newest first. */
export const getMyGroups = async (): Promise<Group[]> =>
  (await apiGet("/api/users/me/groups", myGroupsResponseSchema)).items;

export const createGroup = (input: CreateGroupInput): Promise<Group> => apiSend("POST", "/api/groups", groupSchema, input);

/** Title, description, topic, country, city. The link and platform can't be changed. */
export const updateGroup = ({ id, ...changes }: UpdateGroupInput & { id: string }): Promise<Group> =>
  apiSend("PATCH", `/api/groups/${encodeURIComponent(id)}`, groupSchema, changes);

export const deleteGroup = (id: string): Promise<void> => apiSendNoContent("DELETE", `/api/groups/${encodeURIComponent(id)}`);
