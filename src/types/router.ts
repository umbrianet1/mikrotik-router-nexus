
export interface Router {
  id: number;
  name: string;
  ip: string;
  status: string;
  version: string;
  lastBackup: string;
  username?: string;
  password?: string;
  identity?: string;
  method?: 'rest' | 'api' | 'ssh';
}

export interface RouterManagementProps {
  routers: Router[];
  setRouters: (routers: Router[]) => void;
}
