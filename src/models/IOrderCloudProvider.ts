import { ApiRole, OrderCloudError, SdkConfiguration } from "ordercloud-javascript-sdk";
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
    configurationOverrides?: Omit<SdkConfiguration, 'baseApiUrl' | 'clientID'>
    defaultErrorHandler?: (error:OrderCloudError, context:Omit<IOrderCloudContext, "defaultErrorHandler">) => void
  }
  