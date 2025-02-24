import { Basketball } from '@org/core-library';
import React, { useRef, useState } from 'react';
import {
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSportData } from '@org/ui-library-react-native';

export const BasketballCourt: React.FC = () => {
  const { sportEventData, sportEvent } = useSportData();

  if (!sportEventData || !sportEvent) {
    return null;
  }
  
  const editorBasketball = new Basketball(sportEvent);
  const teamShooting = sportEvent.getTeamAtIndex(0);
  const teamDefending = sportEvent.getTeamAtIndex(1);

  if (!teamShooting || !teamDefending) {
    return null;
  }

  const teamShootingId = teamShooting.id;
  const teamDefendingId = teamDefending.id;
  const [shots, setShots] = useState<Array<[number, number]>>([]);
  const courtRef = useRef(null);
  const COURT_HEIGHT = 400;
  const COURT_WIDTH = COURT_HEIGHT * 1.8666937614;

  const handleCourtPress = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    
    courtRef.current?.measure((x: number, y: number, width: number, height: number, pageXOffset: number, pageYOffset: number) => {
      const xPercent = (pageX - pageXOffset) / width;
      const yPercent = (pageY - pageYOffset) / height;
      console.log('Coordinates:', pageX, pageY, pageXOffset, pageYOffset, width, height);

      editorBasketball?.shotMissed({
        teamShooting: teamShootingId,
        teamDefending: teamDefendingId,
        position: [xPercent, yPercent],
      });

      console.log('shot missed', xPercent, yPercent);
      
      const newShots = [...shots, [xPercent, yPercent]];
      setShots(newShots);
    });
  }

 
  

  return (
    <View style={styles.courtContainer}>
      <TouchableOpacity onPress={handleCourtPress}>
        <ImageBackground
          ref={courtRef}
          source={require('./../../assets/basketball.jpeg')}
          style={{
            width: COURT_WIDTH,
            height: COURT_HEIGHT,
          }}
        >
          {sportEventData.stats.team_data?.map((team_data, index) => (
            <>
          {team_data.shot_position?.map((shot, index) => (
            <View
              key={index}
              style={{
                position: 'absolute',
                left: shot[0] * COURT_WIDTH - 5,
                top: shot[1] * COURT_HEIGHT - 5,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: 'blue',
              }}
            />
          ))}
          </>
          ))}
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  courtContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BasketballCourt;
