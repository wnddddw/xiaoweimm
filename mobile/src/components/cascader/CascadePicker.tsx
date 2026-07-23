import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { colors } from '../../theme';

interface CascadePickerProps {
  visible: boolean;
  data: Record<string, string[]>;
  onSelect: (parent: string, child: string) => void;
  onClose: () => void;
  title?: string;
}

export default function CascadePicker({ visible, data, onSelect, onClose, title }: CascadePickerProps) {
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const keys = Object.keys(data);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>{title || 'Select'}</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
          </View>
          <View style={styles.columns}>
            <ScrollView style={styles.col}>
              {keys.map(k => (
                <TouchableOpacity key={k} style={[styles.item, selectedParent === k && styles.selected]} onPress={() => setSelectedParent(k)}>
                  <Text style={[styles.itemText, selectedParent === k && styles.selectedText]}>{k}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView style={styles.col}>
              {selectedParent && data[selectedParent]?.map(v => (
                <TouchableOpacity key={v} style={styles.item} onPress={() => { onSelect(selectedParent!, v); onClose(); }}>
                  <Text style={styles.itemText}>{v}</Text>
                </TouchableOpacity>
              ))}
              {!selectedParent && <Text style={styles.empty}>← Select category</Text>}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  panel: { backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 16, fontWeight: '700' },
  close: { fontSize: 18, color: colors.textTertiary },
  columns: { flexDirection: 'row', height: 320 },
  col: { flex: 1, borderRightWidth: 1, borderRightColor: colors.borderLight },
  item: { padding: 14, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  selected: { backgroundColor: colors.primarySoft },
  itemText: { fontSize: 14, color: colors.text },
  selectedText: { color: colors.primary, fontWeight: '600' },
  empty: { padding: 20, color: colors.textTertiary, textAlign: 'center' },
});
