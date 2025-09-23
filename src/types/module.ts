export interface IModuleResource {
  file: string;
  key: string;
}

export interface IModule {
  id?: string;
  syllabusId?: string;
  type: "theory" | "technical" | "learning" | "others";
  title: string;
  description: string;
  session: number;
  resources: IModuleResource[];
}

interface ModuleResponse {
  results: IModule[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}
