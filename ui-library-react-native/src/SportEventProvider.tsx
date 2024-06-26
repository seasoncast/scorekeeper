import { SportEvent } from '@org/core-library';
import ISportEvent from 'core-library/src/types/ISportEvent';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
interface SportEventContextType {
  sportEvent: SportEvent | null;
  sportEventData: ISportEvent | null;
}

const SportEventContext = createContext<SportEventContextType>({
    sportEvent: null,
    sportEventData: null,
});

interface ProviderProps {
  children: ReactNode;
  sportEvent: SportEvent;
}

export const SportEventProvider: React.FC<ProviderProps> = ({ children, sportEvent }) => {
    const [sportEventData, setSportEventData] = useState<ISportEvent | null>(null);
 

    const callbackChange = (sport_data: ISportEvent) => {
        console.log('callbackChange', sport_data);
        setSportEventData({...sport_data});
    }


    useEffect(() => {
        if (sportEvent) {
            setSportEventData(sportEvent.sport_data);
            sportEvent.setCallbackChange(callbackChange)
        }
    }
    , [sportEvent]);


    useEffect(() => {
        console.log('sportEventData', sportEventData);
    }
    , [sportEventData]);
  

  return (
    <SportEventContext.Provider value={{ sportEvent, sportEventData}}>
      {children}
    </SportEventContext.Provider>
  );
};

export const useSportData = () => {
  const context = useContext(SportEventContext);
  if (context === undefined) {
    throw new Error('useSportData must be used within a SocketProvider');
  }
  return context;
};