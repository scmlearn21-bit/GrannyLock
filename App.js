import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Animated,
  Easing,
  StatusBar,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CATEGORIES = {
  test: { id: 'test', label: 'Test', color: '#FF5A5F', bgLight: '#FFE5E6', defaultMins: 60, icon: 'alert-circle' },
  project: { id: 'project', label: 'Project', color: '#FFB703', bgLight: '#FFF3D1', defaultMins: 45, icon: 'construct' },
  homework: { id: 'homework', label: 'Homework', color: '#38B000', bgLight: '#E3F8D8', defaultMins: 30, icon: 'book' },
  studying: { id: 'studying', label: 'Studying', color: '#3A86FF', bgLight: '#E0ECFF', defaultMins: 30, icon: 'bulb' },
};

const GRANDMA_QUOTES = [
  "Put the phone down. Now.",
  "I didn't raise a quitter. Focus!",
  "That test won't pass itself, sweetie.",
  "Eyes on your notes. Don't test me.",
  "One more TikTok and the spatula comes out.",
];

const TABS = [
  { id: 'add', label: 'Add', icon: 'add-circle' },
  { id: 'stack', label: 'Stack', icon: 'list' },
  { id: 'sync', label: 'Sync', icon: 'school' },
];

// How big Granny is. Bump this up/down to taste.
const GRANDMA_SCALE = 1.9;

function SpatulaGrandma({ visible, quote }) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const spatulaWiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 60, useNativeDriver: true }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(spatulaWiggle, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(spatulaWiggle, { toValue: -1, duration: 250, useNativeDriver: true }),
          Animated.timing(spatulaWiggle, { toValue: 0, duration: 250, useNativeDriver: true }),
        ])
      ).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const rotateSpatula = spatulaWiggle.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-14deg', '14deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.grandmaOverlay, { transform: [{ translateY: slideAnim }] }]}
    >
      <View style={styles.speechBubble}>
        <Text style={styles.speechText}>“{quote}”</Text>
        <View style={styles.speechTail} />
      </View>

      <View style={[styles.grandmaContainer, { transform: [{ scale: GRANDMA_SCALE }] }]}>
        <View style={styles.hairBun} />
        <View style={styles.hairBase} />

        <View style={styles.grandmaFace}>
          <View style={styles.browLeft} />
          <View style={styles.browRight} />
          <View style={styles.glassesRow}>
            <View style={styles.glassLens}><View style={styles.pupil} /></View>
            <View style={styles.glassBridge} />
            <View style={styles.glassLens}><View style={styles.pupil} /></View>
          </View>
          <View style={styles.grandmaMouth} />
          <View style={[styles.cheek, { left: 10 }]} />
          <View style={[styles.cheek, { right: 10 }]} />
        </View>

        <View style={styles.cardigan}>
          <View style={styles.pearlsRow}>
            <View style={styles.pearl} />
            <View style={styles.pearl} />
            <View style={styles.pearl} />
            <View style={styles.pearl} />
          </View>
        </View>
