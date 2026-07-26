/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const CityContext = createContext(null);

export const CITIES = [
  { name: 'Bengaluru', icon: '🌆', active: true },
  { name: 'Mumbai', icon: '🏙️', active: true },
  { name: 'Delhi NCR', icon: '🏛️', active: true },
  { name: 'Chennai', icon: '🏖️', active: true },
  { name: 'Pune', icon: '⛰️', active: true },
  { name: 'Hyderabad', icon: '🏰', active: true }
];

export const CityProvider = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem('rentease_city') || 'Bengaluru';
  });

  const [showCityModal, setShowCityModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('rentease_city', selectedCity);
  }, [selectedCity]);

  return (
    <CityContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        showCityModal,
        setShowCityModal,
        cities: CITIES
      }}
    >
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};

export default CityContext;
