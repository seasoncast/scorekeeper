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
  View
} from 'react-native';
import BasketballCourt from '../components/BasketballCourt';

export const App = () => {
  const scrollViewRef = useRef<null | ScrollView>(null);
  const [sportEvent, setSportEvent] = useState<SportEvent>(new SportEvent({
    sport_type: 'basketball',
    scheduled_date: new Date('2021-01-01'),
  }));
  const [editorBasketball, setEditorBasketball] = useState<Basketball | null>(new Basketball(sportEvent));

  

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
            <BasketballCourt />
            <ScoreDisplayCard />
            
            <TouchableOpacity
              onPress={() => {
                editorBasketball?.addScore(sportEvent.getTeamAtIndex(0)!, 2);
              }}><Text>Team 1 +2</Text>
            </TouchableOpacity>
            <TimelineDisplay />
            
     

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
});

export default App;
