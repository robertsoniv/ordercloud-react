import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  Auth,
  Configuration,
  OrderCloudError,
  Tokens,
} from "ordercloud-javascript-sdk";
import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { OrderCloudContext } from "./context";
import { IOrderCloudProvider } from "./models/IOrderCloudProvider";
import { asyncStoragePersister, queryClient } from "./query";
import { isAnonToken } from "./utils";
import axios from "axios";

let interceptorSetup = false;
const OrderCloudProvider: FC<PropsWithChildren<IOrderCloudProvider>> = ({
  children,
  baseApiUrl,
  clientId,
  scope,
  customScope,
  allowAnonymous,
  xpSchemas,
  autoApplyPromotions,
  defaultErrorHandler,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | undefined>();

  const handleLogout = useCallback(() => {
    queryClient.clear();
    setIsAuthenticated(false);
    setIsLoggedIn(false);
    setToken(undefined);
    Tokens.RemoveAccessToken();
    Tokens.RemoveRefreshToken();
  }, []);

  const handleLogin = useCallback(
    async (username: string, password: string, rememberMe?: boolean) => {
      try {
        const response = await Auth.Login(
          username,
          password,
          clientId,
          scope,
          customScope
        );
        const { access_token, refresh_token } = response;
        Tokens.SetAccessToken(access_token);
        setToken(access_token);
        if (rememberMe && refresh_token) {
          Tokens.SetRefreshToken(refresh_token);
        }
        setIsAuthenticated(true);
        setIsLoggedIn(true);
        queryClient.clear();
        return response;
      } catch (ex) {
        return Promise.reject(ex as OrderCloudError);
      }
    },
    [clientId, scope, customScope]
  );

  const verifyToken = useCallback(async () => {
    const token = await Tokens.GetValidToken();

    if (token) {
      const isAnon = isAnonToken(token);
      if (isAnon && !allowAnonymous) {
        handleLogout();
        return;
      }
      setIsAuthenticated(true);
      setToken(token);
      if (!isAnon) setIsLoggedIn(true);
      return;
    }

    if (!allowAnonymous) {
      return;
    }

    const { access_token, refresh_token } = await Auth.Anonymous(
      clientId,
      scope,
      customScope
    );

    Tokens.SetAccessToken(access_token);
    Tokens.SetRefreshToken(refresh_token);
    setIsAuthenticated(true);
    setIsLoggedIn(false);
  }, [allowAnonymous, clientId, scope, customScope, handleLogout]);

  const newAnonSession = useCallback(async () => {
    const token = await Tokens.GetValidToken();
    const isAnon = isAnonToken(token);
    if (isAnon) {
      try {
        const { access_token, refresh_token } = await Auth.Anonymous(
          clientId,
          scope,
          customScope
        );

        Tokens.SetAccessToken(access_token);
        Tokens.SetRefreshToken(refresh_token);
        setIsAuthenticated(true);
        setIsLoggedIn(false);
      } catch (error) {
        console.log(error);
        setIsAuthenticated(false);
        setIsLoggedIn(false);
      }
    } else {
      console.warn("Improper useage of `newAnonSession`: User is not anonymous.");
    }
  }, [clientId, customScope, scope])

  useEffect(() => {
    Configuration.Set({
      cookieOptions: {
        prefix: clientId,
      },
      baseApiUrl,
      clientID: clientId,
    });

    if (!interceptorSetup) {
      axios.interceptors.request.use(
        async (config) => {
          await verifyToken();
          const verifiedToken = Tokens.GetAccessToken();
          config.headers.Authorization = `Bearer ${verifiedToken}`;
          // Do something before request is sent
          return config;
        },
        function (error) {
          // Do something with request error
          return Promise.reject(error);
        }
      );
    } else {
      interceptorSetup = true;
    }

    if (!isAuthenticated) {
      verifyToken();
    }
  }, [baseApiUrl, clientId, isAuthenticated, verifyToken]);

  const ordercloudContext = useMemo(() => {
    return {
      baseApiUrl,
      clientId,
      scope,
      customScope,
      allowAnonymous,
      isAuthenticated,
      isLoggedIn,
      newAnonSession,
      token,
      xpSchemas,
      autoApplyPromotions,
      logout: handleLogout,
      login: handleLogin,
      defaultErrorHandler,
    };
  }, [
    baseApiUrl,
    clientId,
    scope,
    customScope,
    allowAnonymous,
    isAuthenticated,
    isLoggedIn,
    newAnonSession,
    token,
    xpSchemas,
    autoApplyPromotions,
    handleLogout,
    handleLogin,
    defaultErrorHandler,
  ]);

  return (
    <OrderCloudContext.Provider value={ordercloudContext}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        {children}
      </PersistQueryClientProvider>
    </OrderCloudContext.Provider>
  );
};

export default OrderCloudProvider;
