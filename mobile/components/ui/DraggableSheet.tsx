import React, { useRef, useEffect, useCallback } from 'react';
import {
  Animated, PanResponder, StyleSheet, View, Modal,
  TouchableWithoutFeedback, StyleProp, ViewStyle, Dimensions,
} from 'react-native';
import { Colors } from '../../constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
}

const DISMISS_THRESHOLD = 120;
const DISMISS_VELOCITY = 0.5;
const HANDLE_ZONE = 64;
const SCREEN_H = Dimensions.get('window').height;

export default function DraggableSheet({ visible, onClose, children, sheetStyle }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const touchStartY = useRef(0);

  // Keep a ref to onClose so panResponder closure never goes stale
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Slide in when opened
  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_H);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 3,
        speed: 18,
      }).start();
    }
  }, [visible]);

  // Slide out then fire onClose
  const handleClose = useCallback(() => {
    Animated.timing(translateY, {
      toValue: SCREEN_H,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onCloseRef.current());
  }, [translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        touchStartY.current = evt.nativeEvent.locationY;
        return evt.nativeEvent.locationY < HANDLE_ZONE;
      },
      // Never steal scroll gestures from children (ScrollView etc.)
      onMoveShouldSetPanResponder: () => false,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) translateY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > DISMISS_THRESHOLD || vy > DISMISS_VELOCITY) {
          Animated.timing(translateY, {
            toValue: SCREEN_H,
            duration: 220,
            useNativeDriver: true,
          }).start(() => onCloseRef.current());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  // Backdrop opacity is derived from translateY — fades in as sheet slides up,
  // fades out as sheet slides down (including during drag)
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, SCREEN_H * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Backdrop — tap to close, opacity tied to sheet position */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        {/* Sheet — panHandlers on outer view, only activates in top HANDLE_ZONE */}
        <Animated.View {...panResponder.panHandlers} style={[styles.sheet, sheetStyle, { transform: [{ translateY }] }]}>
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
});
