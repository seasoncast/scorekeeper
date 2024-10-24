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
  Dimensions
} from 'react-native';
import Canvas from 'react-native-canvas';

export const App = () => {
  const scrollViewRef = useRef<null | ScrollView>(null);
  const [sportEvent, setSportEvent] = useState<SportEvent>(new SportEvent({
    sport_type: 'basketball',
    scheduled_date: new Date('2021-01-01'),
  }));
  const [editorBasketball, setEditorBasketball] = useState<Basketball | null>(new Basketball(sportEvent));
  const canvasRef = useRef<Canvas>(null);
  const [canvasHeight] = useState(400);
  const [canvasWidth] = useState(400 * 1.8666937614);

  const drawCourt = (canvas: Canvas) => {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = '../assets/basketball.jpeg';
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      drawShotsOnCourt(canvas);
    };
  };

  const drawShotsOnCourt = (canvas: Canvas) => {
    const ctx = canvas.getContext('2d');
    const shots = sportEvent.getStats().team_data[0]?.shot_position;
    if (!shots) return;
    
    for (let i = 0; i < shots.length; i++) {
      const x = shots[i][0] * canvasWidth;
      const y = shots[i][1] * canvasHeight;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'blue';
      ctx.fill();
    }
  };

  const handleCanvasPress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const xPercent = locationX / canvasWidth;
    const yPercent = locationY / canvasHeight;
    
    editorBasketball?.shotMissed({
      teamShooting: sportEvent.getTeamAtIndex(0)!.id,
      teamDefending: sportEvent.getTeamAtIndex(1)!.id,
      position: [xPercent, yPercent],
    });

    if (canvasRef.current) {
      drawCourt(canvasRef.current);
    }
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
              <Canvas
                ref={canvasRef}
                style={{
                  width: canvasWidth,
                  height: canvasHeight,
                }}
                onTouchStart={handleCanvasPress}
              />
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
