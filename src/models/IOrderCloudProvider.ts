import { ApiRole, OrderCloudError } from "ordercloud-javascript-sdk";

export interface IOrderCloudProvider {
    baseApiUrl: string;
    clientId: string;
    scope: ApiRole[];
    customScope: string[];
    allowAnonymous: boolean;
    defaultErrorHandler?: (error:OrderCloudError) => void
  }
  