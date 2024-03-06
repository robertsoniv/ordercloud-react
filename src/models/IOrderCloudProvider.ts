import { ApiRole, OrderCloudError } from "ordercloud-javascript-sdk";
import { IOrderCloudContext } from "./IOrderCloudContext";

export interface IOrderCloudProvider {
    baseApiUrl: string;
    clientId: string;
    scope: ApiRole[];
    customScope: string[];
    allowAnonymous: boolean;
    defaultErrorHandler?: (error:OrderCloudError, context:Omit<IOrderCloudContext, "defaultErrorHandler">) => void
  }
  