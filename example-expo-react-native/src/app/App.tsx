/* eslint-disable jsx-a11y/accessible-emoji */
import { Basketball, Player, SportEvent, Team } from '@org/core-library';
import { ScoreDisplayCard, SportEventProvider, TimelineDisplay } from '@org/ui-library-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ImageBackground
} from 'react-native';

export const App = () => {
  const scrollViewRef = useRef<null | ScrollView>(null);
  const [sportEvent, setSportEvent] = useState<SportEvent>(new SportEvent({
    sport_type: 'basketball',
    scheduled_date: new Date('2021-01-01'),
  }));
  const [editorBasketball, setEditorBasketball] = useState<Basketball | null>(new Basketball(sportEvent));
  const [shots, setShots] = useState<Array<[number, number]>>([]);
  const COURT_HEIGHT = 400;
  const COURT_WIDTH = COURT_HEIGHT * 1.8666937614;

  const handleCourtPress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const xPercent = locationX / COURT_WIDTH;
    const yPercent = locationY / COURT_HEIGHT;
    
    editorBasketball?.shotMissed({
      teamShooting: sportEvent.getTeamAtIndex(0)!.id,
      teamDefending: sportEvent.getTeamAtIndex(1)!.id,
      position: [xPercent, yPercent],
    });

    const newShots = [...shots, [xPercent, yPercent]];
    setShots(newShots);
  };



  const setupEvent = () => {
const Team1 = new Team('Team 1');
const player1 = new Player('Player 1');
Team1.addPlayer(player1);
const Team2 = new Team('Team 2');

sportEvent.addTeam(Team1);
sportEvent.addTeam(Team2);


  };

  useEffect(() => {
    setupEvent();
  }
  , []);


  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <ScrollView
          ref={(ref) => {
            scrollViewRef.current = ref;
          }}
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}
        >
         <View>
          <SportEventProvider sportEvent={sportEvent}>
            <ScoreDisplayCard />
            <TouchableOpacity
              onPress={() => {
                editorBasketball?.addScore(sportEvent.getTeamAtIndex(0)!, 2);
              }}><Text>Team 1 +2</Text>
            </TouchableOpacity>
            <TimelineDisplay />
            
            <View style={styles.courtContainer}>
              <TouchableOpacity onPress={handleCourtPress}>
                <ImageBackground
                  source={require('../assets/basketball.jpeg')}
                  style={{
                    width: COURT_WIDTH,
                    height: COURT_HEIGHT,
                  }}
                >
                  {shots.map((shot, index) => (
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
                </ImageBackground>
              </TouchableOpacity>
            </View>

            </SportEventProvider>
         </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};
const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#ffffff',
  },
  courtContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
