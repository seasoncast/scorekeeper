import { StyleSheet, Text, View } from 'react-native';
import { useSportData } from './SportEventProvider';

export default function ScoreDisplayCard () {
    const {sportEventData} = useSportData()

    return <View style={styles.container}>
        {sportEventData?.stats.team_data.map((team) => {
            return  (
            <View  style={styles.teamScoreRow}
            > <Text style={styles.textTeamName}>{team.name}</Text>
            <Text>{team.score || 0}</Text>
            </View>
            )
        }
        )}
    </View>
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        padding: 10,
    },
    teamScoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    textTeamName: {
        flexGrow: 1,
    },

});