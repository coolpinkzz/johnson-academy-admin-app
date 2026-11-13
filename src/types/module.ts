/** Valid values for module `type` (backend enum). */
export const MODULE_TYPES = [
  "theory",
  "technical",
  "learning",
  "others",
] as const;

export type ModuleType = (typeof MODULE_TYPES)[number];

export interface IModuleResource {
  file?: string;
  key?: string;
}

export interface IModule {
  id?: string;
  _id?: string;
  syllabusId?: string;
  type: ModuleType;
  title: string;
  description: string;
  session: number;
  seq?: number;
  resources?: IModuleResource[];
  createdAt?: string;
  updatedAt?: string;
}

export type IModuleCreate = Omit<
  IModule,
  "id" | "_id" | "createdAt" | "updatedAt"
>;

export type IModuleUpdate = Partial<IModuleCreate>;

export interface ModuleResponse {
  results: IModule[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

export function getModuleDocumentId(
  module: Partial<IModule>,
): string | undefined {
  return module.id ?? module._id;
}
