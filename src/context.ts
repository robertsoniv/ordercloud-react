import { createContext } from "react";
import { IOrderCloudContext } from "./models/IOrderCloudContext";
import { OpenAPIV3 } from "openapi-types";

const INITIAL_ORDERCLOUD_CONTEXT: IOrderCloudContext = {
  isAuthenticated: false,
  isLoggedIn: false,
  logout: () => {},
  login: async (username: string, password: string, rememberMe?: boolean) => {
    return Promise.reject({username, password, rememberMe})
  },

  baseApiUrl: "https://api.ordercloud.io/v1",
  clientId: "",
  scope: [],
  customScope: [],
  allowAnonymous: false,
  token: undefined,
  xpSchemas: {} as OpenAPIV3.SchemaObject
};

export const OrderCloudContext = createContext<IOrderCloudContext>(
  INITIAL_ORDERCLOUD_CONTEXT
);
