export interface IPackage {
  name: string;
  'repository.url': string;
  keywords?: string[];
  gitHead?: string;
}

export interface IProject {
  id: string;
  name: string;
  repositoryUrl: string;
  commitIsh?: string;
}
