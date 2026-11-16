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
  Modal,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Built-in playful font that works out-of-the-box on iOS, Android, and Web without extra installs
const PLAYFUL_FONT = Platform.select({
  ios: 'Chalkboard SE',
  android: 'casual',
  default: 'Comic Sans MS',
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
  "I'm watching you through the bifocals...",
  "Do you want an A or do you want the spatula?",
  "Less scrolling, more studying!",
  "My knees hurt just watching you procrastinate.",
  "Lock in before I lock your phone in the cookie jar!",
];

const BREAK_ACTIVITIES = [
  "Granny is taking a quick power nap. Stretch & hydrate! 💤",
  "Granny is outside gardening her prize petunias. Relax! 🌻",
  "Granny is sharpening her wooden spatula... enjoy the peace! 🪵",
  "Granny is baking snickerdoodles. Take a breather! 🍪",
  "Granny is knitting a sweater. Grab some water! 🧶",
  "Granny is yelling at squirrels on the porch. Rest your brain! 🐿️",
];

const POPUP_POSITIONS = [
  { id: 'bottom', rotation: '0deg', xOffset: 0, yStart: 450, xStart: 0, edge: 'bottom' },
  { id: 'bottom-left', rotation: '24deg', xOffset: -SCREEN_WIDTH * 0.24, yStart: 450, xStart: -150, edge: 'bottom' },
  { id: 'bottom-right', rotation: '-24deg', xOffset: SCREEN_WIDTH * 0.24, yStart: 450, xStart: 150, edge: 'bottom' },
  { id: 'left-peek', rotation: '55deg', xOffset: -SCREEN_WIDTH * 0.4, yStart: 0, xStart: -300, edge: 'side' },
  { id: 'right-peek', rotation: '-55deg', xOffset: SCREEN_WIDTH * 0.4, yStart: 0, xStart: 300, edge: 'side' },
];

const TUTORIAL_STEPS = [
  {
    emoji: '📓',
    title: 'Welcome to GrannyLock!',
    body: 'Your cartoon notebook study buddy. Build your study stack, lock in, and survive Granny’s watchful eye.',
  },
  {
    emoji: '✏️',
    title: '1. Build Your Stack',
    body: 'Use the Add tab to jot down tests, projects, or homework. Adjust minutes and rank them in the Stack tab!',
  },
  {
    emoji: '👵',
    title: '2. Beware the Spatula',
    body: 'During focus timers, Granny will randomly pop out from the edges of your screen to keep you off your phone.',
  },
  {
    emoji: '🍪',
    title: '3. Earn Smart Breaks',
    body: 'Finish a task and Granny takes a break to garden, nap, or bake—giving you time to stretch and recharge!',
  },
];

const TABS = [
  { id: 'add', label: 'Add', icon: 'add-circle' },
  { id: 'stack', label: 'Stack', icon: 'list' },
  { id: 'sync', label: 'Sync', icon: 'school' },
];

const GRANDMA_SCALE = 1.65;

// Tracks first launch across reloads/remounts without requiring external storage libraries
let hasSeenTutorialGlobal = false;

// ==========================================
// LINED NOTEBOOK PAPER BACKGROUND
// ==========================================
function NotebookBackground({ children, tintColor = '#FFFDF7' }) {
  const lineCount = Math.ceil(SCREEN_HEIGHT / 34);
  return (
    <View style={[styles.notebookBase, { backgroundColor: tintColor }]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {Array.from({ length: lineCount }).map((_, idx) => (
          <View key={idx} style={[styles.notebookLine, { top: 75 + idx * 34 }]} />
        ))}
        <View style={styles.marginLine} />
        <View style={[styles.binderHole, { top: '18%' }]} />
        <View style={[styles.binderHole, { top: '50%' }]} />
        <View style={[styles.binderHole, { top: '82%' }]} />
      </View>
      {children}
    </View>
  );
}

// ==========================================
// BOUNCY FLOATING TEXT ANIMATION
// ==========================================
function BouncyTitle({ text, style }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(tiltAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(tiltAnim, { toValue: -1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotate = tiltAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2.5deg', '2.5deg'],
  });

  return (
    <Animated.Text style={[style, { transform: [{ scale: scaleAnim }, { rotate }] }]}>
      {text}
    </Animated.Text>
  );
}

// ==========================================
// MULTI-POSITION SPATULA GRANDMA
// ==========================================
function SpatulaGrandma({ visible, quote, positionConfig }) {
  const slideY = useRef(new Animated.Value(450)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const spatulaWiggle = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible && positionConfig) {
      slideY.setValue(positionConfig.yStart);
      slideX.setValue(positionConfig.xStart);
      bubbleScale.setValue(0.4);

      Animated.parallel([
        Animated.spring(slideY, {
          toValue: 0,
          friction: 5,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.spring(slideX, {
          toValue: positionConfig.xOffset,
          friction: 5,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.spring(bubbleScale, {
          toValue: 1,
          friction: 4,
          tension: 90,
          delay: 120,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(spatulaWiggle, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.timing(spatulaWiggle, { toValue: -1, duration: 180, useNativeDriver: true }),
          Animated.timing(spatulaWiggle, { toValue: 0, duration: 180, useNativeDriver: true }),
        ])
      ).start();
    } else if (positionConfig) {
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: positionConfig.yStart,
          duration: 280,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(slideX, {
          toValue: positionConfig.xStart,
          duration: 280,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, positionConfig]);

  const rotateSpatula = spatulaWiggle.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-18deg', '18deg'],
  });

  const isSide = positionConfig?.edge === 'side';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.grandmaOverlay,
        isSide && { bottom: SCREEN_HEIGHT * 0.28 },
        {
          transform: [
            { translateX: slideX },
            { translateY: slideY },
          ],
        },
      ]}
    >
      <Animated.View style={[styles.speechBubble, { transform: [{ scale: bubbleScale }] }]}>
        <Text style={styles.speechText}>“{quote}”</Text>
        <View style={styles.speechTail} />
      </Animated.View>

      <View
        style={[
          styles.grandmaContainer,
          {
            transform: [
              { rotate: positionConfig?.rotation || '0deg' },
              { scale: GRANDMA_SCALE },
            ],
          },
        ]}
      >
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

        <Animated.View style={[styles.spatulaWrap, { transform: [{ rotate: rotateSpatula }] }]}>
          <View style={styles.spatulaHead}>
            <View style={styles.spatulaSlot} />
            <View style={styles.spatulaSlot} />
          </View>
          <View style={styles.spatulaHandle} />
          <View style={styles.grandmaHand} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// ==========================================
// MAIN APP
// ==========================================
export default function App() {
  const [showTutorial, setShowTutorial] = useState(!hasSeenTutorialGlobal);
  const [tutorialStep, setTutorialStep] = useState(0);

  const [screen, setScreen] = useState('planner'); // 'planner' | 'timer' | 'done'
  const [tab, setTab] = useState('add'); // 'add' | 'stack' | 'sync'

  const [titleInput, setTitleInput] = useState('');
  const [selectedCat, setSelectedCat] = useState('test');
  const [classroomLink, setClassroomLink] = useState('');
  const [linkSaved, setLinkSaved] = useState(false);

  // Empty stack on launch—no automatic assignments!
  const [tasks, setTasks] = useState([]);

  const [queue, setQueue] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const [grandmaVisible, setGrandmaVisible] = useState(false);
  const [grandmaQuote, setGrandmaQuote] = useState(GRANDMA_QUOTES[0]);
  const [grandmaPos, setGrandmaPos] = useState(POPUP_POSITIONS[0]);
  const [breakActivity, setBreakActivity] = useState(BREAK_ACTIVITIES[0]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const tabBounceAnim = useRef(new Animated.Value(1)).current;

  // Sound
  const [soundOn, setSoundOn] = useState(true);
  const soundRef = useRef(true);
  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);
  const SOUND_BASE = 'https://raw.githubusercontent.com/scmlearn21-bit/GrannyLock/main/assets/';
  const appearPlayer = useAudioPlayer({ uri: SOUND_BASE + 'granny-appear.wav' });
  const tapPlayer = useAudioPlayer({ uri: SOUND_BASE + 'spatula-tap.wav' });

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    // Also persist on web localStorage if running in browser/Snack web preview
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      if (window.localStorage.getItem('grannylock_tutorial_seen') === 'true') {
        hasSeenTutorialGlobal = true;
        setShowTutorial(false);
      }
    }
  }, []);

  const finishTutorial = () => {
    triggerHaptic();
    hasSeenTutorialGlobal = true;
    setShowTutorial(false);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('grannylock_tutorial_seen', 'true');
    }
  };

  useEffect(() => {
    if (screen === 'timer' && isRunning) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.045, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [screen, isRunning]);

  const triggerTabBounce = () => {
    tabBounceAnim.setValue(0.95);
    Animated.spring(tabBounceAnim, {
      toValue: 1,
      friction: 4,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const playSound = (player) => {
    if (!soundRef.current) return;
    try {
      player.seekTo(0);
      player.play();
    } catch (e) {}
  };

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const addTask = () => {
    if (!titleInput.trim()) return;
    triggerHaptic();
    playSound(tapPlayer);
    const catObj = CATEGORIES[selectedCat];
    setTasks([
      ...tasks,
      { id: Date.now().toString(), title: titleInput.trim(), category: selectedCat, mins: catObj.defaultMins },
    ]);
    setTitleInput('');
    setTab('stack');
    triggerTabBounce();
  };

  const adjustTaskMins = (id, delta) => {
    triggerHaptic();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, mins: Math.max(5, Math.min(180, t.mins + delta)) } : t))
    );
  };

  const moveTask = (index, direction) => {
    triggerHaptic();
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= tasks.length) return;
    const updated = [...tasks];
    const [removed] = updated.splice(index, 1);
    updated.splice(newIndex, 0, removed);
    setTasks(updated);
  };

  const deleteTask = (id) => {
    triggerHaptic();
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const startStudySession = () => {
    if (tasks.length === 0) return;
    triggerHaptic();
    playSound(tapPlayer);

    const builtQueue = [];
    tasks.forEach((task, idx) => {
      builtQueue.push({ type: 'focus', title: task.title, category: task.category, mins: task.mins });
      if (idx < tasks.length - 1) {
        const smartBreakMins = task.mins >= 60 ? 15 : task.mins >= 45 ? 10 : 5;
        const randomBreakMsg = BREAK_ACTIVITIES[Math.floor(Math.random() * BREAK_ACTIVITIES.length)];
        builtQueue.push({
          type: 'break',
          title: smartBreakMins >= 15 ? 'Long Brain Recharge' : 'Quick Stretch & Snack',
          category: 'break',
          mins: smartBreakMins,
          activityText: randomBreakMsg,
        });
      }
    });

    setQueue(builtQueue);
    setCurrentStepIndex(0);
    setSecondsLeft(builtQueue[0].mins * 60);
    setBreakActivity(BREAK_ACTIVITIES[Math.floor(Math.random() * BREAK_ACTIVITIES.length)]);
    setIsRunning(true);
    setGrandmaVisible(false);
    setScreen('timer');
  };

  useEffect(() => {
    if (screen !== 'timer' || !isRunning) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          handleStepComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, isRunning, currentStepIndex]);

  useEffect(() => {
    const currentItem = queue[currentStepIndex];
    if (screen !== 'timer' || !isRunning || !currentItem || currentItem.type === 'break') {
      setGrandmaVisible(false);
      return;
    }
    const initialPeek = setTimeout(() => summonGrandma(), 4500);
    const periodicInterval = setInterval(() => summonGrandma(), 24000);
    return () => {
      clearTimeout(initialPeek);
      clearInterval(periodicInterval);
    };
  }, [screen, isRunning, currentStepIndex]);

  const summonGrandma = () => {
    const quote = GRANDMA_QUOTES[Math.floor(Math.random() * GRANDMA_QUOTES.length)];
    const otherPositions = POPUP_POSITIONS.filter((p) => p.id !== grandmaPos.id);
    const nextPos = otherPositions[Math.floor(Math.random() * otherPositions.length)];

    setGrandmaQuote(quote);
    setGrandmaPos(nextPos);
    setGrandmaVisible(true);

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (soundRef.current) {
      playSound(appearPlayer);
    }
    setTimeout(() => setGrandmaVisible(false), 4500);
  };

  const handleStepComplete = async () => {
    setGrandmaVisible(false);
    const nextIdx = currentStepIndex + 1;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: nextIdx < queue.length ? 'Timer Up! Next Step Ready ✨' : 'All Done! Study Session Complete 🎉',
        body: nextIdx < queue.length ? `Up next: ${queue[nextIdx].title}` : 'Grandma is proud. Put the spatula away!',
      },
      trigger: null,
    });

    if (nextIdx < queue.length) {
      setCurrentStepIndex(nextIdx);
      setSecondsLeft(queue[nextIdx].mins * 60);
      if (queue[nextIdx].type === 'break') {
        setBreakActivity(
          queue[nextIdx].activityText ||
            BREAK_ACTIVITIES[Math.floor(Math.random() * BREAK_ACTIVITIES.length)]
        );
      }
    } else {
      setIsRunning(false);
      setScreen('done');
    }
  };

  const formatClock = (totalSecs) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalFocusMins = tasks.reduce((acc, t) => acc + t.mins, 0);

  // ==========================================
  // FIRST-TIME TUTORIAL MODAL
  // ==========================================
  const renderTutorialModal = () => {
    const stepData = TUTORIAL_STEPS[tutorialStep];
    const isLast = tutorialStep === TUTORIAL_STEPS.length - 1;

    return (
      <Modal visible={showTutorial} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.tutorialCard}>
            <View style={styles.washiTape} />
            <Text style={styles.tutorialEmoji}>{stepData.emoji}</Text>
            <Text style={styles.tutorialTitle}>{stepData.title}</Text>
            <Text style={styles.tutorialBody}>{stepData.body}</Text>

            <View style={styles.dotsRow}>
              {TUTORIAL_STEPS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === tutorialStep && { backgroundColor: '#FF5A5F', width: 20 },
                  ]}
                />
              ))}
            </View>

            <View style={styles.tutorialBtnRow}>
              {tutorialStep > 0 && (
                <TouchableOpacity
                  style={[styles.chunkyBtn, { backgroundColor: '#FAF6EC', flex: 1 }]}
                  onPress={() => {
                    triggerHaptic();
                    setTutorialStep(tutorialStep - 1);
                  }}
                >
                  <Text style={styles.chunkyBtnText}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.chunkyBtn, { backgroundColor: isLast ? '#38B000' : '#FFD166', flex: 2 }]}
                onPress={() => {
                  if (isLast) {
                    finishTutorial();
                  } else {
                    triggerHaptic();
                    setTutorialStep(tutorialStep + 1);
                  }
                }}
              >
                <Text style={[styles.chunkyBtnText, { color: isLast ? '#FFF' : '#1E1B18' }]}>
                  {isLast ? "Let's Lock In! 🚀" : 'Next →'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ==========================================
  // SCREEN 1: PLANNER (3 TABS)
  // ==========================================
  if (screen === 'planner') {
    return (
      <NotebookBackground>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" />
          {renderTutorialModal()}

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BouncyTitle text="GrannyLock" style={styles.appTitle} />
              <Text style={{ fontSize: 26 }}>👵</Text>
            </View>
            <View style={styles.stickerBadge}>
              <Text style={styles.stickerText}>NOTEBOOK EDITION ✏️</Text>
            </View>
          </View>

          <Animated.ScrollView
            style={{ transform: [{ scale: tabBounceAnim }] }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ---------- ADD TAB ---------- */}
            {tab === 'add' && (
              <View style={styles.cartoonCard}>
                <View style={styles.washiTape} />
                <Text style={styles.cardHeading}>✏️ Jot down an assignment:</Text>
                <TextInput
                  style={styles.cartoonInput}
                  placeholder="e.g., AP Bio Quiz, English Essay..."
                  placeholderTextColor="#8D847A"
                  value={titleInput}
                  onChangeText={setTitleInput}
                />

                <Text style={styles.subLabel}>Pick a sticker label:</Text>
                <View style={styles.catGrid}>
                  {Object.values(CATEGORIES).map((cat) => {
                    const active = selectedCat === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.catPill,
                          { backgroundColor: active ? cat.color : cat.bgLight },
                          active && styles.catPillActive,
                        ]}
                        onPress={() => {
                          triggerHaptic();
                          setSelectedCat(cat.id);
                        }}
                      >
                        <Ionicons name={cat.icon} size={16} color={active ? '#FFF' : '#1E1B18'} />
                        <Text style={[styles.catPillText, active && { color: '#FFF' }]}>
                          {cat.label} ({cat.defaultMins}m)
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity style={[styles.chunkyBtn, { backgroundColor: '#FFD166', marginTop: 4 }]} onPress={addTask}>
                  <Ionicons name="add-circle" size={22} color="#1E1B18" />
                  <Text style={styles.chunkyBtnText}>Stick Into My Stack!</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ---------- STACK TAB ---------- */}
            {tab === 'stack' && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Your Study Stack 📌</Text>
                  <Text style={styles.totalTimeBadge}>{totalFocusMins}m + breaks</Text>
                </View>

                {tasks.length === 0 && (
                  <View style={[styles.cartoonCard, { alignItems: 'center', paddingVertical: 28 }]}>
                    <View style={styles.washiTape} />
                    <Text style={{ fontSize: 42 }}>📝</Text>
                    <Text style={[styles.cardHeading, { textAlign: 'center' }]}>Blank Page!</Text>
                    <Text style={[styles.helperText, { textAlign: 'center' }]}>
                      Your stack is empty. Tap the Add tab below to write down your first assignment!
                    </Text>
                  </View>
                )}

                {tasks.map((task, index) => {
                  const cat = CATEGORIES[task.category];
                  return (
                    <View
                      key={task.id}
                      style={[styles.taskCard, { borderLeftWidth: 10, borderLeftColor: cat.color }]}
                    >
                      <View style={styles.rankCol}>
                        <TouchableOpacity style={styles.arrowBtn} onPress={() => moveTask(index, -1)} disabled={index === 0}>
                          <Ionicons name="caret-up" size={20} color={index === 0 ? '#CCC' : '#1E1B18'} />
                        </TouchableOpacity>
                        <Text style={styles.rankNumber}>#{index + 1}</Text>
                        <TouchableOpacity
                          style={styles.arrowBtn}
                          onPress={() => moveTask(index, 1)}
                          disabled={index === tasks.length - 1}
                        >
                          <Ionicons
                            name="caret-down"
                            size={20}
                            color={index === tasks.length - 1 ? '#CCC' : '#1E1B18'}
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={{ flex: 1, gap: 6 }}>
                        <View style={styles.rowBetween}>
                          <View style={[styles.miniTag, { backgroundColor: cat.bgLight }]}>
                            <Text style={[styles.miniTagText, { color: cat.color }]}>
                              {cat.label.toUpperCase()}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => deleteTask(task.id)}>
                            <Ionicons name="close-circle" size={22} color="#9E958C" />
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.taskTitle}>{task.title}</Text>

                        <View style={styles.timeAdjustRow}>
                          <TouchableOpacity style={styles.timeStepBtn} onPress={() => adjustTaskMins(task.id, -5)}>
                            <Text style={styles.timeStepText}>-5m</Text>
                          </TouchableOpacity>
                          <View style={styles.timeReadout}>
                            <Ionicons name="time-outline" size={15} color="#1E1B18" />
                            <Text style={styles.timeReadoutText}>{task.mins} mins</Text>
                          </View>
                          <TouchableOpacity style={styles.timeStepBtn} onPress={() => adjustTaskMins(task.id, 5)}>
                            <Text style={styles.timeStepText}>+5m</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}

                {tasks.length > 0 && (
                  <TouchableOpacity
                    style={[styles.chunkyBtn, { backgroundColor: '#FF5A5F', marginTop: 8, paddingVertical: 16 }]}
                    onPress={startStudySession}
                  >
                    <Ionicons name="flame" size={24} color="#FFF" />
                    <Text style={[styles.chunkyBtnText, { color: '#FFF', fontSize: 19 }]}>
                      Start Pomodoro Queue!
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* ---------- SYNC TAB ---------- */}
            {tab === 'sync' && (
              <View style={styles.cartoonCard}>
                <View style={styles.washiTape} />
                <Text style={styles.cardHeading}>Google Classroom Sync 🏫</Text>
                <Text style={styles.helperText}>
                  Paste your Classroom calendar feed (.ics) link to import due dates.
                </Text>
                <TextInput
                  style={styles.cartoonInput}
                  placeholder="https://calendar.google.com/calendar/ical/..."
                  placeholderTextColor="#8D847A"
                  value={classroomLink}
                  onChangeText={(t) => {
                    setClassroomLink(t);
                    setLinkSaved(false);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.chunkyBtn, { backgroundColor: '#A8DADC' }]}
                  onPress={() => {
                    triggerHaptic();
                    setLinkSaved(true);
                  }}
                >
                  <Text style={styles.chunkyBtnText}>{linkSaved ? 'Saved ✓' : 'Save Sync Link'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.ScrollView>

          {/* Bottom tab bar */}
          <View style={styles.tabBar}>
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  onPress={() => {
                    triggerHaptic();
                    triggerTabBounce();
                    setTab(t.id);
                  }}
                >
                  <Ionicons name={t.icon} size={20} color="#1E1B18" />
                  <Text style={styles.tabLabel}>{t.label}</Text>
                  {t.id === 'stack' && tasks.length > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{tasks.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </NotebookBackground>
    );
  }

  // ==========================================
  // SCREEN 2: TIMER + GRANNY
  // ==========================================
  if (screen === 'timer') {
    const currentItem = queue[currentStepIndex];
    const isBreak = currentItem.type === 'break';
    const catTheme = isBreak
      ? { color: '#9B5DE5', bgLight: '#F3E8FF', label: 'CHILL BREAK' }
      : CATEGORIES[currentItem.category];

    return (
      <NotebookBackground tintColor={isBreak ? '#F7F0FF' : '#FFFDF7'}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.timerScreenWrap}>
            <View style={styles.rowBetween}>
              <TouchableOpacity
                style={styles.smallExitBtn}
                onPress={() => {
                  setIsRunning(false);
                  setGrandmaVisible(false);
                  setScreen('planner');
                  setTab('stack');
                }}
              >
                <Ionicons name="arrow-back" size={18} color="#1E1B18" />
                <Text style={styles.smallExitText}>Edit List</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.smallExitBtn}
                onPress={() => {
                  triggerHaptic();
                  setSoundOn(!soundOn);
                }}
              >
                <Ionicons name={soundOn ? 'volume-high' : 'volume-mute'} size={18} color="#1E1B18" />
              </TouchableOpacity>

              <View style={styles.stepPill}>
                <Text style={styles.stepPillText}>
                  Step {currentStepIndex + 1} of {queue.length}
                </Text>
              </View>
            </View>

            <View style={[styles.timerMainCard, { borderColor: '#1E1B18' }]}>
              <View style={styles.washiTape} />
              <View style={[styles.catBadgeLarge, { backgroundColor: catTheme.color }]}>
                <Text style={styles.catBadgeLargeText}>{catTheme.label.toUpperCase()}</Text>
              </View>

              <Animated.Text style={[styles.activeTaskTitle, { transform: [{ scale: pulseAnim }] }]}>
                {currentItem.title}
              </Animated.Text>

              <Animated.View
                style={[
                  styles.clockBox,
                  { backgroundColor: catTheme.bgLight, transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Text style={styles.clockDigits}>{formatClock(secondsLeft)}</Text>
              </Animated.View>

              <Text style={styles.modeSubtext}>
                {isBreak
                  ? breakActivity
                  : 'Stay locked in—Granny is patrolling with her spatula... 👀'}
              </Text>

              <View style={styles.timerControlsRow}>
                <TouchableOpacity
                  style={[styles.chunkyBtn, { flex: 1, backgroundColor: isRunning ? '#FFD166' : '#38B000' }]}
                  onPress={() => {
                    triggerHaptic();
                    setIsRunning(!isRunning);
                  }}
                >
                  <Ionicons name={isRunning ? 'pause' : 'play'} size={20} color="#1E1B18" />
                  <Text style={styles.chunkyBtnText}>{isRunning ? 'Pause' : 'Resume'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chunkyBtn, { backgroundColor: '#E0E0E0', paddingHorizontal: 16 }]}
                  onPress={handleStepComplete}
                >
                  <Ionicons name="play-skip-forward" size={20} color="#1E1B18" />
                </TouchableOpacity>
              </View>

              {!isBreak && (
                <TouchableOpacity style={styles.peekTriggerBtn} onPress={summonGrandma}>
                  <Text style={styles.peekTriggerText}>👀 Summon Granny Now</Text>
                </TouchableOpacity>
              )}
            </View>

            {currentStepIndex + 1 < queue.length && (
              <View style={styles.upNextBox}>
                <Text style={styles.upNextLabel}>UP NEXT:</Text>
                <Text style={styles.upNextTitle}>
                  {queue[currentStepIndex + 1].title} ({queue[currentStepIndex + 1].mins}m)
                </Text>
              </View>
            )}
          </View>

          <SpatulaGrandma
            visible={grandmaVisible && !isBreak}
            quote={grandmaQuote}
            positionConfig={grandmaPos}
          />
        </SafeAreaView>
      </NotebookBackground>
    );
  }

  // ==========================================
  // SCREEN 3: DONE
  // ==========================================
  return (
    <NotebookBackground tintColor="#E8FCE0">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.doneWrap}>
          <View style={styles.cartoonCard}>
            <View style={styles.washiTape} />
            <Text style={{ fontSize: 60, textAlign: 'center' }}>🎉👵✨</Text>
            <BouncyTitle text="You Survived!" style={[styles.appTitle, { textAlign: 'center', marginTop: 4 }]} />
            <Text style={[styles.helperText, { textAlign: 'center', fontSize: 16 }]}>
              Every assignment in your study stack is finished! Granny put the spatula back in the kitchen drawer.
            </Text>
            <TouchableOpacity
              style={[styles.chunkyBtn, { backgroundColor: '#FFD166', marginTop: 14 }]}
              onPress={() => {
                setTasks([]);
                setScreen('planner');
                setTab('add');
              }}
            >
              <Text style={styles.chunkyBtnText}>Start a Fresh Page 📓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </NotebookBackground>
  );
}

const styles = StyleSheet.create({
  notebookBase: { flex: 1 },
  notebookLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: '#C5DCF0',
  },
  marginLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 34,
    width: 2,
    backgroundColor: '#F4A2A8',
  },
  binderHole: {
    position: 'absolute',
    left: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E6E1D6',
    borderWidth: 1.5,
    borderColor: '#C9C2B4',
  },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { padding: 20, paddingLeft: 44, paddingBottom: 28, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 44,
    paddingRight: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 12,
    paddingBottom: 6,
  },
  stickerBadge: {
    backgroundColor: '#FFD166',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1E1B18',
    transform: [{ rotate: '-3deg' }],
    shadowColor: '#1E1B18',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  stickerText: { fontFamily: PLAYFUL_FONT, fontSize: 11, fontWeight: '900', color: '#1E1B18', letterSpacing: 0.6 },
  appTitle: { fontFamily: PLAYFUL_FONT, fontSize: 33, fontWeight: '900', color: '#1E1B18', letterSpacing: -0.5 },

  washiTape: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    width: 74,
    height: 20,
    backgroundColor: 'rgba(255, 183, 3, 0.75)',
    borderWidth: 1.5,
    borderColor: '#1E1B18',
    transform: [{ rotate: '-2deg' }],
    zIndex: 10,
  },

  // Tutorial Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 27, 24, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tutorialCard: {
    width: '100%',
    backgroundColor: '#FFFDF7',
    borderRadius: 26,
    padding: 24,
    paddingTop: 30,
    borderWidth: 3.5,
    borderColor: '#1E1B18',
    shadowColor: '#1E1B18',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    alignItems: 'center',
    gap: 12,
  },
  tutorialEmoji: { fontSize: 54 },
  tutorialTitle: { fontFamily: PLAYFUL_FONT, fontSize: 25, fontWeight: '900', color: '#1E1B18', textAlign: 'center' },
  tutorialBody: { fontFamily: PLAYFUL_FONT, fontSize: 16, fontWeight: '600', color: '#4A443E', textAlign: 'center', lineHeight: 22 },
  dotsRow: { flexDirection: 'row', gap: 6, marginVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D6CFC4' },
  tutorialBtnRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: '#FFFDF7',
    borderTopWidth: 3,
    borderColor: '#1E1B18',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#1E1B18',
    backgroundColor: '#FFFFFF',
  },
  tabBtnActive: {
    backgroundColor: '#FFD166',
    shadowColor: '#1E1B18',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    transform: [{ translateY: -2 }],
  },
  tabLabel: { fontFamily: PLAYFUL_FONT, fontSize: 15, fontWeight: '900', color: '#1E1B18' },
  tabBadge: {
    backgroundColor: '#FF5A5F',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1E1B18',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontFamily: PLAYFUL_FONT, fontSize: 11, fontWeight: '900', color: '#FFF' },

  cartoonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    paddingTop: 24,
    borderWidth: 3,
    borderColor: '#1E1B18',
    shadowColor: '#1E1B18',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    gap: 12,
  },
  cardHeading: { fontFamily: PLAYFUL_FONT, fontSize: 19, fontWeight: '900', color: '#1E1B18' },
  subLabel: { fontFamily: PLAYFUL_FONT, fontSize: 14, fontWeight: '700', color: '#5C554E' },
  helperText: { fontFamily: PLAYFUL_FONT, fontSize: 14, color: '#5C554E', fontWeight: '600', lineHeight: 20 },
  cartoonInput: {
    fontFamily: PLAYFUL_FONT,
    backgroundColor: '#FAF6EC',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B18',
    borderWidth: 2.5,
    borderColor: '#1E1B18',
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1E1B18',
  },
  catPillActive: {
    shadowColor: '#1E1B18',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    transform: [{ rotate: '-1.5deg' }],
  },
  catPillText: { fontFamily: PLAYFUL_FONT, fontSize: 13, fontWeight: '800', color: '#1E1B18' },
  chunkyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1E1B18',
    shadowColor: '#1E1B18',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  chunkyBtnText: { fontFamily: PLAYFUL_FONT, fontSize: 16, fontWeight: '900', color: '#1E1B18' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: PLAYFUL_FONT, fontSize: 22, fontWeight: '900', color: '#1E1B18' },
  totalTimeBadge: {
    fontFamily: PLAYFUL_FONT,
    fontSize: 13,
    fontWeight: '800',
    color: '#1E1B18',
    backgroundColor: '#E3F8D8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1E1B18',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 2.5,
    borderColor: '#1E1B18',
    shadowColor: '#1E1B18',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  rankCol: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  arrowBtn: { padding: 2 },
  rankNumber: { fontFamily: PLAYFUL_FONT, fontSize: 15, fontWeight: '900', color: '#1E1B18' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1.5, borderColor: '#1E1B18' },
  miniTagText: { fontFamily: PLAYFUL_FONT, fontSize: 11, fontWeight: '900' },
  taskTitle: { fontFamily: PLAYFUL_FONT, fontSize: 17, fontWeight: '800', color: '#1E1B18' },
  timeAdjustRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  timeStepBtn: {
    backgroundColor: '#FAF6EC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1E1B18',
  },
  timeStepText: { fontFamily: PLAYFUL_FONT, fontSize: 13, fontWeight: '900', color: '#1E1B18' },
  timeReadout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD166',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1E1B18',
  },
  timeReadoutText: { fontFamily: PLAYFUL_FONT, fontSize: 13, fontWeight: '900', color: '#1E1B18' },

  // Timer screen
  timerScreenWrap: { flex: 1, padding: 20, paddingLeft: 44, justifyContent: 'space-between' },
  smallExitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1E1B18',
    shadowColor: '#1E1B18',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  smallExitText: { fontFamily: PLAYFUL_FONT, fontSize: 14, fontWeight: '800', color: '#1E1B18' },
  stepPill: {
    backgroundColor: '#FFD166',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1E1B18',
  },
  stepPillText: { fontFamily: PLAYFUL_FONT, fontSize: 14, fontWeight: '900', color: '#1E1B18' },
  timerMainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    paddingTop: 28,
    alignItems: 'center',
    borderWidth: 3.5,
    borderColor: '#1E1B18',
    shadowColor: '#1E1B18',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    gap: 14,
  },
  catBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1E1B18',
  },
  catBadgeLargeText: { fontFamily: PLAYFUL_FONT, fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  activeTaskTitle: { fontFamily: PLAYFUL_FONT, fontSize: 23, fontWeight: '900', color: '#1E1B18', textAlign: 'center' },
  clockBox: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#1E1B18',
    alignItems: 'center',
  },
  clockDigits: { fontFamily: PLAYFUL_FONT, fontSize: 64, fontWeight: '900', color: '#1E1B18' },
  modeSubtext: { fontFamily: PLAYFUL_FONT, fontSize: 15, fontWeight: '700', color: '#5C554E', textAlign: 'center' },
  timerControlsRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 4 },
  peekTriggerBtn: { marginTop: 4, paddingVertical: 6, paddingHorizontal: 12 },
  peekTriggerText: { fontFamily: PLAYFUL_FONT, fontSize: 14, fontWeight: '800', color: '#FF5A5F', textDecorationLine: 'underline' },
  upNextBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#1E1B18',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#1E1B18',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  upNextLabel: { fontFamily: PLAYFUL_FONT, fontSize: 12, fontWeight: '900', color: '#8D847A' },
  upNextTitle: { fontFamily: PLAYFUL_FONT, fontSize: 14, fontWeight: '800', color: '#1E1B18', flex: 1 },
  doneWrap: { flex: 1, justifyContent: 'center', padding: 24, paddingLeft: 44 },

  // ==========================================
  // GRANDMA & SPEECH BUBBLE STYLES
  // ==========================================
  grandmaOverlay: {
    position: 'absolute',
    bottom: -15,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  speechBubble: {
    backgroundColor: '#FFFDF7',
    borderWidth: 3,
    borderColor: '#1E1B18',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 44,
    maxWidth: 250,
    shadowColor: '#1E1B18',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    zIndex: 20,
  },
  speechText: {
    fontFamily: PLAYFUL_FONT,
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B18',
    textAlign: 'center',
  },
  speechTail: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    width: 16,
    height: 16,
    backgroundColor: '#FFFDF7',
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#1E1B18',
    transform: [{ rotate: '45deg' }],
  },
  grandmaContainer: {
    alignItems: 'center',
    width: 120,
    height: 150,
  },
  hairBun: {
    width: 44,
    height: 36,
    borderRadius: 22,
    backgroundColor: '#D6D2CE',
    borderWidth: 2.5,
    borderColor: '#1E1B18',
    marginBottom: -12,
  },
  hairBase: {
    width: 84,
    height: 46,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    backgroundColor: '#E5E1DD',
    borderWidth: 2.5,
    borderColor: '#1E1B18',
    marginBottom: -30,
  },
  grandmaFace: {
    width: 72,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FAD2B8',
    borderWidth: 2.5,
    borderColor: '#1E1B18',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  browLeft: {
    position: 'absolute',
    top: 16,
    left: 14,
    width: 16,
    height: 3.5,
    backgroundColor: '#6E6A67',
    borderRadius: 2,
    transform: [{ rotate: '14deg' }],
  },
  browRight: {
    position: 'absolute',
    top: 16,
    right: 14,
    width: 16,
    height: 3.5,
    backgroundColor: '#6E6A67',
    borderRadius: 2,
    transform: [{ rotate: '-14deg' }],
  },
  glassesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  glassLens: {
    width: 22,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#1E1B18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#1E1B18',
  },
  glassBridge: {
    width: 6,
    height: 2.5,
    backgroundColor: '#1E1B18',
  },
  grandmaMouth: {
    width: 18,
    height: 5,
    borderTopWidth: 2.5,
    borderColor: '#1E1B18',
    borderRadius: 8,
    marginTop: 8,
  },
  cheek: {
    position: 'absolute',
    bottom: 16,
    width: 10,
    height: 6,
    borderRadius: 5,
    backgroundColor: '#F4978E',
  },
  cardigan: {
    width: 96,
    height: 58,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: '#9B5DE5',
    borderWidth: 2.5,
    borderColor: '#1E1B18',
    marginTop: -6,
    alignItems: 'center',
    paddingTop: 10,
  },
  pearlsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  pearl: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#1E1B18',
  },
  spatulaWrap: {
    position: 'absolute',
    right: -12,
    bottom: 18,
    alignItems: 'center',
    zIndex: 5,
  },
  spatulaHead: {
    width: 26,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#B8C0C8',
    borderWidth: 2,
    borderColor: '#1E1B18',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 4,
  },
  spatulaSlot: {
    width: 14,
    height: 3,
    backgroundColor: '#1E1B18',
    borderRadius: 2,
  },
  spatulaHandle: {
    width: 7,
    height: 26,
    backgroundColor: '#D4A373',
    borderWidth: 2,
    borderColor: '#1E1B18',
    marginTop: -2,
  },
  grandmaHand: {
    width: 18,
    height: 16,
    borderRadius: 9,
    backgroundColor: '#FAD2B8',
    borderWidth: 2,
    borderColor: '#1E1B18',
    marginTop: -12,
  },
});
