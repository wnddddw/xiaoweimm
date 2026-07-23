import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { dealStages } from '../../utils/constants';
import { colors } from '../../theme';

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
  stage: { alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 2, borderColor: colors.muted, minWidth: 80, backgroundColor: colors.white },
  done: { backgroundColor: colors.successSoft, borderColor: colors.success },
  current: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  icon: { fontSize: 20 },
  label: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  doneText: { color: colors.success },
  currentText: { color: colors.primary },
  date: { fontSize: 9, color: colors.textTertiary, marginTop: 2 },
  arrow: { fontSize: 20, color: colors.border, marginHorizontal: 4 },
});
