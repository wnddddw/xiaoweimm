import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { dealStages } from '../../utils/constants';

interface PipelineProps { currentStage: string; stageTime?: Record<string, string>; }

export default function Pipeline({ currentStage, stageTime }: PipelineProps) {
  const currentIdx = dealStages.findIndex(s => s.id === currentStage);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {dealStages.map((s, i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <View key={s.id} style={styles.stageWrap}>
            <View style={[styles.stage, isDone && styles.done, isCurrent && styles.current]}>
              <Text style={styles.icon}>{s.icon}</Text>
              <Text style={[styles.label, isDone && styles.doneText, isCurrent && styles.currentText]}>{s.label}</Text>
              {stageTime?.[s.id] ? <Text style={styles.date}>{stageTime[s.id].slice(0, 10)}</Text> : null}
            </View>
            {i < dealStages.length - 1 && <Text style={[styles.arrow, isDone && styles.doneText]}>›</Text>}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', paddingVertical: 8 },
  stageWrap: { flexDirection: 'row', alignItems: 'center' },
  stage: { alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 2, borderColor: '#e0e2e6', minWidth: 80, backgroundColor: '#fff' },
  done: { backgroundColor: '#d5f5e3', borderColor: '#1e8449' },
  current: { backgroundColor: '#d4e4fd', borderColor: '#1a44aa' },
  icon: { fontSize: 20 },
  label: { fontSize: 11, fontWeight: '600', color: '#555', marginTop: 4, textAlign: 'center' },
  doneText: { color: '#1e8449' },
  currentText: { color: '#1a44aa' },
  date: { fontSize: 9, color: '#999', marginTop: 2 },
  arrow: { fontSize: 20, color: '#ccc', marginHorizontal: 4 },
});
