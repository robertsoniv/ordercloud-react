import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Auth, Configuration, OrderCloudError, Tokens } from "ordercloud-javascript-sdk";
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

const OrderCloudProvider: FC<PropsWithChildren<IOrderCloudProvider>> = ({
  children,
  baseApiUrl,
  clientId,
  scope,
  customScope,
  allowAnonymous,
  defaultErrorHandler,
}) => {
  useEffect(() => {
    Configuration.Set({
      cookieOptions: {
        prefix: clientId
      },
      baseApiUrl,
      clientID: clientId,
    });
  }, [baseApiUrl, clientId]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = useCallback(() => {
    queryClient.clear();
    setIsAuthenticated(false);
    setIsLoggedIn(false);
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
  }, [
    allowAnonymous,
    clientId,
    scope,
    customScope,
    handleLogout,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      verifyToken();
    }
  }, [isAuthenticated, verifyToken]);

  const ordercloudContext = useMemo(() => {
    return {
      baseApiUrl,
      clientId,
      scope,
      customScope,
      allowAnonymous,
      isAuthenticated,
      isLoggedIn,
      logout: handleLogout,
      login: handleLogin,
      defaultErrorHandler,
    };
  }, [
    allowAnonymous,
    baseApiUrl,
    clientId,
    customScope,
    handleLogout,
    isAuthenticated,
    isLoggedIn,
    handleLogin,
    scope,
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
