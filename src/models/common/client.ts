export type MethodType = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface RequestData<T> {
  data?: T | T[];
  token?: string;
  headers?: { [key: string]: string };
  absoluteUrl?: boolean;
  method?: MethodType;
  transform?: boolean;
  customBaseUrl?: boolean;
  id?: string | number;

  page?: number;
  limit?: number;
  userCode?: string;
  email?: string;
  isFormData?: boolean;
}

export interface ServerData<T> {
  items: T[];
}

export interface SuccessResponse {
  success: true;
}

export type ServerResponse<T> = T & T[] & ServerData<T> & SuccessResponse;

export type RequestFields = string[];
export interface IFieldsAndFilters<T> {
  fields?: RequestFields;
  filters?: T & { sortField?: string; sortOrder?: string };
  offset?: number;
  limit?: number;
}
