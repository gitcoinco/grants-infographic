"use client";
import React, { useState, useEffect } from "react";

export const useTokenPrice = (tokenId: string | undefined) => {
  const [tokenPrice, setTokenPrice] = useState<number>();
  const [error, setError] = useState<Error | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const tokenPriceEndpoint = `https://api.redstone.finance/prices?symbol=${tokenId}&provider=redstone&limit=1`;
    fetch(tokenPriceEndpoint)
      .then((resp) => {
        if (resp.ok) {
          return resp.json();
        } else {
          return resp.text().then((text) => {
            throw new Error(text);
          });
        }
      })
      .then((data) => {
        if (data && data.length > 0) {
          setTokenPrice(data[0].value);
        } else {
          throw new Error(`No data returned: ${data.toString()}`);
        }
      })
      .catch((err) => {
        console.log("error fetching token price", {
          tokenId,
          tokenPriceEndpoint,
          err,
        });
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tokenId]);

  if (!tokenId) {
    return {
      data: 0,
      error,
      loading,
    };
  }

  return {
    data: tokenPrice,
    error,
    loading,
  };
};
