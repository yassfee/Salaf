import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { Colors } from '../../constants/colors';

interface CardContainerProps extends ViewProps {
  children: React.ReactNode;
}

export default function CardContainer({ children, style, ...props }: CardContainerProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});
