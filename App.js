// ==========================================
// FIXED MULTI-POSITION SPATULA GRANDMA
// ==========================================
function SpatulaGrandma({ visible, quote, positionConfig }) {
  const slideY = useRef(new Animated.Value(450)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const spatulaWiggle = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(0.5)).current;

  // Responsive safe offsets so she never clips the window edges
  const maxAllowedX = SCREEN_WIDTH * 0.32;
  const safeXOffset = positionConfig ? Math.max(-maxAllowedX, Math.min(maxAllowedX, positionConfig.xOffset)) : 0;

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
          toValue: safeXOffset,
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
        isSide && { bottom: SCREEN_HEIGHT * 0.22 },
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
