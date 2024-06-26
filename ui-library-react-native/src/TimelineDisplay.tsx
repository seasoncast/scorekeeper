import { StyleSheet, Text, View } from 'react-native';
import { useSportData } from './SportEventProvider';

export default function TimelineDisplay () {
    const {sportEventData} = useSportData()
    const reverseTimeline = [...sportEventData?.timeline ?? []].reverse()
    return <View style={styles.container}>
        {reverseTimeline.map((timelineEvent, index) => {
            return  (
            <View  style={styles.timelineSection} key={index}
            >
            <Text>{timelineEvent.description_en}</Text>
            <Text>{timelineEvent.action_id}</Text>
            <Text>{new Date(timelineEvent.time_ms).toLocaleTimeString()}</Text>
            </View>
            )
        }
        )}

    </View>
}

const styles = StyleSheet.create({
    container: {
 
        padding: 10,

    },
    timelineSection: {
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 10,
        paddingBottom: 10,


    },

});