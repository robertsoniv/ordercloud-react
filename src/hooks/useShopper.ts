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
  const refetchWorksheet = useCallback(() => {
    queryClient.refetchQueries({
      queryKey: ["worksheet"],
    });
  }, []);

  const { data: orderWorksheet } = useAuthQuery({
    queryKey: ["worksheet"],
    queryFn: async () => await Cart.GetOrderWorksheet(),
  }) as UseQueryResult<RequiredDeep<OrderWorksheet>, OrderCloudError>;

  const { mutateAsync: addCartLineItem } = useAuthMutation({
    mutationKey: ["addCartLineItem"],
    mutationFn: async (lineItem: LineItem) =>
      await Cart.CreateLineItem(lineItem),
    onSuccess: () => refetchWorksheet(),
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
    onSuccess: () => refetchWorksheet(),
  });

  const { mutateAsync: addCartPromo } = useAuthMutation({
    mutationKey: ["addCartPromo"],
    mutationFn: async (promoCode: string) => await Cart.AddPromotion(promoCode),
    onSuccess: () => refetchWorksheet(),
  });

  const { mutateAsync: removeCartPromo } = useAuthMutation({
    mutationKey: ["removeCartPromo"],
    mutationFn: async (promoCode: string) =>
      await Cart.DeletePromotion(promoCode),
    onSuccess: () => refetchWorksheet(),
  });

  const { mutateAsync: applyPromotions } = useAuthMutation({
    mutationKey: ["addCartPromo"],
    mutationFn: async () => await Cart.ApplyPromotions(),
    onSuccess: () => refetchWorksheet(),
  });

  const { mutateAsync: submitCart } = useAuthMutation({
    mutationKey: ["submitCart"],
    mutationFn: async () => {
      await Cart.Submit()
      return
    },
    onSuccess: () => refetchWorksheet(),
  });

  const { mutateAsync: deleteCart } = useAuthMutation({
    mutationKey: ["deleteCart"],
    mutationFn: async () => await Cart.Delete(),
    onSuccess: () => refetchWorksheet(),
  });

  return useMemo(() => {
    return {
      orderWorksheet,
      addCartLineItem,
      patchCartLineItem,
      addCartPromo,
      submitCart,
      deleteCart,
      removeCartPromo,
      applyPromotions,
    };
  }, [
    orderWorksheet,
    addCartLineItem,
    patchCartLineItem,
    addCartPromo,
    submitCart,
    deleteCart,
    removeCartPromo,
    applyPromotions,
  ]);
};

export default useShopper;
