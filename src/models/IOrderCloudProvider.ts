import { ApiRole, OrderCloudError } from "ordercloud-javascript-sdk";
import { IOrderCloudContext } from "./IOrderCloudContext";
import { OpenAPIV3 } from "openapi-types";

export interface IOrderCloudProvider {
    baseApiUrl: string;
    clientId: string;
    scope: ApiRole[];
    customScope: string[];
    allowAnonymous: boolean;
    xpSchemas?: OpenAPIV3.SchemaObject;
    autoApplyPromotions?: boolean,
    defaultErrorHandler?: (error:OrderCloudError, context:Omit<IOrderCloudContext, "defaultErrorHandler">) => void
  }
  