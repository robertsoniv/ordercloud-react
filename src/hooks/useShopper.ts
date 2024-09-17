import { useCallback, useMemo } from "react";
import useAuthQuery from "./useAuthQuery";
import {
  Cart,
  LineItem,
  OrderCloudError,
  OrderWorksheet,
  PartialDeep,
  RequiredDeep,
} from "ordercloud-javascript-sdk";
import { UseQueryResult } from "@tanstack/react-query";
import useAuthMutation from "./useAuthMutation";
import { queryClient } from "..";

const useShopper = () => {
  const invalidateWorksheet = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["worksheet"],
    });
  }, []);

  const {
    data: orderWorksheet,
    isLoading,
    isPending,
  } = useAuthQuery({
    queryKey: ["worksheet"],
    queryFn: async () => await Cart.GetOrderWorksheet(),
  }) as UseQueryResult<RequiredDeep<OrderWorksheet>, OrderCloudError>;

  const { mutateAsync: addCartLineItem } = useAuthMutation({
    mutationKey: ["addCartLineItem"],
    mutationFn: async (lineItem: LineItem) =>
      await Cart.CreateLineItem(lineItem),
    onSuccess: () => invalidateWorksheet(),
  });

  const { mutateAsync: patchCartLineItem } = useAuthMutation({
    mutationKey: ["patchCartLineItem"],
    mutationFn: async ({
      ID,
      lineItem,
    }: {
      ID: string;
      lineItem: PartialDeep<LineItem>;
    }) => await Cart.PatchLineItem(ID, lineItem),
    onSuccess: () => invalidateWorksheet(),
  });

  const { mutateAsync: deleteCartLineItem } = useAuthMutation({
    mutationKey: ["deleteCartLineItem"],
    mutationFn: async (ID: string) => await Cart.DeleteLineItem(ID),
    onSuccess: () => invalidateWorksheet(),
  });

  const { mutateAsync: addCartPromo } = useAuthMutation({
    mutationKey: ["addCartPromo"],
    mutationFn: async (promoCode: string) => await Cart.AddPromotion(promoCode),
    onSuccess: () => invalidateWorksheet(),
  });

  const { mutateAsync: removeCartPromo } = useAuthMutation({
    mutationKey: ["removeCartPromo"],
    mutationFn: async (promoCode: string) =>
      await Cart.DeletePromotion(promoCode),
    onSuccess: () => invalidateWorksheet(),
  });

  const { mutateAsync: applyPromotions } = useAuthMutation({
    mutationKey: ["addCartPromo"],
    mutationFn: async () => await Cart.ApplyPromotions(),
    onSuccess: () => invalidateWorksheet(),
  });

  const { mutateAsync: submitCart } = useAuthMutation({
    mutationKey: ["submitCart"],
    mutationFn: async () => {
      await Cart.Submit();
      return;
    },
    onSuccess: () => invalidateWorksheet(),
  });

  const { mutateAsync: deleteCart } = useAuthMutation({
    mutationKey: ["deleteCart"],
    mutationFn: async () => await Cart.Delete(),
    onSuccess: () => invalidateWorksheet(),
  });

  return useMemo(() => {
    return {
      orderWorksheet,
      worksheetLoading: isPending || isLoading,
      addCartLineItem,
      patchCartLineItem,
      deleteCartLineItem,
      addCartPromo,
      submitCart,
      deleteCart,
      removeCartPromo,
      applyPromotions,
    };
  }, [
    orderWorksheet,
    isPending,
    isLoading,
    addCartLineItem,
    patchCartLineItem,
    deleteCartLineItem,
    addCartPromo,
    submitCart,
    deleteCart,
    removeCartPromo,
    applyPromotions,
  ]);
};

export default useShopper;
