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
        const response = await apiClient.get("/settings/countries");
        if (Array.isArray(response.data)) {
          setCountries(response.data);
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
