import React, { createContext, useContext } from 'react';

export const AppContext = createContext<any>(null);

export function useApp() {
  return useContext(AppContext);
}
