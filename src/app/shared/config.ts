
export interface Sort { label: string; field: string; dir: string; entity?: string[]};

export class Configuration {
  context: string;
  defaultLang: string;
  login: string;
  instance: string;
  deployPath: string;
  authBaseUrl: string;
  keycloak: {
		loginType: string;
		logoutUrl: string
  };

}
