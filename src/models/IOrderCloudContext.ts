import { AccessToken, ApiRole, OrderCloudError } from "ordercloud-javascript-sdk";

export interface IOrderCloudContext {
  /**
   * Signifies when a valid token is available.
   * This will block all auth queries by default, mutation interaction will
   * be blocked by the login modal.
   */
  isAuthenticated: boolean;
  /**
   * Signifies when an authenticated user is registered.
   */
  isLoggedIn: boolean;
  /**
   * Clears all tokens from the OrderCloud JS SDK and conditionally will
   * get a new anonymous token based on allowAnonymous
   */
  logout: () => void;
  /**
   * authenticates using the configured client ID and username / password
   */
  login: (username:string, password:string, rememberMe?:boolean) => Promise<AccessToken>;

  baseApiUrl: string;
  clientId: string;
  scope: ApiRole[];
  customScope: string[];
  allowAnonymous: boolean;
  defaultErrorHandler?: (error:OrderCloudError) => void;
}
