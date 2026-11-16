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

export default function App() {
  const [screen, setScreen] = useState('planner'); // 'planner' | 'timer' | 'done'
  const [tab, setTab] = useState('add'); // 'add' | 'stack' | 'sync'

  const [titleInput, setTitleInput] = useState('');
  const [selectedCat, setSelectedCat] = useState('test');
  const [classroomLink, setClassroomLink] = useState('');
  const [linkSaved, setLinkSaved] = useState(false);

  const [tasks, setTasks] = useState([
    { id: '1', title: 'AP Bio Chapter 8 Exam', category: 'test', mins: 60 },
    { id: '2', title: 'History Diorama Slides', category: 'project', mins: 45 },
    { id: '3', title: 'Algebra Worksheet #14', category: 'homework', mins: 30 },
  ]);

  const [queue, setQueue] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const [grandmaVisible, setGrandmaVisible] = useState(false);
  const [grandmaQuote, setGrandmaQuote] = useState(GRANDMA_QUOTES[0]);

  // Sound
  const [soundOn, setSoundOn] = useState(true);
  const soundRef = useRef(true); // timers read this so mute works instantly
  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);
  const appearPlayer = useAudioPlayer(require('./assets/granny-appear.wav'));
  const tapPlayer = useAudioPlayer(require('./assets/spatula-tap.wav'));

  useEffect(() => {
    // lets sounds play even when the iPhone silent switch is on
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

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
    const catObj = CATEGORIES[selectedCat];
    setTasks([
      ...tasks,
      { id: Date.now().toString(), title: titleInput.trim(), category: selectedCat, mins: catObj.defaultMins },
    ]);
    setTitleInput('');
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
        builtQueue.push({
          type: 'break',
          title: smartBreakMins >= 15 ? 'Long Brain Recharge' : 'Quick Stretch & Snack',
          category: 'break',
          mins: smartBreakMins,
        });
      }
    });

    setQueue(builtQueue);
    setCurrentStepIndex(0);
    setSecondsLeft(builtQueue[0].mins * 60);
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
    const periodicInterval = setInterval(() => summonGrandma(), 28000);
    return () => {
      clearTimeout(initialPeek);
      clearInterval(periodicInterval);
    };
  }, [screen, isRunning, currentStepIndex]);

  const summonGrandma = () => {
    const quote = GRANDMA_QUOTES[Math.floor(Math.random() * GRANDMA_QUOTES.length)];
    setGrandmaQuote(quote);
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
  // SCREEN 1: PLANNER (3 TABS)
  // ==========================================
  if (screen === 'planner') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        {/* Slim header */}
        <View style={styles.headerRow}>
          <Text style={styles.appTitle}>GrannyLock</Text>
          <View style={styles.stickerBadge}>
            <Text style={styles.stickerText}>STUDYCORE ✏️</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ---------- ADD TAB ---------- */}
          {tab === 'add' && (
            <View style={styles.cartoonCard}>
              <Text style={styles.cardHeading}>What do you need to do?</Text>
              <TextInput
                style={styles.cartoonInput}
                placeholder="e.g., Chem Quiz, English Essay..."
                placeholderTextColor="#8D847A"
                value={titleInput}
                onChangeText={setTitleInput}
              />

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
                      <Ionicons name={cat.icon} size={15} color={active ? '#FFF' : '#1E1B18'} />
                      <Text style={[styles.catPillText, active && { color: '#FFF' }]}>
                        {cat.label} ({cat.defaultMins}m)
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={[styles.chunkyBtn, { backgroundColor: '#FFD166' }]} onPress={addTask}>
                <Ionicons name="add-circle" size={20} color="#1E1B18" />
                <Text style={styles.chunkyBtnText}>Add To Stack</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ---------- STACK TAB ---------- */}
          {tab === 'stack' && (
            <>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Your Stack</Text>
                <Text style={styles.totalTimeBadge}>{totalFocusMins}m + breaks</Text>
              </View>

              {tasks.length === 0 && (
                <View style={styles.cartoonCard}>
                  <Text style={styles.helperText}>Nothing here yet. Head to the Add tab to get started.</Text>
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
                        <Ionicons name="caret-up" size={18} color={index === 0 ? '#CCC' : '#1E1B18'} />
                      </TouchableOpacity>
                      <Text style={styles.rankNumber}>#{index + 1}</Text>
                      <TouchableOpacity
                        style={styles.arrowBtn}
                        onPress={() => moveTask(index, 1)}
                        disabled={index === tasks.length - 1}
                      >
                        <Ionicons
                          name="caret-down"
                          size={18}
                          color={index === tasks.length - 1 ? '#CCC' : '#1E1B18'}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={styles.rowBetween}>
                        <View style={[styles.miniTag, { backgroundColor: cat.bgLight }]}>
                          <Text style={[styles.miniTagText, { color: cat.color }]}>{cat.label.toUpperCase()}</Text>
                        </View>
                        <TouchableOpacity onPress={() => deleteTask(task.id)}>
                          <Ionicons name="close-circle" size={20} color="#9E958C" />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.taskTitle}>{task.title}</Text>

                      <View style={styles.timeAdjustRow}>
                        <TouchableOpacity style={styles.timeStepBtn} onPress={() => adjustTaskMins(task.id, -5)}>
                          <Text style={styles.timeStepText}>-5m</Text>
                        </TouchableOpacity>
                        <View style={styles.timeReadout}>
                          <Ionicons name="time-outline" size={14} color="#1E1B18" />
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
                  style={[styles.chunkyBtn, { backgroundColor: '#FF5A5F', marginTop: 8, paddingVertical: 18 }]}
                  onPress={startStudySession}
                >
                  <Ionicons name="flame" size={22} color="#FFF" />
                  <Text style={[styles.chunkyBtnText, { color: '#FFF', fontSize: 18 }]}>Start Pomodoro Queue!</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* ---------- SYNC TAB ---------- */}
          {tab === 'sync' && (
            <View style={styles.cartoonCard}>
              <Text style={styles.cardHeading}>Google Classroom Sync</Text>
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
        </ScrollView>

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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isBreak ? '#F5EEFF' : '#FFFDF7' }]}>
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
              <Text style={styles.stepPillText}>Step {currentStepIndex + 1} of {queue.length}</Text>
            </View>
          </View>

          <View style={[styles.timerMainCard, { borderColor: '#1E1B18' }]}>
            <View style={[styles.catBadgeLarge, { backgroundColor: catTheme.color }]}>
              <Text style={styles.catBadgeLargeText}>{catTheme.label.toUpperCase()}</Text>
            </View>

            <Text style={styles.activeTaskTitle}>{currentItem.title}</Text>

            <View style={[styles.clockBox, { backgroundColor: catTheme.bgLight }]}>
              <Text style={styles.clockDigits}>{formatClock(secondsLeft)}</Text>
            </View>

            <Text style={styles.modeSubtext}>
              {isBreak
                ? 'Grandma is taking a nap. Stretch, hydrate, and relax!'
                : 'Stay locked in—Grandma is watching with her spatula...'}
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
                <Text style={styles.peekTriggerText}>👀 Summon Grandma Now</Text>
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

        <SpatulaGrandma visible={grandmaVisible && !isBreak} quote={grandmaQuote} />
      </SafeAreaView>
    );
  }

  // ==========================================
  // SCREEN 3: DONE
  // ==========================================
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#E3F8D8' }]}>
      <View style={styles.doneWrap}>
        <View style={styles.cartoonCard}>
          <Text style={{ fontSize: 54, textAlign: 'center' }}>🎉👵✨</Text>
          <Text style={[styles.appTitle, { textAlign: 'center', marginTop: 8 }]}>You Survived!</Text>
          <Text style={[styles.helperText, { textAlign: 'center', fontSize: 15 }]}>
            Every assignment in your priority queue is finished. Grandma put the spatula back in the drawer.
          </Text>
          <TouchableOpacity
            style={[styles.chunkyBtn, { backgroundColor: '#FFD166', marginTop: 14 }]}
            onPress={() => {
              setScreen('planner');
              setTab('add');
            }}
          >
            <Text style={styles.chunkyBtnText}>Plan Next Study Stack</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFDF7' },
  scrollContent: { padding: 20, paddingBottom: 24, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 12,
    paddingBottom: 4,
  },
  stickerBadge: {
    backgroundColor: '#FFD166',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1E1B18',
    transform: [{ rotate: '-2deg' }],
  },
  stickerText: { fontSize: 10, fontWeight: '900', color: '#1E1B18', letterSpacing: 0.8 },
  appTitle: { fontSize: 32, fontWeight: '900', color: '#1E1B18', letterSpacing: -1 },

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
    paddingVertical: 12,
    borderRadius: 14,
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
  },
  tabLabel: { fontSize: 14, fontWeight: '900', color: '#1E1B18' },
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
  tabBadgeText: { fontSize: 11, fontWeight: '900', color: '#FFF' },

  cartoonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 3,
    borderColor: '#1E1B18',
    shadowColor: '#1E1B18',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    gap: 12,
  },
  cardHeading: { fontSize: 17, fontWeight: '900', color: '#1E1B18' },
  helperText: { fontSize: 13, color: '#5C554E', fontWeight: '600', lineHeight: 19 },
  cartoonInput: {
    backgroundColor: '#FAF6EC',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
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
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1E1B18',
  },
  catPillActive: {
    shadowColor: '#1E1B18',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  catPillText: { fontSize: 12, fontWeight: '800', color: '#1E1B18' },
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
  chunkyBtnText: { fontSize: 15, fontWeight: '900', color: '#1E1B18' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1E1B18' },
  totalTimeBadge: {
    fontSize: 12,
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
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  rankCol: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  arrowBtn: { padding: 2 },
  rankNumber: { fontSize: 14, fontWeight: '900', color: '#1E1B18' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1.5, borderColor: '#1E1B18' },
  miniTagText: { fontSize: 10, fontWeight: '900' },
  taskTitle: { fontSize: 16, fontWeight: '800', color: '#1E1B18' },
  timeAdjustRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  timeStepBtn: {
    backgroundColor: '#FAF6EC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1E1B18',
  },
  timeStepText: { fontSize: 12, fontWeight: '900', color: '#1E1B18' },
  timeReadout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD166',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1E1B18',
  },
  timeReadoutText: { fontSize: 12, fontWeight: '900', color: '#1E1B18' },

  // Timer screen
  timerScreenWrap: { flex: 1, padding: 20, justifyContent: 'space-between' },
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
  },
  smallExitText: { fontSize: 13, fontWeight: '800', color: '#1E1B18' },
  stepPill: {
    backgroundColor: '#FFD166',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1E1B18',
  },
  stepPillText: { fontSize: 13, fontWeight: '900', color: '#1E1B18' },
  timerMainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
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
  catBadgeLargeText: { fontSize: 12, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  activeTaskTitle: { fontSize: 22, fontWeight: '900', color: '#1E1B18', textAlign: 'center' },
  clockBox: {
    width: '100%',
    paddingVertical: 22,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#1E1B18',
    alignItems: 'center',
  },
  clockDigits: { fontSize: 64, fontWeight: '900', color: '#1E1B18', letterSpacing: -2 },
  modeSubtext: { fontSize: 13, fontWeight: '700', color: '#5C554E', textAlign: 'center' },
  timerControlsRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 4 },
  peekTriggerBtn: { marginTop: 4, paddingVertical: 6, paddingHorizontal: 12 },
  peekTriggerText: { fontSize: 12, fontWeight: '800', color: '#FF5A5F', textDecorationLine: 'underline' },
  upNextBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#1E1B18',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upNextLabel: { fontSize: 11, fontWeight: '900', color: '#8D847A' },
  upNextTitle: { fontSize: 13, fontWeight: '800', color: '#1E1B18', flex: 1 },
  doneWrap: { flex: 1, justifyContent: 'center', padding: 24 },

  // Granny (container is scaled up via GRANDMA_SCALE)
  grandmaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 60,
    zIndex: 50,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#1E1B18',
    marginBottom: 80,
    shadowColor: '#1E1B18',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    maxWidth: '86%',
  },
  speechText: { fontSize: 16, fontWeight: '900', color: '#1E1B18', textAlign: 'center' },
  speechTail: {
    position: 'absolute',
    bottom: -9,
    alignSelf: 'center',
    width: 14,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#1E1B18',
    transform: [{ rotate: '45deg' }],
  },
  grandmaContainer: { width: 170, height: 145, alignItems: 'center' },
  hairBun: {
    width: 44,
    height: 36,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    borderWidth: 3,
    borderColor: '#1E1B18',
    marginBottom: -12,
  },
  hairBase: {
    position: 'absolute',
    top: 22,
    width: 106,
    height: 76,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    borderWidth: 3,
    borderColor: '#1E1B18',
  },
  grandmaFace: {
    marginTop: 10,
    width: 84,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FCD5B5',
    borderWidth: 3,
    borderColor: '#1E1B18',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  browLeft: {
    position: 'absolute',
    top: 16,
    left: 14,
    width: 22,
    height: 4,
    backgroundColor: '#4B5563',
    borderRadius: 2,
    transform: [{ rotate: '18deg' }],
  },
  browRight: {
    position: 'absolute',
    top: 16,
    right: 14,
    width: 22,
    height: 4,
    backgroundColor: '#4B5563',
    borderRadius: 2,
    transform: [{ rotate: '-18deg' }],
  },
  glassesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  glassLens: {
    width: 26,
    height: 20,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#1E1B18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassBridge: { width: 6, height: 3, backgroundColor: '#1E1B18' },
  pupil: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#1E1B18' },
  grandmaMouth: {
    marginTop: 10,
    width: 22,
    height: 8,
    borderTopWidth: 3,
    borderColor: '#1E1B18',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cheek: {
    position: 'absolute',
    bottom: 18,
    width: 10,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#F87171',
    opacity: 0.6,
  },
  cardigan: {
    marginTop: -6,
    width: 120,
    height: 55,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: '#9B5DE5',
    borderWidth: 3,
    borderColor: '#1E1B18',
    alignItems: 'center',
    paddingTop: 8,
  },
  pearlsRow: { flexDirection: 'row', gap: 4 },
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
    right: 4,
    bottom: 10,
    alignItems: 'center',
    zIndex: 10,
  },
  spatulaHead: {
    width: 28,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#CBD5E1',
    borderWidth: 2.5,
    borderColor: '#1E1B18',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  spatulaSlot: { width: 16, height: 3, backgroundColor: '#1E1B18', borderRadius: 2 },
  spatulaHandle: {
    width: 8,
    height: 36,
    backgroundColor: '#B45309',
    borderWidth: 2,
    borderColor: '#1E1B18',
    marginTop: -2,
  },
  grandmaHand: {
    width: 22,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FCD5B5',
    borderWidth: 2.5,
    borderColor: '#1E1B18',
    marginTop: -18,
  },
});
