import React, { createContext, useState, useEffect, useContext } from "react";
import apiClient from "../config/apiClient";
import { COUNTRIES } from "../utils/countryData";

const CountryContext = createContext();

export const CountryProvider = ({ children }) => {
  const [countries, setCountries] = useState(COUNTRIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await apiClient.get("/api/settings/countries");
        if (Array.isArray(response.data) && response.data.length > 0) {
          const mappedCountries = response.data.map(apiItem => {
            // Find local audited data for this country
            const localItem = COUNTRIES.find(c => c.code === apiItem.code);
            return {
              ...apiItem,
              country: apiItem.country || apiItem.label || localItem?.country || "",
              // Prioritize local audited lengths to prevent issues with stale API data
              minLength: localItem?.minLength || apiItem.minLength,
              maxLength: localItem?.maxLength || apiItem.maxLength,
            };
          });
          setCountries(mappedCountries);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error("Failed to fetch countries:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  return (
    <CountryContext.Provider value={{ countries, loading }}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountries = () => useContext(CountryContext);
